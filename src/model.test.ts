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
import { defaultBase } from "./index.js";
import {
	decodeCriterion,
	decodeQuery,
	encodeCriterion,
	encodeQuery,
	isBinding,
	isCriterion,
	isExpression,
	isLocalModel,
	isLocalsModel,
	isModel,
	isOperator,
	isOption,
	isOptions,
	isQuery,
	isTransform,
	isValueModel,
	isValuesModel,
	type Query
} from "./model.js";


describe("guards", () => {

	describe("isModel", () => {

		describe("valid models", () => {

			it("should accept empty model", async () => {
				expect(isModel({})).toBeTruthy();
			});

			it("should accept model with properties", async () => {
				expect(isModel({ id: "", name: "" })).toBeTruthy();
				expect(isModel({ price: 0, available: true })).toBeTruthy();
			});

			it("should accept nested models", async () => {
				expect(isModel({ vendor: { id: "", name: "" } })).toBeTruthy();
			});

			it("should accept binding keys", async () => {
				expect(isModel({ "vendorName=vendor.name": "" })).toBeTruthy();
			});

		});

		describe("invalid models", () => {

			it("should reject non-objects", async () => {
				expect(isModel(null)).toBeFalsy();
				expect(isModel(undefined)).toBeFalsy();
				expect(isModel(true)).toBeFalsy();
				expect(isModel(42)).toBeFalsy();
				expect(isModel("text")).toBeFalsy();
			});

			it("should reject arrays", async () => {
				expect(isModel([])).toBeFalsy();
				expect(isModel([{ id: "" }])).toBeFalsy();
			});

		});

	});

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

			it("should reject missing equals sign", async () => {
				expect(isBinding("name")).toBeFalsy();
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
				expect(isExpression("a:b:")).toBeTruthy();
				expect(isExpression("a:b:c:")).toBeTruthy();
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

			it("should reject invalid characters", async () => {
				expect(isExpression("name@field")).toBeFalsy();
				expect(isExpression("name#field")).toBeFalsy();
			});

		});

	});


	describe("isValuesModel", () => {

		describe("valid model values", () => {

			it("should accept literals", async () => {
				expect(isValuesModel(true)).toBeTruthy();
				expect(isValuesModel(false)).toBeTruthy();
				expect(isValuesModel(0)).toBeTruthy();
				expect(isValuesModel(42)).toBeTruthy();
				expect(isValuesModel("")).toBeTruthy();
				expect(isValuesModel("text")).toBeTruthy();
			});

			it("should accept references", async () => {
				expect(isValuesModel("/products/42")).toBeTruthy();
				expect(isValuesModel("https://example.com/resource")).toBeTruthy();
			});

			it("should accept nested models", async () => {
				expect(isValuesModel({ id: "", name: "" })).toBeTruthy();
				expect(isValuesModel({ vendor: { id: "" } })).toBeTruthy();
			});

			it("should accept single-valued language maps", async () => {
				expect(isValuesModel({ "*": "" })).toBeTruthy();
				expect(isValuesModel({ "en": "text" })).toBeTruthy();
				expect(isValuesModel({ "en": "hello", "fr": "bonjour" })).toBeTruthy();
			});

			it("should accept multi-valued language maps", async () => {
				expect(isValuesModel({ "en": [""] })).toBeTruthy();
				expect(isValuesModel({ "en": ["hello"], "fr": ["bonjour"] })).toBeTruthy();
			});

			it("should accept literal arrays", async () => {
				expect(isValuesModel([true])).toBeTruthy();
				expect(isValuesModel([0])).toBeTruthy();
				expect(isValuesModel([""])).toBeTruthy();
			});

			it("should accept reference arrays", async () => {
				expect(isValuesModel(["/products/42"])).toBeTruthy();
			});

			it("should accept query arrays", async () => {
				expect(isValuesModel([{ id: "", name: "" }])).toBeTruthy();
			});

		});

		describe("invalid model values", () => {

			it("should reject null and undefined", async () => {
				expect(isValuesModel(null)).toBeFalsy();
				expect(isValuesModel(undefined)).toBeFalsy();
			});

			it("should reject empty arrays", async () => {
				expect(isValuesModel([])).toBeFalsy();
			});

			it("should reject arrays with multiple elements", async () => {
				expect(isValuesModel(["/a", "/b"])).toBeFalsy();
				expect(isValuesModel([{ id: "" }, { id: "" }])).toBeFalsy();
			});

		});

	});

	describe("isValueModel", () => {

		describe("valid value models", () => {

			it("should accept literals", async () => {
				expect(isValueModel(true)).toBeTruthy();
				expect(isValueModel(false)).toBeTruthy();
				expect(isValueModel(0)).toBeTruthy();
				expect(isValueModel(42)).toBeTruthy();
				expect(isValueModel("")).toBeTruthy();
				expect(isValueModel("text")).toBeTruthy();
			});

			it("should accept references", async () => {
				expect(isValueModel("/products/42")).toBeTruthy();
				expect(isValueModel("https://example.com/resource")).toBeTruthy();
			});

			it("should accept nested models", async () => {
				expect(isValueModel({ id: "", name: "" })).toBeTruthy();
				expect(isValueModel({ vendor: { id: "" } })).toBeTruthy();
			});

		});

		describe("invalid value models", () => {

			it("should reject null and undefined", async () => {
				expect(isValueModel(null)).toBeFalsy();
				expect(isValueModel(undefined)).toBeFalsy();
			});

			it("should reject arrays", async () => {
				expect(isValueModel([])).toBeFalsy();
				expect(isValueModel([true])).toBeFalsy();
				expect(isValueModel(["/a"])).toBeFalsy();
			});

			it("should accept objects that are valid models", async () => {
				// { "en": ["hello"] } is a valid Model (identifier key with literal array value)
				expect(isValueModel({ "en": ["hello"] })).toBeTruthy();
			});

		});

	});

	describe("isLocalModel", () => {

		describe("valid local models", () => {

			it("should accept wildcard tag", async () => {
				expect(isLocalModel({ "*": "" })).toBeTruthy();
				expect(isLocalModel({ "*": "text" })).toBeTruthy();
			});

			it("should accept language tags", async () => {
				expect(isLocalModel({ "en": "hello" })).toBeTruthy();
				expect(isLocalModel({ "fr": "bonjour" })).toBeTruthy();
			});

			it("should accept multiple language tags", async () => {
				expect(isLocalModel({ "en": "hello", "fr": "bonjour" })).toBeTruthy();
			});

		});

		describe("invalid local models", () => {

			it("should reject null and undefined", async () => {
				expect(isLocalModel(null)).toBeFalsy();
				expect(isLocalModel(undefined)).toBeFalsy();
			});

			it("should accept plain string shorthand", async () => {
				expect(isLocalModel("text")).toBeTruthy();
				expect(isLocalModel("")).toBeTruthy();
			});

			it("should reject non-string primitives", async () => {
				expect(isLocalModel(true)).toBeFalsy();
				expect(isLocalModel(42)).toBeFalsy();
			});

			it("should reject multi-valued maps", async () => {
				expect(isLocalModel({ "en": ["hello"] })).toBeFalsy();
			});

			it("should reject invalid tag keys", async () => {
				expect(isLocalModel({ "invalid tag": "text" })).toBeFalsy();
			});

		});

	});

	describe("isLocalsModel", () => {

		describe("valid locals models", () => {

			it("should accept wildcard tag", async () => {
				expect(isLocalsModel({ "*": [""] })).toBeTruthy();
				expect(isLocalsModel({ "*": ["text"] })).toBeTruthy();
			});

			it("should accept language tags", async () => {
				expect(isLocalsModel({ "en": ["hello"] })).toBeTruthy();
				expect(isLocalsModel({ "fr": ["bonjour"] })).toBeTruthy();
			});

			it("should accept multiple language tags", async () => {
				expect(isLocalsModel({ "en": ["hello"], "fr": ["bonjour"] })).toBeTruthy();
			});

		});

		describe("invalid locals models", () => {

			it("should reject null and undefined", async () => {
				expect(isLocalsModel(null)).toBeFalsy();
				expect(isLocalsModel(undefined)).toBeFalsy();
			});

			it("should accept plain string array shorthand", async () => {
				expect(isLocalsModel(["text"])).toBeTruthy();
				expect(isLocalsModel([""])).toBeTruthy();
			});

			it("should reject non-array primitives", async () => {
				expect(isLocalsModel(true)).toBeFalsy();
				expect(isLocalsModel(42)).toBeFalsy();
				expect(isLocalsModel("text")).toBeFalsy();
			});

			it("should reject single-valued maps", async () => {
				expect(isLocalsModel({ "en": "hello" })).toBeFalsy();
			});

			it("should reject invalid tag keys", async () => {
				expect(isLocalsModel({ "invalid tag": ["text"] })).toBeFalsy();
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


	describe("isCriterion", () => {

		describe("valid criteria", () => {

			it("should accept simple projection criterion", async () => {
				expect(isCriterion({ target: "name", pipe: [], path: [] })).toBeTruthy();
			});

			it("should accept criterion with path", async () => {
				expect(isCriterion({ target: "city", pipe: [], path: ["address"] })).toBeTruthy();
				expect(isCriterion({ target: "city", pipe: [], path: ["customer", "address"] })).toBeTruthy();
			});

			it("should accept criterion with pipe", async () => {
				expect(isCriterion({ target: "releaseYear", pipe: ["year"], path: ["releaseDate"] })).toBeTruthy();
				expect(isCriterion({ target: "avgPrice", pipe: ["round", "avg"], path: ["price"] })).toBeTruthy();
			});

			it("should accept filtering criteria", async () => {
				expect(isCriterion({ target: "<", pipe: [], path: ["price"] })).toBeTruthy();
				expect(isCriterion({ target: ">=", pipe: [], path: ["price"] })).toBeTruthy();
				expect(isCriterion({ target: "~", pipe: [], path: ["name"] })).toBeTruthy();
				expect(isCriterion({ target: "?", pipe: [], path: ["category"] })).toBeTruthy();
			});

			it("should accept ordering criteria", async () => {
				expect(isCriterion({ target: "*", pipe: [], path: ["category"] })).toBeTruthy();
				expect(isCriterion({ target: "^", pipe: [], path: ["price"] })).toBeTruthy();
			});

			it("should accept paging criteria", async () => {
				expect(isCriterion({ target: "@", pipe: [], path: [] })).toBeTruthy();
				expect(isCriterion({ target: "#", pipe: [], path: [] })).toBeTruthy();
			});

		});

		describe("invalid criteria", () => {

			it("should reject non-objects", async () => {
				expect(isCriterion(null)).toBeFalsy();
				expect(isCriterion(undefined)).toBeFalsy();
				expect(isCriterion("string")).toBeFalsy();
				expect(isCriterion(123)).toBeFalsy();
			});

			it("should reject missing target", async () => {
				expect(isCriterion({ pipe: [], path: [] })).toBeFalsy();
			});

			it("should reject missing pipe", async () => {
				expect(isCriterion({ target: "name", path: [] })).toBeFalsy();
			});

			it("should reject missing path", async () => {
				expect(isCriterion({ target: "name", pipe: [] })).toBeFalsy();
			});

			it("should reject non-string target", async () => {
				expect(isCriterion({ target: 123, pipe: [], path: [] })).toBeFalsy();
			});

			it("should reject non-array pipe", async () => {
				expect(isCriterion({ target: "name", pipe: "year", path: [] })).toBeFalsy();
			});

			it("should reject non-array path", async () => {
				expect(isCriterion({ target: "name", pipe: [], path: "address" })).toBeFalsy();
			});

			it("should reject unexpected properties", async () => {
				expect(isCriterion({ target: "name", pipe: [], path: [], extra: "value" })).toBeFalsy();
			});

		});

	});

	describe("isOperator", () => {

		describe("valid operators", () => {

			it("should accept comparison operators", async () => {
				expect(isOperator("<")).toBeTruthy();
				expect(isOperator(">")).toBeTruthy();
				expect(isOperator("<=")).toBeTruthy();
				expect(isOperator(">=")).toBeTruthy();
			});

			it("should accept matching operators", async () => {
				expect(isOperator("~")).toBeTruthy();
				expect(isOperator("?")).toBeTruthy();
				expect(isOperator("!")).toBeTruthy();
			});

			it("should accept ordering operators", async () => {
				expect(isOperator("*")).toBeTruthy();
				expect(isOperator("^")).toBeTruthy();
			});

			it("should accept paging operators", async () => {
				expect(isOperator("@")).toBeTruthy();
				expect(isOperator("#")).toBeTruthy();
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

			it("should accept minimal transform", async () => {
				expect(isTransform({ name: "count" })).toBeTruthy();
			});

			it("should accept transform with aggregate flag", async () => {
				expect(isTransform({ name: "sum", aggregate: true })).toBeTruthy();
				expect(isTransform({ name: "abs", aggregate: false })).toBeTruthy();
			});

			it("should accept transform with datatype", async () => {
				expect(isTransform({ name: "count", datatype: "number" })).toBeTruthy();
				expect(isTransform({ name: "upper", datatype: "string" })).toBeTruthy();
			});

			it("should accept complete transform", async () => {
				expect(isTransform({ name: "avg", aggregate: true, datatype: "number" })).toBeTruthy();
			});

		});

		describe("invalid transforms", () => {

			it("should reject non-objects", async () => {
				expect(isTransform(null)).toBeFalsy();
				expect(isTransform(undefined)).toBeFalsy();
				expect(isTransform("count")).toBeFalsy();
				expect(isTransform(123)).toBeFalsy();
			});

			it("should reject missing name", async () => {
				expect(isTransform({})).toBeFalsy();
				expect(isTransform({ aggregate: true })).toBeFalsy();
			});

			it("should reject non-string name", async () => {
				expect(isTransform({ name: 123 })).toBeFalsy();
				expect(isTransform({ name: null })).toBeFalsy();
			});

			it("should reject non-boolean aggregate", async () => {
				expect(isTransform({ name: "sum", aggregate: "true" })).toBeFalsy();
				expect(isTransform({ name: "sum", aggregate: 1 })).toBeFalsy();
			});

			it("should reject non-string datatype", async () => {
				expect(isTransform({ name: "count", datatype: 123 })).toBeFalsy();
				expect(isTransform({ name: "count", datatype: true })).toBeFalsy();
			});

		});

	});

});

describe("codecs", () => {

	describe("encodeQuery()", () => {

		describe("base option", () => {

			it("should accept absolute hierarchical IRI base", async () => {
				const query = { id: "https://example.com/products/42" };

				expect(() => encodeQuery(query, { mode: "json", base: "https://example.com/" })).not.toThrow();
			});

			it("should reject relative IRI base", async () => {
				const query = { id: "/products/42" };

				expect(() => encodeQuery(query, { mode: "json", base: "/relative/path" })).toThrow(TypeError);
			});

			it("should accept path-absolute IRI base", async () => {
				const query = { id: "app:/products/42" } as Query;

				const encoded = encodeQuery(query, { mode: "json", base: defaultBase });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "/products/42" })));
			});

			it("should internalize absolute IRI to root-relative in json format", async () => {
				const query = { id: "https://example.com/products/42" } as Query;

				const encoded = encodeQuery(query, { mode: "json", base: "https://example.com/" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "/products/42" })));
			});

			it("should internalize absolute IRI to root-relative in base64 format", async () => {
				const query = { id: "https://example.com/products/42" } as Query;

				const encoded = encodeQuery(query, { mode: "base64", base: "https://example.com/" });

				expect(decodeQuery(encoded, { base: "https://example.com/" })).toEqual(query);
			});

			it("should internalize absolute IRI to root-relative in form format", async () => {
				const query = { id: "https://example.com/products/42" } as Query;

				const encoded = encodeQuery(query, { mode: "form", base: "https://example.com/" });

				expect(encoded).toBe("id=%22%2Fproducts%2F42%22");
			});

			it("should preserve absolute IRI with different origin", async () => {
				const query = { id: "https://other.com/products/42" } as Query;

				const encoded = encodeQuery(query, { mode: "json", base: "https://example.com/" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "https://other.com/products/42" })));
			});

			it("should internalize IRIs recursively in nested structures", async () => {
				const query = {
					id: "https://example.com/products/42",
					vendor: { id: "https://example.com/vendors/acme", name: "" }
				} as Query;

				const encoded = encodeQuery(query, { mode: "json", base: "https://example.com/" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify({
					id: "/products/42",
					vendor: { id: "/vendors/acme", name: "" }
				})));
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const query = { id: "app:/products/42" } as Query;
			const encoded = encodeQuery(query, { mode: "json" });

			expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "/products/42" })));
		});

		describe("json format", () => {

			describe("basic queries", () => {

				it("should encode empty query", async () => {
					const query = {} as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode query with string property", async () => {
					const query = { name: "" } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode query with number property", async () => {
					const query = { price: 0 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode query with boolean property", async () => {
					const query = { available: true } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode query with multiple properties", async () => {
					const query = { id: "", name: "", price: 0 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

			});

			describe("nested queries", () => {

				it("should encode query with nested resource", async () => {
					const query = {
						id: "",
						vendor: { id: "", name: "" }
					} as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode query with deeply nested resource", async () => {
					const query = {
						order: {
							customer: {
								address: { city: "" }
							}
						}
					} as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

			});

			describe("collection queries", () => {

				it("should encode query with singleton array collection", async () => {
					const query = {
						items: [{ id: "", name: "" }]
					} as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode query with singleton array", async () => {
					const query = {
						items: [{}]
					} as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

			});

			describe("constraint keys", () => {

				it("should encode less than constraint", async () => {
					const query = { "<price": 100 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode less than or equal constraint", async () => {
					const query = { "<=price": 100 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode greater than constraint", async () => {
					const query = { ">price": 50 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode greater than or equal constraint", async () => {
					const query = { ">=price": 50 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode range constraints", async () => {
					const query = { ">=price": 50, "<=price": 150 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode stemmed word search constraint", async () => {
					const query = { "~name": "widget" } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode disjunctive matching constraint with array", async () => {
					const query = { "?category": ["electronics", "home"] } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode disjunctive matching constraint with null", async () => {
					const query = { "?vendor": null } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode conjunctive matching constraint", async () => {
					const query = { "!tags": ["featured", "sale"] } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode focus ordering constraint", async () => {
					const query = { "*category": ["featured", "popular"] } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode sort ordering constraint with number", async () => {
					const query = { "^price": 1 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode sort ordering constraint with negative number", async () => {
					const query = { "^name": -2 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode sort ordering constraint with string", async () => {
					const query = { "^price": "asc" } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode pagination offset", async () => {
					const query = { "@": 10 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode pagination limit", async () => {
					const query = { "#": 25 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode pagination offset and limit", async () => {
					const query = { "@": 0, "#": 25 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

			});

			describe("computed expressions", () => {

				it("should encode named expression", async () => {
					const query = { "vendorName=vendor.name": "" } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode transform expression", async () => {
					const query = { "releaseYear=year:releaseDate": 0 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode aggregate expression", async () => {
					const query = { "total=count:": 0 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode pipeline expression", async () => {
					const query = { "avgPrice=round:avg:price": 0 } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

			});

			describe("localized content", () => {

				it("should encode dictionary with wildcard", async () => {
					const query = { name: { "*": "" } } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode dictionary with specific languages", async () => {
					const query = { name: { "en": "", "fr": "" } } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode multi-valued dictionary", async () => {
					const query = { keywords: { "en": [""], "fr": [""] } } as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

			});

			describe("complex queries", () => {

				it("should encode full collection query with constraints", async () => {
					const query = {
						items: [{
							id: "",
							name: "",
							price: 0,
							vendor: { id: "", name: "" },
							">=price": 50,
							"<=price": 150,
							"~name": "widget",
							"?category": ["electronics", "home"],
							"^price": 1,
							"^name": -2,
							"@": 0,
							"#": 25
						}]
					} as unknown as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

				it("should encode faceted search query", async () => {
					const query = {
						items: [{
							"category=sample:category": "",
							"count=count:": 0,
							"^count": "desc"
						}]
					} as Query;
					const encoded = encodeQuery(query, { mode: "json" });

					expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
				});

			});

			describe("default format", () => {

				it("should use json format when no format specified", async () => {
					const query = { name: "" } as Query;
					const encodedDefault = encodeQuery(query);
					const encodedExplicit = encodeQuery(query, { mode: "json" });

					expect(encodedDefault).toBe(encodedExplicit);
				});

			});

		});

		describe("base64 format", () => {

			describe("basic queries", () => {

				it("should encode empty query", async () => {
					const query = {} as Query;
					const encoded = encodeQuery(query, { mode: "base64" });
					const decoded = JSON.parse(decodeBase64(encoded));

					expect(decoded).toEqual(query);
				});

				it("should encode query with properties", async () => {
					const query = { id: "", name: "", price: 0 } as Query;
					const encoded = encodeQuery(query, { mode: "base64" });
					const decoded = JSON.parse(decodeBase64(encoded));

					expect(decoded).toEqual(query);
				});

				it("should produce URL-safe output", async () => {
					const query = { name: "" } as Query;
					const encoded = encodeQuery(query, { mode: "base64" });

					// Base64 should not contain URL-unsafe characters needing encoding
					expect(encoded).toBe(encodeURIComponent(encoded));
				});

			});

			describe("nested queries", () => {

				it("should encode nested resources", async () => {
					const query = {
						order: {
							customer: {
								address: { city: "" }
							}
						}
					} as Query;
					const encoded = encodeQuery(query, { mode: "base64" });
					const decoded = JSON.parse(decodeBase64(encoded));

					expect(decoded).toEqual(query);
				});

			});

			describe("constraint keys", () => {

				it("should preserve constraint key prefixes", async () => {
					const query = {
						">=price": 50,
						"<=price": 150,
						"~name": "widget",
						"?category": ["a", "b"],
						"^price": 1
					};
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const encoded = encodeQuery(query as any, { mode: "base64" });
					const decoded = JSON.parse(decodeBase64(encoded));

					expect(decoded).toEqual(query);
				});

			});

			describe("special characters", () => {

				it("should handle unicode in values", async () => {
					const query = { "~name": "日本語" } as Query;
					const encoded = encodeQuery(query, { mode: "base64" });
					const decoded = JSON.parse(decodeBase64(encoded));

					expect(decoded).toEqual(query);
				});

			});

		});

		describe("form format", () => {

			describe("basic constraints", () => {

				it("should encode empty query", async () => {
					const query = {} as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					expect(encoded).toBe("");
				});

				it("should encode single constraint", async () => {
					const query = { "?name": "widget" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?name="widget"
					expect(encoded).toBe("%3Fname=%22widget%22");
				});

				it("should encode multiple constraints", async () => {
					const query = { "?name": "widget", ">=price": 100 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?name="widget"&>=price=100
					expect(encoded).toBe("%3Fname=%22widget%22&%3E%3Dprice=100");
				});

			});

			describe("comparison operators", () => {

				it("should encode less than", async () => {
					const query = { "<price": 100 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// <price=100
					expect(encoded).toBe("%3Cprice=100");
				});

				it("should encode less than or equal", async () => {
					const query = { "<=price": 100 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// <=price=100
					expect(encoded).toBe("%3C%3Dprice=100");
				});

				it("should encode greater than", async () => {
					const query = { ">price": 50 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >price=50
					expect(encoded).toBe("%3Eprice=50");
				});

				it("should encode greater than or equal", async () => {
					const query = { ">=price": 50 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=price=50
					expect(encoded).toBe("%3E%3Dprice=50");
				});

			});

			describe("search operator", () => {

				it("should encode stemmed word search", async () => {
					const query = { "~name": "widget" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="widget"  (~ not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode search with spaces", async () => {
					const query = { "~name": "red widget" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="red widget"
					expect(encoded).toBe("~name=%22red%20widget%22");
				});

			});

			describe("disjunctive matching", () => {

				it("should encode single value", async () => {
					const query = { "?category": "electronics" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?category="electronics"
					expect(encoded).toBe("%3Fcategory=%22electronics%22");
				});

				it("should encode multiple values as repeated parameters", async () => {
					const query = { "?category": ["electronics", "home"] } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?category="electronics"&?category="home"
					expect(encoded).toBe("%3Fcategory=%22electronics%22&%3Fcategory=%22home%22");
				});

				it("should encode null option for undefined matching", async () => {
					const query = { "?vendor": null } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?vendor=null
					expect(encoded).toBe("%3Fvendor=null");
				});

			});

			describe("conjunctive matching", () => {

				it("should encode all-match constraint", async () => {
					const query = { "!tags": ["featured", "sale"] } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// !tags="featured"&!tags="sale"  (! not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("!tags=%22featured%22&!tags=%22sale%22");
				});

			});

			describe("focus operator", () => {

				it("should encode single focus value", async () => {
					const query = { "*category": "electronics" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// *category="electronics"
					expect(encoded).toBe("*category=%22electronics%22");
				});

				it("should encode multiple focus values", async () => {
					const query = { "*category": ["electronics", "home"] } as unknown as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// *category="electronics"&*category="home"
					expect(encoded).toBe("*category=%22electronics%22&*category=%22home%22");
				});

			});

			describe("ordering operators", () => {

				it("should encode ascending sort", async () => {
					const query = { "^price": 1 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ^price=1
					expect(encoded).toBe("%5Eprice=1");
				});

				it("should encode descending sort", async () => {
					const query = { "^price": -1 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ^price=-1
					expect(encoded).toBe("%5Eprice=-1");
				});

				it("should encode multiple sort priorities", async () => {
					const query = { "^price": 1, "^name": -2 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ^price=1&^name=-2
					expect(encoded).toBe("%5Eprice=1&%5Ename=-2");
				});

			});

			describe("pagination", () => {

				it("should encode offset", async () => {
					const query = { "@": 10 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// @=10
					expect(encoded).toBe("%40=10");
				});

				it("should encode limit", async () => {
					const query = { "#": 25 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// #=25
					expect(encoded).toBe("%23=25");
				});

				it("should encode offset and limit together", async () => {
					const query = { "@": 0, "#": 25 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// @=0&#=25
					expect(encoded).toBe("%40=0&%23=25");
				});

			});

			describe("expression paths", () => {

				it("should encode dotted property paths", async () => {
					const query = { ">=vendor.rating": 4 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=vendor.rating=4
					expect(encoded).toBe("%3E%3Dvendor.rating=4");
				});

			});

			describe("expression transforms", () => {

				it("should encode constraint with single transform", async () => {
					const query = { ">=year:releaseDate": 2020 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=year:releaseDate=2020
					expect(encoded).toBe("%3E%3Dyear%3AreleaseDate=2020");
				});

				it("should encode constraint with transform pipeline", async () => {
					const query = { ">=round:avg:items.price": 100 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=round:avg:items.price=100
					expect(encoded).toBe("%3E%3Dround%3Aavg%3Aitems.price=100");
				});

				it("should encode disjunction with transform", async () => {
					// @ts-expect-error Testing array values in filtering constraints
					const query: Query = { "?month:releaseDate": [1, 6, 12] };
					const encoded = encodeQuery(query, { mode: "form" });

					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					expect(encoded).toBe("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12");
				});

				it("should encode ordering with transform", async () => {
					const query = { "^year:releaseDate": 1 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ^year:releaseDate=1
					expect(encoded).toBe("%5Eyear%3AreleaseDate=1");
				});

			});

			describe("boolean values", () => {

				it("should encode true value", async () => {
					const query = { "?available": true } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?available=true
					expect(encoded).toBe("%3Favailable=true");
				});

				it("should encode false value", async () => {
					const query = { "?available": false } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?available=false
					expect(encoded).toBe("%3Favailable=false");
				});

			});

			describe("numeric values", () => {

				it("should encode zero", async () => {
					const query = { "@": 0 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// @=0
					expect(encoded).toBe("%40=0");
				});

				it("should encode positive integer", async () => {
					const query = { ">=price": 100 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=price=100
					expect(encoded).toBe("%3E%3Dprice=100");
				});

				it("should encode negative integer", async () => {
					const query = { ">=balance": -50 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=balance=-50
					expect(encoded).toBe("%3E%3Dbalance=-50");
				});

				it("should encode decimal", async () => {
					const query = { ">=price": 99.99 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=price=99.99
					expect(encoded).toBe("%3E%3Dprice=99.99");
				});

				it("should encode scientific notation", async () => {
					const query = { ">=count": 1.5e21 } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// >=count=1.5e+21  (+ encoded as %2B to avoid space interpretation)
					expect(encoded).toBe("%3E%3Dcount=1.5e%2B21");
				});

			});

			describe("string values", () => {

				it("should encode empty string", async () => {
					const query = { "~name": "" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name=""
					expect(encoded).toBe("~name=%22%22");
				});

				it("should encode simple string", async () => {
					const query = { "~name": "widget" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="widget"
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode string with spaces", async () => {
					const query = { "~name": "my widget" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="my widget"
					expect(encoded).toBe("~name=%22my%20widget%22");
				});

				it("should encode string with quotes", async () => {
					const query = { "~name": "say \"hello\"" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="say \"hello\""  (inner quotes escaped as \")
					expect(encoded).toBe("~name=%22say%20%5C%22hello%5C%22%22");
				});

				it("should encode unicode characters", async () => {
					const query = { "~name": "café" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="café"  (é encoded as UTF-8 bytes %C3%A9)
					expect(encoded).toBe("~name=%22caf%C3%A9%22");
				});

				it("should encode newlines", async () => {
					const query = { "~description": "line1\nline2" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~description="line1\nline2"
					expect(encoded).toBe("~description=%22line1%0Aline2%22");
				});

				it("should encode tabs", async () => {
					const query = { "~description": "col1\tcol2" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~description="col1\tcol2"
					expect(encoded).toBe("~description=%22col1%09col2%22");
				});

				it("should encode ampersand", async () => {
					const query = { "~name": "foo&bar" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="foo&bar"  (& encoded to avoid parameter separator)
					expect(encoded).toBe("~name=%22foo%26bar%22");
				});

				it("should encode equals sign", async () => {
					const query = { "~name": "a=b" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="a=b"  (= encoded to avoid key/value separator)
					expect(encoded).toBe("~name=%22a%3Db%22");
				});

				it("should encode plus sign", async () => {
					const query = { "~name": "a+b" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="a+b"  (+ encoded to avoid space interpretation)
					expect(encoded).toBe("~name=%22a%2Bb%22");
				});

				it("should encode percent sign", async () => {
					const query = { "~name": "100%" } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ~name="100%"  (% encoded to avoid escape sequence)
					expect(encoded).toBe("~name=%22100%25%22");
				});

			});

			describe("localized content", () => {

				it("should encode single tagged string", async () => {
					const query = { "?name": { "en": "Widget" } } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?name="Widget"@en
					expect(encoded).toBe("%3Fname=%22Widget%22%40en");
				});

				it("should encode multiple tagged strings", async () => {
					const query = { "?name": { "en": "Widget", "fr": "Gadget" } } as Query;
					const encoded = encodeQuery(query, { mode: "form" });

					// ?name="Widget"@en&?name="Gadget"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr");
				});

				it("should encode dictionary with multi-value tags", async () => {
					// @ts-expect-error Testing multi-value language maps in filtering constraints
					const query: Query = { "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } };
					const encoded = encodeQuery(query, { mode: "form" });

					// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr");
				});

			});

		});

	});

	describe("decodeQuery()", () => {

		describe("base option", () => {

			it("should accept absolute hierarchical IRI base", async () => {
				const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

				expect(() => decodeQuery(encoded, { base: "https://example.com/" })).not.toThrow();
			});

			it("should reject relative IRI base", async () => {
				const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

				expect(() => decodeQuery(encoded, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should accept path-absolute IRI base", async () => {
				const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

				expect(decodeQuery(encoded, { base: defaultBase }))
					.toEqual({ id: "app:/products/42" } as Query);
			});

			it("should resolve root-relative IRI to absolute in json format", async () => {
				const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

				const decoded = decodeQuery(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ id: "https://example.com/products/42" } as Query);
			});

			it("should resolve root-relative IRI to absolute in base64 format", async () => {
				const query = { id: "/products/42" } as Query;
				const encoded = encodeQuery(query, { mode: "base64" });

				const decoded = decodeQuery(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ id: "https://example.com/products/42" } as Query);
			});

			it("should resolve root-relative IRI to absolute in form format", async () => {
				const encoded = "id=%22%2Fproducts%2F42%22";

				const decoded = decodeQuery(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ "?id": "https://example.com/products/42" } as Query);
			});

			it("should preserve absolute IRI", async () => {
				const encoded = encodeURIComponent(JSON.stringify({ id: "https://other.com/products/42" }));

				const decoded = decodeQuery(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ id: "https://other.com/products/42" } as Query);
			});

			it("should preserve non-root-relative IRIs and other strings", async () => {
				const encoded = encodeURIComponent(JSON.stringify({
					relative: "../products/42",
					plain: "Widget"
				}));

				const decoded = decodeQuery(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({
					relative: "../products/42",
					plain: "Widget"
				});
			});

			it("should resolve IRIs recursively in nested structures", async () => {
				const encoded = encodeURIComponent(JSON.stringify({
					id: "/products/42",
					vendor: { id: "/vendors/acme", name: "" }
				}));

				const decoded = decodeQuery(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({
					id: "https://example.com/products/42",
					vendor: { id: "https://example.com/vendors/acme", name: "" }
				});
			});

		});

		it("should use defaultBase when base option is omitted", async () => {
			const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

			expect(decodeQuery(encoded))
				.toEqual({ id: "app:/products/42" } as Query);
		});

		describe("format auto-detection", () => {

			it("should detect and decode JSON format", async () => {
				const query = { name: "", price: 0 } as Query;
				const encoded = encodeQuery(query, { mode: "json" });
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

			it("should detect and decode base64 format", async () => {
				const query = { name: "", price: 0 } as Query;
				const encoded = encodeQuery(query, { mode: "base64" });
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

			it("should detect and decode form format", async () => {
				const query = { "~name": "widget", ">=price": 50 } as Query;
				const encoded = encodeQuery(query, { mode: "form" });
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

		});

		describe("json format decoding", () => {

			it("should decode empty query", async () => {
				const encoded = encodeURIComponent("{}");
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual({});
			});

			it("should decode query with properties", async () => {
				const query = { id: "", name: "", price: 0, available: true } as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode nested queries", async () => {
				const query = {
					vendor: { id: "", name: "" }
				} as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode collection queries", async () => {
				const query = {
					items: [{ id: "", name: "" }]
				} as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQuery(encoded);

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
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode computed expressions", async () => {
				const query = {
					"vendorName=vendor.name": "",
					"total=count:": 0
				} as Query;
				const encoded = encodeURIComponent(JSON.stringify(query));
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

		});

		describe("base64 format decoding", () => {

			it("should decode empty query", async () => {
				const encoded = btoa("{}");
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual({});
			});

			it("should decode query with properties", async () => {
				const query = { id: "", name: "", price: 0 } as Query;
				const encoded = btoa(JSON.stringify(query));
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode nested queries", async () => {
				const query = {
					order: { customer: { address: { city: "" } } }
				} as Query;
				const encoded = btoa(JSON.stringify(query));
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			});

			it("should decode unicode content", async () => {
				const query = { "~name": "日本語" } as Query;
				// Use encodeQuery to produce proper UTF-8 base64 encoding
				const encoded = encodeQuery(query, { mode: "base64" });
				const decoded = decodeQuery(encoded);

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
					const decoded = decodeQuery("name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should decode multiple parameters", async () => {
					const decoded = decodeQuery("name=test&price=100");

					expect(decoded).toHaveProperty("?name");
					expect(decoded).toHaveProperty("?price");
				});

			});

			describe("comparison operators", () => {

				it("should decode less than postfix encoded", async () => {
					// price<100
					const decoded = decodeQuery("price%3C100");

					expect(decoded).toHaveProperty("<price", 100);
				});

				it("should decode less than postfix unencoded", async () => {
					const decoded = decodeQuery("price<100");

					expect(decoded).toHaveProperty("<price", 100);
				});

				it("should decode less than or equal postfix encoded", async () => {
					// price<=100
					const decoded = decodeQuery("price%3C%3D100");

					expect(decoded).toHaveProperty("<=price", 100);
				});

				it("should decode less than or equal postfix unencoded", async () => {
					const decoded = decodeQuery("price<=100");

					expect(decoded).toHaveProperty("<=price", 100);
				});

				it("should decode greater than postfix encoded", async () => {
					// price>50
					const decoded = decodeQuery("price%3E50");

					expect(decoded).toHaveProperty(">price", 50);
				});

				it("should decode greater than postfix unencoded", async () => {
					const decoded = decodeQuery("price>50");

					expect(decoded).toHaveProperty(">price", 50);
				});

				it("should decode greater than or equal postfix encoded", async () => {
					// price>=50
					const decoded = decodeQuery("price%3E%3D50");

					expect(decoded).toHaveProperty(">=price", 50);
				});

				it("should decode greater than or equal postfix unencoded", async () => {
					const decoded = decodeQuery("price>=50");

					expect(decoded).toHaveProperty(">=price", 50);
				});

				it("should decode prefix comparison operators", async () => {
					// >=price=50 (canonical prefix form requires encoding due to = ambiguity)
					const decoded = decodeQuery("%3E%3Dprice=50");

					expect(decoded).toHaveProperty(">=price", 50);
				});

			});

			describe("search operator", () => {

				it("should decode stemmed word search encoded", async () => {
					// ~name=widget
					const decoded = decodeQuery("%7Ename=widget");

					expect(decoded).toHaveProperty("~name", "widget");
				});

				it("should decode stemmed word search unencoded", async () => {
					// ~ is unreserved in RFC 3986, no encoding needed
					const decoded = decodeQuery("~name=widget");

					expect(decoded).toHaveProperty("~name", "widget");
				});

				it("should decode spaces as words", async () => {
					const decoded = decodeQuery("%7Ename=red%20widget");

					expect(decoded).toHaveProperty("~name", "red widget");
				});

				it("should decode plus as space", async () => {
					const decoded = decodeQuery("%7Ename=red+widget");

					expect(decoded).toHaveProperty("~name", "red widget");
				});

			});

			describe("disjunctive matching", () => {

				it("should decode single value as array", async () => {
					const decoded = decodeQuery("category=electronics");

					expect(decoded).toHaveProperty("?category");
				});

				it("should decode repeated parameters as array", async () => {
					const decoded = decodeQuery("category=electronics&category=home") as Record<string, unknown>;

					expect(decoded["?category"]).toEqual(["electronics", "home"]);
				});

				it("should decode explicit prefix operator", async () => {
					const decoded = decodeQuery("%3Fcategory=electronics");

					expect(decoded).toHaveProperty("?category");
				});

				it("should decode null for undefined matching", async () => {
					const decoded = decodeQuery("%3Fvendor=null") as Record<string, unknown>;

					expect(decoded["?vendor"]).toBe(null);
				});

			});

			describe("conjunctive matching", () => {

				it("should decode all-match constraint encoded", async () => {
					// !tags=featured&!tags=sale
					const decoded = decodeQuery("%21tags=featured&%21tags=sale") as Record<string, unknown>;

					expect(decoded["!tags"]).toEqual(["featured", "sale"]);
				});

				it("should decode all-match constraint unencoded", async () => {
					// ! is unreserved in RFC 3986, no encoding needed
					const decoded = decodeQuery("!tags=featured&!tags=sale") as Record<string, unknown>;

					expect(decoded["!tags"]).toEqual(["featured", "sale"]);
				});

				it("should decode explicit prefix operator encoded", async () => {
					const decoded = decodeQuery("%21tags=premium");

					expect(decoded).toHaveProperty("!tags");
				});

				it("should decode explicit prefix operator unencoded", async () => {
					const decoded = decodeQuery("!tags=premium");

					expect(decoded).toHaveProperty("!tags");
				});

			});

			describe("focus ordering", () => {

				it("should decode focus constraint with single value encoded", async () => {
					// *category=featured
					const decoded = decodeQuery("*category=featured");

					expect(decoded).toHaveProperty("*category");
				});

				it("should decode focus constraint with multiple values", async () => {
					// *category=featured&*category=popular
					const decoded = decodeQuery("*category=featured&*category=popular") as Record<string, unknown>;

					expect(decoded["*category"]).toEqual(["featured", "popular"]);
				});

			});

			describe("ordering operators", () => {

				it("should decode ascending sort encoded", async () => {
					// ^price=asc (shorthand string value)
					const decoded = decodeQuery("%5Eprice=asc");

					expect(decoded).toHaveProperty("^price", "asc");
				});

				it("should decode ascending sort unencoded", async () => {
					const decoded = decodeQuery("^price=asc");

					expect(decoded).toHaveProperty("^price", "asc");
				});

				it("should decode descending sort encoded", async () => {
					// ^price=desc (shorthand string value)
					const decoded = decodeQuery("%5Eprice=desc");

					expect(decoded).toHaveProperty("^price", "desc");
				});

				it("should decode descending sort unencoded", async () => {
					const decoded = decodeQuery("^price=desc");

					expect(decoded).toHaveProperty("^price", "desc");
				});

				it("should decode asc keyword", async () => {
					const decoded = decodeQuery("^price=asc");

					expect(decoded).toHaveProperty("^price", "asc");
				});

				it("should decode desc keyword", async () => {
					const decoded = decodeQuery("^price=desc");

					expect(decoded).toHaveProperty("^price", "desc");
				});

				it("should decode numeric priority encoded", async () => {
					// ^price=1 (canonical form)
					const decoded = decodeQuery("%5Eprice=1");

					expect(decoded).toHaveProperty("^price", 1);
				});

				it("should decode numeric priority unencoded", async () => {
					const decoded = decodeQuery("^price=1");

					expect(decoded).toHaveProperty("^price", 1);
				});

				it("should decode negative priority encoded", async () => {
					// ^price=-2 (canonical form)
					const decoded = decodeQuery("%5Eprice=-2");

					expect(decoded).toHaveProperty("^price", -2);
				});

				it("should decode negative priority unencoded", async () => {
					const decoded = decodeQuery("^price=-2");

					expect(decoded).toHaveProperty("^price", -2);
				});

			});

			describe("pagination", () => {

				it("should decode offset encoded", async () => {
					// @=10
					const decoded = decodeQuery("%40=10");

					expect(decoded).toHaveProperty("@", 10);
				});

				it("should decode offset unencoded", async () => {
					const decoded = decodeQuery("@=10");

					expect(decoded).toHaveProperty("@", 10);
				});

				it("should decode limit encoded", async () => {
					// #=25
					const decoded = decodeQuery("%23=25");

					expect(decoded).toHaveProperty("#", 25);
				});

				it("should decode limit unencoded", async () => {
					// # must be encoded in URLs (fragment delimiter) but decoder should handle if present
					const decoded = decodeQuery("#=25");

					expect(decoded).toHaveProperty("#", 25);
				});

				it("should decode zero offset encoded", async () => {
					const decoded = decodeQuery("%40=0");

					expect(decoded).toHaveProperty("@", 0);
				});

				it("should decode zero offset unencoded", async () => {
					const decoded = decodeQuery("@=0");

					expect(decoded).toHaveProperty("@", 0);
				});

			});

			describe("value parsing", () => {

				it("should parse numeric strings as numbers", async () => {
					const decoded = decodeQuery("%3E%3Dprice=100") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(100);
					expect(typeof decoded[">=price"]).toBe("number");
				});

				it("should parse decimal numbers", async () => {
					const decoded = decodeQuery("%3E%3Dprice=99.99") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(99.99);
				});

				it("should parse negative numbers", async () => {
					const decoded = decodeQuery("%5Eprice=-1") as Record<string, unknown>;

					expect(decoded["^price"]).toBe(-1);
				});

				it("should parse boolean true", async () => {
					const decoded = decodeQuery("available=true") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(true);
				});

				it("should parse boolean false", async () => {
					const decoded = decodeQuery("available=false") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(false);
				});

				it("should preserve non-numeric strings", async () => {
					const decoded = decodeQuery("%7Ename=widget") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("widget");
					expect(typeof decoded["~name"]).toBe("string");
				});

				it("should decode percent-encoded special characters", async () => {
					const decoded = decodeQuery("%7Ename=foo%26bar") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("foo&bar");
				});

				it("should decode percent-encoded unicode", async () => {
					const decoded = decodeQuery("%7Ename=caf%C3%A9") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("café");
				});

				it("should decode empty value", async () => {
					const decoded = decodeQuery("~name=") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("");
				});

				it("should decode equals in value", async () => {
					// ~name=a=b (= in value must be encoded)
					const decoded = decodeQuery("~name=a%3Db") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("a=b");
				});

				it("should parse null", async () => {
					const decoded = decodeQuery("value=null") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(null);
				});

				it("should parse scientific notation", async () => {
					const decoded = decodeQuery("value=1e10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1e10);
				});

				it("should parse negative exponent", async () => {
					const decoded = decodeQuery("value=1.5e-10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1.5e-10);
				});

				it("should parse quoted string preserving type", async () => {
					// "123" should remain string, not convert to number
					const decoded = decodeQuery("value=%22123%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("123");
					expect(typeof decoded["?value"]).toBe("string");
				});

				it("should parse quoted null as string", async () => {
					const decoded = decodeQuery("value=%22null%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("null");
					expect(typeof decoded["?value"]).toBe("string");
				});

				it("should decode JSON escape sequences", async () => {
					// "a\nb" encoded
					const decoded = decodeQuery("value=%22a%5Cnb%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\nb");
				});

				it("should decode escaped quotes in strings", async () => {
					// "a\"b" encoded
					const decoded = decodeQuery("value=%22a%5C%22b%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\"b");
				});

				it("should decode unicode escapes", async () => {
					// "\u0041" = "A"
					const decoded = decodeQuery("value=%22%5Cu0041%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("A");
				});

				it("should decode localized string", async () => {
					// "Hello"@en
					const decoded = decodeQuery("label=%22Hello%22%40en") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual(["Hello", "en"]);
				});

				it("should decode localized string with region", async () => {
					// "Colour"@en-GB
					const decoded = decodeQuery("label=%22Colour%22%40en-GB") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual(["Colour", "en-GB"]);
				});

			});

			describe("expression paths", () => {

				it("should decode unencoded dots in paths", async () => {
					// >=vendor.rating=4 (dot unreserved, no encoding needed)
					const decoded = decodeQuery("%3E%3Dvendor.rating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

				it("should decode percent-encoded dots in paths", async () => {
					// >=vendor.rating=4 (dot encoded as %2E)
					const decoded = decodeQuery("%3E%3Dvendor%2Erating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

			});

			describe("unicode identifiers", () => {

				it("should decode identifier with unicode letter (Greek)", async () => {
					// πrice=100 (Greek pi as first character)
					const decoded = decodeQuery("%CF%80rice=100");

					expect(decoded).toHaveProperty("?πrice", 100);
				});

				it("should decode identifier with unicode letter (Cyrillic)", async () => {
					// цена=100 (Russian "price")
					const decoded = decodeQuery("%D1%86%D0%B5%D0%BD%D0%B0=100");

					expect(decoded).toHaveProperty("?цена", 100);
				});

				it("should decode identifier with unicode letter (CJK)", async () => {
					// 价格=100 (Chinese "price")
					const decoded = decodeQuery("%E4%BB%B7%E6%A0%BC=100");

					expect(decoded).toHaveProperty("?价格", 100);
				});

				it("should decode identifier with unicode continuation characters", async () => {
					// na\u0301me=test (combining acute accent in identifier)
					const decoded = decodeQuery("na%CC%81me=test");

					expect(decoded).toHaveProperty("?na\u0301me", "test");
				});

				it("should decode path with unicode identifiers", async () => {
					// >=производитель.рейтинг=4 (Russian vendor.rating)
					const decoded = decodeQuery("%3E%3D%D0%BF%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D0%B8%D1%82%D0%B5%D0%BB%D1%8C.%D1%80%D0%B5%D0%B9%D1%82%D0%B8%D0%BD%D0%B3=4");

					expect(decoded).toHaveProperty(">=производитель.рейтинг", 4);
				});

			});

			describe("expression transforms", () => {

				it("should decode constraint with single transform", async () => {
					// >=year:releaseDate=2020
					const decoded = decodeQuery("%3E%3Dyear%3AreleaseDate=2020");

					expect(decoded).toHaveProperty(">=year:releaseDate", 2020);
				});

				it("should decode constraint with transform pipeline", async () => {
					// >=round:avg:items.price=100
					const decoded = decodeQuery("%3E%3Dround%3Aavg%3Aitems.price=100");

					expect(decoded).toHaveProperty(">=round:avg:items.price", 100);
				});

				it("should decode disjunction with transform", async () => {
					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					const decoded = decodeQuery("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12") as Record<string, unknown>;

					expect(decoded["?month:releaseDate"]).toEqual([1, 6, 12]);
				});

				it("should decode ordering with transform", async () => {
					// ^year:releaseDate=1
					const decoded = decodeQuery("%5Eyear%3AreleaseDate=1");

					expect(decoded).toHaveProperty("^year:releaseDate", 1);
				});

			});

			describe("malformed input handling", () => {
				// The decoder is lenient with common URL parsing quirks

				it("should handle empty string", async () => {
					const decoded = decodeQuery("");

					expect(decoded).toEqual({});
				});

				it("should handle parameter without value", async () => {
					const decoded = decodeQuery("name");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle leading ampersand", async () => {
					const decoded = decodeQuery("&name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle trailing ampersand", async () => {
					const decoded = decodeQuery("name=test&");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle multiple ampersands", async () => {
					const decoded = decodeQuery("name=test&&price=100");

					expect(decoded).toHaveProperty("?name");
					expect(decoded).toHaveProperty("?price");
				});

			});

			describe("integration", () => {

				it("should decode complex query with multiple operators", async () => {
					// status=active&status=pending&~name=corp&price>=100&price<=1000&^date=desc&@=0&#=25
					const decoded = decodeQuery(
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
				{ "total=count:": 0 }
			];

			it.each(testQueries.map((q, i) => [i, q] as const))(
				"should roundtrip query %i via json format",
				async (_, query) => {
					const encoded = encodeQuery(query as Query, { mode: "json" });
					const decoded = decodeQuery(encoded);

					expect(decoded).toEqual(query);
				}
			);

			it.each(testQueries.map((q, i) => [i, q] as const))(
				"should roundtrip query %i via base64 format",
				async (_, query) => {
					const encoded = encodeQuery(query as Query, { mode: "base64" });
					const decoded = decodeQuery(encoded);

					expect(decoded).toEqual(query);
				}
			);

		});

		describe("error handling", () => {

			it("should handle malformed JSON gracefully", async () => {
				expect(() => decodeQuery(encodeURIComponent("{invalid"))).toThrow();
			});

			it("should throw on invalid base64 JSON", async () => {
				// Valid base64 but invalid JSON throws with cause
				expect(() => decodeQuery("eyJpbnZhbGlk")).toThrow("invalid query");
			});

			it("should handle truncated percent-encoding", async () => {
				expect(() => decodeQuery("%")).toThrow();
			});

			it("should handle invalid percent-encoding sequence", async () => {
				expect(() => decodeQuery("%ZZ")).toThrow();
			});

			it("should handle incomplete percent-encoding", async () => {
				expect(() => decodeQuery("%2")).toThrow();
			});

		});

	});


	describe("encodeCriterion()", () => {

		describe("projection keys", () => {

			it("should encode simple property", async () => {
				const criterion = { target: "name", pipe: [], path: [] };

				expect(encodeCriterion(criterion)).toBe("name");
			});

			it("should encode aliased property", async () => {
				const criterion = { target: "city", pipe: [], path: ["address"] };

				expect(encodeCriterion(criterion)).toBe("city=address");
			});

			it("should encode aliased property with deep path", async () => {
				const criterion = { target: "city", pipe: [], path: ["customer", "address"] };

				expect(encodeCriterion(criterion)).toBe("city=customer.address");
			});

			it("should encode property with transform", async () => {
				const criterion = { target: "releaseYear", pipe: ["year"], path: ["releaseDate"] };

				expect(encodeCriterion(criterion)).toBe("releaseYear=year:releaseDate");
			});

			it("should encode property with transform pipeline", async () => {
				const criterion = { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] };

				expect(encodeCriterion(criterion)).toBe("avgPrice=round:avg:price");
			});

			it("should encode aggregate without path", async () => {
				const criterion = { target: "total", pipe: ["count"], path: [] };

				expect(encodeCriterion(criterion)).toBe("total=count:");
			});

		});

		describe("constraint keys", () => {

			it("should encode less than constraint", async () => {
				const criterion = { target: "<", pipe: [], path: ["price"] };

				expect(encodeCriterion(criterion)).toBe("<price");
			});

			it("should encode less than or equal constraint", async () => {
				const criterion = { target: "<=", pipe: [], path: ["price"] };

				expect(encodeCriterion(criterion)).toBe("<=price");
			});

			it("should encode greater than constraint", async () => {
				const criterion = { target: ">", pipe: [], path: ["price"] };

				expect(encodeCriterion(criterion)).toBe(">price");
			});

			it("should encode greater than or equal constraint", async () => {
				const criterion = { target: ">=", pipe: [], path: ["price"] };

				expect(encodeCriterion(criterion)).toBe(">=price");
			});

			it("should encode search constraint", async () => {
				const criterion = { target: "~", pipe: [], path: ["name"] };

				expect(encodeCriterion(criterion)).toBe("~name");
			});

			it("should encode disjunctive constraint", async () => {
				const criterion = { target: "?", pipe: [], path: ["category"] };

				expect(encodeCriterion(criterion)).toBe("?category");
			});

			it("should encode conjunctive constraint", async () => {
				const criterion = { target: "!", pipe: [], path: ["tags"] };

				expect(encodeCriterion(criterion)).toBe("!tags");
			});

			it("should encode focus constraint", async () => {
				const criterion = { target: "*", pipe: [], path: ["category"] };

				expect(encodeCriterion(criterion)).toBe("*category");
			});

			it("should encode order constraint", async () => {
				const criterion = { target: "^", pipe: [], path: ["price"] };

				expect(encodeCriterion(criterion)).toBe("^price");
			});

			it("should encode offset constraint", async () => {
				const criterion = { target: "@", pipe: [], path: [] };

				expect(encodeCriterion(criterion)).toBe("@");
			});

			it("should encode limit constraint", async () => {
				const criterion = { target: "#", pipe: [], path: [] };

				expect(encodeCriterion(criterion)).toBe("#");
			});

			it("should encode constraint with path", async () => {
				const criterion = { target: ">=", pipe: [], path: ["vendor", "rating"] };

				expect(encodeCriterion(criterion)).toBe(">=vendor.rating");
			});

			it("should encode constraint with transform", async () => {
				const criterion = { target: ">=", pipe: ["year"], path: ["releaseDate"] };

				expect(encodeCriterion(criterion)).toBe(">=year:releaseDate");
			});

		});

	});

	describe("decodeCriterion()", () => {

		describe("projection keys", () => {

			it("should decode simple property", async () => {
				const expected = { target: "name", pipe: [], path: [] };

				expect(decodeCriterion("name")).toEqual(expected);
			});

			it("should decode aliased property", async () => {
				const expected = { target: "city", pipe: [], path: ["address"] };

				expect(decodeCriterion("city=address")).toEqual(expected);
			});

			it("should decode aliased property with deep path", async () => {
				const expected = { target: "city", pipe: [], path: ["customer", "address"] };

				expect(decodeCriterion("city=customer.address")).toEqual(expected);
			});

			it("should decode property with transform", async () => {
				const expected = { target: "releaseYear", pipe: ["year"], path: ["releaseDate"] };

				expect(decodeCriterion("releaseYear=year:releaseDate")).toEqual(expected);
			});

			it("should decode property with transform pipeline", async () => {
				const expected = { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] };

				expect(decodeCriterion("avgPrice=round:avg:price")).toEqual(expected);
			});

			it("should decode aggregate without path", async () => {
				const expected = { target: "total", pipe: ["count"], path: [] };

				expect(decodeCriterion("total=count:")).toEqual(expected);
			});

		});

		describe("constraint keys", () => {

			it("should decode less than constraint", async () => {
				const expected = { target: "<", pipe: [], path: ["price"] };

				expect(decodeCriterion("<price")).toEqual(expected);
			});

			it("should decode less than or equal constraint", async () => {
				const expected = { target: "<=", pipe: [], path: ["price"] };

				expect(decodeCriterion("<=price")).toEqual(expected);
			});

			it("should decode greater than constraint", async () => {
				const expected = { target: ">", pipe: [], path: ["price"] };

				expect(decodeCriterion(">price")).toEqual(expected);
			});

			it("should decode greater than or equal constraint", async () => {
				const expected = { target: ">=", pipe: [], path: ["price"] };

				expect(decodeCriterion(">=price")).toEqual(expected);
			});

			it("should decode search constraint", async () => {
				const expected = { target: "~", pipe: [], path: ["name"] };

				expect(decodeCriterion("~name")).toEqual(expected);
			});

			it("should decode disjunctive constraint", async () => {
				const expected = { target: "?", pipe: [], path: ["category"] };

				expect(decodeCriterion("?category")).toEqual(expected);
			});

			it("should decode conjunctive constraint", async () => {
				const expected = { target: "!", pipe: [], path: ["tags"] };

				expect(decodeCriterion("!tags")).toEqual(expected);
			});

			it("should decode focus constraint", async () => {
				const expected = { target: "*", pipe: [], path: ["category"] };

				expect(decodeCriterion("*category")).toEqual(expected);
			});

			it("should decode order constraint", async () => {
				const expected = { target: "^", pipe: [], path: ["price"] };

				expect(decodeCriterion("^price")).toEqual(expected);
			});

			it("should decode offset constraint", async () => {
				const expected = { target: "@", pipe: [], path: [] };

				expect(decodeCriterion("@")).toEqual(expected);
			});

			it("should decode limit constraint", async () => {
				const expected = { target: "#", pipe: [], path: [] };

				expect(decodeCriterion("#")).toEqual(expected);
			});

			it("should decode constraint with path", async () => {
				const expected = { target: ">=", pipe: [], path: ["vendor", "rating"] };

				expect(decodeCriterion(">=vendor.rating")).toEqual(expected);
			});

			it("should decode constraint with transform", async () => {
				const expected = { target: ">=", pipe: ["year"], path: ["releaseDate"] };

				expect(decodeCriterion(">=year:releaseDate")).toEqual(expected);
			});

		});

		describe("roundtrip", () => {

			it("should roundtrip simple property", async () => {
				const criterion = { target: "name", pipe: [], path: [] };

				expect(decodeCriterion(encodeCriterion(criterion))).toEqual(criterion);
			});

			it("should roundtrip aliased property with transform", async () => {
				const criterion = { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] };

				expect(decodeCriterion(encodeCriterion(criterion))).toEqual(criterion);
			});

			it("should roundtrip constraint with path", async () => {
				const criterion = { target: ">=", pipe: [], path: ["vendor", "rating"] };

				expect(decodeCriterion(encodeCriterion(criterion))).toEqual(criterion);
			});

		});

		describe("error handling", () => {

			it("should reject path without target", async () => {
				expect(() => decodeCriterion("address.city")).toThrow();
			});

			it("should reject empty string", async () => {
				expect(() => decodeCriterion("")).toThrow();
			});

		});

	});

});
