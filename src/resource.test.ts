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
import { app } from "./index.js";
import { isText, isResource, isValue, isValues } from "./resource.core.js";
import { decodeResource, encodeResource, type Resource } from "./resource.js";


const sharedRejections: ReadonlyArray<readonly [string, unknown]> = [
	["Date instance", new Date()],
	["Map instance", new Map()],
	["null-prototype object", Object.create(null)],
	["arrow function", () => {}],
	["symbol", Symbol("x")],
	["bigint", BigInt(42)],
	["NaN", Number.NaN],
	["positive Infinity", Number.POSITIVE_INFINITY],
	["negative Infinity", Number.NEGATIVE_INFINITY]
];

const baseResource: Resource = {
	id: "/products/42",
	vendor: {
		id: "/vendors/acme",
		name: "Acme Corp"
	},
	categories: ["/categories/electronics", "/categories/home"]
};


describe("guards", () => {

	describe.each<readonly [string, (value: unknown) => boolean]>([
		["isResource", isResource],
		["isValues", isValues],
		["isValue", isValue],
		["isText", isText]
	])("%s shared rejections", (_name, guard) => {

		it.each(sharedRejections)("should reject %s", (_label, value) => {
			expect(guard(value)).toBe(false);
		});

	});

	describe("isResource", () => {

		it("should accept empty object", () => {
			expect(isResource({})).toBe(true);
		});

		it("should accept object with primitive properties", () => {
			expect(isResource({ id: "/test", name: "Test", count: 42, active: true })).toBe(true);
		});

		it("should accept object with nested resource", () => {
			expect(isResource({ id: "/test", nested: { id: "/nested" } })).toBe(true);
		});

		it("should accept object with array values", () => {
			expect(isResource({ tags: ["a", "b", "c"] })).toBe(true);
		});

		it("should accept object with single-valued Text", () => {
			expect(isResource({ name: { en: "Hello", de: "Hallo" } })).toBe(true);
		});

		it("should accept object with multi-valued Text", () => {
			expect(isResource({ tags: { en: ["hello", "hi"], de: ["hallo"] } })).toBe(true);
		});

		it("should accept object with anonymous nested resource", () => {
			expect(isResource({ data: { key1: "value1", key2: 42 } })).toBe(true);
		});

		it("should reject null", () => {
			expect(isResource(null)).toBe(false);
		});

		it("should reject primitives", () => {
			expect(isResource("string")).toBe(false);
			expect(isResource(42)).toBe(false);
			expect(isResource(true)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isResource([])).toBe(false);
			expect(isResource([{ id: "/test" }])).toBe(false);
		});

	});

	describe("isResource arbitrary JSON hardening", () => {

		it("should reject further non-plain objects", () => {
			expect(isResource(/regex/)).toBe(false);
			expect(isResource(new Set())).toBe(false);
			expect(isResource(new Error("boom"))).toBe(false);

			class Custom {id = "/x";}

			expect(isResource(new Custom())).toBe(false);
		});

		it("should reject named functions", () => {
			expect(isResource(function named() {})).toBe(false);
		});

		it("should reject keys that are not ECMAScript identifiers", () => {
			expect(isResource({ "foo-bar": "x" })).toBe(false);
			expect(isResource({ "foo.bar": "x" })).toBe(false);
			expect(isResource({ "@id": "x" })).toBe(false);
			expect(isResource({ "@type": "x" })).toBe(false);
			expect(isResource({ "@context": "x" })).toBe(false);
			expect(isResource({ "ns:prop": "x" })).toBe(false);
			expect(isResource({ "123": "x" })).toBe(false);
			expect(isResource({ "": "x" })).toBe(false);
		});

		it("should accept undefined entry values", () => {
			expect(isResource({ x: undefined })).toBe(true);
			expect(isResource({ id: "/test", name: undefined })).toBe(true);
		});

		it("should reject values that are function, symbol, or bigint", () => {
			expect(isResource({ x: () => {} })).toBe(false);
			expect(isResource({ x: Symbol("s") })).toBe(false);
			expect(isResource({ x: BigInt(1) })).toBe(false);
		});

		it("should reject non-finite numbers as values", () => {
			expect(isResource({ x: Number.NaN })).toBe(false);
			expect(isResource({ x: Number.POSITIVE_INFINITY })).toBe(false);
			expect(isResource({ x: Number.NEGATIVE_INFINITY })).toBe(false);
		});

		it("should reject non-plain objects nested as values", () => {
			expect(isResource({ when: new Date() })).toBe(false);
			expect(isResource({ pattern: /regex/ })).toBe(false);
			expect(isResource({ items: new Map() })).toBe(false);
		});

		it("should reject invalid structures nested inside arrays", () => {
			expect(isResource({ xs: [null] })).toBe(false);
			expect(isResource({ xs: [undefined] })).toBe(false);
			expect(isResource({ xs: [[1, 2]] })).toBe(false);
			expect(isResource({ xs: [{ "bad-key": 1 }] })).toBe(false);
			expect(isResource({ xs: [new Date()] })).toBe(false);
		});

		it("should reject invalid structures nested inside resources", () => {
			expect(isResource({ outer: { "bad-key": 1 } })).toBe(false);
			expect(isResource({ outer: { inner: { "bad-key": 1 } } })).toBe(false);
			expect(isResource({ outer: { inner: new Date() } })).toBe(false);
		});

		it("should accept deeply nested valid resources", () => {
			expect(isResource({ a: { b: { c: { d: "leaf" } } } })).toBe(true);
		});

		it("should accept JSON.parse output of a valid resource", () => {
			const json = JSON.stringify({
				id: "/products/42",
				name: "Widget",
				price: 29.99,
				available: true,
				tags: ["a", "b"],
				label: { en: "Widget", de: "Gerät" },
				vendor: { id: "/vendors/acme", name: "Acme" }
			});

			expect(isResource(JSON.parse(json))).toBe(true);
		});

	});

	describe("isValues", () => {

		it("should accept scalar values", () => {
			expect(isValues(true)).toBe(true);
			expect(isValues(42)).toBe(true);
			expect(isValues("hello")).toBe(true);
			expect(isValues("/resource")).toBe(true);
			expect(isValues({ id: "/test", name: "Test" })).toBe(true);
		});

		it("should accept single-valued Text", () => {
			expect(isValues({ en: "Hello", de: "Hallo" })).toBe(true);
		});

		it("should accept multi-valued Text", () => {
			expect(isValues({ en: ["hello", "hi"], de: ["hallo"] })).toBe(true);
		});

		it("should accept array of values", () => {
			expect(isValues([true, false])).toBe(true);
			expect(isValues(["a", "b", "c"])).toBe(true);
			expect(isValues([1, 2, 3])).toBe(true);
			expect(isValues([{ id: "/a" }, { id: "/b" }])).toBe(true);
		});

		it("should accept mixed-type array", () => {
			expect(isValues([1, "a"])).toBe(true);
			expect(isValues(["a", { id: "/b" }])).toBe(true);
			expect(isValues([true, 42, "tag", { id: "/x" }])).toBe(true);
		});

		it("should accept empty array", () => {
			expect(isValues([])).toBe(true);
		});

		it("should reject null", () => {
			expect(isValues(null)).toBe(false);
		});

		it("should accept undefined", () => {
			expect(isValues(undefined)).toBe(true);
		});

		it("should reject array with null elements", () => {
			expect(isValues([null])).toBe(false);
			expect(isValues([1, null, 2])).toBe(false);
		});

	});

	describe("isValues arbitrary JSON hardening", () => {

		it("should reject arrays containing non-finite numbers", () => {
			expect(isValues([1, Number.NaN])).toBe(false);
			expect(isValues([Number.POSITIVE_INFINITY])).toBe(false);
		});

		it("should reject arrays containing non-plain objects", () => {
			expect(isValues([new Date()])).toBe(false);
			expect(isValues([/regex/])).toBe(false);
		});

		it("should reject arrays containing undefined", () => {
			expect(isValues([undefined])).toBe(false);
			expect(isValues([1, undefined, 2])).toBe(false);
		});

		it("should reject arrays of arrays", () => {
			expect(isValues([[1, 2]])).toBe(false);
			expect(isValues([["a"], ["b"]])).toBe(false);
		});

		it("should reject objects with non-identifier, non-tag keys", () => {
			expect(isValues({ "ns:prop": "x" })).toBe(false);
			expect(isValues({ "foo bar": "x" })).toBe(false);
			expect(isValues({ "123": "x" })).toBe(false);
		});

	});

	describe("isValue", () => {

		it("should accept literals", () => {
			expect(isValue(true)).toBe(true);
			expect(isValue(42)).toBe(true);
			expect(isValue("string")).toBe(true);
		});

		it("should accept reference", () => {
			expect(isValue("/resource")).toBe(true);
		});

		it("should accept resource", () => {
			expect(isValue({ id: "/test", name: "Test" })).toBe(true);
		});

		it("should reject null", () => {
			expect(isValue(null)).toBe(false);
		});

		it("should reject undefined", () => {
			expect(isValue(undefined)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isValue([])).toBe(false);
			expect(isValue(["a", "b"])).toBe(false);
		});

	});

	describe("isValue arbitrary JSON hardening", () => {

		it("should reject further non-plain objects", () => {
			expect(isValue(/regex/)).toBe(false);
		});

	});

	describe("isText", () => {

		it("should accept single-valued language map", () => {
			expect(isText({ en: "Hello" })).toBe(true);
			expect(isText({ en: "Hello", de: "Hallo", fr: "Bonjour" })).toBe(true);
		});

		it("should accept multi-valued language map", () => {
			expect(isText({ en: ["Hello", "Hi"] })).toBe(true);
			expect(isText({ en: ["Hello"], de: ["Hallo", "Guten Tag"] })).toBe(true);
		});

		it("should accept empty arrays", () => {
			expect(isText({ en: [] })).toBe(true);
		});

		it("should accept empty object", () => {
			expect(isText({})).toBe(true);
		});

		it("should accept the und and zxx neutral tags", () => {
			// §4.3: language-neutral content uses und / zxx, never the @none key
			expect(isText({ und: "Acme" })).toBe(true);
			expect(isText({ zxx: "SKU-12345" })).toBe(true);
		});

		it("should reject plain string shorthand", () => {
			expect(isText("hello")).toBe(false);
			expect(isText("")).toBe(false);
		});

		it("should reject plain string array shorthand", () => {
			expect(isText(["a", "b"])).toBe(false);
			expect(isText([])).toBe(false);
		});

		it("should reject mixed scalar/array content", () => {
			expect(isText({ en: "hello", fr: ["bonjour"] })).toBe(false);
			expect(isText({ en: ["hello"], fr: "bonjour" })).toBe(false);
		});

		it("should reject invalid language tags", () => {
			expect(isText({ invalid_tag: "value" })).toBe(false);
			expect(isText({ "123": "value" })).toBe(false);
			expect(isText({ invalid_tag: ["value"] })).toBe(false);
		});

		it("should reject the @none key", () => {
			// §4.3: the @none key MUST NOT be used
			expect(isText({ "@none": "value" })).toBe(false);
		});

		it("should reject non-string values", () => {
			expect(isText({ en: 42 })).toBe(false);
			expect(isText({ en: null })).toBe(false);
		});

		it("should reject non-string array elements", () => {
			expect(isText({ en: [42] })).toBe(false);
			expect(isText({ en: [null] })).toBe(false);
		});

		it("should reject non-string/non-array primitives", () => {
			expect(isText(42)).toBe(false);
			expect(isText(null)).toBe(false);
		});

	});

	describe("isText arbitrary JSON hardening", () => {

		it("should reject arrays with non-string elements", () => {
			expect(isText([1, 2])).toBe(false);
			expect(isText(["a", 1])).toBe(false);
			expect(isText([undefined])).toBe(false);
			expect(isText([null])).toBe(false);
		});

		it("should reject language maps with non-finite number values", () => {
			expect(isText({ en: Number.NaN })).toBe(false);
		});

	});

});

