/** @import { CompiledTemplate, FragmentHelpers, HtmlSubstitution, HtmlTag, RenderOptions, TemplateStrings } from './html-types.js' */

import { createFragmentHelpers } from './fragment.js'
import { HtmlResult } from './html-result.js'
import { raw } from './raw.js'
import { renderResult } from './render.js'

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
 * @template {string} FragmentId
 * @param {RenderOptions<FragmentId> | string | undefined} options
 * @returns {RenderOptions<FragmentId>}
 */
function normalizeOptions (options) {
  if (typeof options === 'string') {
    return /** @type {RenderOptions<FragmentId>} */ ({ fragmentId: options })
  }
  return options ? { ...options } : {}
}

/**
 * @template {string} FragmentId
 * @param {RenderOptions<FragmentId>} options
 * @returns {HtmlTag<FragmentId>}
 */
function createBoundTag (options) {
  /**
   * @template {string} NextFragmentId
   * @param {TemplateStrings | RenderOptions<NextFragmentId> | string | undefined} strings
   * @param {...HtmlSubstitution<FragmentId>} substitutions
   */
  function tag (strings, ...substitutions) {
    if (!isTemplateStrings(strings)) {
      return createBoundTag(normalizeOptions(/** @type {RenderOptions<NextFragmentId> | string | undefined} */ strings))
    }

    return new HtmlResult(
      compileTemplate(strings),
      substitutions,
      options,
      renderResult
    )
  }

  const htmlTag = /** @type {HtmlTag<FragmentId>} */ (tag)

  htmlTag.fragment = /** @type {FragmentHelpers<FragmentId>} */ (/** @type {unknown} */ (fragment))
  htmlTag.raw = raw

  return htmlTag
}

/** @type {HtmlTag} */
export const html = createBoundTag({})
