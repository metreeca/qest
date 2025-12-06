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

import { isArray, isObject, isScalar } from "@metreeca/core";
import { immutable } from "@metreeca/core/nested";
import { error, message } from "@metreeca/core/report";
import { $field, $identifier, $resource, $string, $strings, $union, validate } from "../_validator.js";
import { _Expression } from "./expression.js";
import { type Query } from "./index.js";
import * as queryParser from "./parsers/4-query.js";

/**
 * Validates a {@link Query} object.
 *
 * @param query The query object to validate
 *
 * @returns An immutable validated query object
 *
 * @throws TypeError if the query structure is invalid
 */
export function Query(query: Query): Query;

/**
 * Parses a query string into a {@link Query} object.
 *
 * @param query The query string to parse
 *
 * @returns An immutable parsed query object
 *
 * @throws SyntaxError if the query string is malformed
 */
export function Query(query: string): Query;

/**
 * Parses a form-encoded query string and wraps the specs in a collection property.
 *
 * Form-encoded strings can only express a subset of possible queries (flat specs with filtering, sorting, and
 * pagination). Nested queries or projections cannot be represented in this format.
 *
 * @param query The form-encoded query string to parse
 * @param collection The collection property name to wrap specs in
 *
 * @returns An immutable query object with specs wrapped in `{ collection: [specs] }`
 *
 * @throws SyntaxError If the query string is malformed or contains unsupported constructs
 */
export function Query(query: string, collection: string): Query;

/**
 * Encodes a {@link Query} object into a string representation.
 *
 * @param query The query object to encode
 * @param opts Encoding options
 * @param opts.format Output format:
 *
 *   - `json` — JSON string (`{"?status":"active","@":0}`)
 *   - `base64` — Base64-encoded JSON (`eyI/c3RhdHVzIjoiYWN0aXZlIn0=`)
 *   - `url` — URL-encoded JSON (`%7B%22%3Fstatus%22%3A%22active%22%7D`)
 *   - `form` — Query string (`status=active&@=0`)
 *
 * @returns The encoded query string
 */
export function Query(query: Query, opts: { format: "json" | "base64" | "url" | "form" }): string;

/**
 * Validates, decodes, or encodes {@link Query} objects.
 */
