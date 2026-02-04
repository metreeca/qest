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
 * Shared types and guards.
 *
 * @module index
 *
 * @groupDescription Guards
 * Type guards for runtime validation of shared types.
 */

import { Identifier, isAny, isIdentifier, isObject, isOptional, key } from "@metreeca/core";
import { type IRI, isIRI } from "@metreeca/core/resource";


/**
 * Key-indexed container for property values.
 *
 * Maps arbitrary {@link Identifier} keys to values of type `T`, supporting index-based organisation of property values.
 * Useful for representing union-typed properties or dynamically-keyed structures.
 *
 * @typeParam T The type of values in the container
 *
 * @remarks
 *
 * - Corresponds to JSON-LD's `@index` container semantics; requires `@context` to distinguish from nested resources
 * - Keys are limited to valid JavaScript identifiers
 * - Allowed only as top-level property values; no nesting
 *
 * @see {@link https://www.w3.org/TR/json-ld11/#data-indexing JSON-LD 1.1 - Data Indexing}
 */
export type Indexed<T> =
	| { readonly [key: Identifier]: T }

/**
 * Shared configuration options for codec operations.
 *
 * Controls IRI rewriting behaviour during encoding and decoding. When a base IRI is provided, absolute IRIs are
 * converted to root-relative form during encoding and resolved back to absolute form during decoding.
 */
export type CodecOpts = {

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
 * Checks if a value is an {@link Indexed}.
 *
 * @group Guards
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
 * Checks if a value is a valid {@link CodecOpts} object.
 *
 * Validates that `value` is an object with an optional `base` property containing a hierarchical IRI. Additional
 * properties are permitted.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if `value` conforms to {@link CodecOpts}; false otherwise
 */
export function isCodecOpts(value: unknown): value is CodecOpts {
	return isObject(value, {
		base: v => isOptional(v, v => isIRI(v, "hierarchical")),
		[key]: isAny
	});
}
