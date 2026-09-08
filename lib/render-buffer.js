/**
 * Literal text participates in template formatting. Content is already rendered
 * and must not be split, indented, or trimmed by its parent.
 *
 * @typedef {string | { content: string }} RenderPart
 */

export class RenderBuffer {
  constructor () {
    /** @type {RenderPart[]} */
    this.parts = []
  }

  /** @param {RenderPart} part */
  append (part) {
    const last = this.parts.at(-1)
    if (typeof part === 'string' && typeof last === 'string') {
      this.parts[this.parts.length - 1] = last + part
    } else {
      this.parts.push(part)
    }
  }

  get trailingText () {
    const last = this.parts.at(-1)
    return typeof last === 'string' ? last : ''
  }

  /** @param {(text: string) => string} transform */
  transformTrailingText (transform) {
    if (typeof this.parts.at(-1) === 'string') {
      this.parts[this.parts.length - 1] = transform(this.trailingText)
    }
  }
}
