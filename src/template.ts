/*
 * Copyright © 2025-2026 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Client-driven resource retrieval.
 *
 * Defines types for specifying the data envelope to retrieve in REST/JSON APIs, including property selection, linked
 * resource expansion, and, for collections, filtering, sorting, and pagination.
 *
 * <img src="template.svg" alt="Model type hierarchy" style="zoom: 1.75; display: block; margin: auto;" />
 *
 * > [!NOTE]
 * > QEST's [design rationale](./index.md#5-client-driven-retrieval) covers the client-driven retrieval approach;
 * > [Appendix A](./index.md#appendix-a-target-backends) covers cross-backend semantics and normalisation.
 *
 * **Data model**
 *
 * - {@link Template} — Resource retrieval template
 * - {@link Placeholders} — Property value set template
 * - {@link Placeholder} — Property value template
 * - {@link Model} — Value retrieval template
 * - {@link Query} — Collection retrieval template
 * - {@link Locale} — Localised text template (structured language-tagged value)
 * - {@link Union} — Union-typed property template
 * - {@link UnionKey} — Union variant key
 * - {@link Projection} — Collection property projection
 * - {@link Selection} — Collection retrieval constraints
 * - {@link Binding} — Named computed expression
 * - {@link Expression} — Computed expression
 * - {@link Pipe} — Transform pipe
 * - {@link Path} — Property path
 * - {@link Options} — Constraint option set
 * - {@link Option} — Constraint option
 * - {@link Probe} — Parsed {@link Selection} or {@link Projection} key
 * - {@link Operator} — Constraint operator symbols
 * - {@link Transform} — Value transforms for computed {@link Expression | expressions}
 * - {@link TransformSignature} — Static typing profile of a {@link Transform}
 *
 * **Type inference**
 *
 * - {@link Instance} — Infers the {@link Resource} type fetched by a {@link Template}
 * - {@link Slots} — Projects a template-shaped object through {@link Instance}
 * - {@link Name} — Projects an {@link Instance} property key to its output name
 *
 * **Type guards**
 *
 * - {@link isTemplate} — checks if a value is a {@link Template}
 * - {@link isPlaceholders} — checks if a value is a {@link Placeholders} set
 * - {@link isPlaceholder} — checks if a value is a {@link Placeholder}
 * - {@link isModel} — checks if a value is a {@link Model} single-value template
 * - {@link isQuery} — checks if a value is a {@link Query}
 * - {@link isLocale} — checks if a value is a {@link Locale}
 * - {@link isUnion} — checks if a value is a {@link Union}
 * - {@link isUnionKey} — checks if a value is a {@link UnionKey | Union variant key}
 * - {@link isProjection} — checks if a value is a {@link Projection}
 * - {@link isSelection} — checks if a value is a {@link Selection}
 * - {@link isBinding} — checks if a value is a {@link Binding}
 * - {@link isExpression} — checks if a value is an {@link Expression}
 * - {@link isOptions} — checks if a value is an {@link Options} set
 * - {@link isOption} — checks if a value is an {@link Option}
 * - {@link isProbe} — checks if a value is a {@link Probe}
 * - {@link isSelector} — checks if a value is a valid {@link Selection} entry key
 * - {@link isOperator} — checks if a value is an {@link Operator}
 * - {@link isTransform} — checks if a value is a {@link Transform}
 * - {@link isAggregate} — checks whether a value is an aggregate {@link Transform}
 * - {@link isVacuous} — checks if a value is vacuous per the template elision rule
 *
 * **Codecs**
 *
 * - {@link encodeTemplate} — encode a {@link Template} as URL-safe JSON
 * - {@link decodeTemplate} — decode a {@link Template} from URL-safe JSON
 * - {@link encodeSelection} — encode a {@link Selection} as a form-urlencoded string
 * - {@link decodeSelection} — decode a {@link Selection} from a form-urlencoded string
 * - {@link encodeProbe} — encode a {@link Probe} as a key string
 * - {@link decodeProbe} — decode a {@link Probe} from a key string
 *
 * # Retrieval Patterns
 *
 * ## Resource Retrieval
 *
 * A {@link Template} specifies which properties to retrieve from a single {@link Resource} and how deeply to
 * expand linked resources. No over-fetching of unwanted fields, no under-fetching requiring additional calls:
 *
 * ```typescript
 * const template: Template = {
 *   id: "",               // resource identifier
 *   name: "",             // string property
 *   price: 0,             // numeric property
 *   available: true,      // boolean property
 *   vendor: {             // nested resource
 *     id: "",
 *     name: ""
 *   }
 * };
 * ```
 *
 * ## Collection Retrieval
 *
 * A {@link Query} specifies how to retrieve a {@link Resource} collection — the collection-shaped counterpart of
 * {@link Template}, combining a per-item element (a scalar, a nested `Template` (or per-branch {@link Union}), or
 * a {@link Projection} for computed aggregates) with a {@link Selection} for filtering, ordering, and pagination.
 * Collection queries appear inside a managing resource
 * that owns the collection, following REST/JSON best practices. A collection is a tuple pairing the per-item
 * element with an optional {@link Selection} — a single call retrieves filtered, sorted, and paginated results
 * with arbitrarily deep expansions, no over-fetching, no under-fetching:
 *
 * ```typescript
 * const template: Template = {
 *   items: [
 *     {                                        // per-item element (a nested Template)
 *       id: "",
 *       name: "",
 *       price: 0,
 *       vendor: { id: "", name: "" }           // nested resource
 *     },
 *     {                                        // collection-wide Selection
 *       ">=price": 50,                         // price ≥ 50
 *       "<=price": 150,                        // price ≤ 150
 *       "~name": "widget",                     // name contains "widget"
 *       "?category": ["electronics", "home"],  // category in list
 *       "^price": 1,                           // sort by price ascending
 *       "^name": -2,                           // then by name descending
 *       "@": 0,                                // skip first 0 results
 *       "#": 25                                // return at most 25 results
 *     }
 *   ]
 * };
 * ```
 *
 * ## Localised Text
 *
 * For multilingual properties, use {@link Locale} templates with {@link TagRange} keys to select language
 * tags to retrieve. Within a single map, all tag-range-keyed values must be uniformly scalar or uniformly
 * array:
 *
 * ```typescript
 * const template: Template = {
 *   id: "",
 *   title: { "*": "" },                   // all available languages
 *   description: { "en": "", "fr": "" },  // English or French
 *   keywords: { "en": [""], "fr": [""] }  // multi-valued, English or French
 * };
 * ```
 *
 * A localised property is a single structured value, the localised counterpart of a nested resource
 * rather than a multi-valued property: a language-tagged {@link Text} map reached through
 * {@link Locale} as its own {@link Placeholders} arm. The `TagRange` keys are RFC 4647 basic language
 * ranges that filter which locales populate the map (the standalone `*` matches every tag, and a plain
 * range such as `en` also matches more specific tags like `en-US`), while the per-tag value
 * shape (`""` or `[""]`) only selects each entry's cardinality. Tag ranges select retrieved content only and
 * are independent of {@link Selection}: a `Locale` map carries `TagRange` keys, never `Selection` operator keys.
 * Resource matching by localised text is done separately, at the enclosing collection's `Selection` via `?`/`!`.
 *
 * > [!IMPORTANT]
 * > The `@none` key for non-localised values is not supported; use the `und` tag for language-neutral
 * > values.
 *
 * ## Computed Properties
 *
 * {@link Projection | Projections} can define computed properties using {@link Expression | expressions} combining
 * property paths with {@link Transform}.
 *
 * Plain transforms operate on individual values and may project scalar literals, linked resource references,
 * nested {@link Template | templates} expanding a linked resource inline, or {@link Locale} tag-range maps
 * declaring a localised cell that yields a complete {@link Text} value per row:
 *
 * ```typescript
 * const projection: Projection = {
 *   id: "",
 *   name: "",
 *   price: 0,
 *   "vendorName=vendor.name": "",            // property path
 *   "releaseYear=year:releaseDate": 0,       // transform
 *   "vendorRow=vendor": { id: "", name: "" }, // nested template
 *   "label=title": { "*": "" }                // localised cell (full Text value per row)
 * };
 * ```
 *
 * ## Aggregate Grouping
 *
 * Aggregate {@link Transform | transforms} operate on sets of values. When at least one aggregate
 * {@link Expression} appears in a {@link Projection} or the sibling {@link Selection}, the query is
 * evaluated under grouped semantics; otherwise every row is projected independently and no grouping
 * applies.
 *
 * Under grouped semantics, each operator's role is determined by whether its expression references an
 * aggregate transform:
 *
 * - **Projection bindings** — non-aggregate bindings contribute to the grouping key and appear
 *   verbatim in the output row; aggregate bindings compute per-group summaries
 * - **Filter constraints** — non-aggregate filters restrict the input set before grouping; aggregate
 *   filters select groups after aggregation
 * - **Ordering expressions** — a non-aggregate ordering expression sorts the groups by one of the
 *   grouping keys; an aggregate ordering expression sorts them by its post-aggregation value
 *
 * Grouping is fixed by the projection alone and is never inferred from a sort key: a non-aggregate
 * ordering expression must reference an existing grouping key, and processors must reject one that
 * matches none.
 *
 * Rows sharing the same grouping-key values collapse into a single group. Aggregate filter and
 * ordering constraints are independent of any projected bindings: an aggregate may appear in a
 * constraint without being projected, and a projected aggregate may appear without being constrained.
 *
 * Aggregate expressions use bag semantics over their inputs: `count:` (empty path) returns the
 * number of rows in scope; a non-empty path (for example, `sum:price`) ranges over the values
 * resolved by the path for each input row, with multi-valued path fan-outs contributing every
 * resolved value individually. No implicit deduplication is applied — clients needing
 * distinct-value aggregates project the value of interest as a non-aggregate grouping binding.
 *
 * ```typescript
 * const template: Template = {
 *   items: [{
 *     vendor: { id: "", name: "" },    // group by vendor
 *     "items=count:": 0,               // count of items per vendor
 *     "avgPrice=avg:price": 0          // average price per vendor
 *   }]
 * };
 * ```
 *
 * See [Aggregate Transforms](./index.md#5821-aggregate-transforms) for the transform catalogue and
 * cross-backend semantics.
 *
 * ## Faceted Search
 *
 * Aggregates enable faceted search patterns, computing category counts, value ranges, and totals in a single call:
 *
 * ```typescript
 * // Category facet with product counts
 *
 * const categoryFacet: Template = {
 *   items: [{
 *     "category": "",
 *     "count=count:": 0,
 *     "^count": "desc"
 *   }]
 * };
 *
 * // → { items: [
 * //      { category: "Electronics", count: 150 },
 * //      { category: "Home", count: 89 }
 * //    ]}
 *
 * // Price range for slider bounds
 *
 * const priceRange: Template = {
 *   items: [{
 *     "min=min:price": 0,
 *     "max=max:price": 0
 *   }]
 * };
 *
 * // → { items: [{ min: 9.99, max: 1299.00 }] }
 *
 * // Total product count
 *
 * const productCount: Template = {
 *   items: [{
 *     "count=count:": 0
 *   }]
 * };
 *
 * // → { items: [{ count: 284 }] }
 * ```
 *
 * ## Union Branches
 *
 * For properties whose declared range is a union type, a {@link Union} declares per-branch retrieval by mapping
 * opaque keys to the {@link Placeholder} to fetch for each variant of interest. The keys carry no positional or
 * nominal meaning: the variant a placeholder retrieves is fixed by matching it against the property's declared
 * variants, and an unmatched variant is skipped at runtime:
 *
 * ```typescript
 * const template: Template = {
 *   id: "",
 *   creator: {
 *     "0": { id: "", name: "" },       // a person-shaped branch
 *     "1": { id: "", legalName: "" }   // an organisation-shaped branch
 *   }
 * };
 * ```
 *
 * # Expressions
 *
 * {@link Probe} keys identify properties or computed values combining an optional result name (forming a
 * {@link Binding}), a pipeline of {@link Transform}, and a property path ({@link Expression}):
 *
 * ```text
 * expression  = ( name '=' )? transform* path?
 * name        = identifier
 * transform   = identifier ':'
 * path        = identifier ( '.' identifier )*
 * ```
 *
 * - Identifiers follow {@link Identifier} rules (ECMAScript names)
 * - Transforms form a pipeline applied right-to-left (functional composition order)
 * - An empty path computes aggregates over the input collection
 *
 * ```text
 * name                         // simple property
 * user.profile.email           // nested property path
 * total=sum:items.price        // named computed sum
 * round:avg:scores             // pipeline: inner transform applied first
 * count:                       // empty path (aggregate over collection)
 * ```
 *
 * # Value Ordering
 *
 * Comparison (`<`, `>`, `<=`, `>=`) and sort (`^`) operators rely on a total ordering over values defined by the
 * {@link https://www.w3.org/TR/xpath-functions-20/#comparison-operators XPath 2.0 comparison operators}, which are in
 * turn based on {@link https://www.w3.org/TR/xmlschema11-2/#rf-order XSD ordered value spaces}. These operators, along
 * with sort focus (`+`), target {@link Literal} values only;
 * {@link https://metreeca.github.io/core/types/resource.IRI.html IRI} references, nested {@link Template} resources,
 * and {@link Text} values are neither comparable nor sortable:
 *
 * - `null` — undefined values sort before all defined values
 * - `boolean` — `false` < `true`
 * - `number` — {@link https://www.w3.org/TR/xpath-functions/#func-numeric-less-than standard numeric} ordering;
 *   `NaN` is unordered
 * - `string` — {@link https://www.w3.org/TR/xpath-functions/#func-compare Unicode codepoint} collation
 *
 * > [!WARNING]
 * > Cross-type comparisons and values that fall outside these rules produce
 * > unpredictable, system-dependent results.
 *
 * # Type Inference
 *
 * {@link Instance} infers the type of the {@link Resource} fetched by a given {@link Template},
 * so client code can declare strongly-typed result variables without restating the type:
 *
 * ```typescript
 * const template = {
 *   id: "",
 *   name: "",
 *   tags: [""],
 *   vendor: { id: "", name: "" }
 * } satisfies Template;
 *
 * type ProductView = Instance<typeof template>;
 * // → {
 * //     readonly id: Reference;
 * //     readonly name: string;
 * //     readonly tags: readonly string[];
 * //     readonly vendor: { readonly id: Reference; readonly name: string };
 * //   }
 * ```
 *
 * The projection drops {@link Selection} metadata, widens collection tuples into homogeneous arrays,
 * projects a {@link Union} into a union of per-branch results, recurses through
 * nested templates and collection projections, and reduces each {@link Binding} key in a nested
 * {@link Projection} to its {@link Identifier} portion, mirroring how the runtime materialises a fetched resource.
 *
 * # Serialisation
 *
 * ## Template Serialisation
 *
 * {@link Template} objects are serialised as JSON via {@link encodeTemplate} / {@link decodeTemplate}, with IRI
 * internalisation and resolution handled transparently. The encoder emits plain JSON by default and optionally
 * URL-encoded JSON or URL-safe base64url-encoded JSON for transport; the decoder auto-detects the input encoding.
 *
 * ## Selection Serialisation
 *
 * {@link Selection} objects are serialised as
 * [`application/x-www-form-urlencoded`](https://url.spec.whatwg.org/#application/x-www-form-urlencoded) strings via
 * {@link encodeSelection} / {@link decodeSelection} for transmission as URL query strings in GET requests.
 *
 * > [!WARNING]
 * >
 * > Form serialisation specifies only selection constraints; servers are expected to convert to a collection template
 * > by wrapping inside the target endpoint's collection property and providing a default resource retrieval template.
 *
 * The format encodes queries as `label=value` pairs where:
 *
 * - Labels use the same prefixed operator syntax as {@link Selection} constraint keys
 * - Each pair carries a single value; repeated labels are merged into arrays where accepted
 * - Postfix aliases provide natural form syntax for some operators:
 *   - `expression=value` for `?expression=value` (disjunctive matching)
 *   - `expression<=value` for `<=expression=value` (less than or equal)
 *   - `expression>=value` for `>=expression=value` (greater than or equal)
 *
 * Values use [JSON](https://www.rfc-editor.org/rfc/rfc8259) primitive syntax, with a {@link Text}
 * string inlined through a single postfix `@tag` suffix:
 *
 * ```text
 * value       = null | literal | tagged
 * literal     = boolean | number | string
 * tagged      = string '@' tag
 * tag         = BCP 47 language tag
 * ```
 *
 * - {@link IRI}s are serialised as strings
 * - A string may carry a single `@tag` suffix, lifting it into a one-entry {@link Text} map
 *   (for example, `"text"@en` decodes to `{ en: "text" }`)
 * - The encoder always produces double-quoted strings; the decoder accepts unquoted strings as a shorthand
 *
 * **Encoding notes:**
 *
 * - Some operator characters are unreserved in RFC 3986 and remain unencoded: `~` (like), `!` (all)
 * - Reserved characters in values are percent-encoded: `&` (separator), `=` (key/value), `+` (space), `%` (escape)
 *
 * > [!WARNING]
 * > Numeric-looking values like `123` are parsed as numbers unless double-quoted.
 *
 * ```text
 * category=electronics
 *   &category=home
 *   &~name=widget
 *   &price>=50
 *   &price<=150
 *   &^price=asc
 *   &@=0
 *   &#=25
 * ```
 *
 * This query:
 *
 * 1. Filters items where `category` is "electronics" OR "home"
 * 2. Filters items where `name` contains "widget"
 * 3. Filters items where `price` is between 50 and 150 (inclusive)
 * 4. Sorts results by `price` ascending
 * 5. Returns the first 25 items (offset 0, limit 25)
 *
 * @document ./index.md
 *
 * @module
 */

