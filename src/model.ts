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
 * Defines types for specifying what data to retrieve in REST/JSON APIs, including property selection, linked
 * resource expansion, and—for collections—filtering, ordering, and pagination:
 *
 * - {@link Query} — Resource retrieval query
 * - {@link Templates} — Property value template set
 * - {@link Template} — Property value template
 * - {@link Locale} — Localised text retrieval template
 * - {@link Binding} — Named computed expression
 * - {@link Expression} — Computed expression
 * - {@link Options} — Constraint option set
 * - {@link Option} — Constraint option
 *
 * Defines structures for programmatic query key handling:
 *
 * - {@link Probe} — Parsed query probe
 * - {@link Operator} — Constraint operator symbols
 * - {@link Transform} — Value transforms
 *
 * <img src="index/model.svg" alt="Model type hierarchy" style="zoom: 1.75; display: block; margin: auto;" />
 *
 * Comparison and sorting operators rely on a total ordering over values defined by
 * {@link https://www.w3.org/TR/xpath-functions-20/#comparison-operators XPath 2.0 comparison operators};
 * see the {@link Query | Value Ordering} section for details.
 *
 * > [!NOTE]
 * > The [Model Design](./model.md) companion document covers the design rationale for the client-driven
 * > retrieval approach, including cross-backend semantics and query normalisation strategies.
 *
 * # Retrieval Patterns
 *
 * ## Resource Retrieval
 *
 * A {@link Query} specifies which properties to retrieve from a single {@link Resource} and how deeply to
 * expand linked resources. No over-fetching of unwanted fields, no under-fetching requiring additional calls:
 *
 * ```typescript
 * const query: Query = {
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
 * For resources included in a collection, a {@link Query} may also specify filtering, ordering, and pagination
 * criteria. Collection queries are nested inside a managing resource that owns the collection, following REST/JSON
 * best practices. Singleton array projections retrieve filtered, sorted, and paginated results with arbitrarily
 * deep expansions in a single call — no over-fetching, no under-fetching:
 *
 * ```typescript
 * const query: Query = {
 *   items: [{                                 // collection query
 *     id: "",
 *     name: "",
 *     price: 0,
 *     vendor: { id: "", name: "" },           // nested resource
 *     ">=price": 50,                          // price ≥ 50
 *     "<=price": 150,                         // price ≤ 150
 *     "~name": "widget",                      // name contains "widget"
 *     "?category": ["electronics", "home"],   // category in list
 *     "^price": 1,                           // sort by price ascending
 *     "^name": -2,                            // then by name descending
 *     "@": 0,                                 // skip first 0 results
 *     "#": 25                                 // return at most 25 results
 *   }]
 * };
 * ```
 *
 * ## Localised Content
 *
 * For multilingual properties, use {@link Locale} templates with {@link TagRange} keys to select language
 * tags to retrieve.
 *
 * Plain string or string array shorthands select language-neutral projections. Within a single map, all
 * values must be uniformly scalar or uniformly array. If the query specifies a shorthand, the retrieved
 * value should use the same shorthand form:
 *
 * ```typescript
 * const query: Query = {
 *   id: "",
 *   name: "",                             // language-neutral shorthand
 *   title: { "*": "" },                   // all available languages
 *   description: { "en": "", "fr": "" },  // English or French
 *   keywords: { "en": [""], "fr": [""] }  // multi-valued, English or French
 * };
 * ```
 *
 * > [!IMPORTANT]
 * > The `@none` key for non-localised values is not supported; use the `und` tag for language-neutral
 * > values or plain string / string array shorthands, which are equivalent to `{ und: value }` and
 * > select language-neutral projections.
 *
 * ## Computed Properties
 *
 * Queries can define computed properties using {@link Expression | expressions} combining property paths
 * with {@link Transform}.
 *
 * Plain transforms operate on individual values:
 *
 * ```typescript
 * const query: Query = {
 *   id: "",
 *   name: "",
 *   price: 0,
 *   "vendorName=vendor.name": "",       // property path
 *   "releaseYear=year:releaseDate": 0   // transform
 * };
 * ```
 *
 * Aggregate transforms operate on collections; non-aggregate bindings implicitly define the grouping key,
 * analogous to SQL `GROUP BY` (see [Aggregate Transforms](./model.md#aggregate-transforms) for details):
 *
 * ```typescript
 * const query: Query = {
 *   items: [{
 *     vendor: { id: "", name: "" },    // group by vendor
 *     "items=count:": 0,               // count of items per vendor
 *     "avgPrice=avg:price": 0          // average price per vendor
 *   }]
 * };
 * ```
 *
 * ## Faceted Search
 *
 * Aggregates enable faceted search patterns, computing category counts, value ranges, and totals in a single call:
 *
 * ```typescript
 * // Category facet with product counts
 *
 * const categoryFacet: Query = {
 *   items: [{
 *     "category=min:category": "",
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
 * const priceRange: Query = {
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
 * const productCount: Query = {
 *   items: [{
 *     "count=count:": 0
 *   }]
 * };
 *
 * // → { items: [{ count: 284 }] }
 * ```
 *
 * # Value Ordering
 *
 * Comparison (`<`, `>`, `<=`, `>=`) and sorting (`^`) operators rely on a total ordering over
 * {@link Literal} values defined by the
 * {@link https://www.w3.org/TR/xpath-functions-20/#comparison-operators XPath 2.0 comparison operators},
 * which are in turn based on
 * {@link https://www.w3.org/TR/xmlschema11-2/#rf-order XSD ordered value spaces}:
 *
 * - `null` — undefined values sort before all defined values
 * - `boolean` — `false` < `true`
 * - `number` — {@link https://www.w3.org/TR/xpath-functions/#func-numeric-less-than standard numeric} ordering;
 *   `NaN` is unordered
 * - `string` — {@link https://www.w3.org/TR/xpath-functions/#func-compare Unicode codepoint} collation
 * - {@link https://metreeca.github.io/core/types/resource.IRI.html IRI} references and nested {@link Query}
 *   resources — ordered by their IRI identifier using the same string collation
 *
 * > [!WARNING]
 * > Cross-type comparisons and values that fall outside these rules produce
 * > unpredictable, system-dependent results.
 *
 * # Query Serialization
 *
 * Multiple formats are supported for transmission as URL query strings in GET requests:
 *
 * | Mode     | Format                                                                     |
 * |----------|----------------------------------------------------------------------------|
 * | `json`   | [Percent-Encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON |
 * | `base64` | [Base64](https://www.rfc-editor.org/rfc/rfc4648#section-4) encoded JSON    |
 * | `form`   | [Form-encoded](#form-serialization)                                        |
 *
 * ## JSON Serialization
 *
 * Directly encodes {@link Query} objects using operator key prefixes.
 *
 * ## Form Serialization
 *
 * > [!WARNING]
 * >
 * > Form serialization specifies only query constraints; servers are expected to convert to a query by wrapping
 * > inside the target endpoint's collection property and providing a default projection.
 *
 * Supports `application/x-www-form-urlencoded` encoding via the `form` mode. The format encodes queries as
 * `label=value` pairs where:
 *
 * - Labels use the same prefixed operator syntax as {@link Query} constraint keys
 * - Each pair carries a single value; repeated labels are merged into arrays where accepted
 * - Postfix aliases provide natural form syntax for some operators:
 *   - `expression=value` for `?expression=value` (disjunctive matching)
 *   - `expression<=value` for `<=expression=value` (less than or equal)
 *   - `expression>=value` for `>=expression=value` (greater than or equal)
 *
 * **Encoding notes:**
 *
 * - Some operator characters are unreserved in RFC 3986 and remain unencoded: `~` (like), `!` (all)
 * - Reserved characters in values are percent-encoded: `&` (separator), `=` (key/value), `+` (space), `%` (escape)
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
 * # Query Grammar
 *
 * The following grammar elements are shared by both JSON and Form serialization formats.
 *
 * ## Expressions
 *
 * Probe keys identify properties or computed values combining an optional result name (forming a
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
 * ## Values
 *
 * Values are serialized as [JSON](https://www.rfc-editor.org/rfc/rfc8259) primitives:
 *
 * ```text
 * value       = primitive | localized
 * primitive   = null | boolean | number | string
 * localized   = string '@' tag
 * ```
 *
 * - {@link IRI}s are serialized as strings
 * - Localized strings in {@link Localised} maps combine a value with a
 *   {@link https://metreeca.github.io/core/types/language.Tag.html language tag} suffix (e.g., `"text"@en`)
 * - The encoder always produces double-quoted strings; the decoder accepts unquoted strings as a shorthand
 *
 * > [!WARNING]
 * >
 * > Numeric-looking values like `123` are parsed as numbers unless quoted.
 *
 * @document ./model.md
 *
 * @module
 */

import { Identifier, isArray, isIdentifier, isObject, isString } from "@metreeca/core";
import { immutable } from "@metreeca/core/deep";
import { TagRange } from "@metreeca/core/language";
import { error } from "@metreeca/core/report";
import type { IRI } from "@metreeca/core/resource";
import { internalize, isIRI, resolve } from "@metreeca/core/resource";
import { decodeBase64, encodeBase64 } from "./base64.js";
import { type DecoderOpts, defaultBase, type EncoderOpts, Indexed, type Literal, type Reference } from "./index.js";
import { isProbe, isQuery } from "./model.core.js";
import * as QueryParser from "./model.pegjs.js";
import { Localised, Resource, type Value } from "./state.js";


/**
 * Aggregate {@link Transform | transforms}.
 */
const Aggregates: ReadonlySet<Transform> = new Set<Transform>([
	"count",
	"min",
	"max",
	"sum",
	"avg"
]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resource retrieval query.
 *
 * A recursively nested property map specifying which properties to retrieve from a {@link Resource} and how deeply
 * to expand linked resources. Each property maps to a {@link Templates | property template} describing the expected
 * value type and structure, or to an {@link Indexed | key-indexed property map} for union-typed or dynamically-keyed
 * properties. Indexed containers can only appear as top-level property values and cannot be nested. Scalar template
 * values serve as type placeholders; their actual value is immaterial.
 *
 * Queries may define *computed* properties using the `{name}={expression}: template` syntax, where the value is
 * computed from an {@link Expression}.
 *
 * For resources included in a collection, queries may also specify filtering constraints, ordering criteria, and
 * pagination limits using the `"{operator}{expression}": value` syntax.
 *
 * > [!NOTE]
 * > Aggregate transforms, filtering constraints, sorting criteria, and pagination limits are formally legal also in
 * > top-level queries: in this case, they operate on the singleton collection including only the target resource.
 *
 * > [!NOTE]
 * > References to undefined properties in expressions resolve to `undefined` in the JSON output, consistently
 * > across all storage backends. When any path step is undefined, the entire path resolves to `undefined`.
 *
 * > [!WARNING]
 * > Query processors must reject queries with an error if they provide {@link Template | templates} of mismatched
 * > types for defined {@link Binding | bindings}, including computed ones.
 *
 * @see {@link state!Resource} for the corresponding state type
 * @see [Value Ordering](./model.md#comparison-and-collation) for comparison and sorting semantics
 */
export type Query = {

	/**
	 * Property projection (`"binding": template`).
	 *
	 * Maps a {@link Binding} to a {@link Templates} describing the expected value type and structure,
	 * or to an {@link Indexed} container for union-typed or dynamically-keyed properties.
	 */
	readonly [property: Binding]: Templates | Indexed<Templates>

} & {

	/**
	 * Less-than filter (`"<expression": value`).
	 *
	 * Includes resources where at least one expression value is strictly less than the literal
	 * under [value ordering](./model.md#comparison-and-collation) rules.
	 *
	 * Applicable to boolean, numeric, and string properties.
	 */
	readonly [lt: `<${Expression}`]: Literal

	/**
	 * Greater-than filter (`">expression": value`).
	 *
	 * Includes resources where at least one expression value is strictly greater than the literal
	 * under [value ordering](./model.md#comparison-and-collation) rules.
	 *
	 * Applicable to boolean, numeric, and string properties.
	 */
	readonly [gt: `>${Expression}`]: Literal

	/**
	 * Less-than-or-equal filter (`"<=expression": value`).
	 *
	 * Includes resources where at least one expression value is less than or equal to the literal
	 * under [value ordering](./model.md#comparison-and-collation) rules.
	 *
	 * Applicable to boolean, numeric, and string properties.
	 */
	readonly [lte: `<=${Expression}`]: Literal

	/**
	 * Greater-than-or-equal filter (`">=expression": value`).
	 *
	 * Includes resources where at least one expression value is greater than or equal to the literal
	 * under [value ordering](./model.md#comparison-and-collation) rules.
	 *
	 * Applicable to boolean, numeric, and string properties.
	 */
	readonly [gte: `>=${Expression}`]: Literal

	/**
	 * Prefix word search filter (`"~expression": value`).
	 *
	 * Includes resources where every whitespace-delimited token in the search string is a case-insensitive prefix
	 * of at least one whitespace-delimited token in the expression value, matching in the order tokens appear
	 * in the search string.
	 *
	 * Applicable to plain string and {@link Localised | localised text} properties.
	 *
	 * > [!WARNING]
	 * > When targeting a localised property, the target language must be communicated to the server
	 * > through an application-specific channel (for example, `Accept-Language` header or request context).
	 *
	 * > [!WARNING]
	 * > Matching is diacritics-sensitive: diacritics normalisation is not uniformly supported across storage
	 * > backends and would require extensive application-level pre-processing at storage time. For detailed
	 * > matching rules and cross-backend semantics, see [prefix word search](./model.md#prefix-word-search).
	 */
	readonly [like: `~${Expression}`]: string

	/**
	 * Disjunctive matching filter (`"?expression": value`).
	 *
	 * Includes resources where at least one expression value equals one of the options; `null` matches undefined.
	 */
	readonly [any: `?${Expression}`]: Options

	/**
	 * Conjunctive matching filter (`"!expression": value`).
	 *
	 * Includes resources whose expression values include all specified options; for multi-valued properties.
	 */
	readonly [all: `!${Expression}`]: Options


	/**
	 * Focus ordering (`"*expression": options`).
	 *
	 * Orders results prioritising resources whose expression value appears in the specified {@link Options};
	 * matching resources appear before non-matching ones; overrides regular sorting criteria.
	 */
	readonly [focus: `*${Expression}`]: Options

	/**
	 * Sort ordering (`"^expression": priority`).
	 *
	 * Orders results by expression value according to [value ordering](./model.md#comparison-and-collation) rules; the
	 * sign gives direction
	 * (positive for ascending, negative for descending); the absolute value gives 1-based precedence (1 is highest
	 * priority); zero is ignored; `"asc"` and `"desc"` are shorthands for `±1`.
	 *
	 * > [!WARNING]
	 * > When targeting a localised property, the target language must be communicated to the server
	 * > through an application-specific channel (e.g., `Accept-Language` header or request context).
	 */
	readonly [order: `^${Expression}`]: "asc" | "desc" | number


	/**
	 * Pagination offset (`"@": number`).
	 *
	 * Skips the first `number` resources from the filtered and ordered result set; zero is ignored.
	 */
	readonly "@"?: number

	/**
	 * Pagination limit (`"#": number`).
	 *
	 * Returns at most `number` resources from the result set after applying offset; zero is ignored.
	 */
	readonly "#"?: number

}


/**
 * Property value template set.
 *
 * A single {@link Template}, a {@link Locale} language map, or a tuple of templates.
 *
 * Tuples denote collection projections supporting filtering, ordering, and pagination.
 *
 * @see {@link state!Values} for the corresponding state type
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html RFC 4647 - Matching of Language Tags}
 */
export type Templates =
	| Template
	| Locale
	| readonly [Template]

/**
 * Property value template.
 *
 * Defines the expected type and structure for a {@link Query} property value:
 *
 * - {@link Literal}: primitive value (`boolean`, `number`, `string`)
 * - {@link Reference}: IRI reference to a linked resource
 * - {@link Query}: nested projection for expanding linked resources
 *
 * @see {@link state!Value} for the corresponding state type
 */
export type Template =
	| Literal
	| Reference
	| Query

/**
 * Localised text retrieval template.
 *
 * Specifies via {@link TagRange | tag range} keys which locales are of interest and must be retrieved as
 * {@link Localised} values, supporting both single-valued and multi-valued forms per tag range.
 * String values are ignored as templates and serve only as type placeholders.
 *
 * Plain shorthands are accepted for language-neutral projections:
 *
 * - `""` is equivalent to `{ und: "" }`
 * - `[""]` is equivalent to `{ und: [""] }`
 *
 * Consumers are responsible for normalising shorthand values to the canonical object form, including shorthand
 * {@link Localised} values within {@link Options} constraints.
 *
 * > [!WARNING]
 * > Within a single map, all values must be uniformly scalar or uniformly array — mixed content is not
 * > permitted.
 *
 * > [!NOTE]
 * > - If the query specifies a string or string array shorthand, the retrieved value should use the same
 * >   shorthand form
 * > - The `@none` key for non-localised values is not supported; use the `und` tag or the plain string/string
 * >   array shorthand for language-neutral values
 *
 * @see {@link state!Localised} for the corresponding state type
 */
export type Locale =
	| string
	| readonly [string]
	| { readonly [range: TagRange]: string }
	| { readonly [range: TagRange]: readonly [string] };


/**
 * Named computed expression.
 *
 * Assigns a name to a computed {@link Expression} in {@link Query} projections, either as a plain
 * {@link Identifier} or using the `{name}={expression}` syntax. A plain {@link Identifier} is a shorthand for
 * `{name}={name}`.
 *
 * @example
 *
 * ```typescript
 * const query: Query = {
 *   "name": "",                        // property binding (shorthand for "name=name")
 *   "vendorName=vendor.name": "",      // path binding
 *   "releaseYear=year:releaseDate": 0  // transform binding
 * };
 * ```
 */
export type Binding =
	| Identifier
	| `${Identifier}=${Expression}`;

/**
 * Computed expression.
 *
 * Combines property access paths and value transformations to define computed fields
 * in {@link Query} projections and constraints.
 *
 * Expressions use the compact string syntax `[pipe][path]` where:
 *
 * - **pipe** is a {@link Pipe} identifying the chain of value transformations to apply
 * - **path** is a {@link Path} navigating to a nested value within the resource
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; expression syntax is validated at runtime
 * > by query processors. Processors reject expressions that reference unsupported transforms; references to
 * > undefined properties resolve to `undefined` in the output (see [Property Paths](./model.md#property-paths)).
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
	`${Pipe}:${Path}`;


/**
 * Transform pipe.
 *
 * A sequence of {@link Transform} names, each followed by a colon, identifying a chain of value transformations
 * in an {@link Expression} (for example, `round:avg:`). Transforms are applied right-to-left in functional composition
 * order; the empty pipe denotes the identity transformation, passing the value through unchanged.
 *
 * Composition rules and valid/invalid combinations are defined in
 * [Transform Pipes](./model.md#transform-pipes).
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; pipe syntax is validated at runtime by query processors.
 */
export type Pipe =
	| string;

/**
 * Property path.
 *
 * A dot-separated list of property names identifying a value within a resource (for example, `order.items.price`).
 * The empty string refers to the root value. Path steps follow {@link Identifier} rules (ECMAScript names)
 * and always refer to actual resource property names, not to projected computed properties
 * defined by {@link Binding bindings}.
 *
 * Resolution semantics (including multi-valued and union properties) are defined in
 * [Property Paths](./model.md#property-paths).
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; path syntax is validated at runtime by query processors.
 * > References to undefined properties resolve to `undefined` in the output.
 */
export type Path =
	| string;


/**
 * Constraint option set.
 *
 * Specifies the set of values for {@link Query} matching (`?` and `!`) and focus ordering (`*`) operators.
 *
 * > [!NOTE]
 * > Options are inherently multi-valued regardless of the cardinality of the target property: matching and ordering
 * > operators always work against a set of candidate values. Singular forms are accepted as shorthands
 * > for single-element sets.
 *
 * > [!IMPORTANT]
 * > Consumers must accept both scalar and array {@link Localised} forms when filtering or constraining on
 * > localised properties, regardless of the target property's cardinality: codec roundtrips may normalise
 * > between the two forms (see {@link decodeQueryString}).
 *
 * - {@link Option} — Shorthand for a single-element option set
 * - {@link Localised} — Language-tagged option set
 * - `readonly Option[]` — Explicit option set
 */
export type Options =
	| Option
	| Localised
	| readonly Option[];

/**
 * Constraint option.
 *
 * Single value for {@link Query} matching (`?` and `!`) and focus ordering (`*`) operators:
 *
 * - `null` — Undefined property value
 * - {@link Literal} — Literal value
 * - {@link Reference} — Resource reference
 */
export type Option =
	| null
	| Literal
	| Reference;


/**
 * Parsed query probe.
 *
 * Represents a parsed projection, filtering, ordering, or pagination probe in a {@link Query}.
 * Query keys are encoded string representations of probes.
 *
 * A unified target suffices as projections and constraints are easily
 * disambiguated after parsing using {@link isIdentifier}.
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
 * @see {@link encodeProbe}
 * @see {@link decodeProbe}
 */
export type Probe = {

	/**
	 * Property name for projections or constraint {@link Operator}.
	 */
	readonly target: Identifier | Operator;

	/**
	 * Transform pipeline applied to the value, in application order.
	 */
	readonly pipe: readonly Transform[];

	/**
	 * Property path segments to the target value.
	 */
	readonly path: readonly Identifier[];

}

/**
 * Constraint operator symbols for {@link Query} keys.
 *
 * @see {@link Query} for constraint semantics
 * @see [Value Ordering](./model.md#comparison-and-collation) for comparison and sorting semantics
 */
export type Operator =
	| "<"
	| ">"
	| "<="
	| ">="
	| "~"
	| "?"
	| "!"
	| "*"
	| "^"
	| "@"
	| "#";

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
 * > referencing unknown transforms are rejected by `isExpression` and `isProbe`.
 *
 * ## Type Mapping
 *
 * Transforms operate on JSON values but their semantics are defined in terms
 * of [XPath 2.0](https://www.w3.org/TR/xpath-functions/) / [XSD 1.0](https://www.w3.org/TR/xmlschema-2/) types.
 * The domain and range columns in the table below use the following type shorthands:
 *
 * - **numeric** — `xsd:integer` | `xsd:decimal` | `xsd:float` | `xsd:double`, mapped to JSON `number`
 * (IEEE 754 double); note that JSON numbers can only represent a subset of `xsd:integer` and `xsd:decimal` values
 * - **temporal** — `xsd:dateTime` | `xsd:date` | `xsd:time` | `xsd:duration`, mapped to JSON `string`; note that
 * temporal types may be accepted only by a specific subset of temporal transforms
 *
 * String-to-string transform pipes (for example `lower`, `upper`) may also be applied to {@link Localised}
 * values: the pipe is applied individually to each string value in the language map.
 *
 * | Transform      | Definition                                                       | Domain       | Range         |
 * |----------------|------------------------------------------------------------------|--------------|---------------|
 * | **aggregates** | Summarise a set of values                                        |              |               |
 * | `count`        | Count values; `0` for empty sets                                 | any          | `xsd:integer` |
 * | `min`          | Select [minimum value](./model.md#aggregate-transforms); `undefined` for empty sets | any
 *  | same as input |
 * | `max`          | Select [maximum value](./model.md#aggregate-transforms); `undefined` for empty sets | any
 *  | same as input |
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
 * | **temporal**   | Extract components from ISO 8601 date/time/duration              |              |               |
 * | `year`         | Extract year component                                           | temporal     | `xsd:integer` |
 * | `month`        | Extract month component                                          | temporal     | `xsd:integer` |
 * | `day`          | Extract day component                                            | temporal     | `xsd:integer` |
 * | `hours`        | Extract hours component                                          | temporal     | `xsd:integer` |
 * | `minutes`      | Extract minutes component                                        | temporal     | `xsd:integer` |
 * | `seconds`      | Extract seconds component                                        | temporal     | `xsd:decimal` |
 *
 * ## Error Handling
 *
 * Scalar transforms produce `undefined` for undefined inputs and domain violations (for example, `abs` on a string);
 * aggregate transforms silently skip invalid values before computing the result. See [Scalar
 * Transforms](./model.md#scalar-transforms) and [Aggregate Transforms](./model.md#aggregate-transforms) for the full
 * adopted semantics, including empty set behaviour, multi-valued properties, and type promotion rules.
 *
 * The supported set is restricted to the intersection of well-defined counterparts across XPath 2.0, SPARQL 1.1,
 * SQL:2011, and GQL:2024/openCypher; see the [Design Rationale](./model.md#design-rationale) for the cross-backend
 * design approach and [Query Normalisation](./model.md#query-normalisation) for backend-specific adjustments.
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
	| "seconds";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks whether a {@link Transform | transform} is an aggregate.
 *
 * @param transform - The transform to check
 *
 * @returns true if `transform` is an aggregate; false otherwise
 */
export function isAggregate(transform: Transform): boolean {
	return Aggregates.has(transform);
}


/**
 * Encodes a query as a JSON string.
 *
 * Serializes a {@link Query} object into a JSON string. If `base` is provided, converts absolute IRIs
 * (matching `isIRI(value, "absolute")`) to internal IRIs using {@link internalize}, recursively throughout
 * the query structure. Otherwise, performs plain JSON serialization.
 *
 * @param query The query to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalizing absolute IRIs
 * @param options.indent Indentation level for pretty-printing output
 *
 * @returns The JSON string, with internalized IRIs if `base` is provided
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 *
 * @example
 *
 * ```typescript
 * encodeQuery(
 *   { id: "", name: "", vendor: { id: "https://example.com/vendors/acme", name: "" } },
 *   { base: "https://example.com/" }
 * );
 * // → '{"id":"","name":"","vendor":{"id":"/vendors/acme","name":""}}'
 * ```
 *
 * @see {@link decodeQuery}
 */
export function encodeQuery(query: Query, {

	base = defaultBase,
	indent

}: EncoderOpts = {}): string {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	return JSON.stringify(query, replacer, indent === true ? 2 : indent || undefined);


	function replacer(_key: string, value: unknown): unknown {
		return isIRI(value, "absolute")
			? internalize(base, value)
			: value;
	}

}

/**
 * Decodes a query from a JSON string.
 *
 * Parses a JSON string back into a {@link Query} object. If `base` is provided, resolves internal IRIs
 * (matching `isIRI(value, "internal")`) to absolute IRIs using `resolve()`, recursively throughout
 * the query structure. Otherwise, performs plain JSON parsing.
 *
 * @param json The JSON-serialized {@link Query}
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} query, with resolved IRIs if `base` is provided
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 * @throws {TypeError} If the decoded value fails structural validation (unless `lenient` is `true`)
 * @throws {SyntaxError} If `json` is not valid JSON
 *
 * @example
 *
 * ```typescript
 * decodeQuery(
 *   '{"id":"","name":"","vendor":{"id":"/vendors/acme","name":""}}',
 *   { base: "https://example.com/" }
 * );
 * // → { id: "", name: "", vendor: { id: "https://example.com/vendors/acme", name: "" } }
 * ```
 *
 * @see {@link encodeQuery}
 */
export function decodeQuery(json: string, {

	base = defaultBase,
	lenient

}: DecoderOpts = {}): Query {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const query = JSON.parse(json, (_key, value) =>
		isIRI(value, "internal") ? resolve(base, value) : value
	);

	return immutable(query, lenient ? (v): v is Query => true : isQuery, "malformed query");

}


/**
 * Encodes a query as a URL-safe string.
 *
 * Serializes a {@link Query} object into a string representation suitable for transmission as a URL query string in
 * GET requests. The output format can be selected based on readability, compactness, and compatibility requirements.
 *
 * If `base` is provided, converts absolute IRIs (matching `isIRI(value, "absolute")`) to root-relative IRIs
 * using {@link internalize}, recursively throughout the query structure. Otherwise, performs plain serialization.
 *
 * @param query The query object to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalizing absolute IRIs
 * @param options.mode The output format:
 *
 * - `"json"` (default) — [Percent-encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON; human-readable
 *   but verbose; see [JSON Serialization](#json-serialization)
 * - `"base64"` — [Base64-encoded](https://www.rfc-editor.org/rfc/rfc4648#section-4) JSON; compact and URL-safe
 * - `"form"` — [Form-encoded](https://url.spec.whatwg.org/#application/x-www-form-urlencoded) `key=value` pairs;
 *   most compatible with standard tooling; see [Form Serialization](#form-serialization)
 *
 * @returns The encoded query string, with internalized IRIs if `base` is provided
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 *
 * @remarks
 *
 * The `"form"` format always encodes to canonical form:
 *
 * - Operators use prefix notation (e.g., `>=price=100`)
 * - String values are JSON double-quoted (e.g., `name="widget"`)
 * - Numbers, booleans, and `null` remain unquoted (JSON literals)
 * - Sorting criteria are always numeric (e.g., `^price=1`, `^name=-2`)
 *
 * This ensures consistent, predictable output. The decoder accepts both canonical and shorthand forms (e.g., postfix
 * operators like `price>=100`, unquoted strings like `name=widget`).
 *
 * @example
 *
 * ```typescript
 * encodeQueryString(
 *   { "~name": "widget", ">=price": 50, "^price": 1, "#": 25 },
 *   { mode: "form" }
 * );
 * // → '~name=%22widget%22&%3E%3Dprice=50&%5Eprice=1&%23=25'
 * ```
 *
 * @see {@link decodeQueryString}
 */
export function encodeQueryString(query: Query, {

	base = defaultBase,
	mode = "json"

}: EncoderOpts & {

	readonly mode?: "json" | "base64" | "form"

} = {}): string {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const internalized = internalizeIRIs(base, query);

	return mode === "json" ? encodeURIComponent(JSON.stringify(internalized))
		: mode === "base64" ? encodeBase64(JSON.stringify(internalized))
			: mode === "form" ? encodeFormQuery(internalized)
				: error(new TypeError(`unsupported mode <${mode}>`));


	function internalizeIRIs(base: string, q: Query): Query {
		return JSON.parse(JSON.stringify(q), (_key, value) =>
			isIRI(value, "absolute") ? internalize(base, value) : value
		);
	}

	function encodeFormQuery(query: Query): string {

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

		// Dictionary (localised content): expand to tagged strings

		return Object.entries(dict).flatMap(([tag, tagValue]) => isArray(tagValue)
			? tagValue.map(v => `${encodedKey}=${encodeFormValue(v)}%40${tag}`)
			: [`${encodedKey}=${encodeFormValue(tagValue)}%40${tag}`]
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

}

/**
 * Decodes a query from a URL-safe string.
 *
 * Parses an encoded query string back into a {@link Query} object. The encoding format is auto-detected from the
 * input string structure.
 *
 * If `base` is provided, resolves internal IRIs (matching `isIRI(value, "internal")`) to absolute IRIs
 * using `resolve()`, recursively throughout the query structure. Otherwise, performs plain parsing.
 *
 * @param json The URL-encoded {@link Query} string (JSON, base64, or form format)
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} query, with resolved IRIs if `base` is provided
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 * @throws {Error} If `json` is malformed or unparseable
 *
 * @remarks
 *
 * For `"form"` format, the decoder accepts both canonical and shorthand forms:
 *
 * - Prefix operators (canonical): `>=price=100`
 * - Postfix operators (shorthand): `price>=100`
 * - Double-quoted strings (canonical): `name="widget"`
 * - Unquoted strings (shorthand): `name=widget`
 *
 * Tagged strings always require the canonical `"value"@tag` format. Tagged values are always reconstructed
 * in the multi-valued {@link Localised} form, since {@link Options} are inherently multi-valued and scalar/array
 * forms are indistinguishable in form encoding.
 *
 * @example
 *
 * ```typescript
 * // Form format with shorthand operators (auto-detected)
 * decodeQueryString("~name=widget&price>=50&^price=1&#=25");
 * // → { "~name": "widget", ">=price": 50, "^price": 1, "#": 25 }
 * ```
 *
 * @see {@link encodeQueryString}
 */
export function decodeQueryString(json: string, {

	base = defaultBase,
	lenient

}: DecoderOpts = {}): Query {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}


	return immutable(decode(), lenient ? (v): v is Query => true : isQuery, "malformed query");


	function decode() {
		try {

			if ( json === "" ) {

				return {};

			} else if ( json.startsWith("%7B") || json.startsWith("{") ) {

				// JSON format (starts with %7B which is encoded '{')

				return parseJSON(base, decodeURIComponent(json));

			} else if ( /^e[A-Za-z0-9+/_-]*=*$/.test(json) ) {

				// base64 format - JSON objects encode to base64 starting with 'e'

				return parseJSON(base, decodeBase64(json));

			} else {

				// form format (application/x-www-form-urlencoded) parsed via Peggy grammar
				// decode keys separately while preserving encoded values for the parser's value handling

				return resolveIRIs(base, QueryParser.parse(parseForm(json), { startRule: "Query" }));

			}

		} catch ( cause ) {

			throw new Error(`malformed query <${json}>`, { cause });

		}
	}

	function parseJSON(base: string, json: string): Query {
		return JSON.parse(json, (_key, value) =>
			isIRI(value, "internal") ? resolve(base, value) : value
		);
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


	function resolveIRIs(base: string, parsed: Query): Query {
		return JSON.parse(JSON.stringify(parsed), (_key, value) =>
			isIRI(value, "internal") ? resolve(base, value) : value
		);
	}

}


/**
 * Encodes a probe as a {@link Query} key string.
 *
 * Serializes a parsed {@link Probe} back into its compact string representation suitable for use as a
 * {@link Query} key.
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
 * Decodes a {@link Query} key string into a probe.
 *
 * Parses a {@link Query} key string into its structural {@link Probe} components, distinguishing projection keys
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
