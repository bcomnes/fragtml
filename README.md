# fragtml

[![latest version](https://img.shields.io/npm/v/fragtml.svg)](https://www.npmjs.com/package/fragtml)
[![Actions Status](https://github.com/bcomnes/fragtml/workflows/tests/badge.svg)](https://github.com/bcomnes/fragtml/actions)

[![downloads](https://img.shields.io/npm/dm/fragtml.svg)](https://npmtrends.com/fragtml)
![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Socket Badge](https://socket.dev/api/badge/npm/package/fragtml)](https://socket.dev/npm/package/fragtml)

A safe-by-default, string-generating HTML tagged template library with inline fragment support for server-rendered hypermedia apps.

`fragtml` is inspired by `common-tags` HTML formatting behavior and by htmx-style [template fragments](https://htmx.org/essays/template-fragments/). It lets you keep a full template and its partial update fragments together in one JavaScript template function.

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

export function contactDetail ({ contact, fragmentId }) {
  return render(html(fragmentId)`
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
  `)
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

export function contactDetail ({ contact, fragmentId }) {
  const html = frag(fragmentId)

  return render(html`
    ${html.fragment.start('archive-ui')}
    <button>${contact.archived ? 'Unarchive' : 'Archive'}</button>
    ${html.fragment.end}
  `)
}
```

In TypeScript, you can use an explicit fragment-name union to type-check both incoming fragment IDs and declared fragment boundaries:

```ts
import { frag, render } from 'fragtml'
import type { RenderOptions } from 'fragtml/types.js'

const contactFragments = {
  archiveUi: 'archive-ui',
  details: 'details'
} as const

type ContactFragment = typeof contactFragments[keyof typeof contactFragments]

export function contactDetail ({
  contact,
  fragmentId
}: {
  contact: Contact
} & RenderOptions<ContactFragment>) {
  const html = frag<ContactFragment>(fragmentId)

  return render(html`
    ${html.fragment.start(contactFragments.archiveUi)}
    <button>${contact.archived ? 'Unarchive' : 'Archive'}</button>
    ${html.fragment.end}
  `)
}
```

### Fragment rules

- Fragment IDs must be unique within a rendered template.
- Missing fragments throw `FragmentNotFoundError`.
- Duplicate fragment IDs throw `DuplicateFragmentError`.
- `html.fragment.end` without a matching start throws `FragmentBoundaryError`.
- An unclosed `html.fragment.start(id)` throws `FragmentBoundaryError`.

## Nested fragments

Nested fragments are supported with stack semantics. This is useful when a larger region can be re-rendered as a whole, but a smaller region inside it is also a valid htmx update target.

```js
import html, { render } from 'fragtml'

export function page ({ fragmentId }) {
  return render(html(fragmentId)`
    ${html.fragment.start('outer')}
    <section>
      <h2>Outer</h2>

      ${html.fragment.start('inner')}
      <button>Inner update target</button>
      ${html.fragment.end}
    </section>
    ${html.fragment.end}
  `)
}
```

Rendering `outer` includes the nested `inner` content:

```js
page({ fragmentId: 'outer' })
// '<section>\n  <h2>Outer</h2>\n\n  <button>Inner update target</button>\n</section>'
```

Rendering `inner` returns only the inner fragment:

```js
page({ fragmentId: 'inner' })
// '<button>Inner update target</button>'
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
  FragmentStartBoundary,
  HtmlArrayScalarSubstitution,
  HtmlArraySubstitution,
  HtmlPrimitiveSubstitution,
  HtmlSubstitution,
  HtmlTag,
  RawHtml,
  RenderOptions,
  TemplateStrings
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
