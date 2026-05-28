// Type exports only. Do not add runtime implementations to this module.
import type { HtmlResult } from './html-result.js'
import type { RawHtml } from './raw.js'

export type FragmentStartBoundary<FragmentId extends string = string> = {
  readonly kind: 'start'
  readonly id: FragmentId
}
export type FragmentEndBoundary = {
  readonly kind: 'end'
}
export type FragmentBoundary<FragmentId extends string = string> =
  FragmentStartBoundary<FragmentId> | FragmentEndBoundary
export type FragmentHelpers<FragmentId extends string = string> = {
  start: (id: FragmentId) => FragmentStartBoundary<FragmentId>
  end: FragmentEndBoundary
}

export type RenderOptions<FragmentId extends string = string> = {
  fragmentId?: FragmentId | undefined
}

export type CompiledTemplate = {
  strings: readonly string[]
}

export type HtmlPrimitiveSubstitution = string | number | bigint | boolean | null | undefined
export type HtmlArrayScalarSubstitution = HtmlPrimitiveSubstitution | HtmlResult | RawHtml
export type HtmlArraySubstitution =
  HtmlArrayScalarSubstitution | readonly HtmlArraySubstitution[]
export type HtmlSubstitution<FragmentId extends string = string> =
  HtmlArraySubstitution | FragmentBoundary<FragmentId>
export type TemplateStrings = TemplateStringsArray | readonly string[]
export type HtmlTag<FragmentId extends string = string> =
  ((strings: TemplateStrings, ...substitutions: HtmlSubstitution<FragmentId>[]) => HtmlResult) &
  (<NextFragmentId extends string = string>(
    options?: RenderOptions<NextFragmentId> | string
  ) => HtmlTag<NextFragmentId>) & {
    fragment: FragmentHelpers<FragmentId>
    raw: (value: unknown) => RawHtml
  }
