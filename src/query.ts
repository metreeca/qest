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
 * Client-driven resource retrieval.
 *
 * Defines the shape of data clients want to retrieve from an API. Clients specify which properties to include
 * and how deeply to expand linked resources. For collections, queries also support filtering, ordering, and
 * pagination. This enables efficient single-call retrieval of exactly the data needed.
 *
 * This module provides types for defining queries:
 *
 * - {@link Query} — Resource retrieval query
 * - {@link Model} — Property value specification
 * - {@link Expression} — Computed expression for transforms and paths
 * - {@link Transforms} — Standard value transformations
 *
 * It also provides utilities for converting between serialized and structured representations::
 *
 * - {@link encodeQuery} / {@link decodeQuery} — codecs for URL-safe query strings queries
 * - {@link encodeCriterion} / {@link decodeCriterion} — codecs for {@link Query} criterion keys
 *
 * # Query Patterns
 *
 * ## Resource Queries
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
 * ## Collection Queries
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
 * ## Localized Content
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
 * ## Computed Properties
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
 * ## Faceted Search
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
 * Supports `application/x-www-form-urlencoded` encoding via the `form` mode. The format encodes queries as
 * `label=value` pairs where:
 *
 * - Labels use the same prefixed operator syntax as {@link Query} constraint keys
 * - Each pair carries a single value; repeated labels are merged into arrays where accepted
 * - Postfix aliases (`expression=` for `?`, `expression<=` for `<=`, `expression>=` for `>=`) provide natural form
 *   syntax
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
 * # Query Grammar
 *
 * The following grammar elements are shared by both JSON and Form serialization formats.
 *
 * ## Expressions
 *
 * {@link Expression | Expressions} identify properties or computed values combining an optional result name,
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
 * {@link Model} values specifying what to retrieve:
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

	readonly [property: Identifier | `${Identifier}=${Expression}`]: Model

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
 * - `{ readonly [range: Range]: string }` — Single-valued {@link Dictionary}; {@link TagRange} keys select
 *   matching language tags to retrieve; `string` is an immaterial scalar placeholder
 * - `{ readonly [range: Range]: [string] }` — Multi-valued {@link Dictionary}; {@link TagRange} keys select
 *   matching language tags to retrieve; `[string]` is an immaterial array placeholder
 * - {@link IRI} — Resource reference
 * - {@link Query} — Nested resource
 * - `readonly [Query]` — Nested resource collection; singleton {@link Query} element provides query for retrieved
 *   resources and filtering, ordering, and paginating criteria
 *
 * @see [RFC 4647 - Matching of Language Tags](https://www.rfc-editor.org/rfc/rfc4647.html)
 */
export type Model =
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

/**
 * Parsed representation of a {@link Query} key.
 *
 * Decomposes projection keys (`property` or `alias=expression`) and constraint keys (`operator expression`)
 * into their structural components.
 *
 * A unified type suffices as projections and constraints are easily
 * disambiguated after parsing using {@link isIdentifier} on the `target` field.
 *
 * @see {@link encodeCriterion}
 * @see {@link decodeCriterion}
 */
export type Criterion = {

	/** Property name for projections or constraint {@link Operator}. */
	readonly target: Identifier | Operator;

	/** Transform pipeline applied to the value, in application order. */
	readonly pipe: readonly Identifier[];

	/** Dot-separated property path to the target value. */
	readonly path: readonly Identifier[];

}

/**
 * Constraint operator symbols for {@link Query} keys.
 *
 * @see {@link Query} for constraint semantics
 */
export type Operator =
	| "<"
	| ">"
	| "<="
	| ">="
	| "~"
	| "?"
	| "!"
	| "$"
	| "^"
	| "@"
	| "#";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a query as a URL-safe string.
 *
 * Serializes a {@link Query} object into a string representation suitable for transmission as a URL query string in
 * GET requests. The output format can be selected based on readability, compactness, and compatibility requirements.
 *
 * @param query The query object to encode
 * @param format The output format:
 *
 * - `"json"` — [Percent-encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON; human-readable but verbose;
 *   see [JSON Serialization](#json-serialization)
 * - `"base64"` — [Base64-encoded](https://www.rfc-editor.org/rfc/rfc4648#section-4) JSON; compact and URL-safe
 * - `"form"` — [Form-encoded](https://url.spec.whatwg.org/#application/x-www-form-urlencoded) `label=value` pairs;
 *   most compatible with standard tooling; see [Form Serialization](#form-serialization)
 *
 * @returns The encoded query string
 *
 * @see {@link decodeQuery}
 */
export function encodeQuery(query: Query, format: "json" | "base64" | "form" = "json"): string {

	const json = JSON.stringify(query);

	return format === "json" ? encodeURIComponent(json)
		: format === "base64" ? encodeBase64(json)
			: encodeFormQuery(query);

}

function encodeBase64(text: string): string {

	// Encode Unicode to UTF-8 bytes, then to URL-safe base64
	const bytes = new TextEncoder().encode(text);
	const base64 = btoa(String.fromCharCode(...bytes));

	// Convert to URL-safe base64: replace + with -, / with _, remove = padding
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

}

function encodeFormQuery(query: Query): string {

	return Object.entries(query)
		.flatMap(([key, value]) => encodeFormEntry(key, value))
		.join("&");

}

function encodeFormEntry(key: string, value: unknown): string[] {

	return value === null ? [`${encodeURIComponent(key)}=null`]
		: Array.isArray(value) ? value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
			: typeof value === "object" ? [] // nested objects not supported in form encoding
				: [`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`];

}

/**
 * Decodes a query from a URL-safe string.
 *
 * Parses an encoded query string back into a {@link Query} object. The encoding format is auto-detected from the
 * input string structure.
 *
 * @param query The encoded query string
 * @returns The decoded query object
 *
 * @see {@link encodeQuery}
 */
export function decodeQuery(query: string): Query {

	if ( !query ) { return {} as Query; }

	// Try JSON format first (starts with %7B which is encoded '{')
	if ( query.startsWith("%7B") || query.startsWith("{") ) {
		return JSON.parse(decodeURIComponent(query)) as Query;
	}

	// Try base64 format (standard or URL-safe base64)
	if ( /^[A-Za-z0-9+/_=-]+$/.test(query) && !query.includes("&") ) {
		try {
			return JSON.parse(decodeBase64(query)) as Query;
		} catch {
			// Not valid base64, fall through to form format
		}
	}

	// Form format (application/x-www-form-urlencoded)
	return decodeFormQuery(query);

}

function decodeBase64(encoded: string): string {

	// Convert from URL-safe base64 to standard base64 and ensure padding
	const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
	const padLen = (4 - base64.length % 4) % 4;
	const padded = padLen > 0 && !base64.endsWith("=") ? base64 + "=".repeat(padLen) : base64;
	const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));

	return new TextDecoder().decode(bytes);

}

function decodeFormQuery(query: string): Query {

	const result: Record<string, unknown> = {};
	const prefixOperators = /^(<|>|<=|>=|~|\?|!|\$|\^|@|#)/;
	// Postfix syntax: property<=value or property<value (operator in middle)
	const postfixOperators = /^(.+?)(<=|>=|<|>)(.+)$/;

	for ( const pair of query.split("&") ) {

		if ( !pair ) { continue; }

		const decoded = decodeURIComponent(pair.replace(/\+/g, " "));

		// First check for postfix syntax in the full parameter (property<value)
		const postfixMatch = decoded.match(postfixOperators);
		if ( postfixMatch ) {
			const property = postfixMatch[1];
			const op = postfixMatch[2];
			const rawValue = postfixMatch[3];
			const key = op + property;
			const value = parseFormValue(rawValue);
			addFormValue(result, key, value);
			continue;
		}

		// Standard key=value parsing
		const [encodedKey, ...valueParts] = pair.split("=");
		const decodedKey = decodeURIComponent(encodedKey);
		const rawValue = valueParts.join("="); // Handle values with = in them
		const value = parseFormValue(rawValue);

		// Check for prefix operator
		const prefixMatch = decodedKey.match(prefixOperators);
		const key = prefixMatch ? decodedKey : "?" + decodedKey;

		addFormValue(result, key, value);

	}

	return result as Query;

}

function parseFormValue(rawValue: string): unknown {

	return rawValue === "null" ? null
		: rawValue === "true" ? true
			: rawValue === "false" ? false
				: /^-?\d+(\.\d+)?$/.test(rawValue) ? Number(rawValue)
					: decodeURIComponent(rawValue.replace(/\+/g, " "));

}

function addFormValue(result: Record<string, unknown>, key: string, value: unknown): void {

	if ( key in result ) {
		const existing = result[key];
		result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
	} else {
		result[key] = value;
	}

}


/**
 * Encodes a criterion as a {@link Query} key string.
 *
 * Serializes a parsed {@link Criterion} back into its compact string representation suitable for use as a Query key.
 *
 * @param criterion The criterion to encode
 * @returns The encoded key string
 *
 * @see {@link decodeCriterion}
 */
export function encodeCriterion(criterion: Criterion): string {

	throw new Error(";( to be implemented"); // !!!

}

/**
 * Decodes a {@link Query} key string into a criterion.
 *
 * Parses a Query key string into its structural {@link Criterion} components, distinguishing projection keys
 * from constraint keys based on the presence of an {@link Operator} prefix.
 *
 * @param key The query key string to decode
 * @returns The parsed criterion
 *
 * @see {@link encodeCriterion}
 */
export function decodeCriterion(key: string): Criterion {

	throw new Error(";( to be implemented"); // !!!

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a typed transform registry from transform definitions.
 *
 * Validates each transform definition and builds a type-safe record mapping transform names to their definitions.
 * Used internally to construct the {@link Transforms} registry.
 *
 * @typeParam T The tuple type of transform definitions preserving literal name types
 *
 * @param transforms The array of transform definitions to register
 *
 * @returns A record mapping each transform name to its definition
 */
function transforms<const T extends readonly {

	/** Transform name. */
	name: string,

	/** Whether the transform operates on collections (`true`) or individual values (`false`). */
	aggregate?: boolean,

	/** Result type of the transform; when omitted, the transform preserves the input type. */
	datatype?: "boolean" | "number" | "string"

}[]>(transforms: T): Record<T[number]["name"], T[number]> {

	return Object.fromEntries(transforms.map(t => {

		if ( !isIdentifier(t.name) ) {
			throw new TypeError(`invalid transform name <${t.name}>`);
		}

		if ( t.aggregate !== undefined && !isBoolean(t.aggregate) ) {
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
