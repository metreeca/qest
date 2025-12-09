/*
 * Copyright © 2025 Metreeca srl
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
 * Client-driven resource model.
 *
 * Defines the shape of data clients want to retrieve from an API. Clients specify which properties to include
 * and how deeply to expand linked resources. For collections, queries also support filtering, ordering, and
 * pagination. This enables efficient single-call retrieval of exactly the data needed.
 *
 * This module provides types for defining queries:
 *
 * - {@link Query} — Resource retrieval query
 * - {@link Projection} — Property value specification
 * - {@link Expression} — Computed expression for transforms and paths
 * - {@link Transforms} — Standard value transformations
 *
 * Utilities for serializing queries:
 *
 * - {@link encodeQuery} / {@link decodeQuery} — Query codecs
 *
 * **Resource Queries**
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
 * **Collection Queries**
 *
 * Collection queries are nested inside a managing resource that owns the collection, following REST/JSON best
 * practices. Singleton array projections retrieve filtered, sorted, and paginated results with arbitrarily deep
 * expansions in a single call - no over-fetching, no under-fetching:
 *
 * ```typescript
 * const query: Query = {
 *   items: [{                                 // collection owned by parent
 *     id: "",
 *     name: "",
 *     price: 0,
 *     vendor: { id: "", name: "" },           // nested resource
 *     ">=price": 50,                          // price ≥ 50
 *     "<=price": 150,                         // price ≤ 150
 *     "~name": "widget",                      // name contains "widget"
 *     "?category": ["electronics", "home"],   // category in list
 *     "^price": "1",                          // sort by price ascending
 *     "^name": -2,                            // then by name descending
 *     "@": 0,                                 // skip first 0 results
 *     "#": 25                                 // return at most 25 results
 *   }]
 * };
 * ```
 *
 * **Localized Content**
 *
 * For multilingual properties, use {@link TagRange} keys to select language tags to retrieve:
 *
 * ```typescript
 * const query: Query = {
 *   id: "",
 *   name: { "*": "" },                   // all available languages
 *   description: { "en": "", "fr": "" }, // English or French
 *   keywords: { "en": [""], "fr": [""] } // multi-valued, English or French
 * };
 * ```
 *
 * **Computed Properties**
 *
 * Queries can define computed properties using {@link Expression | expressions} combining property paths
 * with {@link Transforms}.
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
 * Aggregate transforms operate on collections:
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
 * **Faceted Search**
 *
 * Aggregates enable faceted search patterns, computing category counts, value ranges, and totals in a single call:
 *
 * ```typescript
 * // Category facet with product counts
 *
 * const categoryFacet: Query = {
 *   items: [{
 *     "category=sample:category": "",
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
 * **Query Serialization** supports multiple formats for transmission as URL query strings in GET requests:
 *
 * | Mode     | Format                                                                     |
 * |----------|----------------------------------------------------------------------------|
 * | `json`   | [Percent-Encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON |
 * | `base64` | [Base64](https://www.rfc-editor.org/rfc/rfc4648#section-4) encoded JSON    |
 * | `form`   | [Form-encoded](#form-serialization)                                        |
 *
 * **JSON Serialization** directly encodes {@link Query} objects using operator key prefixes.
 *
 * **Form Serialization** additionally supports `application/x-www-form-urlencoded` encoding via the `form` mode.
 * The format serializes queries as `label=value` pairs with operator prefixes or suffixes:
 *
 * ```
 * query   = pair ( '&' pair )*
 * pair    = label '=' value
 * label   = prefix expression | expression postfix | '@' | '#'
 * prefix  = '~' | '?' | '!' | '$' | '^'
 * postfix = '<=' | '>='
 * literal = primitive
 * option  = primitive
 * order   = 'asc' | 'ascending' | 'desc' | 'descending' | number
 * ```
 *
 * | Syntax                | Value                              | Description                                       |
 * |-----------------------|------------------------------------|---------------------------------------------------|
 * | `expression=option`   | [value](#values)                   | Disjunctive; alias for `?expression=option`       |
 * | `expression<=literal` | [value](#values)                   | Less than or equal                                |
 * | `expression>=literal` | [value](#values)                   | Greater than or equal                             |
 * | `~expression=string`  | string                             | Stemmed word search                               |
 * | `?expression=option`  | [value](#values)                   | Disjunctive; multiple instances combined with OR  |
 * | `!expression=option`  | [value](#values)                   | Conjunctive; multiple instances combined with AND |
 * | `$expression=option`  | [value](#values)                   | Focus ordering                                    |
 * | `^expression=order`   | `asc`/`ascending`/`desc`/`descending`/number | Sort ordering                        |
 * | `@=number`            | number                             | Offset                                            |
 * | `#=number`            | number                             | Limit                                             |
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
 * > [!WARNING]
 * >
 * > Form queries specify only constraints; wrapping inside the target endpoint's collection property and providing
 * > a default projection is server-managed.
 *
 * **Query Grammar**
 *
 * The following grammar elements are shared by both JSON and Form serialization formats.
 *
 * **Expressions** ({@link Expression}) identify properties or computed values combining an optional result name,
 * a pipeline of {@link Transforms}, and a property path:
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
 * **Values** are serialized as [JSON](https://www.rfc-editor.org/rfc/rfc8259) primitives:
 *
 * ```text
 * value       = primitive | localized
 * primitive   = null | boolean | number | string
 * localized   = string '@' tag
 * ```
 *
 * - {@link IRI | IRIs} are serialized as strings
 * - Localized strings ({@link Dictionary}) combine a value with a
 *   {@link https://metreeca.github.io/core/types/language.Tag.html language tag} suffix (e.g., `"text@en"`)
 * - For plain strings and IRIs, quotes may be omitted
 *
 * > [!WARNING]
 * >
 * > Numeric-looking values like `123` are parsed as numbers unless quoted.
 *
 * @module
 */

