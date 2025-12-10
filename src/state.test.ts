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
