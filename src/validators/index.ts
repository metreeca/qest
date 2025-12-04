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

import { isArray, isObject, isString } from "@metreeca/core";
import { isTag } from "@metreeca/core/network";


export function $field(key: string, error: string): string {
	return error ? `${key}: ${error}` : "";
}

export function $property(value: string): string {
	return !isString(value) ? `invalid property name type <${typeof value}>`
		: !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value) ? `invalid property name <${value}>`
			: "";
}


export function $string(value: object): string {
	return !isObject(value) ? `invalid object type <${typeof value}>` : Object.entries(value)
		.map(([key, value]) =>
			!isTag(key) ? `invalid tag <${key}>`
				: !isString(value) ? `${key}: invalid string type <${typeof value}>`
					: ""
		)
		.filter(Boolean)
		.join("\n");
}

export function $strings(value: object): string {
	return !isObject(value) ? `invalid object type <${typeof value}>` : Object.entries(value)
		.map(([key, value]) =>
			!isTag(key) ? `invalid tag <${key}>`
				: !isArray(value, isString) ? `${key}: invalid string array type`
					: ""
		)
		.filter(Boolean)
		.join("\n");
}


export function $union(value: unknown, variants: Record<string, (value: any) => string>) {

	const results = Object.entries(variants).map(([name, validator]) => [
		name,
		validator(value)
	]);

	if ( results.every(([, error]) => error) ) { // all variants failed, return all errors

		return results
			.map(([name, error]) => `| ${name}: ${error}`)
			.join("\n");

	} else { // at least one variant succeeded, the union succeeds

		return "";

	}
}
