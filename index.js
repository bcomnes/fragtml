import { html } from './lib/html.js'
import { raw } from './lib/raw.js'
import { render } from './lib/render.js'

const frag = html

export default html
export { frag, html, raw, render }
export { isFragmentBoundary } from './lib/fragment.js'
export { HtmlResult, isHtmlResult } from './lib/html-result.js'
export { RawHtml, isRawHtml } from './lib/raw.js'
export { DuplicateFragmentError, FragmentBoundaryError, FragmentNotFoundError } from './lib/render.js'
