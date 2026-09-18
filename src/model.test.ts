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
import {
	isAggregate,
	isBinding,
	isCriteria,
	isCriterion,
	isSelector,
	isExpression,
	isLocale,
	isOperator,
	isOption,
	isOptions,
	isOrder,
	isPlaceholder,
	isProbe,
	isProjection,
	isQuery,
	isTemplate,
	isAtomic,
	isTransform,
	isUnion
} from "./model.core.js";
import {
	decodeProbe,
	decodeCriteria,
	decodeTemplate,
	encodeProbe,
	encodeCriteria,
	encodeTemplate,
	type Criteria,
	type Probe,
	type Template
} from "./model.js";


describe("guards", () => {

	describe("isTemplate", () => {

		it("should accept entry maps with identifier keys", () => {
			expect(isTemplate({ id: {}, name: {} })).toBe(true);
			expect(isTemplate({ vendor: { id: {} } })).toBe(true);
		});

		it("should accept empty entry maps", () => {
			expect(isTemplate({})).toBe(true);
		});

		it("should accept undefined entry values", () => {
			expect(isTemplate({ name: undefined })).toBe(true);
			expect(isTemplate({ id: {}, child: undefined })).toBe(true);
		});

		it("should accept entries carrying collection constraints", () => {
			// constraints merge into the entry retrieving the collection they apply to
			expect(isTemplate({ items: { id: {}, "^id": "asc", "@": 0, "#": 10 } })).toBe(true);
		});

		it("should accept constraint-only entries", () => {
			// an entry with no retrieval keys retrieves the items themselves
			expect(isTemplate({ items: { "#": 10 } })).toBe(true);
		});

		it("should accept locale entries", () => {
			expect(isTemplate({ title: { "*": {} } })).toBe(true);
			expect(isTemplate({ title: { en: {}, fr: {} } })).toBe(true);
		});

		it("should accept union entries", () => {
			expect(isTemplate({ creator: { "0": { name: {} }, "1": { legalName: {} } } })).toBe(true);
		});

		it("should accept projection entries, with and without constraints", () => {
			expect(isTemplate({ items: { "total=count:": {} } })).toBe(true);
			expect(isTemplate({ items: { "total=count:": {}, "#": 10 } })).toBe(true);
		});

		it("should reject entries carrying malformed constraints", () => {
			expect(isTemplate({ items: { "#": -1 } })).toBe(false);
			expect(isTemplate({ items: { "^name": "ascending" } })).toBe(false);
		});

		it("should reject entries whose retrieval keys match no form", () => {
			expect(isTemplate({ items: { "foo.bar": {} } })).toBe(false);
		});

		it("should reject literals", () => {
			expect(isTemplate(true)).toBe(false);
			expect(isTemplate(false)).toBe(false);
			expect(isTemplate(0)).toBe(false);
			expect(isTemplate(42)).toBe(false);
			expect(isTemplate("")).toBe(false);
			expect(isTemplate("text")).toBe(false);
		});

		it("should reject references", () => {
			expect(isTemplate("/products/42")).toBe(false);
			expect(isTemplate("https://example.com/resource")).toBe(false);
		});

		it("should reject null and undefined", () => {
			expect(isTemplate(null)).toBe(false);
			expect(isTemplate(undefined)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isTemplate([])).toBe(false);
			expect(isTemplate([0])).toBe(false);
			expect(isTemplate([{ id: {} }])).toBe(false);
		});

	});


	describe("isProjection", () => {

		it("should accept empty object", () => {
			expect(isProjection({})).toBe(true);
		});

		it("should accept binding keys", () => {
			expect(isProjection({ "id=id": {}, "name=name": {} })).toBe(true);
			expect(isProjection({ "total=sum:price": {} })).toBe(true);
			expect(isProjection({ "vendorName=vendor.name": {} })).toBe(true);
		});

		it("should reject bare identifier keys", () => {
			// bare keys form a Template, not a Projection (no binding shorthand)
			expect(isProjection({ id: {}, name: {} })).toBe(false);
			expect(isProjection({ vendor: { id: {}, name: {} } })).toBe(false);
		});

		it("should accept nested template cells", () => {
			expect(isProjection({ "vendorRow=vendor": { id: {}, name: {} } })).toBe(true);
		});

		it("should accept union cells", () => {
			expect(isProjection({ "creator=creator": { "0": { name: {} }, "1": { id: {} } } })).toBe(true);
		});

		it("should accept locale cells", () => {
			expect(isProjection({ "label=title": { "*": {} } })).toBe(true);
			expect(isProjection({ "label=title": { en: {}, fr: {} } })).toBe(true);
			expect(isProjection({ "label=title": { "en-US": {} } })).toBe(true);
		});

		it("should accept undefined cells", () => {
			expect(isProjection({ "name=name": undefined })).toBe(true);
			expect(isProjection({ "id=id": {}, "total=count:": undefined })).toBe(true);
		});

		it("should reject constraint keys", () => {
			// constraints ride on the entry hosting the projection, never among its bindings
			expect(isProjection({ "total=count:": {}, "#": 10 })).toBe(false);
		});

		it("should reject duplicate binding result names", () => {
			// index.md §5.6: binding result names must be unique within a projection
			expect(isProjection({ "count=count:": {}, "count=sum:price": {} })).toBe(false);
			expect(isProjection({ "x=a": {}, "x=b": {} })).toBe(false);
		});

		it("should reject null and undefined", () => {
			expect(isProjection(null)).toBe(false);
			expect(isProjection(undefined)).toBe(false);
		});

		it("should reject primitives", () => {
			expect(isProjection("string")).toBe(false);
			expect(isProjection(42)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isProjection([])).toBe(false);
			expect(isProjection([{ "id=id": {} }])).toBe(false);
		});

	});


	describe("isPlaceholder", () => {

		it("should accept the atomic", () => {
			expect(isPlaceholder({})).toBe(true);
		});

		it("should accept nested templates", () => {
			expect(isPlaceholder({ id: {}, name: {} })).toBe(true);
			expect(isPlaceholder({ vendor: { id: {} } })).toBe(true);
		});

		it("should accept locale maps", () => {
			expect(isPlaceholder({ "*": {} })).toBe(true);
			expect(isPlaceholder({ "en-US": {} })).toBe(true);
		});

		it("should reject literals and references", () => {
			expect(isPlaceholder(true)).toBe(false);
			expect(isPlaceholder(0)).toBe(false);
			expect(isPlaceholder("")).toBe(false);
			expect(isPlaceholder("/products/42")).toBe(false);
		});

		it("should reject null and undefined", () => {
			expect(isPlaceholder(null)).toBe(false);
			expect(isPlaceholder(undefined)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isPlaceholder([])).toBe(false);
			expect(isPlaceholder([{}])).toBe(false);
		});

	});

	describe("isAtomic", () => {

		it("should accept the empty object", () => {
			expect(isAtomic({})).toBe(true);
		});

		it("should reject objects carrying entries", () => {
			expect(isAtomic({ id: {} })).toBe(false);
			expect(isAtomic({ "*": {} })).toBe(false);
			expect(isAtomic({ "#": 10 })).toBe(false);
		});

		it("should reject literals and references", () => {
			expect(isAtomic("")).toBe(false);
			expect(isAtomic(0)).toBe(false);
			expect(isAtomic(true)).toBe(false);
			expect(isAtomic("/products/42")).toBe(false);
		});

		it("should reject null, undefined and arrays", () => {
			expect(isAtomic(null)).toBe(false);
			expect(isAtomic(undefined)).toBe(false);
			expect(isAtomic([])).toBe(false);
		});

	});


	describe("isLocale", () => {

		it("should accept tag-range keys mapping to an atomic", () => {
			expect(isLocale({ "*": {} })).toBe(true);
			expect(isLocale({ en: {} })).toBe(true);
			expect(isLocale({ en: {}, fr: {} })).toBe(true);
			expect(isLocale({ "en-US": {} })).toBe(true);
		});

		it("should accept the empty map", () => {
			expect(isLocale({})).toBe(true);
		});

		it("should accept undefined entries", () => {
			expect(isLocale({ en: undefined })).toBe(true);
		});

		it("should reject extended language ranges", () => {
			// RFC 4647 basic ranges only: leading, interior and trailing `*` subtags are invalid
			expect(isLocale({ "en-*": {} })).toBe(false);
			expect(isLocale({ "de-*-DE": {} })).toBe(false);
			expect(isLocale({ "*-CH": {} })).toBe(false);
		});

		it("should reject invalid tag-range keys", () => {
			expect(isLocale({ "invalid tag": {} })).toBe(false);
			expect(isLocale({ "": {} })).toBe(false);
		});

		it("should reject entries carrying a request of their own", () => {
			// the value slot is inert: every entry is an atomic
			expect(isLocale({ en: { id: {} } })).toBe(false);
			expect(isLocale({ en: "" })).toBe(false);
			expect(isLocale({ en: [""] })).toBe(false);
		});

		it("should reject constraint keys", () => {
			// a locale map is filtered by its own tag ranges and takes no constraints
			expect(isLocale({ en: {}, "~": "widget" })).toBe(false);
			expect(isLocale({ en: {}, "@": 0, "#": 25 })).toBe(false);
		});

		it("should reject literals and references", () => {
			expect(isLocale("text")).toBe(false);
			expect(isLocale(42)).toBe(false);
			expect(isLocale(true)).toBe(false);
		});

		it("should reject null, undefined and arrays", () => {
			expect(isLocale(null)).toBe(false);
			expect(isLocale(undefined)).toBe(false);
			expect(isLocale([])).toBe(false);
			expect(isLocale([{}])).toBe(false);
		});

	});

	describe("isUnion", () => {

		it("should accept branch keys mapping to placeholders", () => {
			expect(isUnion({ "0": {} })).toBe(true);
			expect(isUnion({ "0": { id: {}, name: {} } })).toBe(true);
			expect(isUnion({ "0": { name: {} }, "1": { legalName: {} } })).toBe(true);
		});

		it("should accept a locale branch", () => {
			expect(isUnion({ "0": { "en-US": {} } })).toBe(true);
			expect(isUnion({ "0": { "*": {} }, "1": {} })).toBe(true);
		});

		it("should accept the empty map", () => {
			expect(isUnion({})).toBe(true);
		});

		it("should accept undefined branches", () => {
			expect(isUnion({ "0": undefined })).toBe(true);
		});

		it("should reject non-canonical branch keys", () => {
			expect(isUnion({ "3.14": {} })).toBe(false);
			expect(isUnion({ "-5": {} })).toBe(false);
			expect(isUnion({ "1e10": {} })).toBe(false);
			expect(isUnion({ "01": {} })).toBe(false);
			expect(isUnion({ "": {} })).toBe(false);
		});

		it("should reject branch keys mixed with identifier keys", () => {
			expect(isUnion({ "0": {}, foo: {} })).toBe(false);
		});

		it("should reject a union stacked directly inside a branch", () => {
			expect(isUnion({ "0": { "0": {} } })).toBe(false);
		});

		it("should reject literals and references", () => {
			expect(isUnion(true)).toBe(false);
			expect(isUnion(42)).toBe(false);
			expect(isUnion("")).toBe(false);
			expect(isUnion("/products/42")).toBe(false);
		});

		it("should reject null, undefined and arrays", () => {
			expect(isUnion(null)).toBe(false);
			expect(isUnion(undefined)).toBe(false);
			expect(isUnion([])).toBe(false);
			expect(isUnion([{}])).toBe(false);
		});

	});

	describe("isQuery", () => {

		it("should accept a node carrying retrieval keys alone", () => {
			expect(isQuery({ id: {}, name: {} }, isTemplate)).toBe(true);
			expect(isQuery({ "total=count:": {} }, isProjection)).toBe(true);
		});

		it("should accept a node carrying constraint keys alongside retrieval keys", () => {
			expect(isQuery({ id: {}, "^id": "asc", "#": 10 }, isTemplate)).toBe(true);
			expect(isQuery({ "total=count:": {}, "#": 10 }, isProjection)).toBe(true);
		});

		it("should accept a node carrying constraint keys alone", () => {
			expect(isQuery({ "#": 10 }, isTemplate)).toBe(true);
			expect(isQuery({}, isTemplate)).toBe(true);
		});

		it("should reject a node whose constraints are malformed", () => {
			expect(isQuery({ id: {}, "#": -1 }, isTemplate)).toBe(false);
			expect(isQuery({ id: {}, "^id": "ascending" }, isTemplate)).toBe(false);
		});

		it("should reject a node whose retrieval keys fail the datum guard", () => {
			expect(isQuery({ "total=count:": {}, "#": 10 }, isTemplate)).toBe(false);
			expect(isQuery({ id: {}, "#": 10 }, isProjection)).toBe(false);
		});

		it("should reject literals, references, null, undefined and arrays", () => {
			expect(isQuery("", isTemplate)).toBe(false);
			expect(isQuery(42, isTemplate)).toBe(false);
			expect(isQuery("/products/42", isTemplate)).toBe(false);
			expect(isQuery(null, isTemplate)).toBe(false);
			expect(isQuery(undefined, isTemplate)).toBe(false);
			expect(isQuery([], isTemplate)).toBe(false);
		});

	});

	describe("isCriterion", () => {

		it("should accept an entry matching its operator's value type", () => {
			expect(isCriterion(50, ">=price")).toBe(true);
			expect(isCriterion(150, "<price")).toBe(true);
			expect(isCriterion("widget", "~name")).toBe(true);
			expect(isCriterion(["a", "b"], "?category")).toBe(true);
			expect(isCriterion(["featured"], "!tags")).toBe(true);
			expect(isCriterion(["electronics"], "+category")).toBe(true);
			expect(isCriterion("asc", "^price")).toBe(true);
			expect(isCriterion(0, "@")).toBe(true);
			expect(isCriterion(25, "#")).toBe(true);
		});

		it("should reject an entry whose value the operator does not accept", () => {
			expect(isCriterion(null, ">=price")).toBe(false);
			expect(isCriterion(42, "~name")).toBe(false);
			expect(isCriterion("ascending", "^price")).toBe(false);
			expect(isCriterion(-1, "@")).toBe(false);
		});

		it("should reject an entry whose key is not a criterion key", () => {
			expect(isCriterion(50, "price")).toBe(false);
			expect(isCriterion(50, "=price")).toBe(false);
			expect(isCriterion(50, ">=foo-bar")).toBe(false);
			expect(isCriterion(50, "@offset")).toBe(false);
		});

	});

	describe("isCriteria", () => {

		it("should accept empty object", () => {
			expect(isCriteria({})).toBe(true);
		});

		it("should accept comparison filters", () => {
			expect(isCriteria({ ">=price": 50 })).toBe(true);
			expect(isCriteria({ "<=price": 150 })).toBe(true);
			expect(isCriteria({ ">price": 50 })).toBe(true);
			expect(isCriteria({ "<price": 150 })).toBe(true);
			expect(isCriteria({ ">=date": "2024-01-01" })).toBe(true);
			expect(isCriteria({ ">=active": true })).toBe(true);
			expect(isCriteria({ "<active": false })).toBe(true);
		});

		it("should reject non-literal comparison values", () => {
			expect(isCriteria({ ">=price": null })).toBe(false);
			expect(isCriteria({ "<price": [1, 2] })).toBe(false);
			expect(isCriteria({ "<=price": { nested: 1 } })).toBe(false);
		});

		it("should accept text search filter", () => {
			expect(isCriteria({ "~name": "widget" })).toBe(true);
		});

		it("should accept matching filters", () => {
			expect(isCriteria({ "?category": ["a", "b"] })).toBe(true);
			expect(isCriteria({ "!tags": ["featured"] })).toBe(true);
		});

		it("should accept ordering entries", () => {
			expect(isCriteria({ "+category": ["electronics"] })).toBe(true);
			expect(isCriteria({ "^price": 1 })).toBe(true);
			expect(isCriteria({ "^name": "asc" })).toBe(true);
			expect(isCriteria({ "^name": "desc" })).toBe(true);
		});

		it("should accept paging entries", () => {
			expect(isCriteria({ "@": 10 })).toBe(true);
			expect(isCriteria({ "#": 25 })).toBe(true);
		});

		it("should accept combined constraints", () => {
			expect(isCriteria({ ">=price": 50, "<=price": 150, "^price": 1, "@": 0, "#": 25 })).toBe(true);
		});

		it("should reject projection keys", () => {
			expect(isCriteria({ name: "" })).toBe(false);
			expect(isCriteria({ price: 0 })).toBe(false);
		});

		it("should reject non-objects", () => {
			expect(isCriteria(null)).toBe(false);
			expect(isCriteria(undefined)).toBe(false);
			expect(isCriteria("string")).toBe(false);
			expect(isCriteria(42)).toBe(false);
			expect(isCriteria([])).toBe(false);
		});

	});


	describe("isBinding", () => {

		describe("valid bindings", () => {

			it("should accept simple binding", () => {
				expect(isBinding("name=value")).toBe(true);
			});

			it("should accept binding with dotted path", () => {
				expect(isBinding("vendorName=vendor.name")).toBe(true);
			});

			it("should accept binding with transform", () => {
				expect(isBinding("releaseYear=year:releaseDate")).toBe(true);
			});

			it("should accept binding with aggregate", () => {
				expect(isBinding("total=count:")).toBe(true);
			});

			it("should accept binding with transform pipeline", () => {
				expect(isBinding("result=round:avg:scores")).toBe(true);
			});

			it("should accept binding with empty expression", () => {
				expect(isBinding("self=")).toBe(true);
			});

			it("should accept unicode identifiers", () => {
				expect(isBinding("名前=prénom")).toBe(true);
			});

			it("should accept identifiers with $ and _", () => {
				expect(isBinding("$result=_internal")).toBe(true);
			});

		});

		describe("invalid bindings", () => {

			it("should reject a bare identifier without an expression", () => {
				expect(isBinding("name")).toBe(false);
			});

			it("should reject non-string values", () => {
				expect(isBinding(null)).toBe(false);
				expect(isBinding(undefined)).toBe(false);
				expect(isBinding(123)).toBe(false);
				expect(isBinding({})).toBe(false);
			});

			it("should reject empty string", () => {
				expect(isBinding("")).toBe(false);
			});

			it("should reject missing identifier", () => {
				expect(isBinding("=value")).toBe(false);
			});

			it("should reject invalid identifier", () => {
				expect(isBinding("123name=value")).toBe(false);
			});

			it("should reject invalid expression", () => {
				expect(isBinding("name=.invalid")).toBe(false);
				expect(isBinding("name=:invalid")).toBe(false);
			});

		});

	});

	describe("isExpression", () => {

		describe("valid expressions", () => {

			it("should accept simple identifier", () => {
				expect(isExpression("name")).toBe(true);
			});

			it("should accept dotted path", () => {
				expect(isExpression("vendor.name")).toBe(true);
			});

			it("should accept deep path", () => {
				expect(isExpression("order.items.price")).toBe(true);
			});

			it("should accept single transform", () => {
				expect(isExpression("year:releaseDate")).toBe(true);
			});

			it("should accept transform pipeline", () => {
				expect(isExpression("round:avg:scores")).toBe(true);
			});

			it("should accept multiple transforms without path", () => {
				expect(isExpression("round:floor:abs:")).toBe(true);
			});

			it("should accept transform with dotted path", () => {
				expect(isExpression("sum:items.price")).toBe(true);
			});

			it("should accept unicode identifiers", () => {
				expect(isExpression("prénom")).toBe(true);
				expect(isExpression("名前")).toBe(true);
			});

			it("should accept identifiers with $ and _", () => {
				expect(isExpression("$price")).toBe(true);
				expect(isExpression("_internal")).toBe(true);
			});

		});

		describe("invalid expressions", () => {

			it("should reject non-string values", () => {
				expect(isExpression(null)).toBe(false);
				expect(isExpression(undefined)).toBe(false);
				expect(isExpression(123)).toBe(false);
				expect(isExpression({})).toBe(false);
			});

			it("should reject leading dot", () => {
				expect(isExpression(".name")).toBe(false);
			});

			it("should reject trailing dot", () => {
				expect(isExpression("name.")).toBe(false);
			});

			it("should reject double dots", () => {
				expect(isExpression("vendor..name")).toBe(false);
			});

			it("should reject leading colon", () => {
				expect(isExpression(":name")).toBe(false);
			});

			it("should reject dot before colon", () => {
				expect(isExpression("a.b:c")).toBe(false);
			});

			it("should reject unknown transform identifiers", () => {
				expect(isExpression("a:name")).toBe(false);
				expect(isExpression("unknown:name")).toBe(false);
				expect(isExpression("a:b:")).toBe(false);
				expect(isExpression("a:b:c:")).toBe(false);
			});

			it("should reject pipes with more than one aggregate transform", () => {
				// index.md §5.8.2: a pipe is well-formed only if it applies at most one aggregate
				expect(isExpression("sum:avg:price")).toBe(false);
				expect(isExpression("count:sum:")).toBe(false);
				expect(isExpression("min:max:price")).toBe(false);
			});

			it("should reject invalid characters", () => {
				expect(isExpression("name@field")).toBe(false);
				expect(isExpression("name#field")).toBe(false);
			});

		});

	});


	describe("isOptions", () => {

		describe("valid options", () => {

			it("should accept scalar option values", () => {
				expect(isOptions(null)).toBe(true);
				expect(isOptions(true)).toBe(true);
				expect(isOptions(42)).toBe(true);
				expect(isOptions("hello")).toBe(true);
				expect(isOptions("/products/42")).toBe(true);
			});

			it("should accept single-valued localised text map", () => {
				expect(isOptions({ "en": "hello" })).toBe(true);
				expect(isOptions({ "fr": "bonjour" })).toBe(true);
			});

			it("should accept multi-valued localised text map", () => {
				expect(isOptions({ "en": ["hello"] })).toBe(true);
				expect(isOptions({ "en": ["a", "b"] })).toBe(true);
			});

			it("should accept option arrays", () => {
				expect(isOptions([])).toBe(true);
				expect(isOptions([null])).toBe(true);
				expect(isOptions([true, false])).toBe(true);
				expect(isOptions([null, true])).toBe(true);
				expect(isOptions([1, 2, 3])).toBe(true);
				expect(isOptions([null, 1, 2])).toBe(true);
				expect(isOptions(["a", "b"])).toBe(true);
				expect(isOptions([null, "a"])).toBe(true);
				expect(isOptions(["/a", "/b"])).toBe(true);
			});

			it("should accept mixed-type arrays", () => {
				expect(isOptions([1, "a"])).toBe(true);
				expect(isOptions([null, true, 42, "tag", "/x"])).toBe(true);
			});

		});

		describe("invalid options", () => {

			it("should reject undefined", () => {
				expect(isOptions(undefined)).toBe(false);
			});

			it("should reject nested objects", () => {
				expect(isOptions({ nested: { id: "" } })).toBe(false);
			});

			it("should reject arrays with nested objects", () => {
				expect(isOptions([{ id: "" }])).toBe(false);
			});

		});

	});

	describe("isOption", () => {

		describe("valid options", () => {

			it("should accept null", () => {
				expect(isOption(null)).toBe(true);
			});

			it("should accept literals", () => {
				expect(isOption(true)).toBe(true);
				expect(isOption(false)).toBe(true);
				expect(isOption(0)).toBe(true);
				expect(isOption(42)).toBe(true);
				expect(isOption("")).toBe(true);
				expect(isOption("text")).toBe(true);
			});

			it("should accept references", () => {
				expect(isOption("/products/42")).toBe(true);
				expect(isOption("https://example.com/resource")).toBe(true);
			});

		});

		describe("invalid options", () => {

			it("should reject undefined", () => {
				expect(isOption(undefined)).toBe(false);
			});

			it("should reject objects", () => {
				expect(isOption({})).toBe(false);
				expect(isOption({ id: "" })).toBe(false);
			});

			it("should reject arrays", () => {
				expect(isOption([])).toBe(false);
				expect(isOption(["a", "b"])).toBe(false);
			});

		});

	});

	describe("isOrder", () => {

		describe("valid orders", () => {

			it("should accept direction shorthands", () => {
				expect(isOrder("asc")).toBe(true);
				expect(isOrder("desc")).toBe(true);
			});

			it("should accept signed integer precedences", () => {
				expect(isOrder(1)).toBe(true);
				expect(isOrder(2)).toBe(true);
				expect(isOrder(-1)).toBe(true);
				expect(isOrder(-3)).toBe(true);
			});

			it("should accept zero", () => {
				expect(isOrder(0)).toBe(true);
			});

		});

		describe("invalid orders", () => {

			it("should reject non-integer numbers", () => {
				expect(isOrder(1.5)).toBe(false);
				expect(isOrder(-0.1)).toBe(false);
				expect(isOrder(Number.NaN)).toBe(false);
				expect(isOrder(Number.POSITIVE_INFINITY)).toBe(false);
				expect(isOrder(Number.NEGATIVE_INFINITY)).toBe(false);
			});

			it("should reject other strings", () => {
				expect(isOrder("")).toBe(false);
				expect(isOrder("ascending")).toBe(false);
				expect(isOrder("ASC")).toBe(false);
				expect(isOrder("1")).toBe(false);
			});

			it("should reject null and undefined", () => {
				expect(isOrder(null)).toBe(false);
				expect(isOrder(undefined)).toBe(false);
			});

			it("should reject booleans", () => {
				expect(isOrder(true)).toBe(false);
				expect(isOrder(false)).toBe(false);
			});

			it("should reject objects and arrays", () => {
				expect(isOrder({})).toBe(false);
				expect(isOrder([1])).toBe(false);
			});

		});

	});


	describe("isProbe", () => {

		describe("valid probes", () => {

			it("should accept simple projection probe", () => {
				expect(isProbe({ target: "name", pipe: [], path: [] })).toBe(true);
			});

			it("should accept probe with path", () => {
				expect(isProbe({ target: "city", pipe: [], path: ["address"] })).toBe(true);
				expect(isProbe({ target: "city", pipe: [], path: ["customer", "address"] })).toBe(true);
			});

			it("should accept probe with pipe", () => {
				expect(isProbe({ target: "releaseYear", pipe: ["year"], path: ["releaseDate"] })).toBe(true);
				expect(isProbe({ target: "avgPrice", pipe: ["round", "avg"], path: ["price"] })).toBe(true);
			});

			it("should accept filtering probes", () => {
				expect(isProbe({ target: "<", pipe: [], path: ["price"] })).toBe(true);
				expect(isProbe({ target: ">=", pipe: [], path: ["price"] })).toBe(true);
				expect(isProbe({ target: "~", pipe: [], path: ["name"] })).toBe(true);
				expect(isProbe({ target: "?", pipe: [], path: ["category"] })).toBe(true);
			});

			it("should accept ordering probes", () => {
				expect(isProbe({ target: "+", pipe: [], path: ["category"] })).toBe(true);
				expect(isProbe({ target: "^", pipe: [], path: ["price"] })).toBe(true);
			});

			it("should accept paging probes", () => {
				expect(isProbe({ target: "@", pipe: [], path: [] })).toBe(true);
				expect(isProbe({ target: "#", pipe: [], path: [] })).toBe(true);
			});

		});

		describe("invalid probes", () => {

			it("should reject non-objects", () => {
				expect(isProbe(null)).toBe(false);
				expect(isProbe(undefined)).toBe(false);
				expect(isProbe("string")).toBe(false);
				expect(isProbe(123)).toBe(false);
			});

			it("should reject missing target", () => {
				expect(isProbe({ pipe: [], path: [] })).toBe(false);
			});

			it("should reject missing pipe", () => {
				expect(isProbe({ target: "name", path: [] })).toBe(false);
			});

			it("should reject missing path", () => {
				expect(isProbe({ target: "name", pipe: [] })).toBe(false);
			});

			it("should reject non-string target", () => {
				expect(isProbe({ target: 123, pipe: [], path: [] })).toBe(false);
			});

			it("should reject non-array pipe", () => {
				expect(isProbe({ target: "name", pipe: "year", path: [] })).toBe(false);
			});

			it("should reject unknown transforms in pipe", () => {
				expect(isProbe({ target: "name", pipe: ["unknown"], path: ["field"] })).toBe(false);
				expect(isProbe({ target: "name", pipe: ["year", "unknown"], path: ["field"] })).toBe(false);
			});

			it("should reject non-array path", () => {
				expect(isProbe({ target: "name", pipe: [], path: "address" })).toBe(false);
			});

			it("should reject unexpected properties", () => {
				expect(isProbe({ target: "name", pipe: [], path: [], extra: "value" })).toBe(false);
			});

		});

	});

	describe("isSelector", () => {

		describe("valid keys", () => {

			it.each([
				["<price"], [">price"], ["<=price"], [">=price"],
				["~name"], ["?category"], ["!tags"],
				["+focus"], ["^order"]
			])("should accept operator-prefixed key %s", (key) => {
				expect(isSelector(key)).toBe(true);
			});

			it("should accept pagination literals", () => {
				expect(isSelector("@")).toBe(true);
				expect(isSelector("#")).toBe(true);
			});

			it("should accept keys with dotted paths", () => {
				expect(isSelector(">=user.age")).toBe(true);
				expect(isSelector("^vendor.name")).toBe(true);
			});

			it("should accept keys with transform pipelines", () => {
				expect(isSelector(">=sum:price")).toBe(true);
				expect(isSelector("^round:avg:scores")).toBe(true);
			});

			it("should accept aggregate keys (empty path)", () => {
				expect(isSelector("^count:")).toBe(true);
			});

			it("should narrow the input type to a Criteria key", () => {
				const key: unknown = ">=price";
				if ( isSelector(key) ) {
					const narrowed: Criteria[keyof Criteria] extends never ? never : typeof key = key;
					void narrowed;
				}
			});

		});

		describe("invalid keys", () => {

			it("should reject non-string values", () => {
				expect(isSelector(null)).toBe(false);
				expect(isSelector(undefined)).toBe(false);
				expect(isSelector(123)).toBe(false);
				expect(isSelector({})).toBe(false);
				expect(isSelector([])).toBe(false);
				expect(isSelector(true)).toBe(false);
			});

			it("should reject plain identifiers", () => {
				expect(isSelector("name")).toBe(false);
				expect(isSelector("price")).toBe(false);
			});

			it("should reject unknown operator prefixes", () => {
				expect(isSelector("=price")).toBe(false);
				expect(isSelector("*price")).toBe(false);
				expect(isSelector("&price")).toBe(false);
			});

			it("should reject bindings", () => {
				expect(isSelector("name=price")).toBe(false);
				expect(isSelector("total=sum:price")).toBe(false);
			});

			it("should reject operator keys with malformed expression suffix", () => {
				expect(isSelector(">=.name")).toBe(false);
				expect(isSelector(">=1invalid")).toBe(false);
				expect(isSelector("~name..path")).toBe(false);
				expect(isSelector("^unknown:price")).toBe(false);
			});

			it("should reject literal-like keys that aren't exact @ / #", () => {
				expect(isSelector("@offset")).toBe(false);
				expect(isSelector("#limit")).toBe(false);
				expect(isSelector("@@")).toBe(false);
				expect(isSelector(":")).toBe(false);
			});

		});

	});

	describe("isOperator", () => {

		describe("valid operators", () => {

			it.each([
				["<"], [">"], ["<="], [">="],
				["~"], ["?"], ["!"],
				["+"], ["^"],
				["@"], ["#"]
			])("should accept %s", (op) => {
				expect(isOperator(op)).toBe(true);
			});

		});

		describe("invalid operators", () => {

			it("should reject non-string values", () => {
				expect(isOperator(null)).toBe(false);
				expect(isOperator(undefined)).toBe(false);
				expect(isOperator(123)).toBe(false);
				expect(isOperator({})).toBe(false);
			});

			it("should reject invalid operator strings", () => {
				expect(isOperator("")).toBe(false);
				expect(isOperator("=")).toBe(false);
				expect(isOperator("!=")).toBe(false);
				expect(isOperator("==")).toBe(false);
				expect(isOperator("&&")).toBe(false);
				expect(isOperator(":")).toBe(false);
				expect(isOperator("name")).toBe(false);
			});

		});

	});

	describe("isTransform", () => {

		describe("valid transforms", () => {

			it.each([
				["count"], ["min"], ["max"], ["sum"], ["avg"],
				["abs"], ["floor"], ["ceil"], ["round"],
				["lower"], ["upper"], ["length"],
				["year"], ["month"], ["day"], ["hours"], ["minutes"], ["seconds"]
			])("should accept %s", (transform) => {
				expect(isTransform(transform)).toBe(true);
			});

		});

		describe("invalid transforms", () => {

			it("should reject non-string values", () => {
				expect(isTransform(null)).toBe(false);
				expect(isTransform(undefined)).toBe(false);
				expect(isTransform(123)).toBe(false);
				expect(isTransform({})).toBe(false);
			});

			it("should reject unknown identifiers", () => {
				expect(isTransform("unknown")).toBe(false);
				expect(isTransform("a")).toBe(false);
				expect(isTransform("name")).toBe(false);
				expect(isTransform("")).toBe(false);
			});

		});

	});

	describe("isAggregate", () => {

		describe("valid aggregates", () => {

			it.each([
				["count"], ["min"], ["max"], ["sum"], ["avg"]
			])("should accept %s", (aggregate) => {
				expect(isAggregate(aggregate)).toBe(true);
			});

		});

		describe("invalid aggregates", () => {

			it.each([
				["abs"], ["floor"], ["ceil"], ["round"],
				["lower"], ["upper"], ["length"],
				["year"], ["month"], ["day"], ["hours"], ["minutes"], ["seconds"]
			])("should reject non-aggregate transform %s", (transform) => {
				expect(isAggregate(transform)).toBe(false);
			});

			it("should reject unknown identifiers", () => {
				expect(isAggregate("unknown")).toBe(false);
				expect(isAggregate("")).toBe(false);
			});

			it("should reject non-string values", () => {
				expect(isAggregate(null)).toBe(false);
				expect(isAggregate(undefined)).toBe(false);
				expect(isAggregate(123)).toBe(false);
				expect(isAggregate({})).toBe(false);
			});

		});

	});


	describe("arbitrary JSON hardening", () => {

		describe("isTemplate", () => {

			it("should reject non-plain objects", () => {
				expect(isTemplate(new Date())).toBe(false);
				expect(isTemplate(/regex/)).toBe(false);
				expect(isTemplate(new Map())).toBe(false);
				expect(isTemplate(new Set())).toBe(false);
				expect(isTemplate(new Error("boom"))).toBe(false);
				expect(isTemplate(Object.create(null))).toBe(false);

				class Custom {id = "";}

				expect(isTemplate(new Custom())).toBe(false);
			});

			it("should reject functions, symbols, bigints", () => {
				expect(isTemplate(() => {})).toBe(false);
				expect(isTemplate(Symbol("x"))).toBe(false);
				expect(isTemplate(BigInt(1))).toBe(false);
			});

			it("should reject non-object entry values", () => {
				expect(isTemplate({ x: "" })).toBe(false);
				expect(isTemplate({ x: 0 })).toBe(false);
				expect(isTemplate({ x: true })).toBe(false);
				expect(isTemplate({ x: null })).toBe(false);
				expect(isTemplate({ x: Number.NaN })).toBe(false);
			});

			it("should reject non-identifier keys", () => {
				expect(isTemplate({ "foo.bar": {} })).toBe(false);
				expect(isTemplate({ "@id": {} })).toBe(false);
				expect(isTemplate({ "ns:prop": {} })).toBe(false);
				expect(isTemplate({ "123": {} })).toBe(false);
			});

			it("should reject non-plain objects nested as values", () => {
				expect(isTemplate({ when: new Date() })).toBe(false);
				expect(isTemplate({ pattern: /regex/ })).toBe(false);
			});

			it("should reject deeply nested invalid structures", () => {
				expect(isTemplate({ outer: { "foo.bar": {} } })).toBe(false);
				expect(isTemplate({ outer: { inner: new Date() } })).toBe(false);
			});

			it("should accept JSON.parse output of a valid template", () => {
				const json = JSON.stringify({
					id: {},
					name: {},
					vendor: { id: {}, name: {} },
					label: { en: {}, de: {} },
					items: { name: {}, "#": 10 }
				});

				expect(isTemplate(JSON.parse(json))).toBe(true);
			});

		});

		describe("isPlaceholder", () => {

			it("should reject non-plain objects", () => {
				expect(isPlaceholder(new Date())).toBe(false);
				expect(isPlaceholder(new Map())).toBe(false);
				expect(isPlaceholder(Object.create(null))).toBe(false);
			});

			it("should reject functions, symbols, bigints", () => {
				expect(isPlaceholder(() => {})).toBe(false);
				expect(isPlaceholder(Symbol("x"))).toBe(false);
				expect(isPlaceholder(BigInt(1))).toBe(false);
			});

			it("should reject non-finite numbers", () => {
				expect(isPlaceholder(Number.NaN)).toBe(false);
				expect(isPlaceholder(Number.POSITIVE_INFINITY)).toBe(false);
			});

		});

		describe("isUnion", () => {

			it("should reject non-plain objects", () => {
				expect(isUnion(new Date())).toBe(false);
				expect(isUnion(new Map())).toBe(false);
				expect(isUnion(Object.create(null))).toBe(false);
			});

			it("should reject non-finite numbers", () => {
				expect(isUnion(Number.NaN)).toBe(false);
				expect(isUnion(Number.POSITIVE_INFINITY)).toBe(false);
			});

			it("should reject non-canonical branch keys", () => {
				expect(isUnion({ "00": {} })).toBe(false);
				expect(isUnion({ "0.0": {} })).toBe(false);
				expect(isUnion({ "+1": {} })).toBe(false);
				expect(isUnion({ " 0": {} })).toBe(false);
				expect(isUnion({ "0 ": {} })).toBe(false);
			});

			it("should accept canonical branch keys", () => {
				expect(isUnion({ "0": {} })).toBe(true);
				expect(isUnion({ "10": {} })).toBe(true);
				expect(isUnion({ "99": {} })).toBe(true);
			});

			it("should reject branches holding invalid placeholders", () => {
				expect(isUnion({ "0": null })).toBe(false);
				expect(isUnion({ "0": "" })).toBe(false);
				expect(isUnion({ "0": new Date() })).toBe(false);
				expect(isUnion({ "0": Number.NaN })).toBe(false);
			});

		});

		describe("isLocale", () => {

			it("should reject non-plain objects", () => {
				expect(isLocale(new Date())).toBe(false);
				expect(isLocale(new Map())).toBe(false);
				expect(isLocale(Object.create(null))).toBe(false);
			});

			it("should reject functions, symbols, bigints", () => {
				expect(isLocale(() => {})).toBe(false);
				expect(isLocale(Symbol("x"))).toBe(false);
				expect(isLocale(BigInt(1))).toBe(false);
			});

			it("should reject non-leaf values in tag-range maps", () => {
				expect(isLocale({ en: 42 })).toBe(false);
				expect(isLocale({ en: null })).toBe(false);
				expect(isLocale({ en: new Date() })).toBe(false);
			});

		});

		describe("isProjection", () => {

			it("should reject non-plain objects", () => {
				expect(isProjection(new Date())).toBe(false);
				expect(isProjection(new Map())).toBe(false);
				expect(isProjection(Object.create(null))).toBe(false);
			});

			it("should reject invalid binding keys", () => {
				expect(isProjection({ "=value": {} })).toBe(false);
				expect(isProjection({ "123name=value": {} })).toBe(false);
				expect(isProjection({ "name=.bad": {} })).toBe(false);
				expect(isProjection({ "name=unknown:path": {} })).toBe(false);
			});

			it("should reject non-object cell values", () => {
				expect(isProjection({ "x=x": "" })).toBe(false);
				expect(isProjection({ "x=x": Number.NaN })).toBe(false);
				expect(isProjection({ "items=items": ["a", "b"] })).toBe(false);
			});

			it("should reject invalid nested values", () => {
				expect(isProjection({ "item=item": new Date() })).toBe(false);
				expect(isProjection({ "item=item": [] })).toBe(false);
				expect(isProjection({ "item=item": [{ id: {} }] })).toBe(false);
			});

		});

		describe("isCriteria", () => {

			it("should reject non-plain objects", () => {
				expect(isCriteria(new Date())).toBe(false);
				expect(isCriteria(new Map())).toBe(false);
				expect(isCriteria(Object.create(null))).toBe(false);
			});

			it("should reject unknown operator prefixes", () => {
				expect(isCriteria({ "=price": 50 })).toBe(false);
				expect(isCriteria({ "&price": 50 })).toBe(false);
				expect(isCriteria({ "%price": 50 })).toBe(false);
			});

			it("should reject non-literal comparison values", () => {
				expect(isCriteria({ ">=price": null })).toBe(false);
				expect(isCriteria({ ">=price": undefined })).toBe(false);
				expect(isCriteria({ ">=price": new Date() })).toBe(false);
				expect(isCriteria({ ">=price": Number.NaN })).toBe(false);
			});

			it("should reject non-string text search values", () => {
				expect(isCriteria({ "~name": 42 })).toBe(false);
				expect(isCriteria({ "~name": null })).toBe(false);
				expect(isCriteria({ "~name": ["widget"] })).toBe(false);
			});

			it("should reject invalid options in matching filters", () => {
				expect(isCriteria({ "?cat": undefined })).toBe(false);
				expect(isCriteria({ "?cat": [new Date()] })).toBe(false);
				expect(isCriteria({ "!tags": [() => {}] })).toBe(false);
			});

			it("should reject invalid sort priority values", () => {
				expect(isCriteria({ "^price": null })).toBe(false);
				expect(isCriteria({ "^price": "ascending" })).toBe(false);
				expect(isCriteria({ "^price": Number.NaN })).toBe(false);
				expect(isCriteria({ "^price": true })).toBe(false);
			});

			it("should reject non-numeric paging values", () => {
				expect(isCriteria({ "@": "10" })).toBe(false);
				expect(isCriteria({ "#": null })).toBe(false);
				expect(isCriteria({ "@": Number.NaN })).toBe(false);
				expect(isCriteria({ "#": Number.POSITIVE_INFINITY })).toBe(false);
			});

			it("should reject negative and non-integer paging values", () => {
				// index.md §5.7.6 / ABNF `offset` = `limit` = 1*DIGIT: non-negative integers only
				expect(isCriteria({ "@": -1 })).toBe(false);
				expect(isCriteria({ "@": 1.5 })).toBe(false);
				expect(isCriteria({ "#": -5 })).toBe(false);
				expect(isCriteria({ "#": 2.5 })).toBe(false);
			});

			it("should reject malformed expression parts after operator prefix", () => {
				expect(isCriteria({ "<foo-bar": 1 })).toBe(false);
				expect(isCriteria({ ">=foo.123": 1 })).toBe(false);
				expect(isCriteria({ "~foo..bar": "x" })).toBe(false);
				expect(isCriteria({ "?.name": ["a"] })).toBe(false);
				expect(isCriteria({ "!unknownTransform:name": ["a"] })).toBe(false);
				expect(isCriteria({ "+name.": ["a"] })).toBe(false);
				expect(isCriteria({ "^foo-bar": "asc" })).toBe(false);
			});

			it("should accept well-formed expression parts", () => {
				expect(isCriteria({ "<price": 50 })).toBe(true);
				expect(isCriteria({ ">=vendor.price": 50 })).toBe(true);
				expect(isCriteria({ "~name": "widget" })).toBe(true);
				expect(isCriteria({ "?category": ["a"] })).toBe(true);
				expect(isCriteria({ "!round:avg:scores": [1] })).toBe(true);
				expect(isCriteria({ "^year:releaseDate": "desc" })).toBe(true);
				expect(isCriteria({ "<": 0 })).toBe(true);
				expect(isCriteria({ "<count:": 10 })).toBe(true);
			});

		});

		describe("isBinding", () => {

			it("should reject non-string values", () => {
				expect(isBinding(new Date())).toBe(false);
				expect(isBinding(new Map())).toBe(false);
				expect(isBinding(Object.create(null))).toBe(false);
				expect(isBinding([])).toBe(false);
				expect(isBinding(Symbol("x"))).toBe(false);
				expect(isBinding(BigInt(1))).toBe(false);
			});

			it("should reject bindings whose name part is not an identifier", () => {
				expect(isBinding("foo-bar=x")).toBe(false);
				expect(isBinding("foo.bar=x")).toBe(false);
				expect(isBinding("ns:prop=x")).toBe(false);
				expect(isBinding("@id=x")).toBe(false);
			});

			it("should reject bindings whose expression part is invalid", () => {
				expect(isBinding("name=a.b.")).toBe(false);
				expect(isBinding("name=.a")).toBe(false);
				expect(isBinding("name=unknownTransform:field")).toBe(false);
			});

		});

		describe("isExpression", () => {

			it("should reject non-string values", () => {
				expect(isExpression(new Date())).toBe(false);
				expect(isExpression(new Map())).toBe(false);
				expect(isExpression([])).toBe(false);
				expect(isExpression(Symbol("x"))).toBe(false);
				expect(isExpression(42)).toBe(false);
			});

			it("should reject paths with non-identifier segments", () => {
				expect(isExpression("foo-bar")).toBe(false);
				expect(isExpression("foo.123")).toBe(false);
				expect(isExpression("123.foo")).toBe(false);
				expect(isExpression("foo.@bar")).toBe(false);
			});

		});

		describe("isOptions", () => {

			it("should reject non-plain objects", () => {
				expect(isOptions(new Date())).toBe(false);
				expect(isOptions(new Map())).toBe(false);
				expect(isOptions(Object.create(null))).toBe(false);
			});

			it("should reject non-finite numbers", () => {
				expect(isOptions(Number.NaN)).toBe(false);
				expect(isOptions(Number.POSITIVE_INFINITY)).toBe(false);
				expect(isOptions([Number.NaN])).toBe(false);
			});

			it("should reject arrays containing non-plain objects", () => {
				expect(isOptions([new Date()])).toBe(false);
				expect(isOptions([/regex/])).toBe(false);
			});

			it("should reject arrays containing undefined", () => {
				expect(isOptions([undefined])).toBe(false);
				expect(isOptions([1, undefined])).toBe(false);
			});

		});

		describe("isOption", () => {

			it("should reject non-finite numbers", () => {
				expect(isOption(Number.NaN)).toBe(false);
				expect(isOption(Number.POSITIVE_INFINITY)).toBe(false);
				expect(isOption(Number.NEGATIVE_INFINITY)).toBe(false);
			});

			it("should reject non-plain objects", () => {
				expect(isOption(new Date())).toBe(false);
				expect(isOption(new Map())).toBe(false);
				expect(isOption(Object.create(null))).toBe(false);
			});

			it("should reject functions, symbols, bigints", () => {
				expect(isOption(() => {})).toBe(false);
				expect(isOption(Symbol("x"))).toBe(false);
				expect(isOption(BigInt(1))).toBe(false);
			});

		});

		describe("isProbe", () => {

			it("should reject non-plain objects", () => {
				expect(isProbe(new Date())).toBe(false);
				expect(isProbe(new Map())).toBe(false);
				expect(isProbe(Object.create(null))).toBe(false);
			});

			it("should reject target that is neither identifier nor operator", () => {
				expect(isProbe({ target: "foo-bar", pipe: [], path: [] })).toBe(false);
				expect(isProbe({ target: "?=", pipe: [], path: [] })).toBe(false);
				expect(isProbe({ target: "", pipe: [], path: [] })).toBe(false);
				expect(isProbe({ target: null, pipe: [], path: [] })).toBe(false);
			});

			it("should reject non-identifier elements in path", () => {
				expect(isProbe({ target: "name", pipe: [], path: ["foo-bar"] })).toBe(false);
				expect(isProbe({ target: "name", pipe: [], path: [123] })).toBe(false);
				expect(isProbe({ target: "name", pipe: [], path: [null] })).toBe(false);
			});

			it("should reject pipe elements that are not known transforms", () => {
				expect(isProbe({ target: "name", pipe: ["frobnicate"], path: [] })).toBe(false);
				expect(isProbe({ target: "name", pipe: [42], path: [] })).toBe(false);
			});

		});

		describe("isOperator", () => {

			it("should reject non-string values", () => {
				expect(isOperator(new Date())).toBe(false);
				expect(isOperator(Symbol("<"))).toBe(false);
				expect(isOperator(42)).toBe(false);
			});

			it("should reject operator combinations", () => {
				expect(isOperator("<>")).toBe(false);
				expect(isOperator("<<")).toBe(false);
				expect(isOperator("<=>")).toBe(false);
			});

		});

		describe("isTransform", () => {

			it("should reject non-string values", () => {
				expect(isTransform(new Date())).toBe(false);
				expect(isTransform(Symbol("sum"))).toBe(false);
				expect(isTransform(42)).toBe(false);
			});

			it("should reject case variants of known transforms", () => {
				expect(isTransform("SUM")).toBe(false);
				expect(isTransform("Count")).toBe(false);
				expect(isTransform(" sum")).toBe(false);
				expect(isTransform("sum ")).toBe(false);
			});

		});

	});

	describe("subtle edge cases", () => {

		describe("form overlap", () => {

			it("should accept the atomic under every form", () => {
				// `{}` is simultaneously a Atomic, an empty Template, an empty Locale and an
				// empty Union: the forms are told apart by the model, not by the notation
				expect(isAtomic({})).toBe(true);
				expect(isTemplate({})).toBe(true);
				expect(isLocale({})).toBe(true);
				expect(isUnion({})).toBe(true);
			});

			it("should accept an identifier-keyed map as both template and locale", () => {
				// `en` is at once a valid property identifier and a valid basic language range
				expect(isTemplate({ en: {} })).toBe(true);
				expect(isLocale({ en: {} })).toBe(true);
			});

			it("should reject identifier-keyed objects as unions", () => {
				expect(isUnion({ $price: {} })).toBe(false);
				expect(isUnion({ _internal: {} })).toBe(false);
			});

		});

		describe("isExpression edge cases", () => {

			it("should accept empty string as aggregate expression", () => {
				expect(isExpression("")).toBe(true);
			});

			it("should accept aggregate-only transform pipelines", () => {
				expect(isExpression("count:")).toBe(true);
				expect(isExpression("round:avg:")).toBe(true);
				expect(isExpression("round:round:round:")).toBe(true);
			});

			it("should reject lone colon", () => {
				expect(isExpression(":")).toBe(false);
			});

			it("should reject empty transform between colons", () => {
				expect(isExpression("count::name")).toBe(false);
				expect(isExpression("::name")).toBe(false);
			});

			it("should reject path before colon (transforms can't follow path)", () => {
				expect(isExpression("name:count")).toBe(false);
				expect(isExpression("a.b:count")).toBe(false);
			});

			it("should accept transforms as path segments", () => {
				// A transform name is also an ECMAScript identifier and thus valid as a path segment
				expect(isExpression("count")).toBe(true);
				expect(isExpression("avg.min")).toBe(true);
			});

		});

		describe("isBinding edge cases", () => {

			it("should reject bindings with multiple equals in the name part", () => {
				expect(isBinding("a=b=c")).toBe(false);
			});

			it("should accept a binding with an empty expression after the equals sign", () => {
				// "a=" splits at the first "="; the remainder "" is a valid (aggregate) expression
				expect(isBinding("a=")).toBe(true);
			});

			it("should reject binding whose name part is empty", () => {
				expect(isBinding("=name")).toBe(false);
				expect(isBinding("=")).toBe(false);
			});

		});

		describe("isCriteria expression validation edge cases", () => {

			it("should accept operator-only keys with empty expression (root/aggregate)", () => {
				expect(isCriteria({ "<": 0 })).toBe(true);
				expect(isCriteria({ ">=": 0 })).toBe(true);
				expect(isCriteria({ "~": "" })).toBe(true);
				expect(isCriteria({ "?": [1] })).toBe(true);
			});

			it("should reject `<==` (empty op tail followed by invalid expression)", () => {
				// "<==" starts with "<=" → slice(2)="=" → not an identifier → invalid expression
				expect(isCriteria({ "<==": 1 })).toBe(false);
			});

			it("should accept aggregate transforms in filter keys", () => {
				expect(isCriteria({ ">=count:": 10 })).toBe(true);
				expect(isCriteria({ "<avg:price": 100 })).toBe(true);
			});

			it("should reject unknown transforms in filter keys", () => {
				expect(isCriteria({ ">=unknown:price": 10 })).toBe(false);
				expect(isCriteria({ "^frobnicate:name": "asc" })).toBe(false);
			});

			it("should reject dotted path with empty segments", () => {
				expect(isCriteria({ ">=a..b": 1 })).toBe(false);
				expect(isCriteria({ ">=.a": 1 })).toBe(false);
				expect(isCriteria({ ">=a.": 1 })).toBe(false);
			});

			it("should reject focus ordering with invalid expression", () => {
				expect(isCriteria({ "+foo-bar": ["a"] })).toBe(false);
			});

			it("should reject sort priority as boolean or bigint", () => {
				expect(isCriteria({ "^price": true })).toBe(false);
				expect(isCriteria({ "^price": BigInt(1) })).toBe(false);
			});

			it("should accept signed integer sort priorities and reject fractional ones", () => {
				// index.md §5.7.5 / CDDL `order => "asc" / "desc" / int`: priorities are signed integers
				expect(isCriteria({ "^price": -1 })).toBe(true);
				expect(isCriteria({ "^price": 0 })).toBe(true);
				expect(isCriteria({ "^price": 2.5 })).toBe(false);
			});

		});

		describe("isProbe edge cases", () => {

			it("should reject empty string target", () => {
				expect(isProbe({ target: "", pipe: [], path: [] })).toBe(false);
			});

			it("should reject numeric or boolean target", () => {
				expect(isProbe({ target: 0, pipe: [], path: [] })).toBe(false);
				expect(isProbe({ target: true, pipe: [], path: [] })).toBe(false);
			});

			it("should reject path with empty-string segment", () => {
				expect(isProbe({ target: "name", pipe: [], path: [""] })).toBe(false);
				expect(isProbe({ target: "name", pipe: [], path: ["a", "", "b"] })).toBe(false);
			});

			it("should reject non-string non-transform values in pipe", () => {
				expect(isProbe({ target: "name", pipe: [null], path: [] })).toBe(false);
				expect(isProbe({ target: "name", pipe: [true], path: [] })).toBe(false);
			});

			it("should accept operator targets with path or pipe", () => {
				expect(isProbe({ target: "~", pipe: [], path: ["name"] })).toBe(true);
				expect(isProbe({ target: ">=", pipe: ["year"], path: ["releaseDate"] })).toBe(true);
			});

		});

		describe("isLocale edge cases", () => {

			it("should reject empty-string-keyed entries", () => {
				expect(isLocale({ "": {} })).toBe(false);
			});

			it("should reject extended language ranges", () => {
				// RFC 4647 basic ranges only: trailing, interior, and leading `*` subtags are invalid
				expect(isLocale({ "en-*": {} })).toBe(false);
				expect(isLocale({ "de-*-DE": {} })).toBe(false);
				expect(isLocale({ "*-CH": {} })).toBe(false);
			});

		});

		describe("prototype pollution resilience", () => {

			it("should accept plain objects with prototype-relevant key names", () => {
				// These are valid ECMAScript identifiers and must be accepted as ordinary keys;
				// isObject uses Object.entries/Object.keys which iterate own enumerable properties
				expect(isTemplate({ constructor: {} })).toBe(true);
				expect(isTemplate({ hasOwnProperty: {} })).toBe(true);
				expect(isTemplate({ toString: {} })).toBe(true);
			});

			it("should accept JSON-parsed objects whose only property is __proto__", () => {
				// JSON.parse(`{"__proto__": {...}}`) creates __proto__ as own property, not
				// prototype. "__proto__" starts with underscores so it IS a valid identifier.
				// Intent: guards should handle it uniformly as any other identifier key.
				const parsed = JSON.parse("{\"__proto__\": {}}");

				expect(isTemplate(parsed)).toBe(true);
			});

			it("should reject objects with non-plain prototype even if keys look valid", () => {
				const weird = Object.create({ id: {} });
				weird.name = {};

				expect(isTemplate(weird)).toBe(false);
			});

		});

		describe("nested recursion boundaries", () => {

			it("should reject a template whose nested entry matches no retrieval form", () => {
				expect(isTemplate({ outer: { "foo.bar": {}, "0": {} } })).toBe(false);
			});

			it("should reject a criteria entry whose filter value contains a non-plain object", () => {
				expect(isCriteria({ "?category": [new Date()] })).toBe(false);
			});

			it("should reject deeply nested resource inside criteria options", () => {
				expect(isCriteria({ "?vendor": [{ "foo.bar": "x" }] })).toBe(false);
			});

			it("should accept deeply nested valid templates", () => {
				const deep = { a: { b: { c: { d: { e: { f: {} } } } } } };

				expect(isTemplate(deep)).toBe(true);
			});

			it("should accept constraints at every nesting level", () => {
				const nested = { items: { vendor: { products: { "#": 5 } }, "#": 10 } };

				expect(isTemplate(nested)).toBe(true);
			});

		});

	});

});


