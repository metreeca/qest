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

import { isIdentifier } from "@metreeca/core";
import { error } from "@metreeca/core/error";
import { isArray, isBoolean, isNumber, isObject, isString } from "@metreeca/core/json";
import { isTag } from "@metreeca/core/language";
import { isIRI } from "@metreeca/core/resource";
import type { Indexed, Literal, Local, Locals, Patch, Reference, Resource, Value, Values } from "./state.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Type guard for {@link Resource} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid resource state
 */
export function isResource(value: unknown): value is Resource {
	return isObject(value, ([k, v]) => isIdentifier(k) && (isIndexed(v) || isValues(v)));
}

/**
 * Type guard for {@link Patch} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid patch
 */
export function isPatch(value: unknown): value is Patch {
	return isObject(value, ([k, v]) => isIdentifier(k) && (v === null || isIndexed(v) || isValues(v)));
}

/**
 * Type guard for {@link Values} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid value set
 */
export function isValues(value: unknown): value is Values {
	return isValue(value)
		|| isLocal(value)
		|| isLocals(value)
		|| isArray(value, isValue);
}

/**
 * Type guard for {@link Value} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid model value
 */
export function isValue(value: unknown): value is Value {
	return isLiteral(value)
		|| isReference(value)
		|| isResource(value);
}

/**
 * Type guard for {@link Literal} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a boolean, number, or string
 */
export function isLiteral(value: unknown): value is Literal {
	return isBoolean(value)
		|| isNumber(value)
		|| isString(value);
}

/**
 * Type guard for {@link Reference} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid IRI reference
 */
export function isReference(value: unknown): value is Reference {
	return  isIRI(value, "relative");
}

/**
 * Type guard for {@link Local} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid single-valued language map
 */
export function isLocal(value: unknown): value is Local {
	return isObject(value, ([k, v]) => isTag(k) && isString(v));
}

/**
 * Type guard for {@link Locals} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid multi-valued language map
 */
export function isLocals(value: unknown): value is Locals {
	return isObject(value, ([k, v]) => isTag(k) && isArray(v, isString));
}

/**
 * Type guard for {@link Indexed} values.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid indexed container
 */
export function isIndexed(value: unknown): value is Indexed {
	return isObject(value, ([k, v]) => isIdentifier(k) && isValues(v));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates a {@link Resource} value.
 *
 * @param value The value to validate
 *
 * @returns The validated resource
 *
 * @throws {TypeError} If the value is not a valid resource
 */
export function asResource(value: unknown): Resource {
	return !isResource(value) ? error(new TypeError("invalid resource"))
		: value;
}

/**
 * Validates a {@link Patch} value.
 *
 * @param value The value to validate
 *
 * @returns The validated patch
 *
 * @throws {TypeError} If the value is not a valid patch
 */
export function asPatch(value: unknown): Patch {
	return !isPatch(value) ? error(new TypeError("invalid patch"))
		: value;
}

/**
 * Validates a {@link Values} value.
 *
 * @param value The value to validate
 *
 * @returns The validated value set
 *
 * @throws {TypeError} If the value is not a valid value set
 */
export function asValues(value: unknown): Values {
	return !isValues(value) ? error(new TypeError("invalid values"))
		: value;
}

/**
 * Validates a {@link Value} value.
 *
 * @param value The value to validate
 *
 * @returns The validated model value
 *
 * @throws {TypeError} If the value is not a valid model value
 */
export function asValue(value: unknown): Value {
	return !isValue(value) ? error(new TypeError("invalid value"))
		: value;
}

/**
 * Validates a {@link Literal} value.
 *
 * @param value The value to validate
 *
 * @returns The validated literal
 *
 * @throws {TypeError} If the value is not a boolean, number, or string
 */
export function asLiteral(value: unknown): Literal {
	return !isLiteral(value) ? error(new TypeError("invalid literal"))
		: value;
}

/**
 * Validates a {@link Reference} value.
 *
 * @param value The value to validate
 *
 * @returns The validated IRI reference
 *
 * @throws {TypeError} If the value is not a valid IRI reference
 */
export function asReference(value: unknown): Reference {
	return !isReference(value) ? error(new TypeError("invalid reference"))
		: value;
}

/**
 * Validates a {@link Local} value.
 *
 * @param value The value to validate
 *
 * @returns The validated single-valued language map
 *
 * @throws {TypeError} If the value is not a valid single-valued language map
 */
export function asLocal(value: unknown): Local {
	return !isLocal(value) ? error(new TypeError("invalid local"))
		: value;
}

/**
 * Validates a {@link Locals} value.
 *
 * @param value The value to validate
 *
 * @returns The validated multi-valued language map
 *
 * @throws {TypeError} If the value is not a valid multi-valued language map
 */
export function asLocals(value: unknown): Locals {
	return !isLocals(value) ? error(new TypeError("invalid locals"))
		: value;
}

/**
 * Validates an {@link Indexed} value.
 *
 * @param value The value to validate
 *
 * @returns The validated indexed container
 *
 * @throws {TypeError} If the value is not a valid indexed container
 */
export function asIndexed(value: unknown): Indexed {
	return !isIndexed(value) ? error(new TypeError("invalid indexed"))
		: value;
}
