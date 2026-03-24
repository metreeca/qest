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
import { decodeBase64 } from "./base64.js";
import {
	isBinding,
	isExpression,
	isLocale,
	isOperator,
	isOption,
	isOptions,
	isProbe,
	isQuery,
	isTemplate,
	isTemplates,
	isTransform
} from "./model.core.js";
import { decodeQuery, decodeProbe, decodeQueryString, encodeQuery, encodeProbe, encodeQueryString, type Query } from "./model.js";


describe("guards", () => {

	describe("isQuery", () => {

		describe("valid queries", () => {

			it("should accept empty query", async () => {
				expect(isQuery({})).toBeTruthy();
			});

			it("should accept projection entries", async () => {
				expect(isQuery({ name: "" })).toBeTruthy();
				expect(isQuery({ price: 0 })).toBeTruthy();
				expect(isQuery({ available: true })).toBeTruthy();
			});

			it("should accept nested queries", async () => {
				expect(isQuery({ vendor: { id: "", name: "" } })).toBeTruthy();
			});

			it("should accept query collections", async () => {
				expect(isQuery({ items: [{ id: "", name: "" }] })).toBeTruthy();
			});

			it("should accept filtering entries", async () => {
				expect(isQuery({ ">=price": 50 })).toBeTruthy();
				expect(isQuery({ "<=price": 150 })).toBeTruthy();
				expect(isQuery({ ">price": 50 })).toBeTruthy();
				expect(isQuery({ "<price": 150 })).toBeTruthy();
				expect(isQuery({ "~name": "widget" })).toBeTruthy();
				expect(isQuery({ "?category": ["a", "b"] })).toBeTruthy();
				expect(isQuery({ "!tags": ["featured"] })).toBeTruthy();
			});

			it("should accept ordering entries", async () => {
				expect(isQuery({ "*category": ["electronics"] })).toBeTruthy();
				expect(isQuery({ "^price": 1 })).toBeTruthy();
				expect(isQuery({ "^name": "asc" })).toBeTruthy();
				expect(isQuery({ "^name": "desc" })).toBeTruthy();
			});

			it("should accept paging entries", async () => {
				expect(isQuery({ "@": 10 })).toBeTruthy();
				expect(isQuery({ "#": 25 })).toBeTruthy();
			});

			it("should accept binding keys", async () => {
				expect(isQuery({ "vendorName=vendor.name": "" })).toBeTruthy();
				expect(isQuery({ "total=count:": 0 })).toBeTruthy();
			});

			it("should accept local models", async () => {
				expect(isQuery({ name: { "*": "" } })).toBeTruthy();
				expect(isQuery({ name: { "en": "", "fr": "" } })).toBeTruthy();
			});

			it("should accept reference values", async () => {
				expect(isQuery({ id: "/products/42" })).toBeTruthy();
			});

		});

		describe("invalid queries", () => {

			it("should reject non-objects", async () => {
				expect(isQuery(null)).toBeFalsy();
				expect(isQuery(undefined)).toBeFalsy();
				expect(isQuery("string")).toBeFalsy();
				expect(isQuery(123)).toBeFalsy();
				expect(isQuery([])).toBeFalsy();
			});

			it("should reject invalid keys", async () => {
				expect(isQuery({ "123invalid": "" })).toBeFalsy();
				expect(isQuery({ "": "" })).toBeFalsy();
			});

			it("should reject invalid values", async () => {
				expect(isQuery({ name: null })).toBeFalsy();
				expect(isQuery({ name: undefined })).toBeFalsy();
			});

		});

	});


	describe("isBinding", () => {

		describe("valid bindings", () => {

			it("should accept simple binding", async () => {
				expect(isBinding("name=value")).toBeTruthy();
			});

			it("should accept binding with dotted path", async () => {
				expect(isBinding("vendorName=vendor.name")).toBeTruthy();
			});

			it("should accept binding with transform", async () => {
				expect(isBinding("releaseYear=year:releaseDate")).toBeTruthy();
			});

			it("should accept binding with aggregate", async () => {
				expect(isBinding("total=count:")).toBeTruthy();
			});

			it("should accept binding with transform pipeline", async () => {
				expect(isBinding("result=round:avg:scores")).toBeTruthy();
			});

			it("should accept binding with empty expression", async () => {
				expect(isBinding("self=")).toBeTruthy();
			});

			it("should accept unicode identifiers", async () => {
				expect(isBinding("名前=prénom")).toBeTruthy();
			});

			it("should accept identifiers with $ and _", async () => {
				expect(isBinding("$result=_internal")).toBeTruthy();
			});

		});

		describe("invalid bindings", () => {

			it("should reject non-string values", async () => {
				expect(isBinding(null)).toBeFalsy();
				expect(isBinding(undefined)).toBeFalsy();
				expect(isBinding(123)).toBeFalsy();
				expect(isBinding({})).toBeFalsy();
			});

			it("should reject empty string", async () => {
				expect(isBinding("")).toBeFalsy();
			});

			it("should reject missing identifier", async () => {
				expect(isBinding("=value")).toBeFalsy();
			});

			it("should accept plain identifier as shorthand", async () => {
				expect(isBinding("name")).toBeTruthy();
			});

			it("should reject invalid identifier", async () => {
				expect(isBinding("123name=value")).toBeFalsy();
			});

			it("should reject invalid expression", async () => {
				expect(isBinding("name=.invalid")).toBeFalsy();
				expect(isBinding("name=:invalid")).toBeFalsy();
			});

		});

	});

	describe("isExpression", () => {

		describe("valid expressions", () => {

			it("should accept simple identifier", async () => {
				expect(isExpression("name")).toBeTruthy();
			});

			it("should accept dotted path", async () => {
				expect(isExpression("vendor.name")).toBeTruthy();
			});

			it("should accept deep path", async () => {
				expect(isExpression("order.items.price")).toBeTruthy();
			});

			it("should accept single transform", async () => {
				expect(isExpression("year:releaseDate")).toBeTruthy();
			});

			it("should accept transform pipeline", async () => {
				expect(isExpression("round:avg:scores")).toBeTruthy();
			});

			it("should accept aggregate without path", async () => {
				expect(isExpression("count:")).toBeTruthy();
			});

			it("should accept multiple transforms without path", async () => {
				expect(isExpression("round:avg:")).toBeTruthy();
				expect(isExpression("round:floor:abs:")).toBeTruthy();
			});

			it("should accept transform with dotted path", async () => {
				expect(isExpression("sum:items.price")).toBeTruthy();
			});

			it("should accept unicode identifiers", async () => {
				expect(isExpression("prénom")).toBeTruthy();
				expect(isExpression("名前")).toBeTruthy();
			});

			it("should accept identifiers with $ and _", async () => {
				expect(isExpression("$price")).toBeTruthy();
				expect(isExpression("_internal")).toBeTruthy();
			});

			it("should accept empty string", async () => {
				expect(isExpression("")).toBeTruthy();
			});

		});

		describe("invalid expressions", () => {

			it("should reject non-string values", async () => {
				expect(isExpression(null)).toBeFalsy();
				expect(isExpression(undefined)).toBeFalsy();
				expect(isExpression(123)).toBeFalsy();
				expect(isExpression({})).toBeFalsy();
			});

			it("should reject leading dot", async () => {
				expect(isExpression(".name")).toBeFalsy();
			});

			it("should reject trailing dot", async () => {
				expect(isExpression("name.")).toBeFalsy();
			});

			it("should reject double dots", async () => {
				expect(isExpression("vendor..name")).toBeFalsy();
			});

			it("should reject leading colon", async () => {
				expect(isExpression(":name")).toBeFalsy();
			});

			it("should reject lone colon", async () => {
				expect(isExpression(":")).toBeFalsy();
			});

			it("should reject dot before colon", async () => {
				expect(isExpression("a.b:c")).toBeFalsy();
			});

			it("should reject unknown transform identifiers", async () => {
				expect(isExpression("a:name")).toBeFalsy();
				expect(isExpression("unknown:name")).toBeFalsy();
				expect(isExpression("a:b:")).toBeFalsy();
				expect(isExpression("a:b:c:")).toBeFalsy();
			});

			it("should reject invalid characters", async () => {
				expect(isExpression("name@field")).toBeFalsy();
				expect(isExpression("name#field")).toBeFalsy();
			});

		});

	});


	describe("isTemplates", () => {

		it("should accept literals", async () => {
			expect(isTemplates(true)).toBeTruthy();
			expect(isTemplates(42)).toBeTruthy();
			expect(isTemplates("")).toBeTruthy();
		});

		it("should accept references", async () => {
			expect(isTemplates("/products/42")).toBeTruthy();
		});

		it("should accept nested queries", async () => {
			expect(isTemplates({ id: "", name: "" })).toBeTruthy();
		});

		it("should accept single-valued language maps", async () => {
			expect(isTemplates({ "*": "" })).toBeTruthy();
			expect(isTemplates({ "en": "text" })).toBeTruthy();
			expect(isTemplates({ "en": "hello", "fr": "bonjour" })).toBeTruthy();
		});

		it("should accept multi-valued language maps", async () => {
			expect(isTemplates({ "en": [""] })).toBeTruthy();
			expect(isTemplates({ "en": ["hello"], "fr": ["bonjour"] })).toBeTruthy();
		});

		it("should accept literal tuples", async () => {
			expect(isTemplates([true])).toBeTruthy();
			expect(isTemplates([0])).toBeTruthy();
			expect(isTemplates([""])).toBeTruthy();
		});

		it("should accept reference tuples", async () => {
			expect(isTemplates(["/products/42"])).toBeTruthy();
		});

		it("should accept query tuples", async () => {
			expect(isTemplates([{ id: "", name: "" }])).toBeTruthy();
		});

		it("should reject null and undefined", async () => {
			expect(isTemplates(null)).toBeFalsy();
			expect(isTemplates(undefined)).toBeFalsy();
		});

		it("should reject empty arrays", async () => {
			expect(isTemplates([])).toBeFalsy();
		});

		it("should reject arrays with multiple elements", async () => {
			expect(isTemplates(["/a", "/b"])).toBeFalsy();
			expect(isTemplates([{ id: "" }, { id: "" }])).toBeFalsy();
		});

	});

	describe("isTemplate", () => {

		it("should accept literals", async () => {
			expect(isTemplate(true)).toBeTruthy();
			expect(isTemplate(false)).toBeTruthy();
			expect(isTemplate(0)).toBeTruthy();
			expect(isTemplate(42)).toBeTruthy();
			expect(isTemplate("")).toBeTruthy();
			expect(isTemplate("text")).toBeTruthy();
		});

		it("should accept references", async () => {
			expect(isTemplate("/products/42")).toBeTruthy();
			expect(isTemplate("https://example.com/resource")).toBeTruthy();
		});

		it("should accept nested queries", async () => {
			expect(isTemplate({ id: "", name: "" })).toBeTruthy();
			expect(isTemplate({ vendor: { id: "" } })).toBeTruthy();
		});

		it("should reject null and undefined", async () => {
			expect(isTemplate(null)).toBeFalsy();
			expect(isTemplate(undefined)).toBeFalsy();
		});

		it("should reject arrays", async () => {
			expect(isTemplate([])).toBeFalsy();
			expect(isTemplate([0])).toBeFalsy();
			expect(isTemplate(["/a"])).toBeFalsy();
		});

	});

	describe("isLocale", () => {

		describe("valid locale models", () => {

			it("should accept single-valued wildcard tag", async () => {
				expect(isLocale({ "*": "" })).toBeTruthy();
				expect(isLocale({ "*": "text" })).toBeTruthy();
			});

			it("should accept multi-valued wildcard tag", async () => {
				expect(isLocale({ "*": [""] })).toBeTruthy();
				expect(isLocale({ "*": ["text"] })).toBeTruthy();
			});

			it("should accept single-valued language tags", async () => {
				expect(isLocale({ "en": "hello" })).toBeTruthy();
				expect(isLocale({ "fr": "bonjour" })).toBeTruthy();
			});

			it("should accept multi-valued language tags", async () => {
				expect(isLocale({ "en": ["hello"] })).toBeTruthy();
				expect(isLocale({ "fr": ["bonjour"] })).toBeTruthy();
			});

			it("should accept multiple single-valued language tags", async () => {
				expect(isLocale({ "en": "hello", "fr": "bonjour" })).toBeTruthy();
			});

			it("should accept multiple multi-valued language tags", async () => {
				expect(isLocale({ "en": ["hello"], "fr": ["bonjour"] })).toBeTruthy();
			});

			it("should accept plain string shorthand", async () => {
				expect(isLocale("text")).toBeTruthy();
				expect(isLocale("")).toBeTruthy();
			});

			it("should accept plain string array shorthand", async () => {
				expect(isLocale(["text"])).toBeTruthy();
				expect(isLocale([""])).toBeTruthy();
			});

		});

		describe("invalid locale models", () => {

			it("should reject null and undefined", async () => {
				expect(isLocale(null)).toBeFalsy();
				expect(isLocale(undefined)).toBeFalsy();
			});

			it("should reject non-string primitives", async () => {
				expect(isLocale(true)).toBeFalsy();
				expect(isLocale(42)).toBeFalsy();
			});

			it("should reject mixed scalar/array content", async () => {
				expect(isLocale({ "en": "hello", "fr": ["bonjour"] })).toBeFalsy();
				expect(isLocale({ "en": ["hello"], "fr": "bonjour" })).toBeFalsy();
			});

			it("should reject invalid tag keys", async () => {
				expect(isLocale({ "invalid tag": "text" })).toBeFalsy();
				expect(isLocale({ "invalid tag": ["text"] })).toBeFalsy();
			});

		});

	});


	describe("isOptions", () => {

		describe("valid options", () => {

			it("should accept single option values", async () => {
				expect(isOptions(null)).toBeTruthy();
				expect(isOptions(true)).toBeTruthy();
				expect(isOptions(42)).toBeTruthy();
				expect(isOptions("text")).toBeTruthy();
				expect(isOptions("/resource")).toBeTruthy();
			});

			it("should accept local (single-valued language map)", async () => {
				expect(isOptions({ "en": "hello" })).toBeTruthy();
				expect(isOptions({ "fr": "bonjour" })).toBeTruthy();
			});

			it("should accept locals (multi-valued language map)", async () => {
				expect(isOptions({ "en": ["hello"] })).toBeTruthy();
				expect(isOptions({ "en": ["a", "b"] })).toBeTruthy();
			});

			it("should accept option arrays", async () => {
				expect(isOptions([])).toBeTruthy();
				expect(isOptions([null])).toBeTruthy();
				expect(isOptions([true, false])).toBeTruthy();
				expect(isOptions([1, 2, 3])).toBeTruthy();
				expect(isOptions(["a", "b"])).toBeTruthy();
				expect(isOptions(["/a", "/b"])).toBeTruthy();
			});

		});

		describe("invalid options", () => {

			it("should reject undefined", async () => {
				expect(isOptions(undefined)).toBeFalsy();
			});

			it("should reject nested objects", async () => {
				expect(isOptions({ nested: { id: "" } })).toBeFalsy();
			});

			it("should reject arrays with nested objects", async () => {
				expect(isOptions([{ id: "" }])).toBeFalsy();
			});

		});

	});

	describe("isOption", () => {

		describe("valid options", () => {

			it("should accept null", async () => {
				expect(isOption(null)).toBeTruthy();
			});

			it("should accept literals", async () => {
				expect(isOption(true)).toBeTruthy();
				expect(isOption(false)).toBeTruthy();
				expect(isOption(0)).toBeTruthy();
				expect(isOption(42)).toBeTruthy();
				expect(isOption("")).toBeTruthy();
				expect(isOption("text")).toBeTruthy();
			});

			it("should accept references", async () => {
				expect(isOption("/products/42")).toBeTruthy();
				expect(isOption("https://example.com/resource")).toBeTruthy();
			});

		});

		describe("invalid options", () => {

			it("should reject undefined", async () => {
				expect(isOption(undefined)).toBeFalsy();
			});

			it("should reject objects", async () => {
				expect(isOption({})).toBeFalsy();
				expect(isOption({ id: "" })).toBeFalsy();
			});

			it("should reject arrays", async () => {
				expect(isOption([])).toBeFalsy();
				expect(isOption(["a", "b"])).toBeFalsy();
			});

		});

	});


	describe("isProbe", () => {

		describe("valid probes", () => {

			it("should accept simple projection probe", async () => {
				expect(isProbe({ target: "name", pipe: [], path: [] })).toBeTruthy();
			});

			it("should accept probe with path", async () => {
				expect(isProbe({ target: "city", pipe: [], path: ["address"] })).toBeTruthy();
				expect(isProbe({ target: "city", pipe: [], path: ["customer", "address"] })).toBeTruthy();
			});

			it("should accept probe with pipe", async () => {
				expect(isProbe({ target: "releaseYear", pipe: ["year"], path: ["releaseDate"] })).toBeTruthy();
				expect(isProbe({ target: "avgPrice", pipe: ["round", "avg"], path: ["price"] })).toBeTruthy();
			});

			it("should accept filtering probes", async () => {
				expect(isProbe({ target: "<", pipe: [], path: ["price"] })).toBeTruthy();
				expect(isProbe({ target: ">=", pipe: [], path: ["price"] })).toBeTruthy();
				expect(isProbe({ target: "~", pipe: [], path: ["name"] })).toBeTruthy();
				expect(isProbe({ target: "?", pipe: [], path: ["category"] })).toBeTruthy();
			});

			it("should accept ordering probes", async () => {
				expect(isProbe({ target: "*", pipe: [], path: ["category"] })).toBeTruthy();
				expect(isProbe({ target: "^", pipe: [], path: ["price"] })).toBeTruthy();
			});

			it("should accept paging criteria", async () => {
				expect(isProbe({ target: "@", pipe: [], path: [] })).toBeTruthy();
				expect(isProbe({ target: "#", pipe: [], path: [] })).toBeTruthy();
			});

		});

		describe("invalid criteria", () => {

			it("should reject non-objects", async () => {
				expect(isProbe(null)).toBeFalsy();
				expect(isProbe(undefined)).toBeFalsy();
				expect(isProbe("string")).toBeFalsy();
				expect(isProbe(123)).toBeFalsy();
			});

			it("should reject missing target", async () => {
				expect(isProbe({ pipe: [], path: [] })).toBeFalsy();
			});

			it("should reject missing pipe", async () => {
				expect(isProbe({ target: "name", path: [] })).toBeFalsy();
			});

			it("should reject missing path", async () => {
				expect(isProbe({ target: "name", pipe: [] })).toBeFalsy();
			});

			it("should reject non-string target", async () => {
				expect(isProbe({ target: 123, pipe: [], path: [] })).toBeFalsy();
			});

			it("should reject non-array pipe", async () => {
				expect(isProbe({ target: "name", pipe: "year", path: [] })).toBeFalsy();
			});

			it("should reject unknown transforms in pipe", async () => {
				expect(isProbe({ target: "name", pipe: ["unknown"], path: ["field"] })).toBeFalsy();
				expect(isProbe({ target: "name", pipe: ["year", "unknown"], path: ["field"] })).toBeFalsy();
			});

			it("should reject non-array path", async () => {
				expect(isProbe({ target: "name", pipe: [], path: "address" })).toBeFalsy();
			});

			it("should reject unexpected properties", async () => {
				expect(isProbe({ target: "name", pipe: [], path: [], extra: "value" })).toBeFalsy();
			});

		});

	});

	describe("isOperator", () => {

		describe("valid operators", () => {

			it.each([
				["<"], [">"], ["<="], [">="],
				["~"], ["?"], ["!"],
				["*"], ["^"],
				["@"], ["#"]
			])("should accept %s", async (op) => {
				expect(isOperator(op)).toBeTruthy();
			});

		});

		describe("invalid operators", () => {

			it("should reject non-string values", async () => {
				expect(isOperator(null)).toBeFalsy();
				expect(isOperator(undefined)).toBeFalsy();
				expect(isOperator(123)).toBeFalsy();
				expect(isOperator({})).toBeFalsy();
			});

			it("should reject invalid operator strings", async () => {
				expect(isOperator("")).toBeFalsy();
				expect(isOperator("=")).toBeFalsy();
				expect(isOperator("!=")).toBeFalsy();
				expect(isOperator("==")).toBeFalsy();
				expect(isOperator("&&")).toBeFalsy();
				expect(isOperator("name")).toBeFalsy();
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
			])("should accept %s", async (transform) => {
				expect(isTransform(transform)).toBeTruthy();
			});

		});

		describe("invalid transforms", () => {

			it("should reject non-string values", async () => {
				expect(isTransform(null)).toBeFalsy();
				expect(isTransform(undefined)).toBeFalsy();
				expect(isTransform(123)).toBeFalsy();
				expect(isTransform({})).toBeFalsy();
			});

			it("should reject unknown identifiers", async () => {
				expect(isTransform("unknown")).toBeFalsy();
				expect(isTransform("a")).toBeFalsy();
				expect(isTransform("name")).toBeFalsy();
				expect(isTransform("")).toBeFalsy();
			});

		});

	});


});