import { Identifier, isArray, isIdentifier, isObject, isString } from "@metreeca/core";
import { decodeBase64, encodeBase64 } from "@metreeca/core/base64";
import { immutable } from "@metreeca/core/deep";
import { TagRange } from "@metreeca/core/language";
import { error } from "@metreeca/core/report";
import type { IRI } from "@metreeca/core/resource";
import { internalize, isIRI, resolve } from "@metreeca/core/resource";
import { type DecoderOpts, defaultBase, type EncoderOpts, type Literal, type Reference } from "./index.js";
import { Resource, Text } from "./resource.js";
import { isProbe, isSelection, isTemplate } from "./template.core.js";
import * as QueryParser from "./template.pegjs.js";

export * from "./template.core.js";


/**
 * Transform signature table.
 *
 * Maps each {@link Transform} to its {@link TransformSignature}, the single source of truth for how a transform
 * validates its input and shapes its output. Processors consult this table to reject out-of-domain inputs and to
 * derive the aggregation kind, cardinality, and processing type of the resulting pipe.
 *
 * @see {@link TransformSignature} for the meaning of each signature field
 */
export const Transforms: Record<Transform, TransformSignature> = immutable({

	count: { aggregate: "total", accepts: "any", returns: "integer" },
	min: { aggregate: "partial", accepts: "literal", returns: "same" },
	max: { aggregate: "partial", accepts: "literal", returns: "same" },
	sum: { aggregate: "total", accepts: "numeric", returns: "same" },
	avg: { aggregate: "partial", accepts: "numeric", returns: "decimal" },

	abs: { aggregate: false, accepts: "numeric", returns: "same" },
	floor: { aggregate: false, accepts: "numeric", returns: "same" },
	ceil: { aggregate: false, accepts: "numeric", returns: "same" },
	round: { aggregate: false, accepts: "numeric", returns: "same" },

	lower: { aggregate: false, accepts: "string", returns: "same" },
	upper: { aggregate: false, accepts: "string", returns: "same" },
	length: { aggregate: false, accepts: "string", returns: "integer" },

	year: { aggregate: false, accepts: "temporal", returns: "integer" },
	month: { aggregate: false, accepts: "temporal", returns: "integer" },
	day: { aggregate: false, accepts: "temporal", returns: "integer" },
	hours: { aggregate: false, accepts: "temporal", returns: "integer" },
	minutes: { aggregate: false, accepts: "temporal", returns: "integer" },
	seconds: { aggregate: false, accepts: "temporal", returns: "decimal" }

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resource retrieval template.
 *
 * Recursively nested property map describing which {@link Resource} property values to retrieve
 * and how deeply to expand linked resources. Property keys are arbitrary {@link Identifier} names;
 * each property maps to a {@link Placeholders} value, or `undefined`, marking an optional slot that
 * exists in the schema but may be absent at runtime.
 *
 * > [!IMPORTANT]
 * > Placeholder values must match the type possibly declared by schemas for their {@link Identifier} keys;
 * > processors must reject queries that provide mismatched templates with an error. The `Template`
 * > type catches the most obvious structural errors at compile time, but full structural integrity
 * > (including well-formedness of nested templates and validity of inline {@link Selection} slots) is
 * > enforced at runtime by template validators.
 *
 * > [!NOTE]
 * > Primitive template values serve as type placeholders; their actual value is immaterial. An empty
 * > `Template` (`{}`), whether it appears directly as a property value or as a collection tuple's element,
 * > carries no retrieval instructions and must be ignored by processors as if the owning property were omitted
 * > from the enclosing template. A collection tuple whose element is an empty `Template`, carrying only a
 * > {@link Selection} and no per-item retrieval, is vacuous for the same reason and must be ignored likewise,
 * > discarding any attached {@link Selection} constraints. Top-level form-serialised selection-only queries are
 * > unaffected: servers substitute
 * > the endpoint's default retrieval template before the elision rule applies.
 *
 * @see {@link Query} for the collection counterpart
 * @see {@link Placeholders} for the umbrella admitting both resource and collection-valued forms
 * @see {@link resource!Resource} for the corresponding state type
 */
export type Template = {

	readonly [property: Identifier]: undefined | Placeholders

}


/**
 * Property value set template.
 *
 * Umbrella for the placeholder forms admitted as {@link Template} property values, split by cardinality into a
 * single-value and a collection-valued arm:
 *
 * - {@link Model} — single-value placeholder retrieving one property value, grouping the {@link Union}
 *   (*keyed* union form), {@link Placeholder} (non-union value), and {@link Locale} (localised text) shapes
 * - {@link Query} — collection-valued placeholder, covering nested resource collections and
 *   tabular projections, each optionally constrained through {@link Selection}
 *
 * @see {@link Model} for the single-value forms and {@link Query} for the collection forms
 * @see {@link Template} for the resource-shaped retrieval template hosting these placeholders
 * @see {@link resource!Values} for the corresponding state type
 */
export type Placeholders =
	| Model
	| Query

/**
 * Property value template.
 *
 * Individual placeholder standing in for one property value within a resource retrieval description:
 *
 * - {@link Literal} — primitive data (`boolean`, `number`, `string`)
 * - {@link IRI} — IRI reference identifying a linked resource, relative or absolute
 * - {@link Template} — linked resource expanded as a nested retrieval template
 *
 * A reference placeholder carries no data, so any well-formed {@link IRI} reference is accepted regardless of form;
 * the inert `""` is the canonical slot. Reference values proper, resolved to an absolute {@link Reference} on
 * decoding, appear instead as {@link Option} operands of a {@link Selection}.
 *
 * @see {@link Model} for the single-value umbrella admitting this and the other non-collection forms
 * @see {@link resource!Value} for the corresponding state type
 */
export type Placeholder =
	| Literal
	| IRI
	| Template


/**
 * Value retrieval template.
 *
 * Umbrella for the placeholder forms that shape one property value, structured or not: the single-value counterpart
 * of the collection-valued {@link Query}, which pairs a comparable element with a {@link Selection}. The admitted
 * forms are:
 *
 * - {@link Union} — per-branch placeholder for a union-typed slot (*keyed* form)
 * - {@link Placeholder} — single non-union value placeholder: a {@link Literal} or {@link IRI} primitive, or a nested
 *   {@link Template} expanding a linked resource inline
 * - {@link Locale} — localised text placeholder, a tag-range-keyed map yielding a single structured {@link Text} value
 *
 * `Model` reaches property templates at two sites: as the single-value arm of {@link Placeholders}, paired with the
 * collection-valued {@link Query}, and as the cell value of a {@link Projection}, which allots one `Model` value per
 * cell and excludes collection-valued forms.
 *
 * @see {@link Query} for the collection counterpart
 * @see {@link Placeholders} for the umbrella admitting both single-value and collection-valued forms
 * @see {@link Projection} for the tabular projection hosting one `Model` per cell
 */
export type Model =
	| Union
	| Placeholder
	| Locale

/**
 * Collection retrieval template.
 *
 * A tuple pairing a per-item element placeholder with an optional collection-wide {@link Selection} — filtering,
 * ordering, and pagination. For tabular collections the element is a {@link Projection}; relationally, `Projection`
 * is the projection (π) and `Selection` the selection (σ) applied over the collection.
 *
 * The accepted forms are:
 *
 * - `readonly [Union, Selection?]` — a union-typed element ({@link Union} *keyed* form), optionally followed by a
 *   {@link Selection}
 * - `readonly [Placeholder, Selection?]` — a per-item {@link Placeholder} (a {@link Literal} or {@link IRI}
 *   primitive, or a nested {@link Template}), optionally followed by a {@link Selection}
 * - `readonly [Projection, Selection?]` — a tabular projection ({@link Projection}), optionally followed by a
 *   {@link Selection}
 *
 * The leading element signals collection cardinality and carries the per-item template; the optional second element
 * carries collection-wide constraints. Runtime validators accept a one- or two-element tuple and reject arrays of
 * any other length.
 *
 * @see {@link Template} for the resource counterpart
 * @see {@link Placeholders} for the umbrella admitting both resource and collection-valued forms
 * @see {@link Selection} for the filtering, ordering, and pagination constraints in the optional second slot
 * @see {@link resource!Resource} for the corresponding state type
 */
export type Query =
	| readonly [Union, Selection?]
	| readonly [Placeholder, Selection?]
	| readonly [Projection, Selection?]


/**
 * Localised text template.
 *
 * Retrieves a localised property as a single structured {@link Text} value: the localised
 * counterpart of a nested {@link Template}, not a multi-valued or collection property. The
 * {@link TagRange | tag range} keys are RFC 4647 basic language ranges (a subtag sequence or the
 * standalone `*`) and select which locales populate that structured value; each range filters the
 * available language tags by basic filtering, and a range may expand to several tag entries in the
 * retrieved map (the standalone `*` matches every tag, and a range such as `en` matches `en` along
 * with more specific tags like `en-US`).
 *
 * The umbrella union admits two value-shape forms that fix the per-tag cardinality of the retrieved
 * entries, not the property's own cardinality:
 *
 * - a single-string value per tag range, retrieving one string per matched tag, or
 * - a singleton-array value per tag range, retrieving an array of strings per matched tag
 *
 * The value position is an inert placeholder (`""` or `[""]`): it carries no data and only selects
 * the per-tag cardinality, leaving the {@link TagRange} keys alone to drive locale selection.
 *
 * `Locale` is one of the {@link Model} single-value forms, reaching {@link Placeholders} through the single-value
 * arm alongside {@link Placeholder} and {@link Union} rather than under {@link Query}, reflecting that a localised
 * property is one structured value and not a collection. Its {@link TagRange} keys select retrieved content only and
 * are independent of {@link Selection}: a `Locale` map carries tag ranges, never `Selection` operator keys. Resource
 * matching by a localised property is done separately, at the enclosing collection's {@link Selection} via `?`/`!`.
 *
 * > [!NOTE]
 * > - If the query specifies a single- or multi-valued form, the retrieved {@link Text} entry
 * >   should use the corresponding form
 * > - The `@none` key for non-localised values is not supported; use the `und` tag for
 * >   language-neutral values
 *
 * > [!NOTE]
 * > An empty tag-range map (`{}`), whether it appears directly as a property value or as a
 * > collection tuple's element, carries no locale constraints and must be
 * > ignored by processors as if the owning property were omitted from the enclosing template.
 *
 * @see {@link Model} for the single-value umbrella admitting this and the other non-collection forms
 * @see {@link resource!Text} for the corresponding state type
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html RFC 4647 - Matching of Language Tags}
 */
export type Locale =
	| { readonly [range: TagRange]: string }
	| { readonly [range: TagRange]: readonly [string] }


/**
 * Union-typed property template.
 *
 * An object whose keys are {@link UnionKey | opaque non-negative integer strings}, each mapping to one branch's value
 * to retrieve. The keys only label the alternatives: the variants a branch retrieves are fixed by matching it, by type
 * compatibility, against the property's declared variants, never by its key; a variant left unmatched by any branch is
 * skipped. Matching is type-only, so a branch may match several same-typed variants, retrieving each, and its value is
 * immaterial; a branch matching no variant is unsatisfiable and rejected. Because the keys are immaterial, reordering
 * or renaming variants in the source declaration leaves existing templates valid, as long as each branch still matches
 * at least one variant. A non-union slot uses a plain {@link Placeholder} directly, the sibling {@link Model} form,
 * rather than a `Union`.
 *
 * A branch holds a {@link Placeholder}, never a nested `Union`: a `Union` cannot stack directly inside another, though
 * a branch {@link Template} may carry its own `Union`s. A branch is a single value, never a collection: cardinality
 * stays a property-level concern, expressed by wrapping the whole `Union` in a {@link Query}.
 *
 * > [!NOTE]
 * > A branch may also be a {@link Locale} map, but only within a {@link Projection}: when a binding's
 * > {@link Expression} traverses a multi-step path through a union-typed step to a downstream localised property and
 * > addresses it structurally, that branch retrieves a {@link resource!Text} map. A `Locale` branch never arises when
 * > retrieving a resource property directly, where a localised property is retrieved through {@link Locale} as a
 * > sibling {@link Model} form rather than as a union branch.
 *
 * > [!NOTE]
 * > The `` `${number}` `` key space is disjoint from the {@link Binding} / {@link Identifier} key spaces used by
 * > {@link Template} and {@link Projection}, so form discrimination is structural and unambiguous for fresh object
 * > literals. Runtime validators enforce numeric-key wellformedness (no decimals, negatives, or exponential forms);
 * > resolving which variant each placeholder retrieves is a processor concern, matched against the out-of-band
 * > declared variants.
 *
 * > [!NOTE]
 * > An empty `Union` object (`{}`), whether it appears directly as a property value or as a collection
 * > tuple's element, carries no retrieval instructions and must be ignored by processors
 * > as if the owning property were omitted from the enclosing template. Variants are evaluated independently: a
 * > variant whose body is an empty `Template` (`{}`) is dropped from the union; when every variant is dropped, the
 * > whole union is elided by the same rule.
 *
 * @see {@link Model} for the single-value umbrella admitting this and the other non-collection forms
 * @see [Union](./index.md#54-union) for the design rationale
 */
export type Union = {

	readonly [variant: UnionKey]: Placeholder | Locale

}

/**
 * Union variant key.
 *
 * The key type of a {@link Union} map: an opaque non-negative integer string (`"0"`, `"1"`, …) labelling one variant
 * branch. The key only names the branch; which variant that branch retrieves is fixed by matching it against the
 * property's declared variants, never by the key value, so renaming or reordering keys leaves an existing template
 * valid. The `` `${number}` `` key space is disjoint from the {@link Binding} / {@link Identifier} key spaces used by
 * {@link Template} and {@link Projection}, keeping form discrimination structural and unambiguous.
 *
 * @see {@link Union} for the enclosing variant map
 * @see {@link isUnionKey} for the runtime wellformedness guard
 */
export type UnionKey =
	| `${number}`;


/**
 * Collection property projection.
 *
 * A property map for projected collection retrieval. Each property is keyed by a {@link Binding} naming an
 * {@link Expression} (a property path, optionally piped through a computed or aggregate transform) and maps to a
 * {@link Model} single-value cell, or to `undefined` marking an optional binding that may be elided at construction
 * time (for example, conditionally included aggregates). A `Model` cell takes one of the forms admitted by
 * [Projection Composition](./index.md#56-projection):
 *
 * - a {@link Union} placeholder — a per-branch *keyed* form, when the bound expression resolves to
 *   a union-typed value
 * - a {@link Placeholder} — a {@link Literal}, an {@link IRI} reference to a linked resource, or a
 *   nested {@link Template} for inline resource expansion
 * - a {@link Locale} placeholder — a tag-range-keyed map declaring a localised cell that yields a complete
 *   {@link Text} value for the row's owning resource. The map is materialised by deferred expansion: pass 1
 *   projects the owning resource handle, pass 2 batch-fetches the tagged values and assembles the map (see
 *   [Projection Composition](./index.md#56-projection))
 *
 * `Projection` differs from {@link Template} along two axes:
 *
 * - **keys** — a `Projection` accepts {@link Binding | bindings} in the `name=expression` form, naming computed
 *   or aggregate values derived from property paths and {@link Transform | transforms}; a `Template` accepts
 *   only plain {@link Identifier} keys matching actual resource properties
 * - **values** — a `Projection` admits a {@link Model} single-value placeholder per cell ({@link Union},
 *   {@link Placeholder}, or {@link Locale}) but excludes the collection-valued {@link Query}, because Projection
 *   Composition allots one value per cell; a {@link Locale} map counts as a single (structured) {@link Text} value,
 *   and nested {@link Template} placeholders remain admitted through {@link Placeholder}, so a computed binding may
 *   expand a linked resource inline
 *
 * > [!IMPORTANT]
 * > When any binding resolves to an aggregate {@link Expression} (one whose pipe includes an
 * > {@link isAggregate | aggregate} {@link Transform}), the query is evaluated under grouped semantics;
 * > see {@link Selection} for the full grouping and filter-partition rules. With no aggregate in either
 * > the `Projection` or the sibling `Selection`, every row is projected independently and no grouping
 * > is applied.
 *
 * > [!IMPORTANT]
 * > {@link Binding} identifiers (the {@link Identifier} portion before `=` for computed bindings, or the binding
 * > itself for plain identifiers) must be unique within a `Projection`. Duplicates collide on the same projected
 * > property in the resulting row and are rejected by template processors.
 *
 * > [!NOTE]
 * > An empty `Projection` (`{}`), which may only appear as a collection tuple's element, carries
 * > no column bindings and must be ignored by processors as if the owning property were omitted from the enclosing
 * > template.
 *
 * @see {@link Model} for the single-value cell forms admitted per binding
 * @see {@link resource!Resource} for the corresponding state type
 */
export type Projection = {

	readonly [property: Binding]: undefined | Model

}

/**
 * Collection retrieval constraints.
 *
 * Specifies filtering, sorting, and pagination criteria for collection retrieval. Constraint keys use the
 * `"{operator}{expression}"` syntax, where the {@link Operator} determines the constraint type and the
 * {@link Expression} identifies the target property or computed value. Pagination uses the literal `"@"` and
 * `"#"` keys.
 *
 * `Selection` is attached to a collection as the optional second element of a {@link Query} tuple:
 * `[Placeholder, Selection]`, `[Union, Selection]`, or `[Projection, Selection]`. A {@link Locale} placeholder is
 * not a `Query` element, so it takes no second-slot `Selection`; a localised property is constrained through the
 * collection's `Selection` by matching (`?`/`!`).
 *
 * > [!IMPORTANT]
 * > Filtering and ordering {@link Expression | expressions} are resolved independently of any sibling
 * > {@link Projection} bindings: an aggregate constraint may reference an aggregate that is not
 * > projected, and a projected aggregate binding need not appear in any constraint. When an aggregate
 * > expression is present in the `Selection` or the sibling `Projection`, each constraint's role
 * > depends on whether it references an aggregate: non-aggregate filters restrict the input set
 * > before grouping; a non-aggregate ordering expression sorts the groups by one of the grouping
 * > keys; aggregate filters select groups after aggregation; aggregate ordering expressions sort the
 * > groups by their post-aggregation values. Grouping is fixed by the projection alone and is never
 * > inferred from a sort key: a non-aggregate ordering expression must reference an existing grouping
 * > key, and processors must reject one that matches none.
 */
export type Selection = {

	/**
	 * Less-than filter.
	 *
	 * Includes resources where at least one expression value is strictly less than the {@link Literal}
	 * under the value-ordering rules.
	 *
	 * Applicable only where the target {@link Expression} resolves to a {@link Literal} (`boolean`, `number`,
	 * `string`); {@link Reference}, nested resources, and {@link Text} values are not comparable. The bound
	 * and the resolved value must share the same type; cross-type comparison is unpredictable and a validating
	 * processor MUST reject it.
	 */
	readonly [lt: `<${Expression}`]: Literal

	/**
	 * Greater-than filter.
	 *
	 * Includes resources where at least one expression value is strictly greater than the {@link Literal}
	 * under the value-ordering rules.
	 *
	 * Applicable only where the target {@link Expression} resolves to a {@link Literal} (`boolean`, `number`,
	 * `string`); {@link Reference}, nested resources, and {@link Text} values are not comparable. The bound
	 * and the resolved value must share the same type; cross-type comparison is unpredictable and a validating
	 * processor MUST reject it.
	 */
	readonly [gt: `>${Expression}`]: Literal

	/**
	 * Less-than-or-equal filter.
	 *
	 * Includes resources where at least one expression value is less than or equal to the {@link Literal}
	 * under the value-ordering rules.
	 *
	 * Applicable only where the target {@link Expression} resolves to a {@link Literal} (`boolean`, `number`,
	 * `string`); {@link Reference}, nested resources, and {@link Text} values are not comparable. The bound
	 * and the resolved value must share the same type; cross-type comparison is unpredictable and a validating
	 * processor MUST reject it.
	 */
	readonly [lte: `<=${Expression}`]: Literal

	/**
	 * Greater-than-or-equal filter.
	 *
	 * Includes resources where at least one expression value is greater than or equal to the {@link Literal}
	 * under the value-ordering rules.
	 *
	 * Applicable only where the target {@link Expression} resolves to a {@link Literal} (`boolean`, `number`,
	 * `string`); {@link Reference}, nested resources, and {@link Text} values are not comparable. The bound
	 * and the resolved value must share the same type; cross-type comparison is unpredictable and a validating
	 * processor MUST reject it.
	 */
	readonly [gte: `>=${Expression}`]: Literal


	/**
	 * Text search filter.
	 *
	 * Includes resources where at least one of the target's values contains every whitespace-separated token of the
	 * search string as a case-insensitive substring; token order is not significant.
	 *
	 * Applicable only to `string`-valued targets; non-string literals (`boolean`, `number`), {@link Reference}, and
	 * nested resources are not searchable. A multi-valued string property matches existentially: the resource matches
	 * when at least one of its values contains every token.
	 *
	 * > [!WARNING]
	 * > Matching is diacritics-sensitive: diacritics normalisation is not uniformly supported across storage
	 * > backends and would require extensive application-level pre-processing at storage time. For detailed
	 * > matching rules and cross-backend semantics, see [text search](./index.md#572-text-search).
	 */
	readonly [like: `~${Expression}`]: string

	/**
	 * Disjunctive matching filter.
	 *
	 * Includes resources where at least one expression value equals one of the values specified by the
	 * {@link Options} set; `null` matches undefined. An empty option set is an absent constraint, matching all
	 * resources.
	 *
	 * Applicable to {@link Literal} and {@link Reference} properties (value or IRI equality) and to
	 * {@link Text} properties through the {@link Text} option form; a nested resource is matched by its
	 * {@link Reference}, not its embedded state. The option must match the type of the target {@link Expression}'s
	 * resolved value; a type-inconsistent option is unpredictable and a processor MUST reject it.
	 */
	readonly [any: `?${Expression}`]: Options

	/**
	 * Conjunctive matching filter.
	 *
	 * Includes resources whose expression values contain every value in the {@link Options} set (set containment:
	 * the property's value set includes all options). Primarily for multi-valued properties; a single-valued
	 * property can satisfy only a single-element option set. An empty option set is an absent constraint, matching
	 * all resources. A `null` option requires an absent value: `[null]` alone selects unset properties, while `null`
	 * combined with present values is unsatisfiable and matches nothing (not an error); a processor may
	 * short-circuit it to an empty result without evaluating the constraint.
	 *
	 * Applicable to {@link Literal} and {@link Reference} properties (value or IRI equality) and to
	 * {@link Text} properties through the {@link Text} option form; a nested resource is matched by its
	 * {@link Reference}, not its embedded state. The option must match the type of the target {@link Expression}'s
	 * resolved value; a type-inconsistent option is unpredictable and a processor MUST reject it.
	 */
	readonly [all: `!${Expression}`]: Options


	/**
	 * Sort focus.
	 *
	 * Companion to sort order (`^`): resources whose expression value is one of the values in the {@link Options} set
	 * rank before the rest, with the regular `^` sort applied within each group; focus takes precedence over `^`.
	 *
	 * Membership is tested by equality, so an option must match the target value's type; a type-inconsistent option
	 * is unpredictable and a processor MUST reject it. A `null` option prioritises resources whose value is
	 * absent; an empty {@link Options} set imposes no focus.
	 *
	 * > [!WARNING]
	 * > Like `^`, focus requires a single-valued {@link Literal} target (`boolean`, `number`, `string`): a
	 * > {@link Reference} or nested resource is not orderable, and a multi-valued target supplies no single ordering
	 * > key.
	 */
	readonly [focus: `+${Expression}`]: Options

	/**
	 * Sort order.
	 *
	 * Orders results by expression value according to the value-ordering rules; the sign gives direction (positive for
	 * ascending, negative for descending); the absolute value gives 1-based precedence (1 is highest priority); zero
	 * is ignored; `"asc"` and `"desc"` are shorthands for `±1`.
	 *
	 * > [!WARNING]
	 * > `^` requires a single-valued {@link Literal} sort key (`boolean`, `number`, `string`). A {@link Reference} or
	 * > nested-resource target is not sortable. A multi-valued literal property is likewise invalid directly: reduce
	 * > it explicitly with a `min`/`max` aggregate, evaluated under grouped semantics.
	 */
	readonly [order: `^${Expression}`]: "asc" | "desc" | number


	/**
	 * Pagination offset.
	 *
	 * Skips the first `number` resources from the filtered and ordered result set; zero is ignored (no offset).
	 * The value is a non-negative integer; a negative or non-integer value is invalid and processors MUST
	 * reject it. To make paging stable, processors append a deterministic tiebreaker after any `^` criteria (the
	 * resource identity, or the projected fields under grouped semantics), so the result order is total and page
	 * boundaries are stable across requests for unchanged data (concurrent modification between page fetches is not
	 * covered).
	 */
	readonly "@"?: number

	/**
	 * Pagination limit.
	 *
	 * Returns at most `number` resources from the result set after applying offset; zero is ignored, imposing no
	 * limit (all remaining resources are returned, not an empty result). The value is a
	 * non-negative integer; a negative or non-integer value is invalid and a processor MUST reject it.
	 */
	readonly "#"?: number

};


/**
 * Named computed expression.
 *
 * Property key for {@link Projection} entries that assigns a name to a computed {@link Expression}, either as a
 * plain {@link Identifier} (shorthand for `{name}={name}`) or using the explicit `{name}={expression}` syntax.
 *
 * @example
 *
 * ```typescript
 * const projection: Projection = {
 *   "name": "",						// property binding (shorthand for "name=name")
 *   "vendorName=vendor.name": "",      // path binding
 *   "releaseYear=year:releaseDate": 0  // transform binding
 * };
 * ```
 *
 * @see {@link Projection} for the property map that uses bindings as keys
 * @see {@link Expression} for the computed-field syntax bindings can carry
 */
export type Binding =
	| Identifier
	| `${Identifier}=${Expression}`;

/**
 * Computed expression.
 *
 * Compact string syntax `[pipe:]path` combining a property access path with a chain of value transformations,
 * used in {@link Projection} bindings and {@link Selection} constraint keys to identify the target property or
 * computed value:
 *
 * - **pipe** — optional {@link Pipe} naming the right-to-left transform chain to apply
 * - **path** — {@link Path} navigating to a nested value within the resource
 *
 * When the pipe is omitted, the expression resolves to the path's raw value; when the path is omitted, the
 * expression denotes an aggregate over the root collection.
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; expression syntax is validated at runtime by query
 * > processors. Processors reject expressions that reference unknown transforms outright; references to unknown
 * > properties MUST be rejected by processors, while a reference resolving to no value yields `undefined`
 * > (see [Property Paths](./index.md#581-property-paths)).
 *
 * @example
 *
 * ```text
 * name                    // simple property
 * vendor.name             // nested property path
 * year:releaseDate        // single transform
 * round:avg:scores        // transform pipeline
 * count:                  // aggregate (empty path)
 * ```
 *
 * @see {@link Pipe} for the transform pipeline syntax
 * @see {@link Path} for the property navigation syntax
 */
export type Expression =
	| Path
	| `${Pipe}:${Path}`;


/**
 * Transform pipe.
 *
 * Colon-separated sequence of {@link Transform} names identifying a chain of value transformations within an
 * {@link Expression} (for example, `round:avg:`). Transforms are applied right-to-left in functional composition
 * order; the empty pipe denotes the identity transformation and passes the value through unchanged.
 *
 * Composition rules and valid/invalid combinations are defined in
 * [Transform Pipe Composition](./index.md#582-transform-pipes).
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; pipe syntax is validated at runtime by query processors.
 */
export type Pipe =
	| string;

/**
 * Property path.
 *
 * Dot-separated list of property names navigating to a value within a resource (for example, `order.items.price`).
 * Path steps follow {@link Identifier} rules (ECMAScript names) and always refer to actual resource property names,
 * never to projected computed properties defined by {@link Binding | bindings}. The empty string refers to the
 * root value and, in {@link Expression | expressions}, denotes an aggregate over the input collection.
 *
 * Resolution semantics, including multi-valued and union properties, are defined in
 * [Property Paths](./index.md#581-property-paths).
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; path syntax is validated at runtime by query processors.
 * > References to unknown properties MUST be rejected by processors, while a reference resolving to no
 * > value yields `undefined`.
 */
export type Path =
	| string;


/**
 * Constraint option set.
 *
 * A single {@link Option} scalar, a {@link Text} language-tagged option set, or an array of {@link Option}
 * elements. Specifies the set of values for {@link Selection} matching (`?` and `!`) and sort focus (`+`)
 * operators. Arrays follow set semantics: duplicate values are ignored, ordering is immaterial, and empty arrays
 * are treated as absent constraints. Element types may be mixed.
 *
 * > [!NOTE]
 * > Options are inherently multi-valued regardless of the cardinality of the target property: matching and ordering
 * > operators always work against a set of candidate values. The scalar {@link Option} branch is accepted as a
 * > shorthand for a single-element option set.
 *
 * > [!IMPORTANT]
 * > When constraining a localised property, use the {@link Text} branch so option values carry their
 * > language tags inline. The scalar {@link Option} and array `readonly Option[]` branches target
 * > non-localised properties; reaching a localised slot through them is a typing escape hatch, not an intended mode.
 * > Branch/target consistency is not enforced by the type system ({@link Selection} keys are opaque
 * > {@link Expression} strings that sever the value form from the target property), so processors MUST reject
 * > inconsistent `Options`: an untagged {@link Option} or array against a localised property, or a {@link Text} set
 * > against a non-localised one.
 *
 * > [!IMPORTANT]
 * > Consumers must accept both scalar and array {@link Text} forms when filtering or constraining on
 * > localised properties, regardless of the target property's cardinality: codec roundtrips may normalise
 * > between the two forms (see {@link decodeSelection}).
 */
export type Options =
	| Option
	| Text
	| readonly Option[]

/**
 * Constraint option.
 *
 * Single value accepted by {@link Selection}'s matching (`?` and `!`) and sort focus (`+`) operators:
 *
 * - `null` — undefined property value
 * - {@link Literal} — a primitive (`boolean`, `number`, `string`)
 * - {@link Reference} — an absolute IRI identifying a linked resource
 *
 * Multi-valued option sets are represented by {@link Options}, which subsumes the scalar `Option` branch as a
 * shorthand for a single-element set.
 */
export type Option =
	| null
	| Literal
	| Reference


/**
 * Parsed {@link Selection} or {@link Projection} key.
 *
 * Structural representation of a {@link Projection} or {@link Selection} key, decomposing the encoded string form
 * into its target, transform pipeline, and property path components. Projection and constraint probes share a single
 * shape — the two are easily disambiguated after parsing by checking whether `target` is an {@link Identifier} or
 * an {@link Operator} via {@link isIdentifier}.
 *
 * @example
 *
 * ```typescript
 * // Projection: "vendorName=vendor.name"
 * { target: "vendorName", pipe: [], path: ["vendor", "name"] }
 *
 * // Constraint: ">=year:releaseDate"
 * { target: ">=", pipe: ["year"], path: ["releaseDate"] }
 * ```
 *
 * @see {@link encodeProbe} for the inverse mapping
 * @see {@link decodeProbe} for parsing a key string into a probe
 */
export type Probe = {

	/**
	 * Projection binding identifier or constraint operator symbol.
	 *
	 * For projections, the {@link Identifier} portion of a {@link Binding} — the name before `=`, or the
	 * whole binding for plain identifiers. For constraints, the constraint {@link Operator} prefix.
	 */
	readonly target: Identifier | Operator;

	/**
	 * Transform pipeline.
	 *
	 * Ordered list of {@link Transform} names applied to the path-resolved value, in application order
	 * (right-to-left in source notation, left-to-right in this array).
	 */
	readonly pipe: readonly Transform[];

	/**
	 * Property path.
	 *
	 * Ordered list of {@link Identifier} steps navigating to the target value within a resource. An empty path
	 * denotes an aggregate over the root value.
	 */
	readonly path: readonly Identifier[];

}

/**
 * Constraint operator symbols.
 *
 * Closed set of operator prefixes that distinguish a {@link Selection} constraint key from a plain
 * {@link Binding | binding} identifier. Each symbol corresponds to one of `Selection`'s template-literal index
 * signatures or to one of its scope/pagination literal slots.
 *
 * @see {@link Selection} for the per-operator value type and semantics
 */
export type Operator =
	| "<"
	| ">"
	| "<="
	| ">="
	| "~"
	| "?"
	| "!"
	| "+"
	| "^"
	| "@"
	| "#"

/**
 * Value transforms for computed {@link Expression | expressions}.
 *
 * Transforms are named functions applied to property values in expressions, forming pipelines that are applied
 * right-to-left (functional composition order).
 *
 * ```typescript
 * "sum:items.price"      // sum of items.price values
 * "round:avg:scores"     // pipeline: avg applied first, then round
 * ```
 *
 * > [!WARNING]
 * >
 * > The set of supported transforms is closed: only the names listed below are valid. Expressions and criteria
 * > referencing unknown transforms are rejected outright by `isExpression` and `isProbe`. Pipes that violate the
 * > structural composition rules (for example, aggregate after aggregate) are likewise rejected outright.
 * > Applying a transform outside its declared domain (for example, `abs` on a string) is never an error: it
 * > resolves to `undefined` for a scalar transform and is dropped from the input set for an aggregate.
 *
 * ## Type Mapping
 *
 * Transforms operate on JSON values but their semantics are defined in terms
 * of [XPath 2.0](https://www.w3.org/TR/xpath-functions/) / [XSD 1.0](https://www.w3.org/TR/xmlschema-2/) types.
 * The domain and range columns in the table below use the following type shorthands:
 *
 * - **literal** — any comparable literal: `xsd:boolean`, **numeric**, `xsd:string`, or **temporal**; excludes IRI
 * references, nested resources, and localised {@link Text}, which lack an ordering
 * - **numeric** — `xsd:integer` | `xsd:decimal` | `xsd:float` | `xsd:double`, mapped to JSON `number`
 * (IEEE 754 double); note that JSON numbers can only represent a subset of `xsd:integer` and `xsd:decimal` values
 * - **temporal** — `xsd:dateTime` | `xsd:date` | `xsd:time`, mapped to JSON `string`; note that
 * temporal types may be accepted only by a specific subset of temporal transforms. `xsd:duration` is not a
 * temporal processing type and is treated as an opaque `xsd:string`
 *
 * String-to-string transform pipes (for example, `lower`, `upper`) may also be applied to {@link Text}
 * values: the pipe is applied individually to each string value in the localised text map. The `min`/`max`
 * aggregates require an ordering that localised text lacks, so it lies outside their domain.
 *
 * | Transform      | Definition                                                       | Domain       | Range         |
 * |----------------|------------------------------------------------------------------|--------------|---------------|
 * | **aggregates** | Summarise a set of values (bag semantics; no implicit dedup)     |              |               |
 * | `count`        | Count values; `0` for empty sets                                 | any          | `xsd:integer` |
 * | `min`          | Select minimum value; `undefined` for empty sets                 | literal      | same as input |
 * | `max`          | Select maximum value; `undefined` for empty sets                 | literal      | same as input |
 * | `sum`          | Sum numeric values; `0` for empty sets                           | numeric      | same as input |
 * | `avg`          | Average numeric values; `undefined` for empty sets               | numeric      | `xsd:decimal` |
 * | **numeric**    | Transform numeric values                                         |              |               |
 * | `abs`          | Compute absolute value                                           | numeric      | same as input |
 * | `floor`        | Floor to largest integer ≤ value                                 | numeric      | same as input |
 * | `ceil`         | Ceiling to smallest integer ≥ value                              | numeric      | same as input |
 * | `round`        | Round to nearest integer                                         | numeric      | same as input |
 * | **textual**    | Transform string values                                          |              |               |
 * | `lower`        | Convert to lowercase                                             | `xsd:string` | same as input |
 * | `upper`        | Convert to uppercase                                             | `xsd:string` | same as input |
 * | `length`       | Compute character length                                         | `xsd:string` | `xsd:integer` |
 * | **temporal**   | Extract components from ISO 8601 date/time                       |              |               |
 * | `year`         | Extract year component                                           | temporal     | `xsd:integer` |
 * | `month`        | Extract month component                                          | temporal     | `xsd:integer` |
 * | `day`          | Extract day component                                            | temporal     | `xsd:integer` |
 * | `hours`        | Extract hours component                                          | temporal     | `xsd:integer` |
 * | `minutes`      | Extract minutes component                                        | temporal     | `xsd:integer` |
 * | `seconds`      | Extract seconds component                                        | temporal     | `xsd:decimal` |
 *
 * `avg` always yields `xsd:decimal`: the spec narrows its range to `xsd:float`/`xsd:double` for those inputs, but that
 * processing-space distinction is not preserved on egress, so the effective range is uniformly `xsd:decimal`.
 *
 * ## Aggregate Semantics
 *
 * Aggregates use bag semantics: every contributing value counts toward the result with no implicit deduplication. The
 * expression path determines the input — `count:` (empty path) counts the input rows, while a non-empty path (for
 * example, `sum:price`) ranges over the values resolved by the path for each input row, with multi-valued path
 * fan-outs contributing every resolved value individually. Distinct-value aggregates are obtained through grouping (see
 * the [Aggregate Grouping](#aggregate-grouping) section) by projecting the value of interest as a non-aggregate
 * binding.
 *
 * ## Error Handling
 *
 * Scalar transforms map both an `undefined` input and an out-of-domain value (for example, `abs` on a string)
 * to `undefined`; an out-of-domain value is never an error. Aggregate transforms silently skip `undefined` and
 * out-of-domain values before computing the result. See [Transform Pipes](./index.md#582-transform-pipes) and
 * [Aggregate Transforms](./index.md#5821-aggregate-transforms) for the full adopted semantics, including empty set
 * behaviour, multi-valued properties, and type promotion rules.
 *
 * The supported set is restricted to the intersection of well-defined counterparts across XPath 2.0, SPARQL 1.1,
 * SQL:2011, and GQL:2024; see [Client-Driven Retrieval](./index.md#5-client-driven-retrieval) for the
 * cross-backend design approach and [Target Backends](./index.md#appendix-a-target-backends)
 * for backend-specific adjustments.
 */
export type Transform =

	| "count"
	| "min"
	| "max"
	| "sum"
	| "avg"

	| "abs"
	| "floor"
	| "ceil"
	| "round"

	| "lower"
	| "upper"
	| "length"

	| "year"
	| "month"
	| "day"
	| "hours"
	| "minutes"
	| "seconds"

/**
 * Static typing profile of a {@link Transform}.
 *
 * Captures how a transform derives its output shape from the input path shape: its aggregation kind, the input
 * domain it accepts, and the output processing type it produces. The {@link Transforms} table assigns one signature
 * to each {@link Transform}, driving both input validation and the cardinality and type of the resulting pipe.
 *
 * @see {@link Transforms} for the per-transform signature assignments
 */
export type TransformSignature = {

	/**
	 * The transform's aggregation kind.
	 *
	 * - `false` — a scalar transform; preserves `maxCount` from the path
	 * - `"partial"` — an aggregate (`min`, `max`, `avg`) that yields `undefined` on the empty set; sets `maxCount`
	 *   to `1` and leaves a non-empty pipe's `minCount` `undefined`
	 * - `"total"` — an aggregate (`count`, `sum`) that always yields a value (`0` on the empty set); sets `maxCount`
	 *   to `1` and pins a non-empty pipe's `minCount` to `1`
	 */
	readonly aggregate: false | "partial" | "total",

	/**
	 * The transform's input domain.
	 *
	 * A shape outside the domain (references and resources included) drops to `undefined` rather than erroring.
	 *
	 * - `"any"` — every shape, references and resources included (`count`)
	 * - `"literal"` — the boolean, numeric, string, and temporal processing types (`min`, `max`)
	 * - `"numeric"` — the numeric processing type only (`sum`, `avg`, `abs`, `floor`, `ceil`, `round`)
	 * - `"string"` — the string processing type only (`lower`, `upper`, `length`)
	 * - `"temporal"` — the temporal processing type only (`year` … `seconds`)
	 */
	readonly accepts: "any" | "literal" | "numeric" | "temporal" | "string",

	/**
	 * The transform's output processing type.
	 *
	 * - `"same"` — preserves the input shape (`min`, `max`, `sum`, and the scalar numeric and string transforms)
	 * - `"integer"` — fixes the output to an integer (`count`, `length`, and the integral temporal components)
	 * - `"decimal"` — fixes the output to a decimal (`avg`, `seconds`)
	 * - `"string"` — fixes the output to a string
	 */
	readonly returns: "same" | "integer" | "decimal" | "string"

}


//// Type Inference ////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Infers the {@link Resource} type fetched by a {@link Template}.
 *
 * Recursively rewrites a template-shaped type into the corresponding {@link Resource} shape, so
 * client code can declare strongly-typed result variables without restating the schema.
 * Dispatches the rewrite by structural shape:
 *
 * - **collection tuples** — widens `readonly [I, Selection?]` placeholders to homogeneous arrays
 *   `readonly I[]`, rewriting the element recursively and discarding the optional {@link Selection}
 * - **objects** — maps properties homomorphically, rewriting each key through {@link Name}
 *   (which drops {@link Selection} constraint and pagination keys and extracts
 *   {@link Binding} identifiers) and rewrites each value recursively
 * - **primitives** — passes {@link Literal} and {@link Reference} placeholders through unchanged
 *
 * Propagates `undefined` and other union members through TypeScript's conditional-type
 * distribution, preserving the nullability of undefined-able fields (both `undefined`-union
 * (`v: undefined | T`) and optional (`v?: T`) forms) without an explicit branch in the rewrite.
 *
 * @typeParam T The {@link Template}, {@link Projection}, or {@link Placeholders} value to
 *              rewrite, typically inferred from an inline template literal via `typeof`
 *
 * @example
 *
 * ```typescript
 * const template: Template = {
 *   id: "",
 *   name: "",
 *   price: 0,
 *   tags: [""],
 *   vendor: { id: "", name: "" }
 * };
 *
 * type ProductView = Instance<typeof template>;
 * // → {
 * //     readonly id: Reference;
 * //     readonly name: string;
 * //     readonly price: number;
 * //     readonly tags: readonly string[];
 * //     readonly vendor: { readonly id: Reference; readonly name: string };
 * //   }
 * ```
 *
 * @see {@link Name} for the per-key rewrite step
 */
export type Instance<T> =
	T extends readonly [infer I, Selection?] ? readonly Instance<I>[]   // collection tuple → array of element
		: T extends object                                     // object
			? [Index<T>] extends [never]                       //   numeric keys?
				? Slots<T>                                     //     no → map fields
				: Instance<T[Index<T>]>                        //     yes → unwrap branch union
			: T;                                               // primitive

/**
 * Extracts the numeric-literal keys of a union frame, in both string (`"0"`) and numeric (`0`) form.
 *
 * Declaration emit serialises numeric keys as bare numerics (`{ 0; 1 }`) rather than string
 * literals (`{ "0"; "1" }`), so both forms must be matched for the collapse to survive a
 * cross-package `.d.ts` round-trip. Wide `number` / `string` index signatures (for example
 * {@link Locale} maps) are excluded so they keep mapping through {@link Slots}.
 *
 * @typeParam T The object type whose numeric-literal keys to extract
 */
export type Index<T> =
	keyof T extends infer K ?                              // distribute over each key
		K extends UnionKey ? K                          // string form (`"0"`)
			: K extends number ? (number extends K ? never : K)  // numeric form (`0`), excluding wide `number`
				: never
		: never;

/**
 * Projects a template-shaped object through {@link Instance}.
 *
 * Rewrites each property of `T` homomorphically: maps the key through {@link Name} (dropping
 * {@link Selection} constraint and pagination keys and extracting {@link Binding} identifiers)
 * and maps the value recursively through {@link Instance}. Shared by the plain-template branch
 * of `Instance` and the string-indexed fallback for {@link Locale} tag-range maps.
 *
 * @typeParam T The template-shaped object type to rewrite
 */
export type Slots<T> = {

	readonly [K in keyof T as Name<K>]: Instance<T[K]>

};

/**
 * Projects a {@link Instance} property key to its output name.
 *
 * Computes the property name an input key `K` maps to in the projected result shape:
 *
 * - **drops**    {@link Selection} constraint and pagination keys, collapsing them to `never`
 * - **extracts** the {@link Identifier} portion from computed {@link Binding} keys
 *                (`name=expression`) — the substring before the first `=`
 * - **passes**   plain {@link Identifier} keys through unchanged
 *
 * Drives {@link Instance}'s key rewriting in the object branch when projecting a template-shaped
 * object into its result shape.
 *
 * @typeParam K The input property key to rewrite
 *
 * @example
 *
 * ```typescript
 * type A = Name<"name">;                          // "name"          (plain identifier)
 * type B = Name<"vendorName=vendor.name">;        // "vendorName"    (path binding)
 * type C = Name<"releaseYear=year:releaseDate">;  // "releaseYear"   (transform binding)
 * type D = Name<"<price">;                        // never           (Selection constraint)
 * type E = Name<"@">;                             // never           (pagination key)
 * ```
 */
export type Name<K> =
	K extends keyof Selection ? never
		: K extends Binding ? K extends `${infer I}=${string}` ? I : K
			: K;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a template as a JSON string.
 *
 * Serialises a {@link Template} into a JSON string, recursively {@link internalize | internalising} absolute IRIs
 * against the provided `base`. The output may be additionally transport-encoded as URL-encoded JSON or URL-safe
 * base64url-encoded JSON via the `format` option.
 *
 * @param template The template to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalising absolute IRIs
 * @param options.indent Indentation level for pretty-printing output
 * @param options.format Output encoding for the serialised template:
 *
 *   - `"json"` — plain JSON string (default)
 *   - `"url"` — URL-encoded JSON (via {@link encodeURIComponent})
 *   - `"base64"` — URL-safe, unpadded base64-encoded JSON (base64url)
 *
 * @returns The serialised template with internalised IRIs, encoded according to `format`
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 *
 * @example
 *
 * ```typescript
 * encodeTemplate(
 *   { id: "", name: "", vendor: { id: "https://example.com/vendors/acme", name: "" } },
 *   { base: "https://example.com/" }
 * );
 * // → '{"id":"","name":"","vendor":{"id":"/vendors/acme","name":""}}'
 * ```
 *
 * @see {@link decodeTemplate}
 */
export function encodeTemplate(template: Template, {

	base = defaultBase,
	indent,
	format = "json"

}: EncoderOpts & {

	readonly format?: "json" | "url" | "base64"

} = {}): string {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const json = JSON.stringify(template, internalizer, indent === true ? 2 : indent || undefined);

	return format === "url" ? encodeURIComponent(json)
		: format === "base64" ? encodeBase64(json)
			: json;


	function internalizer(_key: string, value: unknown): unknown {
		return isIRI(value, "absolute")
			? internalize(base, value)
			: value;
	}

}

/**
 * Decodes a template from an encoded string.
 *
 * Parses an encoded string into a {@link Template}, recursively {@link resolve | resolving} internal IRIs against
 * the provided `base`. The input encoding is auto-detected, accepting any of the output formats produced by
 * {@link encodeTemplate}. The decoded template is validated and deeply frozen unless `lenient` is `true`.
 *
 * @param encoded The encoded {@link Template}, in any of the formats produced by {@link encodeTemplate}
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} template with resolved IRIs
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 * @throws {TypeError} If the decoded value fails structural validation (unless `lenient` is `true`)
 * @throws {SyntaxError} If `encoded` cannot be parsed as JSON, URL-encoded JSON, or base64url-encoded JSON
 *
 * @example
 *
 * ```typescript
 * decodeTemplate(
 *   '{"id":"","name":"","vendor":{"id":"/vendors/acme","name":""}}',
 *   { base: "https://example.com/" }
 * );
 * // → { id: "", name: "", vendor: { id: "https://example.com/vendors/acme", name: "" } }
 * ```
 *
 * @see {@link encodeTemplate}
 */
export function decodeTemplate(encoded: string, {

	base = defaultBase,
	lenient

}: DecoderOpts = {}): Template {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const json = encoded.startsWith("{") ? encoded
		: encoded.startsWith("%") ? decodeURIComponent(encoded)
			: encoded.startsWith("e") ? decodeBase64(encoded)
				: error<string>(new TypeError("unknown encoded template format"));

	return immutable(
		JSON.parse(json, resolver),
		lenient ? (_v): _v is Template => true : isTemplate,
		"malformed template"
	);


	function resolver(_key: string, value: unknown) {
		return isIRI(value, "internal")
			? resolve(base, value)
			: value;
	}

}


/**
 * Encodes a selection as a URL-safe string.
 *
 * Serialises a {@link Selection} into an
 * [`application/x-www-form-urlencoded`](https://url.spec.whatwg.org/#application/x-www-form-urlencoded) string,
 * recursively {@link internalize | internalising} absolute IRIs against the provided `base`; see
 * [Form Serialisation](#form-serialisation) for the wire format.
 *
 * > [!NOTE]
 * > The encoder always produces canonical form:
 * >
 * > - Operators use prefix notation (for example, `>=price=100`)
 * > - String values are JSON double-quoted (for example, `name="widget"`)
 * > - Numbers, booleans, and `null` remain unquoted (JSON literals)
 * > - Sorting criteria are always numeric (for example, `^price=1`, `^name=-2`)
 * > - A {@link Text} string value is flattened using a single postfix `@tag` suffix (for example, `"text"@en`)
 * >
 * > This ensures consistent, predictable output. The decoder accepts both canonical and shorthand forms (for example,
 * > postfix operators like `price>=100`, unquoted strings like `name=widget`).
 *
 * > [!WARNING]
 * > The codec treats the `@tag` suffix as an opaque key and assigns it no semantic meaning. Consumers are
 * > responsible for interpreting the resulting {@link Text} map using schema-based information.
 *
 * @param selection The selection to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalising absolute IRIs
 *
 * @returns The encoded selection string with internalised IRIs
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 *
 * @example
 *
 * ```typescript
 * encodeSelection({ "~name": "widget", ">=price": 50, "^price": 1, "#": 25 });
 * // → '~name=%22widget%22&%3E%3Dprice=50&%5Eprice=1&%23=25'
 * ```
 *
 * @see {@link decodeSelection}
 */
export function encodeSelection(selection: Selection, {

	base = defaultBase

}: EncoderOpts = {}): string {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	return encodeFormQuery(internalizeIRIs(base, selection));


	function encodeFormQuery(query: Selection): string {

		return Object.entries(query)
			.flatMap(([key, value]) => encodeFormEntry(key, value))
			.join("&");

	}

	function encodeFormEntry(key: string, value: unknown): string[] {

		const encodedKey = encodeURIComponent(key);

		return value === null ? [`${encodedKey}=null`]
			: isArray(value) ? value.flatMap(v => encodeFormEntry(key, v))
				: isObject(value) ? encodeFormDictionary(encodedKey, value as Record<string, unknown>)
					: [`${encodedKey}=${encodeFormValue(value)}`];

	}

	function encodeFormDictionary(encodedKey: string, dict: Record<string, unknown>): string[] {

		// localised text map: flatten each tag as a single postfix @tag suffix

		return Object.entries(dict).flatMap(([tag, value]) =>
			isArray(value) ? value.map(v => `${encodedKey}=${encodeFormValue(v)}%40${tag}`)
				: [`${encodedKey}=${encodeFormValue(value)}%40${tag}`]
		);

	}

	function encodeFormValue(value: unknown): string {

		// Strings are double-quoted with inner quotes escaped

		return isString(value)
			? encodeURIComponent(`"${value
				.replace(/\\/g, "\\\\")
				.replace(/"/g, "\\\"")
			}"`)
			: encodeURIComponent(String(value));

	}


	function internalizeIRIs(base: string, q: Selection): Selection {
		return JSON.parse(JSON.stringify(q), (_key, value) =>
			isIRI(value, "absolute") ? internalize(base, value) : value
		);
	}

}

/**
 * Decodes a selection from a URL-safe string.
 *
 * Parses an
 * [`application/x-www-form-urlencoded`](https://url.spec.whatwg.org/#application/x-www-form-urlencoded) string into
 * a {@link Selection}, recursively {@link resolve | resolving} internal IRIs against the provided `base`. The decoded
 * selection is validated and deeply frozen unless `lenient` is `true`.
 *
 * > [!NOTE]
 * > The decoder accepts both canonical and shorthand forms:
 * >
 * > - Prefix operators (canonical): `>=price=100`
 * > - Postfix operators (shorthand): `price>=100`
 * > - Double-quoted strings (canonical): `name="widget"`
 * > - Unquoted strings (shorthand): `name=widget`
 * > - A string value may carry a single postfix `@tag` suffix, lifting it into a one-entry {@link Text} map
 * >
 * > Keyed values are always reconstructed in the multi-valued form, since {@link Options} are inherently multi-valued
 * > and scalar/array forms are indistinguishable in form encoding.
 *
 * > [!WARNING]
 * > The codec treats the `@tag` suffix as an opaque key and assigns it no semantic meaning. Consumers are
 * > responsible for interpreting the resulting {@link Text} map using schema-based information.
 *
 * @param encoded The form-encoded {@link Selection} string
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} selection with resolved IRIs
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 * @throws {Error} If `encoded` is malformed or unparseable
 *
 * @example
 *
 * ```typescript
 * decodeSelection("~name=widget&price>=50&^price=1&#=25");
 * // → { "~name": "widget", ">=price": 50, "^price": 1, "#": 25 }
 * ```
 *
 * @see {@link encodeSelection}
 */
export function decodeSelection(encoded: string, {

	base = defaultBase,
	lenient

}: DecoderOpts = {}): Selection {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}


	return immutable(decode(), lenient ? (_v): _v is Selection => true : isSelection, "malformed query");


	function decode() {
		try {

			if ( encoded === "" ) {

				return {};

			} else {

				// form format (application/x-www-form-urlencoded) parsed via Peggy grammar
				// decode keys separately while preserving encoded values for the parser's value handling

				return resolveIRIs(base, QueryParser.parse(parseForm(encoded), { startRule: "Query" }));

			}

		} catch ( cause ) {

			throw new Error(`malformed query <${encoded}>`, { cause });

		}
	}

	function parseForm(query: string): string {

		return query.split("&").map(pair => {

			const eqIndex = pair.indexOf("=");

			if ( eqIndex === -1 ) {
				return decodeURIComponent(pair);
			} else {
				const key = pair.slice(0, eqIndex);
				const value = pair.slice(eqIndex+1);
				return decodeURIComponent(key)+"="+value;
			}

		}).join("&");

	}


	function resolveIRIs(base: string, parsed: Selection): Selection {
		return JSON.parse(JSON.stringify(parsed), (_key, value) =>
			isIRI(value, "internal") ? resolve(base, value) : value
		);
	}

}


/**
 * Encodes a probe as a key string.
 *
 * Serialises a parsed {@link Probe} back into its compact string representation suitable for use as a
 * {@link Projection} or {@link Selection} key.
 *
 * @param probe The probe to encode
 *
 * @returns The encoded key string
 *
 * @example
 *
 * ```typescript
 * encodeProbe({ target: ">=", pipe: ["year"], path: ["releaseDate"] });
 * // → '>=year:releaseDate'
 * ```
 *
 * @see {@link decodeProbe}
 */
export function encodeProbe(probe: Probe): string {

	const { target, pipe, path } = probe;

	const pipeString = pipe.map(p => `${p}:`).join("");
	const pathString = path.join(".");

	const expression = pipeString+pathString;

	return isIdentifier(target)
		? expression === target ? target : `${target}=${expression}`
		: `${target}${expression}`;

}

/**
 * Decodes a key string into a probe.
 *
 * Parses a key string into its structural {@link Probe} components, distinguishing projection keys
 * from constraint keys based on the presence of an {@link Operator} prefix.
 *
 * @param key The query key string to decode
 *
 * @returns The parsed deeply {@link immutable} probe
 *
 * @throws {Error} If `key` is malformed or unparseable
 *
 * @example
 *
 * ```typescript
 * decodeProbe(">=year:releaseDate");
 * // → { target: ">=", pipe: ["year"], path: ["releaseDate"] }
 * ```
 *
 * @see {@link encodeProbe}
 */
export function decodeProbe(key: string): Probe {

	try {

		const probe = QueryParser.parse(key, { startRule: "Probe" });

		return immutable(probe, isProbe, "malformed probe");

	} catch ( cause ) {
		throw new Error(`malformed probe <${key}>`, { cause });
	}

}
