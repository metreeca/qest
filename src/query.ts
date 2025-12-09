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
 * Defines the shape of data clients want to retrieve from an API. Clients specify which properties to include,
 * how deeply to expand linked resources, and what filters to apply. This enables efficient single-call retrieval
 * of exactly the data needed, without over or under-fetching.
 *
 * **Important:** Servers may provide default retrieval queries to support regular REST/JSON access patterns.
 * When clients don't explicitly provide a query, the server applies its default query, enabling standard
 * REST operations while still supporting client-driven retrieval when needed.
 *
 * This module provides types and functions for defining and serializing queries:
 *
 * - {@link Query} — Resource retrieval query
 * - {@link Projection} — Property value specification
 * - {@link Expression} — Computed expression for transforms and paths
 * - {@link Transforms} — Standard value transformations
 * - {@link encodeQuery} — Serialize query to string
 * - {@link decodeQuery} — Parse query from string
 *
 * **Resource Queries**
 *
 * A {@link Query} specifies which properties to retrieve from a single {@link Resource}. Properties map to
 * {@link Projection} values that define the expected shape and type:
 *
 * ```typescript
 * const query: Query = {
 *   id: "",               // resource identifier
 *   name: "",             // string property
 *   price: 0,             // numeric property
 *   available: true,      // boolean property
 *   publisher: {          // nested resource
 *     id: "",
 *     name: ""
 *   }
 * };
 * ```
 *
 * **Collection Queries**
 *
 * A {@link Query} supports filtering, ordering, and pagination for resource collections:
 *
 * ```typescript
 * const query: Query = {
 *
 *   // projections
 *
 *   id: "",
 *   name: "",
 *   price: 0,
 *
 *   // filtering
 *
 *   ">=price": 10,                        // price ≥ 10
 *   "<=price": 100,                       // price ≤ 100
 *   "~name": "widget",                    // name contains "widget"
 *   "?category": ["electronics", "home"], // category in list
 *
 *   // ordering
 *
 *   "^price": "asc",                      // sort by price ascending
 *   "^name": -2,                          // then by name descending
 *
 *   // pagination
 *
 *   "@": 0,                               // skip first 0 results
 *   "#": 25                               // return at most 25 results
 *
 * };
 * ```
 *
 * **Localized Content**
 *
 * For multilingual properties, use {@link Range} keys to select language tags to retrieve:
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
 * **Nested Collections**
 *
 * Use singleton array projections to retrieve nested resource collections with their own filtering criteria:
 *
 * ```typescript
 * const query: Query = {
 *   id: "",
 *   name: "",
 *   items: [{          // nested collection
 *     id: "",
 *     name: "",
 *     price: 0,
 *     "^price": "asc", // order items by price
 *     "#": 10          // limit to 10 items
 *   }]
 * };
 * ```
 *
 * **Virtual Properties**
 *
 * Queries can define computed properties using {@link Expression | expressions} with {@link Transforms}:
 *
 * ```typescript
 * const query: Query = {
 *   id: "",
 *   name: "",
 *   "total=sum:items.price": 0,       // computed sum
 *   "avgRating=round:avg:ratings": 0, // computed average, rounded
 *   "itemCount=count:items": 0        // computed count
 * };
 * ```
 *
 * **Faceted Search**
 *
 * Queries support common patterns for faceted search interfaces. These minimal sketches illustrate basic
 * usage; real-world facet analytics can combine filtering, grouping, and aggregation for richer and coordinated
 * results:
 *
 * ```typescript
 * // Multi-value facet with counts
 *
 * const categoriesFacet: Query = {
 *   "category=sample:categories": "",
 *   "products=count:": 0,
 *   "^products:": "desc"
 * };
 *
 * // → [{ category: "Electronics", products: 150 },
 * //    { category: "Clothing", products: 89 },
 * //    { category: "Home", products: 45 }]
 *
 * // Numeric range for slider bounds
 *
 * const priceFacet: Query = {
 *   "min=min:price": 0,
 *   "max=max:price": 0
 * };
 *
 * // → { min: 9.99, max: 1299.00 }
 *
 * // Total matching items
 *
 * const productCount: Query = {
 *   "products=count:": 0
 * };
 *
 * // → { products: 284 }
 * ```
 *
 * # Query Serialization
 *
 * Queries can be serialized in multiple formats for transmission:
 *
 * | Mode     | Format                                                                                |
 * | -------- | ------------------------------------------------------------------------------------- |
 * | `json`   | [JSON](#json-serialization)                                                           |
 * | `url`    | [Percent-Encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON            |
 * | `base64` | [Base64](https://www.rfc-editor.org/rfc/rfc4648#section-4) encoded JSON               |
 * | `form`   | [Form-encoded](#form-serialization)                                                   |
 *
 * ## JSON Serialization
 *
 * Query operators are represented as JSON key prefixes, mirroring the {@link Query} type definition. Keys
 * combine a prefix with an {@link Expression | expression}. Values are JSON-serialized according to operator type:
 *
 * | Operator              | Key Prefix | Value Type | Example                 |
 * |-----------------------|------------|------------|-------------------------|
 * | Less than             | `<`        | Literal    | `{"<price": 100}`       |
 * | Greater than          | `>`        | Literal    | `{">price": 50}`        |
 * | Less than or equal    | `<=`       | Literal    | `{"<=price": 100}`      |
 * | Greater than or equal | `>=`       | Literal    | `{">=price": 50}`       |
 * | Pattern filter        | `~`        | string     | `{"~name": "corp"}`     |
 * | Disjunctive matching  | `?`        | Options    | `{"?status": "active"}` |
 * | Conjunctive matching  | `!`        | Options    | `{"!tags": ["a", "b"]}` |
 * | Focus ordering        | `$`        | Options    | `{"$status": "active"}` |
 * | Sort order            | `^`        | Order      | `{"^date": -1}`         |
 * | Offset                | `@`        | number     | `{"@": 0}`              |
 * | Limit                 | `#`        | number     | `{"#": 10}`             |
 *
 * ```json
 * {
 *   "?status": ["active", "pending"],
 *   "~name": "corp",
 *   ">=price": 100,
 *   "<=price": 1000,
 *   "^date": -1,
 *   "@": 0,
 *   "#": 25
 * }
 * ```
 *
 * ## Form Serialization
 *
 * Query objects additionally support `application/x-www-form-urlencoded` encoding via the `form` mode.
 *
 * The `form` format serializes Query objects as query strings, where each `label=value` pair represents a constraint.
 * Labels may include operator prefixes or suffixes to specify the type of criterion being applied.
 *
 * ```
 * query   = pair*
 * pair    = "&"? label ("=" value)?
 * label   = prefix? expression postfix? | "@" | "#"
 * prefix  = "~" | "?" | "!" | "$" | "^"
 * postfix = "<" | ">"
 * value   = <URL-encoded string>
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
 * ```
 * status=active&status=pending&~name=corp&price>=100&price<=1000&^date=descending&@=0&#=25
 * ```
 *
 * This query:
 *
 * 1. Filters items where `status` is "active" OR "pending"
 * 2. Filters items where `name` contains "corp"
 * 3. Filters items where `price` is between 100 and 1000 (inclusive)
 * 4. Sorts results by `date` in descending order
 * 5. Returns the first 25 items (offset 0, limit 25)
 *
 * # Query Grammar
 *
 * Grammar elements shared by both JSON and Form serialization formats.
 *
 * ## Expressions
 *
 * {@link Expression | Expressions} identify properties or computed values. An expression combines optional
 * [transform pipes](#transform-pipes) with a [property path](#property-paths).
 *
 * ```
 * expression = transforms path
 * ```
 *
 * Transforms form a pipeline applied right-to-left. An empty path with transforms computes aggregates over the input.
 *
 * ```
 * name
 * user.profile
 * count:items
 * sum:items.price
 * round:avg:scores
 * count:
 * ```
 *
 * ### Transform Pipes
 *
 * {@link Transforms} apply operations to path values. Multiple transforms form a pipeline, applied right-to-left
 * (functional order).
 *
 * ```
 * transforms = (identifier ":")*
 * ```
 *
 * ```
 * count:items                  # count of items
 * sum:items.price              # sum of item prices
 * round:avg:scores             # inner applied first, then outer
 * ```
 *
 * ### Property Paths
 *
 * Property paths identify nested properties within a resource using dot notation. An empty path references
 * the root value.
 *
 * ```
 * path       = property ("." property)*
 * property   = identifier
 * identifier = [$_\p{ID_Start}][$\p{ID_Continue}]*
 * ```
 *
 * ```
 * name                         # simple property
 * user.profile.email           # nested property
 * count:                       # empty path (root)
 * ```
 *
 * ### Identifiers
 *
 * Property names and transform names follow
 * {@link https://262.ecma-international.org/15.0/#sec-names-and-keywords | ECMAScript identifier} rules.
 *
 * ```
 * name                         # simple identifier
 * _private                     # underscore prefix
 * $ref                         # dollar prefix
 * item123                      # contains digits
 * ```
 *
 * ## Values
 *
 * - Values are serialized as [JSON](https://www.rfc-editor.org/rfc/rfc8259) primitives
 * - IRIs are serialized as strings
 * - Localized strings ({@link Dictionary}) combine a string with a
 *   {@link https://metreeca.github.io/core/types/language.Tag.html | language tag}
 *
 * ```
 * value      = literal | localized
 * literal    = boolean | number | string
 * boolean    = "true" | "false"
 * number     = <JSON number>
 * string     = <JSON string> | <unquoted>
 * localized  = <JSON string> "@" language-tag
 * ```
 *
 * String quotes may be omitted.
 *
 * > **Warning:** Omitting quotes may cause strings to be interpreted as numbers.
 * > Use `"123"` to preserve string type for numeric-looking values.
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
 * - `{ readonly [range: Range]: string }` — Single-valued {@link Dictionary}; {@link Range} key selects
 *   language tags to retrieve; `string` is a placeholder
 * - `{ readonly [range: Range]: [string] }` — Multi-valued {@link Dictionary}; {@link Range} key selects
 *   language tags to retrieve; array marks multi-valued
 * - `readonly [Query]` — Nested resource collection; singleton {@link Query} element provides filtering,
 *   ordering, and paginating criteria for members
 * - `[]` — Nothing (ignored during processing)
 *
 * Queries may also define *virtual* properties, whose value is computed from an {@link Expression}; in this case,
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
 * - {@link Literal} — Plain literal
 * - {@link Query} — Nested resource
 * - `{ readonly [range: Range]: string }` — Single-valued {@link Dictionary}; {@link Range} keys select
 *   matching language tags to retrieve; `string` is an immaterial scalar placeholder
 * - `{ readonly [range: Range]: [string] }` — Multi-valued {@link Dictionary}; {@link Range} keys select
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
 * Both path steps and transform names are
 * {@link https://262.ecma-international.org/15.0/#sec-names-and-keywords | ECMAScript identifiers}.
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
	| "url"
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
