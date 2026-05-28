import html, { frag, raw, render } from './index.js'
import type {
  FragmentBoundary,
  FragmentEndBoundary,
  FragmentHelpers,
  FragmentStartBoundary,
  HtmlArrayScalarSubstitution,
  HtmlArraySubstitution,
  HtmlPrimitiveSubstitution,
  HtmlResult,
  HtmlSubstitution,
  HtmlTag,
  RawHtml,
  RenderOptions,
  TemplateStrings
} from './types.js'

declare const safeText: string & { readonly __safeText: unique symbol }
declare const safeId: number & { readonly __safeId: unique symbol }

type ContentFragment = 'content'

const h = frag<ContentFragment>({ fragmentId: 'content' })
const child = html`<span>${safeText}</span>`
const trusted = raw('<strong>trusted</strong>')
const readonlyValues = ['text', 1, 1n, false, null, undefined, child, trusted] as const
const typedPrimitiveSubstitution: HtmlPrimitiveSubstitution = safeText
const typedArrayScalarSubstitution: HtmlArrayScalarSubstitution = child
const typedArraySubstitution: HtmlArraySubstitution = readonlyValues
const typedResult: HtmlResult = h`<span>${safeText}</span>`
const typedRaw: RawHtml = trusted
const typedSubstitution: HtmlSubstitution<ContentFragment> = child
const typedTag: HtmlTag<ContentFragment> = h
const typedOptions: RenderOptions<ContentFragment> = { fragmentId: 'content' }
const typedBoundary: FragmentBoundary<ContentFragment> = h.fragment.start('content')
const typedStartBoundary: FragmentStartBoundary<ContentFragment> = h.fragment.start('content')
const typedEndBoundary: FragmentEndBoundary = h.fragment.end
const typedFragmentHelpers: FragmentHelpers<ContentFragment> = h.fragment
const typedTemplateStrings: TemplateStrings = [''] as const

void typedPrimitiveSubstitution
void typedArrayScalarSubstitution
void typedArraySubstitution
void typedResult
void typedRaw
void typedSubstitution
void typedTag
void typedOptions
void typedBoundary
void typedStartBoundary
void typedEndBoundary
void typedFragmentHelpers
void typedTemplateStrings

html`${'text'}${1}${1n}${true}${false}${null}${undefined}${Number.NaN}`
html`${safeText}${safeId}`
html`${child}${trusted}`
html`${readonlyValues}`
html`${['text', 1, 1n, false, null, undefined, child, trusted]}`
html`${[['nested'], [child, trusted]]}`
html`${h.fragment.start('content')}content${h.fragment.end}`

render(html`<p>${safeText}</p>`)

// @ts-expect-error unknown values must be narrowed before interpolation.
html`${'text' as unknown}`

// @ts-expect-error ordinary objects are not valid substitutions.
html`${{ value: 'text' }}`

// @ts-expect-error objects with toString are still ordinary objects.
html`${{ toString: () => 'text' }}`

// @ts-expect-error symbols cannot be rendered safely.
html`${Symbol('text')}`

// @ts-expect-error functions cannot be rendered safely.
html`${() => 'text'}`

// @ts-expect-error promises cannot be rendered safely.
html`${Promise.resolve('text')}`

// @ts-expect-error arrays enforce the same substitution rules.
html`${[{ value: 'text' }]}`

// @ts-expect-error fragment boundaries only work as direct substitutions.
html`${[h.fragment.start('content'), h.fragment.end]}`

// @ts-expect-error typed fragment tags only allow declared fragment names.
h.fragment.start('other')
