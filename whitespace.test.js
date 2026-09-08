import test from 'node:test'
import assert from 'node:assert/strict'
import { html, raw, render } from './index.js'

const code = 'first\n  second\n\n\tthird  \n'

test('inline nested HTML preserves code-block newlines', () => {
  const child = html`<pre><code>${raw(code)}</code></pre>`
  assert.equal(render(html`<main>${child}</main>`), `<main><pre><code>${code}</code></pre></main>`)
})

test('raw content survives template dedenting, including leading and trailing whitespace', () => {
  for (const text of [code, '\n  indented\n\n', '\r\n\tCRLF\r\n', ' \t\n \t', '\0x\0\n  <>&']) {
    assert.equal(render(html`
      ${raw(text)}
    `), text)
    assert.equal(render(html`
      <main>
        ${raw(text)}
      </main>
    `), `<main>\n  ${text}\n</main>`)
  }
})

test('own-line children retain their content rather than inheriting parent indentation', () => {
  for (const child of [
    html`<pre>${raw(code)}</pre>`,
    html`<textarea>${raw(code)}</textarea>`,
    html`<script>${raw(code)}</script>`,
    html`<style>${raw(code)}</style>`,
    // Whitespace preservation is not limited to particular HTML tags.
    html`<custom-element>${raw(code)}</custom-element>`,
    html`
      <pre>
        first
          second

        third
      </pre>
    `
  ]) {
    assert.equal(render(html`
      <section>
        ${child}
      </section>
    `), `<section>\n  ${render(child)}\n</section>`)
  }
})

test('array separators do not reformat child content or remove its trailing newline', () => {
  const first = html`<pre>${raw(code)}</pre>`
  const second = raw('\n  another\n\n')
  assert.equal(
    render(html`<main>${[first, [second]]}</main>`),
    `<main>${render(first)} ${render(second)}</main>`
  )
  assert.equal(
    render(html`
      <main>
        ${[first, [second]]}
      </main>
    `),
    `<main>\n  ${render(first)}\n  ${render(second)}\n</main>`
  )
})

test('multiple levels of composition keep rendered child content intact', () => {
  const leaf = html`<pre>${raw(code)}</pre>`
  const middle = html`
    <article>
      ${leaf}
    </article>
  `
  const outer = html`<main>${middle}</main>`
  const expected = `<main><article>\n  <pre>${code}</pre>\n</article></main>`
  assert.equal(render(outer), expected)
  assert.equal(String(outer), expected)
  assert.equal(render(outer), expected, 'rendering is repeatable')
})

test('fragment extraction and boundary cleanup preserve raw and nested content', () => {
  const h = html('sample')
  for (const content of [raw(code), html`<pre>${raw(code)}</pre>`]) {
    assert.equal(render(h`
      <main>
        ${h.fragment.start('sample')}
        ${content}
        ${h.fragment.end}
      </main>
    `), render(content))
    assert.equal(
      render(h`${h.fragment.start('sample')}${content}${h.fragment.end}`),
      render(content),
      'an adjacent fragment boundary must not trim content'
    )
  }
})

test('ordinary escaping, empty values, and boolean attributes still work around protected content', () => {
  assert.equal(render(html`
    <p>${html``}${raw('')}${'<unsafe>'}</p>
  `), '<p>&lt;unsafe&gt;</p>')
  assert.equal(render(html`<pre>${html`<code>${'<unsafe>'}</code>`}</pre>`), '<pre><code>&lt;unsafe&gt;</code></pre>')
  assert.equal(render(html`<div>${raw(code)}<button ?disabled=${true}>Save</button></div>`),
    `<div>${code}<button disabled>Save</button></div>`)
  assert.equal(render(html`${raw(' ?disabled=')}${false}`), ' ?disabled=', 'content is not template attribute syntax')
})
