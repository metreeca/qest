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
import { Resource } from "./index.js";

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
