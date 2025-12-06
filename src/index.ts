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

import { Identifier } from "@metreeca/core";
import { IRI, Tag } from "@metreeca/core/network";
import { $resource, validate } from "./model.js";


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
 * Language-tagged map for internationalized text values.
 *
 * Maps language {@link Tag | tags} to localized text, supporting two cardinality patterns:
 *
 * - **single-valued**: one text value per language
 * - **multi-valued**: multiple text values per language
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html | RFC 5646 - Tags for Identifying Languages}
 */
export type Dictionary =
	| { readonly [tag: Tag]: string }
	| { readonly [tag: Tag]: readonly string[] }


/**
 * Linked data resource.
 *
 * Represents a resource in one of two forms:
 *
 * - **reference**: an {@link IRI} string identifying a resource
 * - **description**: a property map where each property holds literals, nested resources, arrays,
 *   or language-tagged {@link Dictionary | dictionaries}; may include an {@link IRI} property identifying the resource
 *
 * @remarks
 *
 * Resource descriptions are immutable and follow these rules:
 *
 * - Property names must be valid ECMAScript {@link Identifier | identifiers}
 * - Property values must be non-`null` literals, resources, or arrays (no nested arrays)
 * - Arrays represent sets: duplicate values are ignored and ordering is immaterial
 * - Empty arrays are ignored during processing
 *
 * @see {@link https://www.w3.org/TR/json-ld11/ | JSON-LD 1.1 - A JSON-based Serialization for Linked Data}
 */
export type Resource =
	| IRI
	| { readonly [property in Identifier]: Values }


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
