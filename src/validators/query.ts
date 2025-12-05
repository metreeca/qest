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
import { message } from "@metreeca/core/report";
import { Expression } from "../query.js";
import { $field, $identifier, $string, $strings, $union } from "./index.js";
import { $resource } from "./resource.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function $query(value: object): string {
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

export function $specs(value: object): string {
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


export function $expression(value: string, named: boolean = false): string {
	try {

		const expression = Expression(value);

		return named && expression.name === undefined ? "!!!" : "";

	} catch ( e ) {
		return `invalid expression <${value}>: ${(message(e))}`;
	}
}


export function $values(value: unknown): string {
	return isScalar(value) ? ""
		: isArray(value) ? $array(value)
			: isObject(value) ? $union(value, {
					"string": $string,
					"strings": $strings,
					"resource": $resource
				})
				: `invalid value type <${typeof value}>`;
}

export function $array(value: readonly unknown[]): string {
	return value
		.map(item => isObject(item) ? $union(item, {
			"query": $query,
			"specs": $specs
		}) : `invalid array element type <${typeof item}>`)
		.filter(Boolean)
		.join(", ");
}

export function $options(value: unknown): string {
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

export function $literal(value: unknown): string {
	return isScalar(value) ? ""
		: `invalid literal type <${typeof value}>`;
}

export function $like(value: unknown): string {
	return typeof value === "string" ? ""
		: `invalid like type <${typeof value}>`;
}

export function $order(value: unknown): string {
	return typeof value === "number" ? ""
		: value === "asc" || value === "desc" || value === "ascending" || value === "descending" ? ""
			: `invalid order value <${value}>`;
}

export function $number(value: unknown): string {
	return typeof value === "number" ? ""
		: `invalid number type <${typeof value}>`;
}

export function $prefix(prefix: string, error: string): string {
	return error ? `${prefix}: ${error}` : "";
}
