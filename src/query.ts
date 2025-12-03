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

import { error } from "@metreeca/core/report";
import { immutable } from "../../Core/src/common/nested.js";
import { Dictionary, Literal, Properties, Value, Values } from "./index.js";
import * as parser from "./parsers/expression.js";


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

	readonly [K in string]: Values | readonly (Model | Specs)[]  // !!! no plain arrays

}


/**
 * Resource model defining the projection and shape of query results.
 *
 * Model keys specify which properties to retrieve using two syntax forms:
 *
 * 1. **Plain properties**: `property` - Retrieves source property with same name (type: `string`)
 * 2. **Computed properties**: `property=expression` - Computes value from {@link Expression}
 *    (type: `` `${string}=${string}` ``)
 *
 * Model values define the expected structure for retrieved values and can recursively
 * contain nested {@link Model} objects for hierarchical data.
 *
 * @remarks
 *
 * **Key Patterns**:
 *
 * - Plain property keys (e.g., `"name"`, `"email"`) are shorthand for identity mapping:
 *   `{ property: model }` is equivalent to `{ "property=property": model }`.
 *
 * - Computed property keys (e.g., `"totalPrice=sum:items.price"`) use the `property=expression` syntax
 *   for explicit transformations or computed fields based on {@link Expression} values.
 *
 * @see {@link Specs}
 * @see {@link Expression}
 * @see {@link Resource}
 */
export type Model = Properties & {

	readonly [K in string | `${string}=${string}`]: Values // nested arrays as per QUery

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


/**
 * Computed expression for deriving values from resource properties.
 *
 * Expressions combine optional naming, value transformations (pipe), and property access (path)
 * to define computed fields in {@link Model} definitions and {@link Specs} constraints.
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
 * Paths use a property-navigation subset of [JSONPath](https://datatracker.ietf.org/doc/rfc9535/)
 * (RFC 9535) for accessing object members. The leading `$` root indicator is **optional** and stripped
 * when present, unlike standard JSONPath which requires it:
 *
 * - Dot notation: `user.profile.name` (identifiers: `[a-zA-Z_$][a-zA-Z0-9_$]*`)
 * - Bracket notation: `['first-name']`, `['@id']` (any string, single quotes only)
 * - Mixed notation: `user['first-name'].city`, `['@context'].items`
 * - JSONPath root: `$` or `$.property` (root indicator is stripped)
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
 * @see {@link Model} for usage in projections
 * @see {@link Specs} for usage in constraints
 * @see {@link Transform} for transform metadata
 *
 * @see {@link https://datatracker.ietf.org/doc/rfc9535/ | RFC 9535 - JSONPath Query Expressions}
 */
export type Expression = {

	readonly name?: string,

	readonly pipe: readonly string[]
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

export function Query(query: Query): Query;
export function Query(query: string): Query;
export function Query(query: Query, opts: { format: "string" }): string;

export function Query(query: Query | string, opts?: { format: "string" }): Query | string {

	return typeof query === "string" ? decode(query)
		: typeof query === "object" && opts !== undefined ? encode(query, opts)
			: typeof query === "object" ? create(query)
				: error(new TypeError("invalid Query() arguments"));


	function create(query: Query): Query {
		return immutable(query);
	}

	function decode(query: string): Query {
		throw new Error(";( to be implemented"); // !!!
	}

	function encode(query: Query, opts: { format: "string" }): string {
		throw new Error(";( to be implemented"); // !!!
	}

}

/**
 * Creates, parses, or encodes {@link Expression} objects.
 *
 * This overloaded function supports three modes of operation:
 *
 * 1. **Factory mode**: Validates and freezes an Expression object
 * 2. **Decoder mode**: Parses an expression string into an Expression object
 * 3. **Encoder mode**: Formats an Expression object back to string representation
 *
 * @remarks
 *
 * **Factory Mode** - Validates expression integrity and creates immutable copy:
 *
 * - Validates expression structure (object with pipe and path arrays)
 * - Validates optional name property is a string
 * - Validates all pipe and path elements are strings
 * - Returns deeply frozen immutable Expression
 *
 * **Decoder Mode** - Parses expression strings using Peggy grammar:
 *
 * - Parses syntax: `[name=][transform:]*path`
 * - Supports dot notation (`user.name`) and bracket notation (`['@id']`)
 * - Extracts optional name prefix, transform pipeline, and property path
 * - Throws on invalid syntax
 *
 * **Encoder Mode** - Formats Expression objects to strings:
 *
 * - Encodes name prefix if present
 * - Encodes transform pipeline with colons
 * - Encodes path using dot notation for identifiers, bracket notation otherwise
 * - Escapes special characters in bracket notation
 *
 * @param expression - Expression object to validate/freeze or string to parse
 * @returns Immutable Expression object or encoded string
 * @throws {TypeError} If expression structure is invalid (factory mode)
 * @throws {SyntaxError} If expression string cannot be parsed (decoder mode)
 *
 * @see {@link Expression} type definition
 * @see {@link Transform} for available transform metadata
 */
export function Expression(expression: Expression): Expression;
export function Expression(expression: string): Expression;
export function Expression(expression: Expression, opts: { format: "string" }): string;

export function Expression(expression: Expression | string, opts?: { format: "string" }): Expression | string {

	return typeof expression === "string" ? decode(expression)
		: typeof expression === "object" && opts !== undefined ? encode(expression, opts)
			: typeof expression === "object" ? create(expression)
				: error(new TypeError("invalid Expression() arguments"));


	function create(expression: Expression): Expression {

		if ( typeof expression !== "object" || expression === null ) {
			return error(new TypeError("expression must be an object"));
		}

		if ( !Array.isArray(expression.pipe) ) {
			return error(new TypeError("expression.pipe must be an array"));
		}

		if ( !Array.isArray(expression.path) ) {
			return error(new TypeError("expression.path must be an array"));
		}

		// noinspection SuspiciousTypeOfGuard
		if ( expression.name !== undefined && typeof expression.name !== "string" ) {
			return error(new TypeError("expression.name must be a string"));
		}

		// noinspection SuspiciousTypeOfGuard
		if ( expression.pipe.some(item => typeof item !== "string") ) {
			return error(new TypeError("expression.pipe must contain only strings"));
		}

		// noinspection SuspiciousTypeOfGuard
		if ( expression.path.some(item => typeof item !== "string") ) {
			return error(new TypeError("expression.path must contain only strings"));
		}

		return immutable(expression);

	}

	function decode(expression: string): Expression {
		try {

			return parser.parse(expression);

		} catch ( e ) {

			return error(new SyntaxError(`invalid path <${expression}>`));

		}
	}

	function encode(expression: Expression, opts: { format: "string" }): string {

		const name = expression.name !== undefined ? `${expression.name}=` : "";
		const pipe = expression.pipe.map(t => `${t}:`).join("");
		const path = encodePath(expression.path);

		return `${name}${pipe}${path}`;


		function isIdentifier(str: string): boolean {
			return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
		}

		function encodePath(path: readonly string[]): string {
			return path
				.map((step, index) => encodeStep(step, index))
				.join("");
		}

		function encodeStep(step: string, index: number): string {
			return !isIdentifier(step) ? `['${escape(step)}']`
				: index === 0 ? step
					: `.${step}`;
		}

		function escape(str: string): string {
			return str
				.replace(/\\/g, "\\\\")
				.replace(/'/g, "\\'");
		}

	}

}
