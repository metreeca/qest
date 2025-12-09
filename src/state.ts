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
 * Defines the data structures exchanged between clients and servers in REST/JSON APIs. Resources represent
 * complete entity states for retrieval and updates; patches describe partial modifications. Both use native
 * JSON types with optional localized text support.
 *
 * This module provides types for describing resource states and updates:
 *
 * - {@link Resource} — Complete resource state (HTTP GET/PUT)
 * - {@link Patch} — Partial resource updates (HTTP PATCH)
 * - {@link Values} — Property value sets
 * - {@link Value} — Individual property values
 * - {@link Literal} — Primitive data values
 * - {@link Dictionary} — Localized text values
 *
 * **Resource State**
 *
 * A {@link Resource} is a property map describing the state of a resource:
 *
 * ```typescript
 * const user: Resource = {
 *   id: "https://example.org/users/123",
 *   name: "Alice",
 *   email: "alice@example.org"
 * };
 * ```
 *
 * Resources may include an IRI property mapped to `@id` in the application-defined JSON-LD `@context`, identifying the
 * resource globally. This property is usually named `id`, but the mapping is arbitrary. A state without such a property
 * represents an anonymous (blank) node—useful for nested structures that don't need their own identity:
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
 * **Linking Resources**
 *
 * Resources can link to other resources using IRI references or embedded descriptions. IRI references identify a
 * resource without describing its state, while embedded descriptions include the linked resource's properties:
 *
 * ```typescript
 * // IRI references: compact form linking to external resources
 *
 * const order: Resource = {
 *   id: "https://shop.example.org/orders/100",
 *   customer: "https://accounts.example.org/users/alice",
 *   items: [
 *     "https://catalog.example.org/products/42",
 *     "https://catalog.example.org/products/99"
 *   ]
 * };
 *
 * // Embedded descriptions: expanded form with linked resource properties
 *
 * const order: Resource = {
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
 * **Creating and Replacing Resources**
 *
 * A {@link Resource} serves as payload for HTTP POST (create) and PUT (replace) operations.
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
 * **Important**: For PUT operations, state replacement is total — properties not included in the state are removed
 * from the resource; empty arrays are treated as property deletions, following set semantics where an empty set
 * is equivalent to absence.
 *
 * **Important**: Nested resource states containing properties beyond the resource identifier are only accepted if
 * explicitly declared as embedded in the application-defined data model; non-embedded nested resources with
 * additional properties will be rejected during validation.
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
 * **Updating Resources**
 *
 * A {@link Patch} serves as payload for HTTP PATCH operations. Properties can be set to new {@link Values | values}
 * or deleted using `null`; unlisted properties remain unchanged.
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
 * **Important**: Empty arrays are treated as property deletions, following set semantics where an empty set
 * is equivalent to absence.
 *
 * **Value Types**
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
 * **Important**: Arrays follow set semantics — duplicates are ignored, ordering is immaterial, and empty arrays are
 * treated as absent values. This aligns with JSON-LD's multi-valued property model.
 *
 * **Literals**
 *
 * A {@link Literal} maps directly to JSON primitives (`boolean`, `number`, `string`). Dates, times, and other
 * structured values are represented as strings in standard formats (e.g., ISO 8601). Application-level `@context`
 * objects can declare datatype coercion rules for JSON-LD processing.
 *
 * **Localized Text**
 *
 * For multilingual content, use a {@link Dictionary} — an object mapping language tags to localized strings.
 * Language tags follow [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) (e.g., `en`, `de-CH`, `zh-Hans`):
 *
 * ```typescript
 * // single value per language
 *
 * const name: Dictionary = {
 *   en: "Universal Widget",
 *   fr: "Widget Universel",
 *   de: "Universelles Widget"
 * };
 *
 * // multiple values per language
 *
 * const keywords: Dictionary = {
 *   en: ["tool", "gadget", "utility"],
 *   fr: ["outil", "gadget"]
 * };
 * ```
 *
 * **Important**: A dictionary must be either single-valued (one string per tag) or multi-valued (string arrays per
 * tag) throughout; mixing cardinalities within the same dictionary is not supported.
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
 * - IRI: reference to a resource
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
