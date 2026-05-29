# fragtml

[![latest version](https://img.shields.io/npm/v/fragtml.svg)](https://www.npmjs.com/package/fragtml)
[![Actions Status](https://github.com/bcomnes/fragtml/workflows/tests/badge.svg)](https://github.com/bcomnes/fragtml/actions)

[![downloads](https://img.shields.io/npm/dm/fragtml.svg)](https://npmtrends.com/fragtml)
![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Socket Badge](https://socket.dev/api/badge/npm/package/fragtml)](https://socket.dev/npm/package/fragtml)

A safe-by-default, string-generating HTML tagged template library with inline fragment support for server-rendered hypermedia apps.

`fragtml` is inspired by `common-tags` HTML formatting behavior and by htmx-style [template fragments](https://htmx.org/essays/template-fragments/). It lets you keep a full template and its partial update fragments together in one JavaScript template function.

The practical benefits of inline fragments are still being assessed against function-based composition. Fragments can reduce indirection in large templates by keeping related partial update targets in place, but they also increase type complexity compared with function-based partials.

## Install

```sh
npm install fragtml
```

## Basic usage

```js
import html, { render } from 'fragtml'

const name = '<Bret>'
const result = html`<p>Hello ${name}</p>`

render(result)
// '<p>Hello &lt;Bret&gt;</p>'
```

`html` returns an intermediate result object, not a primitive string. Use `render()` at route-handler boundaries:

```js
return render(html`<h1>${title}</h1>`)
```

The returned object also supports direct string coercion:

```js
const result = html`<p>${'Hello'}</p>`

String(result)
result.toString()
`${result}`
```

## Safe interpolation

Static template HTML is left as-is. Ordinary substitutions are escaped:

```js
render(html`<p>${'<script>alert(1)</script>'}</p>`)
// '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>'
```

The following non-printing values are omitted:

- `null`
- `undefined`
- booleans
- `NaN`

```js
render(html`<p>${null}${false}${Number.NaN}${0}</p>`)
// '<p>0</p>'
```

## Trusted raw HTML

Use `raw()` for trusted HTML that should not be escaped:

```js
import html, { raw, render } from 'fragtml'

render(html`<p>${raw('<strong>trusted</strong>')}</p>`)
// '<p><strong>trusted</strong></p>'
```

The tag also exposes the same helper as `.raw`:

```js
html.raw === raw

render(html`<p>${html.raw('<em>trusted</em>')}</p>`)
// '<p><em>trusted</em></p>'
```

Only pass trusted HTML to `raw()`. User input should be interpolated normally so it is escaped.

There is no public `unsafeHtml` tag in v1. Prefer local, explicit trust boundaries with `raw()`.

## Composition

Nested `html` results are treated as trusted `fragtml` output, while their own substitutions remain escaped:

```js
const button = html`<button>${'<Archive>'}</button>`

render(html`
  <div hx-target="this">
    ${button}
  </div>
`)
// '<div hx-target="this">\n  <button>&lt;Archive&gt;</button>\n</div>'
```

Nested results render in their own fragment scope. A parent template does not see fragment IDs declared by child templates; pass a `fragmentId` to the child template when you want the child to render one of its own fragments.

Arrays are inlined with indentation-aware formatting:

```js
const items = ['one', 'two'].map((item) => html`<li>${item}</li>`)

render(html`
  <ul>
    ${items}
  </ul>
`)
// '<ul>\n  <li>one</li>\n  <li>two</li>\n</ul>'
```

String substitutions containing newlines are split and aligned to the surrounding indentation.

## Boolean attributes

Use `?name=${condition}` to toggle boolean attributes. When the value is truthy, `fragtml` renders the bare attribute. When the value is falsey, it omits the attribute.

```js
render(html`<button ?disabled=${loading}>Save</button>`)
```

When `loading` is truthy:

```html
<button disabled>Save</button>
```

When `loading` is falsey:

```html
<button>Save</button>
```

This syntax is useful for native HTML boolean attributes such as `disabled`, `checked`, `selected`, `readonly`, `required`, `multiple`, `autofocus`, `hidden`, and `open`.

Only the unquoted form is supported:

```js
html`<button ?disabled=${loading}>Save</button>`
```

Quoted forms are intentionally unsupported in v1:

```js
html`<button ?disabled="${loading}">Save</button>`
html`<button ?disabled='${loading}'>Save</button>`
```

## Fragments

Fragments mark named ranges inside a larger template. Calling `html(fragmentId)` on that template renders either the full template or one selected fragment:

- `html()` / `html(undefined)` renders the full template.
- `html('archive-ui')` renders only the `archive-ui` fragment.
- `html({ fragmentId: 'archive-ui' })` is the options-object form.

This lets one view function serve both full-page requests and htmx-style fragment requests by passing the requested fragment ID through to `html(fragmentId)`.

This mirrors the htmx article’s idea:

```txt
#fragment archive-ui
  ...
#end
```

In `fragtml`, use boundary tokens:

```js
${html.fragment.start('archive-ui')}
...
${html.fragment.end}
```

### Example

```js
import html, { render } from 'fragtml'

function contactDetailTemplate ({ contact, fragmentId }) {
  return html(fragmentId)`
    <html>
      <body>
        <div hx-target="this">
          ${html.fragment.start('archive-ui')}
          ${contact.archived
            ? html`<button hx-patch="/contacts/${contact.id}/unarchive">Unarchive</button>`
            : html`<button hx-delete="/contacts/${contact.id}">Archive</button>`}
          ${html.fragment.end}
        </div>

        <h3>Contact</h3>
        <p>${contact.email}</p>
      </body>
    </html>
  `
}

export function contactDetail (args) {
  return render(contactDetailTemplate(args))
}
```

Render the whole page:

```js
contactDetail({ contact })
```

Render only the archive button fragment:

```js
contactDetail({ contact, fragmentId: 'archive-ui' })
```

Fragment boundary tokens are not included in either output.

If you want a simple local tag name for editor highlighting or repeated use, `frag` is an alias of `html`:

```js
import { frag, render } from 'fragtml'

function contactDetailTemplate ({ contact, fragmentId }) {
  const html = frag(fragmentId)

  return html`
    ${html.fragment.start('archive-ui')}
    <button>${contact.archived ? 'Unarchive' : 'Archive'}</button>
    ${html.fragment.end}
  `
}

export function contactDetail (args) {
  return render(contactDetailTemplate(args))
}
```

In TypeScript, you can use an explicit fragment-name union to type-check both incoming fragment IDs and declared fragment boundaries:

```ts
import { frag, render } from 'fragtml'
import type { RenderOptions } from 'fragtml/types.js'

type ContactFragment = 'archive-ui' | 'details'

function contactDetailTemplate ({
  contact,
  fragmentId
}: {
  contact: Contact
} & RenderOptions<ContactFragment>) {
  const html = frag<ContactFragment>(fragmentId)

  return html`
    ${html.fragment.start('archive-ui')}
    <button>${contact.archived ? 'Unarchive' : 'Archive'}</button>
    ${html.fragment.end}
  `
}

export function contactDetail (args: {
  contact: Contact
} & RenderOptions<ContactFragment>) {
  return render(contactDetailTemplate(args))
}
```

### Fragment context typing

Fragment markers keep the whole template in one expression. JavaScript evaluates every `${...}` substitution before `fragtml` selects a fragment, so the context type must cover the whole template even when a smaller fragment is requested. If different fragments need different fields, those fields usually have to be optional or otherwise guarded:

```ts
import { frag, render } from 'fragtml'
import type {
  FragmentTemplateTypes
} from 'fragtml/types.js'

type InnerPageContext = {
  text: string
}

type OuterPageContext = InnerPageContext & {
  title: string
}

type FullPageContext = OuterPageContext & {
  foo: string
}

type PageTemplate = FragmentTemplateTypes<{
  // Fragment IDs and their required context types.
  fragments: {
    inner: InnerPageContext
    outer: OuterPageContext
  }
  // Context required to render the full template.
  full: FullPageContext
}>

type PageFragment = PageTemplate['fragmentId']
// Resolves to:
// 'inner' | 'outer'

type PageArgs = PageTemplate['args']
// Resolves to:
// | { fragmentId: 'inner', context: InnerPageContext & Record<string, unknown> }
// | { fragmentId: 'outer', context: OuterPageContext & Record<string, unknown> }
// | { fragmentId?: undefined, context: FullPageContext & Record<string, unknown> }

type PageTemplateArgs = PageTemplate['templateArgs']
// Resolves to:
// {
//   fragmentId?: 'inner' | 'outer' | undefined
//   context: {
//     foo?: string
//     title?: string
//     text?: string
//   }
// }

function pageTemplate ({
  context,
  fragmentId
}: PageTemplateArgs) {
  const html = frag<PageFragment>(fragmentId)

  return html`
    <div>${context.foo}</div>

    ${html.fragment.start('outer')}
    <section>
      <h2>${context.title}</h2>

      ${html.fragment.start('inner')}
      <button>Inner update target</button>
      <div>${context.text}</div>
      ${html.fragment.end}
    </section>
    ${html.fragment.end}
  `
}

export function page (args: PageArgs) {
  return render(pageTemplate(args))
}

// These calls are still type-safe: PageArgs enforces the required context
// fields for each fragment target at the public call boundary.
page({
  fragmentId: 'inner',
  context: { text: 'Updated body text' }
})

page({
  fragmentId: 'outer',
  context: {
    // Extra already-loaded data is allowed.
    foo: 'Full page field',
    title: 'Outer fragment title',
    text: 'Updated body text'
  }
})

page({
  context: {
    foo: 'Full page field',
    title: 'Outer fragment title',
    text: 'Updated body text'
  }
})

// @ts-expect-error outer fragments require both title and text.
page({
  fragmentId: 'outer',
  context: { text: 'Missing the outer title' }
})
```

This pattern keeps one large template while hiding most of the type complexity in `FragmentTemplateTypes` and the small `page(args: PageArgs)` wrapper. The wrapper enforces the required fields for each fragment target, while `PageTemplateArgs` gives the shared template implementation a looser context type because every `${...}` expression is still evaluated before fragment selection.

If you want exact input types per render target, split the fragments into typed template functions and compose them without fragment markers. This also makes the smaller template functions reusable across multiple callsites or larger templates:

```ts
import html, { render } from 'fragtml'

type InnerContext = {
  text: string
}

type OuterContext = InnerContext & {
  title: string
}

type FullContext = OuterContext & {
  foo: string
}

export function inner (context: InnerContext) {
  return html`
    <button>Inner update target</button>
    <div>${context.text}</div>
  `
}

export function outer (context: OuterContext) {
  return html`
    <section>
      <h2>${context.title}</h2>
      ${inner(context)}
    </section>
  `
}

export function full (context: FullContext) {
  return html`
    <div>${context.foo}</div>
    ${outer(context)}
  `
}

render(inner({ text: 'Updated body text' }))

render(outer({
  title: 'Outer section title',
  text: 'Updated body text'
}))

render(full({
  foo: 'Full page field',
  title: 'Outer section title',
  text: 'Updated body text'
}))

// @ts-expect-error outer requires both title and text.
render(outer({ text: 'Missing the outer title' }))
```

Use fragments to preserve the structure of a larger template while still rendering named pieces of it.
Use function composition when those pieces need to be reused across multiple parent templates, similar to React components or partials in other template languages.

### Fragment context helpers

`FragmentTemplateTypes<Config>` bundles the public and internal types for one fragment-marked template:

```ts
type PageTemplate = FragmentTemplateTypes<{
  fragments: {
    inner: InnerPageContext
    outer: OuterPageContext
  }
  full: FullPageContext
}>

type PageArgs = PageTemplate['args']
type PageTemplateArgs = PageTemplate['templateArgs']
```

`fragments` maps fragment IDs to their required context types. `full` is the context required to render the full template.

`PageTemplate['args']` is the public call boundary that enforces the required fields for the selected render target. Extra context fields are allowed, so callers can pass already-loaded full-page data to smaller fragment renders. `PageTemplate['templateArgs']` is the looser implementation type for the shared template body; its `context` is an `OptionalMerge` of every render target context because the full template expression is evaluated before fragment selection.

`FragmentArgs<Fragments, FullContext>` builds the public argument union from a map of fragment contexts and the full-page context:

```ts
type PageArgs = FragmentArgs<{
  inner: InnerPageContext
  outer: OuterPageContext
}, FullPageContext>

// Equivalent to:
// | { fragmentId: 'inner', context: InnerPageContext & Record<string, unknown> }
// | { fragmentId: 'outer', context: OuterPageContext & Record<string, unknown> }
// | { fragmentId?: undefined, context: FullPageContext & Record<string, unknown> }
```

`FragmentTemplateArgs<Args>` derives the full argument type for the shared template implementation. `FragmentTemplateContext<Args>` derives only its looser `context` field. Both make fields from every render target optional:

```ts
type PageTemplateArgs = FragmentTemplateArgs<PageArgs>

// Equivalent to:
// {
//   fragmentId?: 'inner' | 'outer' | undefined
//   context: {
//     foo?: string
//     title?: string
//     text?: string
//   }
// }
```

`LooseContext<[FullContext, OuterContext, InnerContext]>` is a tuple helper for cases where you still want one context to stay required. Every tuple member is made optional except the last.

Lower-level helpers are also exported for advanced cases:

- `ContextOf<Args>` extracts the union of all `context` values from an argument union.
- `ContextForFragment<Args, FragmentId>` extracts the context for one fragment target.
- `FragmentIdOf<Args>` extracts the union of declared fragment IDs from an argument union.
- `KeysOfUnion<T>` extracts every property key from a union of object types.
- `Optional<T>` makes every property optional and flattens the resulting object shape.
- `OptionalMerge<T>` merges a union of object types with every property optional. Shared properties keep the union of their value types.
- `WithExtraContext<T>` requires the fields from `T` while allowing extra caller data on public fragment args.
- `UnionToIntersection<T>` and `Simplify<T>` are utility types used by the loose context helpers.

### Fragment rules

- Fragment IDs must be unique within a rendered template.
- Nested template results have their own fragment scope; parent templates do not select or conflict with child fragment IDs.
- Missing fragments throw `FragmentNotFoundError`.
- Duplicate fragment IDs throw `DuplicateFragmentError`.
- `html.fragment.end` without a matching start throws `FragmentBoundaryError`.
- An unclosed `html.fragment.start(id)` throws `FragmentBoundaryError`.

### Fragment antipatterns

Do not wrap the entire template in an outer fragment. Rendering without a `fragmentId` already renders the whole template, so a fragment that covers everything adds a fake target without changing the output.

Avoid:

```js
function pageTemplate ({ fragmentId }) {
  return html(fragmentId)`
    ${html.fragment.start('page')}
    <main>
      <h1>${title}</h1>
      <p>${body}</p>
    </main>
    ${html.fragment.end}
  `
}
```

Prefer:

```js
function pageTemplate ({ fragmentId }) {
  return html(fragmentId)`
    <main>
      <h1>${title}</h1>
      <p>${body}</p>
    </main>
  `
}
```

Only mark fragments that represent real partial update targets inside the full template.

## Nested fragments

Nested fragments are supported with stack semantics. This is useful when a larger region can be re-rendered as a whole, but a smaller region inside it is also a valid htmx update target. A single template can contain multiple independent nested fragment groups, each with its own root fragment.

```js
import html, { render } from 'fragtml'

function pageTemplate ({ fragmentId }) {
  return html(fragmentId)`
    ${html.fragment.start('profile')}
    <section>
      <h2>Profile</h2>

      ${html.fragment.start('profile-actions')}
      <button>Edit profile</button>
      ${html.fragment.end}
    </section>
    ${html.fragment.end}

    ${html.fragment.start('activity')}
    <section>
      <h2>Activity</h2>

      ${html.fragment.start('activity-row')}
      <article>Recent activity</article>
      ${html.fragment.end}
    </section>
    ${html.fragment.end}
  `
}

export function page (args) {
  return render(pageTemplate(args))
}
```

Rendering a root fragment includes its nested fragment content:

```js
page({ fragmentId: 'profile' })
// '<section>\n  <h2>Profile</h2>\n\n  <button>Edit profile</button>\n</section>'

page({ fragmentId: 'activity' })
// '<section>\n  <h2>Activity</h2>\n\n  <article>Recent activity</article>\n</section>'
```

Rendering a nested fragment returns only that nested fragment:

```js
page({ fragmentId: 'profile-actions' })
// '<button>Edit profile</button>'

page({ fragmentId: 'activity-row' })
// '<article>Recent activity</article>'
```

Use nested fragments sparingly. Prefer flat fragments unless you actually need both a parent region and a child region as independently renderable update targets.

## API

### `html`

Safe-by-default template tag.

```js
html`<p>${value}</p>`
```

Pass a fragment ID before the tagged template to render a selected fragment from that template:

```js
html('name')`...`
html({ fragmentId: 'name' })`...`
```

### `frag`

Alias of `html`, useful when you want a local tag name for editor highlighting or repeated use:

```js
import { frag } from 'fragtml'

const html = frag(fragmentId)
```

### `render(value)`

Converts a `fragtml` result to a primitive string.

```js
render(html`<p>${value}</p>`)
```

### `raw(value)` / `html.raw(value)`

Marks trusted HTML so it is inserted without escaping.

```js
html`<p>${raw('<strong>trusted</strong>')}</p>`
```

### `HtmlResult`

Class returned by `html` and `frag` tagged templates.

```js
import html, { HtmlResult } from 'fragtml'

const result = html`<p>Hello</p>`

result instanceof HtmlResult
```

### `RawHtml`

Class returned by `raw(value)` and `html.raw(value)`.

```js
import { RawHtml, raw } from 'fragtml'

const trusted = raw('<strong>trusted</strong>')

trusted instanceof RawHtml
```

### Type guards

Use the public type guards to narrow unknown values without importing from internal `lib/` paths:

```js
import {
  isFragmentBoundary,
  isHtmlResult,
  isRawHtml
} from 'fragtml'
```

### Boolean attributes

Use unquoted `?name=${condition}` syntax to toggle a boolean attribute.

```js
html`<button ?disabled=${loading}>Save</button>`
```

### `html.fragment.start(id)`

Starts a named fragment range.

```js
${html.fragment.start('archive-ui')}
```

### `html.fragment.end`

Ends the most recently opened fragment range.

```js
${html.fragment.end}
```

### Error classes

```js
import {
  DuplicateFragmentError,
  FragmentBoundaryError,
  FragmentNotFoundError
} from 'fragtml'
```

## TypeScript

`fragtml` is written in typed JavaScript and ships generated declaration files.

Runtime classes such as `HtmlResult` and `RawHtml` are exported from the package root. Type-only aliases are exported from `fragtml/types.js`:

```ts
import type {
  FragmentBoundary,
  FragmentEndBoundary,
  FragmentHelpers,
  FragmentIdOf,
  FragmentStartBoundary,
  ContextForFragment,
  ContextOf,
  FragmentArgs,
  FragmentTemplateArgs,
  HtmlArrayScalarSubstitution,
  HtmlArraySubstitution,
  HtmlPrimitiveSubstitution,
  HtmlSubstitution,
  HtmlTag,
  FragmentTemplateContext,
  FragmentTemplateTypes,
  KeysOfUnion,
  LooseContext,
  Optional,
  OptionalMerge,
  RawHtml,
  RenderOptions,
  Simplify,
  TemplateStrings,
  UnionToIntersection,
  WithExtraContext
} from 'fragtml/types.js'
```

`HtmlResult` is both a runtime class from the package root and an importable type from `fragtml/types.js`:

```ts
import { HtmlResult } from 'fragtml'
import type { HtmlResult as HtmlResultType } from 'fragtml/types.js'

function sendHtml (result: HtmlResultType) {
  return result.toString()
}

function isHtmlResultValue (value: unknown): value is HtmlResultType {
  return value instanceof HtmlResult
}
```

## License

MIT
