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

import { immutable, isString } from "@metreeca/core";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
 * Property path.
 *
 * Paths are dot-separated sequences of property names for accessing nested resource properties.
 * Each step can contain any character except unescaped dots (`.`), colons (`:`), and
 * backslashes (`\`). Use backslash to escape special characters.
 *
 * An empty path refers to the root resource itself.
 *
 * Valid path examples:
 *
 * - `""` - Root resource
 * - `"name"` - Single property
 * - `"address.city"` - Nested property access
 * - `"author.name"` - Multiple levels of nesting
 * - `"property\\.name"` - Escaped dot in property name
 * - `"my\\ property"` - Escaped space in property name
 *
 * @remarks
 *
 * This is a branded type that prevents accidental assignment of plain strings. Use the
 * {@link path} factory function or {@link isPath} type guard to create validated instances.
 *
 * @see {@link isPath}
 * @see {@link path}
 * @see {@link Property}
 */
export type Path = string & { readonly __brand: unique symbol }

/**
 * Query expression.
 *
 * Represents a computed value based on property path values, optionally transformed through
 * one or more named transformations. Expressions are used in query operations for filtering,
 * sorting, and data selection.
 *
 * Expression format: `[transform:]*[path]`
 *
 * - Zero or more transforms (word characters followed by `:`)
 * - Optional property path
 * - Empty expression refers to the root resource itself
 *
 * Valid expression examples:
 *
 * - `""` - Root resource
 * - `"name"` - Property value
 * - `"address.city"` - Nested property value
 * - `"upper:name"` - Transformed property value
 * - `"trim:upper:title"` - Multiple transforms applied
 *
 * @remarks
 *
 * This is a branded type that prevents accidental assignment of plain strings. Use the
 * {@link expression} factory function or {@link isExpression} type guard to create validated instances.
 *
 * @see {@link isExpression}
 * @see {@link expression}
 * @see {@link Query}
 * @see {@link Path}
 */
export type Expression = string & { readonly __brand: unique symbol }


/**
 * Value transformation operations for computed expressions.
 *
 * Defines transformation operations that can be applied to values in expressions.
 *
 * @see {@link Expression}
 */
export enum Transform { // !!! complete

	/** Count of values in collection */
	count = "count",

	/** Minimum value in collection */
	min = "min",

	/** Maximum value in collection */
	max = "max",

	/** Sum of values in collection */
	sum = "sum",

	/** Average of values in collection */
	avg = "avg",


	/** Absolute value */
	abs = "abs",

	/** Round to nearest integer */
	round = "round",

	/** Extract year component from date/time */
	year = "year"

	// !!! {TBC}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is a valid property path.
 *
 * Property paths are dot-separated sequences of property steps. Each step can contain any
 * character except unescaped dots, colons, and backslashes. Characters can be escaped with
 * backslash.
 *
 * Valid paths must:
 * - Be non-empty strings
 * - Contain valid step patterns: `\.?(?:[^.:\\]+|\\.)+`
 * - NOT start with `@` (reserved for JSON-LD keywords)
 *
 * @param value - Value to validate as a property path
 *
 * @returns `true` if the value is a valid property path
 *
 * @remarks
 *
 * This function serves as a type guard, narrowing the type from `string` to {@link Path}
 * when used in conditional checks.
 *
 * The validation pattern allows:
 * - Empty path: `""` (refers to root resource)
 * - Simple paths: `"name"`, `"email"`
 * - Nested paths: `"address.city"`, `"author.name"`
 * - Leading dot: `".name"`, `".address.city"` (dot treated as separator, not part of property name)
 * - Escaped special chars: `"property\\.with\\.dots"`, `"name\\:with\\:colons"`
 *
 * Special characters that must be escaped: backslash (escape char), dot (separator).
 * Note: Colons are valid in paths without escaping, but should be escaped when
 * constructing paths programmatically to ensure interoperability with {@link Expression}
 * (where colons denote transforms).
 *
 * **Important**: Leading dots in paths are always interpreted as separators. If a property name
 * starts with a dot (e.g., `".hidden"`), it must be escaped when used in a path (e.g., `"\\.hidden"`).
 * When decoding paths with leading dots, the leading separator is stripped: `".name"` decodes to
 * `[property("name")]`, not `[property(".name")]`.
 *
 * @see {@link Path}
 */
export function isPath(value: unknown): value is Path {

	return isString(value) && (
		value.length === 0 // Empty string is valid (refers to root resource)
		|| (!value.startsWith("@") && pattern.path.test(value)) // JSON-LD keywords not allowed
	);
}

/**
 * Creates a validated property path from a string.
 *
 * @param value - String to convert to a property path
 *
 * @returns The validated property path
 *
 * @throws RangeError If the value is not a valid property path
 */
export function path(value: string): Path {

	if ( !isPath(value) ) {
		throw new RangeError(`invalid property path <${value}>`);
	}

	return value;
}


/**
 * Checks if a value is a valid query expression.
 *
 * Valid expressions must match the format: `[transform:]*[path]`
 * - Zero or more transforms (word characters followed by `:`)
 * - Optional property path (validated per {@link isPath})
 * - Empty string is valid (refers to root resource)
 *
 * @param value - Value to validate as a query expression
 *
 * @returns `true` if the value is a valid query expression
 *
 * @remarks
 *
 * This function serves as a type guard, narrowing the type from `string` to {@link Expression}
 * when used in conditional checks.
 *
 * @see {@link Expression}
 * @see {@link Path}
 */
export function isExpression(value: unknown): value is Expression {

	const match = isString(value) ? value.match(pattern.expression) : null;
	const [, transforms = "", path = ""] = match ?? [];

	return match !== null
		&& (transforms.match(pattern.transform) ?? []).every(t => Object.values(Transform).includes(t as Transform))
		&& isPath(path);
}

/**
 * Creates a validated query expression from a string.
 *
 * @param value - String to convert to a query expression
 *
 * @returns The validated query expression
 *
 * @throws RangeError If the value is not a valid query expression
 */
export function expression(value: string): Expression {

	if ( !isExpression(value) ) {
		throw new RangeError(`invalid query expression <${value}>`);
	}

	return value;
}
