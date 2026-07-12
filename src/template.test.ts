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
	isExpression,
	isLocale,
	isModel,
	isOperator,
	isOption,
	isOptions,
	isOrder,
	isPlaceholder,
	isPlaceholders,
	isProbe,
	isProjection,
	isQuery,
	isSelection,
	isSelector,
	isTemplate,
	isTransform,
	isUnion,
	isUnionKey,
	isVacuous
} from "./template.core.js";
import {
	decodeProbe,
	decodeSelection,
	decodeTemplate,
	encodeProbe,
	encodeSelection,
	encodeTemplate,
	type Probe,
	type Selection,
	type Template
} from "./template.js";


describe("guards", () => {

	describe("isTemplate", () => {

		it("should accept entry maps with identifier keys", () => {
			expect(isTemplate({ id: "", name: "" })).toBe(true);
			expect(isTemplate({ vendor: { id: "" } })).toBe(true);
		});

		it("should accept empty entry maps", () => {
			expect(isTemplate({})).toBe(true);
		});

		it("should accept undefined entry values", () => {
			expect(isTemplate({ name: undefined })).toBe(true);
			expect(isTemplate({ id: "", child: undefined })).toBe(true);
		});

		it("should accept collection tuples carrying a selection", () => {
			// a collection property is an `[element, Selection?]` tuple
			expect(isTemplate({ items: [{ id: "" }, { "^id": "asc", "@": 0, "#": 10 }] })).toBe(true);
		});

		it("should reject bare selection-only entry values", () => {
			// with Locale & Selection gone, a bare operator-keyed object is not a Placeholders value
			expect(isTemplate({ vendor: { "^id": "asc" } })).toBe(false);
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
			expect(isTemplate(["/a"])).toBe(false);
		});

	});


	describe("isPlaceholders", () => {

		it("should accept scalar placeholders", () => {
			expect(isPlaceholders(true)).toBe(true);
			expect(isPlaceholders(42)).toBe(true);
			expect(isPlaceholders("")).toBe(true);
			expect(isPlaceholders("/products/42")).toBe(true);
			expect(isPlaceholders({ id: "", name: "" })).toBe(true);
		});

		it("should accept single-valued language maps", () => {
			expect(isPlaceholders({ "*": "" })).toBe(true);
			expect(isPlaceholders({ "en": "text" })).toBe(true);
			expect(isPlaceholders({ "en": "hello", "fr": "bonjour" })).toBe(true);
		});

		it("should accept multi-valued language maps", () => {
			expect(isPlaceholders({ "en": [""] })).toBe(true);
			expect(isPlaceholders({ "en": ["hello"], "fr": ["bonjour"] })).toBe(true);
		});

		it("should reject language maps carrying selection constraints", () => {
			// Locale no longer combines with Selection; an operator-keyed tag map is not a Locale
			expect(isPlaceholders({ "en": "hello", "~": "widget" })).toBe(false);
			expect(isPlaceholders({ "en": ["hello"], "@": 0, "#": 10 })).toBe(false);
		});

		it("should accept collection tuples", () => {
			expect(isPlaceholders([""])).toBe(true);
			expect(isPlaceholders([{ id: "", name: "" }])).toBe(true);
		});

		it("should reject multi-element arrays", () => {
			expect(isPlaceholders([true, false])).toBe(false);
			expect(isPlaceholders([1, 2, 3])).toBe(false);
			expect(isPlaceholders(["a", "b"])).toBe(false);
			expect(isPlaceholders(["/a", "/b"])).toBe(false);
		});

		it("should reject empty arrays", () => {
			expect(isPlaceholders([])).toBe(false);
		});

		it("should accept singleton-tuple projection placeholders", () => {
			expect(isPlaceholders([{ "total=count:": 0 }])).toBe(true);
		});

		it("should accept template-element-with-selection placeholders", () => {
			expect(isPlaceholders([{ id: "", name: "" }, { "^name": "asc", "#": 10 }])).toBe(true);
		});

		it("should accept primitive-element-with-selection placeholders", () => {
			expect(isPlaceholders(["", { "^id": "asc", "@": 0, "#": 10 }])).toBe(true);
		});

		it("should reject plain selection-only objects", () => {
			// selection-only objects are no longer placeholders (Locale & Selection removed);
			// Selection attaches inside collection tuples, not as a bare entry value
			expect(isPlaceholders({ "^id": "asc" })).toBe(false);
			expect(isPlaceholders({ "~name": "widget", "^name": "asc" })).toBe(false);
		});

		it("should accept single-valued indexed variants", () => {
			expect(isPlaceholders({ "0": { id: "", name: "" } })).toBe(true);
			expect(isPlaceholders({ "0": { id: "", name: "" }, "1": { id: "", legalName: "" } })).toBe(true);
		});

		it("should reject the standalone default form", () => {
			// `{ "": ... }` is not a Placeholders value
			expect(isPlaceholders({ "": "" })).toBe(false);
			expect(isPlaceholders({ "": { id: "", name: "" } })).toBe(false);
		});

		it("should reject indexed variants with non-integer keys", () => {
			expect(isPlaceholders({ "3.14": { id: "" } })).toBe(false);
			expect(isPlaceholders({ "-5": { id: "" } })).toBe(false);
			expect(isPlaceholders({ "1e10": { id: "" } })).toBe(false);
			expect(isPlaceholders({ "01": { id: "" } })).toBe(false);
		});

		it("should reject indexed variants with mixed numeric and identifier keys", () => {
			expect(isPlaceholders({ "0": { id: "" }, "foo": { id: "" } })).toBe(false);
		});

		it("should accept union-element-with-selection placeholders", () => {
			expect(isPlaceholders([{ "0": { id: "", name: "" }, "1": { id: "" } }, { "^id": "asc" }])).toBe(true);
		});

		it("should reject mixed-type arrays", () => {
			expect(isPlaceholders([1, "a"])).toBe(false);
		});

		it("should accept undefined", () => {
			expect(isPlaceholders(undefined)).toBe(true);
		});

		it("should reject null", () => {
			expect(isPlaceholders(null)).toBe(false);
		});

	});

	describe("isPlaceholder", () => {

		it("should accept boolean", () => {
			expect(isPlaceholder(true)).toBe(true);
			expect(isPlaceholder(false)).toBe(true);
		});

		it("should accept number", () => {
			expect(isPlaceholder(0)).toBe(true);
			expect(isPlaceholder(42)).toBe(true);
		});

		it("should accept string", () => {
			expect(isPlaceholder("")).toBe(true);
			expect(isPlaceholder("text")).toBe(true);
		});

		it("should accept reference", () => {
			expect(isPlaceholder("/products/42")).toBe(true);
		});

		it("should accept nested template", () => {
			expect(isPlaceholder({ id: "", name: "" })).toBe(true);
			expect(isPlaceholder({ vendor: { id: "" } })).toBe(true);
		});

		it("should reject null", () => {
			expect(isPlaceholder(null)).toBe(false);
		});

		it("should reject undefined", () => {
			expect(isPlaceholder(undefined)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isPlaceholder([])).toBe(false);
			expect(isPlaceholder(["a"])).toBe(false);
		});

	});


	describe("isModel", () => {

		it("should accept placeholders", () => {
			expect(isModel("")).toBe(true);
			expect(isModel(42)).toBe(true);
			expect(isModel("/products/42")).toBe(true);
			expect(isModel({ id: "", name: "" })).toBe(true);
		});

		it("should accept unions", () => {
			expect(isModel({ "0": { id: "" } })).toBe(true);
			expect(isModel({ "0": { id: "" }, "1": { id: "", legalName: "" } })).toBe(true);
		});

		it("should accept locales", () => {
			expect(isModel({ "en": "hello" })).toBe(true);
			expect(isModel({ "*": [""] })).toBe(true);
		});

		it("should reject collection queries", () => {
			expect(isModel([""])).toBe(false);
			expect(isModel([{ id: "", name: "" }, { "^name": "asc" }])).toBe(false);
		});

		it("should reject undefined", () => {
			expect(isModel(undefined)).toBe(false);
		});

		it("should reject null", () => {
			expect(isModel(null)).toBe(false);
		});

	});

	describe("isQuery", () => {

		it("should reject bare language maps (a Placeholders Locale arm, not a Query)", () => {
			expect(isQuery({ "*": "" })).toBe(false);
			expect(isQuery({ "en": "text" })).toBe(false);
			expect(isQuery({ "en": [""] })).toBe(false);
			expect(isQuery({ "en": ["hello"], "fr": ["bonjour"] })).toBe(false);
		});

		it("should accept primitive element tuples", () => {
			expect(isQuery([""])).toBe(true);
			expect(isQuery([0])).toBe(true);
			expect(isQuery([true])).toBe(true);
			expect(isQuery(["/products/42"])).toBe(true);
		});

		it("should accept template element tuples, optionally with a selection", () => {
			expect(isQuery([{ id: "", name: "" }])).toBe(true);
			expect(isQuery([{ id: "", name: "" }, { "^name": "asc", "#": 10 }])).toBe(true);
		});

		it("should accept a primitive element with a selection", () => {
			expect(isQuery(["", { "^name": "asc", "#": 10 }])).toBe(true);
		});

		it("should accept union element tuples, optionally with a selection", () => {
			expect(isQuery([{ "0": { id: "", name: "" }, "1": { id: "" } }])).toBe(true);
			expect(isQuery([{ "0": { id: "", name: "" } }, { "^id": "asc" }])).toBe(true);
		});

		it("should accept projection element tuples, optionally with a selection", () => {
			expect(isQuery([{ "total=count:": 0 }])).toBe(true);
			expect(isQuery([{ "total=count:": 0 }, { "#": 10 }])).toBe(true);
		});

		it("should accept an empty (vacuous) element", () => {
			expect(isQuery([{}])).toBe(true);
			expect(isQuery([{}, { "^id": "asc" }])).toBe(true);
		});

		it("should reject scalar single-valued placeholders", () => {
			expect(isQuery(true)).toBe(false);
			expect(isQuery(42)).toBe(false);
			expect(isQuery("")).toBe(false);
			expect(isQuery("/products/42")).toBe(false);
		});

		it("should reject bare object entry values", () => {
			// bare objects are single-valued Placeholders, not collections
			expect(isQuery({ vendor: { id: "" } })).toBe(false);
			expect(isQuery({ user_name: "" })).toBe(false);
			expect(isQuery({ "0": { id: "", name: "" } })).toBe(false);
			expect(isQuery({ "^id": "asc" })).toBe(false);
		});

		it("should reject an operator-keyed first element", () => {
			// the leading element is a Placeholder/Union/Projection, never a bare Selection
			expect(isQuery([{ "^id": "asc" }])).toBe(false);
		});

		it("should reject a non-selection second element", () => {
			expect(isQuery([{}, { id: "" }])).toBe(false);
			expect(isQuery([true, false])).toBe(false);
		});

		it("should reject empty arrays", () => {
			expect(isQuery([])).toBe(false);
		});

		it("should reject arrays of three or more elements", () => {
			expect(isQuery([{}, { "^id": "asc" }, {}])).toBe(false);
			expect(isQuery(["a", "b", "c"])).toBe(false);
		});

		it("should reject null and undefined", () => {
			expect(isQuery(null)).toBe(false);
			expect(isQuery(undefined)).toBe(false);
		});

	});


	describe("isLocale", () => {

		describe("accepted and rejected locale models", () => {

			it("should accept single-valued wildcard tag", () => {
				expect(isLocale({ "*": "" })).toBe(true);
				expect(isLocale({ "*": "text" })).toBe(true);
			});

			it("should accept multi-valued wildcard tag", () => {
				expect(isLocale({ "*": [""] })).toBe(true);
				expect(isLocale({ "*": ["text"] })).toBe(true);
			});

			it("should accept single-valued language tags", () => {
				expect(isLocale({ "en": "hello" })).toBe(true);
				expect(isLocale({ "fr": "bonjour" })).toBe(true);
			});

			it("should accept multi-valued language tags", () => {
				expect(isLocale({ "en": ["hello"] })).toBe(true);
				expect(isLocale({ "fr": ["bonjour"] })).toBe(true);
			});

			it("should accept multiple single-valued language tags", () => {
				expect(isLocale({ "en": "hello", "fr": "bonjour" })).toBe(true);
			});

			it("should accept multiple multi-valued language tags", () => {
				expect(isLocale({ "en": ["hello"], "fr": ["bonjour"] })).toBe(true);
			});

			it("should reject plain string shorthand", () => {
				expect(isLocale("text")).toBe(false);
				expect(isLocale("")).toBe(false);
			});

			it("should reject singleton string tuple shorthand", () => {
				expect(isLocale(["text"])).toBe(false);
				expect(isLocale([""])).toBe(false);
			});

			it("should reject multi-element string arrays", () => {
				expect(isLocale(["hello", "hi"])).toBe(false);
			});

			it("should reject empty arrays", () => {
				expect(isLocale([])).toBe(false);
				expect(isLocale({ "en": [] })).toBe(false);
			});

		});

		describe("invalid locale models", () => {

			it("should reject null and undefined", () => {
				expect(isLocale(null)).toBe(false);
				expect(isLocale(undefined)).toBe(false);
			});

			it("should reject non-string primitives", () => {
				expect(isLocale(true)).toBe(false);
				expect(isLocale(42)).toBe(false);
			});

			it("should reject mixed scalar/array content", () => {
				expect(isLocale({ "en": "hello", "fr": ["bonjour"] })).toBe(false);
				expect(isLocale({ "en": ["hello"], "fr": "bonjour" })).toBe(false);
			});

			it("should reject invalid tag keys", () => {
				expect(isLocale({ "invalid tag": "text" })).toBe(false);
				expect(isLocale({ "invalid tag": ["text"] })).toBe(false);
			});

		});

		describe("default form", () => {

			it("should reject empty-key default form", () => {
				expect(isLocale({ "": [""] })).toBe(false);
				expect(isLocale({ "": ["text"] })).toBe(false);
				expect(isLocale({ "": "text" })).toBe(false);
			});

			it("should reject empty-key default form carrying selection constraints", () => {
				expect(isLocale({ "": [""], "~": "widget" })).toBe(false);
				expect(isLocale({ "": ["hello"], "@": 0, "#": 25 })).toBe(false);
			});

		});

		describe("selection attachment", () => {

			it("should reject filter constraints alongside single-valued tag map", () => {
				expect(isLocale({ en: "hello", "~": "widget" })).toBe(false);
				expect(isLocale({ "*": "", "?": ["a", "b"] })).toBe(false);
			});

			it("should reject filter constraints alongside multi-valued tag map", () => {
				expect(isLocale({ en: ["hello"], "~": "widget" })).toBe(false);
				expect(isLocale({ "*": [""], "?": ["a"] })).toBe(false);
			});

			it("should reject ordering and pagination alongside tag map", () => {
				expect(isLocale({ en: "hello", "^": "asc" })).toBe(false);
				expect(isLocale({ en: ["hello"], "@": 0, "#": 25 })).toBe(false);
			});

			it("should reject operator-prefixed expression keys alongside tag map", () => {
				expect(isLocale({ en: "hello", "<=length:": 100 })).toBe(false);
				expect(isLocale({ en: ["hello"], ">length:": 0 })).toBe(false);
			});

			it("should reject selection-only map with no tag-range entries", () => {
				expect(isLocale({ "^": "asc" })).toBe(false);
				expect(isLocale({ "~": "widget", "@": 0, "#": 10 })).toBe(false);
			});

		});

	});

	describe("isUnion", () => {

		it("should reject bare scalar placeholders", () => {
			expect(isUnion(true)).toBe(false);
			expect(isUnion(42)).toBe(false);
			expect(isUnion("")).toBe(false);
			expect(isUnion("/products/42")).toBe(false);
		});

		it("should reject plain template placeholders", () => {
			expect(isUnion({ id: "", name: "" })).toBe(false);
		});

		it("should accept indexed form", () => {
			expect(isUnion({ "0": { id: "", name: "" } })).toBe(true);
			expect(isUnion({ "0": { id: "" }, "1": { id: "" } })).toBe(true);
			expect(isUnion({ "0": "" })).toBe(true);
			expect(isUnion({ "0": 42 })).toBe(true);
		});

		it("should accept a localised per-branch value", () => {
			// localised text is an admitted union branch: a qualified-tag or array-form Locale that a
			// Template/Placeholder would reject is now accepted through the Locale arm of the branch type
			expect(isUnion({ "0": { "en-US": "x" } })).toBe(true);
			expect(isUnion({ "0": { "en-US": ["x"] }, "1": { id: "" } })).toBe(true);
			expect(isUnion({ "0": { en: [""] } })).toBe(true);
			expect(isUnion({ "0": { "*": "" }, "1": "" })).toBe(true);
		});

		it("should reject indexed form with non-integer keys", () => {
			expect(isUnion({ "3.14": { id: "" } })).toBe(false);
			expect(isUnion({ "-5": { id: "" } })).toBe(false);
			expect(isUnion({ "1e10": { id: "" } })).toBe(false);
			expect(isUnion({ "01": { id: "" } })).toBe(false);
		});

		it("should reject indexed form with mixed keys", () => {
			expect(isUnion({ "0": { id: "" }, "foo": { id: "" } })).toBe(false);
		});

		it("should reject null and undefined", () => {
			expect(isUnion(null)).toBe(false);
			expect(isUnion(undefined)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isUnion([])).toBe(false);
			expect(isUnion([{ id: "" }])).toBe(false);
		});

	});

	describe("isUnionKey", () => {

		it("should accept canonical non-negative integer strings", () => {
			expect(isUnionKey("0")).toBe(true);
			expect(isUnionKey("10")).toBe(true);
			expect(isUnionKey("99")).toBe(true);
		});

		it("should reject leading zeros", () => {
			expect(isUnionKey("00")).toBe(false);
			expect(isUnionKey("01")).toBe(false);
		});

		it("should reject non-integer numeric forms", () => {
			expect(isUnionKey("3.14")).toBe(false);
			expect(isUnionKey("1e10")).toBe(false);
		});

		it("should reject negative and signed values", () => {
			expect(isUnionKey("-5")).toBe(false);
			expect(isUnionKey("+1")).toBe(false);
		});

		it("should reject surrounding whitespace", () => {
			expect(isUnionKey(" 0")).toBe(false);
			expect(isUnionKey("0 ")).toBe(false);
		});

		it("should reject the empty string", () => {
			expect(isUnionKey("")).toBe(false);
		});

		it("should reject non-string values", () => {
			expect(isUnionKey(0)).toBe(false);
			expect(isUnionKey(null)).toBe(false);
			expect(isUnionKey(undefined)).toBe(false);
		});

	});


	describe("isProjection", () => {

		it("should accept empty object", () => {
			expect(isProjection({})).toBe(true);
		});

		it("should accept scalar placeholders", () => {
			expect(isProjection({ "id=id": "", "name=name": "" })).toBe(true);
			expect(isProjection({ "price=price": 0, "available=available": true })).toBe(true);
		});

		it("should reject bare identifier keys", () => {
			// bare keys form a Template, not a Projection (no binding shorthand)
			expect(isProjection({ id: "", name: "" })).toBe(false);
			expect(isProjection({ vendor: { id: "", name: "" } })).toBe(false);
		});

		it("should accept binding keys", () => {
			expect(isProjection({ "total=sum:price": 0 })).toBe(true);
			expect(isProjection({ "vendorName=vendor.name": "" })).toBe(true);
		});

		it("should accept nested template values", () => {
			expect(isProjection({ "vendorRow=vendor": { id: "", name: "" } })).toBe(true);
		});

		it("should accept indexed variants values", () => {
			expect(isProjection({ "creator=creator": { "0": { id: "", name: "" }, "1": { id: "" } } })).toBe(true);
		});

		it("should reject empty-string-keyed cell values", () => {
			// `{ "": ... }` is not a single-value projection cell
			expect(isProjection({ "creator=creator": { "": "" } })).toBe(false);
		});

		it("should accept undefined entry values", () => {
			expect(isProjection({ "name=name": undefined })).toBe(true);
			expect(isProjection({ "id=id": "", "total=count:": undefined })).toBe(true);
		});

		it("should accept localised tag-range placeholders", () => {
			expect(isProjection({ "label=title": { "*": "" } })).toBe(true);
			expect(isProjection({ "label=title": { "en": "", "fr": "" } })).toBe(true);
			expect(isProjection({ "label=title": { "en-US": "" } })).toBe(true);
		});

		it("should accept localised bindings alongside scalar bindings", () => {
			expect(isProjection({
				"id=id": "",
				"label=title": { "*": "" },
				"total=count:": 0
			})).toBe(true);
		});

		it("should accept multi-valued localised placeholders", () => {
			// projection cells admit the full Locale (single- or multi-valued)
			expect(isProjection({ "label=title": { "*": [""] } })).toBe(true);
			expect(isProjection({ "label=title": { "en-US": [""] } })).toBe(true);
		});

		it("should reject duplicate binding result names", () => {
			// index.md §5.6: binding result names must be unique within a projection
			expect(isProjection({ "count=count:": 0, "count=sum:price": 0 })).toBe(false);
			expect(isProjection({ "x=a": "", "x=b": "" })).toBe(false);
		});

		it("should reject collection tuples", () => {
			expect(isProjection({ "items=items": [{ id: "" }] })).toBe(false);
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
			expect(isProjection([{ id: "" }])).toBe(false);
		});

	});

	describe("isSelection", () => {

		it("should accept empty object", () => {
			expect(isSelection({})).toBe(true);
		});

		it("should accept comparison filters", () => {
			expect(isSelection({ ">=price": 50 })).toBe(true);
			expect(isSelection({ "<=price": 150 })).toBe(true);
			expect(isSelection({ ">price": 50 })).toBe(true);
			expect(isSelection({ "<price": 150 })).toBe(true);
			expect(isSelection({ ">=date": "2024-01-01" })).toBe(true);
			expect(isSelection({ ">=active": true })).toBe(true);
			expect(isSelection({ "<active": false })).toBe(true);
		});

		it("should reject non-literal comparison values", () => {
			expect(isSelection({ ">=price": null })).toBe(false);
			expect(isSelection({ "<price": [1, 2] })).toBe(false);
			expect(isSelection({ "<=price": { nested: 1 } })).toBe(false);
		});

		it("should accept text search filter", () => {
			expect(isSelection({ "~name": "widget" })).toBe(true);
		});

		it("should accept matching filters", () => {
			expect(isSelection({ "?category": ["a", "b"] })).toBe(true);
			expect(isSelection({ "!tags": ["featured"] })).toBe(true);
		});

		it("should accept ordering entries", () => {
			expect(isSelection({ "+category": ["electronics"] })).toBe(true);
			expect(isSelection({ "^price": 1 })).toBe(true);
			expect(isSelection({ "^name": "asc" })).toBe(true);
			expect(isSelection({ "^name": "desc" })).toBe(true);
		});

		it("should accept paging entries", () => {
			expect(isSelection({ "@": 10 })).toBe(true);
			expect(isSelection({ "#": 25 })).toBe(true);
		});

		it("should accept combined constraints", () => {
			expect(isSelection({ ">=price": 50, "<=price": 150, "^price": 1, "@": 0, "#": 25 })).toBe(true);
		});

		it("should reject projection keys", () => {
			expect(isSelection({ name: "" })).toBe(false);
			expect(isSelection({ price: 0 })).toBe(false);
		});

		it("should reject non-objects", () => {
			expect(isSelection(null)).toBe(false);
			expect(isSelection(undefined)).toBe(false);
			expect(isSelection("string")).toBe(false);
			expect(isSelection(42)).toBe(false);
			expect(isSelection([])).toBe(false);
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

			it("should narrow the input type to SelectionKey", () => {
				const key: unknown = ">=price";
				if ( isSelector(key) ) {
					const narrowed: Selection[keyof Selection] extends never ? never : typeof key = key;
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


	describe("isVacuous", () => {

		describe("vacuous values", () => {

			it("should accept the absent marker", () => {
				expect(isVacuous(undefined)).toBe(true);
			});

			it("should accept empty objects", () => {
				expect(isVacuous({})).toBe(true);
			});

			it("should accept selection-only objects", () => {
				expect(isVacuous({ "^name": "asc" })).toBe(true);
				expect(isVacuous({ "<price": 100, "@": 0, "#": 10 })).toBe(true);
			});

			it("should accept singleton-tuple wrappers of vacuous values", () => {
				expect(isVacuous([{}])).toBe(true);
				expect(isVacuous([undefined])).toBe(true);
				expect(isVacuous([{ "^name": "asc" }])).toBe(true);
			});

			it("should accept empty arrays", () => {
				expect(isVacuous([])).toBe(true);
			});

			it("should accept multi-element arrays whose every element is vacuous", () => {
				expect(isVacuous([{}, {}])).toBe(true);
				expect(isVacuous([undefined, {}])).toBe(true);
				expect(isVacuous([{ "^name": "asc" }, { name: {} }])).toBe(true);
			});

			it("should accept Templates whose every property is vacuous", () => {
				expect(isVacuous({ name: {} })).toBe(true);
				expect(isVacuous({ name: undefined, vendor: {} })).toBe(true);
				expect(isVacuous({ vendor: { id: undefined } })).toBe(true);
			});

			it("should accept Unions whose every variant body is vacuous", () => {
				expect(isVacuous({ "0": {}, "1": {} })).toBe(true);
				expect(isVacuous({ "": {} })).toBe(true);
			});

			it("should accept Projections whose every binding is vacuous", () => {
				expect(isVacuous({ "name=lower:label": undefined, vendor: {} })).toBe(true);
			});

			it("should accept mixed Selection plus transitively-vacuous bindings", () => {
				expect(isVacuous({ "<price": 100, name: {} })).toBe(true);
				expect(isVacuous({ "@": 0, "0": {}, "1": {} })).toBe(true);
			});

		});

		describe("non-vacuous values", () => {

			it("should reject primitive type markers", () => {
				expect(isVacuous("")).toBe(false);
				expect(isVacuous(0)).toBe(false);
				expect(isVacuous(true)).toBe(false);
				expect(isVacuous("text")).toBe(false);
				expect(isVacuous(42)).toBe(false);
			});

			it("should reject objects carrying retrieval instructions", () => {
				expect(isVacuous({ name: "" })).toBe(false);
				expect(isVacuous({ "0": "" })).toBe(false);
				expect(isVacuous({ "": "" })).toBe(false);
				expect(isVacuous({ en: "text" })).toBe(false);
			});

			it("should reject singleton-tuple wrappers of non-vacuous values", () => {
				expect(isVacuous([""])).toBe(false);
				expect(isVacuous([{ name: "" }])).toBe(false);
			});

			it("should reject arrays containing any non-vacuous element", () => {
				expect(isVacuous([{}, ""])).toBe(false);
				expect(isVacuous([undefined, { name: "" }])).toBe(false);
			});

			it("should reject null", () => {
				expect(isVacuous(null)).toBe(false);
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

			it("should reject non-finite number placeholders", () => {
				expect(isTemplate({ x: Number.NaN })).toBe(false);
				expect(isTemplate({ x: Number.POSITIVE_INFINITY })).toBe(false);
				expect(isTemplate({ x: Number.NEGATIVE_INFINITY })).toBe(false);
			});

			it("should reject non-identifier keys", () => {
				expect(isTemplate({ "foo-bar": "" })).toBe(false);
				expect(isTemplate({ "foo.bar": "" })).toBe(false);
				expect(isTemplate({ "@id": "" })).toBe(false);
				expect(isTemplate({ "ns:prop": "" })).toBe(false);
				expect(isTemplate({ "123": "" })).toBe(false);
			});

			it("should reject non-plain objects nested as values", () => {
				expect(isTemplate({ when: new Date() })).toBe(false);
				expect(isTemplate({ pattern: /regex/ })).toBe(false);
			});

			it("should reject deeply nested invalid structures", () => {
				expect(isTemplate({ outer: { "foo.bar": "" } })).toBe(false);
				expect(isTemplate({ outer: { inner: new Date() } })).toBe(false);
				expect(isTemplate({ xs: [{ "foo.bar": "" }] })).toBe(false);
			});

			it("should accept JSON.parse output of a valid template", () => {
				const json = JSON.stringify({
					id: "",
					name: "",
					price: 0,
					vendor: { id: "", name: "" },
					label: { en: "", de: "" }
				});

				expect(isTemplate(JSON.parse(json))).toBe(true);
			});

		});

		describe("isPlaceholders", () => {

			it("should reject non-plain objects", () => {
				expect(isPlaceholders(new Date())).toBe(false);
				expect(isPlaceholders(new Map())).toBe(false);
				expect(isPlaceholders(Object.create(null))).toBe(false);
			});

			it("should reject non-finite numbers", () => {
				expect(isPlaceholders(Number.NaN)).toBe(false);
				expect(isPlaceholders(Number.POSITIVE_INFINITY)).toBe(false);
			});

			it("should reject functions, symbols, bigints", () => {
				expect(isPlaceholders(() => {})).toBe(false);
				expect(isPlaceholders(Symbol("x"))).toBe(false);
				expect(isPlaceholders(BigInt(1))).toBe(false);
			});

			it("should reject singleton tuples containing invalid elements", () => {
				expect(isPlaceholders([null])).toBe(false);
				expect(isPlaceholders([undefined])).toBe(false);
				expect(isPlaceholders([new Date()])).toBe(false);
				expect(isPlaceholders([() => {}])).toBe(false);
				expect(isPlaceholders([Number.NaN])).toBe(false);
			});

			it("should enforce singleton-tuple length exactly 1", () => {
				expect(isPlaceholders([])).toBe(false);
				expect(isPlaceholders(["", ""])).toBe(false);
				expect(isPlaceholders([{ id: "" }, { id: "" }])).toBe(false);
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

			it("should reject indexed form mixed with identifier keys", () => {
				expect(isUnion({ "0": "", id: "" })).toBe(false);
			});

			it("should reject non-canonical indexed keys", () => {
				expect(isUnion({ "00": "" })).toBe(false);
				expect(isUnion({ "0.0": "" })).toBe(false);
				expect(isUnion({ "+1": "" })).toBe(false);
				expect(isUnion({ " 0": "" })).toBe(false);
				expect(isUnion({ "0 ": "" })).toBe(false);
			});

			it("should accept canonical indexed keys", () => {
				expect(isUnion({ "0": "" })).toBe(true);
				expect(isUnion({ "10": "" })).toBe(true);
				expect(isUnion({ "99": "" })).toBe(true);
			});

			it("should reject indexed form with invalid placeholder values", () => {
				expect(isUnion({ "0": null })).toBe(false);
				expect(isUnion({ "0": undefined })).toBe(false);
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

			it("should reject non-string values in language maps", () => {
				expect(isLocale({ en: 42 })).toBe(false);
				expect(isLocale({ en: null })).toBe(false);
				expect(isLocale({ en: [42] })).toBe(false);
				expect(isLocale({ en: [null] })).toBe(false);
			});

		});

		describe("isProjection", () => {

			it("should reject non-plain objects", () => {
				expect(isProjection(new Date())).toBe(false);
				expect(isProjection(new Map())).toBe(false);
				expect(isProjection(Object.create(null))).toBe(false);
			});

			it("should reject invalid binding keys", () => {
				expect(isProjection({ "=value": "" })).toBe(false);
				expect(isProjection({ "123name=value": "" })).toBe(false);
				expect(isProjection({ "name=.bad": "" })).toBe(false);
				expect(isProjection({ "name=unknown:path": "" })).toBe(false);
			});

			it("should reject multi-element array values", () => {
				expect(isProjection({ "items=items": ["a", "b"] })).toBe(false);
				expect(isProjection({ "items=items": [1, 2, 3] })).toBe(false);
			});

			it("should reject non-finite number values", () => {
				expect(isProjection({ "x=x": Number.NaN })).toBe(false);
				expect(isProjection({ "x=x": Number.POSITIVE_INFINITY })).toBe(false);
			});

			it("should reject invalid nested values", () => {
				expect(isProjection({ "item=item": new Date() })).toBe(false);
				expect(isProjection({ "item=item": [] })).toBe(false);
				expect(isProjection({ "item=item": [{ id: "" }] })).toBe(false);
			});

		});

		describe("isSelection", () => {

			it("should reject non-plain objects", () => {
				expect(isSelection(new Date())).toBe(false);
				expect(isSelection(new Map())).toBe(false);
				expect(isSelection(Object.create(null))).toBe(false);
			});

			it("should reject unknown operator prefixes", () => {
				expect(isSelection({ "=price": 50 })).toBe(false);
				expect(isSelection({ "&price": 50 })).toBe(false);
				expect(isSelection({ "%price": 50 })).toBe(false);
			});

			it("should reject non-literal comparison values", () => {
				expect(isSelection({ ">=price": null })).toBe(false);
				expect(isSelection({ ">=price": undefined })).toBe(false);
				expect(isSelection({ ">=price": new Date() })).toBe(false);
				expect(isSelection({ ">=price": Number.NaN })).toBe(false);
			});

			it("should reject non-string text search values", () => {
				expect(isSelection({ "~name": 42 })).toBe(false);
				expect(isSelection({ "~name": null })).toBe(false);
				expect(isSelection({ "~name": ["widget"] })).toBe(false);
			});

			it("should reject invalid options in matching filters", () => {
				expect(isSelection({ "?cat": undefined })).toBe(false);
				expect(isSelection({ "?cat": [new Date()] })).toBe(false);
				expect(isSelection({ "!tags": [() => {}] })).toBe(false);
			});

			it("should reject invalid sort priority values", () => {
				expect(isSelection({ "^price": null })).toBe(false);
				expect(isSelection({ "^price": "ascending" })).toBe(false);
				expect(isSelection({ "^price": Number.NaN })).toBe(false);
				expect(isSelection({ "^price": true })).toBe(false);
			});

			it("should reject non-numeric paging values", () => {
				expect(isSelection({ "@": "10" })).toBe(false);
				expect(isSelection({ "#": null })).toBe(false);
				expect(isSelection({ "@": Number.NaN })).toBe(false);
				expect(isSelection({ "#": Number.POSITIVE_INFINITY })).toBe(false);
			});

			it("should reject negative and non-integer paging values", () => {
				// index.md §5.7.6 / ABNF `offset` = `limit` = 1*DIGIT: non-negative integers only
				expect(isSelection({ "@": -1 })).toBe(false);
				expect(isSelection({ "@": 1.5 })).toBe(false);
				expect(isSelection({ "#": -5 })).toBe(false);
				expect(isSelection({ "#": 2.5 })).toBe(false);
			});

			it("should reject malformed expression parts after operator prefix", () => {
				expect(isSelection({ "<foo-bar": 1 })).toBe(false);
				expect(isSelection({ ">=foo.123": 1 })).toBe(false);
				expect(isSelection({ "~foo..bar": "x" })).toBe(false);
				expect(isSelection({ "?.name": ["a"] })).toBe(false);
				expect(isSelection({ "!unknownTransform:name": ["a"] })).toBe(false);
				expect(isSelection({ "+name.": ["a"] })).toBe(false);
				expect(isSelection({ "^foo-bar": "asc" })).toBe(false);
			});

			it("should accept well-formed expression parts", () => {
				expect(isSelection({ "<price": 50 })).toBe(true);
				expect(isSelection({ ">=vendor.price": 50 })).toBe(true);
				expect(isSelection({ "~name": "widget" })).toBe(true);
				expect(isSelection({ "?category": ["a"] })).toBe(true);
				expect(isSelection({ "!round:avg:scores": [1] })).toBe(true);
				expect(isSelection({ "^year:releaseDate": "desc" })).toBe(true);
				expect(isSelection({ "<": 0 })).toBe(true);
				expect(isSelection({ "<count:": 10 })).toBe(true);
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

		describe("placeholder/tuple asymmetry", () => {

			it("should accept locale-shaped object as scalar Placeholders", () => {
				// Locale is allowed as a scalar Placeholders branch
				expect(isPlaceholders({ en: "hello", fr: "bonjour" })).toBe(true);
				expect(isPlaceholders({ "*": [""] })).toBe(true);
			});

			it("should reject locale-shaped object wrapped in singleton tuple", () => {
				// the Query element is a Placeholder/Union/Projection, never a Locale.
				// A locale-only shape like { "en-GB": "" } doesn't match Template (key "en-GB"
				// is not an identifier — hyphens forbidden), nor Union nor Projection.
				expect(isPlaceholders([{ "en-GB": "" }])).toBe(false);
				expect(isPlaceholders([{ "de-CH": "text" }])).toBe(false);
			});

			it("should accept tuple wrapping a template whose keys happen to be language tags", () => {
				// {en: ""} is simultaneously a valid Locale AND a valid nested Template,
				// and the Template interpretation lets it through the [Placeholder] tuple branch
				expect(isPlaceholders([{ en: "" }])).toBe(true);
			});

		});

		describe("isUnion (Union) form disjointness", () => {

			it("should reject mixing default, indexed and identifier keys in the same object", () => {
				expect(isUnion({ "": "", "0": "", id: "" })).toBe(false);
				expect(isUnion({ "0": "", id: "" })).toBe(false);
				expect(isUnion({ "": "", id: "" })).toBe(false);
			});

			it("should accept an empty object as a vacuous union form", () => {
				// {} passes the union-entry predicate vacuously (no entries to reject)
				expect(isUnion({})).toBe(true);
			});

			it("should reject identifier-keyed objects (a plain Template is not a Union)", () => {
				expect(isUnion({ $price: "" })).toBe(false);
				expect(isUnion({ _internal: "" })).toBe(false);
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

		describe("isSelection expression validation edge cases", () => {

			it("should accept operator-only keys with empty expression (root/aggregate)", () => {
				expect(isSelection({ "<": 0 })).toBe(true);
				expect(isSelection({ ">=": 0 })).toBe(true);
				expect(isSelection({ "~": "" })).toBe(true);
				expect(isSelection({ "?": [1] })).toBe(true);
			});

			it("should reject `<==` (empty op tail followed by invalid expression)", () => {
				// "<==" starts with "<=" → slice(2)="=" → not an identifier → invalid expression
				expect(isSelection({ "<==": 1 })).toBe(false);
			});

			it("should accept aggregate transforms in filter keys", () => {
				expect(isSelection({ ">=count:": 10 })).toBe(true);
				expect(isSelection({ "<avg:price": 100 })).toBe(true);
			});

			it("should reject unknown transforms in filter keys", () => {
				expect(isSelection({ ">=unknown:price": 10 })).toBe(false);
				expect(isSelection({ "^frobnicate:name": "asc" })).toBe(false);
			});

			it("should reject dotted path with empty segments", () => {
				expect(isSelection({ ">=a..b": 1 })).toBe(false);
				expect(isSelection({ ">=.a": 1 })).toBe(false);
				expect(isSelection({ ">=a.": 1 })).toBe(false);
			});

			it("should reject focus ordering with invalid expression", () => {
				expect(isSelection({ "+foo-bar": ["a"] })).toBe(false);
			});

			it("should reject sort priority as boolean or bigint", () => {
				expect(isSelection({ "^price": true })).toBe(false);
				expect(isSelection({ "^price": BigInt(1) })).toBe(false);
			});

			it("should accept signed integer sort priorities and reject fractional ones", () => {
				// index.md §5.7.5 / CDDL `order => "asc" / "desc" / int`: priorities are signed integers
				expect(isSelection({ "^price": -1 })).toBe(true);
				expect(isSelection({ "^price": 0 })).toBe(true);
				expect(isSelection({ "^price": 2.5 })).toBe(false);
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
				expect(isLocale({ "": "text" })).toBe(false);
				expect(isLocale({ "": [""] })).toBe(false);
			});

			it("should reject extended language ranges", () => {
				// RFC 4647 basic ranges only: trailing, interior, and leading `*` subtags are invalid
				expect(isLocale({ "en-*": "" })).toBe(false);
				expect(isLocale({ "de-*-DE": "" })).toBe(false);
				expect(isLocale({ "*-CH": "" })).toBe(false);
			});

			it("should reject singleton-tuple strictness violations in map values", () => {
				expect(isLocale({ en: ["a", "b"] })).toBe(false);
				expect(isLocale({ en: [] })).toBe(false);
			});

		});

		describe("prototype pollution resilience", () => {

			it("should accept plain objects with prototype-relevant key names", () => {
				// These are valid ECMAScript identifiers and must be accepted as ordinary keys;
				// isObject uses Object.entries/Object.keys which iterate own enumerable properties
				expect(isTemplate({ constructor: "" })).toBe(true);
				expect(isTemplate({ hasOwnProperty: "" })).toBe(true);
				expect(isTemplate({ toString: "" })).toBe(true);
			});

			it("should accept JSON-parsed objects whose only property is __proto__", () => {
				// JSON.parse(`{"__proto__": {...}}`) creates __proto__ as own property, not
				// prototype. "__proto__" starts with underscores so it IS a valid identifier.
				// Intent: guards should handle it uniformly as any other identifier key.
				const parsed = JSON.parse("{\"__proto__\": \"value\"}");

				expect(isTemplate(parsed)).toBe(true);
			});

			it("should reject objects with non-plain prototype even if keys look valid", () => {
				const weird = Object.create({ id: "" });
				weird.name = "";

				expect(isTemplate(weird)).toBe(false);
			});

		});

		describe("nested recursion boundaries", () => {

			it("should reject a template whose nested placeholder is an invalid variants form", () => {
				expect(isTemplate({ outer: { "": "", "0": "" } })).toBe(false);
			});

			it("should reject a selection entry whose filter value contains a non-plain object", () => {
				expect(isSelection({ "?category": [new Date()] })).toBe(false);
			});

			it("should reject deeply nested resource inside selection options", () => {
				expect(isSelection({ "?vendor": [{ "foo.bar": "x" }] })).toBe(false);
			});

			it("should accept deeply nested valid templates", () => {
				const deep = { a: { b: { c: { d: { e: { f: "" } } } } } };

				expect(isTemplate(deep)).toBe(true);
			});

		});

	});

});

describe("codecs", () => {

	describe("encodeTemplate()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const template: Template = { id: "/products/42" };

				expect(() => encodeTemplate(template, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should internalize absolute IRI to root-relative", () => {
				const template: Template = { id: "https://example.com/products/42" };

				expect(encodeTemplate(template, { base: "https://example.com/" }))
					.toBe(JSON.stringify({ id: "/products/42" }));
			});

		});

		describe("format option", () => {

			it("should default to json encoding", () => {
				const template: Template = { id: "" };

				expect(encodeTemplate(template)).toBe('{"id":""}');
			});

			it("should produce plain JSON when format is json", () => {
				const template: Template = { id: "" };

				expect(encodeTemplate(template, { format: "json" })).toBe('{"id":""}');
			});

			it("should produce URL-encoded JSON when format is url", () => {
				const template: Template = { id: "" };

				expect(encodeTemplate(template, { format: "url" })).toBe("%7B%22id%22%3A%22%22%7D");
			});

			it("should produce URL-safe base64-encoded JSON when format is base64", () => {
				const template: Template = { id: "" };

				expect(encodeTemplate(template, { format: "base64" })).toBe("eyJpZCI6IiJ9");
			});

			it("should strip base64 padding when format is base64", () => {
				expect(encodeTemplate({}, { format: "base64" })).toBe("e30");
			});

		});

		it("should use defaultBase when base option is omitted", () => {
			const template: Template = { id: "app:/products/42" };

			expect(encodeTemplate(template))
				.toBe(JSON.stringify({ id: "/products/42" }));
		});

		it("should encode empty template", () => {
			expect(encodeTemplate({})).toBe(JSON.stringify({}));
		});

		it("should encode template with primitive values", () => {
			const template: Template = {
				id: "",
				name: "",
				price: 0,
				available: true
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should encode template with nested template", () => {
			const template: Template = {
				id: "",
				vendor: { id: "", name: "" }
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should encode template with array values", () => {
			const template: Template = {
				id: "",
				tags: [""]
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should encode template with locale values", () => {
			const template: Template = {
				id: "",
				name: { en: "", fr: "" }
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify(template));
		});

		it("should omit undefined-valued properties", () => {
			const template: Template = {
				id: "",
				name: undefined,
				price: 0
			};

			expect(encodeTemplate(template)).toBe(JSON.stringify({ id: "", price: 0 }));
		});

		it("should indent output when indent is true", () => {
			expect(encodeTemplate({ id: "" }, { indent: true })).toBe("{\n  \"id\": \"\"\n}");
		});

		it("should indent output by the given number of spaces", () => {
			expect(encodeTemplate({ id: "" }, { indent: 4 })).toBe("{\n    \"id\": \"\"\n}");
		});

		it("should produce compact output when indent is false", () => {
			expect(encodeTemplate({ id: "" }, { indent: false })).toBe('{"id":""}');
		});

		it("should produce compact output when indent is zero", () => {
			expect(encodeTemplate({ id: "" }, { indent: 0 })).toBe('{"id":""}');
		});

	});

	describe("decodeTemplate()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(() => decodeTemplate(json, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should resolve root-relative IRI to absolute", () => {
				const json = JSON.stringify({ id: "/products/42" });

				expect(decodeTemplate(json, { base: "https://example.com/" }))
					.toEqual({ id: "https://example.com/products/42" });
			});

		});

		describe("format auto-detection", () => {

			it("should decode plain JSON input", () => {
				expect(decodeTemplate('{"id":""}')).toEqual({ id: "" });
			});

			it("should decode URL-encoded JSON input", () => {
				expect(decodeTemplate("%7B%22id%22%3A%22%22%7D")).toEqual({ id: "" });
			});

			it("should decode URL-safe base64-encoded JSON input", () => {
				expect(decodeTemplate("eyJpZCI6IiJ9")).toEqual({ id: "" });
			});

			it("should decode unpadded base64url input", () => {
				expect(decodeTemplate("e30")).toEqual({});
			});

			it("should roundtrip a template through each transport format", () => {
				const template: Template = { id: "", name: "", vendor: { id: "", name: "" } };

				expect(decodeTemplate(encodeTemplate(template, { format: "json" }))).toEqual(template);
				expect(decodeTemplate(encodeTemplate(template, { format: "url" }))).toEqual(template);
				expect(decodeTemplate(encodeTemplate(template, { format: "base64" }))).toEqual(template);
			});

		});

		it("should use defaultBase when base option is omitted", () => {
			const json = JSON.stringify({ id: "/products/42" });

			expect(decodeTemplate(json))
				.toEqual({ id: "app:/products/42" });
		});

		it("should decode empty template", () => {
			expect(decodeTemplate(JSON.stringify({}))).toEqual({});
		});

		it("should decode template with primitive values", () => {
			const json = JSON.stringify({
				id: "",
				name: "",
				price: 0,
				available: true
			});

			expect(decodeTemplate(json)).toEqual({
				id: "",
				name: "",
				price: 0,
				available: true
			});
		});

		it("should decode template with nested template", () => {
			const json = JSON.stringify({
				id: "",
				vendor: {
					id: "/vendors/acme",
					name: ""
				}
			});

			expect(decodeTemplate(json)).toEqual({
				id: "",
				vendor: {
					id: "app:/vendors/acme",
					name: ""
				}
			});
		});

		it("should roundtrip with encodeTemplate", () => {
			const template: Template = {
				id: "",
				name: "",
				price: 0,
				vendor: { id: "app:/vendors/acme", name: "" }
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
				const json = JSON.stringify({ "foo.bar": "" });

				expect(() => decodeTemplate(json, { lenient: true })).not.toThrow();
				expect(decodeTemplate(json, { lenient: true })).toEqual({ "foo.bar": "" });
			});

			it("should still throw on syntax errors when lenient", () => {
				expect(() => decodeTemplate("{not json", { lenient: true })).toThrow(SyntaxError);
			});

		});

	});


	describe("encodeSelection()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const query = { id: "/products/42" };

				expect(() => encodeSelection(query, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should internalize absolute IRI to root-relative", () => {
				const selection = { "?vendor": "https://example.com/vendors/acme" } as Selection;

				const encoded = encodeSelection(selection, { base: "https://example.com/" });

				expect(encoded).toBe("%3Fvendor=%22%2Fvendors%2Facme%22");
			});

		});

		it("should use defaultBase when base option is omitted", () => {
			const selection = { "?vendor": "app:/vendors/acme" } as Selection;
			const encoded = encodeSelection(selection);

			expect(encoded).toBe("%3Fvendor=%22%2Fvendors%2Facme%22");
		});

		describe("form format", () => {

			describe("basic constraints", () => {

				it("should encode empty query", () => {
					const query = {} as Selection;
					const encoded = encodeSelection(query);

					expect(encoded).toBe("");
				});

				it("should encode single constraint", () => {
					const query = { "?name": "widget" } as Selection;
					const encoded = encodeSelection(query);

					// ?name="widget"
					expect(encoded).toBe("%3Fname=%22widget%22");
				});

				it("should encode multiple constraints", () => {
					const query = { "?name": "widget", ">=price": 100 } as Selection;
					const encoded = encodeSelection(query);

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
					expect(encodeSelection(query as Selection)).toBe(encoded);
				});

			});

			describe("search operator", () => {

				it("should encode prefix word search", () => {
					const query = { "~name": "widget" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="widget"  (~ not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode search with spaces", () => {
					const query = { "~name": "red widget" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="red widget"
					expect(encoded).toBe("~name=%22red%20widget%22");
				});

			});

			describe("disjunctive matching", () => {

				it("should encode single value", () => {
					const query = { "?category": "electronics" } as Selection;
					const encoded = encodeSelection(query);

					// ?category="electronics"
					expect(encoded).toBe("%3Fcategory=%22electronics%22");
				});

				it("should encode multiple values as repeated parameters", () => {
					const query = { "?category": ["electronics", "home"] } as unknown as Selection;
					const encoded = encodeSelection(query);

					// ?category="electronics"&?category="home"
					expect(encoded).toBe("%3Fcategory=%22electronics%22&%3Fcategory=%22home%22");
				});

				it("should encode null option for undefined matching", () => {
					const query = { "?vendor": null } as unknown as Selection;
					const encoded = encodeSelection(query);

					// ?vendor=null
					expect(encoded).toBe("%3Fvendor=null");
				});

			});

			describe("conjunctive matching", () => {

				it("should encode all-match constraint", () => {
					const query = { "!tags": ["featured", "sale"] } as unknown as Selection;
					const encoded = encodeSelection(query);

					// !tags="featured"&!tags="sale"  (! not encoded - unreserved in RFC 3986)
					expect(encoded).toBe("!tags=%22featured%22&!tags=%22sale%22");
				});

			});

			describe("focus operator", () => {

				it("should encode single focus value", () => {
					const query = { "+category": "electronics" } as Selection;
					const encoded = encodeSelection(query);

					// +category="electronics"  (+ encoded to %2B — reserved sub-delim)
					expect(encoded).toBe("%2Bcategory=%22electronics%22");
				});

				it("should encode multiple focus values", () => {
					const query = { "+category": ["electronics", "home"] } as unknown as Selection;
					const encoded = encodeSelection(query);

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
					expect(encodeSelection(query as Selection)).toBe(encoded);
				});

			});

			describe("pagination", () => {

				it.each([
					["offset", { "@": 10 }, "%40=10"],
					["limit", { "#": 25 }, "%23=25"],
					["offset and limit together", { "@": 0, "#": 25 }, "%40=0&%23=25"]
				] as const)("should encode %s", (_, query, encoded) => {
					expect(encodeSelection(query as Selection)).toBe(encoded);
				});

			});

			describe("expression paths", () => {

				it("should encode dotted property paths", () => {
					const query = { ">=vendor.rating": 4 } as Selection;
					const encoded = encodeSelection(query);

					// >=vendor.rating=4
					expect(encoded).toBe("%3E%3Dvendor.rating=4");
				});

			});

			describe("expression transforms", () => {

				it("should encode constraint with single transform", () => {
					const query = { ">=year:releaseDate": 2020 } as Selection;
					const encoded = encodeSelection(query);

					// >=year:releaseDate=2020
					expect(encoded).toBe("%3E%3Dyear%3AreleaseDate=2020");
				});

				it("should encode constraint with transform pipeline", () => {
					const query = { ">=round:avg:items.price": 100 } as Selection;
					const encoded = encodeSelection(query);

					// >=round:avg:items.price=100
					expect(encoded).toBe("%3E%3Dround%3Aavg%3Aitems.price=100");
				});

				it("should encode disjunction with transform", () => {
					const query: Selection = { "?month:releaseDate": [1, 6, 12] };
					const encoded = encodeSelection(query);

					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					expect(encoded).toBe("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12");
				});

				it("should encode ordering with transform", () => {
					const query = { "^year:releaseDate": 1 } as Selection;
					const encoded = encodeSelection(query);

					// ^year:releaseDate=1
					expect(encoded).toBe("%5Eyear%3AreleaseDate=1");
				});

			});

			describe("boolean values", () => {

				it.each([
					["true value", { "?available": true }, "%3Favailable=true"],
					["false value", { "?available": false }, "%3Favailable=false"]
				] as const)("should encode %s", (_, query, encoded) => {
					expect(encodeSelection(query as Selection)).toBe(encoded);
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
					expect(encodeSelection(query as Selection)).toBe(encoded);
				});

			});

			describe("string values", () => {

				it("should encode empty string", () => {
					const query = { "~name": "" } as Selection;
					const encoded = encodeSelection(query);

					// ~name=""
					expect(encoded).toBe("~name=%22%22");
				});

				it("should encode simple string", () => {
					const query = { "~name": "widget" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="widget"
					expect(encoded).toBe("~name=%22widget%22");
				});

				it("should encode string with spaces", () => {
					const query = { "~name": "my widget" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="my widget"
					expect(encoded).toBe("~name=%22my%20widget%22");
				});

				it("should encode string with quotes", () => {
					const query = { "~name": "say \"hello\"" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="say \"hello\""  (inner quotes escaped as \")
					expect(encoded).toBe("~name=%22say%20%5C%22hello%5C%22%22");
				});

				it("should encode unicode characters", () => {
					const query = { "~name": "café" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="café"  (é encoded as UTF-8 bytes %C3%A9)
					expect(encoded).toBe("~name=%22caf%C3%A9%22");
				});

				it("should encode newlines", () => {
					const query = { "~description": "line1\nline2" } as Selection;
					const encoded = encodeSelection(query);

					// ~description="line1\nline2"
					expect(encoded).toBe("~description=%22line1%0Aline2%22");
				});

				it("should encode tabs", () => {
					const query = { "~description": "col1\tcol2" } as Selection;
					const encoded = encodeSelection(query);

					// ~description="col1\tcol2"
					expect(encoded).toBe("~description=%22col1%09col2%22");
				});

				it("should encode ampersand", () => {
					const query = { "~name": "foo&bar" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="foo&bar"  (& encoded to avoid parameter separator)
					expect(encoded).toBe("~name=%22foo%26bar%22");
				});

				it("should encode equals sign", () => {
					const query = { "~name": "a=b" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="a=b"  (= encoded to avoid key/value separator)
					expect(encoded).toBe("~name=%22a%3Db%22");
				});

				it("should encode plus sign", () => {
					const query = { "~name": "a+b" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="a+b"  (+ encoded to avoid space interpretation)
					expect(encoded).toBe("~name=%22a%2Bb%22");
				});

				it("should encode percent sign", () => {
					const query = { "~name": "100%" } as Selection;
					const encoded = encodeSelection(query);

					// ~name="100%"  (% encoded to avoid escape sequence)
					expect(encoded).toBe("~name=%22100%25%22");
				});

			});

			describe("localized content", () => {

				it("should encode single tagged string", () => {
					const query = { "?name": { "en": "Widget" } } as Selection;
					const encoded = encodeSelection(query);

					// ?name="Widget"@en
					expect(encoded).toBe("%3Fname=%22Widget%22%40en");
				});

				it("should encode multiple tagged strings", () => {
					const query = { "?name": { "en": "Widget", "fr": "Gadget" } } as Selection;
					const encoded = encodeSelection(query);

					// ?name="Widget"@en&?name="Gadget"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr");
				});

				it("should encode localised text map with multi-value tags", () => {
					const query: Selection = { "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } };
					const encoded = encodeSelection(query);

					// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
					expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr");
				});

			});

			describe("localised text map roundtrip", () => {

				it("should reconstruct single-tag single-valued map as multi-valued", () => {
					const query = { "?name": { "en": "Widget" } } as Selection;
					const encoded = encodeSelection(query);
					const decoded = decodeSelection(encoded);

					// the single-valued form normalises to multi-valued (form mode is lossy for cardinality)
					expect(decoded).toEqual({ "?name": { "en": ["Widget"] } });
				});

				it("should reconstruct multi-tag single-valued map as multi-valued", () => {
					const query = { "?name": { "en": "Widget", "fr": "Gadget" } } as Selection;
					const encoded = encodeSelection(query);
					const decoded = decodeSelection(encoded);

					// the single-valued form normalises to multi-valued (form mode is lossy for cardinality)
					expect(decoded).toEqual({ "?name": { "en": ["Widget"], "fr": ["Gadget"] } });
				});

				it("should roundtrip single-element multi-valued map", () => {
					const query = { "?name": { "en": ["Widget"] } } as Selection;
					const encoded = encodeSelection(query);
					const decoded = decodeSelection(encoded);

					expect(decoded).toEqual(query);
				});

				it("should roundtrip multi-value multi-valued map", () => {
					const query: Selection = { "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } };
					const encoded = encodeSelection(query);
					const decoded = decodeSelection(encoded);

					expect(decoded).toEqual(query);
				});

			});

		});

	});

	describe("decodeSelection()", () => {

		describe("base option", () => {

			it("should reject relative IRI base", () => {
				const encoded = "id=%22%2Fproducts%2F42%22";

				expect(() => decodeSelection(encoded, { base: "/relative/path" })).toThrow(TypeError);
			});

			it("should resolve root-relative IRI to absolute", () => {
				const encoded = "id=%22%2Fproducts%2F42%22";

				const decoded = decodeSelection(encoded, { base: "https://example.com/" });

				expect(decoded).toEqual({ "?id": "https://example.com/products/42" } as Selection);
			});

		});

		it("should use defaultBase when base option is omitted", () => {
			const encoded = "%3Fvendor=%22%2Fvendors%2Facme%22";

			expect(decodeSelection(encoded))
				.toEqual({ "?vendor": "app:/vendors/acme" } as Selection);
		});

		describe("form format decoding", () => {

			// The decoder is lenient: it accepts both canonical and shorthand forms
			// - Unencoded operators: ~name=widget (not just %7Ename=widget)
			// - Unquoted strings: name=widget (not just name="widget")
			// - Shorthand constraints: price>=100 (postfix) as well as >=price=100 (prefix)

			describe("basic parameters", () => {

				it("should decode single parameter", () => {
					const decoded = decodeSelection("name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should decode multiple parameters", () => {
					const decoded = decodeSelection("name=test&price=100");

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
					expect(decodeSelection(input)).toHaveProperty(key, value);
				});

				it.each([
					["< postfix", "price<100"],
					["> postfix", "price>50"]
				] as const)("should reject strict-comparison postfix (%s)", (_, input) => {
					expect(() => decodeSelection(input)).toThrow(Error);
				});

			});

			describe("search operator", () => {

				it.each([
					["encoded", "%7Ename=widget", "widget"],
					["unencoded", "~name=widget", "widget"],
					["spaces (%20)", "%7Ename=red%20widget", "red widget"],
					["plus as space", "%7Ename=red+widget", "red widget"]
				] as const)("should decode search (%s)", (_, input, value) => {
					expect(decodeSelection(input)).toHaveProperty("~name", value);
				});

			});

			describe("disjunctive matching", () => {

				it("should decode a single value", () => {
					const decoded = decodeSelection("category=electronics") as Record<string, unknown>;

					expect(decoded["?category"]).toBe("electronics");
				});

				it("should decode a bare wildcard as an empty option set", () => {
					// `expr=*` selects all (empty option set); the `?` operator is implied
					expect(decodeSelection("category=*")).toEqual({ "?category": [] });
				});

				it("should let a real value override a sibling wildcard", () => {
					expect(decodeSelection("category=home&category=*")).toEqual({ "?category": "home" });
				});

				it("should decode repeated parameters as array", () => {
					const decoded = decodeSelection("category=electronics&category=home") as Record<string, unknown>;

					expect(decoded["?category"]).toEqual(["electronics", "home"]);
				});

				it("should decode explicit prefix operator", () => {
					const decoded = decodeSelection("%3Fcategory=electronics");

					expect(decoded).toHaveProperty("?category");
				});

				it("should decode null for undefined matching", () => {
					const decoded = decodeSelection("%3Fvendor=null") as Record<string, unknown>;

					expect(decoded["?vendor"]).toBe(null);
				});

			});

			describe("conjunctive matching", () => {

				it.each([
					["encoded", "%21tags=featured&%21tags=sale"],
					["unencoded", "!tags=featured&!tags=sale"]
				])("should decode all-match constraint (%s)", (_, input) => {
					const decoded = decodeSelection(input) as Record<string, unknown>;

					expect(decoded["!tags"]).toEqual(["featured", "sale"]);
				});

				it.each([
					["encoded", "%21tags=premium"],
					["unencoded", "!tags=premium"]
				])("should decode explicit prefix operator (%s)", (_, input) => {
					expect(decodeSelection(input)).toHaveProperty("!tags");
				});

			});

			describe("repeated labels", () => {

				it("should collect repeated option-set operators", () => {
					const decoded = decodeSelection("%2Bcategory=a&%2Bcategory=b") as Record<string, unknown>;

					expect(decoded["+category"]).toEqual(["a", "b"]);
				});

				it.each([
					["comparison", "price>=50&price>=100"],
					["search", "%7Ename=a&%7Ename=b"],
					["sort", "%5Eprice=asc&%5Eprice=desc"],
					["pagination", "@=0&@=10"]
				] as const)("should reject a repeated single-valued operator (%s)", (_, input) => {
					expect(() => decodeSelection(input)).toThrow(Error);
				});

			});

			describe("focus ordering", () => {

				it.each([
					["encoded", "%2Bcategory=featured"],
					["unencoded", "+category=featured"]
				])("should decode focus constraint with single value (%s)", (_, input) => {
					expect(decodeSelection(input)).toHaveProperty("+category");
				});

				it("should decode focus constraint with multiple values", () => {
					// +category=featured&+category=popular
					const decoded = decodeSelection("%2Bcategory=featured&%2Bcategory=popular") as Record<string, unknown>;

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
					expect(decodeSelection(input)).toHaveProperty(key, value);
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
					expect(() => decodeSelection(input, { lenient: true })).toThrow(Error);
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
					expect(decodeSelection(input)).toHaveProperty(key, value);
				});

			});

			describe("value parsing", () => {

				it("should parse numeric strings as numbers", () => {
					const decoded = decodeSelection("%3E%3Dprice=100") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(100);
				});

				it("should parse decimal numbers", () => {
					const decoded = decodeSelection("%3E%3Dprice=99.99") as Record<string, unknown>;

					expect(decoded[">=price"]).toBe(99.99);
				});

				it("should parse negative numbers", () => {
					const decoded = decodeSelection("%5Eprice=-1") as Record<string, unknown>;

					expect(decoded["^price"]).toBe(-1);
				});

				it("should parse boolean true", () => {
					const decoded = decodeSelection("available=true") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(true);
				});

				it("should parse boolean false", () => {
					const decoded = decodeSelection("available=false") as Record<string, unknown>;

					expect(decoded["?available"]).toBe(false);
				});

				it("should preserve non-numeric strings", () => {
					const decoded = decodeSelection("%7Ename=widget") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("widget");
				});

				it("should decode percent-encoded special characters", () => {
					const decoded = decodeSelection("%7Ename=foo%26bar") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("foo&bar");
				});

				it("should decode percent-encoded unicode", () => {
					const decoded = decodeSelection("%7Ename=caf%C3%A9") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("café");
				});

				it("should decode empty value", () => {
					const decoded = decodeSelection("~name=") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("");
				});

				it("should decode equals in value", () => {
					// ~name=a=b (= in value must be encoded)
					const decoded = decodeSelection("~name=a%3Db") as Record<string, unknown>;

					expect(decoded["~name"]).toBe("a=b");
				});

				it("should parse null", () => {
					const decoded = decodeSelection("value=null") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(null);
				});

				it("should parse scientific notation", () => {
					const decoded = decodeSelection("value=1e10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1e10);
				});

				it("should parse negative exponent", () => {
					const decoded = decodeSelection("value=1.5e-10") as Record<string, unknown>;

					expect(decoded["?value"]).toBe(1.5e-10);
				});

				it("should parse quoted string preserving type", () => {
					// "123" should remain string, not convert to number
					const decoded = decodeSelection("value=%22123%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("123");
				});

				it("should parse quoted null as string", () => {
					const decoded = decodeSelection("value=%22null%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("null");
				});

				it("should decode JSON escape sequences", () => {
					// "a\nb" encoded
					const decoded = decodeSelection("value=%22a%5Cnb%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\nb");
				});

				it("should decode escaped quotes in strings", () => {
					// "a\"b" encoded
					const decoded = decodeSelection("value=%22a%5C%22b%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("a\"b");
				});

				it("should decode unicode escapes", () => {
					// "\u0041" = "A"
					const decoded = decodeSelection("value=%22%5Cu0041%22") as Record<string, unknown>;

					expect(decoded["?value"]).toBe("A");
				});

				it("should reject a non-literal comparison value", () => {
					// <price=null, >=price="x"@en: comparisons take a literal only
					expect(() => decodeSelection("%3Cprice=null")).toThrow(Error);
					expect(() => decodeSelection("%3E%3Dprice=%22x%22%40en")).toThrow(Error);
				});

				it("should reject a non-string search value", () => {
					// ~name=123, ~name=null: search takes a string only
					expect(() => decodeSelection("%7Ename=123")).toThrow(Error);
					expect(() => decodeSelection("%7Ename=null")).toThrow(Error);
				});

				it("should decode localized string", () => {
					// "Hello"@en → always reconstructed as a multi-valued map (Options are multi-valued)
					const decoded = decodeSelection("label=%22Hello%22%40en") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual({ "en": ["Hello"] });
				});

				it("should decode localized string with region", () => {
					// "Colour"@en-GB → always reconstructed as a multi-valued map (Options are multi-valued)
					const decoded = decodeSelection("label=%22Colour%22%40en-GB") as Record<string, unknown>;

					expect(decoded["?label"]).toEqual({ "en-GB": ["Colour"] });
				});

				it("should keep a non-tag @suffix as part of the plain string", () => {
					// index.md §5 `tagged = string "@" tag`, `tag = BCP 47`: a non-tag suffix does not split off
					const decoded = decodeSelection("%3Fnote=a%40_foo") as Record<string, unknown>;

					expect(decoded["?note"]).toBe("a@_foo");
				});

				it("should decode multiple tagged values into a localised text map", () => {
					// ?name="Widget"@en&?name="Gadget"@fr → always a multi-valued map
					const decoded = decodeSelection("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr") as Record<string, unknown>;

					expect(decoded["?name"]).toEqual({ "en": ["Widget"], "fr": ["Gadget"] });
				});

				it("should decode multiple values per tag into a localised text map", () => {
					// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
					const decoded = decodeSelection("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr") as Record<string, unknown>;

					expect(decoded["?name"]).toEqual({ "en": ["Widget", "Gadget"], "fr": ["Bidule"] });
				});

				it("should reject stacked language tags", () => {
					// "foo"@en@fr: a value carries at most one tag
					expect(() => decodeSelection("%3Fname=%22foo%22%40en%40fr")).toThrow(Error);
				});

				it("should reject a language tag on a non-string", () => {
					// 123@en, true@en: only strings are localised
					expect(() => decodeSelection("%3Fn=123%40en")).toThrow(Error);
					expect(() => decodeSelection("%3Fflag=true%40en")).toThrow(Error);
				});

				it.each([
					["plain then tagged", "%3Fname=plain&%3Fname=%22x%22%40en"],
					["tagged then plain", "%3Fname=%22x%22%40en&%3Fname=plain"]
				])("should reject mixing plain options and tagged values in a set (%s)", (_, input) => {
					// a set is uniformly plain options or uniformly tagged (option / localised disjunction)
					expect(() => decodeSelection(input)).toThrow(Error);
				});

			});

			describe("expression paths", () => {

				it("should decode unencoded dots in paths", () => {
					// >=vendor.rating=4 (dot unreserved, no encoding needed)
					const decoded = decodeSelection("%3E%3Dvendor.rating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

				it("should decode percent-encoded dots in paths", () => {
					// >=vendor.rating=4 (dot encoded as %2E)
					const decoded = decodeSelection("%3E%3Dvendor%2Erating=4");

					expect(decoded).toHaveProperty(">=vendor.rating", 4);
				});

			});

			describe("unicode identifiers", () => {

				it("should decode identifier with unicode letter (Greek)", () => {
					// πrice=100 (Greek pi as first character)
					const decoded = decodeSelection("%CF%80rice=100");

					expect(decoded).toHaveProperty("?πrice", 100);
				});

				it("should decode identifier with unicode letter (Cyrillic)", () => {
					// цена=100 (Russian "price")
					const decoded = decodeSelection("%D1%86%D0%B5%D0%BD%D0%B0=100");

					expect(decoded).toHaveProperty("?цена", 100);
				});

				it("should decode identifier with unicode letter (CJK)", () => {
					// 价格=100 (Chinese "price")
					const decoded = decodeSelection("%E4%BB%B7%E6%A0%BC=100");

					expect(decoded).toHaveProperty("?价格", 100);
				});

				it("should decode identifier with unicode continuation characters", () => {
					// na\u0301me=test (combining acute accent in identifier)
					const decoded = decodeSelection("na%CC%81me=test");

					expect(decoded).toHaveProperty("?na\u0301me", "test");
				});

				it("should decode path with unicode identifiers", () => {
					// >=производитель.рейтинг=4 (Russian vendor.rating)
					const decoded = decodeSelection("%3E%3D%D0%BF%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D0%B8%D1%82%D0%B5%D0%BB%D1%8C.%D1%80%D0%B5%D0%B9%D1%82%D0%B8%D0%BD%D0%B3=4");

					expect(decoded).toHaveProperty(">=производитель.рейтинг", 4);
				});

			});

			describe("expression transforms", () => {

				it("should decode constraint with single transform", () => {
					// >=year:releaseDate=2020
					const decoded = decodeSelection("%3E%3Dyear%3AreleaseDate=2020");

					expect(decoded).toHaveProperty(">=year:releaseDate", 2020);
				});

				it("should decode constraint with transform pipeline", () => {
					// >=round:avg:items.price=100
					const decoded = decodeSelection("%3E%3Dround%3Aavg%3Aitems.price=100");

					expect(decoded).toHaveProperty(">=round:avg:items.price", 100);
				});

				it("should decode disjunction with transform", () => {
					// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
					const decoded = decodeSelection("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12") as Record<string, unknown>;

					expect(decoded["?month:releaseDate"]).toEqual([1, 6, 12]);
				});

				it("should decode ordering with transform", () => {
					// ^year:releaseDate=1
					const decoded = decodeSelection("%5Eyear%3AreleaseDate=1");

					expect(decoded).toHaveProperty("^year:releaseDate", 1);
				});

			});

			describe("malformed input handling", () => {
				// The decoder is lenient with common URL parsing quirks

				it("should handle empty string", () => {
					const decoded = decodeSelection("");

					expect(decoded).toEqual({});
				});

				it("should reject a parameter without a value", () => {
					expect(() => decodeSelection("name")).toThrow(Error);
				});

				it("should handle leading ampersand", () => {
					const decoded = decodeSelection("&name=test");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle trailing ampersand", () => {
					const decoded = decodeSelection("name=test&");

					expect(decoded).toHaveProperty("?name");
				});

				it("should handle multiple ampersands", () => {
					const decoded = decodeSelection("name=test&&price=100");

					expect(decoded).toHaveProperty("?name");
					expect(decoded).toHaveProperty("?price");
				});

			});

			describe("integration", () => {

				it("should decode complex query with multiple operators", () => {
					// status=active&status=pending&~name=corp&price>=100&price<=1000&^date=desc&@=0&#=25
					const decoded = decodeSelection(
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
			const selections: Record<string, unknown>[] = [
				{},
				{ ">=price": 50, "<=price": 150 },
				{ "~name": "widget" },
				{ "?category": ["electronics", "home"] },
				{ "^price": 1, "^name": -2 },
				{ "@": 0, "#": 25 }
			];

			it.each(selections.map((s, i) => [i, s] as const))(
				"should roundtrip selection %i",
				(_, selection) => {
					const encoded = encodeSelection(selection as Selection);
					const decoded = decodeSelection(encoded);

					expect(decoded).toEqual(selection);
				}
			);

		});

		describe("lenient option", () => {

			it("should skip structural validation when lenient", () => {
				// <price=true parses cleanly but fails validation (< requires number or string)
				const encoded = "%3Cprice=true";

				expect(() => decodeSelection(encoded, { lenient: true })).not.toThrow();
			});

			it("should still throw on syntax errors when lenient", () => {
				expect(() => decodeSelection("%7Binvalid", { lenient: true })).toThrow(Error);
			});

		});

		describe("error handling", () => {

			it("should handle malformed input gracefully", () => {
				expect(() => decodeSelection("%7Binvalid")).toThrow(Error);
			});

			it("should handle truncated percent-encoding", () => {
				expect(() => decodeSelection("%")).toThrow(Error);
			});

			it("should handle invalid percent-encoding sequence", () => {
				expect(() => decodeSelection("%ZZ")).toThrow(Error);
			});

			it("should handle incomplete percent-encoding", () => {
				expect(() => decodeSelection("%2")).toThrow(Error);
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
		[{ target: "total", pipe: ["count"], path: [] }, "total=count:"]
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
