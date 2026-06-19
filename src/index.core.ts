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
 * Runtime validators for the primitive types declared in the `index` module, re-exported through it.
 *
 * @module
 */

import { isBoolean, isNumber, isString, isUnion } from "@metreeca/core";
import { isIRI } from "@metreeca/core/resource";
import type { Literal, Reference } from "./index.js";


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
