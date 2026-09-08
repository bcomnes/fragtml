/** @import { HtmlResult } from './html-result.js' */
/** @import { RenderPart } from './render-buffer.js' */

import { escapeHtml } from './escape-html.js'
import { isFragmentBoundary } from './fragment.js'
import { isHtmlResult } from './html-result.js'
import { inlineArray } from './inline-array.js'
import { isRawHtml } from './raw.js'
import { RenderBuffer } from './render-buffer.js'
import { stripIndent } from './strip-indent.js'
import { isNonPrintingValue } from './utils.js'

const booleanAttributeSuffix = /(^|\s)\?([A-Za-z_:][A-Za-z0-9_:.-]*)=$/

export class FragmentNotFoundError extends Error {
  /**
   * @param {string} id
   */
  constructor (id) {
    super(`Fragment not found: ${id}`)
    this.name = 'FragmentNotFoundError'
    this.fragmentId = id
  }
}

export class DuplicateFragmentError extends Error {
  /**
   * @param {string} id
   */
  constructor (id) {
    super(`Duplicate fragment: ${id}`)
    this.name = 'DuplicateFragmentError'
    this.fragmentId = id
  }
}

export class FragmentBoundaryError extends Error {
  /**
   * @param {string} message
   */
  constructor (message) {
    super(message)
    this.name = 'FragmentBoundaryError'
  }
}

class RenderContext {
  /**
   * @param {string | undefined} fragmentId
   */
  constructor (fragmentId) {
    this.fragmentId = fragmentId
    this.full = new RenderBuffer()
    /** @type {{ id: string, content: RenderBuffer }[]} */
    this.stack = []
    /** @type {Map<string, RenderBuffer>} */
    this.fragments = new Map()
    /** @type {Set<string>} */
    this.seen = new Set()
  }

  /**
   * @param {RenderPart} value
   */
  append (value) {
    this.full.append(value)

    for (const fragment of this.stack) {
      fragment.content.append(value)
    }
  }

  trimTrailingLineWhitespace () {
    this.full.transformTrailingText(trimTrailingLineWhitespace)

    for (const fragment of this.stack) {
      fragment.content.transformTrailingText(trimTrailingLineWhitespace)
    }
  }

  /**
   * @param {unknown} value
   * @returns {boolean}
   */
  consumeBooleanAttribute (value) {
    const match = this.full.trailingText.match(booleanAttributeSuffix)

    if (!match) return false

    const prefix = match[1] ?? ''
    const name = match[2] ?? ''
    const replacement = value ? `${prefix}${name}` : ''

    this.full.transformTrailingText(text => replaceBooleanAttributeSuffix(text, replacement))

    for (const fragment of this.stack) {
      fragment.content.transformTrailingText(text => replaceBooleanAttributeSuffix(text, replacement))
    }

    return true
  }

  /**
   * @param {string} id
   */
  startFragment (id) {
    if (this.seen.has(id)) {
      throw new DuplicateFragmentError(id)
    }

    this.seen.add(id)
    this.stack.push({ id, content: new RenderBuffer() })
  }

  endFragment () {
    const fragment = this.stack.pop()

    if (!fragment) {
      throw new FragmentBoundaryError('Unexpected fragment end with no open fragment')
    }

    this.fragments.set(fragment.id, fragment.content)
  }

  finish () {
    if (this.stack.length > 0) {
      const open = this.stack.at(-1)
      throw new FragmentBoundaryError(`Unclosed fragment: ${open?.id}`)
    }

    if (this.fragmentId) {
      const fragment = this.fragments.get(this.fragmentId)

      if (fragment == null) {
        throw new FragmentNotFoundError(this.fragmentId)
      }

      return stripIndent(fragment.parts)
    }

    return stripIndent(this.full.parts)
  }
}

/**
 * Converts a renderable value to a primitive string.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function render (value) {
  if (isHtmlResult(value)) return renderResult(value)
  if (isRawHtml(value)) return String(value)
  if (Array.isArray(value)) return value.map(render).join('')
  if (isNonPrintingValue(value)) return ''
  return escapeHtml(value)
}

/**
 * @param {HtmlResult} result
 * @returns {string}
 */
export function renderResult (result) {
  const context = new RenderContext(result.options.fragmentId)
  renderResultInto(result, context)
  return context.finish()
}

/**
 * @param {HtmlResult} result
 * @param {RenderContext} context
 */
function renderResultInto (result, context) {
  const { strings } = result.compiled
  const { substitutions } = result

  context.append(strings[0] ?? '')

  for (let index = 0; index < substitutions.length; index++) {
    const substitution = substitutions[index]
    const nextString = strings[index + 1] ?? ''

    if (isFragmentBoundary(substitution)) {
      context.trimTrailingLineWhitespace()
      appendSubstitution(context, substitution)
      context.append(stripLeadingBoundaryLineWhitespace(nextString))
    } else {
      appendSubstitution(context, substitution)
      context.append(nextString)
    }
  }
}

/**
 * @param {RenderContext} context
 * @param {unknown} value
 */
function appendSubstitution (context, value) {
  if (isFragmentBoundary(value)) {
    if (value.kind === 'start') context.startFragment(value.id)
    else context.endFragment()
    return
  }

  if (context.consumeBooleanAttribute(value)) {
    return
  }

  for (const part of renderSubstitution(value, context.full.trailingText)) {
    context.append(part)
  }
}

/**
 * @param {unknown} value
 * @param {string} resultSoFar
 * @returns {RenderPart[]}
 */
function renderSubstitution (value, resultSoFar) {
  if (isNonPrintingValue(value)) return []
  if (isRawHtml(value) || isHtmlResult(value)) {
    const content = isRawHtml(value) ? String(value) : renderResult(value)
    return content ? [{ content }] : []
  }

  if (Array.isArray(value)) {
    const indentation = resultSoFar.match(/(?:\n)([^\S\n]+)$/)?.[1]
    const separator = indentation ? `\n${indentation}` : ' '
    return value
      .filter((part) => !isNonPrintingValue(part))
      .flatMap((part, index) => [
        ...(index ? [separator] : []),
        ...renderSubstitution(part, resultSoFar)
      ])
  }

  if (typeof value === 'string' && value.includes('\n')) {
    return [inlineArray(resultSoFar, value.split('\n').map(escapeHtml))]
  }

  return [escapeHtml(value)]
}

/**
 * @param {string} value
 * @returns {string}
 */
function trimTrailingLineWhitespace (value) {
  return value.replace(/[ \t]*$/, '')
}

/**
 * @param {string} value
 * @param {string} replacement
 * @returns {string}
 */
function replaceBooleanAttributeSuffix (value, replacement) {
  return value.replace(booleanAttributeSuffix, replacement)
}

/**
 * @param {string} value
 * @returns {string}
 */
function stripLeadingBoundaryLineWhitespace (value) {
  return value.replace(/^\r?\n/, '')
}
