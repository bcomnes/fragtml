# Fragment-aware HTML tagged template library plan

## Goal

Implement `fragtml` as a string-generating HTML tagged-template library with:

- A safe default `html` export that HTML-escapes interpolated substitutions.
- A branded intermediate result object for safe composition, with `toString()`, `valueOf()`, and `Symbol.toPrimitive` support.
- A `render()` function that explicitly converts a template result to a primitive string.
- A `raw` / `.raw` helper for explicitly trusted HTML insertion instead of a public unsafe tag.
- Unquoted boolean attribute toggles with `?name=${condition}` syntax.
- Template fragment support inspired by htmx’s [Template Fragments](https://htmx.org/essays/template-fragments/): keep a whole view in one template while allowing a controller/route to render only a named fragment for partial htmx updates.
- TypeScript-in-JavaScript (`ts-in-js`) with generated declarations and strong JSDoc types.

This has been implemented as the first real public API, replacing the initial scaffold (`hello()`).

## Source material summary

### `common-tags` behavior to mirror

From the referenced `common-tags` modules:

- `html` is a `createTag(...)` pipeline using:
  - `splitStringTransformer('\n')`
  - `removeNonPrintingValuesTransformer()`
  - `inlineArrayTransformer()`
  - `stripIndent`
- `safeHtml` is similar, but escapes substitutions with replacement transformers:
  - `&` → `&amp;`
  - `<` → `&lt;`
  - `>` → `&gt;`
  - `"` → `&quot;`
  - `'` → `&#x27;`
  - `` ` `` → `&#x60;`
- `createTag` supports direct tag calls and tag composition, applies string/substitution/end-result hooks, and allows arrays to be inlined with indentation-aware formatting.

For `fragtml`, copy the useful concepts rather than adding a runtime dependency:

- Template strings are split around newline substitutions.
- Arrays are inlined in an indentation-aware way.
- Indentation is stripped from the final result.
- Non-printing values should be removed for ergonomic HTML interpolation.
- Safe `html` escapes ordinary substitutions by default.
- Explicit `raw(...)` values bypass escaping for trusted HTML.

### htmx template fragments essay

The essay’s key idea: a single server-side template can contain named fragments, and renderers can return either:

- the whole page/template, or
- only a named fragment, e.g. `/contacts/detail.html#archive-ui`.

This avoids extracting small partial templates into separate files solely to serve htmx updates, improving locality of behavior.

For `fragtml`, the equivalent should let authors define a full page and a named fragment in one JS template function, then pass a `fragmentId` to render only that portion.

## Proposed public API

### Exports

```js
import html, { createHtml, raw, render } from 'fragtml'
```

If both default and named imports are desired in the same file, alias one of them to avoid duplicate local bindings:

```js
import defaultHtml, { html, render } from 'fragtml'
```

Recommended package exports:

- `default` → `html`
- named `html` → safe tag
- named `createHtml` → alias of `html`, intended for local bound-tag naming (`const html = createHtml({ fragmentId })`)
- named `raw` → explicit trusted HTML wrapper
- named `render` → converts `HtmlResult` / fragments / renderable values to a primitive string

The original idea included a public `unsafeHtml` export, but with `raw(...)` the public unsafe tag is unnecessary for v1. In this plan:

- `html` means safe-by-default interpolation.
- `raw(value)` / `html.raw(value)` is the explicit opt-in for trusted HTML insertion.
- A private unsafe mode may exist internally if it simplifies implementation, but it should not be part of the initial public API.

### Basic safe rendering

```js
import html, { render } from 'fragtml'

const name = '<Bret>'

const result = html`<p>Hello ${name}</p>`

String(result)
// '<p>Hello &lt;Bret&gt;</p>'

render(result)
// '<p>Hello &lt;Bret&gt;</p>'
```

### Trusted raw insertion

```js
import html, { raw, render } from 'fragtml'

const result = html`<p>${raw('<strong>trusted</strong>')}</p>`

render(result)
// '<p><strong>trusted</strong></p>'
```

`html.raw` should be the same helper:

```js
html.raw === raw
```

### Raw helper

The safe `html` tag should provide an explicit raw/trust boundary for values that are already trusted HTML:

```js
html`<div>${html.raw('<em>trusted</em>')}</div>`
// render(...) => '<div><em>trusted</em></div>'
```

`html.raw(...)` should be available on both the root tag and bound tags. It allows raw insertion inside the safe tag without switching the whole template to an unsafe mode.

### Nested safe composition

`html` should return a branded intermediate object, not a primitive string. This follows the same broad pattern as `uhtml`, where `html\`...\`` returns a recognizable template object (`Hole`) that parent templates can insert as trusted structured output.

```js
import html, { render } from 'fragtml'

const button = html`<button>${'<Archive>'}</button>`

const panel = html`
  <div hx-target="this">
    ${button}
  </div>
`

render(panel)
// '<div hx-target="this"><button>&lt;Archive&gt;</button></div>'
```

Ordinary strings remain untrusted and are escaped:

```js
const userInput = '<button>not trusted</button>'

render(html`<div>${userInput}</div>`)
// '<div>&lt;button&gt;not trusted&lt;/button&gt;</div>'
```

### Fragment definition and selection

Preferred API shape: explicit fragment boundary tokens.

This avoids forcing fragments into nested template literal scopes and keeps the fragment body visually inline in the parent template.

```js
import html, { render } from 'fragtml'

export function contactDetail ({ contact, fragmentId }) {
  const h = html({ fragmentId })

  return render(h`
    <html>
      <body>
        <div hx-target="this">
          ${h.fragment.start('archive-ui')}
          ${contact.archived
            ? h`<button hx-patch="/contacts/${contact.id}/unarchive">Unarchive</button>`
            : h`<button hx-delete="/contacts/${contact.id}">Archive</button>`}
          ${h.fragment.end}
        </div>

        <h3>Contact</h3>
        <p>${contact.email}</p>
      </body>
    </html>
  `)
}
```

Behavior:

```js
contactDetail({ contact })
// full template string

contactDetail({ contact, fragmentId: 'archive-ui' })
// only the archive-ui fragment body string
```

This keeps the render invocation close to the imagined usage while allowing the configured tag to be assigned before use:

```js
({ fragmentId, ...data }) => {
  const h = html({ fragmentId })
  return render(h`<div>...</div>`)
}
```

This is useful because many editors apply HTML sub-syntax highlighting more reliably when the template tag is a simple identifier (`h` or `html`) rather than a call expression (`html({ fragmentId })`).

If the local tag should be named exactly `html`, use the named `createHtml` alias to avoid JavaScript same-name shadowing:

```js
import { createHtml, render } from 'fragtml'

export function view ({ fragmentId }) {
  const html = createHtml({ fragmentId })

  return render(html`
    ${html.fragment.start('main')}
    <main>...</main>
    ${html.fragment.end}
  `)
}
```

`createHtml` should be a strict alias of `html`:

```js
createHtml === html
```

Support the shorter render-target overload as a convenience:

```js
html('archive-ui')`...`
```

This should be equivalent to:

```js
html({ fragmentId: 'archive-ui' })`...`
```

Docs should still prefer `html({ fragmentId })` / `createHtml({ fragmentId })` for clearer future options.

### Raw content inside fragments

```js
const h = html({ fragmentId })

render(h`
  ${h.fragment.start('raw-widget')}
  <div>${h.raw(trustedHtml)}</div>
  ${h.fragment.end}
`)
```

`html.fragment.start(id)` / `html.fragment.end` create boundary tokens without requiring predeclaration. Content between those tokens still uses safe `html` interpolation rules unless individual values are wrapped with `raw(...)`.

## Fragment semantics

1. A fragment is declared inline with explicit start/end boundary tokens from `html.fragment.start(id)` and `html.fragment.end`, or the equivalent helpers on a bound tag.
2. Fragment boundary tokens are not emitted in either full-template or fragment-only output.
3. When rendering the full template, content between boundary tokens remains in place.
4. When rendering with `fragmentId`, the tag evaluates the template and returns only the content captured between the matching boundary tokens.
5. Fragment IDs should be unique within a rendered template.
6. Missing fragment IDs should throw. A server route that asks for a non-existent fragment is likely a bug.
7. Duplicate fragment IDs should throw by default to avoid ambiguous partial responses.
8. Unmatched starts and unmatched ends should throw.
9. Nested fragment boundaries can be supported with stack semantics if needed:
   - Rendering an outer fragment includes its nested fragment content.
   - Rendering an inner fragment returns only the inner body.
   - If this feels too complex for v1, disallow nested fragment boundaries with a clear error.
10. Fragment content should receive the same indentation cleanup as top-level content.
11. Fragment selection should not require moving fragment contents into a separate file/function.

## Runtime design

### Suggested files

```txt
fragtml/
  index.js
  lib/
    html.js
    create-tag.js
    escape-html.js
    fragment.js
    html-result.js
    raw.js
    render.js
    inline-array.js
    strip-indent.js
    types.js          # optional JSDoc typedef-only module
```

### Core types/concepts

Use small internal token objects for fragment support:

```js
const fragmentBoundarySymbol = Symbol('fragtml.fragmentBoundary')
```

`html.fragment.start(id)` returns a named start boundary object, and `html.fragment.end` returns an unnamed end boundary object:

```js
{
  [fragmentBoundarySymbol]: true,
  kind: 'start',
  id: 'archive-ui'
}

{
  [fragmentBoundarySymbol]: true,
  kind: 'end'
}
```

This avoids requiring predeclaration:

```js
html`
  ${html.fragment.start('archive-ui')}
  <button>Archive</button>
  ${html.fragment.end}
`
```

The renderer walks the rendered substitution stream, does not emit boundary tokens, and captures content between matching start/end tokens.

This avoids emitting comment markers into HTML and avoids needing a fragile regex parser over rendered strings.

### Safe interpolation, intermediate results, and trusted output

`html` should return a branded intermediate result object instead of a primitive string. This is now a v1 requirement.

This follows the important composition idea from `uhtml`: a nested template result is not an arbitrary string. It is a recognizable library-created value that parent templates can insert without escaping its markup, while still escaping user substitutions inside that nested result.

```js
const child = html`<span>${'<Bret>'}</span>`
const parent = html`<div>${child}</div>`

render(parent)
// '<div><span>&lt;Bret&gt;</span></div>'
```

The result object should support direct string conversion:

```js
const result = html`<p>${name}</p>`

String(result)
result.toString()
`${result}`
```

…but `render(result)` is the preferred explicit boundary for route handlers and tests:

```js
return render(html`<p>${name}</p>`)
```

Recommended shape:

```js
class HtmlResult {
  #compiled
  #substitutions
  #options

  constructor (compiled, substitutions, options) {
    this.#compiled = compiled
    this.#substitutions = substitutions
    this.#options = options
  }

  toString () {
    return render(this)
  }

  valueOf () {
    return render(this)
  }

  [Symbol.toPrimitive] () {
    return render(this)
  }
}
```

The actual implementation should avoid recursive public `render()` calls if needed by using an internal `renderResult(result)` helper. The important point is that the result keeps the compiled template and substitutions, not a pre-rendered/cached final string.

Use a private module symbol or class identity to distinguish library-created results from ordinary user objects. Do not treat arbitrary objects with `toString()` as trusted HTML.

The `.raw` helper should return a separate branded raw/trusted value:

```js
html.raw('<em>trusted</em>')
```

`html` interpolation behavior:

- `HtmlResult` → insert without escaping.
- `RawHtml` / `.raw(...)` result → insert without escaping.
- Fragment boundary token → update fragment capture state and emit nothing.
- ordinary string → escape.
- ordinary object → stringify then escape unless explicitly unsupported.

There is no public unsafe tag in v1. If an internal unsafe mode exists for implementation convenience, keep it private. Public trusted insertion should be done with `raw(...)` / `html.raw(...)` so trust boundaries are local and visible.

This preserves safe defaults while making component-style composition ergonomic.

### Template-site caching

Use a `WeakMap<TemplateStringsArray, CompiledTemplate>` to cache static template processing by template literal call site. This mirrors `uhtml`’s runtime caching strategy: JavaScript reuses the same `TemplateStringsArray` object for a given tagged-template call site, so it is a reliable weak key for static work.

For `fragtml`, cache static/precomputed work such as:

- normalized/static string segment metadata,
- indentation/trim metadata,
- any static join/render plan that does not depend on substitution values,
- mode-specific setup if any alternate internal render paths are used.

Do not cache final rendered strings in v1. `HtmlResult` should render from its captured template and substitutions each time `render(result)` / `String(result)` is called. This avoids surprising behavior with mutable substitutions:

```js
const items = ['a']
const result = html`${items}`

items.push('b')

render(result)
// should reflect the current substitution semantics, not a stale first-render cache
```

Fragment capture must remain per render because fragment boundary tokens are substitutions and can be conditional/dynamic.

Recommended shape:

```js
const templateCache = new WeakMap()

function compileTemplate (strings, mode) {
  let compiled = templateCache.get(strings)

  if (!compiled) {
    compiled = {
      strings,
      mode,
      // static preprocessing metadata here
    }
    templateCache.set(strings, compiled)
  }

  return compiled
}
```

If multiple internal render modes share the same call site through a generic factory, account for `mode` either by keeping separate caches per mode or by keying the cached value by mode internally.

### Transformer pipeline

Implement a simpler local equivalent of the relevant `common-tags` transformers:

1. Normalize substitutions:
   - `null`, `undefined`, `NaN`, and booleans become empty for safe `html` interpolation.
   - This intentionally differs slightly from `common-tags/safeHtml`, which does not include `removeNonPrintingValuesTransformer()`, but it is better for ergonomic HTML rendering.
2. Split string substitutions containing `\n` into arrays.
3. Inline arrays with indentation awareness.
4. Escape ordinary substitutions for `html`; do not escape `HtmlResult`, `RawHtml`, or fragment boundary tokens.
5. Concatenate strings/substitutions.
6. Strip indentation and smart-trim final output.

Important order:

- Escape scalar substitutions before insertion in `html` mode.
- Recognize `HtmlResult` and `.raw(...)` values before scalar escaping.
- Process fragment boundary tokens before scalar escaping and emit no output for the boundaries themselves.
- Inline arrays after each item has been rendered/escaped according to mode.
- Return an `HtmlResult` from template tags; convert to a primitive string only through `render()`, `String(...)`, or the result’s coercion hooks.

### Error classes

Consider exporting or at least naming errors clearly:

- `FragmentNotFoundError`
- `DuplicateFragmentError`

This helps tests and route handlers distinguish expected mistakes.

## TypeScript-in-JS plan

Use JSDoc in `.js` files and let `declaration.tsconfig.json` emit `index.d.ts`.

### Public type goals

The generated declarations should support:

```ts
import html, { createHtml, html as namedHtml, raw, render } from 'fragtml'

const result = html`<p>${'safe'}</p>`
render(result)
String(result)

const h = html({ fragmentId: 'foo' })
h`...`
h`${h.fragment.start('foo')}...${h.fragment.end}`
h.raw('<em>trusted</em>')

const localHtml = createHtml('foo')
localHtml`...`
localHtml.fragment.start('foo')
localHtml.raw('<em>trusted</em>')

html.raw('<em>trusted</em>')
raw('<em>trusted</em>')
```

### Suggested JSDoc typedefs

```js
/**
 * @typedef {string | number | bigint | boolean | null | undefined} PrimitiveSubstitution
 * @typedef {PrimitiveSubstitution | HtmlResult | RawHtml | FragmentBoundary | Substitution[]} Substitution
 * @typedef {ReadonlyArray<string> & { raw?: readonly string[] }} TemplateStrings
 *
 * @typedef {object} RenderOptions
 * @property {string | undefined} [fragmentId]
 *
 * @callback HtmlTag
 * @param {TemplateStrings} strings
 * @param {...Substitution} substitutions
 * @returns {HtmlResult}
 *
 * @callback RawHelper
 * @param {unknown} value
 * @returns {RawHtml}
 *
 * @callback FragmentBoundaryFactory
 * @param {string} id
 * @returns {FragmentBoundary}
 *
 * @typedef {object} FragmentHelpers
 * @property {FragmentBoundaryFactory} start
 * @property {FragmentBoundary} end
 *
 * @callback HtmlTagFactory
 * @param {RenderOptions | string} [options]
 * @returns {HtmlTag}
 */
```

Represent the overloaded callable export carefully. If JSDoc cannot model the callable-with-properties shape cleanly, keep an explicit `lib/types.d.ts` or `index.d.ts` source file only if necessary. Prefer generated declarations first.

### Callable with properties

At runtime, root and bound tags should expose the same helper shape:

```js
html.fragment = createFragmentHelpers()
html.raw = raw

const h = html({ fragmentId })
h.fragment = html.fragment
h.raw = raw
```

JSDoc should describe `html` and bound tags returned by `html(options)` / `html(fragmentId)` as callable functions with `.fragment.start`, `.fragment.end`, and `.raw` properties. Keep `.fragment` as a plain helper object for simpler runtime behavior and declarations.

## Test plan

Replace the scaffold test with node:test coverage for:

### Exports

- default export is `html`.
- named `html` exists.
- named `createHtml` exists and equals `html`.
- named `raw` exists.
- named `render` exists.
- `html.raw` exists and equals the named `raw` export.
- no public `unsafeHtml` export in v1.
- no more `hello()` export unless intentionally kept as deprecated (prefer removing it before first real release).

### Safe escaping and result rendering

- `html` returns an `HtmlResult`-like object, not a primitive string.
- `render(html`...`)` returns a primitive string.
- `String(result)`, `result.toString()`, and template-string coercion return the same rendered string.
- Escapes `&`, `<`, `>`, `"`, `'`, and `` ` `` in ordinary substitutions.
- Does not escape static template string HTML.
- Does not escape nested `HtmlResult` markup, but preserves escaping already applied inside that nested result.
- Does not escape `html.raw(...)` values.
- Handles numbers and bigints.
- Removes `null`, `undefined`, booleans, and `NaN` as non-printing values.

### Raw rendering

- `raw(value)` returns a branded `RawHtml` value.
- `html.raw(value)` returns the same branded `RawHtml` value.
- Raw values are inserted without escaping inside `html`.
- Ordinary strings remain escaped, even when adjacent to raw values.
- Raw values compose inside nested `HtmlResult` and arrays.

### Common-tags-like formatting

- Strips indentation from multi-line templates.
- Splits newline-containing string substitutions.
- Inlines arrays with correct indentation.

### Template-site caching

- Repeated calls from the same template literal call site reuse cached static preprocessing.
- Internal render modes, if any, do not accidentally share incompatible compiled metadata.
- Final rendered strings are not memoized per `HtmlResult`; repeated `render(result)` calls recompute from current captured substitutions.

### Fragments

- Full render includes fragment body without wrapper markers.
- `render(html({ fragmentId })`...`)` returns only the matching fragment body string.
- `html({ fragmentId })` itself returns an `HtmlResult` that stringifies to the selected fragment.
- `html('fragment-id')` works as shorthand for `html({ fragmentId: 'fragment-id' })`.
- Start/end boundary tokens are omitted from full and fragment-only output.
- Missing fragment throws.
- Duplicate fragment IDs throw.
- Unmatched starts and unmatched ends throw.
- Nested fragments, if supported:
  - outer selected includes inner content.
  - inner selected returns only inner content.
- Safe escaping applies inside fragments.
- Raw values inside fragments do not get escaped.

### Type declarations

- `npm run build:declaration` emits declarations.
- `npm run test:tsc` passes.
- Add a small compile-only usage fixture if needed to assert public API types.

## Documentation plan

Update `README.md` with:

- Short project description.
- Installation.
- Safe default usage.
- Explicit `render(result)` usage for route handlers.
- `toString()` / string coercion behavior for returned intermediate results.
- Nested safe composition examples.
- `.raw(...)` usage with a warning that it is for trusted HTML only.
- No public `unsafeHtml` tag in v1; use `raw(...)` for trusted HTML only.
- htmx fragment example mirroring the essay’s archive/unarchive button.
- API reference:
  - `html`
  - `createHtml` alias for local bound-tag naming
  - `html(options)` / bound tag usage, for example assigning `const h = html(options)` and then using `h` as the template tag
  - `html(fragmentId)` shorthand for `html({ fragmentId })`
  - `html.fragment.start(id)` and `html.fragment.end` on both root and bound tags
  - `html.raw(value)`
  - `raw(value)`
  - `render(value)`
- Notes on fragment ID uniqueness and missing-fragment behavior.

## Implementation progress

Completed:

1. Replaced the `index.js` scaffold with real exports:
   - default `html`
   - named `html`
   - named `createHtml`
   - named `raw`
   - named `render`
   - fragment-related error classes
2. Added internal modules under `lib/`:
   - `create-tag.js`
   - `escape-html.js`
   - `fragment.js`
   - `html-result.js`
   - `html.js`
   - `inline-array.js`
   - `raw.js`
   - `render.js`
   - `strip-indent.js`
   - `utils.js`
3. Implemented `HtmlResult`, `RawHtml`, `raw()`, and `render()`.
4. Implemented safe escaping for ordinary substitutions.
5. Implemented non-printing value removal for `null`, `undefined`, booleans, and `NaN`.
6. Implemented indentation stripping, array inlining, and newline-containing string substitution handling.
7. Implemented unquoted boolean attribute toggles:
   - `?disabled=${true}` renders `disabled`
   - `?disabled=${false}` omits the attribute
   - quoted toggle forms are intentionally unsupported in v1
8. Implemented fragment boundary tokens and selection with stack semantics:
   - `h.fragment.start(id)`
   - `h.fragment.end`
   - full-template rendering omits fragment markers
   - selected-fragment rendering returns only the requested fragment
   - missing, duplicate, unmatched-start, and unmatched-end errors throw explicit error classes
9. Implemented template-site caching via `WeakMap<TemplateStringsArray, CompiledTemplate>`.
10. Added node:test runtime coverage for exports, safe escaping, raw insertion, nested composition, boolean attributes, formatting, fragments, errors, and shorthand/bound tag usage.
11. Added JSDoc/ts-in-js types using top-level `@import` comment blocks. No inline `import(...)` type references remain in JS source files.
12. Updated `declaration.tsconfig.json` to emit declarations from JS with `allowJs` and `checkJs`.
13. Verified generated declarations locally. Declarations are git-ignored, but `index.d.ts` is emitted and points at generated lib declarations.

Validation run:

```sh
npm test
npm run build
```

Both commands passed.

Remaining follow-ups:

1. Consider adding quoted boolean attribute support later if matching `uhtml` more closely becomes important.
2. Consider adding a small dedicated type-usage fixture if the generated declarations need more explicit public API regression coverage.

## Decisions resolved before coding

1. `html` removes `null`, `undefined`, booleans, and `NaN` as non-printing values.
2. `html(fragmentId)` is supported as shorthand for `html({ fragmentId })`.
3. `createHtml` is exported as an alias of `html` so docs can recommend `const html = createHtml({ fragmentId })` for editor highlighting.
4. Missing fragments throw by default.
