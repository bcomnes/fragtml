/** @import { FragmentTemplateTypes, HtmlTag } from './types.js' */

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
  assert.equal(render(result), /* html */'<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
  assert.equal(String(result), /* html */'<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
  assert.equal(result.toString(), /* html */'<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
  assert.equal(`${result}`, /* html */'<p>&amp;&lt;&gt;&quot;&#x27;&#x60;</p>')
})

test('safe html omits non-printing values', () => {
  assert.equal(
    render(html`<p>${null}${undefined}${false}${true}${Number.NaN}${0}${1n}</p>`),
    /* html */'<p>01</p>'
  )
})

test('raw marks trusted html for insertion', () => {
  assert.equal(
    render(html`<p>${raw('<strong>trusted</strong>')} ${html.raw('<em>also trusted</em>')}</p>`),
    /* html */'<p><strong>trusted</strong> <em>also trusted</em></p>'
  )

  assert.equal(
    render(html`<p>${'<strong>not trusted</strong>'}</p>`),
    /* html */'<p>&lt;strong&gt;not trusted&lt;/strong&gt;</p>'
  )
})

test('nested html results compose without escaping generated markup', () => {
  const child = html`<span>${'<Bret>'}</span>`

  assert.equal(
    render(html`<div>${child}</div>`),
    /* html */'<div><span>&lt;Bret&gt;</span></div>'
  )
})

test('toggles unquoted boolean attributes', () => {
  assert.equal(
    render(html`<button ?disabled=${true}>Save</button>`),
    /* html */'<button disabled>Save</button>'
  )

  assert.equal(
    render(html`<button ?disabled=${false}>Save</button>`),
    /* html */'<button>Save</button>'
  )

  assert.equal(
    render(html`<details ?open=${'yes'} ?hidden=${0}>More</details>`),
    /* html */'<details open>More</details>'
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
    /* html */'<ul>\n  <li>one</li>\n  <li>two</li>\n</ul>'
  )
})

test('splits newline-containing string substitutions', () => {
  assert.equal(
    render(html`
      <pre>
        ${'a\nb'}
      </pre>
    `),
    /* html */'<pre>\n  a\n  b\n</pre>'
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
    /* html */'<ul>\n\n  &lt;li&gt;one&lt;/li&gt;\n  &lt;li&gt;two&lt;/li&gt;\n  <li>three</li>\n</ul>'
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
    /* html */'<ul>\n\n  <li>\n    <div>apple</div>\n  </li>\n  <li>\n    <div>banana</div>\n  </li>\n  <li>\n    <div>kiwi</div>\n  </li>\n\n</ul>'
  )
})

test('handles empty arrays inline and multiline', () => {
  assert.equal(
    render(html`<ul>${[]}</ul>`),
    /* html */'<ul></ul>'
  )

  assert.equal(
    render(html`
      <ul>
        ${[]}
      </ul>
    `),
    /* html */'<ul>\n\n</ul>'
  )
})

test('renders arrays that are not on a new line with space separation', () => {
  const items = [html`<li>one</li>`, html`<li>two</li>`]

  assert.equal(
    render(html`<ul>${items}</ul>`),
    /* html */'<ul><li>one</li> <li>two</li></ul>'
  )
})

test('renders full template with fragment boundaries omitted', () => {
  const h = html({ fragmentId: undefined })

  assert.equal(
    render(h/* html */`
      <section>
        ${h.fragment.start('body')}
        <p>${'<safe>'}</p>
        ${h.fragment.end}
      </section>
    `),
    /* html */'<section>\n  <p>&lt;safe&gt;</p>\n</section>'
  )
})

test('renders selected fragment only', () => {
  const h = html({ fragmentId: 'archive-ui' })

  assert.equal(
    render(h/* html */`
      <div hx-target="this">
        ${h.fragment.start('archive-ui')}
        ${html`<button>${'Archive'}</button>`}
        ${h.fragment.end}
      </div>
      <p>outside</p>
    `),
    /* html */'<button>Archive</button>'
  )
})

test('supports html(fragmentId) shorthand and frag alias', () => {
  const h = frag('target')

  assert.equal(
    render(h/* html */`
      ${h.fragment.start('target')}
      <span>ok</span>
      ${h.fragment.end}
    `),
    /* html */'<span>ok</span>'
  )
})

test('raw values inside fragments are not escaped', () => {
  const h = html('raw-widget')

  assert.equal(
    render(h/* html */`
      ${h.fragment.start('raw-widget')}
      <div>${h.raw('<em>trusted</em>')}</div>
      ${h.fragment.end}
    `),
    /* html */'<div><em>trusted</em></div>'
  )
})

test('nested fragments use stack semantics', () => {
  const outer = /** @type {HtmlTag<'outer' | 'inner'>} */ (html('outer'))
  const inner = /** @type {HtmlTag<'outer' | 'inner'>} */ (html('inner'))
  /**
   * @param {HtmlTag<'outer' | 'inner'>} h
   */
  const template = (h) => h/* html */`
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

/** @typedef {'profile' | 'profile-actions' | 'activity' | 'activity-row'} DashboardFragment */

test('renders multiple independent nested fragment groups', () => {
  /**
   * @param {HtmlTag<DashboardFragment>} h
   */
  const template = (h) => h/* html */`
    ${h.fragment.start('profile')}
    <section>
      <h2>Profile</h2>

      ${h.fragment.start('profile-actions')}
      <button>Edit profile</button>
      ${h.fragment.end}
    </section>
    ${h.fragment.end}

    ${h.fragment.start('activity')}
    <section>
      <h2>Activity</h2>

      ${h.fragment.start('activity-row')}
      <article>Recent activity</article>
      ${h.fragment.end}
    </section>
    ${h.fragment.end}
  `

  const full = /** @type {HtmlTag<DashboardFragment>} */ (html)
  assert.equal(
    render(template(full)),
    /* html */'<section>\n  <h2>Profile</h2>\n\n  <button>Edit profile</button>\n</section>\n\n<section>\n  <h2>Activity</h2>\n\n  <article>Recent activity</article>\n</section>'
  )

  const profile = /** @type {HtmlTag<DashboardFragment>} */ (html('profile'))
  assert.equal(
    render(template(profile)),
    /* html */'<section>\n  <h2>Profile</h2>\n\n  <button>Edit profile</button>\n</section>'
  )

  const profileActions = /** @type {HtmlTag<DashboardFragment>} */ (html('profile-actions'))
  assert.equal(render(template(profileActions)), /* html */'<button>Edit profile</button>')

  const activity = /** @type {HtmlTag<DashboardFragment>} */ (html('activity'))
  assert.equal(
    render(template(activity)),
    /* html */'<section>\n  <h2>Activity</h2>\n\n  <article>Recent activity</article>\n</section>'
  )

  const activityRow = /** @type {HtmlTag<DashboardFragment>} */ (html('activity-row'))
  assert.equal(render(template(activityRow)), /* html */'<article>Recent activity</article>')
})

/**
 * @typedef {{ accountAction: string }} AccountPrimaryActionContext
 * @typedef {{ itemMenuLabel: string }} FeedItemMenuContext
 * @typedef {AccountPrimaryActionContext} AccountCardActionsContext
 * @typedef {AccountCardActionsContext & { accountName: string }} AccountCardContext
 * @typedef {AccountCardContext & { accountTitle: string }} AccountRootContext
 * @typedef {FeedItemMenuContext & { itemTitle: string }} FeedItemContext
 * @typedef {FeedItemContext} FeedListContext
 * @typedef {FeedListContext & { feedTitle: string }} FeedRootContext
 * @typedef {AccountRootContext & FeedRootContext} WorkspaceFullContext
 * @typedef {FragmentTemplateTypes<{
 *   fragments: {
 *     'account-root': AccountRootContext,
 *     'account-card': AccountCardContext,
 *     'account-card-actions': AccountCardActionsContext,
 *     'account-primary-action': AccountPrimaryActionContext,
 *     'feed-root': FeedRootContext,
 *     'feed-list': FeedListContext,
 *     'feed-item': FeedItemContext,
 *     'feed-item-menu': FeedItemMenuContext
 *   },
 *   full: WorkspaceFullContext
 * }>} WorkspaceTemplate
 * @typedef {WorkspaceTemplate['fragmentId']} WorkspaceFragment
 * @typedef {WorkspaceTemplate['args']} WorkspaceArgs
 * @typedef {WorkspaceTemplate['templateArgs']} WorkspaceTemplateArgs
 */

test('renders complex multi-root nested fragments with template type helpers', () => {
  const fullContext = {
    accountTitle: 'Account',
    accountName: 'Acme',
    accountAction: 'Save',
    feedTitle: 'Feed',
    itemTitle: 'New signup',
    itemMenuLabel: 'Open'
  }
  const accountRootExpected = /* html */'<section>\n  <h2>Account</h2>\n\n  <article>\n    <h3>Acme</h3>\n\n    <menu>\n      <button>Save</button>\n    </menu>\n  </article>\n</section>'
  const feedRootExpected = /* html */'<section>\n  <h2>Feed</h2>\n\n  <ol>\n    <li>\n      New signup\n      <menu>Open</menu>\n    </li>\n  </ol>\n</section>'
  const fullExpected = /* html */`${accountRootExpected}\n\n${feedRootExpected}`

  /**
   * @param {WorkspaceTemplateArgs} args
   */
  const workspaceTemplate = ({ context, fragmentId }) => {
    const h = /** @type {HtmlTag<WorkspaceFragment>} */ (html(fragmentId))

    return h/* html */`
      ${h.fragment.start('account-root')}
      <section>
        <h2>${context.accountTitle}</h2>

        ${h.fragment.start('account-card')}
        <article>
          <h3>${context.accountName}</h3>

          ${h.fragment.start('account-card-actions')}
          <menu>
            ${h.fragment.start('account-primary-action')}
            <button>${context.accountAction}</button>
            ${h.fragment.end}
          </menu>
          ${h.fragment.end}
        </article>
        ${h.fragment.end}
      </section>
      ${h.fragment.end}

      ${h.fragment.start('feed-root')}
      <section>
        <h2>${context.feedTitle}</h2>

        ${h.fragment.start('feed-list')}
        <ol>
          ${h.fragment.start('feed-item')}
          <li>
            ${context.itemTitle}
            ${h.fragment.start('feed-item-menu')}
            <menu>${context.itemMenuLabel}</menu>
            ${h.fragment.end}
          </li>
          ${h.fragment.end}
        </ol>
        ${h.fragment.end}
      </section>
      ${h.fragment.end}
    `
  }

  /**
   * Public render boundary checks each fragment's required context fields
   * before the shared template receives its looser implementation args.
   *
   * @param {WorkspaceArgs} args
   */
  const workspace = (args) => render(workspaceTemplate(args))

  assert.equal(
    workspace({
      context: fullContext
    }),
    fullExpected
  )
  assert.equal(
    workspace({
      fragmentId: 'account-root',
      context: {
        accountTitle: 'Account',
        accountName: 'Acme',
        accountAction: 'Save'
      }
    }),
    accountRootExpected
  )
  assert.equal(
    workspace({
      fragmentId: 'account-primary-action',
      context: { accountAction: 'Save' }
    }),
    /* html */'<button>Save</button>'
  )
  assert.equal(
    // Extra already-loaded context is allowed as long as the fragment's
    // required fields are present.
    workspace({
      fragmentId: 'account-primary-action',
      context: {
        accountTitle: 'Account',
        accountName: 'Acme',
        accountAction: 'Save'
      }
    }),
    /* html */'<button>Save</button>'
  )
  assert.equal(
    // Runtime rendering still works because missing values are omitted, but the
    // public args type catches the missing field before this reaches production.
    workspace({
      fragmentId: 'account-primary-action',
      // @ts-expect-error account-primary-action requires accountAction.
      context: {}
    }),
    /* html */'<button></button>'
  )
  assert.equal(
    workspace({
      fragmentId: 'feed-root',
      context: {
        feedTitle: 'Feed',
        itemTitle: 'New signup',
        itemMenuLabel: 'Open'
      }
    }),
    feedRootExpected
  )
  assert.equal(
    workspace({
      fragmentId: 'feed-item-menu',
      context: { itemMenuLabel: 'Open' }
    }),
    /* html */'<menu>Open</menu>'
  )
})

test('renders equivalent complex partials as composed template functions', () => {
  const fullContext = {
    accountTitle: 'Account',
    accountName: 'Acme',
    accountAction: 'Save',
    feedTitle: 'Feed',
    itemTitle: 'New signup',
    itemMenuLabel: 'Open'
  }
  const accountRootExpected = [
    /* html */
    '<section>',
    '  <h2>Account</h2>',
    '  <article>',
    '    <h3>Acme</h3>',
    '    <menu>',
    '      <button>Save</button>',
    '    </menu>',
    '  </article>',
    '</section>'
  ].join('\n')
  const feedRootExpected = [
    /* html */
    '<section>',
    '  <h2>Feed</h2>',
    '  <ol>',
    '    <li>',
    '      New signup',
    '      <menu>Open</menu>',
    '    </li>',
    '  </ol>',
    '</section>'
  ].join('\n')
  const fullExpected = /* html */`${accountRootExpected}\n${feedRootExpected}`

  /**
   * @param {AccountPrimaryActionContext} context
   */
  const accountPrimaryAction = (context) => html`
    <button>${context.accountAction}</button>
  `
  /**
   * @param {AccountCardActionsContext} context
   */
  const accountCardActions = (context) => html`
    <menu>
      ${accountPrimaryAction(context)}
    </menu>
  `
  /**
   * @param {AccountCardContext} context
   */
  const accountCard = (context) => html`
    <article>
      <h3>${context.accountName}</h3>
      ${accountCardActions(context)}
    </article>
  `
  /**
   * @param {AccountRootContext} context
   */
  const accountRoot = (context) => html`
    <section>
      <h2>${context.accountTitle}</h2>
      ${accountCard(context)}
    </section>
  `
  /**
   * @param {FeedItemMenuContext} context
   */
  const feedItemMenu = (context) => html`
    <menu>${context.itemMenuLabel}</menu>
  `
  /**
   * @param {FeedItemContext} context
   */
  const feedItem = (context) => html`
    <li>
      ${context.itemTitle}
      ${feedItemMenu(context)}
    </li>
  `
  /**
   * @param {FeedListContext} context
   */
  const feedList = (context) => html`
    <ol>
      ${feedItem(context)}
    </ol>
  `
  /**
   * @param {FeedRootContext} context
   */
  const feedRoot = (context) => html`
    <section>
      <h2>${context.feedTitle}</h2>
      ${feedList(context)}
    </section>
  `
  /**
   * @param {WorkspaceFullContext} context
   */
  const workspaceFull = (context) => html`
    ${accountRoot(context)}
    ${feedRoot(context)}
  `

  assert.equal(render(workspaceFull(fullContext)), fullExpected)
  assert.equal(render(accountRoot(fullContext)), accountRootExpected)
  assert.equal(render(accountPrimaryAction({ accountAction: 'Save' })), /* html */'<button>Save</button>')
  assert.equal(render(feedRoot(fullContext)), feedRootExpected)
  assert.equal(render(feedItemMenu({ itemMenuLabel: 'Open' })), /* html */'<menu>Open</menu>')
})

test('wrapping the whole template in a fragment is redundant', () => {
  const full = /** @type {HtmlTag<'page'>} */ (html)
  const page = /** @type {HtmlTag<'page'>} */ (html('page'))
  /**
   * @param {HtmlTag<'page'>} h
   */
  const wrapped = (h) => h/* html */`
    ${h.fragment.start('page')}
    <main>
      <h1>Title</h1>
      <p>Body</p>
    </main>
    ${h.fragment.end}
  `
  /**
   * @param {HtmlTag} h
   */
  const unwrapped = (h) => h/* html */`
    <main>
      <h1>Title</h1>
      <p>Body</p>
    </main>
  `
  const expected = /* html */'<main>\n  <h1>Title</h1>\n  <p>Body</p>\n</main>'

  assert.equal(render(wrapped(full)), expected)
  assert.equal(render(wrapped(page)), expected)
  assert.equal(render(unwrapped(html)), expected)
})

test('nested templates isolate fragment scopes', () => {
  const conflictingChild = html`
    ${html.fragment.start('dupe')}
    nested
    ${html.fragment.end}
  `

  assert.equal(
    render(html`
      ${html.fragment.start('dupe')}
      parent
      ${html.fragment.end}
      ${conflictingChild}
    `),
    'parent\nnested'
  )

  assert.throws(
    () => render(html('child')`
      <main>
        ${html`
          ${html.fragment.start('child')}
          child
          ${html.fragment.end}
        `}
      </main>
    `),
    FragmentNotFoundError
  )

  assert.equal(
    render(html`
      <main>
        ${html('child')`
          <section>
            ${html.fragment.start('child')}
            child
            ${html.fragment.end}
          </section>
        `}
      </main>
    `),
    /* html */'<main>\n  child\n</main>'
  )
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
