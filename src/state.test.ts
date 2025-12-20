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
import { decodePatch, decodeResource, encodePatch, encodeResource, Patch, Resource } from "./state.js";


function asResource(r: object): Resource { return r as Resource; }

function asPatch(p: object): Patch { return p as Patch; }


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
