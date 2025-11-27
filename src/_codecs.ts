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

// /**
//  * Decodes a property path into its component property steps.
//  *
//  * @param path - The path to decode
//  * @returns Array of property names representing each step in the path
//  *
//  * @remarks
//  *
//  * Splits the path on unescaped dots and unescapes special characters in each step:
//  * - Empty path returns empty array
//  * - Leading dots are stripped before parsing (treated as separators, not part of property names)
//  * - Backslash escapes are removed
//  *
//  * **Important**: A leading dot is always treated as a separator. To include a property starting
//  * with a dot, escape it: `"\\.hidden"` decodes to `[property(".hidden")]`, but `".hidden"` decodes
//  * to `[property("hidden")]`.
//  *
//  * @example
//  *
//  * ```typescript
//  * toPath(path("address.city"))          // [property("address"), property("city")]
//  * toPath(path("property\\.name"))       // [property("property.name")]
//  * toPath(path(".name"))                 // [property("name")] - leading dot stripped
//  * toPath(path("\\.hidden"))             // [property(".hidden")] - dot escaped
//  * toPath(path(""))                      // []
//  * ```
//  *
//  * @see {@link Path}
//  *
//  * @group Codecs
//  */
// export function toPath(path: Path): readonly Property[];
//
// /**
//  * Encodes an array of properties into a validated property path.
//  *
//  * @param properties - Array of property names to encode into a path
//  * @returns The validated property path with special characters escaped
//  *
//  * @remarks
//  *
//  * Joins properties with dots and escapes special characters (backslashes, dots, colons).
//  *
//  * @example
//  *
//  * ```typescript
//  * toPath([property("address"), property("city")])   // path("address.city")
//  * toPath([property("my.property")])                 // path("my\\.property")
//  * toPath([])                                        // path("")
//  * ```
//  *
//  * @see {@link Path}
//  *
//  * @group Codecs
//  */
// export function toPath(properties: readonly Property[]): Path;
//
// export function toPath(value: Path | readonly Property[]): unknown {
//
// 	if ( isString(value) ) {
//
// 		return (value.startsWith(".") ? value.slice(1) : value) // Handle optional leading dot
// 				.match(pattern.step) // Match each step
// 				?.map(step => property(step.replace(/\\(.)/g, "$1"))) // Remove escapes
// 			?? [];
//
// 	} else {
//
// 		const path = value
// 			.map(property => property
// 				.replace(/\\/g, "\\\\")   // Escape backslashes first
// 				.replace(/\./g, "\\.")    // Escape dots
// 				.replace(/:/g, "\\:")     // Escape colons (for expression interoperability)
// 			)
// 			.join("."); // Empty array → empty string, which is valid
//
// 		if ( !isPath(path) ) {
// 			throw new RangeError(`invalid property path <${path}>`);
// 		}
//
// 		return path;
//
// 	}
//
// }
//
// /**
//  * Decodes a query expression into its component transforms and properties.
//  *
//  * @param expression - The expression to decode
//  * @returns Tuple of `[transforms, properties]`
//  *
//  * @remarks
//  *
//  * Splits the expression into transforms (prefixed with `:`) and property path:
//  * - Empty expression returns `[[], []]`
//  * - Transforms validated against {@link Transform} enum
//  * - Path decoded into property steps
//  *
//  * @example
//  *
//  * ```typescript
//  * toExpression(expression("count:address.city"))  // [[Transform.count], [property("address"), property("city")]]
//  * toExpression(expression("min:max:price"))       // [[Transform.min, Transform.max], [property("price")]]
//  * toExpression(expression("count:"))              // [[Transform.count], []]
//  * toExpression(expression(""))                    // [[], []]
//  * ```
//  *
//  * @see {@link Expression}
//  * @see {@link Transform}
//  *
//  * @group Codecs
//  */
// export function toExpression(expression: Expression): readonly [readonly Transform[], readonly Property[]];
//
// /**
//  * Encodes transforms and properties into a validated query expression.
//  *
//  * @param parts - Tuple of transforms array and properties array
//  * @returns The validated query expression with transforms prefixed to the path
//  * @throws RangeError If the resulting expression is not valid
//  *
//  * @example
//  *
//  * ```typescript
//  * toExpression([[Transform.count, Transform.sum], [property("price")]])  // expression("count:sum:price")
//  * toExpression([[], [property("name")]])                                 // expression("name")
//  * toExpression([[], []])                                                 // expression("")
//  * ```
//  *
//  * @see {@link Transform}
//  *
//  * @group Codecs
//  * */
// export function toExpression(parts: readonly [readonly Transform[], readonly Property[]]): Expression;
//
// export function toExpression(value: Expression | readonly [readonly Transform[], readonly Property[]]): unknown {
//
// 	if ( isString(value) ) {
//
// 		const [transforms = ""] = value.match(pattern.transforms) ?? [];
//
// 		return [
// 			(transforms.match(pattern.transform) ?? []).map(t => t as Transform),
// 			toPath(path(value.slice(transforms.length)))
// 		];
//
// 	} else {
//
// 		const expression = value[0].map(t => `${t}:`).join("")+toPath(value[1]);
//
// 		if ( !isExpression(expression) ) {
// 			throw new RangeError(`invalid query expression <${expression}>`);
// 		}
//
// 		return expression;
//
// 	}
//
// }
