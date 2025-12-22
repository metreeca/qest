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
import {
	asIndexed, asLiteral, asLocal, asLocals, asPatch, asReference, asResource, asValue, asValues,
	decodePatch, decodeResource, encodePatch, encodeResource,
	isIndexed, isLiteral, isLocal, isLocals, isPatch, isReference, isResource, isValue, isValues
} from "./state.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("encodeResource()", () => {

	describe("base option", () => {

		it("should accept absolute hierarchical IRI base", async () => {
			const resource = asResource({ id: "https://example.com/products/42" });

			expect(() => encodeResource(resource, { base: "https://example.com/" })).not.toThrow();
		});

		it("should reject relative IRI base", async () => {
			const resource = asResource({ id: "/products/42" });

			expect(() => encodeResource(resource, { base: "/relative/path" })).toThrow(RangeError);
		});

		it("should reject opaque IRI base", async () => {
			const resource = asResource({ id: "/products/42" });

			expect(() => encodeResource(resource, { base: "app:/" })).toThrow(RangeError);
		});

		it("should internalize absolute IRI to root-relative", async () => {
			const resource = asResource({ id: "https://example.com/products/42" });

			expect(encodeResource(resource, { base: "https://example.com/" }))
				.toBe(JSON.stringify({ id: "/products/42" }));
		});

		it("should preserve absolute IRI with different origin", async () => {
			const resource = asResource({ id: "https://other.com/products/42" });

			expect(encodeResource(resource, { base: "https://example.com/" }))
				.toBe(JSON.stringify({ id: "https://other.com/products/42" }));
		});

		it("should preserve root-relative IRI", async () => {
			const resource = asResource({ id: "/products/42" });

			expect(encodeResource(resource, { base: "https://example.com/" }))
				.toBe(JSON.stringify({ id: "/products/42" }));
		});

		it("should preserve non-root-relative IRIs and other strings", async () => {
			const resource = asResource({
				relative: "../products/42",
				plain: "Widget",
				nested: { name: "Acme Corp", path: "vendors/acme" }
			});

			expect(encodeResource(resource, { base: "https://example.com/" }))
				.toBe(JSON.stringify({
					relative: "../products/42",
					plain: "Widget",
					nested: { name: "Acme Corp", path: "vendors/acme" }
				}));
		});

		it("should internalize IRIs recursively in nested structures", async () => {
			const resource = asResource({
				id: "https://example.com/products/42",
				vendor: {
					id: "https://example.com/vendors/acme",
					name: "Acme Corp"
				},
				categories: ["https://example.com/categories/electronics", "https://example.com/categories/home"]
			});

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

	it("should encode empty resource", async () => {
		const resource = asResource({});

		expect(encodeResource(resource)).toBe(JSON.stringify(resource));
	});

	it("should encode resource with primitive properties", async () => {
		const resource = asResource({
			id: "/products/42",
			name: "Widget",
			price: 29.99,
			available: true
		});

		expect(encodeResource(resource)).toBe(JSON.stringify(resource));
	});

	it("should encode resource with nested resource", async () => {
		const resource = asResource({
			id: "/products/42",
			vendor: {
				id: "/vendors/acme",
				name: "Acme Corp"
			}
		});

		expect(encodeResource(resource)).toBe(JSON.stringify(resource));
	});

	it("should encode resource with array values", async () => {
		const resource = asResource({
			id: "/products/42",
			categories: ["/categories/electronics", "/categories/home"]
		});

		expect(encodeResource(resource)).toBe(JSON.stringify(resource));
	});

	it("should encode resource with dictionary", async () => {
		const resource = asResource({
			id: "/products/42",
			name: {
				en: "Widget",
				de: "Gerät"
			}
		});

		expect(encodeResource(resource)).toBe(JSON.stringify(resource));
	});

});

describe("decodeResource()", () => {

	describe("base option", () => {

		it("should accept absolute hierarchical IRI base", async () => {
			const json = JSON.stringify({ id: "/products/42" });

			expect(() => decodeResource(json, { base: "https://example.com/" })).not.toThrow();
		});

		it("should reject relative IRI base", async () => {
			const json = JSON.stringify({ id: "/products/42" });

			expect(() => decodeResource(json, { base: "/relative/path" })).toThrow(RangeError);
		});

		it("should reject opaque IRI base", async () => {
			const json = JSON.stringify({ id: "/products/42" });

			expect(() => decodeResource(json, { base: "app:/" })).toThrow(RangeError);
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

	it("should decode empty resource", async () => {
		const resource = asResource({});

		expect(decodeResource(JSON.stringify(resource))).toEqual(resource);
	});

	it("should decode resource with primitive properties", async () => {
		const resource = asResource({
			id: "/products/42",
			name: "Widget",
			price: 29.99,
			available: true
		});

		expect(decodeResource(JSON.stringify(resource))).toEqual(resource);
	});

	it("should decode resource with nested resource", async () => {
		const resource = asResource({
			id: "/products/42",
			vendor: {
				id: "/vendors/acme",
				name: "Acme Corp"
			}
		});

		expect(decodeResource(JSON.stringify(resource))).toEqual(resource);
	});

	it("should roundtrip with encodeResource", async () => {
		const resource = asResource({
			id: "/products/42",
			name: "Widget",
			price: 29.99
		});

		expect(decodeResource(encodeResource(resource))).toEqual(resource);
	});

	it("should throw on invalid JSON", async () => {
		expect(() => decodeResource("not valid json")).toThrow();
	});

});


describe("encodePatch()", () => {

	describe("base option", () => {

		it("should accept absolute hierarchical IRI base", async () => {
			const patch = asPatch({ vendor: "https://example.com/vendors/acme" });

			expect(() => encodePatch(patch, { base: "https://example.com/" })).not.toThrow();
		});

		it("should reject relative IRI base", async () => {
			const patch = asPatch({ vendor: "/vendors/acme" });

			expect(() => encodePatch(patch, { base: "/relative/path" })).toThrow(RangeError);
		});

		it("should reject opaque IRI base", async () => {
			const patch = asPatch({ vendor: "/vendors/acme" });

			expect(() => encodePatch(patch, { base: "app:/" })).toThrow(RangeError);
		});

		it("should internalize absolute IRI to root-relative", async () => {
			const patch = asPatch({ vendor: "https://example.com/vendors/acme" });

			expect(encodePatch(patch, { base: "https://example.com/" }))
				.toBe(JSON.stringify({ vendor: "/vendors/acme" }));
		});

		it("should preserve absolute IRI with different origin", async () => {
			const patch = asPatch({ vendor: "https://other.com/vendors/acme" });

			expect(encodePatch(patch, { base: "https://example.com/" }))
				.toBe(JSON.stringify({ vendor: "https://other.com/vendors/acme" }));
		});

		it("should internalize IRIs recursively in nested structures", async () => {
			const patch = asPatch({
				vendor: {
					id: "https://example.com/vendors/acme",
					name: "Acme Corp"
				},
				categories: ["https://example.com/categories/electronics"]
			});

			expect(encodePatch(patch, { base: "https://example.com/" }))
				.toBe(JSON.stringify({
					vendor: {
						id: "/vendors/acme",
						name: "Acme Corp"
					},
					categories: ["/categories/electronics"]
				}));
		});

	});

	it("should encode empty patch", async () => {
		const patch = asPatch({});

		expect(encodePatch(patch)).toBe(JSON.stringify(patch));
	});

	it("should encode patch with property updates", async () => {
		const patch = asPatch({
			price: 39.99,
			available: true
		});

		expect(encodePatch(patch)).toBe(JSON.stringify(patch));
	});

	it("should encode patch with null deletions", async () => {
		const patch = asPatch({
			description: null,
			price: 39.99
		});

		expect(encodePatch(patch)).toBe(JSON.stringify(patch));
	});

	it("should encode patch with empty array deletions", async () => {
		const patch = asPatch({
			categories: [],
			price: 39.99
		});

		expect(encodePatch(patch)).toBe(JSON.stringify(patch));
	});

});

describe("decodePatch()", () => {

	describe("base option", () => {

		it("should accept absolute hierarchical IRI base", async () => {
			const json = JSON.stringify({ vendor: "/vendors/acme" });

			expect(() => decodePatch(json, { base: "https://example.com/" })).not.toThrow();
		});

		it("should reject relative IRI base", async () => {
			const json = JSON.stringify({ vendor: "/vendors/acme" });

			expect(() => decodePatch(json, { base: "/relative/path" })).toThrow(RangeError);
		});

		it("should reject opaque IRI base", async () => {
			const json = JSON.stringify({ vendor: "/vendors/acme" });

			expect(() => decodePatch(json, { base: "app:/" })).toThrow(RangeError);
		});

		it("should resolve root-relative IRI to absolute", async () => {
			const json = JSON.stringify({ vendor: "/vendors/acme" });

			expect(decodePatch(json, { base: "https://example.com/" }))
				.toEqual({ vendor: "https://example.com/vendors/acme" });
		});

		it("should preserve absolute IRI", async () => {
			const json = JSON.stringify({ vendor: "https://other.com/vendors/acme" });

			expect(decodePatch(json, { base: "https://example.com/" }))
				.toEqual({ vendor: "https://other.com/vendors/acme" });
		});

		it("should preserve non-root-relative IRIs and other strings", async () => {
			const json = JSON.stringify({
				relative: "../vendors/acme",
				plain: "Acme Corp",
				nested: { name: "Widget", path: "products/42" }
			});

			expect(decodePatch(json, { base: "https://example.com/" }))
				.toEqual({
					relative: "../vendors/acme",
					plain: "Acme Corp",
					nested: { name: "Widget", path: "products/42" }
				});
		});

		it("should resolve IRIs recursively in nested structures", async () => {
			const json = JSON.stringify({
				vendor: {
					id: "/vendors/acme",
					name: "Acme Corp"
				},
				categories: ["/categories/electronics"]
			});

			expect(decodePatch(json, { base: "https://example.com/" }))
				.toEqual({
					vendor: {
						id: "https://example.com/vendors/acme",
						name: "Acme Corp"
					},
					categories: ["https://example.com/categories/electronics"]
				});
		});

	});

	it("should decode empty patch", async () => {
		const patch = asPatch({});

		expect(decodePatch(JSON.stringify(patch))).toEqual(patch);
	});

	it("should decode patch with property updates", async () => {
		const patch = asPatch({
			price: 39.99,
			available: true
		});

		expect(decodePatch(JSON.stringify(patch))).toEqual(patch);
	});

	it("should decode patch with null deletions", async () => {
		const patch = asPatch({
			description: null,
			price: 39.99
		});

		expect(decodePatch(JSON.stringify(patch))).toEqual(patch);
	});

	it("should roundtrip with encodePatch", async () => {
		const patch = asPatch({
			price: 39.99,
			description: null
		});

		expect(decodePatch(encodePatch(patch))).toEqual(patch);
	});

	it("should throw on invalid JSON", async () => {
		expect(() => decodePatch("not valid json")).toThrow();
	});

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("isResource()", () => {

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

describe("asResource()", () => {

	it("should return valid resource", async () => {
		const resource = { id: "/test", name: "Test" };
		expect(asResource(resource)).toBe(resource);
	});

	it("should throw on invalid resource", async () => {
		expect(() => asResource(null)).toThrow(TypeError);
		expect(() => asResource("string")).toThrow(TypeError);
		expect(() => asResource([])).toThrow(TypeError);
	});

});


describe("isPatch()", () => {

	it("should accept empty object", async () => {
		expect(isPatch({})).toBeTruthy();
	});

	it("should accept object with primitive properties", async () => {
		expect(isPatch({ name: "Test", count: 42 })).toBeTruthy();
	});

	it("should accept object with null deletions", async () => {
		expect(isPatch({ name: null, description: null })).toBeTruthy();
	});

	it("should accept mixed updates and deletions", async () => {
		expect(isPatch({ name: "Updated", description: null, count: 42 })).toBeTruthy();
	});

	it("should reject null", async () => {
		expect(isPatch(null)).toBeFalsy();
	});

	it("should reject primitives", async () => {
		expect(isPatch("string")).toBeFalsy();
		expect(isPatch(42)).toBeFalsy();
	});

});

describe("asPatch()", () => {

	it("should return valid patch", async () => {
		const patch = { name: "Updated", count: null };
		expect(asPatch(patch)).toBe(patch);
	});

	it("should throw on invalid patch", async () => {
		expect(() => asPatch(null)).toThrow(TypeError);
		expect(() => asPatch("string")).toThrow(TypeError);
	});

});


describe("isValues()", () => {

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

	it("should reject null", async () => {
		expect(isValues(null)).toBeFalsy();
	});

	it("should reject undefined", async () => {
		expect(isValues(undefined)).toBeFalsy();
	});

});

describe("asValues()", () => {

	it("should return valid values", async () => {
		expect(asValues("test")).toBe("test");
		expect(asValues(42)).toBe(42);
	});

	it("should throw on invalid values", async () => {
		expect(() => asValues(null)).toThrow(TypeError);
		expect(() => asValues(undefined)).toThrow(TypeError);
	});

});


describe("isValue()", () => {

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

describe("asValue()", () => {

	it("should return valid value", async () => {
		expect(asValue("test")).toBe("test");
		expect(asValue(42)).toBe(42);
		const resource = { id: "/test" };
		expect(asValue(resource)).toBe(resource);
	});

	it("should throw on invalid value", async () => {
		expect(() => asValue(null)).toThrow(TypeError);
		expect(() => asValue([])).toThrow(TypeError);
	});

});


describe("isLiteral()", () => {

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

describe("asLiteral()", () => {

	it("should return valid literal", async () => {
		expect(asLiteral(true)).toBe(true);
		expect(asLiteral(42)).toBe(42);
		expect(asLiteral("test")).toBe("test");
	});

	it("should throw on invalid literal", async () => {
		expect(() => asLiteral(null)).toThrow(TypeError);
		expect(() => asLiteral({})).toThrow(TypeError);
		expect(() => asLiteral([])).toThrow(TypeError);
	});

});


describe("isReference()", () => {

	it("should accept absolute IRI", async () => {
		expect(isReference("https://example.com/resource")).toBeTruthy();
	});

	it("should accept root-relative IRI", async () => {
		expect(isReference("/path/to/resource")).toBeTruthy();
	});

	it("should accept relative IRI", async () => {
		expect(isReference("relative/path")).toBeTruthy();
	});

	it("should accept empty string", async () => {
		expect(isReference("")).toBeTruthy();
	});

	it("should reject non-strings", async () => {
		expect(isReference(42)).toBeFalsy();
		expect(isReference(null)).toBeFalsy();
		expect(isReference({})).toBeFalsy();
	});

});

describe("asReference()", () => {

	it("should return valid reference", async () => {
		expect(asReference("https://example.com")).toBe("https://example.com");
		expect(asReference("/test")).toBe("/test");
		expect(asReference("relative")).toBe("relative");
		expect(asReference("")).toBe("");
	});

	it("should throw on invalid reference", async () => {
		expect(() => asReference(42)).toThrow(TypeError);
		expect(() => asReference(null)).toThrow(TypeError);
	});

});


describe("isLocal()", () => {

	it("should accept single-valued language map", async () => {
		expect(isLocal({ en: "Hello" })).toBeTruthy();
		expect(isLocal({ en: "Hello", de: "Hallo", fr: "Bonjour" })).toBeTruthy();
	});

	it("should accept empty object", async () => {
		expect(isLocal({})).toBeTruthy();
	});

	it("should reject multi-valued language map", async () => {
		expect(isLocal({ en: ["Hello", "Hi"] })).toBeFalsy();
	});

	it("should reject invalid language tags", async () => {
		expect(isLocal({ invalid_tag: "value" })).toBeFalsy();
		expect(isLocal({ "123": "value" })).toBeFalsy();
	});

	it("should reject non-string values", async () => {
		expect(isLocal({ en: 42 })).toBeFalsy();
		expect(isLocal({ en: null })).toBeFalsy();
	});

	it("should reject primitives", async () => {
		expect(isLocal("string")).toBeFalsy();
		expect(isLocal(42)).toBeFalsy();
		expect(isLocal(null)).toBeFalsy();
	});

});

describe("asLocal()", () => {

	it("should return valid local", async () => {
		const local = { en: "Hello", de: "Hallo" };
		expect(asLocal(local)).toBe(local);
	});

	it("should throw on invalid local", async () => {
		expect(() => asLocal({ en: ["Hello"] })).toThrow(TypeError);
		expect(() => asLocal("string")).toThrow(TypeError);
	});

});


describe("isLocals()", () => {

	it("should accept multi-valued language map", async () => {
		expect(isLocals({ en: ["Hello", "Hi"] })).toBeTruthy();
		expect(isLocals({ en: ["Hello"], de: ["Hallo", "Guten Tag"] })).toBeTruthy();
	});

	it("should accept empty arrays", async () => {
		expect(isLocals({ en: [] })).toBeTruthy();
	});

	it("should accept empty object", async () => {
		expect(isLocals({})).toBeTruthy();
	});

	it("should reject single-valued language map", async () => {
		expect(isLocals({ en: "Hello" })).toBeFalsy();
	});

	it("should reject invalid language tags", async () => {
		expect(isLocals({ invalid_tag: ["value"] })).toBeFalsy();
	});

	it("should reject non-string array elements", async () => {
		expect(isLocals({ en: [42] })).toBeFalsy();
		expect(isLocals({ en: [null] })).toBeFalsy();
	});

	it("should reject primitives", async () => {
		expect(isLocals("string")).toBeFalsy();
		expect(isLocals(null)).toBeFalsy();
	});

});

describe("asLocals()", () => {

	it("should return valid locals", async () => {
		const locals = { en: ["Hello", "Hi"], de: ["Hallo"] };
		expect(asLocals(locals)).toBe(locals);
	});

	it("should throw on invalid locals", async () => {
		expect(() => asLocals({ en: "Hello" })).toThrow(TypeError);
		expect(() => asLocals("string")).toThrow(TypeError);
	});

});


describe("isIndexed()", () => {

	it("should accept object with string values", async () => {
		expect(isIndexed({ key1: "value1", key2: "value2" })).toBeTruthy();
	});

	it("should accept object with mixed value types", async () => {
		expect(isIndexed({ str: "value", num: 42, bool: true })).toBeTruthy();
	});

	it("should accept object with array values", async () => {
		expect(isIndexed({ tags: ["a", "b", "c"] })).toBeTruthy();
	});

	it("should accept empty object", async () => {
		expect(isIndexed({})).toBeTruthy();
	});

	it("should reject object with null values", async () => {
		expect(isIndexed({ key: null })).toBeFalsy();
	});

	it("should reject primitives", async () => {
		expect(isIndexed("string")).toBeFalsy();
		expect(isIndexed(42)).toBeFalsy();
		expect(isIndexed(null)).toBeFalsy();
	});

	it("should reject arrays", async () => {
		expect(isIndexed([])).toBeFalsy();
		expect(isIndexed(["a", "b"])).toBeFalsy();
	});

});

describe("asIndexed()", () => {

	it("should return valid indexed", async () => {
		const indexed = { key1: "value1", key2: 42 };
		expect(asIndexed(indexed)).toBe(indexed);
	});

	it("should throw on invalid indexed", async () => {
		expect(() => asIndexed({ key: null })).toThrow(TypeError);
		expect(() => asIndexed("string")).toThrow(TypeError);
		expect(() => asIndexed([])).toThrow(TypeError);
	});

});
