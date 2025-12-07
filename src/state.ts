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
 * Complete resource update model.
 *
 * Defines complete update specifications for linked data {@link Resource | resources}. Properties are set to
 * new {@link Values | values}; unlisted properties are removed. This enables complete state updates,
 * typically using HTTP PUT operations.
 *
 * **Replacing State**
 *
 * Provide the complete desired state of the resource:
 *
 * ```typescript
 * const state: State = {
 *   name: "Bob",
 *   email: "bob@example.org",
 *   tags: ["featured", "urgent"],
 *   active: true
 * };
 * ```
 *
 * **Important:** Unlike partial updates ({@link Patch}), state replacement is total — properties not included
 * in the state are removed from the resource, while partial updates leave unlisted properties unchanged.
 *
 * **Important**: Empty arrays are treated as property deletions, following set semantics where an empty set
 * is equivalent to absence.
 *
 * **Linked Resources**
 *
 * References to linked resources can use either IRI strings or nested descriptions, following the same
 * {@link Resource} model as in regular resource data.
 *
 * **Important**
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
 * const state: State = {
 *   name: "Annual Report 2024",
 *   author: "https://example.org/users/123",
 *   publisher: "https://example.org/orgs/acme"
 * };
 *
 * // Using nested descriptions with only the identifier property (always valid)
 *
 * const state: State = {
 *   name: "Annual Report 2024",
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
 * const state: State = {
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
 * @module
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.4 RFC 9110 - HTTP PUT Method}
 */

import { Identifier } from "@metreeca/core";
import { Resource, Values } from "./index.js";

/**
 * Complete resource state.
 *
 * Properties map to {@link Values} representing the complete desired state. Unlisted properties are removed.
 */
export type State = {

	readonly [property in Identifier]: Values

}
