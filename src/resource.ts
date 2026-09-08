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
 * Resource state representation.
 *
 * Defines types for describing resource states and partial updates in REST/JSON APIs, using native JSON types
 * with localised text support.
 *
 * <img src="resource.svg" alt="State type hierarchy" style="zoom: 1.75; display: block; margin: auto;" />
 *
 * **Data model**
 *
 * - {@link Resource} — Complete resource state (HTTP GET/PUT)
 * - {@link Values} — Property value sets
 * - {@link Value} — Individual property values
 * - {@link Text} — Localised text value set (single- or multi-valued per tag)
 * - {@link Literal} — Primitive scalar value (`boolean`, `number`, `string`)
 * - {@link Reference} — Absolute IRI identifying a linked resource
 *
 * **Type guards**
 *
 * - {@link isResource} — checks if a value is a {@link Resource}
 * - {@link isValues} — checks if a value is a {@link Values} set
 * - {@link isValue} — checks if a value is a {@link Value}
 * - {@link isText} — checks if a value is a {@link Text} value set
 * - {@link isLiteral} — checks if a value is a {@link Literal}
 * - {@link isReference} — checks if a value is a {@link Reference}
 *
 * **Codecs**
 *
 * - {@link encodeResource} — encode a {@link Resource} as JSON
 * - {@link decodeResource} — decode a {@link Resource} from JSON
 *
 * # Resource Operations
 *
 * ## Retrieving
 *
 * A {@link Resource} is a field map describing the state of a resource:
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
 * Resources may include an IRI field mapped to `@id` in the application-defined JSON-LD `@context`, identifying the
 * resource globally. This field is usually named `id`, but the mapping is arbitrary. A state without such a
 * field represents an anonymous (blank) node, useful for nested structures that don't need their own identity:
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
 * > State replacement is total: properties not included in the state are removed from the resource; empty arrays
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
 * Each field in a resource state holds a {@link Values | value set}: a single scalar, a {@link Text} language
 * map, or an array of scalars.
 *
 * A {@link Value} is a single scalar:
 *
 * - **{@link Literal}**: primitive data (`boolean`, `number`, `string`)
 * - **{@link Reference}**: absolute IRI identifying a linked resource
 * - **{@link Resource}**: nested resource state
 *
 * A {@link Values} set extends {@link Value} with collection forms:
 *
 * - a {@link Text} localised text value set
 * - an array of {@link Value} elements, with mixed element types permitted
 *
 * > [!IMPORTANT]
 * > Arrays follow set semantics: duplicates are ignored, ordering is immaterial, and empty arrays are treated
 * > as absent values, aligning with JSON-LD's multi-valued property model.
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
 * > convert between absolute and internal (root-relative) forms for serialisation.
 *
 * ## Literals
 *
 * Primitive values (`boolean`, `number`, `string`) map directly to JSON primitives. Dates, times, and other
 * structured values are represented as strings in standard formats (for example, ISO 8601). Application-level
 * `@context` objects can declare datatype coercion rules for JSON-LD processing.
 *
 * ## Localised Text
 *
 * For multilingual content, use {@link Text} value sets. Language
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
 * Within a single map, all values must be uniformly scalar or uniformly array.
 *
 * > [!IMPORTANT]
 * > The `@none` key for non-localised values is not supported; use the `und` tag for language-neutral
 * > values.
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
import { Tag } from "@metreeca/core/language";
import { internalize, IRI, isIRI, resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/structures";
import { app, type DecoderOpts, type EncoderOpts } from "./index.js";
import { isResource } from "./resource.core.js";

export * from "./resource.core.js";


/**
 * Linked data resource state.
 *
 * A field map describing the state of a resource. Each field holds a {@link Values | value set}: a single
 * {@link Value | scalar value}, a {@link Text} map, or an array of scalars. A property carrying no value is
 * absent from the map rather than present with an empty marker; `undefined` is admitted as the absent marker for a
 * field elided at construction time (for example, a conditionally included property) and is equivalent to omission.
 *
 * > [!NOTE]
 * > An empty nested `Resource` (`{}`) carries no state and must be ignored by processors:
 * > dropped when it appears as an element of a {@link Values} array, or treated as if the
 * > owning field were omitted from the enclosing resource otherwise.
 *
 * @see {@link template!Template} for the corresponding retrieval template
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1 RFC 9110 - HTTP GET Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 */
export type Resource = {

	readonly [field: Identifier]: undefined | Values

}


/**
 * Linked data value set.
 *
 * A single {@link Value} scalar, a {@link Text} map, or an array of {@link Value} elements.
 * Arrays follow set semantics: duplicate values are ignored, ordering is immaterial, and empty arrays are
 * treated as absent values. Element types may be mixed.
 *
 * @see {@link template!Placeholders} for the corresponding retrieval template
 */
export type Values =
	| Value
	| Text
	| readonly Value[]

/**
 * Linked data value.
 *
 * Individual scalar carried by a resource property:
 *
 * - {@link Literal} — primitive data (`boolean`, `number`, `string`)
 * - {@link Reference} — absolute IRI identifying a linked resource
 * - {@link Resource} — nested resource state
 *
 * @see {@link template!Placeholder} for the corresponding retrieval template
 */
export type Value =
	| Literal
	| Reference
	| Resource


/**
 * Localised text value set.
 *
 * Language-tagged text mapping {@link Tag | tags} to localised values. The umbrella union admits
 * two forms with disjoint value shapes:
 *
 * - a single string value per tag, or
 * - an array of string values per tag
 *
 * > [!NOTE]
 * > - Language maps are conceptually equivalent to an array of language-tagged strings, which idiomatic JSON
 * >   doesn't directly support
 * > - The `@none` key for non-localised values is not supported; use the `und` tag for language-neutral values
 *
 * > [!NOTE]
 * > An empty language map (`{}`) carries no localised values and must be ignored by processors as if the
 * > owning field were omitted from the enclosing resource.
 *
 * @see {@link template!Locale} for the corresponding retrieval template
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://iso639-3.sil.org/code/und ISO 639 und - Undetermined Language}
 */
export type Text =
	| { readonly [tag: Tag]: string }
	| { readonly [tag: Tag]: readonly string[] }

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
 * {@link Resource}, which includes the linked resource's properties inline.
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only. Branding was considered but not adopted due to
 * > interoperability issues with tools relying on static code analysis.
 *
 * > [!NOTE]
 * > A decoded reference is always absolute. In the JSON wire format a reference MAY instead appear in relative form:
 * > decoders resolve it against a known base IRI (defaulting to {@link app}), and encoders MAY conversely relativise
 * > absolute references against the same base, preferring the root-relative form.
 *
 * @see {@link https://www.w3.org/TR/json-ld11/#node-identifiers JSON-LD 1.1 - Node Identifiers}
 */
export type Reference =
	| IRI


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a resource state as a JSON string.
 *
 * Serialises a {@link Resource} into a JSON string, recursively {@link internalize | internalising} absolute IRIs
 * against the provided `base`.
 *
 * @param resource The resource state to encode
 * @param options Encoding options
 * @param options.base Base IRI for internalising absolute IRIs
 * @param options.indent Indentation level for pretty-printing output
 *
 * @returns The JSON string with internalised IRIs
 *
 * @throws {@link !TypeError TypeError} If `base` is not a hierarchical IRI
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

	base = app,
	indent

}: EncoderOpts = {}): string {

	if ( base !== app && !isIRI(base, "hierarchical") ) {
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
 * Parses a JSON string into a {@link Resource}, recursively {@link resolve | resolving} internal IRIs against the
 * provided `base`. The decoded resource is validated and deeply frozen unless `lenient` is `true`.
 *
 * @param json The JSON-serialised {@link Resource}
 * @param options Decoding options
 * @param options.base Base IRI for resolving internal IRIs
 * @param options.lenient Disables structural validation when `true`
 *
 * @returns The decoded deeply {@link immutable} resource with resolved IRIs
 *
 * @throws {@link !TypeError TypeError} If `base` is not a hierarchical IRI
 * @throws {@link !TypeError TypeError} If the decoded value fails structural validation (unless `lenient` is `true`)
 * @throws {@link !SyntaxError SyntaxError} If `json` is not valid JSON
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

	base = app,
	lenient

}: DecoderOpts = {}): Resource {

	if ( base !== app && !isIRI(base, "hierarchical") ) {
		throw new TypeError(`expected hierarchical base IRI <${base}>`);
	}

	const resource = JSON.parse(json, (_key, value) =>
		isIRI(value, "internal")
			? resolve(base, value)
			: value
	);

	return immutable(resource, lenient ? (v): v is Resource => true : isResource, "malformed resource");

}
