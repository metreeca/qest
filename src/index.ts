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
 * Core linked data model.
 *
 * Defines a [JSON-LD compatible](https://github.com/metreeca/qest#json-ld-interoperability) linked data model designed
 * to feel like idiomatic JSON for JavaScript developers.
 *
 * **Data Model**
 *
 * The linked data model centers on {@link Resource | resources} — entities identified by web addresses (IRIs) that can
 * be linked together into a graph. Unlike isolated JSON documents, linked resources form a web of interconnected data
 * where relationships can be traversed across system boundaries.
 *
 * **Resource State**
 *
 * A {@link Resource} is a property map describing the state of a resource. The same type serves two roles:
 *
 * - **Retrieval** (HTTP GET): represents the current state returned by the server
 * - **Complete update** (HTTP PUT): specifies the complete new state to replace the current one
 *
 * ```typescript
 * const user: Resource = {
 *   id: "https://example.org/users/123",
 *   name: "Alice",
 *   email: "alice@example.org"
 * };
 * ```
 *
 * The `id` property corresponds to `@id` in JSON-LD and identifies the resource globally. A state without an
 * `id` represents an anonymous (blank) node—useful for nested structures that don't need their own identity:
 *
 * ```typescript
 * const user: Resource = {
 *   id: "https://example.org/users/123",
 *   name: "Alice",
 *   address: {              // anonymous nested resource state
 *     street: "Via Roma 1",
 *     city: "Rome",
 *     zip: "00100"
 *   }
 * };
 * ```
 *
 * **Resource Reference**
 *
 * An {@link IRI} string identifies a resource without describing its state. References appear only within
 * resource states as {@link Value | values}, linking to related resources:
 *
 * ```typescript
 * const order: Resource = {
 *   id: "https://example.org/orders/100",
 *   customer: "https://example.org/users/123"  // IRI reference to related resource
 * };
 * ```
 *
 * **Literals**
 *
 * A {@link Literal} is a primitive value: `boolean`, `number`, or `string`. These map directly to JSON primitives
 * and represent atomic data values:
 *
 * ```typescript
 * const product: Resource = {
 *   id: "https://example.org/products/42",
 *   available: true,        // boolean
 *   price: 29.99,           // number
 *   name: "Widget"          // string
 * };
 * ```
 *
 * Dates, times, and other structured values are represented as strings in standard formats (for instance, ISO 8601
 * for dates). Application-level `@context` objects can declare datatype coercion rules to convert these strings to
 * typed values during JSON-LD processing.
 *
 * **Property Values**
 *
 * Each property in a resource description holds {@link Values} — either a single {@link Value}, a {@link Dictionary}
 * of localized textual values, or an array representing a set of values:
 *
 * ```typescript
 * const article: Resource = {
 *
 *   id: "https://example.org/articles/1",
 *
 *   // single literal
 *
 *   published: "2024-01-15",
 *
 *   // single resource reference
 *
 *   author: "https://example.org/users/123",
 *
 *   // nested resource description
 *
 *   publisher: {
 *     id: "https://example.org/orgs/acme",
 *     name: "Acme Corp"
 *   },
 *
 *   // array of literals
 *
 *   tags: ["tech", "news", "featured"],
 *
 *   // array mixing references and descriptions
 *
 *   contributors: [
 *     "https://example.org/users/456",
 *     { id: "https://example.org/users/789", name: "Bob" }
 *   ]
 * };
 * ```
 *
 * **Important**: Arrays follow set semantics — duplicates are ignored, ordering is immaterial, and empty arrays are
 * treated as absent values. This differs from typical JSON arrays but aligns with JSON-LD's multi-valued property
 * model.
 *
 * **Localized Text**
 *
 * For multilingual content, use a {@link Dictionary} — an object mapping language tags to localized strings.
 * Language tags follow [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) (e.g., `en`, `de-CH`, `zh-Hans`):
 *
 * ```typescript
 * const product: Resource = {
 *
 *   id: "https://example.org/products/42",
 *
 *   // single value per language
 *
 *   name: {
 *     en: "Universal Widget",
 *     fr: "Widget Universel",
 *     de: "Universelles Widget"
 *   },
 *
 *   // multiple values per language
 *
 *   keywords: {
 *     en: ["tool", "gadget", "utility"],
 *     fr: ["outil", "gadget"]
 *   }
 * };
 * ```
 *
 * **Important**: A dictionary must be either single-valued (one string per tag) or multi-valued (string arrays per
 * tag) throughout; mixing cardinalities within the same dictionary is not supported.
 *
 * **Linking Resources**
 *
 * The power of linked data comes from connecting resources across boundaries. References create links that can be
 * resolved to retrieve full descriptions:
 *
 * ```typescript
 * // Compact form: reference points to external resource
 *
 * const order: Resource = {
 *   id: "https://shop.example.org/orders/100",
 *   customer: "https://accounts.example.org/users/alice",  // cross-domain link
 *   items: [
 *     "https://catalog.example.org/products/42",
 *     "https://catalog.example.org/products/99"
 *   ]
 * };
 *
 * // Expanded form: same data with embedded descriptions
 *
 * const expandedOrder: Resource = {
 *   id: "https://shop.example.org/orders/100",
 *   customer: {
 *     id: "https://accounts.example.org/users/alice",
 *     name: "Alice",
 *     email: "alice@example.org"
 *   },
 *   items: [
 *     {
 *       id: "https://catalog.example.org/products/42",
 *       name: "Widget",
 *       price: 29.99
 *     },
 *     {
 *       id: "https://catalog.example.org/products/99",
 *       name: "Gadget",
 *       price: 49.99
 *     }
 *   ]
 * };
 * ```
 *
 * **Complete Updates**
 *
 * A {@link Resource} can serve as a complete update specification for HTTP PUT operations. Properties are set to
 * new {@link Values | values}; unlisted properties are removed:
 *
 * ```typescript
 * const state: Resource = {
 *   name: "Bob",
 *   email: "bob@example.org",
 *   tags: ["featured", "urgent"],
 *   active: true
 * };
 * ```
 *
 * **Important**: Unlike partial updates ({@link Patch}), complete state replacement is total — properties not
 * included in the state are removed from the resource.
 *
 * **Important**: Empty arrays are treated as property deletions, following set semantics where an empty set
 * is equivalent to absence.
 *
 * *Linked Resources*
 *
 * References to linked resources can use either IRI strings or nested states, following the same
 * {@link Resource} model as in regular resource data.
 *
 * **Important**:
 *
 * - Nested resource states containing properties beyond the resource identifier are only accepted if
 *   explicitly declared as embedded in the application-defined data model
 * - The resource identifier (usually named `id`) holds the resource's unique IRI and is mapped to `@id`
 *   in the application-defined JSON-LD `@context`
 * - Non-embedded nested resources with additional properties will be rejected during validation
 *
 * ```typescript
 * // Using IRI references (always valid)
 *
 * const state: Resource = {
 *   name: "Annual Report 2024",
 *   author: "https://example.org/users/123",
 *   publisher: "https://example.org/orgs/acme"
 * };
 *
 * // Using nested states with only the identifier property (always valid)
 *
 * const state: Resource = {
 *   name: "Annual Report 2024",
 *   author: {
 *     id: "https://example.org/users/123"
 *   },
 *   publisher: {
 *     id: "https://example.org/orgs/acme"
 *   }
 * };
 *
 * // Using nested states with additional properties (must be declared as embedded)
 *
 * const state: Resource = {
 *   name: "Annual Report 2024",
 *   author: {
 *     id: "https://example.org/users/123",
 *     name: "Bob"                          // requires 'author' declared as embedded
 *   },
 *   publisher: {
 *     id: "https://example.org/orgs/acme",
 *     name: "Acme Corp"                    // requires 'publisher' declared as embedded
 *   }
 * };
 * ```
 *
 * **Partial Updates**
 *
 * A {@link Patch} specifies partial updates to a resource state. Properties can be set to new {@link Values | values}
 * or deleted using `null`; unlisted properties remain unchanged. This enables efficient incremental updates,
 * for instance using HTTP PATCH operations.
 *
 * *Updating Properties*
 *
 * Set properties to new values by including them in the patch:
 *
 * ```typescript
 * const patch: Patch = {
 *   name: "Bob",                    // update single value
 *   tags: ["featured", "urgent"],   // update array
 *   email: "bob@example.org"        // update another value
 * };
 * ```
 *
 * *Deleting Properties*
 *
 * Remove properties by setting them to `null` or an empty array:
 *
 * ```typescript
 * const patch: Patch = {
 *   deprecated: null,     // delete using null
 *   tags: []              // delete using empty array (equivalent to null)
 * };
 * ```
 *
 * **Important**: Empty arrays are treated as property deletions, following set semantics where an empty set
 * is equivalent to absence.
 *
 * *Combined Updates*
 *
 * Patches can mix updates and deletions:
 *
 * ```typescript
 * const patch: Patch = {
 *   name: "Charlie",      // update
 *   email: null,          // delete
 *   active: true,         // update
 *   tags: []              // delete
 * };
 * ```
 *
 * *Linked Resources*
 *
 * References to linked resources can use either IRI strings or nested states, following the same
 * {@link Resource} model as in regular resource data.
 *
 * **Important**:
 *
 * - Nested resource states containing properties beyond the resource identifier are only accepted if
 *   explicitly declared as embedded in the application-defined data model
 * - The resource identifier (usually named `id`) holds the resource's unique IRI and is mapped to `@id`
 *   in the application-defined JSON-LD `@context`
 * - Non-embedded nested resources with additional properties will be rejected during validation
 *
 * ```typescript
 * // Using IRI references (always valid)
 *
 * const patch: Patch = {
 *   author: "https://example.org/users/123",
 *   publisher: "https://example.org/orgs/acme"
 * };
 *
 * // Using nested states with only the identifier property (always valid)
 *
 * const patch: Patch = {
 *   author: {
 *     id: "https://example.org/users/123"
 *   },
 *   publisher: {
 *     id: "https://example.org/orgs/acme"
 *   }
 * };
 *
 * // Using nested states with additional properties (must be declared as embedded)
 *
 * const patch: Patch = {
 *   author: {
 *     id: "https://example.org/users/123",
 *     name: "Bob"                          // requires 'author' declared as embedded
 *   },
 *   publisher: {
 *     id: "https://example.org/orgs/acme",
 *     name: "Acme Corp"                    // requires 'publisher' declared as embedded
 *   }
 * };
 * ```
 *
 * @see {@link https://www.w3.org/TR/json-ld11/ JSON-LD 1.1}
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1 RFC 9110 - HTTP GET Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5789 RFC 5789 - HTTP PATCH Method}
 *
 * @module index
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
	| { readonly [property in Identifier]: Values }

/**
 * Partial resource state update.
 *
 * A property map specifying incremental changes to a {@link Resource} state. Each property maps to {@link Values}
 * to set or `null` to delete; unlisted properties remain unchanged. Empty arrays are equivalent to `null`.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5789 RFC 5789 - HTTP PATCH Method}
 */
export type Patch =
	| { readonly [property in Identifier]: null | Values }


/**
 * Model value set.
 *
 * A single {@link Value}, a {@link Dictionary} language map, or an array of values.
 *
 * Arrays represent sets of values: duplicate values are ignored and ordering is immaterial.
 * Empty arrays are ignored.
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
 * - {@link Resource}: nested resource state
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
