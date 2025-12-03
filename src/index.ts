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
 */
export type Dictionary<T extends Text = Text> = {

	readonly [tag: Tag]: T

}

/**
 * Text value for language-tagged content.
 *
 * Can be a single string or an array of strings.
 */
export type Text =
	| string
	| readonly string[]


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
 * - Properties can contain any {@link Values} type
 * - Arrays represent collections and cannot be nested
 * - Empty arrays are ignored during processing
 * - Properties cannot use empty strings or JSON-LD keywords as names (enforced by {@link Properties})
 */
export type Resource = {

	readonly [K in string]: Values

}

/**
 * Property name constraints for resource-like objects.
 *
 * Enforces that resource property names cannot be empty strings or JSON-LD keywords
 * (identifiers starting with `@`).
 *
 * @see {@link Resource}
 */
export type Properties = {

	readonly [K in "" | `@${string}`]?: never

}
