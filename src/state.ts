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
 * - {@link IRI} — Resource identifiers
 * - {@link Literal} — Primitive data values
 * - {@link Dictionary} — Localized text values
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
 * - a {@link Dictionary} of localized textual values
 * - an array representing a set of values
 *
 * A {@link Value} can be:
 *
 * - **{@link Literal}**: primitive data (`boolean`, `number`, `string`)
 * - **IRI**: web identifier referencing a resource
 * - **nested state**: embedded resource description (object with property values)
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
 * For multilingual content, use a {@link Dictionary} — an object mapping language tags to localized strings.
 * Language tags follow [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) (e.g., `en`, `de-CH`, `zh-Hans`):
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
 *
 * > A dictionary must be either single-valued (one string per tag) or multi-valued (string arrays per
 * > tag) throughout; mixing cardinalities within the same dictionary is not supported.
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
import { IRI } from "@metreeca/core/resource";


/**
 * Linked data resource state.
 *
 * A property map describing the state of a resource. Each property holds {@link Values} and may include an `id`
 * property mapped to `@id` for resource identification. Descriptions without `id` represent anonymous (blank) nodes.
 *
 * Used for both retrieving resource state (HTTP GET) and complete state replacement (HTTP PUT).
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1 RFC 9110 - HTTP GET Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 */
export type Resource =
	| { readonly [property: Identifier]: Values }

/**
 * Partial resource state update.
 *
 * A property map specifying incremental changes to a {@link Resource} state. Each property maps to {@link Values}
 * to set or `null` to delete; unlisted properties remain unchanged. Empty arrays are equivalent to `null`.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5789 RFC 5789 - HTTP PATCH Method}
 */
export type Patch =
	| { readonly [property: Identifier]: null | Values }


/**
 * Model value set.
 *
 * A single {@link Value}, a {@link Dictionary} language map, or an array of values.
 *
 * Arrays represent sets of values: duplicate values are ignored and ordering is immaterial. Empty arrays are ignored.
 */
export type Values =
	| Value
	| Dictionary
	| readonly Value[]

/**
 * Model value.
 *
 * Represents property values in resource state descriptions:
 *
 * - {@link Literal}: primitive data (boolean, number, string)
 * - {@link IRI}: reference to a resource
 * - nested resource state
 */
export type Value =
	| Literal
	| IRI
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
 * Language-tagged map for internationalized text values.
 *
 * Maps language {@link Tag | tags} to localized text, supporting two cardinality patterns:
 *
 * - **single-valued**: one text value per language
 * - **multi-valued**: multiple text values per language
 *
 * @remarks
 *
 * The `@none` key for non-localized values is not supported; for mixed content use `string | Dictionary`
 * union types or the `zxx` tag.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://iso639-3.sil.org/code/zxx ISO 639-3 zxx - No Linguistic Content}
 */
export type Dictionary =
	| { readonly [tag: Tag]: string }
	| { readonly [tag: Tag]: readonly string[] }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a resource state as a JSON string.
 *
 * @param resource The resource state to encode
 *
 * @returns The JSON string
 *
 * @see {@link decodeResource}
 */
export function encodeResource(resource: Resource): string {
	return JSON.stringify(resource);
}

/**
 * Decodes a resource state from a JSON string.
 *
 * @param resource The encoded resource string
 *
 * @returns The decoded resource state
 *
 * @throws Error if the input is not valid JSON
 *
 * @see {@link encodeResource}
 */
export function decodeResource(resource: string): Resource {
	return JSON.parse(resource) as Resource;
}

/**
 * Encodes a patch as a JSON string.
 *
 * @param patch The patch to encode
 *
 * @returns The JSON string
 *
 * @see {@link decodePatch}
 */
export function encodePatch(patch: Patch): string {
	return JSON.stringify(patch);
}

/**
 * Decodes a patch from a JSON string.
 *
 * @param patch The encoded patch string
 *
 * @returns The decoded patch
 *
 * @throws Error if the input is not valid JSON
 *
 * @see {@link encodePatch}
 */
export function decodePatch(patch: string): Patch {
	return JSON.parse(patch) as Patch;
}