describe("codecs", () => {

	describe("encodeTemplate()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const template: Template = { items: { "?vendor": "/vendors/acme" } };

				expect(() => encodeTemplate(template, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should internalize absolute IRI to root-relative", () => {
				const template: Template = { items: { "?vendor": "https://example.com/vendors/acme" } };

				expect(encodeTemplate(template, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ items: { "?vendor": "/vendors/acme" } }));
			});

		});

		describe("format option", () => {

			it("should default to json encoding", () => {
				const template: Template = { id: {} };

				expect(encodeTemplate(template)).toBe("{\"id\":{}}");
			});

			it("should produce plain JSON when format is json", () => {
				const template: Template = { id: {} };

				expect(encodeTemplate(template, { format: "json" })).toBe("{\"id\":{}}");
			});

			it("should produce URL-encoded JSON when format is url", () => {
				const template: Template = { id: {} };

				expect(encodeTemplate(template, { format: "url" })).toBe("%7B%22id%22%3A%7B%7D%7D");
			});

			it("should produce URL-safe base64-encoded JSON when format is base64", () => {
				const template: Template = { id: {} };

				expect(encodeTemplate(template, { format: "base64" })).toBe("eyJpZCI6e319");
			});

			it("should strip base64 padding when format is base64", () => {
				expect(encodeTemplate({}, { format: "base64" })).toBe("e30");
			});

		});

		it("should use app base when base option is omitted", () => {
			const template: Template = { items: { "?vendor": "app:/vendors/acme" } };

			expect(encodeTemplate(template))
				.toBe(JSON.stringify({ items: { "?vendor": "/vendors/acme" } }));
		});

		it("should encode empty template", () => {
			expect(encodeTemplate({})).toBe(JSON.stringify({}));
		});

		it("should encode template with value leaves", () => {
			const template: Template = {
				id: {},
				name: {},
				price: {},
				available: {}
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should encode template with nested template", () => {
			const template: Template = {
				id: {},
				vendor: { id: {}, name: {} }
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should encode template with constrained collection entries", () => {
			const template: Template = {
				id: {},
				items: { name: {}, "^name": "asc", "#": 10 }
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should encode template with locale values", () => {
			const template: Template = {
				id: {},
				name: { en: {}, fr: {} }
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should omit undefined-valued properties", () => {
			const template: Template = {
				id: {},
				name: undefined,
				price: {}
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify({ id: {}, price: {} }));
		});

		it("should indent output when indent is true", () => {
			expect(encodeTemplate({ id: {} }, { indent: true })).toBe("{\n  \"id\": {}\n}");
		});

		it("should indent output by the given number of spaces", () => {
			expect(encodeTemplate({ id: {} }, { indent: 4 })).toBe("{\n    \"id\": {}\n}");
		});

		it("should produce compact output when indent is false", () => {
			expect(encodeTemplate({ id: {} }, { indent: false })).toBe("{\"id\":{}}");
		});

		it("should produce compact output when indent is zero", () => {
			expect(encodeTemplate({ id: {} }, { indent: 0 })).toBe("{\"id\":{}}");
		});

	});

	describe("decodeTemplate()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const json = JSON.stringify({ items: { "?vendor": "/vendors/acme" } });

				expect(() => decodeTemplate(json, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should resolve root-relative IRI to absolute", () => {
				const json = JSON.stringify({ items: { "?vendor": "/vendors/acme" } });

				expect(decodeTemplate(json, { base: "https://example.com/" }))
					.toEqual({ items: { "?vendor": "https://example.com/vendors/acme" } });
			});

		});

		describe("format auto-detection", () => {

			it("should decode plain JSON input", () => {
				expect(decodeTemplate("{\"id\":{}}")).toEqual({ id: {} });
			});

			it("should decode URL-encoded JSON input", () => {
				expect(decodeTemplate("%7B%22id%22%3A%7B%7D%7D")).toEqual({ id: {} });
			});

			it("should decode URL-safe base64-encoded JSON input", () => {
				expect(decodeTemplate("eyJpZCI6e319")).toEqual({ id: {} });
			});

			it("should decode unpadded base64url input", () => {
				expect(decodeTemplate("e30")).toEqual({});
			});

			it("should roundtrip a template through each transport format", () => {
				const template: Template = { id: {}, name: {}, vendor: { id: {}, name: {} } };

				expect(decodeTemplate(encodeTemplate(template, { format: "json" }))).toEqual(template);
				expect(decodeTemplate(encodeTemplate(template, { format: "url" }))).toEqual(template);
				expect(decodeTemplate(encodeTemplate(template, { format: "base64" }))).toEqual(template);
			});

		});

		it("should use app base when base option is omitted", () => {
			const json = JSON.stringify({ items: { "?vendor": "/vendors/acme" } });

			expect(decodeTemplate(json))
				.toEqual({ items: { "?vendor": "app:/vendors/acme" } });
		});

		it("should decode empty template", () => {
			expect(decodeTemplate(JSON.stringify({}))).toEqual({});
		});

		it("should decode template with value leaves", () => {
			const json = JSON.stringify({
				id: {},
				name: {},
				price: {},
				available: {}
			});

			expect(decodeTemplate(json)).toEqual({
				id: {},
				name: {},
				price: {},
				available: {}
			});
		});

		it("should decode template with nested template", () => {
			const json = JSON.stringify({
				id: {},
				vendor: {
					id: {},
					name: {}
				}
			});

			expect(decodeTemplate(json)).toEqual({
				id: {},
				vendor: {
					id: {},
					name: {}
				}
			});
		});

		it("should roundtrip with encodeTemplate", () => {
			const template: Template = {
				id: {},
				name: {},
				items: { name: {}, "?vendor": "app:/vendors/acme", "#": 10 }
			};

			expect(decodeTemplate(encodeTemplate(template))).toEqual(template);
		});

		it("should throw on unknown encoded format", () => {
			// "not valid json" has no `{`/`%`/`e` prefix, so it hits the unknown-format branch
			expect(() => decodeTemplate("not valid json")).toThrow(TypeError);
		});

		it("should throw on unparseable JSON", () => {
			// `{` prefix selects the JSON branch, but the body is not valid JSON
			expect(() => decodeTemplate("{not json")).toThrow(SyntaxError);
		});

		it("should throw on non-template JSON", () => {
			expect(() => decodeTemplate(JSON.stringify([1, 2, 3]))).toThrow(TypeError);
		});

		describe("lenient option", () => {

			it("should skip structural validation when lenient", () => {
				// a non-template value parses cleanly but fails validation; lenient lets it through
				const json = JSON.stringify({ "foo.bar": {} });

				expect(() => decodeTemplate(json, { lenient: true })).not.toThrow();
				expect(decodeTemplate(json, { lenient: true })).toEqual({ "foo.bar": {} });
			});

			it("should still throw on syntax errors when lenient", () => {
				expect(() => decodeTemplate("{not json", { lenient: true })).toThrow(SyntaxError);
			});

		});

	});


	describe("encodeCriteria()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const query = { id: "/products/42" };

				expect(() => encodeCriteria(query, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should internalize absolute IRI to root-relative", () => {
				const criteria = { "?vendor": "https://example.com/vendors/acme" } as Criteria;

				const encoded = encodeCriteria(criteria, { base: "https://example.com/" });

				expect(encoded).toBe("%3Fvendor=%22%2Fvendors%2Facme%22");
			});

		});

		it("should use app base when base option is omitted", () => {
			const criteria = { "?vendor": "app:/vendors/acme" } as Criteria;
			const encoded = encodeCriteria(criteria);

			expect(encoded).toBe("%3Fvendor=%22%2Fvendors%2Facme%22");
		});

		describe("form format", () => {

			describe("basic constraints", () => {

				it("should encode empty query", () => {
					const query = {} as Criteria;
					const encoded = encodeCriteria(query);

					expect(encoded).toBe("");
				});

				it("should encode single constraint", () => {
					const query = { "?name": "widget" } as Criteria;
					const encoded = encodeCriteria(query);

					// ?name="widget"
					expect(encoded).toBe("%3Fname=%22widget%22");
				});

				it("should encode multiple constraints", () => {
					const query = { "?name": "widget", ">=price": 100 } as Criteria;
					const encoded = encodeCriteria(query);

					// ?name="widget"&>=price=100
					expect(encoded).toBe("%3Fname=%22widget%22&%3E%3Dprice=100");
				});

			});

			describe("comparison operators", () => {

				it.each([
					["less than", { "<price": 100 }, "%3Cprice=100"],
					["less than or equal", { "<=price": 100 }, "%3C%3Dprice=100"],
					["greater than", { ">price": 50 }, "%3Eprice=50"],
					["greater than or equal", { ">=price": 50 }, "%3E%3Dprice=50"]
				] as const)("should encode %s", (_, query, encoded) => {
					expect(encodeCriteria(query as Criteria)).toBe(encoded);
				});

			});

			describe("search operator", () => {

				it("should encode prefix word search", () => {
					const query = { "~name": "widget" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="widget"  (~ not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode search with spaces", () => {
					const query = { "~name": "red widget" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="red widget"
					expect(encoded).toBe("~name=%22red%20widget%22");
				});

			});

			describe("disjunctive matching", () => {

				it("should encode single value", () => {
					const query = { "?category": "electronics" } as Criteria;
					const encoded = encodeCriteria(query);

					// ?category="electronics"
					expect(encoded).toBe("%3Fcategory=%22electronics%22");
				});

				it("should encode multiple values as repeated parameters", () => {
					const query = { "?category": ["electronics", "home"] } as unknown as Criteria;
					const encoded = encodeCriteria(query);

					// ?category="electronics"&?category="home"
					expect(encoded).toBe("%3Fcategory=%22electronics%22&%3Fcategory=%22home%22");
				});

				it("should encode null option for undefined matching", () => {
					const query = { "?vendor": null } as unknown as Criteria;
					const encoded = encodeCriteria(query);

					// ?vendor=null
					expect(encoded).toBe("%3Fvendor=null");
				});

			});

			describe("conjunctive matching", () => {

				it("should encode all-match constraint", () => {
					const query = { "!tags": ["featured", "sale"] } as unknown as Criteria;
					const encoded = encodeCriteria(query);

					// !tags="featured"&!tags="sale"  (! not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("!tags=%22featured%22&!tags=%22sale%22");
				});

			});

			describe("focus operator", () => {

				it("should encode single focus value", () => {
					const query = { "+category": "electronics" } as Criteria;
					const encoded = encodeCriteria(query);

					// +category="electronics"  (+ encoded to %2B — reserved sub-delim)
					expect(encoded).toBe("%2Bcategory=%22electronics%22");
				});

				it("should encode multiple focus values", () => {
					const query = { "+category": ["electronics", "home"] } as unknown as Criteria;
					const encoded = encodeCriteria(query);

					// +category="electronics"&+category="home"
					expect(encoded).toBe("%2Bcategory=%22electronics%22&%2Bcategory=%22home%22");
				});

			});

			describe("ordering operators", () => {

				it.each([
					["ascending sort", { "^price": 1 }, "%5Eprice=1"],
					["descending sort", { "^price": -1 }, "%5Eprice=-1"],
					["multiple sort priorities", { "^price": 1, "^name": -2 }, "%5Eprice=1&%5Ename=-2"]
				] as const)("should encode %s", (_, query, encoded) => {
					expect(encodeCriteria(query as Criteria)).toBe(encoded);
				});

			});

			describe("pagination", () => {

				it.each([
					["offset", { "@": 10 }, "%40=10"],
					["limit", { "#": 25 }, "%23=25"],
					["offset and limit together", { "@": 0, "#": 25 }, "%40=0&%23=25"]
				] as const)("should encode %s", (_, query, encoded) => {
					expect(encodeCriteria(query as Criteria)).toBe(encoded);
				});

			});

			describe("expression paths", () => {

				it("should encode dotted property paths", () => {
					const query = { ">=vendor.rating": 4 } as Criteria;
					const encoded = encodeCriteria(query);

					// >=vendor.rating=4
					expect(encoded).toBe("%3E%3Dvendor.rating=4");
				});

			});

			describe("expression transforms", () => {

				it("should encode constraint with single transform", () => {
					const query = { ">=year:releaseDate": 2020 } as Criteria;
					const encoded = encodeCriteria(query);

					// >=year:releaseDate=2020
					expect(encoded).toBe("%3E%3Dyear%3AreleaseDate=2020");
				});

				it("should encode constraint with transform pipeline", () => {
					const query = { ">=round:avg:items.price": 100 } as Criteria;
					const encoded = encodeCriteria(query);

					// >=round:avg:items.price=100
					expect(encoded).toBe("%3E%3Dround%3Aavg%3Aitems.price=100");
				});

				it("should encode disjunction with transform", () => {
					const query: Criteria = { "?month:releaseDate": [1, 6, 12] };
					const encoded = encodeCriteria(query);

					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					expect(encoded).toBe("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12");
				});

				it("should encode ordering with transform", () => {
					const query = { "^year:releaseDate": 1 } as Criteria;
					const encoded = encodeCriteria(query);

					// ^year:releaseDate=1
					expect(encoded).toBe("%5Eyear%3AreleaseDate=1");
				});

			});

			describe("boolean values", () => {

				it.each([
					["true value", { "?available": true }, "%3Favailable=true"],
					["false value", { "?available": false }, "%3Favailable=false"]
				] as const)("should encode %s", (_, query, encoded) => {
					expect(encodeCriteria(query as Criteria)).toBe(encoded);
				});

			});

			describe("numeric values", () => {

				it.each([
					["zero", { "@": 0 }, "%40=0"],
					["positive integer", { ">=price": 100 }, "%3E%3Dprice=100"],
					["negative integer", { ">=balance": -50 }, "%3E%3Dbalance=-50"],
					["decimal", { ">=price": 99.99 }, "%3E%3Dprice=99.99"],
					// scientific notation: + encoded as %2B to avoid space interpretation
					["scientific notation", { ">=count": 1.5e21 }, "%3E%3Dcount=1.5e%2B21"]
				] as const)("should encode %s", (_, query, encoded) => {
					expect(encodeCriteria(query as Criteria)).toBe(encoded);
				});

			});

			describe("string values", () => {

				it("should encode empty string", () => {
					const query = { "~name": "" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name=""
					expect(encoded).toBe("~name=%22%22");
				});

				it("should encode simple string", () => {
					const query = { "~name": "widget" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="widget"
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode string with spaces", () => {
					const query = { "~name": "my widget" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="my widget"
					expect(encoded).toBe("~name=%22my%20widget%22");
				});

				it("should encode string with quotes", () => {
					const query = { "~name": "say \"hello\"" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="say \"hello\""  (inner quotes escaped as \")
					expect(encoded).toBe("~name=%22say%20%5C%22hello%5C%22%22");
				});

				it("should encode unicode characters", () => {
					const query = { "~name": "café" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="café"  (é encoded as UTF-8 bytes %C3%A9)
					expect(encoded).toBe("~name=%22caf%C3%A9%22");
				});

				it("should encode newlines", () => {
					const query = { "~description": "line1\nline2" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~description="line1\nline2"
					expect(encoded).toBe("~description=%22line1%0Aline2%22");
				});

				it("should encode tabs", () => {
					const query = { "~description": "col1\tcol2" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~description="col1\tcol2"
					expect(encoded).toBe("~description=%22col1%09col2%22");
				});

				it("should encode ampersand", () => {
					const query = { "~name": "foo&bar" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="foo&bar"  (& encoded to avoid parameter separator)
					expect(encoded).toBe("~name=%22foo%26bar%22");
				});

				it("should encode equals sign", () => {
					const query = { "~name": "a=b" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="a=b"  (= encoded to avoid key/value separator)
					expect(encoded).toBe("~name=%22a%3Db%22");
				});

				it("should encode plus sign", () => {
					const query = { "~name": "a+b" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="a+b"  (+ encoded to avoid space interpretation)
					expect(encoded).toBe("~name=%22a%2Bb%22");
				});

				it("should encode percent sign", () => {
					const query = { "~name": "100%" } as Criteria;
					const encoded = encodeCriteria(query);

					// ~name="100%"  (% encoded to avoid escape sequence)
					expect(encoded).toBe("~name=%22100%25%22");
				});

			});

			describe("localized content", () => {

				it("should encode single tagged string", () => {
					const query = { "?name": { "en": "Widget" } } as Criteria;
					const encoded = encodeCriteria(query);

					// ?name="Widget"@en
					expect(encoded).toBe("%3Fname=%22Widget%22%40en");
				});

				it("should encode multiple tagged strings", () => {
					const query = { "?name": { "en": "Widget", "fr": "Gadget" } } as Criteria;
					const encoded = encodeCriteria(query);

					// ?name="Widget"@en&?name="Gadget"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr");
				});

				it("should encode localised text map with multi-value tags", () => {
					const query: Criteria = { "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } };
					const encoded = encodeCriteria(query);

					// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr");
				});

			});

			describe("localised text map roundtrip", () => {

				it("should reconstruct single-tag single-valued map as multi-valued", () => {
					const query = { "?name": { "en": "Widget" } } as Criteria;
					const encoded = encodeCriteria(query);
					const decoded = decodeCriteria(encoded);

					// the single-valued form normalises to multi-valued (form mode is lossy for cardinality)
					expect(decoded).toEqual({ "?name": { "en": ["Widget"] } });
				});

				it("should reconstruct multi-tag single-valued map as multi-valued", () => {
					const query = { "?name": { "en": "Widget", "fr": "Gadget" } } as Criteria;
					const encoded = encodeCriteria(query);
					const decoded = decodeCriteria(encoded);

					// the single-valued form normalises to multi-valued (form mode is lossy for cardinality)
					expect(decoded).toEqual({ "?name": { "en": ["Widget"], "fr": ["Gadget"] } });
				});

				it("should roundtrip single-element multi-valued map", () => {
					const query = { "?name": { "en": ["Widget"] } } as Criteria;
					const encoded = encodeCriteria(query);
					const decoded = decodeCriteria(encoded);

					expect(decoded).toEqual(query);
				});

				it("should roundtrip multi-value multi-valued map", () => {
					const query: Criteria = { "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } };
					const encoded = encodeCriteria(query);
					const decoded = decodeCriteria(encoded);

					expect(decoded).toEqual(query);
				});

			});

		});

	});

	describe("decodeCriteria()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const encoded = "id=%22%2Fproducts%2F42%22";

				expect(() => decodeCriteria(encoded, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should resolve root-relative IRI to absolute", () => {
				const encoded = "id=%22%2Fproducts%2F42%22";

				const decoded = decodeCriteria(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ "?id": "https://example.com/products/42" } as Criteria);
			});

		});

		it("should use app base when base option is omitted", () => {
			const encoded = "%3Fvendor=%22%2Fvendors%2Facme%22";

			expect(decodeCriteria(encoded))
				.toEqual({ "?vendor": "app:/vendors/acme" } as Criteria);
		});

		describe("form format decoding", () => {

			// The decoder is lenient: it accepts both canonical and shorthand forms
			// - Unencoded operators: ~name=widget (not just %7Ename=widget)
			// - Unquoted strings: name=widget (not just name="widget")
			// - Shorthand constraints: price>=100 (postfix) as well as >=price=100 (prefix)

			describe("basic parameters", () => {

				it("should decode single parameter", () => {
					const decoded = decodeCriteria("name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should decode multiple parameters", () => {
					const decoded = decodeCriteria("name=test&price=100");

					expect(decoded).toHaveProperty("?name");
					expect(decoded).toHaveProperty("?price");
				});

			});

			describe("comparison operators", () => {

				it.each([
					["< (prefix)", "%3Cprice=100", "<price", 100],
					["> (prefix)", "%3Eprice=50", ">price", 50],
					["<= (encoded)", "price%3C%3D100", "<=price", 100],
					["<= (unencoded)", "price<=100", "<=price", 100],
					[">= (encoded)", "price%3E%3D50", ">=price", 50],
					[">= (unencoded)", "price>=50", ">=price", 50],
					[">= (prefix)", "%3E%3Dprice=50", ">=price", 50]
				] as const)("should decode %s", (_, input, key, value) => {
					expect(decodeCriteria(input)).toHaveProperty(key, value);
				});

				it.each([
					["< postfix", "price<100"],
					["> postfix", "price>50"]
				] as const)("should reject strict-comparison postfix (%s)", (_, input) => {
					expect(() => decodeCriteria(input)).toThrow(Error);
				});

			});

			describe("search operator", () => {

				it.each([
					["encoded", "%7Ename=widget", "widget"],
					["unencoded", "~name=widget", "widget"],
					["spaces (%20)", "%7Ename=red%20widget", "red widget"],
					["plus as space", "%7Ename=red+widget", "red widget"]
				] as const)("should decode search (%s)", (_, input, value) => {
					expect(decodeCriteria(input)).toHaveProperty("~name", value);
				});

			});

			describe("disjunctive matching", () => {

				it("should decode a single value", () => {
					const decoded = decodeCriteria("category=electronics") as Record<string, unknown>;

					expect(decoded["?category"]).toBe("electronics");
				});

				it("should decode a bare wildcard as an empty option set", () => {
					// `expr=*` selects all (empty option set); the `?` operator is implied
					expect(decodeCriteria("category=*")).toEqual({ "?category": [] });
				});

				it("should let a real value override a sibling wildcard", () => {
					expect(decodeCriteria("category=home&category=*")).toEqual({ "?category": "home" });
				});

				it("should decode repeated parameters as array", () => {
					const decoded = decodeCriteria("category=electronics&category=home") as Record<string, unknown>;

					expect(decoded["?category"]).toEqual(["electronics", "home"]);
				});

				it("should decode explicit prefix operator", () => {
					const decoded = decodeCriteria("%3Fcategory=electronics");

					expect(decoded).toHaveProperty("?category");
				});

				it("should decode null for undefined matching", () => {
					const decoded = decodeCriteria("%3Fvendor=null") as Record<string, unknown>;

					expect(decoded["?vendor"]).toBe(null);
				});

			});

			describe("conjunctive matching", () => {

				it.each([
					["encoded", "%21tags=featured&%21tags=sale"],
					["unencoded", "!tags=featured&!tags=sale"]
				])("should decode all-match constraint (%s)", (_, input) => {
					const decoded = decodeCriteria(input) as Record<string, unknown>;

					expect(decoded["!tags"]).toEqual(["featured", "sale"]);
				});

				it.each([
					["encoded", "%21tags=premium"],
					["unencoded", "!tags=premium"]
				])("should decode explicit prefix operator (%s)", (_, input) => {
					expect(decodeCriteria(input)).toHaveProperty("!tags");
				});

			});

			describe("repeated labels", () => {

				it("should collect repeated option-set operators", () => {
					const decoded = decodeCriteria("%2Bcategory=a&%2Bcategory=b") as Record<string, unknown>;

					expect(decoded["+category"]).toEqual(["a", "b"]);
				});

				it.each([
					["comparison", "price>=50&price>=100"],
					["search", "%7Ename=a&%7Ename=b"],
					["sort", "%5Eprice=asc&%5Eprice=desc"],
					["pagination", "@=0&@=10"]
				] as const)("should reject a repeated single-valued operator (%s)", (_, input) => {
					expect(() => decodeCriteria(input)).toThrow(Error);
				});

			});

			describe("focus ordering", () => {

				it.each([
					["encoded", "%2Bcategory=featured"],
					["unencoded", "+category=featured"]
				])("should decode focus constraint with single value (%s)", (_, input) => {
					expect(decodeCriteria(input)).toHaveProperty("+category");
				});

				it("should decode focus constraint with multiple values", () => {
					// +category=featured&+category=popular
					const decoded = decodeCriteria("%2Bcategory=featured&%2Bcategory=popular") as Record<string, unknown>;

					expect(decoded["+category"]).toEqual(["featured", "popular"]);
				});

			});

			describe("ordering operators", () => {

				it.each([
					["ascending (encoded)", "%5Eprice=asc", "^price", "asc"],
					["ascending (unencoded)", "^price=asc", "^price", "asc"],
					["descending (encoded)", "%5Eprice=desc", "^price", "desc"],
					["descending (unencoded)", "^price=desc", "^price", "desc"],
					["numeric priority (encoded)", "%5Eprice=1", "^price", 1],
					["numeric priority (unencoded)", "^price=1", "^price", 1],
					["negative priority (encoded)", "%5Eprice=-2", "^price", -2],
					["negative priority (unencoded)", "^price=-2", "^price", -2]
				] as const)("should decode %s", (_, input, key, value) => {
					expect(decodeCriteria(input)).toHaveProperty(key, value);
				});

			});

			describe("ordering operators reject non-normative directions", () => {

				// the normative `order` value is exactly "asc" / "desc" / int (index.md §5, ABNF `order`);
				// long-form and mixed-case spellings must be rejected by the parser, not leaked through
				// lenient decoding past the structural guard

				it.each([
					["long-form ascending", "^price=ascending"],
					["long-form descending", "^price=descending"],
					["upper-case asc", "^price=ASC"],
					["mixed-case desc", "^price=Desc"]
				] as const)("should reject %s even when lenient", (_, input) => {
					expect(() => decodeCriteria(input, { lenient: true })).toThrow(Error);
				});

			});

			describe("pagination", () => {

				it.each([
					["offset", "%40=10", "@", 10],
					["offset (unencoded)", "@=10", "@", 10],
					["limit", "%23=25", "#", 25],
					["limit (unencoded)", "#=25", "#", 25],
					["zero offset", "%40=0", "@", 0],
					["zero offset (unencoded)", "@=0", "@", 0]
				] as const)("should decode %s", (_, input, key, value) => {
					expect(decodeCriteria(input)).toHaveProperty(key, value);
				});

			});

			describe("value parsing", () => {

				it("should parse numeric strings as numbers", () => {
					const decoded = decodeCriteria("%3E%3Dprice=100") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(100);
				});

				it("should parse decimal numbers", () => {
					const decoded = decodeCriteria("%3E%3Dprice=99.99") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(99.99);
				});

				it("should parse negative numbers", () => {
					const decoded = decodeCriteria("%5Eprice=-1") as Record<string, unknown>;

					expect(decoded["^price"]).toBe(-1);
				});

				it("should parse boolean true", () => {
					const decoded = decodeCriteria("available=true") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(true);
				});

				it("should parse boolean false", () => {
					const decoded = decodeCriteria("available=false") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(false);
				});

				it("should preserve non-numeric strings", () => {
					const decoded = decodeCriteria("%7Ename=widget") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("widget");
				});

				it("should decode percent-encoded special characters", () => {
					const decoded = decodeCriteria("%7Ename=foo%26bar") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("foo&bar");
				});

				it("should decode percent-encoded unicode", () => {
					const decoded = decodeCriteria("%7Ename=caf%C3%A9") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("café");
				});

				it("should decode empty value", () => {
					const decoded = decodeCriteria("~name=") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("");
				});

				it("should decode equals in value", () => {
					// ~name=a=b (= in value must be encoded)
					const decoded = decodeCriteria("~name=a%3Db") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("a=b");
				});

				it("should parse null", () => {
					const decoded = decodeCriteria("value=null") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(null);
				});

				it("should parse scientific notation", () => {
					const decoded = decodeCriteria("value=1e10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1e10);
				});

				it("should parse negative exponent", () => {
					const decoded = decodeCriteria("value=1.5e-10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1.5e-10);
				});

				it("should parse quoted string preserving type", () => {
					// "123" should remain string, not convert to number
					const decoded = decodeCriteria("value=%22123%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("123");
				});

				it("should parse quoted null as string", () => {
					const decoded = decodeCriteria("value=%22null%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("null");
				});

				it("should decode JSON escape sequences", () => {
					// "a\nb" encoded
					const decoded = decodeCriteria("value=%22a%5Cnb%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\nb");
				});

				it("should decode escaped quotes in strings", () => {
					// "a\"b" encoded
					const decoded = decodeCriteria("value=%22a%5C%22b%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\"b");
				});

				it("should decode unicode escapes", () => {
					// "\u0041" = "A"
					const decoded = decodeCriteria("value=%22%5Cu0041%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("A");
				});

				it("should reject a non-literal comparison value", () => {
					// <price=null, >=price="x"@en: comparisons take a literal only
					expect(() => decodeCriteria("%3Cprice=null")).toThrow(Error);
					expect(() => decodeCriteria("%3E%3Dprice=%22x%22%40en")).toThrow(Error);
				});

				it("should reject a non-string search value", () => {
					// ~name=123, ~name=null: search takes a string only
					expect(() => decodeCriteria("%7Ename=123")).toThrow(Error);
					expect(() => decodeCriteria("%7Ename=null")).toThrow(Error);
				});

				it("should decode localized string", () => {
					// "Hello"@en → always reconstructed as a multi-valued map (Options are multi-valued)
					const decoded = decodeCriteria("label=%22Hello%22%40en") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual({ "en": ["Hello"] });
				});

				it("should decode localized string with region", () => {
					// "Colour"@en-GB → always reconstructed as a multi-valued map (Options are multi-valued)
					const decoded = decodeCriteria("label=%22Colour%22%40en-GB") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual({ "en-GB": ["Colour"] });
				});

				it("should keep a non-tag @suffix as part of the plain string", () => {
					// index.md §5 `tagged = string "@" tag`, `tag = BCP 47`: a non-tag suffix does not split off
					const decoded = decodeCriteria("%3Fnote=a%40_foo") as Record<string, unknown>;

					expect(decoded["?note"]).toBe("a@_foo");
				});

				it("should decode multiple tagged values into a localised text map", () => {
					// ?name="Widget"@en&?name="Gadget"@fr → always a multi-valued map
					const decoded = decodeCriteria("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr") as Record<string, unknown>;

					expect(decoded["?name"]).toEqual({ "en": ["Widget"], "fr": ["Gadget"] });
				});

				it("should decode multiple values per tag into a localised text map", () => {
					// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
					const decoded = decodeCriteria("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr") as Record<string, unknown>;

					expect(decoded["?name"]).toEqual({ "en": ["Widget", "Gadget"], "fr": ["Bidule"] });
				});

				it("should reject stacked language tags", () => {
					// "foo"@en@fr: a value carries at most one tag
					expect(() => decodeCriteria("%3Fname=%22foo%22%40en%40fr")).toThrow(Error);
				});

				it("should reject a language tag on a non-string", () => {
					// 123@en, true@en: only strings are localised
					expect(() => decodeCriteria("%3Fn=123%40en")).toThrow(Error);
					expect(() => decodeCriteria("%3Fflag=true%40en")).toThrow(Error);
				});

				it.each([
					["plain then tagged", "%3Fname=plain&%3Fname=%22x%22%40en"],
					["tagged then plain", "%3Fname=%22x%22%40en&%3Fname=plain"]
				])("should reject mixing plain options and tagged values in a set (%s)", (_, input) => {
					// a set is uniformly plain options or uniformly tagged (option / localised disjunction)
					expect(() => decodeCriteria(input)).toThrow(Error);
				});

			});

			describe("expression paths", () => {

				it("should decode unencoded dots in paths", () => {
					// >=vendor.rating=4 (dot unreserved, no encoding needed)
					const decoded = decodeCriteria("%3E%3Dvendor.rating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

				it("should decode percent-encoded dots in paths", () => {
					// >=vendor.rating=4 (dot encoded as %2E)
					const decoded = decodeCriteria("%3E%3Dvendor%2Erating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

			});

			describe("unicode identifiers", () => {

				it("should decode identifier with unicode letter (Greek)", () => {
					// πrice=100 (Greek pi as first character)
					const decoded = decodeCriteria("%CF%80rice=100");

					expect(decoded).toHaveProperty("?πrice", 100);
				});

				it("should decode identifier with unicode letter (Cyrillic)", () => {
					// цена=100 (Russian "price")
					const decoded = decodeCriteria("%D1%86%D0%B5%D0%BD%D0%B0=100");

					expect(decoded).toHaveProperty("?цена", 100);
				});

				it("should decode identifier with unicode letter (CJK)", () => {
					// 价格=100 (Chinese "price")
					const decoded = decodeCriteria("%E4%BB%B7%E6%A0%BC=100");

					expect(decoded).toHaveProperty("?价格", 100);
				});

				it("should decode identifier with unicode continuation characters", () => {
					// na\u0301me=test (combining acute accent in identifier)
					const decoded = decodeCriteria("na%CC%81me=test");

					expect(decoded).toHaveProperty("?na\u0301me", "test");
				});

				it("should decode path with unicode identifiers", () => {
					// >=производитель.рейтинг=4 (Russian vendor.rating)
					const decoded = decodeCriteria("%3E%3D%D0%BF%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D0%B8%D1%82%D0%B5%D0%BB%D1%8C.%D1%80%D0%B5%D0%B9%D1%82%D0%B8%D0%BD%D0%B3=4");

					expect(decoded).toHaveProperty(">=производитель.рейтинг", 4);
				});

			});

			describe("expression transforms", () => {

				it("should decode constraint with single transform", () => {
					// >=year:releaseDate=2020
					const decoded = decodeCriteria("%3E%3Dyear%3AreleaseDate=2020");

					expect(decoded).toHaveProperty(">=year:releaseDate", 2020);
				});

				it("should decode constraint with transform pipeline", () => {
					// >=round:avg:items.price=100
					const decoded = decodeCriteria("%3E%3Dround%3Aavg%3Aitems.price=100");

					expect(decoded).toHaveProperty(">=round:avg:items.price", 100);
				});

				it("should decode disjunction with transform", () => {
					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					const decoded = decodeCriteria("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12") as Record<string, unknown>;

					expect(decoded["?month:releaseDate"]).toEqual([1, 6, 12]);
				});

				it("should decode ordering with transform", () => {
					// ^year:releaseDate=1
					const decoded = decodeCriteria("%5Eyear%3AreleaseDate=1");

					expect(decoded).toHaveProperty("^year:releaseDate", 1);
				});

			});

			describe("malformed input handling", () => {
				// The decoder is lenient with common URL parsing quirks

				it("should handle empty string", () => {
					const decoded = decodeCriteria("");

					expect(decoded).toEqual({});
				});

				it("should reject a parameter without a value", () => {
					expect(() => decodeCriteria("name")).toThrow(Error);
				});

				it("should handle leading ampersand", () => {
					const decoded = decodeCriteria("&name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle trailing ampersand", () => {
					const decoded = decodeCriteria("name=test&");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle multiple ampersands", () => {
					const decoded = decodeCriteria("name=test&&price=100");

					expect(decoded).toHaveProperty("?name");
					expect(decoded).toHaveProperty("?price");
				});

			});

			describe("integration", () => {

				it("should decode complex query with multiple operators", () => {
					// status=active&status=pending&~name=corp&price>=100&price<=1000&^date=desc&@=0&#=25
					const decoded = decodeCriteria(
						"status=active&status=pending&~name=corp&price%3E%3D100&price%3C%3D1000&%5Edate=desc&%40=0&%23=25"
					) as Record<string, unknown>;

					expect(decoded["?status"]).toEqual(["active", "pending"]);
					expect(decoded["~name"]).toBe("corp");
					expect(decoded[">=price"]).toBe(100);
					expect(decoded["<=price"]).toBe(1000);
					expect(decoded["^date"]).toBe("desc");
					expect(decoded["@"]).toBe(0);
					expect(decoded["#"]).toBe(25);
				});

			});

		});

		describe("roundtrip encoding/decoding", () => {

			// Using Record<string, unknown>[] since template literal index signatures prevent satisfies
			const cases: Record<string, unknown>[] = [
				{},
				{ ">=price": 50, "<=price": 150 },
				{ "~name": "widget" },
				{ "?category": ["electronics", "home"] },
				{ "^price": 1, "^name": -2 },
				{ "@": 0, "#": 25 }
			];

			it.each(cases.map((c, i) => [i, c] as const))(
				"should roundtrip criteria %i",
				(_, criteria) => {
					const encoded = encodeCriteria(criteria as Criteria);
					const decoded = decodeCriteria(encoded);

					expect(decoded).toEqual(criteria);
				}
			);

		});

		describe("lenient option", () => {

			it("should skip structural validation when lenient", () => {
				// <price=true parses cleanly but fails validation (< requires number or string)
				const encoded = "%3Cprice=true";

				expect(() => decodeCriteria(encoded, { lenient: true })).not.toThrow();
			});

			it("should still throw on syntax errors when lenient", () => {
				expect(() => decodeCriteria("%7Binvalid", { lenient: true })).toThrow(Error);
			});

		});

		describe("error handling", () => {

			it("should handle malformed input gracefully", () => {
				expect(() => decodeCriteria("%7Binvalid")).toThrow(Error);
			});

			it("should handle truncated percent-encoding", () => {
				expect(() => decodeCriteria("%")).toThrow(Error);
			});

			it("should handle invalid percent-encoding sequence", () => {
				expect(() => decodeCriteria("%ZZ")).toThrow(Error);
			});

			it("should handle incomplete percent-encoding", () => {
				expect(() => decodeCriteria("%2")).toThrow(Error);
			});

		});

	});


	// shared [probe, encoded-key] fixtures driving encodeProbe/decodeProbe in both directions

	const projectionProbes: readonly [Probe, string][] = [
		[{ target: "name", pipe: [], path: ["name"] }, "name=name"],
		[{ target: "city", pipe: [], path: ["address"] }, "city=address"],
		[{ target: "city", pipe: [], path: ["customer", "address"] }, "city=customer.address"],
		[{ target: "releaseYear", pipe: ["year"], path: ["releaseDate"] }, "releaseYear=year:releaseDate"],
		[{ target: "avgPrice", pipe: ["round", "avg"], path: ["price"] }, "avgPrice=round:avg:price"],
		[{ target: "total", pipe: ["count"], path: [] }, "total=count:"],
		[{ target: "self", pipe: [], path: [] }, "self="]
	];

	const constraintProbes: readonly [Probe, string][] = [
		[{ target: "<", pipe: [], path: ["price"] }, "<price"],
		[{ target: "<=", pipe: [], path: ["price"] }, "<=price"],
		[{ target: ">", pipe: [], path: ["price"] }, ">price"],
		[{ target: ">=", pipe: [], path: ["price"] }, ">=price"],
		[{ target: "~", pipe: [], path: ["name"] }, "~name"],
		[{ target: "?", pipe: [], path: ["category"] }, "?category"],
		[{ target: "!", pipe: [], path: ["tags"] }, "!tags"],
		[{ target: "+", pipe: [], path: ["category"] }, "+category"],
		[{ target: "^", pipe: [], path: ["price"] }, "^price"],
		[{ target: "@", pipe: [], path: [] }, "@"],
		[{ target: "#", pipe: [], path: [] }, "#"],
		[{ target: "^", pipe: [], path: [] }, "^"],
		[{ target: ">=", pipe: [], path: ["vendor", "rating"] }, ">=vendor.rating"],
		[{ target: ">=", pipe: ["year"], path: ["releaseDate"] }, ">=year:releaseDate"]
	];

	describe("encodeProbe()", () => {

		describe("projection keys", () => {

			it.each(projectionProbes)("should encode %o as %s", (probe, encoded) => {
				expect(encodeProbe(probe)).toBe(encoded);
			});

		});

		describe("constraint keys", () => {

			it.each(constraintProbes)("should encode %o as %s", (probe, encoded) => {
				expect(encodeProbe(probe)).toBe(encoded);
			});

		});

	});

	describe("decodeProbe()", () => {

		describe("projection keys", () => {

			it.each(projectionProbes)("should decode %s into %o", (probe, encoded) => {
				expect(decodeProbe(encoded)).toEqual(probe);
			});

		});

		describe("constraint keys", () => {

			it.each(constraintProbes)("should decode %s into %o", (probe, encoded) => {
				expect(decodeProbe(encoded)).toEqual(probe);
			});

		});

		describe("guard agreement", () => {

			// every key the guards admit must decode: the guards and the grammar are the documented pairing for
			// filtering template keys before parsing them

			it.each([
				"self=", "name=name", "total=count:", "名前=prénom", "$result=_internal"
			])("should decode %s admitted by isBinding", (key) => {
				expect(isBinding(key)).toBe(true);
				expect(() => decodeProbe(key)).not.toThrow();
			});

			it.each([
				"^", "~price", "@", "#", ">=year:releaseDate"
			])("should decode %s admitted by isSelector", (key) => {
				expect(isSelector(key)).toBe(true);
				expect(() => decodeProbe(key)).not.toThrow();
			});

		});

		describe("roundtrip", () => {

			it.each([...projectionProbes, ...constraintProbes])(
				"should roundtrip %o through encode then decode",
				(probe) => {
					expect(decodeProbe(encodeProbe(probe))).toEqual(probe);
				}
			);

		});

		describe("error handling", () => {

			it("should reject a bare identifier without an expression", () => {
				expect(() => decodeProbe("name")).toThrow(Error);
			});

			it("should reject path without target", () => {
				expect(() => decodeProbe("address.city")).toThrow(Error);
			});

			it("should reject empty string", () => {
				expect(() => decodeProbe("")).toThrow(Error);
			});

			it("should reject an unknown transform in the pipe", () => {
				expect(() => decodeProbe("x=unknown:name")).toThrow(Error);
			});

			it("should reject a malformed path", () => {
				expect(() => decodeProbe("x=vendor..name")).toThrow(Error);
			});

		});

	});

});
