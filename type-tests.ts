import html, { frag, raw, render } from './index.js'
import type {
  FragmentBoundary,
  FragmentEndBoundary,
  FragmentHelpers,
  FragmentIdOf,
  FragmentStartBoundary,
  FragmentTemplateArgs,
  FragmentTemplateContext,
  FragmentTemplateTypes,
  ContextForFragment,
  ContextOf,
  FragmentArgs,
  HtmlArrayScalarSubstitution,
  HtmlArraySubstitution,
  HtmlPrimitiveSubstitution,
  HtmlResult,
  HtmlSubstitution,
  HtmlTag,
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
const typedResult: HtmlResult = h/* html */`<span>${safeText}</span>`
const typedRaw: RawHtml = trusted
const typedSubstitution: HtmlSubstitution<ContentFragment> = child
const typedTag: HtmlTag<ContentFragment> = h
const typedOptions: RenderOptions<ContentFragment> = { fragmentId: 'content' }
const typedBoundary: FragmentBoundary<ContentFragment> = h.fragment.start('content')
const typedStartBoundary: FragmentStartBoundary<ContentFragment> = h.fragment.start('content')
const typedEndBoundary: FragmentEndBoundary = h.fragment.end
const typedFragmentHelpers: FragmentHelpers<ContentFragment> = h.fragment
const typedTemplateStrings: TemplateStrings = [''] as const
type IntersectedContext = UnionToIntersection<{ foo: string } | { title: string }>
type SimplifiedContext = Simplify<IntersectedContext & { text: string }>
type OptionalContext = Optional<SimplifiedContext>
type ContextWithExtra = WithExtraContext<InnerPageContext>
type MergedContext = OptionalMerge<{ id: string, foo: string } | { id: number, title: string }>
type MergedContextKeys = KeysOfUnion<{ id: string, foo: string } | { id: number, title: string }>

type InnerPageContext = {
  text: string
}
type OuterPageContext = InnerPageContext & {
  title: string
}
type FullPageContext = OuterPageContext & {
  foo: string
}
type ProfileActionsContext = {
  targetId: string
  actionLabel: string
}
type ProfileContext = ProfileActionsContext & {
  profileName: string
}
type ActivityRowContext = {
  targetId: number
  rowTitle: string
}
type ActivityContext = ActivityRowContext & {
  activityTitle: string
}
type DashboardFullContext = {
  targetId: string | number
  profileName: string
  actionLabel: string
  activityTitle: string
  rowTitle: string
}
type PageContextFromTuple = LooseContext<[
  FullPageContext,
  OuterPageContext,
  InnerPageContext
]>
type PageArgsFromFragments = FragmentArgs<{
  inner: InnerPageContext
  outer: OuterPageContext
}, FullPageContext>
type PageTemplateTypes = FragmentTemplateTypes<{
  fragments: {
    inner: InnerPageContext
    outer: OuterPageContext
  }
  full: FullPageContext
}>
type PageContextFromArgs = FragmentTemplateContext<PageArgsFromFragments>
type PageTemplateArgsFromArgs = FragmentTemplateArgs<PageArgsFromFragments>
type PageArgsFromTypes = PageTemplateTypes['args']
type PageTemplateArgsFromTypes = PageTemplateTypes['templateArgs']
type PageContextFromTypes = PageTemplateTypes['context']
type PageFragmentIdFromArgs = FragmentIdOf<PageArgsFromFragments>
type PageFragmentIdFromTypes = PageTemplateTypes['fragmentId']
type AnyPageContext = ContextOf<PageArgsFromFragments>
type OuterFragmentContext = ContextForFragment<PageArgsFromFragments, 'outer'>
type DashboardTemplateTypes = FragmentTemplateTypes<{
  fragments: {
    profile: ProfileContext
    'profile-actions': ProfileActionsContext
    activity: ActivityContext
    'activity-row': ActivityRowContext
  }
  full: DashboardFullContext
}>
type DashboardArgs = DashboardTemplateTypes['args']
type DashboardTemplateContext = DashboardTemplateTypes['context']
type DashboardTemplateArgs = DashboardTemplateTypes['templateArgs']
type DashboardFragmentId = DashboardTemplateTypes['fragmentId']

const typedSimplifiedContext: SimplifiedContext = { foo: 'Foo', title: 'Title', text: 'Text' }
const typedOptionalContext: OptionalContext = {}
const typedContextWithExtra: ContextWithExtra = { text: 'Text', alreadyLoaded: true }
const mergedContextStringId: MergedContext = { id: 'ID', foo: 'Foo' }
const mergedContextNumberId: MergedContext = { id: 1, title: 'Title' }
const mergedContextKey: MergedContextKeys = 'title'
const tupleContextMinimum: PageContextFromTuple = { text: 'Text' }
const tupleContextFull: PageContextFromTuple = { foo: 'Foo', title: 'Title', text: 'Text' }
const argsContextMinimum: PageContextFromArgs = {}
const argsContextFull: PageContextFromArgs = { foo: 'Foo', title: 'Title', text: 'Text' }
const templateArgsMinimum: PageTemplateArgsFromArgs = {
  fragmentId: 'inner',
  context: {}
}
const templateArgsFull: PageTemplateArgsFromTypes = {
  context: { foo: 'Foo', title: 'Title', text: 'Text' }
}
const typesContextMinimum: PageContextFromTypes = { text: 'Text' }
const pageFragmentIdFromArgs: PageFragmentIdFromArgs = 'inner'
const pageFragmentIdFromTypes: PageFragmentIdFromTypes = 'outer'
const anyPageContext: AnyPageContext = { foo: 'Foo', title: 'Title', text: 'Text' }
const outerFragmentContext: OuterFragmentContext = { title: 'Title', text: 'Text' }
const innerPageArg: PageArgsFromFragments = { fragmentId: 'inner', context: { text: 'Text' } }
const innerPageArgWithExtraContext: PageArgsFromFragments = {
  fragmentId: 'inner',
  context: {
    text: 'Text',
    foo: 'Already loaded full-page data'
  }
}
const innerPageArgFromTypes: PageArgsFromTypes = { fragmentId: 'inner', context: { text: 'Text' } }
const outerPageArg: PageArgsFromFragments = {
  fragmentId: 'outer',
  context: { title: 'Title', text: 'Text' }
}
const fullPageArg: PageArgsFromFragments = {
  context: { foo: 'Foo', title: 'Title', text: 'Text' }
}
const profileDashboardArg: DashboardArgs = {
  fragmentId: 'profile',
  context: { targetId: 'profile-id', profileName: 'Bret', actionLabel: 'Edit' }
}
const activityDashboardArg: DashboardArgs = {
  fragmentId: 'activity',
  context: { targetId: 1, activityTitle: 'Activity', rowTitle: 'Row' }
}
const fullDashboardArg: DashboardArgs = {
  context: {
    targetId: 'full-id',
    profileName: 'Bret',
    actionLabel: 'Edit',
    activityTitle: 'Activity',
    rowTitle: 'Row'
  }
}
const dashboardTemplateContextStringId: DashboardTemplateContext = { targetId: 'profile-id' }
const dashboardTemplateContextNumberId: DashboardTemplateContext = { targetId: 1 }
const dashboardTemplateContextEmpty: DashboardTemplateContext = {}
const dashboardTemplateArgs: DashboardTemplateArgs = {
  fragmentId: 'activity-row',
  context: { targetId: 1 }
}
const dashboardFragmentId: DashboardFragmentId = 'profile-actions'

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
void typedSimplifiedContext
void typedOptionalContext
void typedContextWithExtra
void mergedContextStringId
void mergedContextNumberId
void mergedContextKey
void tupleContextMinimum
void tupleContextFull
void argsContextMinimum
void argsContextFull
void templateArgsMinimum
void templateArgsFull
void typesContextMinimum
void pageFragmentIdFromArgs
void pageFragmentIdFromTypes
void anyPageContext
void outerFragmentContext
void innerPageArg
void innerPageArgWithExtraContext
void innerPageArgFromTypes
void outerPageArg
void fullPageArg
void profileDashboardArg
void activityDashboardArg
void fullDashboardArg
void dashboardTemplateContextStringId
void dashboardTemplateContextNumberId
void dashboardTemplateContextEmpty
void dashboardTemplateArgs
void dashboardFragmentId

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

// @ts-expect-error loose contexts still require the base fragment context.
const tupleContextMissingBase: PageContextFromTuple = { title: 'Title' }

// @ts-expect-error template contexts still reject unknown fields.
const argsContextUnknownField: PageContextFromArgs = { unknown: 'Unknown' }

// @ts-expect-error optional merged fields preserve the union of known value types.
const mergedContextWrongId: MergedContext = { id: true }

// @ts-expect-error generated outer fragment args require outer context fields.
const outerPageArgMissingTitle: PageArgsFromFragments = {
  fragmentId: 'outer',
  context: { text: 'Text' }
}

const unknownFragmentArg: PageArgsFromFragments = {
  // @ts-expect-error generated fragment args only allow declared fragment names.
  fragmentId: 'missing',
  context: { text: 'Text' }
}
void unknownFragmentArg

const unknownTemplateFragmentArg: PageTemplateArgsFromTypes = {
  // @ts-expect-error template args only allow declared fragment names.
  fragmentId: 'missing',
  context: { text: 'Text' }
}
void unknownTemplateFragmentArg

const profileDashboardArgWrongId: DashboardArgs = {
  fragmentId: 'profile',
  // @ts-expect-error profile fragment context requires a string target ID.
  context: {
    targetId: 1,
    profileName: 'Bret',
    actionLabel: 'Edit'
  }
}
void profileDashboardArgWrongId

const profileDashboardArgMissingChildContext: DashboardArgs = {
  fragmentId: 'profile',
  // @ts-expect-error parent fragment context includes the nested profile actions context.
  context: { targetId: 'profile-id', profileName: 'Bret' }
}
void profileDashboardArgMissingChildContext

const dashboardTemplateContextWrongId: DashboardTemplateContext = {
  // @ts-expect-error optional merged context preserves the union of known target ID types.
  targetId: true
}
void dashboardTemplateContextWrongId

// @ts-expect-error dashboard fragment IDs only allow declared fragment names.
const unknownDashboardFragmentId: DashboardFragmentId = 'missing'
void unknownDashboardFragmentId