export function Query(
	query: Query | string,
	opts?: string | { format: "json" | "base64" | "url" | "form" }
): Query | string {

	return typeof query === "string" && typeof opts === "string" ? decode(query, opts)
		: typeof query === "string" ? decode(query)
			: typeof query === "object" && typeof opts === "object" ? encode(query, opts)
				: typeof query === "object" ? create(query)
					: error(new TypeError("invalid Query() arguments"));


	function create(query: Query): Query {
		return validate(query, $query);
	}

	function decode(query: string, collection?: string): Query {

		return collection !== undefined ? form(query, collection)
			: isUrl(query) ? decode(decodeURIComponent(query))
				: isJson(query) ? json(query)
					: isBase64(query) ? decode(atob(query))
						: error(new SyntaxError("form format requires collection parameter"));


		function isUrl(value: string): boolean { return /%[0-9A-Fa-f]{2}/.test(value); }

		function isBase64(value: string): boolean {
			return value.length > 0
				&& /^[A-Za-z0-9+/]+=*$/.test(value)
				&& value.length%4 === 0;
		}

		function isJson(value: string): boolean { return value.trimStart().startsWith("{"); }


		function json(value: string): Query {
			return validate(JSON.parse(value) as Query, $specs);
		}

		function form(value: string, collection: string): Query {
			try {

				return immutable({ [collection]: [queryParser.parse(value)] });

			} catch ( e ) {

				return error(new SyntaxError(`invalid query: ${e instanceof Error ? e.message : e}`));

			}
		}

	}

	function encode(query: Query, { format }: { format: "json" | "url" | "base64" | "form" }): string {

		return format === "json" ? json()
			: format === "url" ? url()
				: format === "base64" ? base64()
					: form();


		function json(): string { return JSON.stringify(query); }

		function url(): string { return encodeURIComponent(json()); }

		function base64(): string { return btoa(json()); }

		function form(): string {

			const isNumericString = (value: string): boolean =>
				/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value);

			const encodeValue = (value: unknown): string => {
				return value === null ? ""
					: typeof value === "number" ? String(value)
						: typeof value === "string" && isNumericString(value) ? `'${value}'`
							: typeof value === "string" ? encodeURIComponent(value)
								: String(value);
			};

			const encodeDirection = (value: number): string => {
				return value === 1 ? "increasing"
					: value === -1 ? "decreasing"
						: String(value);
			};

			const encodeEquality = (expr: string, value: unknown): string[] => {
				return Array.isArray(value) && value.length === 0 ? [`${expr}=*`]
					: Array.isArray(value) ? value.map(v => `${expr}=${encodeValue(v)}`)
						: [`${expr}=${encodeValue(value)}`];
			};

			const pairs: string[] = Object.entries(query).flatMap(([key, value]) =>

				key === "@" || key === "#" ? [`${key}=${value}`]
					: key.startsWith("^") ? [`^${key.slice(1)}=${encodeDirection(value as number)}`]
						: key.startsWith("~") ? [`~${key.slice(1)}=${encodeValue(value)}`]
							: key.startsWith("<=") ? [`${key.slice(2)}<=${encodeValue(value)}`]
								: key.startsWith(">=") ? [`${key.slice(2)}>=${encodeValue(value)}`]
									: key.startsWith("?") ? encodeEquality(key.slice(1), value)
										: []
			);

			return pairs.join("&");

		}

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function $query(value: object): string {
	return !isObject(value) ? `invalid object type <${typeof value}>` : Object.entries(value)
		.map(([key, value]) => {
				return $union(key, {
					"property": $identifier,
					"expression": v => $expression(v, true)
				}) || $field(key, $values(value));
			}
		)
		.filter(Boolean)
		.join("\n");
}

function $specs(value: object): string {
	return !isObject(value) ? `invalid object type <${typeof value}>` : Object.entries(value)
		.map(([key, value]) => {

			if ( key === "@" ) {
				return $prefix("@", $number(value));
			} else if ( key === "#" ) {
				return $prefix("#", $number(value));
			} else if ( key.startsWith("<=") ) {
				return $prefix("<=", $expression(key.slice(2))) || $prefix(key, $literal(value));
			} else if ( key.startsWith(">=") ) {
				return $prefix(">=", $expression(key.slice(2))) || $prefix(key, $literal(value));
			} else if ( key.startsWith("<") ) {
				return $prefix("<", $expression(key.slice(1))) || $prefix(key, $literal(value));
			} else if ( key.startsWith(">") ) {
				return $prefix(">", $expression(key.slice(1))) || $prefix(key, $literal(value));
			} else if ( key.startsWith("~") ) {
				return $prefix("~", $expression(key.slice(1))) || $prefix(key, $like(value));
			} else if ( key.startsWith("?") ) {
				return $prefix("?", $expression(key.slice(1))) || $prefix(key, $options(value));
			} else if ( key.startsWith("!") ) {
				return $prefix("!", $expression(key.slice(1))) || $prefix(key, $options(value));
			} else if ( key.startsWith("$") ) {
				return $prefix("$", $expression(key.slice(1))) || $prefix(key, $options(value));
			} else if ( key.startsWith("^") ) {
				return $prefix("^", $expression(key.slice(1))) || $prefix(key, $order(value));
			} else {
				return `invalid specs key <${key}>`;
			}

		})
		.filter(Boolean)
		.join("\n");
}

function $expression(value: string, named: boolean = false): string {
	try {

		const expression = _Expression(value);

		return named && expression.name === undefined ? "!!!" : "";

	} catch ( e ) {
		return `invalid expression <${value}>: ${(message(e))}`;
	}
}

function $values(value: unknown): string {
	return isScalar(value) ? ""
		: isArray(value) ? $array(value)
			: isObject(value) ? $union(value, {
					"string": $string,
					"strings": $strings,
					"resource": $resource
				})
				: `invalid value type <${typeof value}>`;
}

function $array(value: readonly unknown[]): string {
	return value
		.map(item => isObject(item) ? $union(item, {
			"query": $query,
			"specs": $specs
		}) : `invalid array element type <${typeof item}>`)
		.filter(Boolean)
		.join(", ");
}

function $options(value: unknown): string {
	return value === null || isScalar(value) ? ""
		: isArray(value) ? $optionsArray(value)
			: isObject(value) ? $union(value, {
					"string": $string,
					"strings": $strings,
					"resource": $resource
				})
				: `invalid options type <${typeof value}>`;
}

function $optionsArray(value: readonly unknown[]): string {
	return value
		.map(item => item === null || isScalar(item) ? ""
			: isObject(item) ? $resource(item)
				: `invalid options item type <${typeof item}>`)
		.filter(Boolean)
		.join(", ") || "";
}

function $literal(value: unknown): string {
	return isScalar(value) ? ""
		: `invalid literal type <${typeof value}>`;
}

function $like(value: unknown): string {
	return typeof value === "string" ? ""
		: `invalid like type <${typeof value}>`;
}

function $order(value: unknown): string {
	return typeof value === "number" ? ""
		: value === "asc" || value === "desc" || value === "ascending" || value === "descending" ? ""
			: `invalid order value <${value}>`;
}

function $number(value: unknown): string {
	return typeof value === "number" ? ""
		: `invalid number type <${typeof value}>`;
}

function $prefix(prefix: string, error: string): string {
	return error ? `${prefix}: ${error}` : "";
}
