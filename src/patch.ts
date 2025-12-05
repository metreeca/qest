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

/**
 * Data model for partial resource updates.
 *
 * Defines a patch format for incremental resource modifications where properties can be
 * updated with new values or deleted using `null` (for instance, for HTTP PATCH operations).
 *
 * @module
 */

import { immutable } from "../../Core/src/common/nested.js";
import { Values } from "./index.js";
import { $patch } from "./validators/patch.js";

/**
 * Resource patch for partial updates.
 *
 * Represents a partial resource update where properties can be set to new {@link Values}
 * or deleted using `null`. Empty arrays are treated as `null` (property deletion).
 *
 * @remarks
 *
 * Patches are used for incremental resource updates:
 *
 * - Properties with {@link Values} are updated to the specified values
 * - Properties with `null` are deleted from the resource
 * - Empty value arrays (`readonly Value[]`) are equivalent to `null` and delete the property
 *
 * @see {@link Values}
 * @see {@link Resource}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5789 | RFC 5789 - HTTP PATCH Method}
 */
export type Patch = {

	readonly [K in string]: null | Values

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a validated, immutable {@link Patch} object.
 *
 * Validates the patch structure against {@link Patch} type constraints, recursively checking
 * all nested structures, and returns a deeply frozen copy that cannot be modified.
 *
 * @typeParam T The specific patch type
 *
 * @param patch The patch object to validate and freeze
 *
 * @returns The validated, immutable patch
 *
 * @throws {TypeError} If the patch structure violates {@link Patch} constraints
 */
export function Patch<T extends Patch>(patch: T): T {

	const error = $patch(patch);

	if ( error ) {
		throw new TypeError(error);
	}

	return immutable(patch);

}
