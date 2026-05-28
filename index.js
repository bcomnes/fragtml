import { html } from './lib/html.js'
import { raw } from './lib/raw.js'
import { render } from './lib/render.js'

/**
 * @typedef {import('./lib/create-tag.js').HtmlTag} HtmlTag
 * @typedef {import('./lib/create-tag.js').RenderOptions} RenderOptions
 * @typedef {import('./lib/fragment.js').FragmentBoundary} FragmentBoundary
 * @typedef {import('./lib/fragment.js').FragmentEndBoundary} FragmentEndBoundary
 * @typedef {import('./lib/fragment.js').FragmentHelpers} FragmentHelpers
 * @typedef {import('./lib/fragment.js').FragmentStartBoundary} FragmentStartBoundary
 * @typedef {import('./lib/html-types.js').HtmlArrayScalarSubstitution} HtmlArrayScalarSubstitution
 * @typedef {import('./lib/html-types.js').HtmlArraySubstitution} HtmlArraySubstitution
 * @typedef {import('./lib/html-types.js').HtmlPrimitiveSubstitution} HtmlPrimitiveSubstitution
 * @typedef {import('./lib/html-types.js').HtmlSubstitution} HtmlSubstitution
 * @typedef {import('./lib/html-types.js').TemplateStrings} TemplateStrings
 */

const frag = html

export default html
export { frag, html, raw, render }
export { isFragmentBoundary } from './lib/fragment.js'
export { HtmlResult, isHtmlResult } from './lib/html-result.js'
export { RawHtml, isRawHtml } from './lib/raw.js'
export { DuplicateFragmentError, FragmentBoundaryError, FragmentNotFoundError } from './lib/render.js'
