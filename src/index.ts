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
 * Shared primitive types and codec options.
 *
 * Defines the primitive building blocks used throughout the resource and template modules, along with the
 * encoder / decoder option bags that configure IRI rewriting and output formatting for the codec functions.
 *
 * **Primitive types**
 *
 * - {@link Reference} — absolute IRI identifying a linked resource
 * - {@link Literal} — JSON scalar primitives (`boolean`, `number`, `string`)
 *
 * **Codec configuration**
 *
 * - {@link defaultBase} — default base IRI (`app:/`) used by encode / decode operations
 * - {@link EncoderOpts} — options for encoding operations (base IRI, indentation)
 * - {@link DecoderOpts} — options for decoding operations (base IRI, lenient mode)
 *
 * **Type guards**
 *
 * - {@link isLiteral} — checks if a value is a {@link Literal}
 * - {@link isReference} — checks if a value is a {@link Reference}
 *
 * @module index
 */

import { asIRI, type IRI } from "@metreeca/core/resource";

export * from "./index.core.js";


/**
 * Default base IRI (`app:/`) for codec operations.
 *
 * The `app:` URI scheme is hierarchical and supports relative IRI resolution.
 *
 * @see {@link https://www.w3.org/TR/2013/WD-app-uri-20130516/ W3C app: URI Scheme}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc3986 RFC 3986 - URI Generic Syntax}
 */
export const defaultBase: IRI = asIRI("app:/");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Literal value.
 *
 * Convenience alias grouping `boolean`, `number`, and `string` JSON primitives used as property values in
 * resources. Corresponds to JSON-LD's primitive value types.
 */
export type Literal =
	| boolean
	| number
	| string

/**
 * Resource reference.
 *
 * An absolute {@link IRI} identifying a linked resource without embedding its state. Contrast with
 * {@link resource!Resource}, which includes the linked resource's properties inline.
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only. Branding was considered but not adopted due to
 * > interoperability issues with tools relying on static code analysis.
 *
 * @see {@link https://www.w3.org/TR/json-ld11/#node-identifiers JSON-LD 1.1 - Node Identifiers}
 */
export type Reference =
	| IRI


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Configuration options for encoding operations.
 */
export type EncoderOpts = {

	/**
	 * Base IRI for IRI internalisation (must be absolute and hierarchical).
	 *
	 * Converts absolute IRIs to internal (root-relative) form.
	 *
	 * If omitted, no IRI rewriting is performed.
	 */
	readonly base?: IRI

	/**
	 * Indentation level for pretty-printing encoded output.
	 *
	 * - When `true`, uses default indentation
	 * - When a positive number, indents with that many spaces
	 * - When `false` or a number less than or equal to `0`, disables indentation
	 *
	 * If omitted, output is not indented.
	 */
	readonly indent?: boolean | number

}

/**
 * Configuration options for decoding operations.
 */
export type DecoderOpts = {

	/**
	 * Base IRI for IRI resolution (must be absolute and hierarchical).
	 *
	 * Resolves internal IRIs to absolute form.
	 *
	 * If omitted, no IRI rewriting is performed.
	 */
	readonly base?: IRI

	/**
	 * Disables structural validation after decoding.
	 *
	 * Allows the caller to handle validation independently using more advanced or specialised tools, for example
	 * for improved error reporting.
	 *
	 * - When `true`, structural checks are skipped and only syntax errors are reported through exceptions
	 * - When `false`, both syntax and structural errors are reported through exceptions
	 *
	 * If omitted, decoders apply internal structural validators to the input.
	 */
	readonly lenient?: boolean

}
