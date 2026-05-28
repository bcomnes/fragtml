/**
 * Smart trims and strips the shared indentation from a template result.
 *
 * @param {string} value
 * @returns {string}
 */
export function stripIndent (value) {
  const trimmed = value
    .replace(/^[ \t]*\r?\n/, '')
    .replace(/\r?\n[ \t]*$/, '')

  const lines = trimmed.split(/\r?\n/)
  let minIndent = Infinity

  for (const line of lines) {
    if (line.trim() === '') continue
    const indent = line.match(/^[ \t]*/)?.[0].length ?? 0
    minIndent = Math.min(minIndent, indent)
  }

  if (!Number.isFinite(minIndent) || minIndent === 0) return trimmed

  return lines
    .map((line) => line.trim() === '' ? '' : line.slice(minIndent))
    .join('\n')
}
