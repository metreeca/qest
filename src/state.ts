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
 * Resource state model.
 *
 * Defines types for describing resource states and partial updates in REST/JSON APIs, using native JSON types
 * with localized text support:
 *
 * - {@link Resource} — Complete resource state (HTTP GET/PUT)
 * - {@link Patch} — Partial resource updates (HTTP PATCH)
 * - {@link Values} — Property value sets
 * - {@link Value} — Individual property values
 * - {@link Literal} — Primitive data values
 * - {@link Reference} — IRI resource references
 * - {@link Local} — Language-tagged text map (single-valued)
 * - {@link Locals} — Language-tagged text map (multi-valued)
 * - {@link Indexed} — Key-indexed value container
 *
 * Provides utilities for converting between serialized and structured representations:
 *
 * - {@link encodeResource} / {@link decodeResource} — codecs for {@link Resource} states
 * - {@link encodePatch} / {@link decodePatch} — codecs for {@link Patch} updates
 *
 * # Resource Operations
 *
 * ## Retrieving
 *
 * A {@link Resource} is a property map describing the state of a resource:
 *
 * ```http request
 * GET https://example.com/products/42
 * ```
 *
 * ```json
 * {
 *   "id": "/products/42",
 *   "name": "Widget",
 *   "price": 29.99,
 *   "available": true
 * }
 * ```
 *
 * Resources may include an IRI property mapped to `@id` in the application-defined JSON-LD `@context`, identifying the
 * resource globally. This property is usually named `id`, but the mapping is arbitrary. A state without such a property
 * represents an anonymous (blank) node—useful for nested structures that don't need their own identity:
 *
 * ```json
 * {
 *   "id": "/products/42",
 *   "name": "Widget",
 *   "price": 29.99,
 *   "dimensions": {
 *     "width": 10,
 *     "height": 5,
 *     "depth": 3
 *   }
 * }
 * ```
 *
 * Resources can link to other resources using IRI references or embedded descriptions. IRI references identify a
 * resource without describing its state, while embedded descriptions include the linked resource's properties:
 *
 * ```js
 * // IRI references: compact form linking to external resources
 *
 * ({
 *   "id": "/products/42",
 *   "name": "Widget",
 *   "price": 29.99,
 *   "vendor": "/vendors/acme",
 *   "categories": ["/categories/electronics", "/categories/home"]
 * })
 *
 * // Embedded descriptions: expanded form with linked resource properties
 *
 * ({
 *   "id": "/products/42",
 *   "name": "Widget",
 *   "price": 29.99,
 *   "vendor": {
 *     "id": "/vendors/acme",
 *     "name": "Acme Corp"
 *   },
 *   "categories": [
 *     { "id": "/categories/electronics", "name": "Electronics" },
 *     { "id": "/categories/home", "name": "Home" }
 *   ]
 * })
 * ```
 *
 * ## Creating
 *
 * A {@link Resource} serves as payload for HTTP POST operations:
 *
 * ```http request
 * POST https://example.com/products/
 * ```
 *
 * ```json
 * {
 *   "name": "Gadget",
 *   "price": 49.99,
 *   "categories": ["electronics", "home"],
 *   "available": true
 * }
 * ```
 *
 * > [!IMPORTANT]
 * > Nested resource states containing properties beyond the resource identifier are only accepted if
 * > explicitly declared as embedded in the application-defined data model; non-embedded nested resources with
 * > additional properties will be rejected during validation.
 *
 * ```js
 * // Using IRI references (always valid)
 *
 * ({
 *   "name": "Gadget",
 *   "price": 49.99,
 *   "vendor": "/vendors/acme"
 * })
 *
 * // Using nested states with only the identifier property (always valid)
 *
 * ({
 *   "name": "Gadget",
 *   "price": 49.99,
 *   "vendor": {
 *     "id": "/vendors/acme"
 *   }
 * })
 *
 * // Using nested states with additional properties (must be declared as embedded)
 *
 * ({
 *   "name": "Gadget",
 *   "price": 49.99,
 *   "vendor": {         // requires 'vendor' declared as embedded
 *     "id": "/vendors/acme",
 *     "name": "Acme Corp"
 *   }
 * })
 * ```
 *
 * ## Updating
 *
 * A {@link Resource} also serves as payload for HTTP PUT operations:
 *
 * ```http request
 * PUT https://example.com/products/42
 * ```
 *
 * ```js
 * ({
 *   "name": "Widget",
 *   "price": 79.99,
 *   "categories": ["electronics", "premium"]
 *   // available       // not included → deleted
 * })
 * ```
 *
 * > [!IMPORTANT]
 * > State replacement is total — properties not included in the state are removed from the resource; empty arrays
 * > are treated as property deletions, following set semantics where an empty set is equivalent to absence.
 *
 * ## Patching
 *
 * A {@link Patch} serves as payload for HTTP PATCH operations. Properties can be set to new {@link Values | values}
 * or deleted using `null`; unlisted properties remain unchanged:
 *
 * ```http request
 * PATCH https://example.com/products/42
 * ```
 *
 * ```js
 * ({
 *   "price": 39.99,         // update
 *   "description": null,    // delete
 *   "available": true,      // update
 *   "categories": []        // delete
 * })
 * ```
 *
 * > [!IMPORTANT]
 * > Empty arrays are treated as property deletions, following set semantics where an empty set
 * > is equivalent to absence.
 *
 * ## Deleting
 *
 * HTTP DELETE operations remove the resource at the request URL (no payload is required):
 *
 * ```http request
 * DELETE https://example.com/products/42
 * ```
 *
 * # Value Types
 *
 * Each property in a resource state or patch holds {@link Values}:
 *
 * - a single {@link Value}
 * - a {@link Local} single-valued language-tagged text map
 * - a {@link Locals} multi-valued language-tagged text map
 * - an array representing a set of values
 *
 * Additionally, properties can hold an {@link Indexed} container, mapping arbitrary keys to {@link Values}.
 *
 * A {@link Value} can be:
 *
 * - **{@link Literal}**: primitive data (`boolean`, `number`, `string`)
 * - **{@link Reference}**: IRI identifying a linked resource
 * - **{@link Resource}**: nested resource state
 *
 * > [!IMPORTANT]
 * > Arrays follow set semantics — duplicates are ignored, ordering is immaterial, and empty arrays are
 * > treated as absent values. This aligns with JSON-LD's multi-valued property model.
 *
 * ## IRIs
 *
 * An {@link IRI} (Internationalized Resource Identifier) is a globally unique string identifying a resource on the
 * web.
 * IRIs enable entity linking by referencing resources without embedding their full state. Properties mapped to `@id`
 * in the application-provided JSON-LD `@context` expect IRI values, establishing relationships between resources across
 * systems and domains.
 *
 * > [!NOTE]
 * > The choice between absolute, root-relative, or relative IRIs is application-specific, but root-relative IRIs
 * > (e.g., `/users/123`) are preferred for readability and portability. JSON-LD `@base` declarations can resolve
 * > relative references to absolute IRIs during processing.
 *
 * ## Literals
 *
 * A {@link Literal} maps directly to JSON primitives (`boolean`, `number`, `string`). Dates, times, and other
 * structured values are represented as strings in standard formats (e.g., ISO 8601). Application-level `@context`
 * objects can declare datatype coercion rules for JSON-LD processing.
 *
 * ## Localized Text
 *
 * For multilingual content, use {@link Local} or {@link Locals} language-tagged text maps.
 * Tags follow [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) (e.g., `en`, `de-CH`, `zh-Hans`):
 *
 * ```js
 * // single value per language
 *
 * ({
 *   "en": "Universal Widget",
 *   "fr": "Widget Universel",
 *   "de": "Universelles Widget"
 * })
 *
 * // multiple values per language
 *
 * ({
 *   "en": ["tool", "gadget", "utility"],
 *   "fr": ["outil", "gadget"]
 * })
 * ```
 *
 * > [!IMPORTANT]
 * > The `@none` key for non-localized values is not supported; for mixed content use `string | Local`
 * > or `readonly string[] | Locals` union types, or the `zxx` tag.
 *
 * @see {@link https://www.w3.org/TR/json-ld11/ JSON-LD 1.1}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1 RFC 9110 - HTTP GET Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5789 RFC 5789 - HTTP PATCH Method}
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 *
 * @module
 */

import { Identifier } from "@metreeca/core";
import { Tag } from "@metreeca/core/language";
import { assert, immutable } from "@metreeca/core/nested";
import { asIRI, internalize, IRI, isIRI, resolve } from "@metreeca/core/resource";
import { asString } from "./index.type.js";
import { asPatch, asResource } from "./state.type.js";

export * from "./state.type.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Linked data resource state.
 *
 * A property map describing the state of a resource. Each property holds {@link Values} or {@link Indexed} and may
 * include an `id` property mapped to `@id` for resource identification. Descriptions without `id` represent anonymous
 * (blank) nodes.
 *
 * Used for both retrieving resource state (HTTP GET) and complete state replacement (HTTP PUT).
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1 RFC 9110 - HTTP GET Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 */
export type Resource =
	| { readonly [property: Identifier]: Values | Indexed }

/**
 * Partial resource state update.
 *
 * A property map specifying incremental changes to a {@link Resource} state. Each property maps to
 * {@link Values} or {@link Indexed} to set, or `null` to delete; unlisted properties remain unchanged.
 * Empty arrays are equivalent to `null`.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5789 RFC 5789 - HTTP PATCH Method}
 */
export type Patch =
	| { readonly [property: Identifier]: null | Values | Indexed }


/**
 * Model value set.
 *
 * A single {@link Value}, a {@link Local} or {@link Locals} language map, or an array of values.
 *
 * Arrays represent sets of values: duplicate values are ignored and ordering is immaterial. Empty arrays are ignored.
 *
 * @remarks
 *
 * {@link Indexed} containers are accepted at the property level but excluded from `Values` to prevent nesting.
 */
export type Values =
	| Value
	| Local
	| Locals
	| readonly Value[]

/**
 * Model value.
 *
 * Represents property values in resource state descriptions:
 *
 * - {@link Literal}: primitive data (boolean, number, string)
 * - {@link Reference}: IRI reference to a resource
 * - {@link Resource}: nested resource state
 */
export type Value =
	| Literal
	| Reference
	| Resource

/**
 * Literal value.
 *
 * JSON primitives used as property values in resources. Corresponds to JSON-LD's primitive value types
 * for boolean, numeric, and string data.
 */
export type Literal =
	| boolean
	| number
	| string

/**
 * Resource reference.
 *
 * An {@link IRI} identifying a linked resource without embedding its state. Contrast with {@link Resource},
 * which includes the linked resource's properties inline.
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only. Branding was considered but not adopted due to
 * > interoperability issues with tools relying on static code analysis.
 *
 * @see {@link https://www.w3.org/TR/json-ld11/#node-identifiers JSON-LD 1.1 - Node Identifiers}
 */
export type Reference =
	| IRI

/**
 * Single-valued language-tagged map for internationalized text.
 *
 * Maps language {@link Tag | tags} to a single localized text value per language.
 *
 * @remarks
 *
 * - The `@none` key for non-localized values is not supported; for mixed content use `string | Local`
 *   union types or the `zxx` tag
 * - Language maps are conceptually equivalent to an array of language-tagged strings, which idiomatic JSON
 *   doesn't directly support
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://iso639-3.sil.org/code/zxx ISO 639-3 zxx - No Linguistic Content}
 */
export type Local =
	| { readonly [tag: Tag]: string }

/**
 * Multi-valued language-tagged map for internationalized text.
 *
 * Maps language {@link Tag | tags} to multiple localized text values per language.
 *
 * @remarks
 *
 * - The `@none` key for non-localized values is not supported; for mixed content use `readonly string[] | Locals`
 *   union types or the `zxx` tag
 * - Language maps are conceptually equivalent to an array of language-tagged strings, which idiomatic JSON
 *   doesn't directly support
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://iso639-3.sil.org/code/zxx ISO 639-3 zxx - No Linguistic Content}
 */
export type Locals =
	| { readonly [tag: Tag]: readonly string[] }

/**
 * Key-indexed container for property values.
 *
 * Maps arbitrary {@link Identifier} keys to {@link Values}, supporting index-based organization of property values.
 * Useful for representing union-typed properties or dynamically-keyed structures.
 *
 * @remarks
 *
 * - Corresponds to JSON-LD's `@index` container semantics; requires `@context` to distinguish from nested resources
 * - Keys are limited to valid JavaScript identifiers
 * - Allowed only as top-level property values; no nesting
 *
 * @see {@link https://www.w3.org/TR/json-ld11/#data-indexing JSON-LD 1.1 - Data Indexing}
 */
export type Indexed =
	| { readonly [key: Identifier]: Values }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Options for resource encoding and decoding.
 *
 * @see {@link encodeResource}
 * @see {@link decodeResource}
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

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a resource state as a JSON string.
 *
 * If `base` is provided, converts absolute IRIs (matching `isIRI(value, "absolute")`) to root-relative IRIs
 * using `internalize()`, recursively throughout the resource structure. Otherwise, performs plain JSON serialization.
 *
 * @param resource The resource state to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalizing absolute references (must be absolute and hierarchical);
 *   if omitted, no IRI rewriting is performed
 *
 * @returns The JSON string, with internalized IRIs if `base` is provided
 *
 * @throws {RangeError} If `base` is provided but not an absolute hierarchical IRI
 * @throws TypeGuardError If `resource` is not a valid {@link Resource}
 *
 * @see {@link decodeResource}
 */
export function encodeResource(resource: Resource, {

	base

}: CodecOpts = {}): string {

	const $resource = assert(asResource, resource);

	if ( base === undefined ) {

		return JSON.stringify($resource);

	} else {

		const $base = assert(v => asIRI(v, "hierarchical"), base);

		return JSON.stringify($resource, (_key, value) =>
			isIRI(value, "absolute")
				? internalize($base, value)
				: value
		);

	}

}

/**
 * Decodes a resource state from a JSON string.
 *
 * If `base` is provided, resolves internal IRIs (matching `isIRI(value, "internal")`) to absolute IRIs
 * using `resolve()`, recursively throughout the resource structure. Otherwise, performs plain JSON parsing.
 *
 * @param resource The encoded resource string
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal references (must be absolute and hierarchical);
 *   if omitted, no IRI rewriting is performed
 *
 * @returns The decoded resource state, with resolved IRIs if `base` is provided
 *
 * @throws {RangeError} If `base` is provided but not an absolute hierarchical IRI
 * @throws TypeGuardError If `resource` is not a string or not a valid {@link Resource}
 * @throws {SyntaxError} If `resource` is not valid JSON
 *
 * @see {@link encodeResource}
 */
export function decodeResource(resource: string, {

	base

}: CodecOpts = {}): Resource {

	const $resource = assert(asString, resource);

	if ( base === undefined ) {

		return immutable(assert(asResource, JSON.parse($resource)));

	} else {

		const $base = assert(v => asIRI(v, "hierarchical"), base);

		return immutable(assert(asResource, JSON.parse($resource, (_key, value) =>
			isIRI(value, "internal")
				? resolve($base, value)
				: value
		)));

	}
}


/**
 * Encodes a patch as a JSON string.
 *
 * If `base` is provided, converts absolute IRIs (matching `isIRI(value, "absolute")`) to root-relative IRIs
 * using `internalize()`, recursively throughout the patch structure. Otherwise, performs plain JSON serialization.
 *
 * @param patch The patch to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalizing absolute references (must be absolute and hierarchical);
 *   if omitted, no IRI rewriting is performed
 *
 * @returns The JSON string, with internalized IRIs if `base` is provided
 *
 * @throws {RangeError} If `base` is provided but not an absolute hierarchical IRI
 * @throws TypeGuardError If `patch` is not a valid {@link Patch}
 *
 * @see {@link decodePatch}
 */
export function encodePatch(patch: Patch, {

	base

}: CodecOpts = {}): string {

	const $patch = assert(asPatch, patch);

	if ( base === undefined ) {

		return JSON.stringify($patch);

	} else {

		const $base = assert(v => asIRI(v, "hierarchical"), base);

		return JSON.stringify($patch, (_key, value) =>
			isIRI(value, "absolute")
				? internalize($base, value)
				: value
		);

	}

}

/**
 * Decodes a patch from a JSON string.
 *
 * If `base` is provided, resolves internal IRIs (matching `isIRI(value, "internal")`) to absolute IRIs
 * using `resolve()`, recursively throughout the patch structure. Otherwise, performs plain JSON parsing.
 *
 * @param patch The encoded patch string
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal references (must be absolute and hierarchical);
 *   if omitted, no IRI rewriting is performed
 *
 * @returns The decoded patch, with resolved IRIs if `base` is provided
 *
 * @throws {RangeError} If `base` is provided but not an absolute hierarchical IRI
 * @throws TypeGuardError If `patch` is not a string or not a valid {@link Patch}
 * @throws {SyntaxError} If `patch` is not valid JSON
 *
 * @see {@link encodePatch}
 */
export function decodePatch(patch: string, {

	base

}: CodecOpts = {}): Patch {

	const $patch = assert(asString, patch);

	if ( base === undefined ) {

		return immutable(assert(asPatch, JSON.parse($patch)));

	} else {

		const $base = assert(v => asIRI(v, "hierarchical"), base);

		return immutable(assert(asPatch, JSON.parse($patch, (_key, value) =>
			isIRI(value, "internal")
				? resolve($base, value)
				: value
		)));

	}

}
