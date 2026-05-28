import html, { createHtml, raw, render } from './index.js'

declare const safeText: string & { readonly __safeText: unique symbol }
declare const safeId: number & { readonly __safeId: unique symbol }

const h = createHtml({ fragmentId: 'content' })
const child = html`<span>${safeText}</span>`
const trusted = raw('<strong>trusted</strong>')
const readonlyValues = ['text', 1, 1n, false, null, undefined, child, trusted] as const

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
