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
 * Core type definitions for representing linked data resources, values, and query operations.
 *
 * Provides a controlled JSON-LD subset for working with structured data, including resource objects,
 * language-tagged values, query constraints, and data models with computed properties.
 *
 * @module index
 */

import { isString } from "@metreeca/core";


/**
 * Matches BCP47 language tag pattern per RFC 5646 § 2.1
 *
 * Language-Tag = langtag / privateuse / grandfathered
 * langtag = language ["-" script] ["-" region] *("-" variant) *("-" extension) ["-" privateuse]
 *
 * @remarks
 *
 * Grandfathered tags are omitted from this regex for simplicity.
 */
const BCP47Pattern = (() => {

	const language = "(?:[a-z]{2,3}(?:-[a-z]{3}){0,3}|[a-z]{4}|[a-z]{5,8})"; // 2-3 + extlang / 4 / 5-8 letters
	const script = "(?:-[a-z]{4})?"; // optional 4-letter script
	const region = "(?:-(?:[a-z]{2}|[0-9]{3}))?"; // optional 2-letter or 3-digit region
	const variant = "(?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*"; // zero or more variants
	const extension = "(?:-[0-9a-wy-z](?:-[a-z0-9]{2,8})+)*"; // zero or more extensions
	const privateUse = "(?:-x(?:-[a-z0-9]{1,8})+)?"; // optional private use
	const privateOnly = "x(?:-[a-z0-9]{1,8})+"; // standalone private use tag
	const langtag = `${language}${script}${region}${variant}${extension}${privateUse}`;

	return new RegExp(`^(?:${langtag}|${privateOnly})$`, "i");

})();


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
 * Maps {@link Language} tags to localized text values for representing multilingual content.
 *
 * @typeParam T The text value type
 */
export type Dictionary<T extends Text = Text> = {

	readonly [language: Language]: T

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
 * Language tag as defined by BCP47/RFC 5646.
 *
 * A language tag identifies a natural language (e.g., "en" for English, "fr-CA" for Canadian French)
 * and consists of subtags for language, script, region, variant, and extension components.
 *
 * **Grammar**
 *
 * Matches BCP47 language tag pattern per RFC 5646 § 2.1:
 *
 * ```
 * Language-Tag = langtag / privateuse / grandfathered
 * langtag = language ["-" script] ["-" region] *("-" variant) *("-" extension) ["-" privateuse]
 * ```
 *
 * Grandfathered tags are omitted from validation for simplicity.
 *
 * @remarks
 *
 * This opaque type ensures that only validated BCP47 language tags can be used where a language tag is expected,
 * preventing raw strings from being passed directly without validation.
 *
 * The brand is a compile-time construct with no runtime overhead.
 *
 * @see {@link language} - Construct validated language tags
 * @see {@link isLanguage} - Type guard for language tag validation
 * @see {@link Dictionary} - Language-tagged text dictionary
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html | RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes | ISO 639-2 Language Codes}
 */
export type Language = string & {

	readonly __brand: unique symbol

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
 * - Properties can contain any {@link Values} type
 * - Arrays represent collections and cannot be nested
 * - Empty arrays are ignored during processing
 * - Properties cannot use empty strings or JSON-LD keywords as names (enforced by {@link Properties})
 */
export type Resource = Properties & {

	readonly [K in string]: Values

}

/**
 * Property name constraints for resource objects.
 *
 * Enforces that resource property names cannot be empty strings or JSON-LD keywords
 * (identifiers starting with `@`).
 *
 * @see {@link Resource}
 */
export type Properties = {

	readonly [K in "" | `@${string}`]?: never

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Type guard for validating BCP47 language tags.
 *
 * @param value Value to validate as a language tag
 *
 * @returns `true` if the value is a non-empty string matching the BCP47 pattern
 *
 * @see {@link Language} - Language tag type and grammar specification
 * @see {@link language} - Construct validated language tags
 */
export function isLanguage(value: unknown): value is Language {
	return isString(value) && value.length > 0 && BCP47Pattern.test(value);
}

/**
 * Creates a validated language tag from a string.
 *
 * @param value String to convert to a language tag
 *
 * @returns The validated language tag
 *
 * @throws RangeError If the value is not a valid BCP47 language tag
 */
export function language(value: string): Language {

	if ( !isLanguage(value) ) {
		throw new RangeError(`invalid language tag <${value}>`);
	}

	return value;
}
