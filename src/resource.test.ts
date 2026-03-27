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

import { describe, expect, it } from "vitest";
import { defaultBase } from "./index.js";
import { isLocalised, isResource, isValue, isValues } from "./resource.core.js";
import { decodeResource, encodeResource, type Resource } from "./resource.js";


describe("guards", () => {

	describe("isResource", () => {

		it("should accept empty object", async () => {
			expect(isResource({})).toBeTruthy();
		});

		it("should accept object with primitive properties", async () => {
			expect(isResource({ id: "/test", name: "Test", count: 42, active: true })).toBeTruthy();
		});

		it("should accept object with nested resource", async () => {
			expect(isResource({ id: "/test", nested: { id: "/nested" } })).toBeTruthy();
		});

		it("should accept object with array values", async () => {
			expect(isResource({ tags: ["a", "b", "c"] })).toBeTruthy();
		});

		it("should accept object with local values", async () => {
			expect(isResource({ name: { en: "Hello", de: "Hallo" } })).toBeTruthy();
		});

		it("should accept object with locals values", async () => {
			expect(isResource({ tags: { en: ["hello", "hi"], de: ["hallo"] } })).toBeTruthy();
		});

		it("should accept object with indexed values", async () => {
			expect(isResource({ data: { key1: "value1", key2: 42 } })).toBeTruthy();
		});

		it("should reject null", async () => {
			expect(isResource(null)).toBeFalsy();
		});

		it("should reject primitives", async () => {
			expect(isResource("string")).toBeFalsy();
			expect(isResource(42)).toBeFalsy();
			expect(isResource(true)).toBeFalsy();
		});

		it("should reject arrays", async () => {
			expect(isResource([])).toBeFalsy();
			expect(isResource([{ id: "/test" }])).toBeFalsy();
		});

	});

	describe("isValues", () => {

		it("should accept literals", async () => {
			expect(isValues(true)).toBeTruthy();
			expect(isValues(42)).toBeTruthy();
			expect(isValues("string")).toBeTruthy();
		});

		it("should accept reference", async () => {
			expect(isValues("/resource")).toBeTruthy();
		});

		it("should accept resource", async () => {
			expect(isValues({ id: "/test" })).toBeTruthy();
		});

		it("should accept local", async () => {
			expect(isValues({ en: "Hello", de: "Hallo" })).toBeTruthy();
		});

		it("should accept locals", async () => {
			expect(isValues({ en: ["hello", "hi"], de: ["hallo"] })).toBeTruthy();
		});

		it("should accept array of values", async () => {
			expect(isValues(["a", "b", "c"])).toBeTruthy();
			expect(isValues([1, 2, 3])).toBeTruthy();
			expect(isValues([{ id: "/a" }, { id: "/b" }])).toBeTruthy();
		});

		it("should accept empty array", async () => {
			expect(isValues([])).toBeTruthy();
		});

		it("should reject null", async () => {
			expect(isValues(null)).toBeFalsy();
		});

		it("should reject undefined", async () => {
			expect(isValues(undefined)).toBeFalsy();
		});

		it("should reject array with null elements", async () => {
			expect(isValues([null])).toBeFalsy();
			expect(isValues([1, null, 2])).toBeFalsy();
		});

	});

	describe("isValue", () => {

		it("should accept literals", async () => {
			expect(isValue(true)).toBeTruthy();
			expect(isValue(42)).toBeTruthy();
			expect(isValue("string")).toBeTruthy();
		});

		it("should accept reference", async () => {
			expect(isValue("/resource")).toBeTruthy();
		});

		it("should accept resource", async () => {
			expect(isValue({ id: "/test", name: "Test" })).toBeTruthy();
		});

		it("should reject null", async () => {
			expect(isValue(null)).toBeFalsy();
		});

		it("should reject arrays", async () => {
			expect(isValue([])).toBeFalsy();
			expect(isValue(["a", "b"])).toBeFalsy();
		});

	});

	describe("isLocalised", () => {

		it("should accept single-valued language map", async () => {
			expect(isLocalised({ en: "Hello" })).toBeTruthy();
			expect(isLocalised({ en: "Hello", de: "Hallo", fr: "Bonjour" })).toBeTruthy();
		});

		it("should accept multi-valued language map", async () => {
			expect(isLocalised({ en: ["Hello", "Hi"] })).toBeTruthy();
			expect(isLocalised({ en: ["Hello"], de: ["Hallo", "Guten Tag"] })).toBeTruthy();
		});

		it("should accept empty arrays", async () => {
			expect(isLocalised({ en: [] })).toBeTruthy();
		});

		it("should accept empty object", async () => {
			expect(isLocalised({})).toBeTruthy();
		});

		it("should accept plain string shorthand", async () => {
			expect(isLocalised("hello")).toBeTruthy();
			expect(isLocalised("")).toBeTruthy();
		});

		it("should accept plain string array shorthand", async () => {
			expect(isLocalised(["a", "b"])).toBeTruthy();
			expect(isLocalised([])).toBeTruthy();
		});

		it("should reject mixed scalar/array content", async () => {
			expect(isLocalised({ en: "hello", fr: ["bonjour"] })).toBeFalsy();
			expect(isLocalised({ en: ["hello"], fr: "bonjour" })).toBeFalsy();
		});

		it("should reject invalid language tags", async () => {
			expect(isLocalised({ invalid_tag: "value" })).toBeFalsy();
			expect(isLocalised({ "123": "value" })).toBeFalsy();
			expect(isLocalised({ invalid_tag: ["value"] })).toBeFalsy();
		});

		it("should reject non-string values", async () => {
			expect(isLocalised({ en: 42 })).toBeFalsy();
			expect(isLocalised({ en: null })).toBeFalsy();
		});

		it("should reject non-string array elements", async () => {
			expect(isLocalised({ en: [42] })).toBeFalsy();
			expect(isLocalised({ en: [null] })).toBeFalsy();
		});

		it("should reject non-string/non-array primitives", async () => {
			expect(isLocalised(42)).toBeFalsy();
			expect(isLocalised(null)).toBeFalsy();
		});

	});

});

