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
 * Partial update operations for incremental resource modifications.
 *
 * Defines partial update specifications for linked data {@link Resource | resources}. Properties can be set to
 * new {@link Values | values} or deleted using `null`; unlisted properties remain unchanged. This enables efficient
 * incremental updates, for instance using HTTP PATCH operations.
 *
 * **Updating Properties**
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
 * **Deleting Properties**
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
 * **Combined Updates**
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
 * **Linked Resources**
 *
 * References to linked resources can use either IRI strings or nested descriptions, following the same
 * {@link Resource} model as in regular resource data.
 *
 * **Important**:
 *
 * - Nested resource descriptions containing properties beyond the resource identifier are only accepted if
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
 * // Using nested descriptions with only the identifier property (always valid)
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
 * // Using nested descriptions with additional properties (must be declared as embedded)
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
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5789 RFC 5789 - HTTP PATCH Method}
 *
 * @module
 */

import { Values } from "./value.js";

/**
 * Partial resource update.
 *
 * Properties map to {@link Values} for updates or `null` for deletions. Empty arrays are equivalent to `null`.
 */
export type Patch = {

	readonly [K in string]: null | Values

}
