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

import { isArray, isBoolean, isNumber, isObject, isString } from "@metreeca/core";


export function $value(value: unknown): string {
	return isBoolean(value) || isNumber(value) || isString(value) ? ""
		: isObject(value) ? $resource(value)
			: `invalid value type <${typeof value}>`;
}

export function $values(value: unknown): string {
	return isBoolean(value) || isNumber(value) || isString(value) ? ""
		: isArray(value) ? $array(value)
			: isObject(value) ? $resource(value)
				: `invalid value type <${typeof value}>`;
}


export function $array(value: readonly unknown[]): string {
	return value.reduce<string>(
		(error, item) => error || $value(item),
		""
	);
}


export function $resource(value: object): string {
	return !isObject(value) ? `invalid object type <${typeof value}>` : Object.entries(value).reduce<string>(
		(error, [key, value]) => error || $property(key) || $values(value),
		""
	);
}

export function $property(value: string): string {
	return !isString(value) ? `invalid property name type <${typeof value}>`
		: !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value) ? `invalid property name <${value}>`
			: "";
}


export function $union(value: unknown, variants: readonly ((value: unknown) => string)[]) {
	return variants.reduce<string | undefined>(
		(error, validator) => error === "" ? "" : validator(value),
		undefined
	) ?? "";

}