describe("codecs", () => {

	describe("encodeQuery()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", async () => {
				const model: Query = { id: "/products/42" };

				expect(() => encodeQuery(model, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should internalize absolute IRI to root-relative", async () => {
				const model: Query = { id: "https://example.com/products/42" };

				expect(encodeQuery(model, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const model: Query = { id: "app:/products/42" };

			expect(encodeQuery(model))
				.toBe(JSON.stringify({ id: "/products/42" }));
		});

		it("should encode empty model", async () => {
			expect(encodeQuery({})).toBe(JSON.stringify({}));
		});

		it("should encode model with primitive templates", async () => {
			const model: Query = {
				id: "",
				name: "",
				price: 0,
				available: true
			};

			expect(encodeQuery(model)).toBe(JSON.stringify(model));
		});

		it("should encode model with nested model", async () => {
			const model: Query = {
				id: "",
				vendor: { id: "", name: "" }
			};

			expect(encodeQuery(model)).toBe(JSON.stringify(model));
		});

		it("should encode model with array templates", async () => {
			const model: Query = {
				id: "",
				tags: [""]
			};

			expect(encodeQuery(model)).toBe(JSON.stringify(model));
		});

		it("should encode model with locale templates", async () => {
			const model: Query = {
				id: "",
				name: { en: "", fr: "" }
			};

			expect(encodeQuery(model)).toBe(JSON.stringify(model));
		});

		it("should encode model with binding keys", async () => {
			const model: Query = {
				"vendorName=vendor.name": ""
			};

			expect(encodeQuery(model)).toBe(JSON.stringify(model));
		});

		it("should encode model with collection query", async () => {
			const model: Query = {
				items: [{
					id: "",
					name: "",
					">=price": 50,
					"#": 25
				}]
			};

			expect(encodeQuery(model)).toBe(JSON.stringify(model));
		});

	});

	describe("decodeQuery()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", async () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(() => decodeQuery(json, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should resolve root-relative IRI to absolute", async () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(decodeQuery(json, { base: "https://example.com/" }))
					.toEqual({ id: "https://example.com/products/42" });
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const json = JSON.stringify({ id: "/products/42" });

			expect(decodeQuery(json))
				.toEqual({ id: "app:/products/42" });
		});

		it("should decode empty model", async () => {
			expect(decodeQuery(JSON.stringify({}))).toEqual({});
		});

		it("should decode model with primitive templates", async () => {
			const json = JSON.stringify({
				id: "",
				name: "",
				price: 0,
				available: true
			});

			expect(decodeQuery(json)).toEqual({
				id: "",
				name: "",
				price: 0,
				available: true
			});
		});

		it("should decode model with nested model", async () => {
			const json = JSON.stringify({
				id: "",
				vendor: {
					id: "/vendors/acme",
					name: ""
				}
			});

			expect(decodeQuery(json)).toEqual({
				id: "",
				vendor: {
					id: "app:/vendors/acme",
					name: ""
				}
			});
		});

		it("should decode model with binding keys", async () => {
			const json = JSON.stringify({
				"vendorName=vendor.name": ""
			});

			expect(decodeQuery(json)).toEqual({
				"vendorName=vendor.name": ""
			});
		});

		it("should roundtrip with encodeQuery", async () => {
			const model: Query = {
				id: "",
				name: "",
				price: 0,
				vendor: { id: "app:/vendors/acme", name: "" }
			};

			expect(decodeQuery(encodeQuery(model))).toEqual(model);
		});

		it("should throw on invalid JSON", async () => {
			expect(() => decodeQuery("not valid json")).toThrow();
		});

		it("should throw on non-model JSON", async () => {
			expect(() => decodeQuery(JSON.stringify([1, 2, 3]))).toThrow(TypeError);
		});

	});

	describe("encodeQueryString()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", async () => {
				const query = { id: "/products/42" };

				expect(() => encodeQueryString(query, { mode: "json", base: "/relative/path" })).toThrow(TypeError);
			});

			it("should internalize absolute IRI to root-relative in json format", async () => {
				const query = { id: "https://example.com/products/42" } as Query;

				const encoded = encodeQueryString(query, { mode: "json", base: "https://example.com/" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "/products/42" })));
			});

			it("should internalize absolute IRI to root-relative in base64 format", async () => {
				const query = { id: "https://example.com/products/42" } as Query;

				const encoded = encodeQueryString(query, { mode: "base64", base: "https://example.com/" });

				expect(decodeQueryString(encoded, { base: "https://example.com/" })).toEqual(query);
			});

			it("should internalize absolute IRI to root-relative in form format", async () => {
				const query = { id: "https://example.com/products/42" } as Query;

				const encoded = encodeQueryString(query, { mode: "form", base: "https://example.com/" });

				expect(encoded).toBe("id=%22%2Fproducts%2F42%22");
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const query = { id: "app:/products/42" } as Query;
			const encoded = encodeQueryString(query, { mode: "json" });

			expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "/products/42" })));
		});

		describe("json format", () => {

			// json mode produces encodeURIComponent(JSON.stringify(query)) for all query shapes

			const jsonCases: [string, Record<string, unknown>][] = [

				// basic queries
				["empty query", {}],
				["string property", { name: "" }],
				["number property", { price: 0 }],
				["boolean property", { available: true }],
				["multiple properties", { id: "", name: "", price: 0 }],

				// nested queries
				["nested resource", { id: "", vendor: { id: "", name: "" } }],
				["deeply nested resource", { order: { customer: { address: { city: "" } } } }],

				// collection queries
				["singleton array collection", { items: [{ id: "", name: "" }] }],
				["empty singleton array", { items: [{}] }],

				// constraint keys
				["< constraint", { "<price": 100 }],
				["<= constraint", { "<=price": 100 }],
				["> constraint", { ">price": 50 }],
				[">= constraint", { ">=price": 50 }],
				["range constraints", { ">=price": 50, "<=price": 150 }],
				["~ search constraint", { "~name": "widget" }],
				["? disjunction with array", { "?category": ["electronics", "home"] }],
				["? disjunction with null", { "?vendor": null }],
				["! conjunction", { "!tags": ["featured", "sale"] }],
				["* focus ordering", { "*category": ["featured", "popular"] }],
				["^ sort (number)", { "^price": 1 }],
				["^ sort (negative)", { "^name": -2 }],
				["^ sort (string)", { "^price": "asc" }],
				["@ offset", { "@": 10 }],
				["# limit", { "#": 25 }],
				["@ offset + # limit", { "@": 0, "#": 25 }],

				// computed expressions
				["named expression", { "vendorName=vendor.name": "" }],
				["transform expression", { "releaseYear=year:releaseDate": 0 }],
				["aggregate expression", { "total=count:": 0 }],
				["pipeline expression", { "avgPrice=round:avg:price": 0 }],

				// localized content
				["wildcard locale", { name: { "*": "" } }],
				["language-tagged locale", { name: { "en": "", "fr": "" } }],
				["multi-valued locale", { keywords: { "en": [""], "fr": [""] } }],

				// complex queries
				["full collection query", {
					items: [{
						id: "", name: "", price: 0,
						vendor: { id: "", name: "" },
						">=price": 50, "<=price": 150,
						"~name": "widget",
						"?category": ["electronics", "home"],
						"^price": 1, "^name": -2,
						"@": 0, "#": 25
					}]
				}],
				["faceted search query", {
					items: [{
						"category=min:category": "",
						"count=count:": 0,
						"^count": "desc"
					}]
				}]

			];

			it.each(jsonCases)("should encode %s", async (_, query) => {
				const encoded = encodeQueryString(query as Query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should use json format when no format specified", async () => {
				const query = { name: "" } as Query;
				const encodedDefault = encodeQueryString(query);
				const encodedExplicit = encodeQueryString(query, { mode: "json" });

				expect(encodedDefault).toBe(encodedExplicit);
			});

		});

		describe("base64 format", () => {

			// basic encoding/decoding covered by roundtrip tests

			it("should produce URL-safe output", async () => {
				const query = { name: "" } as Query;
				const encoded = encodeQueryString(query, { mode: "base64" });

				// base64url should not contain URL-unsafe characters needing encoding
				expect(encoded).toBe(encodeURIComponent(encoded));
			});

			it("should handle unicode in values", async () => {
				const query = { "~name": "日本語" } as Query;
				const encoded = encodeQueryString(query, { mode: "base64" });
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);

			});

		});

		describe("form format", () => {

			describe("basic constraints", () => {

				it("should encode empty query", async () => {
					const query = {} as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					expect(encoded).toBe("");
				});

				it("should encode single constraint", async () => {
					const query = { "?name": "widget" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?name="widget"
					expect(encoded).toBe("%3Fname=%22widget%22");
				});

				it("should encode multiple constraints", async () => {
					const query = { "?name": "widget", ">=price": 100 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?name="widget"&>=price=100
					expect(encoded).toBe("%3Fname=%22widget%22&%3E%3Dprice=100");
				});

			});

			describe("comparison operators", () => {

				it("should encode less than", async () => {
					const query = { "<price": 100 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// <price=100
					expect(encoded).toBe("%3Cprice=100");
				});

				it("should encode less than or equal", async () => {
					const query = { "<=price": 100 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// <=price=100
					expect(encoded).toBe("%3C%3Dprice=100");
				});

				it("should encode greater than", async () => {
					const query = { ">price": 50 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >price=50
					expect(encoded).toBe("%3Eprice=50");
				});

				it("should encode greater than or equal", async () => {
					const query = { ">=price": 50 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=price=50
					expect(encoded).toBe("%3E%3Dprice=50");
				});

			});

			describe("search operator", () => {

				it("should encode prefix word search", async () => {
					const query = { "~name": "widget" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="widget"  (~ not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode search with spaces", async () => {
					const query = { "~name": "red widget" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="red widget"
					expect(encoded).toBe("~name=%22red%20widget%22");
				});

			});

			describe("disjunctive matching", () => {

				it("should encode single value", async () => {
					const query = { "?category": "electronics" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?category="electronics"
					expect(encoded).toBe("%3Fcategory=%22electronics%22");
				});

				it("should encode multiple values as repeated parameters", async () => {
					const query = { "?category": ["electronics", "home"] } as unknown as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?category="electronics"&?category="home"
					expect(encoded).toBe("%3Fcategory=%22electronics%22&%3Fcategory=%22home%22");
				});

				it("should encode null option for undefined matching", async () => {
					const query = { "?vendor": null } as unknown as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?vendor=null
					expect(encoded).toBe("%3Fvendor=null");
				});

			});

			describe("conjunctive matching", () => {

				it("should encode all-match constraint", async () => {
					const query = { "!tags": ["featured", "sale"] } as unknown as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// !tags="featured"&!tags="sale"  (! not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("!tags=%22featured%22&!tags=%22sale%22");
				});

			});

			describe("focus operator", () => {

				it("should encode single focus value", async () => {
					const query = { "*category": "electronics" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// *category="electronics"
					expect(encoded).toBe("*category=%22electronics%22");
				});

				it("should encode multiple focus values", async () => {
					const query = { "*category": ["electronics", "home"] } as unknown as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// *category="electronics"&*category="home"
					expect(encoded).toBe("*category=%22electronics%22&*category=%22home%22");
				});

			});

			describe("ordering operators", () => {

				it("should encode ascending sort", async () => {
					const query = { "^price": 1 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ^price=1
					expect(encoded).toBe("%5Eprice=1");
				});

				it("should encode descending sort", async () => {
					const query = { "^price": -1 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ^price=-1
					expect(encoded).toBe("%5Eprice=-1");
				});

				it("should encode multiple sort priorities", async () => {
					const query = { "^price": 1, "^name": -2 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ^price=1&^name=-2
					expect(encoded).toBe("%5Eprice=1&%5Ename=-2");
				});

			});

			describe("pagination", () => {

				it("should encode offset", async () => {
					const query = { "@": 10 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// @=10
					expect(encoded).toBe("%40=10");
				});

				it("should encode limit", async () => {
					const query = { "#": 25 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// #=25
					expect(encoded).toBe("%23=25");
				});

				it("should encode offset and limit together", async () => {
					const query = { "@": 0, "#": 25 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// @=0&#=25
					expect(encoded).toBe("%40=0&%23=25");
				});

			});

			describe("expression paths", () => {

				it("should encode dotted property paths", async () => {
					const query = { ">=vendor.rating": 4 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=vendor.rating=4
					expect(encoded).toBe("%3E%3Dvendor.rating=4");
				});

			});

			describe("expression transforms", () => {

				it("should encode constraint with single transform", async () => {
					const query = { ">=year:releaseDate": 2020 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=year:releaseDate=2020
					expect(encoded).toBe("%3E%3Dyear%3AreleaseDate=2020");
				});

				it("should encode constraint with transform pipeline", async () => {
					const query = { ">=round:avg:items.price": 100 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=round:avg:items.price=100
					expect(encoded).toBe("%3E%3Dround%3Aavg%3Aitems.price=100");
				});

				it("should encode disjunction with transform", async () => {
					// @ts-expect-error Testing array values in filtering constraints
					const query: Query = { "?month:releaseDate": [1, 6, 12] };
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					expect(encoded).toBe("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12");
				});

				it("should encode ordering with transform", async () => {
					const query = { "^year:releaseDate": 1 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ^year:releaseDate=1
					expect(encoded).toBe("%5Eyear%3AreleaseDate=1");
				});

			});

			describe("boolean values", () => {

				it("should encode true value", async () => {
					const query = { "?available": true } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?available=true
					expect(encoded).toBe("%3Favailable=true");
				});

				it("should encode false value", async () => {
					const query = { "?available": false } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?available=false
					expect(encoded).toBe("%3Favailable=false");
				});

			});

			describe("numeric values", () => {

				it("should encode zero", async () => {
					const query = { "@": 0 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// @=0
					expect(encoded).toBe("%40=0");
				});

				it("should encode positive integer", async () => {
					const query = { ">=price": 100 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=price=100
					expect(encoded).toBe("%3E%3Dprice=100");
				});

				it("should encode negative integer", async () => {
					const query = { ">=balance": -50 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=balance=-50
					expect(encoded).toBe("%3E%3Dbalance=-50");
				});

				it("should encode decimal", async () => {
					const query = { ">=price": 99.99 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=price=99.99
					expect(encoded).toBe("%3E%3Dprice=99.99");
				});

				it("should encode scientific notation", async () => {
					const query = { ">=count": 1.5e21 } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// >=count=1.5e+21  (+ encoded as %2B to avoid space interpretation)
					expect(encoded).toBe("%3E%3Dcount=1.5e%2B21");
				});

			});

			describe("string values", () => {

				it("should encode empty string", async () => {
					const query = { "~name": "" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name=""
					expect(encoded).toBe("~name=%22%22");
				});

				it("should encode simple string", async () => {
					const query = { "~name": "widget" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="widget"
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode string with spaces", async () => {
					const query = { "~name": "my widget" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="my widget"
					expect(encoded).toBe("~name=%22my%20widget%22");
				});

				it("should encode string with quotes", async () => {
					const query = { "~name": "say \"hello\"" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="say \"hello\""  (inner quotes escaped as \")
					expect(encoded).toBe("~name=%22say%20%5C%22hello%5C%22%22");
				});

				it("should encode unicode characters", async () => {
					const query = { "~name": "café" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="café"  (é encoded as UTF-8 bytes %C3%A9)
					expect(encoded).toBe("~name=%22caf%C3%A9%22");
				});

				it("should encode newlines", async () => {
					const query = { "~description": "line1\nline2" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~description="line1\nline2"
					expect(encoded).toBe("~description=%22line1%0Aline2%22");
				});

				it("should encode tabs", async () => {
					const query = { "~description": "col1\tcol2" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~description="col1\tcol2"
					expect(encoded).toBe("~description=%22col1%09col2%22");
				});

				it("should encode ampersand", async () => {
					const query = { "~name": "foo&bar" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="foo&bar"  (& encoded to avoid parameter separator)
					expect(encoded).toBe("~name=%22foo%26bar%22");
				});

				it("should encode equals sign", async () => {
					const query = { "~name": "a=b" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="a=b"  (= encoded to avoid key/value separator)
					expect(encoded).toBe("~name=%22a%3Db%22");
				});

				it("should encode plus sign", async () => {
					const query = { "~name": "a+b" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="a+b"  (+ encoded to avoid space interpretation)
					expect(encoded).toBe("~name=%22a%2Bb%22");
				});

				it("should encode percent sign", async () => {
					const query = { "~name": "100%" } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ~name="100%"  (% encoded to avoid escape sequence)
					expect(encoded).toBe("~name=%22100%25%22");
				});

			});

			describe("localized content", () => {

				it("should encode single tagged string", async () => {
					const query = { "?name": { "en": "Widget" } } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?name="Widget"@en
					expect(encoded).toBe("%3Fname=%22Widget%22%40en");
				});

				it("should encode multiple tagged strings", async () => {
					const query = { "?name": { "en": "Widget", "fr": "Gadget" } } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?name="Widget"@en&?name="Gadget"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr");
				});

				it("should encode dictionary with multi-value tags", async () => {
					// @ts-expect-error Testing multi-value language maps in filtering constraints
					const query: Query = { "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } };
					const encoded = encodeQueryString(query, { mode: "form" });

					// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr");
				});

			});

			describe("local/locals roundtrip", () => {

				it("should reconstruct single-tag Local as Locals", async () => {
					const query = { "?name": { "en": "Widget" } } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });
					const decoded = decodeQueryString(encoded);

					// Local normalizes to Locals (form mode is lossy for Local vs Locals)
					expect(decoded).toEqual({ "?name": { "en": ["Widget"] } });
				});

				it("should reconstruct multi-tag Local as Locals", async () => {
					const query = { "?name": { "en": "Widget", "fr": "Gadget" } } as Query;
					const encoded = encodeQueryString(query, { mode: "form" });
					const decoded = decodeQueryString(encoded);

					// Local normalizes to Locals (form mode is lossy for Local vs Locals)
					expect(decoded).toEqual({ "?name": { "en": ["Widget"], "fr": ["Gadget"] } });
				});

				it("should roundtrip single-element Locals", async () => {
					const query: Query = { "?name": { "en": ["Widget"] } };
					const encoded = encodeQueryString(query, { mode: "form" });
					const decoded = decodeQueryString(encoded);

					expect(decoded).toEqual(query);
				});

				it("should roundtrip multi-value Locals", async () => {
					// @ts-expect-error Testing multi-value language maps in filtering constraints
					const query: Query = { "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } };
					const encoded = encodeQueryString(query, { mode: "form" });
					const decoded = decodeQueryString(encoded);

					expect(decoded).toEqual(query);
				});

			});

		});

	});

	describe("decodeQueryString()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", async () => {
				const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

				expect(() => decodeQueryString(encoded, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should resolve root-relative IRI to absolute in json format", async () => {
				const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

				const decoded = decodeQueryString(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ id: "https://example.com/products/42" } as Query);
			});

			it("should resolve root-relative IRI to absolute in base64 format", async () => {
				const query = { id: "/products/42" } as Query;
				const encoded = encodeQueryString(query, { mode: "base64" });

				const decoded = decodeQueryString(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ id: "https://example.com/products/42" } as Query);
			});

			it("should resolve root-relative IRI to absolute in form format", async () => {
				const encoded = "id=%22%2Fproducts%2F42%22";

				const decoded = decodeQueryString(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ "?id": "https://example.com/products/42" } as Query);
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

			expect(decodeQueryString(encoded))
				.toEqual({ id: "app:/products/42" } as Query);
		});

		describe("format auto-detection", () => {

			it("should detect and decode JSON format", async () => {
				const query = { name: "", price: 0 } as Query;
				const encoded = encodeQueryString(query, { mode: "json" });
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should detect and decode base64 format", async () => {
				const query = { name: "", price: 0 } as Query;
				const encoded = encodeQueryString(query, { mode: "base64" });
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should detect and decode form format", async () => {
				const query = { "~name": "widget", ">=price": 50 } as Query;
				const encoded = encodeQueryString(query, { mode: "form" });
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

		});

		describe("json format decoding", () => {

			it("should decode empty query", async () => {
				const encoded = encodeURIComponent("{}");
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual({});
			});

			it("should decode query with properties", async () => {
				const query = { id: "", name: "", price: 0, available: true } as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode nested queries", async () => {
				const query = {
					vendor: { id: "", name: "" }
				} as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode collection queries", async () => {
				const query = {
					items: [{ id: "", name: "" }]
				} as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode constraint keys", async () => {
				const query = {
					">=price": 50,
					"<=price": 150,
					"~name": "widget",
					"^price": 1,
					"@": 0,
					"#": 25
				} as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode computed expressions", async () => {
				const query = {
					"vendorName=vendor.name": "",
					"total=count:": 0
				} as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

		});

		describe("base64 format decoding", () => {

			it("should decode empty query", async () => {
				const encoded = btoa("{}");
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual({});
			});

			it("should decode query with properties", async () => {
				const query = { id: "", name: "", price: 0 } as Query;
				const encoded = btoa(JSON.stringify(query));
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode nested queries", async () => {
				const query = {
					order: { customer: { address: { city: "" } } }
				} as Query;
				const encoded = btoa(JSON.stringify(query));
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode unicode content", async () => {
				const query = { "~name": "日本語" } as Query;
				// Use encodeQuery to produce proper UTF-8 base64 encoding
				const encoded = encodeQueryString(query, { mode: "base64" });
				const decoded = decodeQueryString(encoded);

				expect(decoded).toEqual(query);
			});

		});

		describe("form format decoding", () => {

			// The decoder is lenient: it accepts both canonical and shorthand forms
			// - Unencoded operators: ~name=widget (not just %7Ename=widget)
			// - Unquoted strings: name=widget (not just name="widget")
			// - Shorthand constraints: price>=100 (postfix) as well as >=price=100 (prefix)

			describe("basic parameters", () => {

				it("should decode single parameter", async () => {
					const decoded = decodeQueryString("name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should decode multiple parameters", async () => {
					const decoded = decodeQueryString("name=test&price=100");

					expect(decoded).toHaveProperty("?name");
					expect(decoded).toHaveProperty("?price");
				});

			});

			describe("comparison operators", () => {

				it.each([
					["< (encoded)", "price%3C100", "<price", 100],
					["< (unencoded)", "price<100", "<price", 100],
					["<= (encoded)", "price%3C%3D100", "<=price", 100],
					["<= (unencoded)", "price<=100", "<=price", 100],
					["> (encoded)", "price%3E50", ">price", 50],
					["> (unencoded)", "price>50", ">price", 50],
					[">= (encoded)", "price%3E%3D50", ">=price", 50],
					[">= (unencoded)", "price>=50", ">=price", 50],
					[">= (prefix)", "%3E%3Dprice=50", ">=price", 50]
				] as const)("should decode %s", async (_, input, key, value) => {
					expect(decodeQueryString(input)).toHaveProperty(key, value);
				});

			});

			describe("search operator", () => {

				it.each([
					["encoded", "%7Ename=widget", "widget"],
					["unencoded", "~name=widget", "widget"],
					["spaces (%20)", "%7Ename=red%20widget", "red widget"],
					["plus as space", "%7Ename=red+widget", "red widget"]
				] as const)("should decode search (%s)", async (_, input, value) => {
					expect(decodeQueryString(input)).toHaveProperty("~name", value);
				});

			});

			describe("disjunctive matching", () => {

				it("should decode single value as array", async () => {
					const decoded = decodeQueryString("category=electronics");

					expect(decoded).toHaveProperty("?category");
				});

				it("should decode repeated parameters as array", async () => {
					const decoded = decodeQueryString("category=electronics&category=home") as Record<string, unknown>;

					expect(decoded["?category"]).toEqual(["electronics", "home"]);
				});

				it("should decode explicit prefix operator", async () => {
					const decoded = decodeQueryString("%3Fcategory=electronics");

					expect(decoded).toHaveProperty("?category");
				});

				it("should decode null for undefined matching", async () => {
					const decoded = decodeQueryString("%3Fvendor=null") as Record<string, unknown>;

					expect(decoded["?vendor"]).toBe(null);
				});

			});

			describe("conjunctive matching", () => {

				it.each([
					["encoded", "%21tags=featured&%21tags=sale"],
					["unencoded", "!tags=featured&!tags=sale"]
				])("should decode all-match constraint (%s)", async (_, input) => {
					const decoded = decodeQueryString(input) as Record<string, unknown>;

					expect(decoded["!tags"]).toEqual(["featured", "sale"]);
				});

				it.each([
					["encoded", "%21tags=premium"],
					["unencoded", "!tags=premium"]
				])("should decode explicit prefix operator (%s)", async (_, input) => {
					expect(decodeQueryString(input)).toHaveProperty("!tags");
				});

			});

			describe("focus ordering", () => {

				it("should decode focus constraint with single value encoded", async () => {
					// *category=featured
					const decoded = decodeQueryString("*category=featured");

					expect(decoded).toHaveProperty("*category");
				});

				it("should decode focus constraint with multiple values", async () => {
					// *category=featured&*category=popular
					const decoded = decodeQueryString("*category=featured&*category=popular") as Record<string, unknown>;

					expect(decoded["*category"]).toEqual(["featured", "popular"]);
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
				] as const)("should decode %s", async (_, input, key, value) => {
					expect(decodeQueryString(input)).toHaveProperty(key, value);
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
				] as const)("should decode %s", async (_, input, key, value) => {
					expect(decodeQueryString(input)).toHaveProperty(key, value);
				});

			});

			describe("value parsing", () => {

				it("should parse numeric strings as numbers", async () => {
					const decoded = decodeQueryString("%3E%3Dprice=100") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(100);
					expect(typeof decoded[">=price"]).toBe("number");
				});

				it("should parse decimal numbers", async () => {
					const decoded = decodeQueryString("%3E%3Dprice=99.99") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(99.99);
				});

				it("should parse negative numbers", async () => {
					const decoded = decodeQueryString("%5Eprice=-1") as Record<string, unknown>;

					expect(decoded["^price"]).toBe(-1);
				});

				it("should parse boolean true", async () => {
					const decoded = decodeQueryString("available=true") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(true);
				});

				it("should parse boolean false", async () => {
					const decoded = decodeQueryString("available=false") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(false);
				});

				it("should preserve non-numeric strings", async () => {
					const decoded = decodeQueryString("%7Ename=widget") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("widget");
					expect(typeof decoded["~name"]).toBe("string");
				});

				it("should decode percent-encoded special characters", async () => {
					const decoded = decodeQueryString("%7Ename=foo%26bar") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("foo&bar");
				});

				it("should decode percent-encoded unicode", async () => {
					const decoded = decodeQueryString("%7Ename=caf%C3%A9") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("café");
				});

				it("should decode empty value", async () => {
					const decoded = decodeQueryString("~name=") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("");
				});

				it("should decode equals in value", async () => {
					// ~name=a=b (= in value must be encoded)
					const decoded = decodeQueryString("~name=a%3Db") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("a=b");
				});

				it("should parse null", async () => {
					const decoded = decodeQueryString("value=null") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(null);
				});

				it("should parse scientific notation", async () => {
					const decoded = decodeQueryString("value=1e10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1e10);
				});

				it("should parse negative exponent", async () => {
					const decoded = decodeQueryString("value=1.5e-10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1.5e-10);
				});

				it("should parse quoted string preserving type", async () => {
					// "123" should remain string, not convert to number
					const decoded = decodeQueryString("value=%22123%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("123");
					expect(typeof decoded["?value"]).toBe("string");
				});

				it("should parse quoted null as string", async () => {
					const decoded = decodeQueryString("value=%22null%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("null");
					expect(typeof decoded["?value"]).toBe("string");
				});

				it("should decode JSON escape sequences", async () => {
					// "a\nb" encoded
					const decoded = decodeQueryString("value=%22a%5Cnb%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\nb");
				});

				it("should decode escaped quotes in strings", async () => {
					// "a\"b" encoded
					const decoded = decodeQueryString("value=%22a%5C%22b%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\"b");
				});

				it("should decode unicode escapes", async () => {
					// "\u0041" = "A"
					const decoded = decodeQueryString("value=%22%5Cu0041%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("A");
				});

				it("should decode localized string", async () => {
					// "Hello"@en → always reconstructed as Locals (Options are multi-valued)
					const decoded = decodeQueryString("label=%22Hello%22%40en") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual({ "en": ["Hello"] });
				});

				it("should decode localized string with region", async () => {
					// "Colour"@en-GB → always reconstructed as Locals (Options are multi-valued)
					const decoded = decodeQueryString("label=%22Colour%22%40en-GB") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual({ "en-GB": ["Colour"] });
				});

				it("should decode multiple tagged values into Locals object", async () => {
					// ?name="Widget"@en&?name="Gadget"@fr → always Locals
					const decoded = decodeQueryString("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr") as Record<string, unknown>;

					expect(decoded["?name"]).toEqual({ "en": ["Widget"], "fr": ["Gadget"] });
				});

				it("should decode multiple values per tag into Locals object", async () => {
					// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
					const decoded = decodeQueryString("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr") as Record<string, unknown>;

					expect(decoded["?name"]).toEqual({ "en": ["Widget", "Gadget"], "fr": ["Bidule"] });
				});

			});

			describe("expression paths", () => {

				it("should decode unencoded dots in paths", async () => {
					// >=vendor.rating=4 (dot unreserved, no encoding needed)
					const decoded = decodeQueryString("%3E%3Dvendor.rating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

				it("should decode percent-encoded dots in paths", async () => {
					// >=vendor.rating=4 (dot encoded as %2E)
					const decoded = decodeQueryString("%3E%3Dvendor%2Erating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

			});

			describe("unicode identifiers", () => {

				it("should decode identifier with unicode letter (Greek)", async () => {
					// πrice=100 (Greek pi as first character)
					const decoded = decodeQueryString("%CF%80rice=100");

					expect(decoded).toHaveProperty("?πrice", 100);
				});

				it("should decode identifier with unicode letter (Cyrillic)", async () => {
					// цена=100 (Russian "price")
					const decoded = decodeQueryString("%D1%86%D0%B5%D0%BD%D0%B0=100");

					expect(decoded).toHaveProperty("?цена", 100);
				});

				it("should decode identifier with unicode letter (CJK)", async () => {
					// 价格=100 (Chinese "price")
					const decoded = decodeQueryString("%E4%BB%B7%E6%A0%BC=100");

					expect(decoded).toHaveProperty("?价格", 100);
				});

				it("should decode identifier with unicode continuation characters", async () => {
					// na\u0301me=test (combining acute accent in identifier)
					const decoded = decodeQueryString("na%CC%81me=test");

					expect(decoded).toHaveProperty("?na\u0301me", "test");
				});

				it("should decode path with unicode identifiers", async () => {
					// >=производитель.рейтинг=4 (Russian vendor.rating)
					const decoded = decodeQueryString("%3E%3D%D0%BF%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D0%B8%D1%82%D0%B5%D0%BB%D1%8C.%D1%80%D0%B5%D0%B9%D1%82%D0%B8%D0%BD%D0%B3=4");

					expect(decoded).toHaveProperty(">=производитель.рейтинг", 4);
				});

			});

			describe("expression transforms", () => {

				it("should decode constraint with single transform", async () => {
					// >=year:releaseDate=2020
					const decoded = decodeQueryString("%3E%3Dyear%3AreleaseDate=2020");

					expect(decoded).toHaveProperty(">=year:releaseDate", 2020);
				});

				it("should decode constraint with transform pipeline", async () => {
					// >=round:avg:items.price=100
					const decoded = decodeQueryString("%3E%3Dround%3Aavg%3Aitems.price=100");

					expect(decoded).toHaveProperty(">=round:avg:items.price", 100);
				});

				it("should decode disjunction with transform", async () => {
					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					const decoded = decodeQueryString("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12") as Record<string, unknown>;

					expect(decoded["?month:releaseDate"]).toEqual([1, 6, 12]);
				});

				it("should decode ordering with transform", async () => {
					// ^year:releaseDate=1
					const decoded = decodeQueryString("%5Eyear%3AreleaseDate=1");

					expect(decoded).toHaveProperty("^year:releaseDate", 1);
				});

			});

			describe("malformed input handling", () => {
				// The decoder is lenient with common URL parsing quirks

				it("should handle empty string", async () => {
					const decoded = decodeQueryString("");

					expect(decoded).toEqual({});
				});

				it("should handle parameter without value", async () => {
					const decoded = decodeQueryString("name");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle leading ampersand", async () => {
					const decoded = decodeQueryString("&name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle trailing ampersand", async () => {
					const decoded = decodeQueryString("name=test&");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle multiple ampersands", async () => {
					const decoded = decodeQueryString("name=test&&price=100");

					expect(decoded).toHaveProperty("?name");
					expect(decoded).toHaveProperty("?price");
				});

			});

			describe("integration", () => {

				it("should decode complex query with multiple operators", async () => {
					// status=active&status=pending&~name=corp&price>=100&price<=1000&^date=desc&@=0&#=25
					const decoded = decodeQueryString(
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

			// Using Record<string, unknown>[] since some test cases have array values that don't match Query type
			const testQueries: Record<string, unknown>[] = [
				{},
				{ name: "" },
				{ id: "", name: "", price: 0, available: true },
				{ vendor: { id: "", name: "" } },
				{ items: [{ id: "", name: "" }] },
				{ ">=price": 50, "<=price": 150 },
				{ "~name": "widget" },
				{ "?category": ["electronics", "home"] },
				{ "^price": 1, "^name": -2 },
				{ "@": 0, "#": 25 },
				{ "vendorName=vendor.name": "" },
				{ "total=count:": 0 },
				{ name: { "*": "" } },
				{ name: { "en": "hello", "fr": "bonjour" } },
				{ keywords: { "en": [""], "fr": [""] } }
			];

			it.each(testQueries.map((q, i) => [i, q] as const))(
				"should roundtrip query %i via json format",
				async (_, query) => {
					const encoded = encodeQueryString(query as Query, { mode: "json" });
					const decoded = decodeQueryString(encoded);

					expect(decoded).toEqual(query);
				}
			);

			it.each(testQueries.map((q, i) => [i, q] as const))(
				"should roundtrip query %i via base64 format",
				async (_, query) => {
					const encoded = encodeQueryString(query as Query, { mode: "base64" });
					const decoded = decodeQueryString(encoded);

					expect(decoded).toEqual(query);
				}
			);

		});

		describe("lenient option", () => {

			it("should skip structural validation when lenient", async () => {
				const json = encodeURIComponent(JSON.stringify({ "!invalid": true }));

				expect(() => decodeQueryString(json, { lenient: true })).not.toThrow();
			});

			it("should still throw on syntax errors when lenient", async () => {
				expect(() => decodeQueryString(encodeURIComponent("{invalid"), { lenient: true })).toThrow();
			});

		});

		describe("error handling", () => {

			it("should handle malformed JSON gracefully", async () => {
				expect(() => decodeQueryString(encodeURIComponent("{invalid"))).toThrow();
			});

			it("should throw on invalid base64 JSON", async () => {
				// Valid base64 but invalid JSON throws with cause
				expect(() => decodeQueryString("eyJpbnZhbGlk")).toThrow("malformed query");
			});

			it("should handle truncated percent-encoding", async () => {
				expect(() => decodeQueryString("%")).toThrow();
			});

			it("should handle invalid percent-encoding sequence", async () => {
				expect(() => decodeQueryString("%ZZ")).toThrow();
			});

			it("should handle incomplete percent-encoding", async () => {
				expect(() => decodeQueryString("%2")).toThrow();
			});

		});

	});


	describe("encodeProbe()", () => {

		describe("projection keys", () => {

			it("should encode simple property", async () => {
				const probe = { target: "name", pipe: [], path: ["name"] };

				expect(encodeProbe(probe)).toBe("name");
			});

			it("should encode aliased property", async () => {
				const probe = { target: "city", pipe: [], path: ["address"] };

				expect(encodeProbe(probe)).toBe("city=address");
			});

			it("should encode aliased property with deep path", async () => {
				const probe = { target: "city", pipe: [], path: ["customer", "address"] };

				expect(encodeProbe(probe)).toBe("city=customer.address");
			});

			it("should encode property with transform", async () => {
				const probe = { target: "releaseYear", pipe: ["year"], path: ["releaseDate"] } as const;

				expect(encodeProbe(probe)).toBe("releaseYear=year:releaseDate");
			});

			it("should encode property with transform pipeline", async () => {
				const probe = { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] } as const;

				expect(encodeProbe(probe)).toBe("avgPrice=round:avg:price");
			});

			it("should encode aggregate without path", async () => {
				const probe = { target: "total", pipe: ["count"], path: [] } as const;

				expect(encodeProbe(probe)).toBe("total=count:");
			});

		});

		describe("constraint keys", () => {

			it("should encode less than constraint", async () => {
				const probe = { target: "<", pipe: [], path: ["price"] };

				expect(encodeProbe(probe)).toBe("<price");
			});

			it("should encode less than or equal constraint", async () => {
				const probe = { target: "<=", pipe: [], path: ["price"] };

				expect(encodeProbe(probe)).toBe("<=price");
			});

			it("should encode greater than constraint", async () => {
				const probe = { target: ">", pipe: [], path: ["price"] };

				expect(encodeProbe(probe)).toBe(">price");
			});

			it("should encode greater than or equal constraint", async () => {
				const probe = { target: ">=", pipe: [], path: ["price"] };

				expect(encodeProbe(probe)).toBe(">=price");
			});

			it("should encode search constraint", async () => {
				const probe = { target: "~", pipe: [], path: ["name"] };

				expect(encodeProbe(probe)).toBe("~name");
			});

			it("should encode disjunctive constraint", async () => {
				const probe = { target: "?", pipe: [], path: ["category"] };

				expect(encodeProbe(probe)).toBe("?category");
			});

			it("should encode conjunctive constraint", async () => {
				const probe = { target: "!", pipe: [], path: ["tags"] };

				expect(encodeProbe(probe)).toBe("!tags");
			});

			it("should encode focus constraint", async () => {
				const probe = { target: "*", pipe: [], path: ["category"] };

				expect(encodeProbe(probe)).toBe("*category");
			});

			it("should encode order constraint", async () => {
				const probe = { target: "^", pipe: [], path: ["price"] };

				expect(encodeProbe(probe)).toBe("^price");
			});

			it("should encode offset constraint", async () => {
				const probe = { target: "@", pipe: [], path: [] };

				expect(encodeProbe(probe)).toBe("@");
			});

			it("should encode limit constraint", async () => {
				const probe = { target: "#", pipe: [], path: [] };

				expect(encodeProbe(probe)).toBe("#");
			});

			it("should encode constraint with path", async () => {
				const probe = { target: ">=", pipe: [], path: ["vendor", "rating"] };

				expect(encodeProbe(probe)).toBe(">=vendor.rating");
			});

			it("should encode constraint with transform", async () => {
				const probe = { target: ">=", pipe: ["year"], path: ["releaseDate"] } as const;

				expect(encodeProbe(probe)).toBe(">=year:releaseDate");
			});

		});

	});

	describe("decodeProbe()", () => {

		describe("projection keys", () => {

			it("should decode simple property", async () => {
				const expected = { target: "name", pipe: [], path: ["name"] };

				expect(decodeProbe("name")).toEqual(expected);
			});

			it("should decode aliased property", async () => {
				const expected = { target: "city", pipe: [], path: ["address"] };

				expect(decodeProbe("city=address")).toEqual(expected);
			});

			it("should decode aliased property with deep path", async () => {
				const expected = { target: "city", pipe: [], path: ["customer", "address"] };

				expect(decodeProbe("city=customer.address")).toEqual(expected);
			});

			it("should decode property with transform", async () => {
				const expected = { target: "releaseYear", pipe: ["year"], path: ["releaseDate"] };

				expect(decodeProbe("releaseYear=year:releaseDate")).toEqual(expected);
			});

			it("should decode property with transform pipeline", async () => {
				const expected = { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] };

				expect(decodeProbe("avgPrice=round:avg:price")).toEqual(expected);
			});

			it("should decode aggregate without path", async () => {
				const expected = { target: "total", pipe: ["count"], path: [] };

				expect(decodeProbe("total=count:")).toEqual(expected);
			});

		});

		describe("constraint keys", () => {

			it("should decode less than constraint", async () => {
				const expected = { target: "<", pipe: [], path: ["price"] };

				expect(decodeProbe("<price")).toEqual(expected);
			});

			it("should decode less than or equal constraint", async () => {
				const expected = { target: "<=", pipe: [], path: ["price"] };

				expect(decodeProbe("<=price")).toEqual(expected);
			});

			it("should decode greater than constraint", async () => {
				const expected = { target: ">", pipe: [], path: ["price"] };

				expect(decodeProbe(">price")).toEqual(expected);
			});

			it("should decode greater than or equal constraint", async () => {
				const expected = { target: ">=", pipe: [], path: ["price"] };

				expect(decodeProbe(">=price")).toEqual(expected);
			});

			it("should decode search constraint", async () => {
				const expected = { target: "~", pipe: [], path: ["name"] };

				expect(decodeProbe("~name")).toEqual(expected);
			});

			it("should decode disjunctive constraint", async () => {
				const expected = { target: "?", pipe: [], path: ["category"] };

				expect(decodeProbe("?category")).toEqual(expected);
			});

			it("should decode conjunctive constraint", async () => {
				const expected = { target: "!", pipe: [], path: ["tags"] };

				expect(decodeProbe("!tags")).toEqual(expected);
			});

			it("should decode focus constraint", async () => {
				const expected = { target: "*", pipe: [], path: ["category"] };

				expect(decodeProbe("*category")).toEqual(expected);
			});

			it("should decode order constraint", async () => {
				const expected = { target: "^", pipe: [], path: ["price"] };

				expect(decodeProbe("^price")).toEqual(expected);
			});

			it("should decode offset constraint", async () => {
				const expected = { target: "@", pipe: [], path: [] };

				expect(decodeProbe("@")).toEqual(expected);
			});

			it("should decode limit constraint", async () => {
				const expected = { target: "#", pipe: [], path: [] };

				expect(decodeProbe("#")).toEqual(expected);
			});

			it("should decode constraint with path", async () => {
				const expected = { target: ">=", pipe: [], path: ["vendor", "rating"] };

				expect(decodeProbe(">=vendor.rating")).toEqual(expected);
			});

			it("should decode constraint with transform", async () => {
				const expected = { target: ">=", pipe: ["year"], path: ["releaseDate"] };

				expect(decodeProbe(">=year:releaseDate")).toEqual(expected);
			});

		});

		describe("roundtrip", () => {

			it("should roundtrip simple property shorthand", async () => {
				const probe = { target: "name", pipe: [], path: ["name"] };

				expect(decodeProbe(encodeProbe(probe))).toEqual(probe);
			});

			it("should roundtrip simple property explicit form", async () => {
				const expected = { target: "name", pipe: [], path: ["name"] };

				expect(decodeProbe("name=name")).toEqual(expected);
			});

			it("should roundtrip aliased property with transform", async () => {
				const probe = { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] } as const;

				expect(decodeProbe(encodeProbe(probe))).toEqual(probe);
			});

			it("should roundtrip constraint with path", async () => {
				const probe = { target: ">=", pipe: [], path: ["vendor", "rating"] };

				expect(decodeProbe(encodeProbe(probe))).toEqual(probe);
			});

		});

		describe("error handling", () => {

			it("should reject path without target", async () => {
				expect(() => decodeProbe("address.city")).toThrow();
			});

			it("should reject empty string", async () => {
				expect(() => decodeProbe("")).toThrow();
			});

		});

	});

});
