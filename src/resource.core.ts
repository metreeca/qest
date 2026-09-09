/*
 * Copyright © 2025-2026 Metreeca srl
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
 * Type guards for resource state types.
 *
 * Runtime validators for the state types declared in the `resource` module, re-exported through it.
 *
 * @module
 */

import {
	type Identifier,
	isArray,
	isBoolean,
	isIdentifier,
	isNumber,
	isObject,
	isString,
	isUnion
} from "@metreeca/core";
import { isTag } from "@metreeca/core/language";
import { isIRI } from "@metreeca/core/resource";
import type { Dictionary, Literal, Reference, Resource, Value, Values } from "./resource.js";


/**
 * Checks if a value is a {@link Resource}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose keys are all {@link Identifier}s and whose values
 * are all valid {@link Values} sets; false otherwise
 */
export function isResource(value: unknown): value is Resource {
	return isObject(value, (v, k) => isIdentifier(k) && isValues(v));
}


/**
 * Checks if a value is a {@link Values} set.
 *
 * Accepts the absent marker `undefined`, a single {@link Value} scalar, a {@link Dictionary}, or an
 * array of {@link Value} elements.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a valid Values set; false otherwise
 */
export function isValues(value: unknown): value is Values {
	return value === undefined || isUnion(value, [
		isValue,
		isDictionary,
		v => isArray(v, isValue)
	]);
}

/**
 * Checks if a value is a {@link Value}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a {@link Literal}, a {@link Reference}, or a nested {@link Resource}; false otherwise
 */
export function isValue(value: unknown): value is Value {
	return isUnion(value, [
		isLiteral,
		isReference,
		isResource
	]);
}


/**
 * Checks if a value is a {@link Dictionary}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object with language tag keys mapping uniformly to strings or uniformly to
 * string arrays; false otherwise
 */
export function isDictionary(value: unknown): value is Dictionary {
	return isObject(value, (v, k) => isTag(k) && isString(v))
		|| isObject(value, (v, k) => isTag(k) && isArray(v, isString));
}


/**
 * Checks if a value is a {@link Literal}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a `boolean`, a `number`, or a `string`; false otherwise
 */
export function isLiteral(value: unknown): value is Literal {
	return isBoolean(value)
		|| isNumber(value)
		|| isString(value);
}

/**
 * Checks if a value is a {@link Reference}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is an absolute IRI; false otherwise
 */
export function isReference(value: unknown): value is Reference {
	return isIRI(value, "absolute");
}
