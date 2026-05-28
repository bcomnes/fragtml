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

## Bound tags

`html(options)` returns a configured tag. This is useful for fragment rendering and for editor syntax highlighting, because many editors highlight tagged templates better when the tag is a simple identifier.

```js
import { createHtml, render } from 'fragtml'

export function view ({ fragmentId }) {
  const html = createHtml({ fragmentId })

  return render(html`
    <main>...</main>
  `)
}
```

`createHtml` is an alias of `html`:

```js
import html, { createHtml } from 'fragtml'

createHtml === html
```

You can also use the short fragment-target form:

```js
const html = createHtml('archive-ui')
```

which is equivalent to:

```js
const html = createHtml({ fragmentId: 'archive-ui' })
```

## Fragments

Fragments mark a named range inside a larger template. Rendering without `fragmentId` returns the whole template. Rendering with `fragmentId` returns only that fragment.

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
import { createHtml, render } from 'fragtml'

export function contactDetail ({ contact, fragmentId }) {
  const html = createHtml({ fragmentId })

  return render(html`
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

### Fragment rules

- Fragment IDs must be unique within a rendered template.
- Missing fragments throw `FragmentNotFoundError`.
- Duplicate fragment IDs throw `DuplicateFragmentError`.
- `html.fragment.end` without a matching start throws `FragmentBoundaryError`.
- An unclosed `html.fragment.start(id)` throws `FragmentBoundaryError`.

## Nested fragments

Nested fragments are supported with stack semantics. This is useful when a larger region can be re-rendered as a whole, but a smaller region inside it is also a valid htmx update target.

```js
import { createHtml, render } from 'fragtml'

export function page ({ fragmentId }) {
  const html = createHtml({ fragmentId })

  return render(html`
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

Also acts as a factory for bound tags:

```js
const h = html({ fragmentId: 'name' })
const h = html('name')
```

### `createHtml`

Alias of `html`, intended for local tag naming:

```js
import { createHtml } from 'fragtml'

const html = createHtml({ fragmentId })
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

## License

MIT
