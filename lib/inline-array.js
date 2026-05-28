import { stripLastNewLine } from './utils.js'

/**
 * @param {string} resultSoFar
 * @param {string[]} parts
 * @returns {string}
 */
export function inlineArray (resultSoFar, parts) {
  const indentation = resultSoFar.match(/(?:\n)([^\S\n]+)$/)

  return parts.reduce((result, part, index) => {
    const isFirstPart = index === 0
    const strippedPart = stripLastNewLine(part)

    return ''.concat(
      result,
      isFirstPart ? '' : indentation ? '\n' : ' ',
      indentation
        ? prefixLines(indentation[1] ?? '', strippedPart, isFirstPart)
        : strippedPart
    )
  }, '')
}

/**
 * @param {string} prefix
 * @param {string} value
 * @param {boolean} skipFirst
 * @returns {string}
 */
function prefixLines (prefix, value, skipFirst) {
  return value
    .split('\n')
    .map((line, index) => skipFirst && index === 0 ? line : `${prefix}${line}`)
    .join('\n')
}
