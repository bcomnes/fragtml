/** @import { RenderPart } from './render-buffer.js' */
import { RenderBuffer } from './render-buffer.js'

/**
 * Dedent template text without examining or modifying finished child content.
 * A content part occupies one position in the parent's template, regardless of
 * how many lines it contains. There are no placeholders to escape or restore.
 *
 * @param {RenderPart[]} parts
 * @returns {string}
 */
export function stripIndent (parts) {
  /** @type {{ buffer: RenderBuffer, ending: string }[]} */
  const lines = []
  let line = { buffer: new RenderBuffer(), ending: '' }
  lines.push(line)
  for (const part of parts) {
    if (typeof part !== 'string') {
      line.buffer.append(part)
      continue
    }
    for (const [index, text] of part.split(/(\r?\n)/).entries()) {
      if (index % 2) {
        line.ending = text
        line = { buffer: new RenderBuffer(), ending: '' }
        lines.push(line)
      } else {
        line.buffer.append(text)
      }
    }
  }

  // These strings are used only to measure the parent's whitespace. Child
  // content counts as non-whitespace but is never put through string cleanup.
  const layoutText = lines.map(({ buffer }) => buffer.parts.map(part => typeof part === 'string' ? part : 'x').join(''))
  if (lines.length > 1 && /^[ \t]*$/.test(layoutText[0] ?? '')) {
    lines.shift()
    layoutText.shift()
  }
  if (lines.length > 1 && /^[ \t]*$/.test(layoutText.at(-1) ?? '')) {
    lines.pop()
    layoutText.pop()
    const last = lines.at(-1)
    if (last) last.ending = ''
  }

  let minIndent = Infinity

  for (const text of layoutText) {
    if (text.trim() === '') continue
    const indent = text.match(/^[ \t]*/)?.[0].length ?? 0
    minIndent = Math.min(minIndent, indent)
  }

  const dedent = Number.isFinite(minIndent) && minIndent > 0
  return lines.map(({ buffer, ending }, index) => {
    if (dedent) {
      if (layoutText[index]?.trim() === '') return ending ? '\n' : ''
      const first = buffer.parts[0]
      if (typeof first === 'string') buffer.parts[0] = first.slice(minIndent)
    }
    return buffer.parts.map(part => typeof part === 'string' ? part : part.content).join('') +
      (dedent && ending ? '\n' : ending)
  }).join('')
}
