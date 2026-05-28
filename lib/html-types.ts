// Type exports only. Do not add runtime implementations to this module.
import type { FragmentBoundary } from './fragment.js'
import type { HtmlResult } from './html-result.js'
import type { RawHtml } from './raw.js'

export type HtmlPrimitiveSubstitution = string | number | bigint | boolean | null | undefined
export type HtmlArrayScalarSubstitution = HtmlPrimitiveSubstitution | HtmlResult | RawHtml
export type HtmlArraySubstitution = HtmlArrayScalarSubstitution | readonly HtmlArraySubstitution[]
export type HtmlSubstitution = HtmlArraySubstitution | FragmentBoundary
export type TemplateStrings = TemplateStringsArray | readonly string[]
