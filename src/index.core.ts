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
 * Type guards for shared types.
 *
 * @module
 */

import { isBoolean, isIdentifier, isNumber, isObject, isString, isUnion } from "@metreeca/core";
import { isIRI } from "@metreeca/core/resource";
import type { Indexed, Literal, Reference } from "./index.js";


/**
 * Checks if a value is an {@link Indexed}.
 *
 * @typeParam T The expected type of values in the container
 *
 * @param value The value to check
 * @param is Type guard for validating container values
 *
 * @returns True if the value is a plain object with identifier keys and values satisfying the type guard
 */
export function isIndexed<T>(value: unknown, is: (value: unknown) => value is T): value is Indexed<T> {
	return isObject(value, (v, k) => isIdentifier(k) && is(v));
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
 * Checks if a value is a {@link Literal}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a boolean, finite number, or string
 */
export function isLiteral(value: unknown): value is Literal {
	return isUnion(value, [isBoolean, isNumber, isString]);
}
