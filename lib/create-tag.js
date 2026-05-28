/** @import { FragmentHelpers } from './fragment.js' */
/** @import { HtmlSubstitution, TemplateStrings } from './html-types.js' */
/** @import { RawHtml } from './raw.js' */

import { createFragmentHelpers } from './fragment.js'
import { HtmlResult } from './html-result.js'
import { raw } from './raw.js'
import { renderResult } from './render.js'

/**
 * @typedef {object} RenderOptions
 * @property {string | undefined} [fragmentId]
 */

/**
 * @typedef {object} CompiledTemplate
 * @property {readonly string[]} strings
 */

/** @type {WeakMap<TemplateStringsArray | readonly string[], CompiledTemplate>} */
const templateCache = new WeakMap()
const fragment = createFragmentHelpers()

/**
 * @param {TemplateStringsArray | readonly string[]} strings
 * @returns {CompiledTemplate}
 */
function compileTemplate (strings) {
  const cached = templateCache.get(strings)

  if (cached) return cached

  const compiled = { strings: Array.from(strings) }
  templateCache.set(strings, compiled)
  return compiled
}

/**
 * @param {unknown} value
 * @returns {value is TemplateStringsArray | readonly string[]}
 */
function isTemplateStrings (value) {
  return Array.isArray(value)
}

/**
 * @param {RenderOptions | string | undefined} options
 * @returns {RenderOptions}
 */
function normalizeOptions (options) {
  if (typeof options === 'string') return { fragmentId: options }
  return options ? { ...options } : {}
}

/**
 * @param {RenderOptions} options
 * @returns {HtmlTag}
 */
function createBoundTag (options) {
  /**
   * @param {TemplateStrings | RenderOptions | string | undefined} strings
   * @param {...HtmlSubstitution} substitutions
   */
  function tag (strings, ...substitutions) {
    if (!isTemplateStrings(strings)) {
      return createBoundTag(normalizeOptions(/** @type {RenderOptions | string | undefined} */ strings))
    }

    return new HtmlResult(
      compileTemplate(strings),
      substitutions,
      options,
      renderResult
    )
  }

  const htmlTag = /** @type {HtmlTag} */ (tag)

  htmlTag.fragment = fragment
  htmlTag.raw = raw

  return htmlTag
}

/** @type {HtmlTag} */
export const html = createBoundTag({})

/**
 * @typedef {((strings: TemplateStrings, ...substitutions: HtmlSubstitution[]) => HtmlResult) & ((options?: RenderOptions | string) => HtmlTag) & { fragment: FragmentHelpers, raw: (value: unknown) => RawHtml }} HtmlTag
 */
