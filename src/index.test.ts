/*
 * Copyright © 2025-2026 Metreeca srl
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

import { isAny, isString } from "@metreeca/core";
import { describe, expect, it } from "vitest";
import { isIndexed, isLiteral, isReference } from "./index.core.js";


describe("guards", () => {

	describe("isIndexed", () => {

		it("should accept object with matching values", async () => {
			expect(isIndexed({ key1: "value1", key2: "value2" }, isString)).toBeTruthy();
		});

		it("should reject object with non-matching values", async () => {
			expect(isIndexed({ str: "value", num: 42 }, isString)).toBeFalsy();
		});

		it("should accept empty object", async () => {
			expect(isIndexed({}, isString)).toBeTruthy();
		});

		it("should reject primitives", async () => {
			expect(isIndexed("string", isAny)).toBeFalsy();
			expect(isIndexed(42, isAny)).toBeFalsy();
			expect(isIndexed(null, isAny)).toBeFalsy();
		});

		it("should reject arrays", async () => {
			expect(isIndexed([], isAny)).toBeFalsy();
			expect(isIndexed(["a", "b"], isAny)).toBeFalsy();
		});

	});

	describe("isLiteral", () => {

		it("should accept boolean", async () => {
			expect(isLiteral(true)).toBeTruthy();
			expect(isLiteral(false)).toBeTruthy();
		});

		it("should accept number", async () => {
			expect(isLiteral(42)).toBeTruthy();
			expect(isLiteral(3.14)).toBeTruthy();
			expect(isLiteral(0)).toBeTruthy();
			expect(isLiteral(-1)).toBeTruthy();
		});

		it("should accept string", async () => {
			expect(isLiteral("")).toBeTruthy();
			expect(isLiteral("hello")).toBeTruthy();
		});

		it("should reject null", async () => {
			expect(isLiteral(null)).toBeFalsy();
		});

		it("should reject undefined", async () => {
			expect(isLiteral(undefined)).toBeFalsy();
		});

		it("should reject objects", async () => {
			expect(isLiteral({})).toBeFalsy();
			expect(isLiteral({ value: 42 })).toBeFalsy();
		});

		it("should reject arrays", async () => {
			expect(isLiteral([])).toBeFalsy();
			expect(isLiteral([1, 2, 3])).toBeFalsy();
		});

	});

	describe("isReference", () => {

		it("should accept absolute IRI", async () => {
			expect(isReference("https://example.com/resource")).toBeTruthy();
		});

		it("should reject root-relative IRI", async () => {
			expect(isReference("/path/to/resource")).toBeFalsy();
		});

		it("should reject relative IRI", async () => {
			expect(isReference("relative/path")).toBeFalsy();
		});

		it("should reject empty string", async () => {
			expect(isReference("")).toBeFalsy();
		});

		it("should reject non-strings", async () => {
			expect(isReference(42)).toBeFalsy();
			expect(isReference(null)).toBeFalsy();
			expect(isReference({})).toBeFalsy();
		});

	});

});
