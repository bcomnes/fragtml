import { html } from './lib/html.js'
import { raw } from './lib/raw.js'
import { render } from './lib/render.js'

const createHtml = html

export default html
export { createHtml, html, raw, render }
export { DuplicateFragmentError, FragmentBoundaryError, FragmentNotFoundError } from './lib/render.js'
