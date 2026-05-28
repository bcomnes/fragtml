const htmlEscapes = /[&<>"'`]/g

/**
 * Escapes text for safe HTML interpolation.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml (value) {
  return String(value).replace(htmlEscapes, (character) => {
    switch (character) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      case "'": return '&#x27;'
      case '`': return '&#x60;'
      default: return character
    }
  })
}
