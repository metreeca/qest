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
 * to shape the results (using {@link Query} projections).
 *
 * @module
 */

import { Identifier } from "@metreeca/core";
import { Range } from "@metreeca/core/network";
import { Dictionary, Literal, Value } from "../value.js";

export * from "./specs.js";
export * from "./expression.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Value transformation operations for computed expressions.
 *
 * This registry provides metadata for a minimal but extensible set of built-in transforms.
 * Each transform specifies whether it operates on collections (aggregate) and its result datatype.
 *
 * @remarks
 *
 * **Extensibility**: The expression parser accepts any valid identifier as a transform name,
 * not just those defined in this registry. This allows applications to extend the transform
 * set without modifying the parser. Transforms follow the same naming rules as property names:
 * must start with letter, underscore, or dollar sign, followed by letters, digits, underscores,
 * or dollar signs.
 *
 * **Transform Categories**:
 *
 * - **Aggregate transforms** (`aggregate: true`): Operate on collections to produce single values
 *   (e.g., `sum`, `avg`, `count`, `min`, `max`)
 *
 * - **Scalar transforms** (`aggregate: false`): Operate on individual values
 *   (e.g., `abs`, `round`, `year`)
 *
 * **Result Datatypes**:
 *
 * The `datatype` field specifies the type of value returned by the transform. When projecting computed
 * values in {@link Query} objects, the model's expected type should match the final value of the
 * expression transform pipe:
 *
 * - `"boolean"`, `"number"`, `"string"` — Transform produces specific primitive type
 * - `"*"` — Transform preserves input type; compatible with resources and nested properties
 *
 * @example
 *
 * ```typescript
 * // Using built-in transforms
 * Expression("sum:items.price")        // { pipe: ["sum"], path: ["items", "price"] }
 * Expression("avg:round:scores")       // { pipe: ["avg", "round"], path: ["scores"] }
 *
 * // Using custom transforms (not in registry)
 * Expression("capitalize:name")        // { pipe: ["capitalize"], path: ["name"] }
 * Expression("custom_fn:data")         // { pipe: ["custom_fn"], path: ["data"] }
 * ```
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

} as const;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Recursive template for retrieving consumer-specified data envelopes.
 *
 * Defines the shape and content of {@link Resource} objects to be retrieved, specifying which properties
 * to include (plain or computed) and, for nested collections, how to recursively select, sort, paginate,
 * and shape linked resources.
 *
 * @remarks
 *
 * **Key Syntax**
 *
 * - Plain properties: `property` — Includes retrieved value from source property in returned resource
 * - Computed properties: `property=expression` — Includes computed value from {@link Expression} in returned resource;
 *   the property value type should match the final value returned by the expression's pipe (see
 *   {@link Expression.pipe} and {@link Transform}). Only empty pipes or pipes ending with a `"*"` datatype
 *   transform can accept resource envelopes with nested properties
 *
 * **Property Values**
 *
 * - {@link Value} — Placeholder for a single linked value to be retrieved; defines the expected result type
 * - {@link Dictionary} — Placeholder for language-tagged values; tag keys specify which tags to include
 *   in the response (use `"*"` to request all available tags), values (`string` or `readonly string[]`)
 *   indicate expected multiplicity
 * - `readonly ({@link Query} | {@link Specs})[]` — Recursive specifications for nested collections:
 *   - {@link Specs} objects define filtering, sorting, and pagination criteria for selecting
 *     the relevant subset of linked collection items
 *   - {@link Query} objects recursively define how to shape the selected resources
 *
 * **Validation**
 *
 * - Empty arrays are ignored during processing.
 * - Queries are rejected with an error if:
 *   - Property value types don't match the values returned by expressions (including simple retrieval expressions)
 *   - Expressions reference data properties not included in the available data model
 *
 *
 * @see {@link Resource}
 * @see {@link Specs}
 * @see {@link Expression}
 */
export type Query = {

	readonly [property in Identifier | `${Identifier}=${string}`]:

	| Value
	| { readonly [range: Range]: string }
	| { readonly [range: Range]: readonly string[] }
	| readonly (Query | Specs)[]

}


/**
 * Query constraints for retrieving resource collections.
 *
 * Provides declarative operators for filtering, ordering, and paginating resource collections.
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
 * @see {@link Query}
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


/**
 * Computed expression for deriving values from resource properties.
 *
 * Expressions combine optional naming, value transformations (pipe), and property access (path)
 * to define computed fields in {@link Query} definitions and {@link Specs} constraints.
 *
 * @remarks
 *
 * An expression consists of three components, all optional but typically includes at least a path:
 *
 * - **name**: Optional identifier for naming computed properties (e.g., `totalPrice`)
 * - **pipe**: Ordered sequence of {@link Transform} names applied to the path value (e.g., `["sum", "round"]`)
 * - **path**: Property accessor as an array of step strings (e.g., `["order", "items", "price"]`)
 *
 * **Expression Syntax**:
 *
 * Expressions use a compact string syntax: `[name=][transform:]*path`
 *
 * - **Path only**: `user.name` → `{ pipe: [], path: ["user", "name"] }`
 * - **Transform + path**: `sum:items.price` → `{ pipe: ["sum"], path: ["items", "price"] }`
 * - **Multiple transforms**: `sum:round:prices` → `{ pipe: ["sum", "round"], path: ["prices"] }`
 * - **Named expression**: `total=sum:items.price` → `{ name: "total", pipe: ["sum"], path: [...] }`
 * - **Transform only**: `count:` → `{ pipe: ["count"], path: [] }`
 *
 * **Path Notation**:
 *
 * Paths use dot notation for accessing nested object members:
 *
 * - Dot notation: `user.profile.name` (identifiers: `[$_\p{ID_Start}][$\p{ID_Continue}]*`)
 * - Leading dot: `.user.name` (leading `.` is stripped)
 * - Empty path: `""` or `.` → `{ pipe: [], path: [] }`
 *
 * **Transforms**:
 *
 * Transform names follow identifier rules and are applied left-to-right (pipeline order).
 * See {@link Transform} for built-in transforms, though any valid identifier is accepted by the parser.
 *
 * @example
 *
 * ```typescript
 * // Path-only expressions
 * Expression("name")                    // { pipe: [], path: ["name"] }
 * Expression("user.profile.email")      // { pipe: [], path: ["user", "profile", "email"] }
 * Expression("['content-type']")        // { pipe: [], path: ["content-type"] }
 *
 * // Expressions with transforms
 * Expression("sum:items.price")         // { pipe: ["sum"], path: ["items", "price"] }
 * Expression("avg:round:scores")        // { pipe: ["avg", "round"], path: ["scores"] }
 * Expression("count:")                  // { pipe: ["count"], path: [] }
 *
 * // Named expressions
 * Expression("totalPrice=sum:items.price")
 * // { name: "totalPrice", pipe: ["sum"], path: ["items", "price"] }
 *
 * Expression("userName=user.name")
 * // { name: "userName", pipe: [], path: ["user", "name"] }
 *
 * // Complex expressions
 * Expression("avgScore=avg:round:users.tests.score")
 * // { name: "avgScore", pipe: ["avg", "round"], path: ["users", "tests", "score"] }
 * ```
 *
 * @see {@link Query} for usage in projections
 * @see {@link Specs} for usage in constraints
 * @see {@link Transform} for transform metadata
 *
 * @see {@link https://datatracker.ietf.org/doc/rfc9535/ | RFC 9535 - JSONPath Query Expressions}
 */
export type Expression = {

	readonly name?: Identifier,

	readonly pipe: readonly Identifier[]
	readonly path: readonly Identifier[]

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
