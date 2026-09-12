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
 * Shared codec options.
 *
 * Governs how the resource and template codecs rewrite identifiers and format their output, keeping payload
 * identifiers portable across the hosts an API is served from.
 *
 * **Codec configuration**
 *
 * - {@link EncoderOpts} — options for encoding operations (base IRI, indentation)
 * - {@link DecoderOpts} — options for decoding operations (base IRI, lenient mode)
 *
 * @module index
 */

import { type IRI } from "@metreeca/core/resource";


/**
 * Configuration options for encoding operations.
 */
export type EncoderOpts = {

	/**
	 * Base IRI for IRI internalisation (must be absolute and hierarchical).
	 *
	 * Converts absolute IRIs to internal (root-relative) form.
	 *
	 * If omitted, IRIs are internalised against the {@link @metreeca/core!app app} namespace IRI (`app:/#`).
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
	 * If omitted, IRIs are resolved against the {@link @metreeca/core!app app} namespace IRI (`app:/#`).
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
