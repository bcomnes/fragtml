/** @import { FragmentEndBoundary, FragmentHelpers, FragmentStartBoundary } from './html-types.js' */

export const fragmentBoundarySymbol = Symbol('fragtml.fragmentBoundary')

const end = Object.freeze(/** @type {FragmentEndBoundary} */ ({
  [fragmentBoundarySymbol]: true,
  kind: 'end'
}))

/**
 * @template {string} FragmentId
 * @param {FragmentId} id
 * @returns {FragmentStartBoundary<FragmentId>}
 */
function start (id) {
  if (typeof id !== 'string' || id.length === 0) {
    throw new TypeError('fragment.start(id) requires a non-empty string id')
  }

  const boundary = {
    [fragmentBoundarySymbol]: true,
    kind: 'start',
    id
  }

  return /** @type {FragmentStartBoundary<FragmentId>} */ (boundary)
}

/**
 * @template {string} [FragmentId=string]
 * @returns {FragmentHelpers<FragmentId>}
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
