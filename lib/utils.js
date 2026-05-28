/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isNonPrintingValue (value) {
  return value == null || typeof value === 'boolean' || (typeof value === 'number' && Number.isNaN(value))
}

/**
 * @param {string} value
 * @returns {string}
 */
export function stripLastNewLine (value) {
  return value.replace(/\n$/, '')
}
