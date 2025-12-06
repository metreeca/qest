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
 * Core type definitions linked data values.
 *
 * This data model defines a controlled subset of [JSON-LD](https://www.w3.org/TR/json-ld11/) that can be easily
 * interpreted as plain idiomatic JSON.
 *
 * JSON-LD (JSON for Linked Data) is a [W3C](https://www.w3.org/) standard that extends JSON with web identifiers
 * (IRIs), so that property names and values can reference shared vocabularies. This gives data a precise,
 * machine-readable meaning that survives when combined with data from other sources — a capability at the heart
 * of the [Web of Data](https://www.w3.org/2013/data/) (aka Semantic Web) vision and modern knowledge graphs.
 *
 * This simplified data model is intended to feel natural to JavaScript developers, without exposing them to JSON-LD
 * technicalities, while retaining full JSON-LD interoperability. This enables, for instance, frontend developers
 * to build UIs with familiar REST/JSON patterns on top of knowledge graph backends. To achieve this:
 *
 * - only the [compacted document form](https://www.w3.org/TR/json-ld11/#compacted-document-form) is supported,
 *   which uses short property names and nested objects just like regular JSON
 *
 * - property names ([JSON-LD terms](https://www.w3.org/TR/json-ld11/#terms)) are restricted to [ECMAScript
 * identifiers](https://262.ecma-international.org/15.0/#sec-names-and-keywords), enabling property access with dot
 * notation; this excludes [JSON-LD keywords](https://www.w3.org/TR/json-ld11/#keywords) (`@id`, `@type`, etc.), [blank
 * node identifiers](https://www.w3.org/TR/json-ld11/#identifying-blank-nodes) (`_:`), and arbitrary property names;
 * mapping from property names to IRIs, keyword and arbitrary strings may still be managed by an application-provided
 * [`@context`](https://www.w3.org/TR/json-ld11/#the-context) object
 *
 * - values are native JSON primitives (`boolean`, `number`, `string`) without support for
 *   [typed literals](https://www.w3.org/TR/json-ld11/#typed-values) with arbitrary datatypes; property-specific
 *   datatype coercion may still be handled by an application-provided `@context` object
 *
 * - {@link Dictionary | language maps}, which map to JSON-LD
 *   [`@language` containers](https://www.w3.org/TR/json-ld11/#language-indexing), don't support
 *   [`@none`](https://www.w3.org/TR/json-ld11/#dfn-none) keys for plain literals; for mixed non-localized/localized
 *   content use `string` | {@link Dictionary} union types or [`zxx`](https://iso639-3.sil.org/code/zxx) tags within
 *   a dictionary
 *
 * **Data Model**
 *
 * The data model centers on {@link Resource | resources} — entities identified by web addresses (IRIs) that can be
 * linked together into a graph. Unlike isolated JSON documents, linked resources form a web of interconnected data
 * where relationships can be traversed across system boundaries.
 *
 * **Resources**
 *
 * A {@link Resource} can appear in two forms:
 *
 * - **reference**: just an IRI string pointing to a resource defined elsewhere
 * - **description**: an object with properties that describe the resource
 *
 * ```typescript
 * // reference: points to a resource without describing it
 *
 * const userRef: Resource = "https://example.org/users/123";
 *
 * // description: provides properties about the resource
 *
 * const userDesc: Resource = {
 *   id: "https://example.org/users/123",
 *   name: "Alice",
 *   email: "alice@example.org"
 * };
 * ```
 *
 * The `id` property corresponds to `@id` in JSON-LD and identifies the resource globally. A description without an
 * `id` represents an anonymous (blank) node—useful for nested structures that don't need their own identity:
 *
 * ```typescript
 * const user: Resource = {
 *   id: "https://example.org/users/123",
 *   name: "Alice",
 *   address: {              // anonymous nested resource
 *     street: "Via Roma 1",
 *     city: "Rome",
 *     zip: "00100"
 *   }
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
 * **Internationalized Text**
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
 * APIs can return compact references for efficiency or expanded descriptions for convenience. Clients may
 * control the response shape through query parameters or request headers, depending on API capabilities.
 * The same data model handles both representations seamlessly.
 *
 * @see [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)
 * @see [RFC 5646 - Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)
 *
 * @module index
 */

import { Identifier } from "@metreeca/core";
import { IRI, Tag } from "@metreeca/core/network";


/**
 * Linked data resource.
 *
 * Represents resources in JSON-LD documents, supporting both compact references and detailed descriptions.
 * Use {@link IRI} form for simple references, or property map form to include resource data inline.
 *
 * - **reference**: an {@link IRI} string identifying a resource
 * - **description**: a property map where each property holds {@link Values}; may include an `id` property
 *   mapped to `@id` for resource identification
 */
export type Resource =
	| IRI
	| { readonly [property in Identifier]: Values }

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
	| readonly Value[]
	| Dictionary

/**
 * Model value.
 *
 * Represents property values in resources, supporting both primitive data ({@link Literal}) and
 * nested resource references/descriptions ({@link Resource}).
 */
export type Value =
	| Literal
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
 * @see [RFC 5646 - Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)
 * @see [ISO 639-3 `zxx` - No Linguistic Content](https://iso639-3.sil.org/code/zxx)
 */
export type Dictionary =
	| { readonly [tag: Tag]: string }
	| { readonly [tag: Tag]: readonly string[] }
