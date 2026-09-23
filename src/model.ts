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
 * Defines types for specifying the data envelope to retrieve in REST/JSON APIs, including property projection, linked
 * resource expansion, and, for collections, filtering, sorting, and pagination.
 *
 * <img src="model.svg" alt="Model type hierarchy" style="zoom: 1.75; display: block; margin: auto;" />
 *
 * > [!NOTE]
 * > QEST's [design rationale](./index.md#5-client-driven-retrieval) covers the client-driven retrieval approach;
 * > [Appendix A](./index.md#appendix-a-target-backends) covers cross-backend semantics and normalisation.
 *
 * **Retrieval model**
 *
 * - {@link Template} — Resource retrieval template
 * - {@link Projection} — Collection property projection
 * - {@link Slot} — Template value model
 * - {@link Cell} — Projection value model
 * - {@link Placeholder} — Property value template
 * - {@link Atomic} — Atomic value template
 * - {@link Locale} — Localised text map template (structured language-tagged value)
 * - {@link Union} — Union-typed property template
 * - {@link Branch} — Union branch key
 * - {@link Query} — Constrained retrieval node
 * - {@link Criteria} — Collection retrieval constraints
 * - {@link Binding} — Named computed expression
 * - {@link Expression} — Computed expression
 * - {@link Pipe} — Transform pipe
 * - {@link Path} — Property path
 * - {@link Options} — Constraint option set
 * - {@link Option} — Constraint option
 * - {@link Probe} — Parsed {@link Criteria} or {@link Projection} key
 * - {@link Operator} — Constraint operator symbols
 * - {@link Order} — Sort order direction and precedence
 * - {@link Transform} — Value transforms for computed {@link Expression | expressions}
 * - {@link Aggregate} — Aggregate transform
 * - {@link TransformSignature} — Static typing profile of a {@link Transform}
 * - {@link Transforms} — Signature table covering every {@link Transform}
 *
 * **Type guards**
 *
 * - {@link isTemplate} — checks if a value is a {@link Template}
 * - {@link isProjection} — checks if a value is a {@link Projection}
 * - {@link isSlot} — checks if a value is a {@link Slot}
 * - {@link isCell} — checks if a value is a {@link Cell}
 * - {@link isPlaceholder} — checks if a value is a {@link Placeholder}
 * - {@link isAtomic} — checks if a value is an {@link Atomic}
 * - {@link isLocale} — checks if a value is a {@link Locale}
 * - {@link isUnion} — checks if a value is a {@link Union}
 * - {@link isBranch} — checks if a value is a {@link Branch} key
 * - {@link isQuery} — checks if a value is a {@link Query} over a given retrieval form
 * - {@link isCriteria} — checks if a value is a {@link Criteria}
 * - {@link isCriterion} — checks if an entry is a valid {@link Criteria} entry
 * - {@link isSelector} — checks if a value is a {@link Criteria} constraint key
 * - {@link isBinding} — checks if a value is a {@link Binding}
 * - {@link isExpression} — checks if a value is an {@link Expression}
 * - {@link isOptions} — checks if a value is an {@link Options} set
 * - {@link isOption} — checks if a value is an {@link Option}
 * - {@link isOrder} — checks if a value is an {@link Order}
 * - {@link isProbe} — checks if a value is a {@link Probe}
 * - {@link isOperator} — checks if a value is an {@link Operator}
 * - {@link isTransform} — checks if a value is a {@link Transform}
 * - {@link isAggregate} — checks if a value is an {@link Aggregate}
 *
 * **Accessors**
 *
 * - {@link getOrderPrecedence} — resolves an {@link Order} to its sort precedence
 * - {@link getOrderDirection} — resolves an {@link Order} to its sort direction
 *
 * **Codecs**
 *
 * - {@link encodeTemplate} — encodes a {@link Template} as URL-safe JSON
 * - {@link decodeTemplate} — decodes a {@link Template} from URL-safe JSON
 * - {@link encodeCriteria} — encodes a {@link Criteria} as a form-urlencoded string
 * - {@link decodeCriteria} — decodes a {@link Criteria} from a form-urlencoded string
 * - {@link encodeProbe} — encodes a {@link Probe} as a key string
 * - {@link decodeProbe} — decodes a {@link Probe} from a key string
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
 *   id: {},               // resource identifier
 *   name: {},             // string property
 *   price: {},            // numeric property
 *   available: {},        // boolean property
 *   vendor: {             // nested resource, expanded
 *     id: {},
 *     name: {}
 *   }
 * };
 * ```
 *
 * Every request is an object and every leaf is `{}`, the {@link Atomic} standing for the value as it comes: a
 * literal, the reference of a linked resource left unexpanded, or the coalesced label of a localised property. A
 * template carries no data of its own, so what a client writes is a pure statement of what it wants back. The empty
 * request `{}` states nothing and brings back the server defaults.
 *
 * ## Collection Retrieval
 *
 * A collection is reached through the resource that owns it, following REST/JSON practice, and is constrained
 * there: the entry naming it carries the {@link Criteria} keys that filter, sort, and paginate it alongside the
 * per-item keys. A single call retrieves filtered, sorted, and paginated results with arbitrarily deep expansions:
 *
 * ```typescript
 * const template: Template = {
 *   items: {
 *
 *     id: {},                                // per-item keys
 *     name: {},
 *     price: {},
 *     vendor: { id: {}, name: {} },          // nested resource
 *
 *     ">=price": 50,                         // price ≥ 50
 *     "<=price": 150,                        // price ≤ 150
 *     "~name": "widget",                     // name contains "widget"
 *     "?category": ["electronics", "home"],  // category in list
 *     "^price": 1,                           // sort by price ascending
 *     "^name": -2,                           // then by name descending
 *     "@": 0,                                // skip first 0 results
 *     "#": 25                                // return at most 25 results
 *
 *   }
 * };
 * ```
 *
 * Cardinality is not stated by the notation: the same entry shape serves a single-valued and a multi-valued
 * property, and which one a field names is settled by the model. Constraints are simply meaningless on a
 * single-valued property and are rejected there.
 *
 * ## Localised Properties
 *
 * A localised property is retrieved in either of two ways. An {@link Atomic} yields its **coalesced** label, the
 * plain string resolved under the request's negotiated language priority; a {@link Locale} map yields the tagged
 * values **structurally**, as a {@link Dictionary} restricted to the locales its {@link TagRange} keys select:
 *
 * ```typescript
 * const template: Template = {
 *   id: {},
 *   label: {},                          // coalesced under language negotiation
 *   title: { "*": {} },                 // all available languages
 *   description: { "en": {}, "fr": {} } // English and French
 * };
 * ```
 *
 * The `TagRange` keys are RFC 4647 basic language ranges that filter which locales populate the map (the standalone
 * `*` matches every tag, and a plain range such as `en` also matches more specific tags like `en-US`). Per-tag
 * cardinality follows the property, not the template. Tag ranges select retrieved content only and are independent
 * of {@link Criteria}: a `Locale` map carries `TagRange` keys, never constraint keys. Resource matching by localised
 * text is done separately, at the enclosing collection via `?`/`!`.
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
 * Plain transforms operate on individual values and may project literals, linked resource references,
 * nested {@link Template | templates} expanding a linked resource inline, or {@link Locale} tag-range maps
 * declaring a localised cell that yields a complete {@link Dictionary} value per row:
 *
 * ```typescript
 * const projection: Projection = {
 *   "id=id": {},
 *   "name=name": {},
 *   "price=price": {},
 *   "vendorName=vendor.name": {},              // property path
 *   "releaseYear=year:releaseDate": {},        // transform
 *   "vendorRow=vendor": { id: {}, name: {} },  // nested template
 *   "label=title": { "*": {} }                 // localised cell (full Dictionary value per row)
 * };
 * ```
 *
 * A projection emits **distinct** rows: rows with the same combination of cell values collapse into one, so the
 * result is the set of distinct binding tuples rather than a multiset. Distinctness spans the whole collection,
 * folding both multi-valued fan-out duplicates and equal tuples from different items; include an identifying
 * binding such as `id` (as above) to keep otherwise-equal items on separate rows.
 *
 * ## Aggregate Grouping
 *
 * Aggregate {@link Transform | transforms} operate on sets of values. A collection is evaluated under
 * grouped semantics when at least one {@link Projection} binding resolves to an aggregate
 * {@link Expression}; otherwise it stays ungrouped, every item is projected on its own, and an aggregate
 * constraint reduces over the values its path gathers from the item under evaluation, filtering, sorting,
 * or ranking the items by that reduction.
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
 * ordering expression MUST reference an existing grouping key, and processors MUST reject one that
 * matches none.
 *
 * Rows sharing the same grouping-key values collapse into a single group. Aggregate filter and
 * ordering constraints are independent of any projected bindings: an aggregate may appear in a
 * constraint without being projected, and a projected aggregate may appear without being constrained.
 *
 * Aggregate expressions use bag semantics over their inputs: `count:` (empty path) returns the
 * number of rows in scope; a non-empty path (for example, `sum:price`) ranges over the values
 * resolved by the path for each input row, with multi-valued path fan-outs contributing every
 * resolved value individually. No implicit deduplication is applied: clients needing
 * distinct-value aggregates project the value of interest as a non-aggregate grouping binding.
 *
 * ```typescript
 * const template: Template = {
 *   items: {
 *     "vendor=vendor": { id: {}, name: {} },  // group by vendor
 *     "items=count:": {},                     // count of items per vendor
 *     "avgPrice=avg:price": {}                // average price per vendor
 *   }
 * };
 * ```
 *
 * The ungrouped reduction states cardinality constraints over a plain template, retrieving the vendors
 * carrying at least three products:
 *
 * ```typescript
 * const template: Template = {
 *   vendors: {
 *     id: {},
 *     name: {},
 *     ">=count:products": 3
 *   }
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
 *   items: {
 *     "category=category": {},
 *     "count=count:": {},
 *     "^count:": "desc"
 *   }
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
 *   items: {
 *     "min=min:price": {},
 *     "max=max:price": {}
 *   }
 * };
 *
 * // → { items: [{ min: 9.99, max: 1299.00 }] }
 *
 * // Total product count
 *
 * const productCount: Template = {
 *   items: {
 *     "count=count:": {}
 *   }
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
 * variants, and an unmatched variant is skipped at runtime. Branch out only where the alternatives want different
 * shapes; where one shape serves them all, a plain {@link Placeholder} addresses the property directly:
 *
 * ```typescript
 * const template: Template = {
 *   id: {},
 *   creator: {
 *     "0": { id: {}, name: {} },       // a person-shaped branch
 *     "1": { id: {}, legalName: {} }   // an organisation-shaped branch
 *   }
 * };
 * ```
 *
 * # Expressions
 *
 * A {@link Projection} {@link Binding} key pairs a result name with a computed value: a pipeline of
 * {@link Transform} and a property path (together an {@link Expression}). The result name and its `=` are
 * mandatory; a bare identifier is not a binding:
 *
 * ```text
 * binding     = name '=' expression
 * name        = identifier
 * expression  = transform* path?
 * transform   = identifier ':'
 * path        = identifier ( '.' identifier )*
 * ```
 *
 * - Identifiers follow {@link Identifier} rules (ECMAScript names)
 * - Transforms form a pipeline applied right-to-left (functional composition order)
 * - An empty path computes aggregates over the input collection
 *
 * ```text
 * vendorName=vendor.name       // named nested property path
 * total=sum:items.price        // named computed aggregate
 * result=round:avg:scores      // pipeline: inner transform applied first
 * count=count:                 // empty path (aggregate over the collection)
 * ```
 *
 * # Value Ordering
 *
 * Comparison (`<`, `>`, `<=`, `>=`) and sort (`^`) operators rely on a total ordering over values defined by the
 * {@link https://www.w3.org/TR/xpath-functions-20/#comparison-operators XPath 2.0 comparison operators}, which are in
 * turn based on {@link https://www.w3.org/TR/xmlschema11-2/#rf-order XSD ordered value spaces}. These operators, along
 * with sort focus (`+`), target {@link Literal} values only; {@link Reference} values, nested {@link Template}
 * resources, and {@link Dictionary} values are neither comparable nor sortable:
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
 * # Result Typing
 *
 * A template says what to retrieve, not what the retrieved values are: an {@link Atomic} leaf stands for whatever
 * the property holds, so a template alone cannot tell a `string` property from a `number` one. Result types come
 * from the declared model instead. The keys a client writes and the keys it reads back differ too: {@link Criteria}
 * constraints carry nothing back, and a {@link Binding} lands under its result name, the part before the `=`.
 *
 * # Serialisation
 *
 * ## Template Serialisation
 *
 * {@link Template} objects are serialised as JSON via {@link encodeTemplate} / {@link decodeTemplate}, with IRI
 * internalisation and resolution handled transparently. The encoder emits plain JSON by default and optionally
 * URL-encoded JSON or URL-safe base64url-encoded JSON for transport; the decoder auto-detects the input encoding.
 *
 * ## Criteria Serialisation
 *
 * {@link Criteria} objects are serialised as
 * {@link https://url.spec.whatwg.org/#application/x-www-form-urlencoded application/x-www-form-urlencoded} strings via
 * {@link encodeCriteria} / {@link decodeCriteria} for transmission as URL query strings in GET requests.
 *
 * > [!WARNING]
 * > Form serialisation carries constraints alone; servers are expected to convert to a collection template by merging
 * > them into the entry naming the target endpoint's collection property, alongside a default per-item retrieval
 * > template.
 *
 * The format encodes queries as `label=value` pairs where:
 *
 * - Labels use the same prefixed operator syntax as {@link Criteria} constraint keys
 * - Each pair carries a single value; repeated labels are merged into arrays where accepted
 * - Postfix aliases provide natural form syntax for some operators:
 *   - `expression=value` for `?expression=value` (disjunctive matching)
 *   - `expression<=value` for `<=expression=value` (less than or equal)
 *   - `expression>=value` for `>=expression=value` (greater than or equal)
 *
 * Values use {@link https://www.rfc-editor.org/rfc/rfc8259 JSON} primitive syntax, with a {@link Dictionary} entry
 * inlined through a single postfix `@tag` suffix:
 *
 * ```text
 * value       = null | literal | tagged
 * literal     = boolean | number | string
 * tagged      = string '@' tag
 * tag         = BCP 47 language tag
 * ```
 *
 * - {@link Reference}s are serialised as strings
 * - A string may carry a single `@tag` suffix, lifting it into a one-entry {@link Dictionary}
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

import { error, Identifier, isArray, isIdentifier, isObject, isString, key } from "@metreeca/core";
import { decodeBase64, encodeBase64 } from "@metreeca/core/base64";
import { TagRange } from "@metreeca/core/language";
import { app, getNamespaceIRI, internalize, isIRI, resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { type DecoderOpts, type EncoderOpts } from "./index.js";
import { isAtomic, isCriteria, isProbe, isTemplate } from "./model.core.js";
import * as CriteriaParser from "./model.pegjs.js";
import { Dictionary, type Literal, type Reference, Resource } from "./state.js";

export * from "./model.core.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * Resource retrieval template.
 *
 * Requests a shaped view of a {@link Resource}: each {@link Identifier} key names a property to retrieve, and its
 * {@link Slot} value says how far to go, from the property's own value to an arbitrarily deep expansion of the
 * resources it links to. A property left out of the map is left out of the response, so a client pays for exactly what
 * it asks for.
 *
 * Where the named property is multi-valued, the same entry doubles as the collection request: it carries the
 * {@link Criteria} keys that filter, sort, and paginate that collection alongside the per-item keys, so one entry
 * states both what to retrieve and which items to retrieve it for. A collection is never addressed on its own: it is
 * reached through the resource that owns it, and constrained there.
 *
 * ```typescript
 * const template: Template = {
 *   name: {},                          // the property's own value
 *   vendor: { name: {} },              // a linked resource, expanded
 *   items: { name: {}, "#": 25 },      // a collection, per-item keys and constraints together
 *   title: { "*": {} }                 // a localised property, by tag range
 * };
 * ```
 *
 * > [!IMPORTANT]
 * > A template MUST include at least one field: the empty object `{}` is an {@link Atomic}. The type admits it only
 * > because TypeScript cannot express a non-empty index signature; {@link isTemplate} rejects it at runtime.
 *
 * > [!IMPORTANT]
 * > Entries MUST agree with the type declared for their key by the target model; processors reject a template whose
 * > entries do not, with an error. The `Template` type states the notation rather than policing it: the key spaces
 * > overlap by design and the forms are told apart by the model, so structural integrity is a runtime concern.
 */
export type Template = {

	readonly [field: Identifier]: Query<Slot>

}

/**
 * Collection property projection.
 *
 * Requests a collection as rows of computed values rather than as items: each {@link Binding} key names a result and
 * the {@link Expression} that computes it, from a property path optionally piped through {@link Transform | transforms}
 * and aggregates. Reach for it to compute totals, ranges, and category counts server-side, in the same call that
 * retrieves the data, rather than fetching items and reducing them client-side.
 *
 * ```typescript
 * const projection: Projection = {
 *   "vendor=vendor": { name: {} },  // group by vendor, expanded
 *   "items=count:": {},             // items per vendor
 *   "avgPrice=avg:price": {}        // average price per vendor
 * };
 * ```
 *
 * Each binding yields one {@link Cell} per row, holding a single value, so a binding never nests a `Projection`. A
 * projection stands as the entry of the {@link Template} field naming the collection, carrying that collection's
 * {@link Criteria} alongside its bindings.
 *
 * > [!IMPORTANT]
 * > A projection MUST include at least one binding: the empty object `{}` is an {@link Atomic}. The type admits it only
 * > because TypeScript cannot express a non-empty index signature; {@link isProjection} rejects it at runtime.
 *
 * > [!IMPORTANT]
 * > Result names (the {@link Identifier} portion before `=`) MUST be unique within a projection: duplicates collide
 * > on the same cell and are rejected.
 *
 * > [!IMPORTANT]
 * > A projection yields **distinct** rows: rows with the same combination of cell values collapse into one, across
 * > the whole collection. Include an identifying binding such as `"id=id"` to keep otherwise-equal items apart.
 *
 * > [!IMPORTANT]
 * > When any binding resolves to an aggregate {@link Expression}, the collection is evaluated under grouped semantics
 * > and the non-aggregate bindings form the grouping key; see {@link Criteria} for how constraints partition across
 * > the grouping.
 */
export type Projection = {

	readonly [field: Binding]: Cell

}


/**
 * Template value model.
 *
 * The value a {@link Template} entry takes, whatever the property its field names:
 *
 * - {@link Cell} — the property's own values, each one shaped
 * - {@link Projection} — the collection the property names, as rows of computed values
 *
 * The {@link Criteria} constraining a collection are merged in at the entry through {@link Query} rather than carried
 * here.
 */
export type Slot =
	| Cell
	| Projection

/**
 * Projection value model.
 *
 * The value a {@link Projection} binding takes:
 *
 * - {@link Placeholder} — one shape, whatever the value turns out to be
 * - {@link Union} — one shape per type, chosen branch by branch
 *
 * The same forms stand as the non-projection half of a {@link Slot}. Cardinality sits on the side: a binding yields
 * one value per row and a template entry one per property value, so neither nests a `Projection`.
 */
export type Cell =
	| Placeholder
	| Union<Placeholder>


/**
 * Property value template.
 *
 * The forms an entry takes wherever one property value is requested:
 *
 * - {@link Template} — expand the linked resource, retrieving the properties the nested template names
 * - {@link Atomic} — retrieve the value as it comes, with no further shape
 * - {@link Locale} — retrieve a localised property tag by tag, as a structured {@link Dictionary}
 *
 * The three are notated alike, as objects, and are told apart by the type the model declares for the target
 * property rather than by their own shape.
 */
export type Placeholder =
	| Template
	| Atomic
	| Locale

/**
 * Atomic value template.
 *
 * Requests a property's value as it stands, ending the retrieval: a {@link Literal}, the {@link Reference} of a
 * linked resource left unexpanded, or the coalesced label of a localised property under the request's negotiated
 * language priority. Written `{}`, it is the one leaf of the notation, so a request bottoms out the same way
 * whatever it targets and no part of a template carries a value of its own.
 *
 * Standing as a whole retrieval model rather than as a leaf, `{}` requests nothing beyond the server defaults, as if
 * the request carried no query component. It is never a {@link Template}, {@link Projection}, {@link Locale} or
 * {@link Union}, each of which requires at least one entry.
 */
export type Atomic = {

	readonly [key]?: never

}

/**
 * Localised text map template.
 *
 * Requests a localised property as a structured {@link Dictionary}, keeping the language tags that coalesced access
 * discards. Each {@link TagRange} key is an RFC 4647 basic language range selecting which locales populate the
 * retrieved map by basic filtering: the standalone `*` matches every tag, and a range such as `en` matches `en`
 * along with more specific tags like `en-US`, so one range may bring back several entries.
 *
 * ```typescript
 * const template: Template = {
 *   title: { "*": {} },              // every available language
 *   description: { en: {}, fr: {} }  // English and French
 * };
 * ```
 *
 * The value slot carries no request of its own: every entry is the {@link Atomic} leaf, and per-tag cardinality
 * follows the property rather than the template. Tag ranges select retrieved content only, so a locale map takes no
 * {@link Criteria}: matching resources by localised text is stated at the enclosing collection instead, through the
 * `?` and `!` operators.
 *
 * > [!IMPORTANT]
 * > A locale map MUST include at least one tag range: the empty object `{}` is an {@link Atomic}. The type admits it
 * > only because TypeScript cannot express a non-empty index signature; {@link isLocale} rejects it at runtime.
 *
 * > [!NOTE]
 * > The `@none` key for non-localised values is not supported; use the `und` tag for language-neutral values.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html RFC 4647 - Matching of Language Tags}
 */
export type Locale = {

	readonly [range: TagRange]: Atomic

}


/**
 * Union-typed property template.
 *
 * Requests a union-typed property one branch at a time, so alternatives that need different shapes can each state
 * their own. Keys are opaque {@link Branch} labels telling the alternatives apart; which variants a branch retrieves
 * is fixed by matching its shape against the property's declared variants, never by its key, so
 * reordering or renaming variants at the source leaves an existing template valid. A variant left unmatched by every
 * branch contributes no values, and a branch matching no variant is unsatisfiable and is rejected.
 *
 * ```typescript
 * const template: Template = {
 *   creator: {
 *     "0": { name: {} },      // a person-shaped variant
 *     "1": { legalName: {} }  // an organisation-shaped variant
 *   }
 * };
 * ```
 *
 * A branch holds one value, never a collection: cardinality belongs to the property as a whole, and the
 * {@link Criteria} constraining it ride on the entry hosting the union. A branch never holds another union directly,
 * though a branch {@link Template} may carry unions of its own.
 *
 * > [!IMPORTANT]
 * > A union MUST include at least one branch: the empty object `{}` is an {@link Atomic}. The type admits it only
 * > because TypeScript cannot express a non-empty index signature; {@link isUnion} rejects it at runtime.
 *
 * See [Union](./index.md#55-union) for the design rationale.
 *
 * @typeParam T The form admitted per branch: a {@link Placeholder}, whether the union stands at a {@link Template}
 *              entry or in a {@link Projection} cell
 */
export type Union<T> = {

	readonly [branch: Branch]: T

}

/**
 * {@link Union} branch key.
 *
 * Labels one alternative of a union so its branches can be told apart. The label carries no meaning of its own: the
 * variants a branch retrieves are fixed by its shape, never by its label, so any set of distinct labels serves equally
 * well.
 *
 * > [!IMPORTANT]
 * > A branch key MUST be a canonical non-negative integer string with no leading zeros, such as `"0"` or `"42"`. The
 * > type also admits forms such as `"01"`, `"-1"` or `"1.5"` only because TypeScript cannot narrow a template literal
 * > to canonical integers; {@link isBranch} rejects them at runtime.
 */
export type Branch =
	`${number}`;



/**
 * Constrained retrieval node.
 *
 * Merges the {@link Criteria} constraining a collection into the node that retrieves it, so a multi-valued property
 * states what to retrieve and which items to retrieve it for in one object. Reach for it to describe an entry that
 * may address a collection: the merged form leaves every constraint key optional, so the same notation serves a
 * single-valued property, which simply carries none.
 *
 * ```typescript
 * const items: Query<Placeholder> = {
 *   name: {},        // per-item keys
 *   ">=price": 50,   // collection constraints
 *   "#": 25
 * };
 * ```
 *
 * The merge is admitted on every retrieval form, keeping one notation for every entry rather than carving out
 * exceptions. Where a constraint key means anything is settled by the target rather than by the notation: only a
 * multi-valued property is narrowed by {@link Criteria}. A constraint key reaching a target that admits none is an
 * error rather than a key to ignore, and processors MUST reject it, reporting the offending key: on a single-valued
 * property, which supplies no collection to constrain, and on a {@link Locale}, which is filtered by its own tag
 * ranges.
 *
 * @typeParam T The retrieval form the constraints are merged into
 */
export type Query<T> =
	T extends unknown // distribute over union arms
		? { readonly [K in keyof T | keyof Criteria]?: T[K & keyof T] | Criteria[K & keyof Criteria] }
		: never

/**
 * Collection retrieval constraints.
 *
 * Narrows a collection to the items a client actually wants: which to keep, in what order, and how many. Constraint
 * keys use the `"{operator}{expression}"` syntax, where the {@link Operator} determines the constraint type and the
 * {@link Expression} identifies the target property or computed value. Pagination uses the literal `"@"` and
 * `"#"` keys.
 *
 * Constraints ride on the entry retrieving the collection they apply to, merged in alongside its retrieval keys
 * through {@link Query}. A {@link Locale} entry is filtered by its own tag ranges and takes none; a localised
 * property is matched at the enclosing collection instead, through `?` and `!`.
 *
 * > [!IMPORTANT]
 * > Filtering and ordering {@link Expression | expressions} are resolved independently of any sibling
 * > {@link Projection} bindings: an aggregate constraint may reference an aggregate that is not
 * > projected, and a projected aggregate binding need not appear in any constraint. Where a sibling
 * > projection binding resolves to an aggregate, the collection is grouped and each constraint's role
 * > depends on whether it references an aggregate: non-aggregate filters restrict the input set
 * > before grouping; a non-aggregate ordering expression sorts the groups by one of the grouping
 * > keys; aggregate filters select groups after aggregation; aggregate ordering expressions sort the
 * > groups by their post-aggregation values. Grouping is fixed by the projection alone and is never
 * > inferred from a constraint: a non-aggregate ordering expression MUST reference an existing grouping
 * > key, and processors MUST reject one that matches none. Without grouping, an aggregate constraint
 * > reduces over the values its path gathers from each item, constraining the items by that reduction.
 */
export type Criteria = {

	/**
	 * Less-than filter.
	 *
	 * Includes resources where at least one expression value is strictly less than the {@link Literal}
	 * under the value-ordering rules.
	 *
	 * Applicable only where the target {@link Expression} resolves to a {@link Literal} (`boolean`, `number`,
	 * `string`); {@link Reference}, nested resources, and {@link Dictionary} values are not comparable. The bound
	 * and the resolved value MUST share the same type; cross-type comparison is unpredictable and a validating
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
	 * `string`); {@link Reference}, nested resources, and {@link Dictionary} values are not comparable. The bound
	 * and the resolved value MUST share the same type; cross-type comparison is unpredictable and a validating
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
	 * `string`); {@link Reference}, nested resources, and {@link Dictionary} values are not comparable. The bound
	 * and the resolved value MUST share the same type; cross-type comparison is unpredictable and a validating
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
	 * `string`); {@link Reference}, nested resources, and {@link Dictionary} values are not comparable. The bound
	 * and the resolved value MUST share the same type; cross-type comparison is unpredictable and a validating
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
	 * Applicable to {@link Literal} and {@link Reference} properties (value or IRI equality) and to localised
	 * properties through the {@link Dictionary} option form; a nested resource is matched by its
	 * {@link Reference}, not its embedded state. The option MUST match the type of the target {@link Expression}'s
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
	 * Applicable to {@link Literal} and {@link Reference} properties (value or IRI equality) and to localised
	 * properties through the {@link Dictionary} option form; a nested resource is matched by its
	 * {@link Reference}, not its embedded state. The option MUST match the type of the target {@link Expression}'s
	 * resolved value; a type-inconsistent option is unpredictable and a processor MUST reject it.
	 */
	readonly [all: `!${Expression}`]: Options


	/**
	 * Sort focus.
	 *
	 * Companion to sort order (`^`): resources whose expression value is one of the values in the {@link Options} set
	 * rank before the rest, with the regular `^` sort applied within each group; focus takes precedence over `^`.
	 *
	 * Membership is tested by equality, so an option MUST match the target value's type; a type-inconsistent option
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
	 * Orders results by expression value according to the value-ordering rules. The {@link Order} value gives the sort
	 * direction and its precedence among multiple sort keys.
	 *
	 * > [!WARNING]
	 * > `^` requires a single-valued {@link Literal} sort key (`boolean`, `number`, `string`). A {@link Reference} or
	 * > nested-resource target is not sortable. A multi-valued literal property is likewise invalid directly: reduce
	 * > it explicitly with a `min`/`max` aggregate, which supplies the single ordering key the operator needs.
	 */
	readonly [order: `^${Expression}`]: Order


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
 * Property key for {@link Projection} fields that assigns a result name to a computed {@link Expression}, in the
 * `{name}={expression}` form. A `Projection` key always carries the `=`, keeping the binding key space disjoint from
 * the plain {@link Identifier} keys of a {@link Template} (see [Projection](./index.md#52-projection)).
 *
 * @example
 *
 * ```typescript
 * const projection: Projection = {
 *   "name=name": {},                    // property binding
 *   "vendorName=vendor.name": {},       // path binding
 *   "releaseYear=year:releaseDate": {}  // transform binding
 * };
 * ```
 */
export type Binding =
	`${Identifier}=${Expression}`;

/**
 * Computed expression.
 *
 * String syntax pairing a transform pipe with a property path, used in {@link Projection} bindings and
 * {@link Criteria} constraint keys to identify the target property or computed value:
 *
 * - **pipe** — a possibly empty {@link Pipe} naming the right-to-left transform chain to apply; each transform
 *   name carries a trailing colon, so no extra separator sits between the pipe and the path
 * - **path** — a possibly empty {@link Path} navigating to a nested value within the resource
 *
 * With an empty pipe the expression resolves to the path's raw value; with an empty path it denotes an aggregate
 * over the root collection.
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
 */
export type Expression =
	`${Pipe}${Path}`;

/**
 * Transform pipe.
 *
 * Possibly empty sequence of colon-terminated {@link Transform} names identifying a chain of value transformations
 * within an {@link Expression} (for example, `round:avg:`). Transforms are applied right-to-left in functional
 * composition order; the empty pipe denotes the identity transformation and passes the value through unchanged.
 *
 * Composition rules and valid/invalid combinations are defined in [Transform Pipe
 * Composition](./index.md#582-transform-pipes).
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; pipe syntax is validated at runtime by query processors.
 */
export type Pipe =
	string;

/**
 * Property path.
 *
 * Possibly empty dot-separated sequence of property names navigating to a value within a resource (for example,
 * `order.items.price`). Path steps follow {@link Identifier} rules (ECMAScript names) and always refer to actual
 * resource property names, never to projected computed properties defined by {@link Binding | bindings}. The empty
 * string refers to the root value and, in {@link Expression | expressions}, denotes an aggregate over the input
 * collection.
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
	string;


/**
 * Constraint option set.
 *
 * A single {@link Option} scalar, a {@link Dictionary} of localised options, or an array of {@link Option}
 * elements. Specifies the set of values for {@link Criteria} matching (`?` and `!`) and sort focus (`+`)
 * operators. Arrays follow set semantics: duplicate values are ignored, ordering is immaterial, and empty arrays
 * are treated as absent constraints. Element types may be mixed.
 *
 * > [!NOTE]
 * > Options are inherently multi-valued regardless of the cardinality of the target property: matching and ordering
 * > operators always work against a set of candidate values. The scalar {@link Option} branch is accepted as a
 * > shorthand for a single-element option set.
 *
 * > [!IMPORTANT]
 * > When constraining a localised property, use the {@link Dictionary} branch so option values carry their
 * > language tags inline. The scalar {@link Option} and array `readonly Option[]` branches target
 * > non-localised properties; reaching a localised slot through them is a typing escape hatch, not an intended mode.
 * > Branch/target consistency is not enforced by the type system ({@link Criteria} keys are opaque
 * > {@link Expression} strings that sever the value form from the target property), so processors MUST reject
 * > inconsistent `Options`: an untagged {@link Option} or array against a localised property, or a
 * > {@link Dictionary} against a non-localised one.
 *
 * > [!IMPORTANT]
 * > Consumers MUST accept both scalar and array {@link Dictionary} forms when filtering or constraining on
 * > localised properties, regardless of the target property's cardinality: codec roundtrips may normalise
 * > between the two forms (see {@link decodeCriteria}).
 */
export type Options =
	| Option
	| Dictionary
	| readonly Option[]

/**
 * Constraint option.
 *
 * Single value accepted by {@link Criteria}'s matching (`?` and `!`) and sort focus (`+`) operators:
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
 * Sort order.
 *
 * Direction and precedence of a {@link Criteria} sort order (`^`) criterion:
 *
 * - `"asc"` — ascending, shorthand for `+1`
 * - `"desc"` — descending, shorthand for `-1`
 * - `number` — the sign gives direction (positive ascending, negative descending) and the absolute value gives
 *   1-based precedence among multiple sort keys (`1` is highest priority); zero is ignored
 *
 * Ordering follows the total value-ordering rules defined in [Sort Order](./index.md#575-sort-order).
 */
export type Order =
	| "asc"
	| "desc"
	| number;


/**
 * Parsed {@link Criteria} or {@link Projection} key.
 *
 * Structural representation of a {@link Projection} or {@link Criteria} key, decomposing the encoded string form
 * into its target, transform pipeline, and property path components. Projection and constraint probes share a single
 * shape: a decoded probe is read as a binding or as a constraint according to whether {@link isIdentifier} accepts
 * its `target`, which otherwise carries an {@link Operator}.
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
 */
export type Probe = {

	/**
	 * Projection binding identifier or constraint operator symbol.
	 *
	 * For projections, the {@link Identifier} portion of a {@link Binding}: the name before `=`. For
	 * constraints, the constraint {@link Operator} prefix.
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
 * Closed set of operator prefixes that distinguish a {@link Criteria} constraint key from a plain
 * {@link Binding | binding} identifier: the comparison, search, matching, focus, and ordering symbols prefix an
 * {@link Expression} naming the constrained value, while `@` and `#` stand alone as the pagination keys.
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
 * > The set of supported transforms is closed: only the names listed below are valid. Expressions and criteria
 * > referencing unknown transforms are rejected outright by {@link isExpression} and {@link isProbe}. Pipes that
 * > violate the structural composition rules (for example, aggregate after aggregate) are likewise rejected outright.
 * > Transforms MUST also be well-typed: a transform whose declared domain is met by no branch of its input type (for
 * > example, `abs` on a string) is rejected, while over a union-typed input the transform applies to its compatible
 * > branches and ignores the incompatible ones, whose values resolve to `undefined` for a scalar transform and drop
 * > from the input set for an aggregate.
 *
 * ## Type Mapping
 *
 * Transforms operate on JSON values but their semantics are defined in terms of
 * {@link https://www.w3.org/TR/xpath-functions/ XPath 2.0} / {@link https://www.w3.org/TR/xmlschema-2/ XSD 1.0} types.
 * The domain and range columns in the table below use the following type shorthands:
 *
 * - **literal** — any comparable literal: `xsd:boolean`, **numeric**, `xsd:string`, or **temporal**; excludes IRI
 * references, nested resources, and {@link Dictionary} values, which lack an ordering
 * - **numeric** — `xsd:integer` | `xsd:decimal` | `xsd:float` | `xsd:double`, mapped to JSON `number`
 * (IEEE 754 double); note that JSON numbers can only represent a subset of `xsd:integer` and `xsd:decimal` values
 * - **temporal** — `xsd:dateTime` | `xsd:date` | `xsd:time`, mapped to JSON `string`; note that
 * temporal types may be accepted only by a specific subset of temporal transforms. `xsd:duration` is not a
 * temporal processing type and is treated as an opaque `xsd:string`
 *
 * String-to-string transform pipes (for example, `lower`, `upper`) may also be applied to {@link Dictionary}
 * values: the pipe is applied individually to each string value in the dictionary. The `min`/`max`
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
 * {@link Aggregate | Aggregates} use bag semantics: every contributing value counts toward the result with no implicit
 * deduplication. The expression path determines the input — `count:` (empty path) counts the input rows, while a
 * non-empty path (for example, `sum:price`) ranges over the values resolved by the path for each input row, with
 * multi-valued path fan-outs contributing every resolved value individually. Distinct-value aggregates are obtained
 * through grouping (see the [Aggregate Grouping](#aggregate-grouping) section) by projecting the value of interest as
 * a non-aggregate binding.
 *
 * ## Error Handling
 *
 * A transform MUST be well-typed: a transform whose declared domain is met by no branch of its input type is
 * rejected. Over a union-typed input, the transform applies to its compatible branches and treats each
 * incompatible-branch value like `undefined`: a scalar transform maps it to `undefined`, and an aggregate skips it
 * before computing the result. See [Transform Pipes](./index.md#582-transform-pipes) and
 * [Aggregate Transforms](./index.md#5821-aggregate-transforms) for the full adopted semantics, including empty set
 * behaviour, multi-valued properties, and type promotion rules.
 *
 * The supported set is restricted to the intersection of well-defined counterparts across XPath 2.0, SPARQL 1.1,
 * SQL:2011, and GQL:2024; see [Client-Driven Retrieval](./index.md#5-client-driven-retrieval) for the
 * cross-backend design approach and [Target Backends](./index.md#appendix-a-target-backends)
 * for backend-specific adjustments.
 */
export type Transform =

	| Aggregate

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
 * Aggregate transform.
 *
 * The {@link Transform | transforms} that summarise a set of values into a single result, as opposed to the scalar
 * transforms, which are applied value by value and propagate the cardinality of their input. An expression carries at
 * most one of them, and its presence puts the enclosing collection under grouped semantics; see {@link Criteria} for
 * how constraints partition across the grouping.
 */
export type Aggregate =

	| "count"
	| "min"
	| "max"
	| "sum"
	| "avg"

/**
 * Static typing profile of a {@link Transform}.
 *
 * Captures how a transform derives its output shape from the input path shape: its aggregation kind, the input
 * domain it accepts, and the output processing type it produces. The {@link Transforms} table assigns one signature
 * to each {@link Transform}, driving both input validation and the cardinality and type of the resulting pipe.
 */
export type TransformSignature = {

	/**
	 * The transform's aggregation kind.
	 *
	 * - `false` — a scalar transform, applied value by value: the pipe yields as many values as the path resolves
	 * - `"partial"` — an aggregate (`min`, `max`, `avg`) summarising the input set into a single value, undefined
	 *   over an empty set
	 * - `"total"` — an aggregate (`count`, `sum`) summarising the input set into a single value, defined over an
	 *   empty set too (`0`)
	 */
	readonly aggregate: false | "partial" | "total",

	/**
	 * The transform's input domain.
	 *
	 * A pipe whose input type is wholly outside the domain (references and resources included) is rejected; over a
	 * union-typed input, values on the branches outside the domain drop to `undefined` rather than erroring.
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
 * @throws {@link !TypeError TypeError} If `base` is not a hierarchical IRI
 *
 * @example
 *
 * ```typescript
 * encodeTemplate(
 *   { items: { name: {}, "?vendor": "https://example.com/vendors/acme" } },
 *   { base: "https://example.com/" }
 * );
 * // → '{"items":{"name":{},"?vendor":"/vendors/acme"}}'
 * ```
 */
export function encodeTemplate(template: Template, {

	base = getNamespaceIRI(app),
	indent,
	format = "json"

}: EncoderOpts & {

	readonly format?: "json" | "url" | "base64"

} = {}): string {

	if ( base !== getNamespaceIRI(app) && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const json = JSON.stringify(template, internalizer, indent === true ? 2 : indent || undefined);

	return format === "url" ? encodeURIComponent(json)
		: format === "base64" ? encodeBase64(json, true)
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
 * The empty retrieval model `{}` is accepted alongside proper templates: it is an {@link Atomic} requesting nothing
 * beyond the server defaults, and callers are expected to serve it as a request carrying no query component.
 *
 * @param encoded The encoded {@link Template} or empty retrieval model, in any of the formats produced by
 *     {@link encodeTemplate}
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} template with resolved IRIs, or the empty retrieval model
 *
 * @throws {@link !TypeError TypeError} If `base` is not a hierarchical IRI
 * @throws {@link !TypeError TypeError} If the decoded value fails structural validation (unless `lenient` is `true`)
 * @throws {@link !SyntaxError SyntaxError} If `encoded` cannot be parsed as JSON, URL-encoded JSON, or
 * base64url-encoded JSON
 *
 * @example
 *
 * ```typescript
 * decodeTemplate(
 *   '{"items":{"name":{},"?vendor":"/vendors/acme"}}',
 *   { base: "https://example.com/" }
 * );
 * // → { items: { name: {}, "?vendor": "https://example.com/vendors/acme" } }
 * ```
 */
export function decodeTemplate(encoded: string, {

	base = getNamespaceIRI(app),
	lenient

}: DecoderOpts = {}): Template {

	if ( base !== getNamespaceIRI(app) && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const json = encoded.startsWith("{") ? encoded
		: encoded.startsWith("%") ? decodeURIComponent(encoded)
			: encoded.startsWith("e") ? decodeBase64(encoded)
				: error<string>(new TypeError("unknown encoded template format"));

	return immutable(
		JSON.parse(json, resolver),
		lenient ? (_v): _v is Template => true : (v): v is Template => isAtomic(v) || isTemplate(v),
		"malformed template"
	);


	function resolver(_key: string, value: unknown) {
		return isIRI(value, "internal")
			? resolve(base, value)
			: value;
	}

}


/**
 * Encodes criteria as a URL-safe string.
 *
 * Serialises a {@link Criteria} into an
 * {@link https://url.spec.whatwg.org/#application/x-www-form-urlencoded application/x-www-form-urlencoded} string,
 * recursively {@link internalize | internalising} absolute IRIs against the provided `base`; see
 * [Criteria Serialisation](#criteria-serialisation) for the wire format.
 *
 * > [!NOTE]
 * > The encoder always produces canonical form:
 * >
 * > - Operators use prefix notation (for example, `>=price=100`)
 * > - String values are JSON double-quoted (for example, `name="widget"`)
 * > - Numbers, booleans, and `null` remain unquoted (JSON literals)
 * > - Sorting criteria are always numeric (for example, `^price=1`, `^name=-2`)
 * > - A {@link Dictionary} entry is flattened using a single postfix `@tag` suffix (for example, `"text"@en`)
 * >
 * > This ensures consistent, predictable output. The decoder accepts both canonical and shorthand forms (for example,
 * > postfix operators like `price>=100`, unquoted strings like `name=widget`).
 *
 * > [!WARNING]
 * > The codec treats the `@tag` suffix as an opaque key and assigns it no semantic meaning. Consumers are
 * > responsible for interpreting the resulting {@link Dictionary} using schema-based information.
 *
 * @param criteria The criteria to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalising absolute IRIs
 *
 * @returns The encoded criteria string with internalised IRIs
 *
 * @throws {@link !TypeError TypeError} If `base` is not a hierarchical IRI
 *
 * @example
 *
 * ```typescript
 * encodeCriteria({ "~name": "widget", ">=price": 50, "^price": 1, "#": 25 });
 * // → '~name=%22widget%22&%3E%3Dprice=50&%5Eprice=1&%23=25'
 * ```
 */
export function encodeCriteria(criteria: Criteria, {

	base = getNamespaceIRI(app)

}: EncoderOpts = {}): string {

	if ( base !== getNamespaceIRI(app) && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	return encodeFormQuery(internalizeIRIs(base, criteria));


	function encodeFormQuery(query: Criteria): string {

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


	function internalizeIRIs(base: string, q: Criteria): Criteria {
		return JSON.parse(JSON.stringify(q), (_key, value) =>
			isIRI(value, "absolute") ? internalize(base, value) : value
		);
	}

}

/**
 * Decodes criteria from a URL-safe string.
 *
 * Parses an
 * {@link https://url.spec.whatwg.org/#application/x-www-form-urlencoded application/x-www-form-urlencoded} string into
 * a {@link Criteria}, recursively {@link resolve | resolving} internal IRIs against the provided `base`. The decoded
 * criteria are validated and deeply frozen unless `lenient` is `true`.
 *
 * > [!NOTE]
 * > The decoder accepts both canonical and shorthand forms:
 * >
 * > - Prefix operators (canonical): `>=price=100`
 * > - Postfix operators (shorthand): `price>=100`
 * > - Double-quoted strings (canonical): `name="widget"`
 * > - Unquoted strings (shorthand): `name=widget`
 * > - A string value may carry a single postfix `@tag` suffix, lifting it into a one-entry {@link Dictionary}
 * >
 * > Keyed values are always reconstructed in the multi-valued form, since {@link Options} are inherently multi-valued
 * > and scalar/array forms are indistinguishable in form encoding.
 *
 * > [!WARNING]
 * > The codec treats the `@tag` suffix as an opaque key and assigns it no semantic meaning. Consumers are
 * > responsible for interpreting the resulting {@link Dictionary} using schema-based information.
 *
 * @param encoded The form-encoded {@link Criteria} string
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} criteria with resolved IRIs
 *
 * @throws {@link !TypeError TypeError} If `base` is not a hierarchical IRI
 * @throws {@link !Error Error} If `encoded` is malformed or unparseable
 *
 * @example
 *
 * ```typescript
 * decodeCriteria("~name=widget&price>=50&^price=1&#=25");
 * // → { "~name": "widget", ">=price": 50, "^price": 1, "#": 25 }
 * ```
 */
export function decodeCriteria(encoded: string, {

	base = getNamespaceIRI(app),
	lenient

}: DecoderOpts = {}): Criteria {

	if ( base !== getNamespaceIRI(app) && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}


	return immutable(decode(), lenient ? (_v): _v is Criteria => true : isCriteria, "malformed query");


	function decode() {
		try {

			if ( encoded === "" ) {

				return {};

			} else {

				// form format (application/x-www-form-urlencoded) parsed via Peggy grammar
				// decode keys separately while preserving encoded values for the parser's value handling

				return resolveIRIs(base, CriteriaParser.parse(parseForm(encoded), { startRule: "Criteria" }));

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


	function resolveIRIs(base: string, parsed: Criteria): Criteria {
		return JSON.parse(JSON.stringify(parsed), (_key, value) =>
			isIRI(value, "internal") ? resolve(base, value) : value
		);
	}

}


/**
 * Encodes a probe as a key string.
 *
 * Serialises a parsed {@link Probe} back into its compact string representation suitable for use as a
 * {@link Projection} or {@link Criteria} key.
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
 */
export function encodeProbe(probe: Probe): string {

	const { target, pipe, path } = probe;

	const pipeString = pipe.map(p => `${p}:`).join("");
	const pathString = path.join(".");

	const expression = pipeString+pathString;

	return isIdentifier(target)
		? `${target}=${expression}`
		: `${target}${expression}`;

}

/**
 * Decodes a probe from a key string.
 *
 * Parses a key string into its structural {@link Probe} components, distinguishing projection keys
 * from constraint keys based on the presence of an {@link Operator} prefix.
 *
 * @param key The {@link Projection} or {@link Criteria} key to decode
 *
 * @returns The parsed deeply {@link immutable} probe
 *
 * @throws {@link !Error Error} If `key` is malformed or unparseable
 *
 * @example
 *
 * ```typescript
 * decodeProbe(">=year:releaseDate");
 * // → { target: ">=", pipe: ["year"], path: ["releaseDate"] }
 * ```
 */
export function decodeProbe(key: string): Probe {

	try {

		const probe = CriteriaParser.parse(key, { startRule: "Probe" });

		return immutable(probe, isProbe, "malformed probe");

	} catch ( cause ) {
		throw new Error(`malformed probe <${key}>`, { cause });
	}

}
