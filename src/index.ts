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
 * Core type definitions for representing linked data resources and values.
 *
 * Provides a controlled JSON-LD subset for working with structured data, including resource objects
 * and language-tagged values.
 *
 * @module index
 */

import { Tag } from "@metreeca/core/network";
import { validate } from "./validators/index.js";
import { $resource } from "./validators/resource.js";


/**
 * Pattern for valid identifier names.
 *
 * Matches JavaScript identifier syntax: starts with letter, underscore, or dollar sign,
 * followed by any combination of letters, digits, underscores, or dollar signs.
 */
export const Identifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Model value.
 */
export type Value =
	| Literal
	| Resource

/**
 * Model value set.
 *
 * A single value, a language map, or an array of values.
 *
 * Arrays represent sets of values: duplicate values are ignored and ordering is immaterial.
 * Empty arrays are ignored.
 */
export type Values =
	| Value
	| Dictionary
	| readonly Value[]


/**
 * Literal values for resource properties.
 *
 * JavaScript primitives used as property values in resources.
 */
export type Literal =
	| boolean
	| number
	| string

/**
 * Language-tagged dictionary for internationalized text values.
 *
 * Maps language {@link Tag | tag} to localized text values for representing multilingual content.
 *
 * @typeParam T The text value type
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html | RFC 5646 - Tags for Identifying Languages}
 */
export type Dictionary<T extends string | readonly string[] = string | readonly string[]> = {

	readonly [tag: Tag]: T

}


/**
 * Resource object.
 *
 * Represents a resource as a collection of properties mapped to values, following familiar
 * JSON object conventions. Each property can hold literals, nested resources, arrays, or
 * language-tagged dictionaries.
 *
 * @remarks
 *
 * Resources are immutable and follow these rules:
 *
 * - Property names must match the {@link Identifier} pattern
 * - Property values must be non-null literals, resources, or arrays (no nested arrays)
 * - Arrays represent sets: duplicate values are ignored and ordering is immaterial
 * - Empty arrays are ignored during processing
 *
 * @see {@link https://datatracker.ietf.org/doc/rfc9535/ | RFC 9535 - JSONPath Query Expressions}
 */
export type Resource = {

	readonly [K in string]: Values

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a validated, immutable {@link Resource} object.
 *
 * Validates the resource structure against {@link Resource} type constraints, recursively checking
 * all nested structures, and returns a deeply frozen copy that cannot be modified.
 *
 * @typeParam T The specific resource type
 *
 * @param resource The resource object to validate and freeze
 *
 * @returns The validated, immutable resource
 *
 * @throws {TypeError} If the resource structure violates {@link Resource} constraints
 */
export function Resource<T extends Resource>(resource: T): T {
	return validate(resource, $resource);
}