describe("codecs", () => {

	describe("encodeResource", () => {

		describe("base option", () => {

			it("should accept absolute hierarchical IRI base", async () => {
				const resource: Resource = { id: "https://example.com/products/42" };

				expect(() => encodeResource(resource, { base: "https://example.com/" })).not.toThrow();
			});

			it("should reject relative IRI base", async () => {
				const resource: Resource = { id: "/products/42" };

				expect(() => encodeResource(resource, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should accept path-absolute IRI base", async () => {
				const resource: Resource = { id: "app:/products/42" };

				expect(encodeResource(resource, { base: defaultBase }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

			it("should internalize absolute IRI to root-relative", async () => {
				const resource: Resource = { id: "https://example.com/products/42" };

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

			it("should preserve absolute IRI with different origin", async () => {
				const resource: Resource = { id: "https://other.com/products/42" };

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "https://other.com/products/42" }));
			});

			it("should preserve root-relative IRI", async () => {
				const resource: Resource = { id: "/products/42" };

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

			it("should preserve non-root-relative IRIs and other strings", async () => {
				const resource: Resource = {
					relative: "../products/42",
					plain: "Widget",
					nested: { name: "Acme Corp", path: "vendors/acme" }
				};

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({
						relative: "../products/42",
						plain: "Widget",
						nested: { name: "Acme Corp", path: "vendors/acme" }
					}));
			});

			it("should internalize IRIs recursively in nested structures", async () => {
				const resource: Resource = {
					id: "https://example.com/products/42",
					vendor: {
						id: "https://example.com/vendors/acme",
						name: "Acme Corp"
					},
					categories: ["https://example.com/categories/electronics", "https://example.com/categories/home"]
				};

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({
						id: "/products/42",
						vendor: {
							id: "/vendors/acme",
							name: "Acme Corp"
						},
						categories: ["/categories/electronics", "/categories/home"]
					}));
			});

		});

		describe("indent option", () => {

			it("should not indent by default", async () => {
				const resource: Resource = { id: "/products/42", name: "Widget" };

				expect(encodeResource(resource))
					.toBe(JSON.stringify(resource));
			});

			it("should indent with 2 spaces for true", async () => {
				const resource: Resource = { id: "/products/42", name: "Widget" };

				expect(encodeResource(resource, { indent: true }))
					.toBe(JSON.stringify(resource, null, 2));
			});

			it("should indent with specified number of spaces", async () => {
				const resource: Resource = { id: "/products/42", name: "Widget" };

				expect(encodeResource(resource, { indent: 4 }))
					.toBe(JSON.stringify(resource, null, 4));
			});

			it("should not indent for false", async () => {
				const resource: Resource = { id: "/products/42", name: "Widget" };

				expect(encodeResource(resource, { indent: false }))
					.toBe(JSON.stringify(resource));
			});

			it("should not indent for zero", async () => {
				const resource: Resource = { id: "/products/42", name: "Widget" };

				expect(encodeResource(resource, { indent: 0 }))
					.toBe(JSON.stringify(resource));
			});

			it("should not indent for negative numbers", async () => {
				const resource: Resource = { id: "/products/42", name: "Widget" };

				expect(encodeResource(resource, { indent: -1 }))
					.toBe(JSON.stringify(resource));
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const resource: Resource = { id: "app:/products/42" };

			expect(encodeResource(resource))
				.toBe(JSON.stringify({ id: "/products/42" }));
		});

		it("should encode empty resource", async () => {
			const resource: Resource = {};

			expect(encodeResource(resource)).toBe(JSON.stringify(resource));
		});

		it("should encode resource with primitive properties", async () => {
			const resource: Resource = {
				id: "app:/products/42",
				name: "Widget",
				price: 29.99,
				available: true
			};

			expect(encodeResource(resource)).toBe(JSON.stringify({
				id: "/products/42",
				name: "Widget",
				price: 29.99,
				available: true
			}));
		});

		it("should encode resource with nested resource", async () => {
			const resource: Resource = {
				id: "/products/42",
				vendor: {
					id: "/vendors/acme",
					name: "Acme Corp"
				}
			};

			expect(encodeResource(resource)).toBe(JSON.stringify(resource));
		});

		it("should encode resource with array values", async () => {
			const resource: Resource = {
				id: "/products/42",
				categories: ["/categories/electronics", "/categories/home"]
			};

			expect(encodeResource(resource)).toBe(JSON.stringify(resource));
		});

		it("should encode resource with dictionary", async () => {
			const resource: Resource = {
				id: "/products/42",
				name: {
					en: "Widget",
					de: "Gerät"
				}
			};

			expect(encodeResource(resource)).toBe(JSON.stringify(resource));
		});

	});

	describe("decodeResource", () => {

		describe("base option", () => {

			it("should accept absolute hierarchical IRI base", async () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(() => decodeResource(json, { base: "https://example.com/" })).not.toThrow();
			});

			it("should reject relative IRI base", async () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(() => decodeResource(json, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should accept path-absolute IRI base", async () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(decodeResource(json, { base: defaultBase }))
					.toEqual({ id: "app:/products/42" });
			});

			it("should resolve root-relative IRI to absolute", async () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(decodeResource(json, { base: "https://example.com/" }))
					.toEqual({ id: "https://example.com/products/42" });
			});

			it("should preserve absolute IRI", async () => {
				const json = JSON.stringify({ id: "https://other.com/products/42" });

				expect(decodeResource(json, { base: "https://example.com/" }))
					.toEqual({ id: "https://other.com/products/42" });
			});

			it("should preserve non-root-relative IRIs and other strings", async () => {
				const json = JSON.stringify({
					relative: "../products/42",
					plain: "Widget",
					nested: { name: "Acme Corp", path: "vendors/acme" }
				});

				expect(decodeResource(json, { base: "https://example.com/" }))
					.toEqual({
						relative: "../products/42",
						plain: "Widget",
						nested: { name: "Acme Corp", path: "vendors/acme" }
					});
			});

			it("should resolve IRIs recursively in nested structures", async () => {
				const json = JSON.stringify({
					id: "/products/42",
					vendor: {
						id: "/vendors/acme",
						name: "Acme Corp"
					},
					categories: ["/categories/electronics", "/categories/home"]
				});

				expect(decodeResource(json, { base: "https://example.com/" }))
					.toEqual({
						id: "https://example.com/products/42",
						vendor: {
							id: "https://example.com/vendors/acme",
							name: "Acme Corp"
						},
						categories: ["https://example.com/categories/electronics", "https://example.com/categories/home"]
					});
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const json = JSON.stringify({ id: "/products/42" });

			expect(decodeResource(json))
				.toEqual({ id: "app:/products/42" });
		});

		it("should decode empty resource", async () => {
			const resource: Resource = {};

			expect(decodeResource(JSON.stringify(resource))).toEqual(resource);
		});

		it("should decode resource with primitive properties", async () => {
			const json = JSON.stringify({
				id: "/products/42",
				name: "Widget",
				price: 29.99,
				available: true
			});

			expect(decodeResource(json)).toEqual({
				id: "app:/products/42",
				name: "Widget",
				price: 29.99,
				available: true
			});
		});

		it("should decode resource with nested resource", async () => {
			const json = JSON.stringify({
				id: "/products/42",
				vendor: {
					id: "/vendors/acme",
					name: "Acme Corp"
				}
			});

			expect(decodeResource(json)).toEqual({
				id: "app:/products/42",
				vendor: {
					id: "app:/vendors/acme",
					name: "Acme Corp"
				}
			});
		});

		it("should roundtrip with encodeResource", async () => {
			const resource: Resource = {
				id: "app:/products/42",
				name: "Widget",
				price: 29.99
			};

			expect(decodeResource(encodeResource(resource))).toEqual(resource);
		});

		it("should throw on invalid JSON", async () => {
			expect(() => decodeResource("not valid json")).toThrow();
		});

		describe("lenient option", () => {

			it("should throw on structurally invalid input by default", async () => {
				expect(() => decodeResource(JSON.stringify([1, 2, 3]))).toThrow(TypeError);
			});

			it("should skip structural validation when lenient", async () => {
				expect(() => decodeResource(JSON.stringify([1, 2, 3]), { lenient: true })).not.toThrow();
			});

			it("should still throw on syntax errors when lenient", async () => {
				expect(() => decodeResource("not valid json", { lenient: true })).toThrow();
			});

		});

	});


});
