export const rawHtmlSymbol = Symbol('fragtml.rawHtml')

export class RawHtml {
  /**
   * @param {unknown} value
   */
  constructor (value) {
    this[rawHtmlSymbol] = true
    this.value = value
  }

  toString () {
    return String(this.value)
  }

  valueOf () {
    return String(this.value)
  }

  [Symbol.toPrimitive] () {
    return String(this.value)
  }
}

/**
 * Marks a value as trusted HTML so it is inserted without escaping.
 *
 * @param {unknown} value
 * @returns {RawHtml}
 */
export function raw (value) {
  return new RawHtml(value)
}

/**
 * @param {unknown} value
 * @returns {value is RawHtml}
 */
export function isRawHtml (value) {
  return value instanceof RawHtml || !!(
    value &&
    typeof value === 'object' &&
    /** @type {Record<symbol, unknown>} */(value)[rawHtmlSymbol] === true
  )
}
