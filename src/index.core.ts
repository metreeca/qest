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

import { isIdentifier, isObject } from "@metreeca/core";
import type { Indexed } from "./index.js";


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

