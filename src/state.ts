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
 * Resource state management.
 *
 * Defines types for describing resource states and partial updates in REST/JSON APIs, using native JSON types
 * with localised text support:
 *
 * - {@link Resource} — Complete resource state (HTTP GET/PUT)
 * - {@link Values} — Property value sets
 * - {@link Value} — Individual property values
 * - {@link Localised} — Localised text value set
 *
 * <img src="index/state.svg" alt="State type hierarchy" style="zoom: 1.75; display: block; margin: auto;" />
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
 * resource globally. This property is usually named `id`, but the mapping is arbitrary. A state without such a
 * property represents an anonymous (blank) node—useful for nested structures that don't need their own identity:
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
 * Each property in a resource state holds {@link Values}:
 *
 * - a single {@link Value}
 * - a {@link Localised} localised text value set
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
 * web. IRIs enable entity linking by referencing resources without embedding their full state. Properties mapped to
 * `@id` in the application-provided JSON-LD `@context` expect IRI values, establishing relationships between resources
 * across systems and domains.
 *
 * > [!NOTE]
 * > Data structures require absolute IRIs. Codec functions ({@link encodeResource}, {@link decodeResource})
 * > convert between absolute and internal (root-relative) forms for serialization.
 *
 * ## Literals
 *
 * A {@link Literal} maps directly to JSON primitives (`boolean`, `number`, `string`). Dates, times, and other
 * structured values are represented as strings in standard formats (for example, ISO 8601). Application-level
 * `@context` objects can declare datatype coercion rules for JSON-LD processing.
 *
 * ## Localised Text
 *
 * For multilingual content, use {@link Localised} value sets. Language
 * {@link Tag | tags} follow [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html)
 * (for example, `en`, `de-CH`, `zh-Hans`):
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
 * Plain strings and string arrays are accepted as shorthands for language-neutral values tagged with `und`.
 * Within a single map, all values must be uniformly scalar or uniformly array.
 *
 * > [!IMPORTANT]
 * > The `@none` key for non-localised values is not supported; use the `und` tag for language-neutral
 * > values or plain string / string array shorthands, which are equivalent to `{ und: value }`.
 *
 * @see {@link https://www.w3.org/TR/json-ld11/ JSON-LD 1.1}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1 RFC 9110 - HTTP GET Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 *
 *
 * @module
 */

import { Identifier } from "@metreeca/core";
import { immutable } from "@metreeca/core/deep";
import { Tag } from "@metreeca/core/language";
import { internalize, IRI, isIRI, resolve } from "@metreeca/core/resource";
import {
	type DecoderOpts,
	defaultBase,
	type EncoderOpts,
	type Indexed,
	type Literal,
	type Reference
} from "./index.js";
import { isResource } from "./state.core.js";


/**
 * Linked data resource state.
 *
 * A property map describing the state of a resource. Each property holds {@link Values} or {@link Indexed} and may
 * include an `id` property mapped to `@id` for resource identification. Descriptions without `id` represent anonymous
 * (blank) nodes.
 *
 * Used for both retrieving resource state (HTTP GET) and complete state replacement (HTTP PUT).
 *
 * @see {@link model!Query} for the corresponding retrieval template
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1 RFC 9110 - HTTP GET Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 */
export type Resource =
	| { readonly [property: Identifier]: Values | Indexed<Values> }


/**
 * Linked data value set.
 *
 * A single {@link Value}, a {@link Localised} language map, or an array of values.
 *
 * Arrays represent sets of values: duplicate values are ignored and ordering is immaterial. Empty arrays are ignored.
 *
 * @remarks
 *
 * {@link Indexed} containers are accepted at the property level but excluded from `Values` to prevent nesting.
 *
 * @see {@link model!Templates} for the corresponding retrieval template
 */
export type Values =
	| Value
	| Localised
	| readonly Value[]

/**
 * Linked data value.
 *
 * Represents property values in resource state descriptions:
 *
 * - {@link Literal}: primitive data (boolean, number, string)
 * - {@link Reference}: IRI reference to a resource
 * - {@link Resource}: nested resource state
 *
 * @see {@link model!Template} for the corresponding retrieval template
 */
export type Value =
	| Literal
	| Reference
	| Resource

/**
 * Localised text value set.
 *
 * Language-tagged text mapping {@link Tag | tags} to localised values, supporting both single-valued and
 * multi-valued forms per language.
 *
 * Plain shorthands are accepted for language-neutral values tagged with `und`:
 *
 * - `"hello"` is equivalent to `{ und: "hello" }`
 * - `["a", "b"]` is equivalent to `{ und: ["a", "b"] }`
 *
 * Consumers are responsible for normalising shorthand values to the canonical object form.
 *
 * > [!WARNING]
 * > Within a single map, all values must be uniformly scalar or uniformly array — mixed content is not
 * > permitted.
 *
 * > [!NOTE]
 * > - Language maps are conceptually equivalent to an array of language-tagged strings, which idiomatic JSON
 * >   doesn't directly support
 * > - The `@none` key for non-localised values is not supported; use the `und` tag or the plain string/string
 * >   array shorthand for language-neutral values
 * > - The `und` (Undetermined) tag is preferred over `zxx` (No Linguistic Content) for language-neutral text:
 * >   `und` denotes text not bound to a specific language, while `zxx` is reserved for non-linguistic content
 * >   such as instrumental music or binary data
 *
 * @see {@link model!Locale} for the corresponding retrieval template
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://iso639-3.sil.org/code/und ISO 639 und - Undetermined Language}
 */
export type Localised =
	| string
	| readonly string[]
	| { readonly [tag: Tag]: string }
	| { readonly [tag: Tag]: readonly string[] }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a resource state as a JSON string.
 *
 * If `base` is provided, converts absolute IRIs (matching `isIRI(value, "absolute")`) to
 * internal IRIs using {@link internalize}, recursively throughout the resource structure.
 * Otherwise, performs plain JSON serialization.
 *
 * @param resource The resource state to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalizing absolute IRIs
 * @param options.indent Indentation level for pretty-printing output
 *
 * @returns The JSON string, with internalized IRIs if `base` is provided
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 *
 * @example
 *
 * ```typescript
 * encodeResource(
 *   { id: "https://example.com/products/42", name: "Widget", price: 29.99 },
 *   { base: "https://example.com/" }
 * );
 * // → '{"id":"/products/42","name":"Widget","price":29.99}'
 * ```
 *
 * @see {@link decodeResource}
 */
export function encodeResource(resource: Resource, {

	base = defaultBase,
	indent

}: EncoderOpts = {}): string {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	return JSON.stringify(resource, replacer, indent === true ? 2 : indent || undefined);


	function replacer(_key: string, value: unknown): unknown {
		return isIRI(value, "absolute")
			? internalize(base, value)
			: value;
	}

}

/**
 * Decodes a resource state from a JSON string.
 *
 * If `base` is provided, resolves internal IRIs (matching `isIRI(value, "internal")`) to
 * absolute IRIs using `resolve()`, recursively throughout the json structure. Otherwise,
 * performs plain JSON parsing.
 *
 * @param json The JSON-serialized {@link Resource}
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} resource, with resolved IRIs if `base` is provided
 *
 * @throws {TypeError} If `base` is not a hierarchical IRI
 * @throws {TypeError} If the decoded value fails structural validation (unless `lenient` is `true`)
 * @throws {SyntaxError} If `json` is not valid JSON
 *
 * @example
 *
 * ```typescript
 * decodeResource(
 *   '{"id":"/products/42","name":"Widget","price":29.99}',
 *   { base: "https://example.com/" }
 * );
 * // → { id: "https://example.com/products/42", name: "Widget", price: 29.99 }
 * ```
 *
 * @see {@link encodeResource}
 */
export function decodeResource(json: string, {

	base = defaultBase,
	lenient

}: DecoderOpts = {}): Resource {

	if ( base !== defaultBase && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const resource = JSON.parse(json, (_key, value) =>
		isIRI(value, "internal")
			? resolve(base, value)
			: value
	);

	return immutable(resource, lenient ? (v): v is Resource => true : isResource, "malformed resource");

}
