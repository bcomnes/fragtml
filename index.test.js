import test from 'node:test'
import assert from 'node:assert/strict'
import html, {
  DuplicateFragmentError,
  FragmentBoundaryError,
  FragmentNotFoundError,
  HtmlResult,
  RawHtml,
  frag,
  isFragmentBoundary,
  isHtmlResult,
  isRawHtml,
  raw,
  render
} from './index.js'
import * as api from './index.js'

test('exports public API', () => {
  assert.equal(frag, html)
  assert.equal(html.raw, raw)
  assert.equal(typeof render, 'function')
  assert.equal(typeof HtmlResult, 'function')
  assert.equal(typeof RawHtml, 'function')
  assert.equal(typeof isFragmentBoundary, 'function')
  assert.equal(typeof isHtmlResult, 'function')
  assert.equal(typeof isRawHtml, 'function')
  assert.equal(typeof html.fragment.start, 'function')
  assert.equal(typeof html.fragment.end, 'object')
  assert.equal(isHtmlResult(html`<p>ok</p>`), true)
  assert.equal(isRawHtml(raw('<p>ok</p>')), true)
  assert.equal(isFragmentBoundary(html.fragment.start('test')), true)
  assert.equal(Object.hasOwn(api, 'createHtml'), false)
})

test('safe html escapes substitutions and stringifies result objects', () => {
  const result = html`<p>${'&<>"\'`'}</p>`

  assert.notEqual(typeof result, 'string')
  assert.equal(render(result), '<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
  assert.equal(String(result), '<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
  assert.equal(result.toString(), '<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
  assert.equal(`${result}`, '<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
})

test('safe html omits non-printing values', () => {
  assert.equal(
    render(html`<p>${null}${undefined}${false}${true}${Number.NaN}${0}${1n}</p>`),
    '<p>01</p>'
  )
})

test('raw marks trusted html for insertion', () => {
  assert.equal(
    render(html`<p>${raw('<strong>trusted</strong>')} ${html.raw('<em>also trusted</em>')}</p>`),
    '<p><strong>trusted</strong> <em>also trusted</em></p>'
  )

  assert.equal(
    render(html`<p>${'<strong>not trusted</strong>'}</p>`),
    '<p>&lt;strong&gt;not trusted&lt;/strong&gt;</p>'
  )
})

test('nested html results compose without escaping generated markup', () => {
  const child = html`<span>${'<Bret>'}</span>`

  assert.equal(
    render(html`<div>${child}</div>`),
    '<div><span>&lt;Bret&gt;</span></div>'
  )
})

test('toggles unquoted boolean attributes', () => {
  assert.equal(
    render(html`<button ?disabled=${true}>Save</button>`),
    '<button disabled>Save</button>'
  )

  assert.equal(
    render(html`<button ?disabled=${false}>Save</button>`),
    '<button>Save</button>'
  )

  assert.equal(
    render(html`<details ?open=${'yes'} ?hidden=${0}>More</details>`),
    '<details open>More</details>'
  )
})

test('strips indentation and inlines arrays', () => {
  const items = [html`<li>${'one'}</li>`, html`<li>${'two'}</li>`]

  assert.equal(
    render(html`
      <ul>
        ${items}
      </ul>
    `),
    '<ul>\n  <li>one</li>\n  <li>two</li>\n</ul>'
  )
})

test('splits newline-containing string substitutions', () => {
  assert.equal(
    render(html`
      <pre>
        ${'a\nb'}
      </pre>
    `),
    '<pre>\n  a\n  b\n</pre>'
  )
})

test('does not introduce excess newlines around newline substitutions', () => {
  assert.equal(
    render(html`
      <ul>

        ${'<li>one</li>\n<li>two</li>'}
        <li>three</li>
      </ul>
    `),
    '<ul>\n\n  &lt;li&gt;one&lt;/li&gt;\n  &lt;li&gt;two&lt;/li&gt;\n  <li>three</li>\n</ul>'
  )
})

test('renders nested arrays without excess empty lines', () => {
  const fruits = ['apple', 'banana', 'kiwi']
  /**
   * @param {string} fruit
   */
  const renderFruit = (fruit) => html`
    <li>
      <div>${fruit}</div>
    </li>
  `

  assert.equal(
    render(html`
      <ul>

        ${fruits.map(renderFruit)}

      </ul>
    `),
    '<ul>\n\n  <li>\n    <div>apple</div>\n  </li>\n  <li>\n    <div>banana</div>\n  </li>\n  <li>\n    <div>kiwi</div>\n  </li>\n\n</ul>'
  )
})

test('handles empty arrays inline and multiline', () => {
  assert.equal(
    render(html`<ul>${[]}</ul>`),
    '<ul></ul>'
  )

  assert.equal(
    render(html`
      <ul>
        ${[]}
      </ul>
    `),
    '<ul>\n\n</ul>'
  )
})

test('renders arrays that are not on a new line with space separation', () => {
  const items = [html`<li>one</li>`, html`<li>two</li>`]

  assert.equal(
    render(html`<ul>${items}</ul>`),
    '<ul><li>one</li> <li>two</li></ul>'
  )
})

test('renders full template with fragment boundaries omitted', () => {
  const h = html({ fragmentId: undefined })

  assert.equal(
    render(h`
      <section>
        ${h.fragment.start('body')}
        <p>${'<safe>'}</p>
        ${h.fragment.end}
      </section>
    `),
    '<section>\n  <p>&lt;safe&gt;</p>\n</section>'
  )
})

test('renders selected fragment only', () => {
  const h = html({ fragmentId: 'archive-ui' })

  assert.equal(
    render(h`
      <div hx-target="this">
        ${h.fragment.start('archive-ui')}
        ${h`<button>${'Archive'}</button>`}
        ${h.fragment.end}
      </div>
      <p>outside</p>
    `),
    '<button>Archive</button>'
  )
})

test('supports html(fragmentId) shorthand and frag alias', () => {
  const h = frag('target')

  assert.equal(
    render(h`
      ${h.fragment.start('target')}
      <span>ok</span>
      ${h.fragment.end}
    `),
    '<span>ok</span>'
  )
})

test('raw values inside fragments are not escaped', () => {
  const h = html('raw-widget')

  assert.equal(
    render(h`
      ${h.fragment.start('raw-widget')}
      <div>${h.raw('<em>trusted</em>')}</div>
      ${h.fragment.end}
    `),
    '<div><em>trusted</em></div>'
  )
})

test('nested fragments use stack semantics', () => {
  const outer = html('outer')
  const inner = html('inner')
  /**
   * @param {typeof html} h
   */
  const template = (h) => h`
    ${h.fragment.start('outer')}
    outer before
    ${h.fragment.start('inner')}
    inner
    ${h.fragment.end}
    outer after
    ${h.fragment.end}
  `

  assert.equal(render(template(outer)), 'outer before\ninner\nouter after')
  assert.equal(render(template(inner)), 'inner')
})

test('fragment errors are explicit', () => {
  assert.throws(
    () => render(html('missing')`<p>none</p>`),
    FragmentNotFoundError
  )

  assert.throws(
    () => render(html`
      ${html.fragment.start('dupe')}
      first
      ${html.fragment.end}
      ${html.fragment.start('dupe')}
      second
      ${html.fragment.end}
    `),
    DuplicateFragmentError
  )

  assert.throws(
    () => render(html`${html.fragment.end}`),
    FragmentBoundaryError
  )

  assert.throws(
    () => render(html`${html.fragment.start('open')}`),
    FragmentBoundaryError
  )
})