describe("codecs", () => {

	describe("encodeResource", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const resource: Resource = { id: "/products/42" };

				expect(() => encodeResource(resource, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should accept path-absolute IRI base", () => {
				const resource: Resource = { id: "app:/products/42" };

				expect(encodeResource(resource, { base: app }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

			it("should internalize absolute IRI to root-relative", () => {
				const resource: Resource = { id: "https://example.com/products/42" };

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

			it("should preserve absolute IRI with different origin", () => {
				const resource: Resource = { id: "https://other.com/products/42" };

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "https://other.com/products/42" }));
			});

			it("should preserve root-relative IRI", () => {
				const resource: Resource = { id: "/products/42" };

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

			it("should preserve non-root-relative IRIs and other strings", () => {
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

			it("should internalize IRIs recursively in nested structures", () => {
				const resource: Resource = {
					id: "https://example.com/products/42",
					vendor: {
						id: "https://example.com/vendors/acme",
						name: "Acme Corp"
					},
					categories: ["https://example.com/categories/electronics", "https://example.com/categories/home"]
				};

				expect(encodeResource(resource, { base: "https://example.com/" }))
					.toBe(JSON.stringify(baseResource));
			});

		});

		describe("indent option", () => {

			it.each<readonly [boolean | number | undefined, number | undefined]>([
				[undefined, undefined],
				[true, 2],
				[4, 4],
				[false, undefined],
				[0, undefined],
				[-1, undefined]
			])("should map indent %s to %s spaces", (indent, spaces) => {
				const resource: Resource = { id: "/products/42", name: "Widget" };

				expect(encodeResource(resource, { indent }))
					.toBe(JSON.stringify(resource, null, spaces));
			});

		});

		it("should use app base when base option is omitted", () => {
			const resource: Resource = { id: "app:/products/42" };

			expect(encodeResource(resource))
				.toBe(JSON.stringify({ id: "/products/42" }));
		});

		it("should encode empty resource", () => {
			const resource: Resource = {};

			expect(encodeResource(resource)).toBe(JSON.stringify(resource));
		});

		it("should encode resource with primitive properties", () => {
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

		it("should encode resource with nested resource", () => {
			const resource: Resource = {
				id: "/products/42",
				vendor: {
					id: "/vendors/acme",
					name: "Acme Corp"
				}
			};

			expect(encodeResource(resource)).toBe(JSON.stringify(resource));
		});

		it("should encode resource with array values", () => {
			const resource: Resource = {
				id: "/products/42",
				categories: ["/categories/electronics", "/categories/home"]
			};

			expect(encodeResource(resource)).toBe(JSON.stringify(resource));
		});

		it("should encode resource with localised text map", () => {
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

			it("should reject relative IRI base", () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(() => decodeResource(json, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should accept path-absolute IRI base", () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(decodeResource(json, { base: app }))
					.toEqual({ id: "app:/products/42" });
			});

			it("should resolve root-relative IRI to absolute", () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(decodeResource(json, { base: "https://example.com/" }))
					.toEqual({ id: "https://example.com/products/42" });
			});

			it("should preserve absolute IRI", () => {
				const json = JSON.stringify({ id: "https://other.com/products/42" });

				expect(decodeResource(json, { base: "https://example.com/" }))
					.toEqual({ id: "https://other.com/products/42" });
			});

			it("should preserve non-root-relative IRIs and other strings", () => {
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

			it("should resolve IRIs recursively in nested structures", () => {
				const json = JSON.stringify(baseResource);

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

		it("should use app base when base option is omitted", () => {
			const json = JSON.stringify({ id: "/products/42" });

			expect(decodeResource(json))
				.toEqual({ id: "app:/products/42" });
		});

		it("should decode empty resource", () => {
			const resource: Resource = {};

			expect(decodeResource(JSON.stringify(resource))).toEqual(resource);
		});

		it("should decode resource with primitive properties", () => {
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

		it("should decode resource with nested resource", () => {
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

		it("should deeply freeze the decoded resource", () => {
			const decoded = decodeResource(JSON.stringify({
				id: "/products/42",
				vendor: { id: "/vendors/acme", name: "Acme Corp" }
			}));

			expect(Object.isFrozen(decoded)).toBe(true);
			expect(Object.isFrozen((decoded as { vendor: object }).vendor)).toBe(true);
		});

		it("should roundtrip with encodeResource", () => {
			const resource: Resource = {
				id: "app:/products/42",
				name: "Widget",
				price: 29.99
			};

			expect(decodeResource(encodeResource(resource))).toEqual(resource);
		});

		it("should roundtrip from decode through encode", () => {
			const json = JSON.stringify({ id: "/products/42", name: "Widget", price: 29.99 });

			expect(encodeResource(decodeResource(json))).toBe(json);
		});

		it("should throw on invalid JSON", () => {
			expect(() => decodeResource("not valid json")).toThrow(SyntaxError);
		});

		describe("lenient option", () => {

			it("should throw on structurally invalid input by default", () => {
				expect(() => decodeResource(JSON.stringify([1, 2, 3]))).toThrow(TypeError);
			});

			it("should return structurally invalid input when lenient", () => {
				expect(decodeResource(JSON.stringify([1, 2, 3]), { lenient: true }))
					.toEqual([1, 2, 3]);
			});

			it("should still throw on syntax errors when lenient", () => {
				expect(() => decodeResource("not valid json", { lenient: true })).toThrow(SyntaxError);
			});

		});

	});

});
