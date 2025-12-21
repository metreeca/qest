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
import { decodeBase64 } from "./base64.js";
import {
	Criterion,
	decodeCriterion,
	decodeQuery,
	encodeCriterion,
	encodeQuery,
	isBinding,
	isExpression,
	Query
} from "./query.js";


function asQuery(q: object): Query { return q as Query; }

function asCriterion(c: object): Criterion { return c as Criterion; }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("encodeQuery()", () => {

	describe("base option", () => {

		it("should accept absolute hierarchical IRI base", async () => {
			const query = asQuery({ id: "https://example.com/products/42" });

			expect(() => encodeQuery(query, { mode: "json", base: "https://example.com/" })).not.toThrow();
		});

		it("should reject relative IRI base", async () => {
			const query = asQuery({ id: "/products/42" });

			expect(() => encodeQuery(query, { mode: "json", base: "/relative/path" })).toThrow(RangeError);
		});

		it("should reject opaque IRI base", async () => {
			const query = asQuery({ id: "/products/42" });

			expect(() => encodeQuery(query, { mode: "json", base: "app:/" })).toThrow(RangeError);
		});

		it("should internalize absolute IRI to root-relative in json format", async () => {
			const query = asQuery({ id: "https://example.com/products/42" });

			const encoded = encodeQuery(query, { mode: "json", base: "https://example.com/" });

			expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "/products/42" })));
		});

		it("should internalize absolute IRI to root-relative in base64 format", async () => {
			const query = asQuery({ id: "https://example.com/products/42" });

			const encoded = encodeQuery(query, { mode: "base64", base: "https://example.com/" });

			expect(decodeQuery(encoded)).toEqual({ id: "/products/42" });
		});

		it("should internalize absolute IRI to root-relative in form format", async () => {
			const query = asQuery({ id: "https://example.com/products/42" });

			const encoded = encodeQuery(query, { mode: "form", base: "https://example.com/" });

			expect(encoded).toBe("id=%22%2Fproducts%2F42%22");
		});

		it("should preserve absolute IRI with different origin", async () => {
			const query = asQuery({ id: "https://other.com/products/42" });

			const encoded = encodeQuery(query, { mode: "json", base: "https://example.com/" });

			expect(encoded).toBe(encodeURIComponent(JSON.stringify({ id: "https://other.com/products/42" })));
		});

		it("should internalize IRIs recursively in nested structures", async () => {
			const query = asQuery({
				id: "https://example.com/products/42",
				vendor: { id: "https://example.com/vendors/acme", name: "" }
			});

			const encoded = encodeQuery(query, { mode: "json", base: "https://example.com/" });

			expect(encoded).toBe(encodeURIComponent(JSON.stringify({
				id: "/products/42",
				vendor: { id: "/vendors/acme", name: "" }
			})));
		});

	});

	describe("json format", () => {

		describe("basic queries", () => {

			it("should encode empty query", async () => {
				const query = asQuery({});
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with string property", async () => {
				const query = asQuery({ name: "" });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with number property", async () => {
				const query = asQuery({ price: 0 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with boolean property", async () => {
				const query = asQuery({ available: true });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with multiple properties", async () => {
				const query = asQuery({ id: "", name: "", price: 0 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("nested queries", () => {

			it("should encode query with nested resource", async () => {
				const query = asQuery({
					id: "",
					vendor: { id: "", name: "" }
				});
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with deeply nested resource", async () => {
				const query = asQuery({
					order: {
						customer: {
							address: { city: "" }
						}
					}
				});
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("collection queries", () => {

			it("should encode query with singleton array collection", async () => {
				const query = asQuery({
					items: [{ id: "", name: "" }]
				});
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with singleton array", async () => {
				const query = asQuery({
					items: [{}]
				});
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("constraint keys", () => {

			it("should encode less than constraint", async () => {
				const query = asQuery({ "<price": 100 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode less than or equal constraint", async () => {
				const query = asQuery({ "<=price": 100 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode greater than constraint", async () => {
				const query = asQuery({ ">price": 50 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode greater than or equal constraint", async () => {
				const query = asQuery({ ">=price": 50 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode range constraints", async () => {
				const query = asQuery({ ">=price": 50, "<=price": 150 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode stemmed word search constraint", async () => {
				const query = asQuery({ "~name": "widget" });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode disjunctive matching constraint with array", async () => {
				const query = asQuery({ "?category": ["electronics", "home"] });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode disjunctive matching constraint with null", async () => {
				const query = asQuery({ "?vendor": null });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode conjunctive matching constraint", async () => {
				const query = asQuery({ "!tags": ["featured", "sale"] });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode focus ordering constraint", async () => {
				const query = asQuery({ "*category": ["featured", "popular"] });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode sort ordering constraint with number", async () => {
				const query = asQuery({ "^price": 1 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode sort ordering constraint with negative number", async () => {
				const query = asQuery({ "^name": -2 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode sort ordering constraint with string", async () => {
				const query = asQuery({ "^price": "asc" });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pagination offset", async () => {
				const query = asQuery({ "@": 10 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pagination limit", async () => {
				const query = asQuery({ "#": 25 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pagination offset and limit", async () => {
				const query = asQuery({ "@": 0, "#": 25 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("computed expressions", () => {

			it("should encode named expression", async () => {
				const query = asQuery({ "vendorName=vendor.name": "" });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode transform expression", async () => {
				const query = asQuery({ "releaseYear=year:releaseDate": 0 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode aggregate expression", async () => {
				const query = asQuery({ "total=count:": 0 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pipeline expression", async () => {
				const query = asQuery({ "avgPrice=round:avg:price": 0 });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("localized content", () => {

			it("should encode dictionary with wildcard", async () => {
				const query = asQuery({ name: { "*": "" } });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode dictionary with specific languages", async () => {
				const query = asQuery({ name: { "en": "", "fr": "" } });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode multi-valued dictionary", async () => {
				const query = asQuery({ keywords: { "en": [""], "fr": [""] } });
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("complex queries", () => {

			it("should encode full collection query with constraints", async () => {
				const query = asQuery({
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
				});
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode faceted search query", async () => {
				const query = asQuery({
					items: [{
						"category=sample:category": "",
						"count=count:": 0,
						"^count": "desc"
					}]
				});
				const encoded = encodeQuery(query, { mode: "json" });

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("default format", () => {

			it("should use json format when no format specified", async () => {
				const query = asQuery({ name: "" });
				const encodedDefault = encodeQuery(query);
				const encodedExplicit = encodeQuery(query, { mode: "json" });

				expect(encodedDefault).toBe(encodedExplicit);
			});

		});

	});

	describe("base64 format", () => {

		describe("basic queries", () => {

			it("should encode empty query", async () => {
				const query = asQuery({});
				const encoded = encodeQuery(query, { mode: "base64" });
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

			it("should encode query with properties", async () => {
				const query = asQuery({ id: "", name: "", price: 0 });
				const encoded = encodeQuery(query, { mode: "base64" });
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

			it("should produce URL-safe output", async () => {
				const query = asQuery({ name: "" });
				const encoded = encodeQuery(query, { mode: "base64" });

				// Base64 should not contain URL-unsafe characters needing encoding
				expect(encoded).toBe(encodeURIComponent(encoded));
			});

		});

		describe("nested queries", () => {

			it("should encode nested resources", async () => {
				const query = asQuery({
					order: {
						customer: {
							address: { city: "" }
						}
					}
				});
				const encoded = encodeQuery(query, { mode: "base64" });
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

		});

		describe("constraint keys", () => {

			it("should preserve constraint key prefixes", async () => {
				const query = asQuery({
					">=price": 50,
					"<=price": 150,
					"~name": "widget",
					"?category": ["a", "b"],
					"^price": 1
				});
				const encoded = encodeQuery(query, { mode: "base64" });
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

		});

		describe("special characters", () => {

			it("should handle unicode in values", async () => {
				const query = asQuery({ "~name": "日本語" });
				const encoded = encodeQuery(query, { mode: "base64" });
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

		});

	});

	describe("form format", () => {

		describe("basic constraints", () => {

			it("should encode empty query", async () => {
				const query = asQuery({});
				const encoded = encodeQuery(query, { mode: "form" });

				expect(encoded).toBe("");
			});

			it("should encode single constraint", async () => {
				const query = asQuery({ "?name": "widget" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?name="widget"
				expect(encoded).toBe("%3Fname=%22widget%22");
			});

			it("should encode multiple constraints", async () => {
				const query = asQuery({ "?name": "widget", ">=price": 100 });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?name="widget"&>=price=100
				expect(encoded).toBe("%3Fname=%22widget%22&%3E%3Dprice=100");
			});

		});

		describe("comparison operators", () => {

			it("should encode less than", async () => {
				const query = asQuery({ "<price": 100 });
				const encoded = encodeQuery(query, { mode: "form" });

				// <price=100
				expect(encoded).toBe("%3Cprice=100");
			});

			it("should encode less than or equal", async () => {
				const query = asQuery({ "<=price": 100 });
				const encoded = encodeQuery(query, { mode: "form" });

				// <=price=100
				expect(encoded).toBe("%3C%3Dprice=100");
			});

			it("should encode greater than", async () => {
				const query = asQuery({ ">price": 50 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >price=50
				expect(encoded).toBe("%3Eprice=50");
			});

			it("should encode greater than or equal", async () => {
				const query = asQuery({ ">=price": 50 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=price=50
				expect(encoded).toBe("%3E%3Dprice=50");
			});

		});

		describe("search operator", () => {

			it("should encode stemmed word search", async () => {
				const query = asQuery({ "~name": "widget" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="widget"  (~ not encoded - unreserved in RFC 3986)
				expect(encoded).toBe("~name=%22widget%22");
			});

			it("should encode search with spaces", async () => {
				const query = asQuery({ "~name": "red widget" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="red widget"
				expect(encoded).toBe("~name=%22red%20widget%22");
			});

		});

		describe("disjunctive matching", () => {

			it("should encode single value", async () => {
				const query = asQuery({ "?category": "electronics" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?category="electronics"
				expect(encoded).toBe("%3Fcategory=%22electronics%22");
			});

			it("should encode multiple values as repeated parameters", async () => {
				const query = asQuery({ "?category": ["electronics", "home"] });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?category="electronics"&?category="home"
				expect(encoded).toBe("%3Fcategory=%22electronics%22&%3Fcategory=%22home%22");
			});

			it("should encode null option for undefined matching", async () => {
				const query = asQuery({ "?vendor": null });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?vendor=null
				expect(encoded).toBe("%3Fvendor=null");
			});

		});

		describe("conjunctive matching", () => {

			it("should encode all-match constraint", async () => {
				const query = asQuery({ "!tags": ["featured", "sale"] });
				const encoded = encodeQuery(query, { mode: "form" });

				// !tags="featured"&!tags="sale"  (! not encoded - unreserved in RFC 3986)
				expect(encoded).toBe("!tags=%22featured%22&!tags=%22sale%22");
			});

		});

		describe("focus operator", () => {

			it("should encode single focus value", async () => {
				const query = asQuery({ "*category": "electronics" });
				const encoded = encodeQuery(query, { mode: "form" });

				// *category="electronics"
				expect(encoded).toBe("*category=%22electronics%22");
			});

			it("should encode multiple focus values", async () => {
				const query = asQuery({ "*category": ["electronics", "home"] });
				const encoded = encodeQuery(query, { mode: "form" });

				// *category="electronics"&*category="home"
				expect(encoded).toBe("*category=%22electronics%22&*category=%22home%22");
			});

		});

		describe("ordering operators", () => {

			it("should encode ascending sort", async () => {
				const query = asQuery({ "^price": 1 });
				const encoded = encodeQuery(query, { mode: "form" });

				// ^price=1
				expect(encoded).toBe("%5Eprice=1");
			});

			it("should encode descending sort", async () => {
				const query = asQuery({ "^price": -1 });
				const encoded = encodeQuery(query, { mode: "form" });

				// ^price=-1
				expect(encoded).toBe("%5Eprice=-1");
			});

			it("should encode multiple sort priorities", async () => {
				const query = asQuery({ "^price": 1, "^name": -2 });
				const encoded = encodeQuery(query, { mode: "form" });

				// ^price=1&^name=-2
				expect(encoded).toBe("%5Eprice=1&%5Ename=-2");
			});

		});

		describe("pagination", () => {

			it("should encode offset", async () => {
				const query = asQuery({ "@": 10 });
				const encoded = encodeQuery(query, { mode: "form" });

				// @=10
				expect(encoded).toBe("%40=10");
			});

			it("should encode limit", async () => {
				const query = asQuery({ "#": 25 });
				const encoded = encodeQuery(query, { mode: "form" });

				// #=25
				expect(encoded).toBe("%23=25");
			});

			it("should encode offset and limit together", async () => {
				const query = asQuery({ "@": 0, "#": 25 });
				const encoded = encodeQuery(query, { mode: "form" });

				// @=0&#=25
				expect(encoded).toBe("%40=0&%23=25");
			});

		});

		describe("expression paths", () => {

			it("should encode dotted property paths", async () => {
				const query = asQuery({ ">=vendor.rating": 4 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=vendor.rating=4
				expect(encoded).toBe("%3E%3Dvendor.rating=4");
			});

		});

		describe("expression transforms", () => {

			it("should encode constraint with single transform", async () => {
				const query = asQuery({ ">=year:releaseDate": 2020 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=year:releaseDate=2020
				expect(encoded).toBe("%3E%3Dyear%3AreleaseDate=2020");
			});

			it("should encode constraint with transform pipeline", async () => {
				const query = asQuery({ ">=round:avg:items.price": 100 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=round:avg:items.price=100
				expect(encoded).toBe("%3E%3Dround%3Aavg%3Aitems.price=100");
			});

			it("should encode disjunction with transform", async () => {
				const query = asQuery({ "?month:releaseDate": [1, 6, 12] });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
				expect(encoded).toBe("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12");
			});

			it("should encode ordering with transform", async () => {
				const query = asQuery({ "^year:releaseDate": 1 });
				const encoded = encodeQuery(query, { mode: "form" });

				// ^year:releaseDate=1
				expect(encoded).toBe("%5Eyear%3AreleaseDate=1");
			});

		});

		describe("boolean values", () => {

			it("should encode true value", async () => {
				const query = asQuery({ "?available": true });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?available=true
				expect(encoded).toBe("%3Favailable=true");
			});

			it("should encode false value", async () => {
				const query = asQuery({ "?available": false });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?available=false
				expect(encoded).toBe("%3Favailable=false");
			});

		});

		describe("numeric values", () => {

			it("should encode zero", async () => {
				const query = asQuery({ "@": 0 });
				const encoded = encodeQuery(query, { mode: "form" });

				// @=0
				expect(encoded).toBe("%40=0");
			});

			it("should encode positive integer", async () => {
				const query = asQuery({ ">=price": 100 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=price=100
				expect(encoded).toBe("%3E%3Dprice=100");
			});

			it("should encode negative integer", async () => {
				const query = asQuery({ ">=balance": -50 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=balance=-50
				expect(encoded).toBe("%3E%3Dbalance=-50");
			});

			it("should encode decimal", async () => {
				const query = asQuery({ ">=price": 99.99 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=price=99.99
				expect(encoded).toBe("%3E%3Dprice=99.99");
			});

			it("should encode scientific notation", async () => {
				const query = asQuery({ ">=count": 1.5e21 });
				const encoded = encodeQuery(query, { mode: "form" });

				// >=count=1.5e+21  (+ encoded as %2B to avoid space interpretation)
				expect(encoded).toBe("%3E%3Dcount=1.5e%2B21");
			});

		});

		describe("string values", () => {

			it("should encode empty string", async () => {
				const query = asQuery({ "~name": "" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name=""
				expect(encoded).toBe("~name=%22%22");
			});

			it("should encode simple string", async () => {
				const query = asQuery({ "~name": "widget" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="widget"
				expect(encoded).toBe("~name=%22widget%22");
			});

			it("should encode string with spaces", async () => {
				const query = asQuery({ "~name": "my widget" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="my widget"
				expect(encoded).toBe("~name=%22my%20widget%22");
			});

			it("should encode string with quotes", async () => {
				const query = asQuery({ "~name": "say \"hello\"" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="say \"hello\""  (inner quotes escaped as \")
				expect(encoded).toBe("~name=%22say%20%5C%22hello%5C%22%22");
			});

			it("should encode unicode characters", async () => {
				const query = asQuery({ "~name": "café" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="café"  (é encoded as UTF-8 bytes %C3%A9)
				expect(encoded).toBe("~name=%22caf%C3%A9%22");
			});

			it("should encode newlines", async () => {
				const query = asQuery({ "~description": "line1\nline2" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~description="line1\nline2"
				expect(encoded).toBe("~description=%22line1%0Aline2%22");
			});

			it("should encode tabs", async () => {
				const query = asQuery({ "~description": "col1\tcol2" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~description="col1\tcol2"
				expect(encoded).toBe("~description=%22col1%09col2%22");
			});

			it("should encode ampersand", async () => {
				const query = asQuery({ "~name": "foo&bar" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="foo&bar"  (& encoded to avoid parameter separator)
				expect(encoded).toBe("~name=%22foo%26bar%22");
			});

			it("should encode equals sign", async () => {
				const query = asQuery({ "~name": "a=b" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="a=b"  (= encoded to avoid key/value separator)
				expect(encoded).toBe("~name=%22a%3Db%22");
			});

			it("should encode plus sign", async () => {
				const query = asQuery({ "~name": "a+b" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="a+b"  (+ encoded to avoid space interpretation)
				expect(encoded).toBe("~name=%22a%2Bb%22");
			});

			it("should encode percent sign", async () => {
				const query = asQuery({ "~name": "100%" });
				const encoded = encodeQuery(query, { mode: "form" });

				// ~name="100%"  (% encoded to avoid escape sequence)
				expect(encoded).toBe("~name=%22100%25%22");
			});

		});

		describe("localized content", () => {

			it("should encode single tagged string", async () => {
				const query = asQuery({ "?name": { "en": "Widget" } });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?name="Widget"@en
				expect(encoded).toBe("%3Fname=%22Widget%22%40en");
			});

			it("should encode multiple tagged strings", async () => {
				const query = asQuery({ "?name": { "en": "Widget", "fr": "Gadget" } });
				const encoded = encodeQuery(query, { mode: "form" });

				// ?name="Widget"@en&?name="Gadget"@fr
				expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr");
			});

			it("should encode dictionary with multi-value tags", async () => {
				const query = asQuery({ "?name": { "en": ["Widget", "Gadget"], "fr": ["Bidule"] } });
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

			expect(() => decodeQuery(encoded, { base: "/relative/path" })).toThrow(RangeError);
		});

		it("should reject opaque IRI base", async () => {
			const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

			expect(() => decodeQuery(encoded, { base: "app:/" })).toThrow(RangeError);
		});

		it("should resolve root-relative IRI to absolute in json format", async () => {
			const encoded = encodeURIComponent(JSON.stringify({ id: "/products/42" }));

			const decoded = decodeQuery(encoded, { base: "https://example.com/" });

			expect(decoded).toEqual({ id: "https://example.com/products/42" });
		});

		it("should resolve root-relative IRI to absolute in base64 format", async () => {
			const query = asQuery({ id: "/products/42" });
			const encoded = encodeQuery(query, { mode: "base64" });

			const decoded = decodeQuery(encoded, { base: "https://example.com/" });

			expect(decoded).toEqual({ id: "https://example.com/products/42" });
		});

		it("should resolve root-relative IRI to absolute in form format", async () => {
			const encoded = "id=%22%2Fproducts%2F42%22";

			const decoded = decodeQuery(encoded, { base: "https://example.com/" });

			expect(decoded).toEqual({ "?id": "https://example.com/products/42" });
		});

		it("should preserve absolute IRI", async () => {
			const encoded = encodeURIComponent(JSON.stringify({ id: "https://other.com/products/42" }));

			const decoded = decodeQuery(encoded, { base: "https://example.com/" });

			expect(decoded).toEqual({ id: "https://other.com/products/42" });
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

	describe("format auto-detection", () => {

		it("should detect and decode JSON format", async () => {
			const query = asQuery({ name: "", price: 0 });
			const encoded = encodeQuery(query, { mode: "json" });
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should detect and decode base64 format", async () => {
			const query = asQuery({ name: "", price: 0 });
			const encoded = encodeQuery(query, { mode: "base64" });
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should detect and decode form format", async () => {
			const query = asQuery({ "~name": "widget", ">=price": 50 });
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
			const query = asQuery({ id: "", name: "", price: 0, available: true });
			const encoded = encodeURIComponent(JSON.stringify(query));
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should decode nested queries", async () => {
			const query = asQuery({
				vendor: { id: "", name: "" }
			});
			const encoded = encodeURIComponent(JSON.stringify(query));
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should decode collection queries", async () => {
			const query = asQuery({
				items: [{ id: "", name: "" }]
			});
			const encoded = encodeURIComponent(JSON.stringify(query));
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should decode constraint keys", async () => {
			const query = asQuery({
				">=price": 50,
				"<=price": 150,
				"~name": "widget",
				"^price": 1,
				"@": 0,
				"#": 25
			});
			const encoded = encodeURIComponent(JSON.stringify(query));
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should decode computed expressions", async () => {
			const query = asQuery({
				"vendorName=vendor.name": "",
				"total=count:": 0
			});
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
			const query = asQuery({ id: "", name: "", price: 0 });
			const encoded = btoa(JSON.stringify(query));
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should decode nested queries", async () => {
			const query = asQuery({
				order: { customer: { address: { city: "" } } }
			});
			const encoded = btoa(JSON.stringify(query));
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should decode unicode content", async () => {
			const query = asQuery({ "~name": "日本語" });
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

			it("should decode ascending extended form", async () => {
				const decoded = decodeQuery("^price=ascending");

				expect(decoded).toHaveProperty("^price", "ascending");
			});

			it("should decode descending extended form", async () => {
				const decoded = decodeQuery("^price=descending");

				expect(decoded).toHaveProperty("^price", "descending");
			});

			it("should decode ascending keyword", async () => {
				const decoded = decodeQuery("^price=asc");

				expect(decoded).toHaveProperty("^price", "asc");
			});

			it("should decode descending keyword", async () => {
				const decoded = decodeQuery("^price=descending");

				expect(decoded).toHaveProperty("^price", "descending");
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

		const testQueries = [
			asQuery({}),
			asQuery({ name: "" }),
			asQuery({ id: "", name: "", price: 0, available: true }),
			asQuery({ vendor: { id: "", name: "" } }),
			asQuery({ items: [{ id: "", name: "" }] }),
			asQuery({ ">=price": 50, "<=price": 150 }),
			asQuery({ "~name": "widget" }),
			asQuery({ "?category": ["electronics", "home"] }),
			asQuery({ "^price": 1, "^name": -2 }),
			asQuery({ "@": 0, "#": 25 }),
			asQuery({ "vendorName=vendor.name": "" }),
			asQuery({ "total=count:": 0 })
		];

		it.each(testQueries.map((q, i) => [i, q] as const))(
			"should roundtrip query %i via json format",
			async (_, query) => {
				const encoded = encodeQuery(query, { mode: "json" });
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			}
		);

		it.each(testQueries.map((q, i) => [i, q] as const))(
			"should roundtrip query %i via base64 format",
			async (_, query) => {
				const encoded = encodeQuery(query, { mode: "base64" });
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("encodeCriterion()", () => {

	describe("projection keys", () => {

		it("should encode simple property", async () => {
			const criterion = asCriterion({ target: "name", pipe: [], path: [] });

			expect(encodeCriterion(criterion)).toBe("name");
		});

		it("should encode aliased property", async () => {
			const criterion = asCriterion({ target: "city", pipe: [], path: ["address"] });

			expect(encodeCriterion(criterion)).toBe("city=address");
		});

		it("should encode aliased property with deep path", async () => {
			const criterion = asCriterion({ target: "city", pipe: [], path: ["customer", "address"] });

			expect(encodeCriterion(criterion)).toBe("city=customer.address");
		});

		it("should encode property with transform", async () => {
			const criterion = asCriterion({ target: "releaseYear", pipe: ["year"], path: ["releaseDate"] });

			expect(encodeCriterion(criterion)).toBe("releaseYear=year:releaseDate");
		});

		it("should encode property with transform pipeline", async () => {
			const criterion = asCriterion({ target: "avgPrice", pipe: ["round", "avg"], path: ["price"] });

			expect(encodeCriterion(criterion)).toBe("avgPrice=round:avg:price");
		});

		it("should encode aggregate without path", async () => {
			const criterion = asCriterion({ target: "total", pipe: ["count"], path: [] });

			expect(encodeCriterion(criterion)).toBe("total=count:");
		});

	});

	describe("constraint keys", () => {

		it("should encode less than constraint", async () => {
			const criterion = asCriterion({ target: "<", pipe: [], path: ["price"] });

			expect(encodeCriterion(criterion)).toBe("<price");
		});

		it("should encode less than or equal constraint", async () => {
			const criterion = asCriterion({ target: "<=", pipe: [], path: ["price"] });

			expect(encodeCriterion(criterion)).toBe("<=price");
		});

		it("should encode greater than constraint", async () => {
			const criterion = asCriterion({ target: ">", pipe: [], path: ["price"] });

			expect(encodeCriterion(criterion)).toBe(">price");
		});

		it("should encode greater than or equal constraint", async () => {
			const criterion = asCriterion({ target: ">=", pipe: [], path: ["price"] });

			expect(encodeCriterion(criterion)).toBe(">=price");
		});

		it("should encode search constraint", async () => {
			const criterion = asCriterion({ target: "~", pipe: [], path: ["name"] });

			expect(encodeCriterion(criterion)).toBe("~name");
		});

		it("should encode disjunctive constraint", async () => {
			const criterion = asCriterion({ target: "?", pipe: [], path: ["category"] });

			expect(encodeCriterion(criterion)).toBe("?category");
		});

		it("should encode conjunctive constraint", async () => {
			const criterion = asCriterion({ target: "!", pipe: [], path: ["tags"] });

			expect(encodeCriterion(criterion)).toBe("!tags");
		});

		it("should encode focus constraint", async () => {
			const criterion = asCriterion({ target: "*", pipe: [], path: ["category"] });

			expect(encodeCriterion(criterion)).toBe("*category");
		});

		it("should encode order constraint", async () => {
			const criterion = asCriterion({ target: "^", pipe: [], path: ["price"] });

			expect(encodeCriterion(criterion)).toBe("^price");
		});

		it("should encode offset constraint", async () => {
			const criterion = asCriterion({ target: "@", pipe: [], path: [] });

			expect(encodeCriterion(criterion)).toBe("@");
		});

		it("should encode limit constraint", async () => {
			const criterion = asCriterion({ target: "#", pipe: [], path: [] });

			expect(encodeCriterion(criterion)).toBe("#");
		});

		it("should encode constraint with path", async () => {
			const criterion = asCriterion({ target: ">=", pipe: [], path: ["vendor", "rating"] });

			expect(encodeCriterion(criterion)).toBe(">=vendor.rating");
		});

		it("should encode constraint with transform", async () => {
			const criterion = asCriterion({ target: ">=", pipe: ["year"], path: ["releaseDate"] });

			expect(encodeCriterion(criterion)).toBe(">=year:releaseDate");
		});

	});

});

describe("decodeCriterion()", () => {

	describe("projection keys", () => {

		it("should decode simple property", async () => {
			const expected = asCriterion({ target: "name", pipe: [], path: [] });

			expect(decodeCriterion("name")).toEqual(expected);
		});

		it("should decode aliased property", async () => {
			const expected = asCriterion({ target: "city", pipe: [], path: ["address"] });

			expect(decodeCriterion("city=address")).toEqual(expected);
		});

		it("should decode aliased property with deep path", async () => {
			const expected = asCriterion({ target: "city", pipe: [], path: ["customer", "address"] });

			expect(decodeCriterion("city=customer.address")).toEqual(expected);
		});

		it("should decode property with transform", async () => {
			const expected = asCriterion({ target: "releaseYear", pipe: ["year"], path: ["releaseDate"] });

			expect(decodeCriterion("releaseYear=year:releaseDate")).toEqual(expected);
		});

		it("should decode property with transform pipeline", async () => {
			const expected = asCriterion({ target: "avgPrice", pipe: ["round", "avg"], path: ["price"] });

			expect(decodeCriterion("avgPrice=round:avg:price")).toEqual(expected);
		});

		it("should decode aggregate without path", async () => {
			const expected = asCriterion({ target: "total", pipe: ["count"], path: [] });

			expect(decodeCriterion("total=count:")).toEqual(expected);
		});

	});

	describe("constraint keys", () => {

		it("should decode less than constraint", async () => {
			const expected = asCriterion({ target: "<", pipe: [], path: ["price"] });

			expect(decodeCriterion("<price")).toEqual(expected);
		});

		it("should decode less than or equal constraint", async () => {
			const expected = asCriterion({ target: "<=", pipe: [], path: ["price"] });

			expect(decodeCriterion("<=price")).toEqual(expected);
		});

		it("should decode greater than constraint", async () => {
			const expected = asCriterion({ target: ">", pipe: [], path: ["price"] });

			expect(decodeCriterion(">price")).toEqual(expected);
		});

		it("should decode greater than or equal constraint", async () => {
			const expected = asCriterion({ target: ">=", pipe: [], path: ["price"] });

			expect(decodeCriterion(">=price")).toEqual(expected);
		});

		it("should decode search constraint", async () => {
			const expected = asCriterion({ target: "~", pipe: [], path: ["name"] });

			expect(decodeCriterion("~name")).toEqual(expected);
		});

		it("should decode disjunctive constraint", async () => {
			const expected = asCriterion({ target: "?", pipe: [], path: ["category"] });

			expect(decodeCriterion("?category")).toEqual(expected);
		});

		it("should decode conjunctive constraint", async () => {
			const expected = asCriterion({ target: "!", pipe: [], path: ["tags"] });

			expect(decodeCriterion("!tags")).toEqual(expected);
		});

		it("should decode focus constraint", async () => {
			const expected = asCriterion({ target: "*", pipe: [], path: ["category"] });

			expect(decodeCriterion("*category")).toEqual(expected);
		});

		it("should decode order constraint", async () => {
			const expected = asCriterion({ target: "^", pipe: [], path: ["price"] });

			expect(decodeCriterion("^price")).toEqual(expected);
		});

		it("should decode offset constraint", async () => {
			const expected = asCriterion({ target: "@", pipe: [], path: [] });

			expect(decodeCriterion("@")).toEqual(expected);
		});

		it("should decode limit constraint", async () => {
			const expected = asCriterion({ target: "#", pipe: [], path: [] });

			expect(decodeCriterion("#")).toEqual(expected);
		});

		it("should decode constraint with path", async () => {
			const expected = asCriterion({ target: ">=", pipe: [], path: ["vendor", "rating"] });

			expect(decodeCriterion(">=vendor.rating")).toEqual(expected);
		});

		it("should decode constraint with transform", async () => {
			const expected = asCriterion({ target: ">=", pipe: ["year"], path: ["releaseDate"] });

			expect(decodeCriterion(">=year:releaseDate")).toEqual(expected);
		});

	});

	describe("roundtrip", () => {

		it("should roundtrip simple property", async () => {
			const criterion = asCriterion({ target: "name", pipe: [], path: [] });

			expect(decodeCriterion(encodeCriterion(criterion))).toEqual(criterion);
		});

		it("should roundtrip aliased property with transform", async () => {
			const criterion = asCriterion({ target: "avgPrice", pipe: ["round", "avg"], path: ["price"] });

			expect(decodeCriterion(encodeCriterion(criterion))).toEqual(criterion);
		});

		it("should roundtrip constraint with path", async () => {
			const criterion = asCriterion({ target: ">=", pipe: [], path: ["vendor", "rating"] });

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


describe("isExpression()", () => {

	describe("valid expressions", () => {

		it("should accept simple identifier", async () => {
			expect(isExpression("name")).toBe(true);
		});

		it("should accept dotted path", async () => {
			expect(isExpression("vendor.name")).toBe(true);
		});

		it("should accept deep path", async () => {
			expect(isExpression("order.items.price")).toBe(true);
		});

		it("should accept single transform", async () => {
			expect(isExpression("year:releaseDate")).toBe(true);
		});

		it("should accept transform pipeline", async () => {
			expect(isExpression("round:avg:scores")).toBe(true);
		});

		it("should accept aggregate without path", async () => {
			expect(isExpression("count:")).toBe(true);
		});

		it("should accept transform with dotted path", async () => {
			expect(isExpression("sum:items.price")).toBe(true);
		});

		it("should accept unicode identifiers", async () => {
			expect(isExpression("prénom")).toBe(true);
			expect(isExpression("名前")).toBe(true);
		});

		it("should accept identifiers with $ and _", async () => {
			expect(isExpression("$price")).toBe(true);
			expect(isExpression("_internal")).toBe(true);
		});

		it("should accept empty string", async () => {
			expect(isExpression("")).toBe(true);
		});

	});

	describe("invalid expressions", () => {

		it("should reject non-string values", async () => {
			expect(isExpression(null)).toBe(false);
			expect(isExpression(undefined)).toBe(false);
			expect(isExpression(123)).toBe(false);
			expect(isExpression({})).toBe(false);
		});

		it("should reject leading dot", async () => {
			expect(isExpression(".name")).toBe(false);
		});

		it("should reject trailing dot", async () => {
			expect(isExpression("name.")).toBe(false);
		});

		it("should reject double dots", async () => {
			expect(isExpression("vendor..name")).toBe(false);
		});

		it("should reject leading colon", async () => {
			expect(isExpression(":name")).toBe(false);
		});

		it("should reject invalid characters", async () => {
			expect(isExpression("name@field")).toBe(false);
			expect(isExpression("name#field")).toBe(false);
		});

	});

});


describe("isBinding()", () => {

	describe("valid bindings", () => {

		it("should accept simple binding", async () => {
			expect(isBinding("name=value")).toBe(true);
		});

		it("should accept binding with dotted path", async () => {
			expect(isBinding("vendorName=vendor.name")).toBe(true);
		});

		it("should accept binding with transform", async () => {
			expect(isBinding("releaseYear=year:releaseDate")).toBe(true);
		});

		it("should accept binding with aggregate", async () => {
			expect(isBinding("total=count:")).toBe(true);
		});

		it("should accept binding with transform pipeline", async () => {
			expect(isBinding("result=round:avg:scores")).toBe(true);
		});

		it("should accept binding with empty expression", async () => {
			expect(isBinding("self=")).toBe(true);
		});

		it("should accept unicode identifiers", async () => {
			expect(isBinding("名前=prénom")).toBe(true);
		});

		it("should accept identifiers with $ and _", async () => {
			expect(isBinding("$result=_internal")).toBe(true);
		});

	});

	describe("invalid bindings", () => {

		it("should reject non-string values", async () => {
			expect(isBinding(null)).toBe(false);
			expect(isBinding(undefined)).toBe(false);
			expect(isBinding(123)).toBe(false);
			expect(isBinding({})).toBe(false);
		});

		it("should reject empty string", async () => {
			expect(isBinding("")).toBe(false);
		});

		it("should reject missing identifier", async () => {
			expect(isBinding("=value")).toBe(false);
		});

		it("should reject missing equals sign", async () => {
			expect(isBinding("name")).toBe(false);
		});

		it("should reject invalid identifier", async () => {
			expect(isBinding("123name=value")).toBe(false);
		});

		it("should reject invalid expression", async () => {
			expect(isBinding("name=.invalid")).toBe(false);
			expect(isBinding("name=:invalid")).toBe(false);
		});

	});

});
