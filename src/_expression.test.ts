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
import { expression, isExpression, isPath, path } from "./_expression.js";


describe("Paths", () => {

	const validPaths = [
		"",
		"name",
		"email",
		"address.city",
		"author.name",
		"user.profile.avatar",
		"property_name",
		"property-name",
		"property123",
		".name",
		".address.city",
		"my property",
		"my\\ property",
		"property\\.name",
		"name:with:colons"
	];

	const invalidPaths = [
		{ value: ".", reason: "just a dot" },
		{ value: "@id", reason: "JSON-LD keyword" },
		{ value: "@type", reason: "JSON-LD keyword" },
		{ value: "name\\", reason: "trailing backslash" },
		{ value: "name.", reason: "ends with dot" },
		{ value: "name..city", reason: "empty step (double dot)" }
	];

	describe("isPath() type guard", () => {

		it("should return true for valid property paths", () => {
			validPaths.forEach(value => {
				expect(isPath(value)).toBe(true);
			});
		});

		it("should return false for invalid property paths", () => {
			invalidPaths.forEach(({ value }) => {
				expect(isPath(value)).toBe(false);
			});
		});

		it("should return false for non-string values", () => {
			expect(isPath(null)).toBe(false);
			expect(isPath(undefined)).toBe(false);
			expect(isPath(123)).toBe(false);
			expect(isPath({})).toBe(false);
			expect(isPath([])).toBe(false);
		});

	});

	describe("path() constructor", () => {

		it("should create branded Path from valid strings", () => {
			validPaths.forEach(value => {
				expect(() => path(value)).not.toThrow();
				const result = path(value);
				expect(typeof result).toBe("string");
				expect(result).toBe(value);
			});
		});

		it("should throw RangeError for invalid property paths", () => {
			invalidPaths.forEach(({ value }) => {
				expect(() => path(value)).toThrow(RangeError);
			});
		});

		it("should throw RangeError with descriptive message", () => {
			expect(() => path("@type")).toThrow("invalid property path <@type>");
			expect(() => path(".")).toThrow("invalid property path <.>");
		});

	});

});

describe("Expressions", () => {

	const validExpressions = [
		"",
		"name",
		"address.city",
		".name",
		"count:name",
		"min:max:title",
		"abs:address.city",
		"round:year:description",
		"count:"
	];

	const invalidExpressions = [
		{ value: "@id", reason: "JSON-LD keyword in path" },
		{ value: "invalid:name", reason: "invalid transform name" },
		{ value: "count:@type", reason: "JSON-LD keyword after transform" },
		{ value: ".name.", reason: "trailing dot in path" },
		{ value: "count:name..city", reason: "empty step in path" }
	];

	describe("isExpression() type guard", () => {

		it("should return true for valid expressions", () => {
			validExpressions.forEach(value => {
				expect(isExpression(value)).toBe(true);
			});
		});

		it("should return false for invalid expressions", () => {
			invalidExpressions.forEach(({ value }) => {
				expect(isExpression(value)).toBe(false);
			});
		});

		it("should return false for non-string values", () => {
			expect(isExpression(null)).toBe(false);
			expect(isExpression(undefined)).toBe(false);
			expect(isExpression(123)).toBe(false);
			expect(isExpression({})).toBe(false);
			expect(isExpression([])).toBe(false);
		});

	});

	describe("expression() constructor", () => {

		it("should create branded Expression from valid strings", () => {
			validExpressions.forEach(value => {
				expect(() => expression(value)).not.toThrow();
				const result = expression(value);
				expect(typeof result).toBe("string");
				expect(result).toBe(value);
			});
		});

		it("should throw RangeError for invalid expressions", () => {
			invalidExpressions.forEach(({ value }) => {
				expect(() => expression(value)).toThrow(RangeError);
			});
		});

		it("should throw RangeError with descriptive message", () => {
			expect(() => expression("@id")).toThrow("invalid query expression <@id>");
		});

	});

});
