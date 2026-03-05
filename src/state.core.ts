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
 * @module
 */

import {
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
import { isIndexed } from "./index.core.js";
import type { Literal, Local, Locals, Reference, Resource, Value, Values } from "./state.js";


/**
 * Checks if a value is a {@link Resource}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a plain object with identifier keys and {@link Values} or {@link Indexed} values
 */
export function isResource(value: unknown): value is Resource {
	return isObject(value, (v, k) => isIdentifier(k) && isUnion(v, [isValues, v => isIndexed(v, isValues)]));
}


/**
 * Checks if a value is a {@link Values}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a {@link Value}, {@link Local}, {@link Locals}, or array of values
 */
export function isValues(value: unknown): value is Values {
	return isUnion(value, [isValue, isLocal, isLocals, v => isArray(v, isValue)]);
}

/**
 * Checks if a value is a {@link Value}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a {@link Literal}, {@link Reference}, or {@link Resource}
 */
export function isValue(value: unknown): value is Value {
	return isUnion(value, [isLiteral, isReference, isResource]);
}

/**
 * Checks if a value is a {@link Literal}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a boolean, finite number, or string
 */
export function isLiteral(value: unknown): value is Literal {
	return isUnion(value, [isBoolean, isNumber, isString]);
}

/**
 * Checks if a value is a {@link Reference}.
 *
 * @param value The value to check
 *
 * @returns True if the value is an absolute IRI
 */
export function isReference(value: unknown): value is Reference {
	return isIRI(value, "absolute");
}

/**
 * Checks if a value is a {@link Local}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a string or a plain object with language tag keys and string values
 */
export function isLocal(value: unknown): value is Local {
	return isString(value) || isObject(value, (v, k) => isTag(k) && isString(v));
}

/**
 * Checks if a value is a {@link Locals}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a string array or a plain object with language tag keys and string array values
 */
export function isLocals(value: unknown): value is Locals {
	return isArray(value, isString) || isObject(value, (v, k) => isTag(k) && isArray(v, isString));
}
