// Type exports only. Do not add runtime implementations to this module.
import type { HtmlResult } from './html-result.js'
import type { RawHtml } from './raw.js'

declare const fragmentArgContextBrand: unique symbol

/**
 * Fragment boundary token created by `html.fragment.start(id)`.
 */
export type FragmentStartBoundary<FragmentId extends string = string> = {
  readonly kind: 'start'
  readonly id: FragmentId
}

/**
 * Fragment boundary token exposed as `html.fragment.end`.
 */
export type FragmentEndBoundary = {
  readonly kind: 'end'
}

/**
 * Any fragment boundary token accepted as a direct template substitution.
 */
export type FragmentBoundary<FragmentId extends string = string> =
  FragmentStartBoundary<FragmentId> | FragmentEndBoundary

/**
 * Fragment helpers available on `html` and `frag(...)` tags.
 */
export type FragmentHelpers<FragmentId extends string = string> = {
  start: (id: FragmentId) => FragmentStartBoundary<FragmentId>
  end: FragmentEndBoundary
}

/**
 * Options for selecting a fragment while rendering a template.
 */
export type RenderOptions<FragmentId extends string = string> = {
  fragmentId?: FragmentId | undefined
}

/**
 * Cached static template data retained by an `HtmlResult`.
 */
export type CompiledTemplate = {
  strings: readonly string[]
}

/**
 * Primitive values that can be safely interpolated into an HTML template.
 */
export type HtmlPrimitiveSubstitution = string | number | bigint | boolean | null | undefined

/**
 * Non-array values accepted inside array substitutions.
 */
export type HtmlArrayScalarSubstitution = HtmlPrimitiveSubstitution | HtmlResult | RawHtml

/**
 * Recursive array item type accepted by HTML template substitutions.
 */
export type HtmlArraySubstitution =
  HtmlArrayScalarSubstitution | readonly HtmlArraySubstitution[]

/**
 * Any value accepted in a template substitution position.
 */
export type HtmlSubstitution<FragmentId extends string = string> =
  HtmlArraySubstitution | FragmentBoundary<FragmentId>

/**
 * Static string segments passed to a tagged template function.
 */
export type TemplateStrings = TemplateStringsArray | readonly string[]

/**
 * Callable `html`/`frag` tag type, optionally parameterized by known fragment names.
 */
export type HtmlTag<FragmentId extends string = string> =
  ((strings: TemplateStrings, ...substitutions: HtmlSubstitution<FragmentId>[]) => HtmlResult) &
  (<NextFragmentId extends string = string>(
    options?: RenderOptions<NextFragmentId> | string
  ) => HtmlTag<NextFragmentId>) & {
    fragment: FragmentHelpers<FragmentId>
    raw: (value: unknown) => RawHtml
  }

/**
 * Flattens an intersection into a readable object shape in editor hovers.
 */
export type Simplify<Type> = {
  [Key in keyof Type]: Type[Key]
} & {}

/**
 * Makes every property optional and flattens the resulting object shape.
 */
export type Optional<Type> = Simplify<Partial<Type>>

/**
 * Extracts every property key from a union of object types.
 */
export type KeysOfUnion<Type> =
  Type extends unknown
    ? keyof Type
    : never

/**
 * Merges a union of object types with every property optional.
 *
 * If multiple union members define the same property, the property type is the
 * union of every member's value for that property.
 */
export type OptionalMerge<Type> = Simplify<{
  [Key in KeysOfUnion<Type>]?: Type extends unknown
    ? Key extends keyof Type
      ? Type[Key]
      : never
    : never
}>

/**
 * Converts a union type into an intersection type.
 */
export type UnionToIntersection<Type> =
  (Type extends unknown ? (value: Type) => void : never) extends
  (value: infer Intersection) => void
    ? Intersection
    : never

/**
 * Creates a loose implementation context from a tuple of contexts.
 *
 * Every tuple member except the last is merged in as optional fields. The last
 * tuple member remains required and should be the smallest context needed by
 * every render target.
 */
export type LooseContext<Contexts extends readonly unknown[]> =
  Contexts extends readonly [...infer OptionalContexts, infer RequiredContext]
    ? Simplify<Partial<UnionToIntersection<OptionalContexts[number]>> & RequiredContext>
    : never

/**
 * Allows a render context to include additional caller data while preserving
 * the fields required by a fragment or full-template render target.
 */
export type WithExtraContext<Context> =
  Context extends object
    ? Context & Record<string, unknown>
    : Context

type FragmentArgContextBrand<Context> = {
  readonly [fragmentArgContextBrand]?: Context
}

/**
 * Builds a render argument union from fragment contexts plus a full-page context.
 *
 * Each context requires the fields for its render target and permits extra
 * caller data. This keeps already-loaded full contexts usable for smaller
 * fragment renders while still catching missing required fields.
 */
export type FragmentArgs<
  Fragments extends Record<string, unknown>,
  FullContext
> =
  | {
      [FragmentId in keyof Fragments & string]: {
        fragmentId: FragmentId
        context: WithExtraContext<Fragments[FragmentId]>
      } & FragmentArgContextBrand<Fragments[FragmentId]>
    }[keyof Fragments & string]
  | ({
      fragmentId?: undefined
      context: WithExtraContext<FullContext>
    } & FragmentArgContextBrand<FullContext>)

/**
 * Extracts the fragment ID union from a render argument union.
 */
export type FragmentIdOf<Args> =
  Args extends { fragmentId: infer FragmentId }
    ? Extract<FragmentId, string>
    : never

/**
 * Extracts the union of all `context` values from a render argument union.
 */
export type ContextOf<Args> =
  Args extends unknown
    ? typeof fragmentArgContextBrand extends keyof Args
      ? Args extends FragmentArgContextBrand<infer Context>
        ? Context
        : never
      : Args extends { context: infer Context }
          ? Context
          : never
    : never

/**
 * Extracts the `context` type for a specific fragment ID from a render argument union.
 */
export type ContextForFragment<Args, FragmentId> =
  Args extends { fragmentId: FragmentId }
    ? ContextOf<Args>
    : never

/**
 * Context type for implementing one template with multiple fragment targets.
 *
 * Fields from every render target are merged and made optional because the
 * required context fields are enforced at the public `FragmentArgs` boundary.
 */
export type FragmentTemplateContext<Args> =
  OptionalMerge<ContextOf<Args>>

/**
 * Argument type for implementing one template with multiple fragment targets.
 *
 * The context is the looser implementation context, while `fragmentId` is
 * limited to the fragment IDs declared by the render argument union.
 */
export type FragmentTemplateArgs<Args> =
  Simplify<
    {
      context: FragmentTemplateContext<Args>
    } & RenderOptions<FragmentIdOf<Args>>
  >

/**
 * Bundles the public and internal types for one fragment-marked template.
 *
 * `fragments` maps fragment IDs to their required context types. `full` is the
 * context required to render the full template.
 */
export type FragmentTemplateTypes<
  Template extends {
    fragments: Record<string, unknown>
    full: unknown
  }
> = {
  fragmentId: keyof Template['fragments'] & string
  args: FragmentArgs<Template['fragments'], Template['full']>
  context: FragmentTemplateContext<
    FragmentArgs<Template['fragments'], Template['full']>
  >
  templateArgs: FragmentTemplateArgs<
    FragmentArgs<Template['fragments'], Template['full']>
  >
}
