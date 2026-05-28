/**
 * @typedef {{ [fragmentBoundarySymbol]: true, kind: 'start', id: string }} FragmentStartBoundary
 * @typedef {{ [fragmentBoundarySymbol]: true, kind: 'end' }} FragmentEndBoundary
 * @typedef {FragmentStartBoundary | FragmentEndBoundary} FragmentBoundary
 * @typedef {{ start: typeof start, end: FragmentEndBoundary }} FragmentHelpers
 */

export const fragmentBoundarySymbol = Symbol('fragtml.fragmentBoundary')

const end = Object.freeze(/** @type {FragmentEndBoundary} */ ({
  [fragmentBoundarySymbol]: true,
  kind: 'end'
}))

/**
 * @param {string} id
 * @returns {FragmentStartBoundary}
 */
function start (id) {
  if (typeof id !== 'string' || id.length === 0) {
    throw new TypeError('fragment.start(id) requires a non-empty string id')
  }

  return {
    [fragmentBoundarySymbol]: true,
    kind: 'start',
    id
  }
}

/**
 * @returns {FragmentHelpers}
 */
export function createFragmentHelpers () {
  return Object.freeze({ start, end })
}

/**
 * @param {unknown} value
 * @returns {value is FragmentBoundary}
 */
export function isFragmentBoundary (value) {
  return !!(
    value &&
    typeof value === 'object' &&
    /** @type {Record<symbol, unknown>} */(value)[fragmentBoundarySymbol] === true
  )
}
