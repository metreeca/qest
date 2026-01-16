/*
 * Copyright © 2026 Metreeca srl
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
 * Shared types and guards.
 *
 * @module index
 */

import { isAny, isObject, isOptional, key } from "@metreeca/core";
import { type IRI, isIRI } from "@metreeca/core/resource";


/**
 * Shared configuration options for codec operations.
 *
 * Controls IRI rewriting behaviour during encoding and decoding. When a base IRI is provided, absolute IRIs are
 * converted to root-relative form during encoding and resolved back to absolute form during decoding.
 */
export interface CodecOpts {

	/**
	 * Base IRI for IRI resolution (must be absolute and hierarchical).
	 *
	 * - **Encoding**: Converts absolute IRIs to internal (root-relative) form
	 * - **Decoding**: Resolves internal IRIs to absolute form
	 *
	 * If omitted, no IRI rewriting is performed.
	 */
	readonly base?: IRI

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is a valid {@link CodecOpts} object.
 *
 * Validates that `value` is an object with an optional `base` property containing a hierarchical IRI. Additional
 * properties are permitted.
 *
 * @param value The value to check
 *
 * @returns true if `value` conforms to {@link CodecOpts}; false otherwise
 */
export function isCodecOpts(value: unknown): value is CodecOpts {
	return isObject(value, {
		base: v => isOptional(v, v => isIRI(v, "hierarchical")),
		[key]: isAny
	});
}
