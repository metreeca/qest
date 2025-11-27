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

import { Expression } from "./_expression.js";
import { Dictionary, Literal, Properties, Value, Values } from "./index.js";


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

	readonly [K in string | `${string}=${Expression}`]: Values

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

	readonly [lt: `<${Expression}`]: Literal
	readonly [gt: `>${Expression}`]: Literal

	readonly [lte: `<=${Expression}`]: Literal
	readonly [gte: `>=${Expression}`]: Literal

	readonly [like: `~${Expression}`]: string

	readonly [any: `?${Expression}`]: Options
	readonly [all: `!${Expression}`]: Options

	readonly [order: `^${Expression}`]: "asc" | "desc" | "ascending" | "descending" | number
	readonly [focus: `$${Expression}`]: Options

	readonly "@": number
	readonly "#": number

}>

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

/**
 * Creates a type-safe {@link Model} instance with compile-time validation.
 *
 * Provides compile-time type checking for model property keys and values, ensuring
 * that property names follow the correct format and values are assignable to {@link Values}.
 *
 * @typeParam T The model type to create
 *
 * @param specs The model definition to validate
 *
 * @returns The validated model instance
 *
 * @remarks
 *
 * This factory function enforces the following constraints at compile-time:
 *
 * - Regular properties must contain valid {@link Values}
 * - Assignment properties must use the `property=${Expression}` format
 * - Properties cannot start with `=` alone
 *
 * @example
 *
 * ```typescript
 * const productModel = model({
 *   "name": "Product Name",
 *   "price": 99.99,
 *   "totalPrice=sum:items.price": undefined
 * });
 * ```
 *
 * @see {@link Model}
 * @see {@link Expression}
 */
export function model<T extends Model>(specs: {

	[K in keyof T]:

	K extends `=${string}` ? never
		: K extends (string | `${string}=${Expression}`) ? (T[K] extends Values ? T[K] : never)
			: never

}): T {

	return specs as T;

}

/**
 * Creates a type-safe {@link Specs} instance with compile-time validation.
 *
 * Provides compile-time type checking for query operators and their values, ensuring
 * that operators use correct expression syntax and values match expected types.
 *
 * @typeParam T The query type to create
 *
 * @param specs The query specification to validate
 *
 * @returns The validated query instance
 *
 * @remarks
 *
 * This factory function enforces the following constraints at compile-time:
 *
 * - Range operators (`<`, `>`, `<=`, `>=`) must have {@link Literal} values
 * - Like operator (`~`) must have string values
 * - Matching operators (`?`, `!`) must have {@link Options} values
 * - Order operator (`^`) must have string or number values
 * - Focus operator (`$`) must have {@link Options} values
 * - Pagination operators (`@`, `#`) must have number values
 *
 * @example
 *
 * ```typescript
 * const productQuery = query({
 *   ">=price": 10,
 *   "<=price": 100,
 *   "~title": "javascript",
 *   "^name": "ascending",
 *   "@": 0,
 *   "#": 20
 * });
 * ```
 *
 * @see {@link Specs}
 * @see {@link Expression}
 * @see {@link Options}
 */
export function specs<T extends Specs>(specs: {

	[K in keyof T]:

	K extends (`<${string}` | `>${string}` | `<=${string}` | `>=${string}`) ? (T[K] extends Literal ? T[K] : never)
		: K extends `~${string}` ? (T[K] extends string ? T[K] : never)
			: K extends (`?${string}` | `!${string}`) ? (T[K] extends Options ? T[K] : never)
				: K extends `^${string}` ? (T[K] extends string | number ? T[K] : never)
					: K extends `$${string}` ? (T[K] extends Options ? T[K] : never)
						: K extends ("@" | "#") ? (T[K] extends number ? T[K] : never)
							: never

}): T {

	return specs as T;

}
