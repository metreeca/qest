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

import { describe, expect, it } from "vitest";
import { isLanguage, language, Resource } from "./index.js";


describe("Properties", () => {

	it("should exclude empty string labels from Resource", () => {

		// Positive: valid keys work

		const valid: Resource = {
			name: "John",
			age: 30
		};

		expect(valid).toBeDefined();

		// Negative: empty string excluded

		const invalid: Resource = {
			// @ts-expect-error - Empty string key should be excluded
			"": "value"
		};

		expect(invalid).toBeDefined();
	});

	it("should exclude @-prefixed keyword labels from Resource", () => {

		// Negative: @-prefixed keys are excluded

		const invalid1: Resource = {
			// @ts-expect-error - @id is reserved
			"@id": "value"
		};

		const invalid2: Resource = {
			// @ts-expect-error - @type is reserved
			"@type": "value"
		};

		const invalid3: Resource = {
			// @ts-expect-error - @context is reserved
			"@context": "value"
		};

		const invalid4: Resource = {
			// @ts-expect-error - @language is reserved
			"@language": "value"
		};

		expect(invalid1).toBeDefined();
		expect(invalid2).toBeDefined();
		expect(invalid3).toBeDefined();
		expect(invalid4).toBeDefined();
	});

	it("should reject objects with both valid and reserved keys", () => {

		// Negative: empty string should be rejected even with valid keys
		const invalid1: Resource = {
			name: "John",
			// @ts-expect-error - Empty string should be rejected even with valid keys
			"": "empty"
		};

		// Negative: @id should be rejected even with valid keys
		const invalid2: Resource = {
			name: "John",
			// @ts-expect-error - @id is reserved
			"@id": "value"
		};

		expect(invalid1).toBeDefined();
		expect(invalid2).toBeDefined();
	});

});

describe("Language", test => {

	const languages = {
		valid: [
			"en",
			"fr",
			"de",
			"eng",
			"fra",
			"zh-Hans",
			"zh-Hant",
			"en-US",
			"en-GB",
			"fr-CA",
			"es-419",
			"sr-Latn-RS",
			"zh-Hans-CN",
			"en-US-x-private"
		],
		invalid: [
			{ value: "", reason: "empty string" },
			{ value: "e", reason: "single character" },
			{ value: "toolongprimary", reason: "primary subtag > 8 chars" },
			{ value: "en_US", reason: "underscore separator" },
			{ value: "en US", reason: "space separator" },
			{ value: "en-", reason: "trailing hyphen" },
			{ value: "-en", reason: "leading hyphen" },
			{ value: "en--US", reason: "double hyphen" },
			{ value: "123", reason: "numeric only primary" },
			{ value: "en-123456789", reason: "variant > 8 chars" },
			{ value: "http://example.com", reason: "contains invalid chars" }
		]
	};


	describe("isLanguage()", () => {

		it("should return true for valid language tags", () => {
			languages.valid.forEach(value => {
				expect(isLanguage(value)).toBe(true);
			});
		});

		it("should return false for invalid language tags", () => {
			languages.invalid.forEach(({ value }) => {
				expect(isLanguage(value)).toBe(false);
			});
		});

		it("should return false for non-string values", () => {
			expect(isLanguage(null)).toBe(false);
			expect(isLanguage(undefined)).toBe(false);
			expect(isLanguage(123)).toBe(false);
			expect(isLanguage({})).toBe(false);
			expect(isLanguage([])).toBe(false);
		});

	});

	describe("language()", () => {

		it("should create branded Language from valid strings", () => {
			languages.valid.forEach(value => {
				expect(() => language(value)).not.toThrow();
				const result = language(value);
				expect(typeof result).toBe("string");
				expect(result).toBe(value);
			});
		});

		it("should throw RangeError for invalid language tags", () => {
			languages.invalid.forEach(({ value }) => {
				expect(() => language(value)).toThrow(RangeError);
			});
		});

		it("should throw RangeError with descriptive message", () => {
			expect(() => language("invalid tag")).toThrow("invalid language tag <invalid tag>");
		});

	});

});
