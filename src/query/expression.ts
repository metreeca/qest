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

import { isArray, isObject, isString } from "@metreeca/core/json";
import { immutable } from "../../../Core/src/common/nested.js";
import { error } from "../../../Core/src/common/report.js";
import { $identifier, IdentifierPattern, validate } from "../_validator.js";
import { Expression } from "./index.js";
import * as expressionParser from "./parsers/3-expression.js";

/**
 * Validates an {@link _Expression} object.
 *
 * @param expression The expression object to validate
 *
 * @returns An immutable validated expression object
 *
 * @throws TypeError If the expression structure is invalid
 */
export function _Expression(expression: Expression): Expression;

/**
 * Parses an expression string into an {@link _Expression} object.
 *
 * @remarks
 *
 * Parses syntax: `[name=][transform:]*path`
 *
 * - Supports dot notation (`user.name`) and bracket notation (`['@id']`)
 * - Extracts optional name prefix, transform pipeline, and property path
 *
 * @param expression The expression string to parse
 *
 * @returns An immutable parsed expression object
 *
 * @throws SyntaxError If the expression string is malformed
 */
export function _Expression(expression: string): Expression;

/**
 * Encodes an {@link _Expression} object into a string representation.
 *
 * @remarks
 *
 * - Encodes name prefix if present
 * - Encodes transform pipeline with colons
 * - Encodes path using dot notation for identifiers, bracket notation otherwise
 * - Escapes special characters in bracket notation
 *
 * @param expression The expression object to encode
 * @param opts Encoding options
 * @param opts.format Output format (currently only `"string"` is supported)
 *
 * @returns The encoded expression string
 */
export function _Expression(expression: Expression, opts: { format: "string" }): string;

/**
 * Validates, decodes, or encodes {@link _Expression} objects.
 */
export function _Expression(expression: Expression | string, opts?: { format: "string" }): Expression | string {

	return typeof expression === "string" ? decode(expression)
		: typeof expression === "object" && opts !== undefined ? encode(expression, opts)
			: typeof expression === "object" ? create(expression)
				: error(new TypeError("invalid Expression() arguments"));


	function create(expression: Expression): Expression {
		return validate(expression, $expression);
	}

	function decode(expression: string): Expression {
		try {

			return immutable(expressionParser.parse(expression));

		} catch ( e ) {

			return error(new SyntaxError(`invalid expression: ${e instanceof Error ? e.message : e}`));

		}
	}

	function encode(expression: Expression, _: { format: "string" }): string {

		const name = expression.name !== undefined ? `${expression.name}=` : "";
		const pipe = expression.pipe.map(t => `${t}:`).join("");
		const path = encodePath(expression.path);

		return `${name}${pipe}${path}`;


		function encodePath(path: readonly string[]): string {
			return path
				.map((step, index) => encodeStep(step, index))
				.join("");
		}

		function encodeStep(step: string, index: number): string {
			return !IdentifierPattern.test(step) ? `['${escape(step)}']`
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function $expression(value: Expression): string {
	return !isObject(value) ? `invalid object type <${typeof value}>`
		: !isArray(value.pipe) ? `pipe: must be an array`
			: !isArray(value.path) ? `path: must be an array`
				: value.name !== undefined && $identifier(value.name) ? `name: ${$identifier(value.name)}`
					: value.pipe.some(item => $identifier(item)) ? `pipe: ${value.pipe.map($identifier).find(Boolean)}`
						: value.path.some(item => !isString(item)) ? `path: must contain only strings`
							: "";
}
