/** @import { CompiledTemplate, HtmlSubstitution, RenderOptions } from './html-types.js' */

export const htmlResultSymbol = Symbol('fragtml.htmlResult')

export class HtmlResult {
  /**
   * @param {CompiledTemplate} compiled
   * @param {HtmlSubstitution[]} substitutions
   * @param {RenderOptions} options
   * @param {(result: HtmlResult) => string} render
   */
  constructor (compiled, substitutions, options, render) {
    this[htmlResultSymbol] = true
    this.compiled = compiled
    this.substitutions = substitutions
    this.options = options
    this.render = render
  }

  toString () {
    return this.render(this)
  }

  valueOf () {
    return this.render(this)
  }

  [Symbol.toPrimitive] () {
    return this.render(this)
  }
}

/**
 * @param {unknown} value
 * @returns {value is HtmlResult}
 */
export function isHtmlResult (value) {
  return value instanceof HtmlResult || !!(
    value &&
    typeof value === 'object' &&
    /** @type {Record<symbol, unknown>} */(value)[htmlResultSymbol] === true
  )
}
