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
 * Query types for client-driven resource fetching.
 *
 * {@link Query} objects combine filtering, sorting and pagination criteria (using {@link Specs} constraints) and how
 * to shape the results (using {@link Model} projections).
 * @module
 */

import { immutable } from "../../Core/src/common/nested.js";
import { Dictionary, Literal, Properties, Value, Values } from "./index.js";


const pattern = immutable({

	/** Matches a valid path: optional leading dot, steps separated by unescaped dots */
	path: /^\.?(?:[^.\\]|\\.)+(?:\.(?:[^.\\]|\\.)+)*$/,

	/** Matches path steps: sequences of non-dot/backslash or escaped characters */
	step: /(?:[^.\\]|\\.)+/g,

	/** Matches expression structure: transforms prefix + path */
	expression: /^(\w+:)*(.*)$/,

	/** Matches transforms prefix: zero or more word+colon sequences */
	transforms: /^(\w+:)*/,

	/** Extracts transform names from prefix using lookahead */
	transform: /\w+(?=:)/g

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Value transformation operations for computed expressions.
 *
 * Each transform specifies whether it operates on collections (aggregate) and its result datatype.
 *
 * @see {@link Expression}
 */
export const Transform: {

	[name: string]: {
		aggregate: boolean,
		datatype: "boolean" | "number" | "string" | "*"
	}

} = {

	/** Count of values in collection */
	count: { aggregate: true, datatype: "number" },

	/** Minimum value in collection */
	min: { aggregate: true, datatype: "*" },

	/** Maximum value in collection */
	max: { aggregate: true, datatype: "*" },

	/** Sum of values in collection */
	sum: { aggregate: true, datatype: "number" },

	/** Average of values in collection */
	avg: { aggregate: true, datatype: "number" },


	/** Absolute value */
	abs: { aggregate: false, datatype: "number" },

	/** Round to nearest integer */
	round: { aggregate: false, datatype: "number" },

	/** Extract year component from date/time */
	year: { aggregate: false, datatype: "number" }

	// !!! {TBC}

} as const;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resource specification with nested queries and models.
 *
 * Extends {@link Resource} to support property values that can be either regular {@link Values}
 * or arrays of {@link Specs} and {@link Model} objects for filtering and shaping nested data.
 * Empty arrays are ignored during processing.
 *
 * @remarks
 *
 * Used for defining resource templates that combine data values with declarative queries
 * and transformations for nested properties.
 *
 * @see {@link Values}
 * @see {@link Specs}
 * @see {@link Model}
 */
export type Query = Properties & {

	readonly [K in string]: Values | readonly (Model | Specs)[]

}


/**
 * Resource model defining the projection and shape of query results.
 *
 * Model keys specify which properties to retrieve using two syntax forms:
 *
 * 1. **Plain properties**: `property` - Retrieves source property with same name
 * 2. **Computed properties**: `property=expression` - Computes value from {@link Expression}
 *
 * Model values define the expected structure for retrieved values and can recursively
 * contain nested {@link Model} objects for hierarchical data.
 *
 * @remarks
 *
 * Plain property keys are shorthand for identity mapping:
 * `{ property: model }` is equivalent to `{ "property=property": model }`.
 *
 * Use computed property syntax (`property=${Expression}`) for explicit transformations
 * or computed fields based on {@link Expression} values.
 *
 * Properties cannot start with `=` alone (enforced by type constraint).
 *
 * @example
 *
 * ```typescript
 * const productModel: Model = {
 *   "name": "Product Name",           // Literal assignment
 *   "title": undefined,                // Identity mapping (retrieves "title" property)
 *   "totalPrice=sum:items.price": undefined  // Computed from expression
 * };
 * ```
 *
 * @see {@link Specs}
 * @see {@link Expression}
 * @see {@link Resource}
 */
export type Model = Properties & {

	readonly [K in string | `${string}=${string}`]: Values

} & {

	readonly [K in `=${string}`]?: never

}

/**
 * Query constraints for filtering and sorting resource collections.
 *
 * Provides declarative operators for filtering, ordering, and paginating resources.
 * All operators use {@link Expression} keys that combine optional transforms with property paths.
 *
 * @remarks
 *
 * **Filtering**:
 *
 * - `<`, `>`, `<=`, `>=` — Range filtering for numeric/string comparisons
 * - `~` — Stemmed word search in text values
 * - `?` — Disjunctive matching (any of the specified values; `null` matches undefined properties)
 * - `!` — Conjunctive matching (all the specified values; `null` matches undefined properties)
 *
 * **Ordering**:
 *
 * - `$` — Focus ordering (prioritizes included values)
 * - `^` — Sort by numeric priority:
 *   - `0` = unsorted
 *   - `>0` = ascending order
 *   - `<0` = descending order
 *   - Multiple criteria applied in absolute value order
 *   - `"asc"`/`"ascending"` equivalent to `+1`
 *   - `"desc"`/`"descending"` equivalent to `-1`
 *
 * **Pagination**:
 *
 * - `@` — Offset (skip first N items)
 * - `#` — Limit (return at most N items)
 *
 * @example
 *
 * ```typescript
 * // Filter by price range and sort by name
 * const query: Query = {
 *   ">=price": 10,
 *   "<=price": 100,
 *   "^name": "ascending"
 * };
 *
 * // Search with pagination
 * const searchQuery: Query = {
 *   "~title": "javascript",
 *   "@": 10,    // offset
 *   "#": 20     // limit
 * };
 * ```
 *
 * @see {@link Expression}
 * @see {@link Model}
 * @see {@link Options}
 */
export type Specs = Partial<{

	readonly [lt: `<${string}`]: Literal
	readonly [gt: `>${string}`]: Literal

	readonly [lte: `<=${string}`]: Literal
	readonly [gte: `>=${string}`]: Literal

	readonly [like: `~${string}`]: string

	readonly [any: `?${string}`]: Options
	readonly [all: `!${string}`]: Options

	readonly [focus: `$${string}`]: Options
	readonly [order: `^${string}`]: "asc" | "desc" | "ascending" | "descending" | number

	readonly "@": number
	readonly "#": number

}>


export type Expression = {

	readonly name?: string,

	readonly pipe: readonly (keyof typeof Transform)[]
	readonly path: readonly string[]

}


/**
 * Option values for query matching operators.
 *
 * Represents possible values for query matching operations (`?` and `!` operators)
 * and focus ordering (`$` operator).
 *
 * @remarks
 *
 * Supports the following value types:
 *
 * - `null` — Matches undefined properties in queries
 * - {@link Value} — Single literal or resource value
 * - {@link Dictionary} — Language-tagged value map
 * - `readonly (null | {@link Value})[]` — Array of values (including `null`)
 *
 * @see {@link Specs}
 * @see {@link Value}
 * @see {@link Dictionary}
 */
export type Options =
	| null
	| Value
	| Dictionary
	| (readonly (null | Value)[])


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Expression() {

}
