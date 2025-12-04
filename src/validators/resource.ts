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

import { isArray, isBoolean, isNumber, isObject, isScalar, isString } from "@metreeca/core";
import { $field, $property, $string, $strings, $union } from "./index.js";


export function $resource(value: object): string {
	return !isObject(value) ? `invalid object type <${typeof value}>` : Object.entries(value)
		.map(([key, value]) =>
			$property(key) || $field(key, $values(value))
		)
		.filter(Boolean)
		.join("\n");
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
		.map($value)
		.filter(Boolean)
		.join(", ");
}

export function $value(value: unknown): string {
	return isBoolean(value) || isNumber(value) || isString(value) ? ""
		: isObject(value) ? $resource(value)
			: `invalid value type <${typeof value}>`;
}