import { Identifier, isIdentifier } from "@metreeca/core";
import { isBoolean } from "@metreeca/core/json";
import { TagRange } from "@metreeca/core/language";
import { IRI } from "@metreeca/core/resource";
import { Dictionary, Literal, Resource } from "./state.js";


/**
 * Standard value transformations for computed {@link Expression | expressions}.
 *
 * Each transform specifies:
 *
 * - `name` — Transform identifier used in {@link Expression | expressions}
 * - `aggregate` — Whether the transform operates on collections (`true`) or individual values (`false`)
 * - `datatype` — Optional result type; the expected type should match the final value of the transform pipe:
 *   - `"boolean"`, `"number"`, `"string"` — Transform produces specific primitive type
 *   - (omitted) — Transform preserves input type
 *
 * @remarks
 *
 * The expression parser accepts any valid identifier as a transform name, not just those defined
 * in this registry; this allows applications to extend the transform set without modifying the parser.
 *
 * @example
 *
 * ```typescript
 * "sum:items.price"      // sum of items.price values
 * "round:avg:scores"     // average of scores, rounded
 * ```
 */
export const Transforms = transforms([

	/** Count of values in collection */
	{ name: "count", aggregate: true, datatype: "number" },

	/** Minimum value in collection */
	{ name: "min", aggregate: true },

	/** Maximum value in collection */
	{ name: "max", aggregate: true },

	/** Sum of values in collection */
	{ name: "sum", aggregate: true, datatype: "number" },

	/** Average of values in collection */
	{ name: "avg", aggregate: true, datatype: "number" },

	/** Arbitrary value from collection */
	{ name: "sample", aggregate: true },


	/** Absolute value */
	{ name: "abs", aggregate: false, datatype: "number" },

	/** Floor to largest integer less than or equal to value */
	{ name: "floor", aggregate: false, datatype: "number" },

	/** Ceiling to smallest integer greater than or equal to value */
	{ name: "ceil", aggregate: false, datatype: "number" },

	/** Round to nearest integer */
	{ name: "round", aggregate: false, datatype: "number" },


	/** Extract year component from calendrical values */
	{ name: "year", aggregate: false, datatype: "number" },

	/** Extract month component from calendrical values */
	{ name: "month", aggregate: false, datatype: "number" },

	/** Extract day component from calendrical values */
	{ name: "day", aggregate: false, datatype: "number" }

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resource retrieval query.
 *
 * Defines the shape and content of a {@link Resource} object to be retrieved. Properties are mapped to
 * {@link Projection} values specifying what to retrieve:
 *
 * - {@link Literal} — Plain literal
 * - {@link Query} — Nested resource
 * - `{ readonly [range: TagRange]: string }` — Single-valued {@link Dictionary}; {@link TagRange} key selects
 *   language tags to retrieve; `string` is a placeholder
 * - `{ readonly [range: TagRange]: [string] }` — Multi-valued {@link Dictionary}; {@link TagRange} key selects
 *   language tags to retrieve; array marks multi-valued
 * - `readonly [Query]` — Nested resource collection; singleton {@link Query} element provides filtering,
 *   ordering, and paginating criteria for members
 * - `[]` — Nothing (ignored during processing)
 *
 * Queries may also define *computed* properties, whose value is computed from an {@link Expression}; in this case,
 * the projection defines the expected type of the computed value.
 *
 * Scalar values in projections serve as type placeholders; their actual value is immaterial, but
 * their type must match the (possibly computed) property definition.
 *
 * This model enables efficient single-call retrieval of exactly the data needed, without over or
 * under-fetching.
 *
 * **Important:** The query is rejected with an error if it references undefined properties or if it
 * provides projections or constraints of mismatched types for defined properties.
 *
 * **Filtering and Ordering Constraints**
 *
 * Queries support constraints for filtering, ordering, and paginating resource collections. Filtering and
 * ordering constraints select the collection subset to retrieve; each constraint is applied to the value
 * computed by an {@link Expression} from a candidate member resource. Pagination constraints are applied
 * to the filtered and ordered result set.
 *
 * The following constraints are supported:
 *
 * - **less than** — `"<expression": Literal`
 *
 *   Includes resources where at least one expression value is less than the literal.
 *
 * - **less than or equal** — `"<=expression": Literal`
 *
 *   Includes resources where at least one expression value is less than or equal to the literal.
 *
 * - **greater than** — `">expression": Literal`
 *
 *   Includes resources where at least one expression value is greater than the literal.
 *
 * - **greater than or equal** — `">=expression": Literal`
 *
 *   Includes resources where at least one expression value is greater than or equal to the literal.
 *
 * - **stemmed word search** — `"~expression": string`
 *
 *   Includes resources where at least one expression value contains all word stems from the search string,
 *   in the given order.
 *
 * - **disjunctive matching** — `"?expression": Options`
 *
 *   Includes resources where at least one expression value equals at least one of the specified {@link Options};
 *   applies to both single and multi-valued properties; `null` matches resources where the property is undefined.
 *
 * - **conjunctive matching** — `"!expression": Options`
 *
 *   Includes resources whose expression values include all specified {@link Options};
 *   applies to multi-valued properties.
 *
 * - **focus ordering** — `"$expression": Options`
 *
 *   Orders results prioritizing resources whose expression value appears in the specified {@link Options};
 *   matching resources appear before non-matching ones; overrides regular sorting criteria.
 *
 * - **sort ordering** — `"^expression": number`
 *
 *   Orders results by expression value; the sign of the priority gives ordering direction (positive for ascending,
 *   negative for descending); the absolute value gives 1-based ordering precedence (1 is highest priority);
 *   zero is ignored; `"asc"`/`"ascending"` and `"desc"`/`"descending"` are shorthands for `±1`.
 *
 * - **offset** — `"@": number`
 *
 *   Skips the first `number` resources from the filtered and ordered result set; zero is ignored.
 *
 * - **limit** — `"#": number`
 *
 *   Returns at most `number` resources from the result set after applying offset; zero is ignored.
 */
export type Query = Partial<{

	readonly [property: Identifier | `${Identifier}=${Expression}`]: Projection

	readonly [lt: `<${Expression}`]: Literal
	readonly [gt: `>${Expression}`]: Literal

	readonly [lte: `<=${Expression}`]: Literal
	readonly [gte: `>=${Expression}`]: Literal

	readonly [like: `~${Expression}`]: string

	readonly [any: `?${Expression}`]: Options
	readonly [all: `!${Expression}`]: Options

	readonly [focus: `$${Expression}`]: Options
	readonly [order: `^${Expression}`]: "asc" | "desc" | "ascending" | "descending" | number

	readonly "@": number
	readonly "#": number

}>;

/**
 * Property value specification for retrieval queries.
 *
 * Defines the shape and type of property values in {@link Query} objects:
 *
 * - {@link Literal} — Plain literal value
 * - {@link IRI} — Resource reference
 * - {@link Query} — Nested resource
 * - `{ readonly [range: Range]: string }` — Single-valued {@link Dictionary}; {@link TagRange} keys select
 *   matching language tags to retrieve; `string` is an immaterial scalar placeholder
 * - `{ readonly [range: Range]: [string] }` — Multi-valued {@link Dictionary}; {@link TagRange} keys select
 *   matching language tags to retrieve; `[string]` is an immaterial array placeholder
 * - `readonly [Query]` — Nested resource collection; singleton {@link Query} element provides query for retrieved
 *   resources and filtering, ordering, and paginating criteria
 *
 * @see [RFC 4647 - Matching of Language Tags](https://www.rfc-editor.org/rfc/rfc4647.html)
 */
export type Projection =
	| Literal
	| { readonly [range: TagRange]: string }
	| { readonly [range: TagRange]: [string] }
	| IRI
	| Query
	| readonly [Query];

/**
 * Computed expression for deriving values from resource properties.
 *
 * Expressions combine value transformations and property access paths to define computed fields
 * in {@link Query} projections and constraints.
 *
 * Expressions use the compact string syntax `[transform:]*[path]` where:
 *
 * - **path** is a dot-separated list of property names (e.g., `order.items.price`);
 *   the empty path refers to the root value
 * - **transforms** is a sequence of transform names, each followed by a colon (e.g., `round:avg:`)
 *   and applied right-to-left (functional order)
 *
 * Both path steps and transform names follow {@link Identifier} rules (ECMAScript names).
 *
 * **Important:** Expressions are rejected with an error if they reference undefined properties
 * or undefined transforms.
 *
 * @remarks
 *
 * Compliant processors support all standard {@link Transforms}.
 */
export type Expression =
	| string & { readonly __brand: unique symbol };

/**
 * Option values for {@link Query} matching and ordering operators.
 *
 * Represents possible values for query matching (`?` and `!` operators) and focus ordering (`$` operator):
 *
 * - {@link Option} — Single option value
 * - {@link Dictionary} — Language-tagged option values
 * - `readonly Option[]` — Array of option values
 */
export type Options =
	| Option
	| Dictionary
	| readonly Option[];

/**
 * Single option value for {@link Query} matching and ordering operators.
 *
 * Represents a single value for query matching (`?` and `!` operators) and focus ordering (`$` operator):
 *
 * - `null` — Undefined property value
 * - {@link Literal} — Literal value
 * - {@link IRI} — Resource reference
 */
export type Option =
	| null
	| Literal
	| IRI;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

type Format =
	| "json"
	| "base64"
	| "form";

export function encodeQuery(query: Query, format: Format = "json"): string {

	throw new Error(";( to be implemented"); // !!!

}


export function decodeQuery(query: string, format: Format = "json"): string {

	throw new Error(";( to be implemented"); // !!!

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function transforms<const T extends readonly {

	/** Transform name */
	name: string,

	/** Whether the transform operates on collections (`true`) or individual values (`false`) */
	aggregate?: boolean,

	/** Result type of the transform; when omitted, the transform preserves the input type */
	datatype?: "boolean" | "number" | "string"

}[]>(transforms: T): Record<T[number]["name"], T[number]> {

	return Object.fromEntries(transforms.map(t => {

		if ( !isIdentifier(t.name) ) {
			throw new TypeError(`invalid transform name <${t.name}>`);
		}

		if ( t.aggregate !== undefined && isBoolean(t.aggregate) ) {
			throw new TypeError(`invalid transform aggregate <${t.aggregate}>`);
		}

		if ( t.datatype !== undefined && !["boolean", "number", "string"].includes(t.datatype) ) {
			throw new TypeError(`invalid transform datatype <${t.datatype}>`);
		}

		return [t.name, {
			name: t.name,
			aggregate: t.aggregate,
			datatype: t.datatype
		}];

	})) as unknown as Record<T[number]["name"], T[number]>;

}
