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
import { decodeQuery, encodeQuery, Query } from "./query.js";


function asQuery(q: object): Query { return q as Query; }

function decodeBase64(encoded: string): string {
	// Convert from URL-safe base64 and add padding
	const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
	const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("encodeQuery()", () => {

	describe("json format", () => {

		describe("basic queries", () => {

			it("should encode empty query", async () => {
				const query = asQuery({});
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with string property", async () => {
				const query = asQuery({ name: "" });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with number property", async () => {
				const query = asQuery({ price: 0 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with boolean property", async () => {
				const query = asQuery({ available: true });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with multiple properties", async () => {
				const query = asQuery({ id: "", name: "", price: 0 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("nested queries", () => {

			it("should encode query with nested resource", async () => {
				const query = asQuery({
					id: "",
					vendor: { id: "", name: "" }
				});
				const encoded = encodeQuery(query, "json");

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
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("collection queries", () => {

			it("should encode query with singleton array collection", async () => {
				const query = asQuery({
					items: [{ id: "", name: "" }]
				});
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode query with empty array", async () => {
				const query = asQuery({
					items: []
				});
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("constraint keys", () => {

			it("should encode less than constraint", async () => {
				const query = asQuery({ "<price": 100 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode less than or equal constraint", async () => {
				const query = asQuery({ "<=price": 100 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode greater than constraint", async () => {
				const query = asQuery({ ">price": 50 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode greater than or equal constraint", async () => {
				const query = asQuery({ ">=price": 50 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode range constraints", async () => {
				const query = asQuery({ ">=price": 50, "<=price": 150 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode stemmed word search constraint", async () => {
				const query = asQuery({ "~name": "widget" });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode disjunctive matching constraint with array", async () => {
				const query = asQuery({ "?category": ["electronics", "home"] });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode disjunctive matching constraint with null", async () => {
				const query = asQuery({ "?vendor": null });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode conjunctive matching constraint", async () => {
				const query = asQuery({ "!tags": ["featured", "sale"] });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode focus ordering constraint", async () => {
				const query = asQuery({ "$category": ["featured", "popular"] });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode sort ordering constraint with number", async () => {
				const query = asQuery({ "^price": 1 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode sort ordering constraint with negative number", async () => {
				const query = asQuery({ "^name": -2 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode sort ordering constraint with string", async () => {
				const query = asQuery({ "^price": "asc" });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pagination offset", async () => {
				const query = asQuery({ "@": 10 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pagination limit", async () => {
				const query = asQuery({ "#": 25 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pagination offset and limit", async () => {
				const query = asQuery({ "@": 0, "#": 25 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("computed expressions", () => {

			it("should encode named expression", async () => {
				const query = asQuery({ "vendorName=vendor.name": "" });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode transform expression", async () => {
				const query = asQuery({ "releaseYear=year:releaseDate": 0 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode aggregate expression", async () => {
				const query = asQuery({ "total=count:": 0 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode pipeline expression", async () => {
				const query = asQuery({ "avgPrice=round:avg:price": 0 });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("localized content", () => {

			it("should encode dictionary with wildcard", async () => {
				const query = asQuery({ name: { "*": "" } });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode dictionary with specific languages", async () => {
				const query = asQuery({ name: { "en": "", "fr": "" } });
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

			it("should encode multi-valued dictionary", async () => {
				const query = asQuery({ keywords: { "en": [""], "fr": [""] } });
				const encoded = encodeQuery(query, "json");

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
				const encoded = encodeQuery(query, "json");

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
				const encoded = encodeQuery(query, "json");

				expect(encoded).toBe(encodeURIComponent(JSON.stringify(query)));
			});

		});

		describe("default format", () => {

			it("should use json format when no format specified", async () => {
				const query = asQuery({ name: "" });
				const encodedDefault = encodeQuery(query);
				const encodedExplicit = encodeQuery(query, "json");

				expect(encodedDefault).toBe(encodedExplicit);
			});

		});

	});

	describe("base64 format", () => {

		describe("basic queries", () => {

			it("should encode empty query", async () => {
				const query = asQuery({});
				const encoded = encodeQuery(query, "base64");
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

			it("should encode query with properties", async () => {
				const query = asQuery({ id: "", name: "", price: 0 });
				const encoded = encodeQuery(query, "base64");
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

			it("should produce URL-safe output", async () => {
				const query = asQuery({ name: "" });
				const encoded = encodeQuery(query, "base64");

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
				const encoded = encodeQuery(query, "base64");
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
				const encoded = encodeQuery(query, "base64");
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

		});

		describe("special characters", () => {

			it("should handle unicode in values", async () => {
				const query = asQuery({ "~name": "日本語" });
				const encoded = encodeQuery(query, "base64");
				const decoded = JSON.parse(decodeBase64(encoded));

				expect(decoded).toEqual(query);
			});

		});

	});

	describe("form format", () => {

		describe("basic constraints", () => {

			it("should encode empty query", async () => {
				const query = asQuery({});
				const encoded = encodeQuery(query, "form");

				expect(encoded).toBe("");
			});

			it("should encode single constraint", async () => {
				const query = asQuery({ "?name": "widget" });
				const encoded = encodeQuery(query, "form");

				// ?name="widget"
				expect(encoded).toBe("%3Fname=%22widget%22");
			});

			it("should encode multiple constraints", async () => {
				const query = asQuery({ "?name": "widget", ">=price": 100 });
				const encoded = encodeQuery(query, "form");

				// ?name="widget"&>=price=100
				expect(encoded).toBe("%3Fname=%22widget%22&%3E%3Dprice=100");
			});

		});

		describe("comparison operators", () => {

			it("should encode less than", async () => {
				const query = asQuery({ "<price": 100 });
				const encoded = encodeQuery(query, "form");

				// <price=100
				expect(encoded).toBe("%3Cprice=100");
			});

			it("should encode less than or equal", async () => {
				const query = asQuery({ "<=price": 100 });
				const encoded = encodeQuery(query, "form");

				// <=price=100
				expect(encoded).toBe("%3C%3Dprice=100");
			});

			it("should encode greater than", async () => {
				const query = asQuery({ ">price": 50 });
				const encoded = encodeQuery(query, "form");

				// >price=50
				expect(encoded).toBe("%3Eprice=50");
			});

			it("should encode greater than or equal", async () => {
				const query = asQuery({ ">=price": 50 });
				const encoded = encodeQuery(query, "form");

				// >=price=50
				expect(encoded).toBe("%3E%3Dprice=50");
			});

		});

		describe("search operator", () => {

			it("should encode stemmed word search", async () => {
				const query = asQuery({ "~name": "widget" });
				const encoded = encodeQuery(query, "form");

				// ~name="widget"  (~ not encoded - unreserved in RFC 3986)
				expect(encoded).toBe("~name=%22widget%22");
			});

			it("should encode search with spaces", async () => {
				const query = asQuery({ "~name": "red widget" });
				const encoded = encodeQuery(query, "form");

				// ~name="red widget"
				expect(encoded).toBe("~name=%22red%20widget%22");
			});

		});

		describe("disjunctive matching", () => {

			it("should encode single value", async () => {
				const query = asQuery({ "?category": "electronics" });
				const encoded = encodeQuery(query, "form");

				// ?category="electronics"
				expect(encoded).toBe("%3Fcategory=%22electronics%22");
			});

			it("should encode multiple values as repeated parameters", async () => {
				const query = asQuery({ "?category": ["electronics", "home"] });
				const encoded = encodeQuery(query, "form");

				// ?category="electronics"&?category="home"
				expect(encoded).toBe("%3Fcategory=%22electronics%22&%3Fcategory=%22home%22");
			});

			it("should encode null option for undefined matching", async () => {
				const query = asQuery({ "?vendor": null });
				const encoded = encodeQuery(query, "form");

				// ?vendor=null
				expect(encoded).toBe("%3Fvendor=null");
			});

		});

		describe("conjunctive matching", () => {

			it("should encode all-match constraint", async () => {
				const query = asQuery({ "!tags": ["featured", "sale"] });
				const encoded = encodeQuery(query, "form");

				// !tags="featured"&!tags="sale"  (! not encoded - unreserved in RFC 3986)
				expect(encoded).toBe("!tags=%22featured%22&!tags=%22sale%22");
			});

		});

		describe("focus operator", () => {

			it("should encode single focus value", async () => {
				const query = asQuery({ "$category": "electronics" });
				const encoded = encodeQuery(query, "form");

				// $category="electronics"
				expect(encoded).toBe("%24category=%22electronics%22");
			});

			it("should encode multiple focus values", async () => {
				const query = asQuery({ "$category": ["electronics", "home"] });
				const encoded = encodeQuery(query, "form");

				// $category="electronics"&$category="home"
				expect(encoded).toBe("%24category=%22electronics%22&%24category=%22home%22");
			});

		});

		describe("ordering operators", () => {

			it("should encode ascending sort", async () => {
				const query = asQuery({ "^price": 1 });
				const encoded = encodeQuery(query, "form");

				// ^price=1
				expect(encoded).toBe("%5Eprice=1");
			});

			it("should encode descending sort", async () => {
				const query = asQuery({ "^price": -1 });
				const encoded = encodeQuery(query, "form");

				// ^price=-1
				expect(encoded).toBe("%5Eprice=-1");
			});

			it("should encode multiple sort priorities", async () => {
				const query = asQuery({ "^price": 1, "^name": -2 });
				const encoded = encodeQuery(query, "form");

				// ^price=1&^name=-2
				expect(encoded).toBe("%5Eprice=1&%5Ename=-2");
			});

		});

		describe("pagination", () => {

			it("should encode offset", async () => {
				const query = asQuery({ "@": 10 });
				const encoded = encodeQuery(query, "form");

				// @=10
				expect(encoded).toBe("%40=10");
			});

			it("should encode limit", async () => {
				const query = asQuery({ "#": 25 });
				const encoded = encodeQuery(query, "form");

				// #=25
				expect(encoded).toBe("%23=25");
			});

			it("should encode offset and limit together", async () => {
				const query = asQuery({ "@": 0, "#": 25 });
				const encoded = encodeQuery(query, "form");

				// @=0&#=25
				expect(encoded).toBe("%40=0&%23=25");
			});

		});

		describe("expression paths", () => {

			it("should encode dotted property paths", async () => {
				const query = asQuery({ ">=vendor.rating": 4 });
				const encoded = encodeQuery(query, "form");

				// >=vendor.rating=4
				expect(encoded).toBe("%3E%3Dvendor.rating=4");
			});

		});

		describe("expression transforms", () => {

			it("should encode constraint with single transform", async () => {
				const query = asQuery({ ">=year:releaseDate": 2020 });
				const encoded = encodeQuery(query, "form");

				// >=year:releaseDate=2020
				expect(encoded).toBe("%3E%3Dyear%3AreleaseDate=2020");
			});

			it("should encode constraint with transform pipeline", async () => {
				const query = asQuery({ ">=round:avg:items.price": 100 });
				const encoded = encodeQuery(query, "form");

				// >=round:avg:items.price=100
				expect(encoded).toBe("%3E%3Dround%3Aavg%3Aitems.price=100");
			});

			it("should encode disjunction with transform", async () => {
				const query = asQuery({ "?month:releaseDate": [1, 6, 12] });
				const encoded = encodeQuery(query, "form");

				// ?month:releaseDate=1&?month:releaseDate=6&?month:releaseDate=12
				expect(encoded).toBe("%3Fmonth%3AreleaseDate=1&%3Fmonth%3AreleaseDate=6&%3Fmonth%3AreleaseDate=12");
			});

			it("should encode ordering with transform", async () => {
				const query = asQuery({ "^year:releaseDate": 1 });
				const encoded = encodeQuery(query, "form");

				// ^year:releaseDate=1
				expect(encoded).toBe("%5Eyear%3AreleaseDate=1");
			});

		});

		describe("boolean values", () => {

			it("should encode true value", async () => {
				const query = asQuery({ "?available": true });
				const encoded = encodeQuery(query, "form");

				// ?available=true
				expect(encoded).toBe("%3Favailable=true");
			});

			it("should encode false value", async () => {
				const query = asQuery({ "?available": false });
				const encoded = encodeQuery(query, "form");

				// ?available=false
				expect(encoded).toBe("%3Favailable=false");
			});

		});

		describe("numeric values", () => {

			it("should encode zero", async () => {
				const query = asQuery({ "@": 0 });
				const encoded = encodeQuery(query, "form");

				// @=0
				expect(encoded).toBe("%40=0");
			});

			it("should encode positive integer", async () => {
				const query = asQuery({ ">=price": 100 });
				const encoded = encodeQuery(query, "form");

				// >=price=100
				expect(encoded).toBe("%3E%3Dprice=100");
			});

			it("should encode negative integer", async () => {
				const query = asQuery({ ">=balance": -50 });
				const encoded = encodeQuery(query, "form");

				// >=balance=-50
				expect(encoded).toBe("%3E%3Dbalance=-50");
			});

			it("should encode decimal", async () => {
				const query = asQuery({ ">=price": 99.99 });
				const encoded = encodeQuery(query, "form");

				// >=price=99.99
				expect(encoded).toBe("%3E%3Dprice=99.99");
			});

			it("should encode scientific notation", async () => {
				const query = asQuery({ ">=count": 1.5e21 });
				const encoded = encodeQuery(query, "form");

				// >=count=1.5e+21  (+ encoded as %2B to avoid space interpretation)
				expect(encoded).toBe("%3E%3Dcount=1.5e%2B21");
			});

		});

		describe("string values", () => {

			it("should encode empty string", async () => {
				const query = asQuery({ "~name": "" });
				const encoded = encodeQuery(query, "form");

				// ~name=""
				expect(encoded).toBe("~name=%22%22");
			});

			it("should encode simple string", async () => {
				const query = asQuery({ "~name": "widget" });
				const encoded = encodeQuery(query, "form");

				// ~name="widget"
				expect(encoded).toBe("~name=%22widget%22");
			});

			it("should encode string with spaces", async () => {
				const query = asQuery({ "~name": "my widget" });
				const encoded = encodeQuery(query, "form");

				// ~name="my widget"
				expect(encoded).toBe("~name=%22my%20widget%22");
			});

			it("should encode string with quotes", async () => {
				const query = asQuery({ "~name": "say \"hello\"" });
				const encoded = encodeQuery(query, "form");

				// ~name="say \"hello\""  (inner quotes escaped as \")
				expect(encoded).toBe("~name=%22say%20%5C%22hello%5C%22%22");
			});

			it("should encode unicode characters", async () => {
				const query = asQuery({ "~name": "café" });
				const encoded = encodeQuery(query, "form");

				// ~name="café"  (é encoded as UTF-8 bytes %C3%A9)
				expect(encoded).toBe("~name=%22caf%C3%A9%22");
			});

			it("should encode newlines", async () => {
				const query = asQuery({ "~description": "line1\nline2" });
				const encoded = encodeQuery(query, "form");

				// ~description="line1\nline2"
				expect(encoded).toBe("~description=%22line1%0Aline2%22");
			});

			it("should encode tabs", async () => {
				const query = asQuery({ "~description": "col1\tcol2" });
				const encoded = encodeQuery(query, "form");

				// ~description="col1\tcol2"
				expect(encoded).toBe("~description=%22col1%09col2%22");
			});

			it("should encode ampersand", async () => {
				const query = asQuery({ "~name": "foo&bar" });
				const encoded = encodeQuery(query, "form");

				// ~name="foo&bar"  (& encoded to avoid parameter separator)
				expect(encoded).toBe("~name=%22foo%26bar%22");
			});

			it("should encode equals sign", async () => {
				const query = asQuery({ "~name": "a=b" });
				const encoded = encodeQuery(query, "form");

				// ~name="a=b"  (= encoded to avoid key/value separator)
				expect(encoded).toBe("~name=%22a%3Db%22");
			});

			it("should encode plus sign", async () => {
				const query = asQuery({ "~name": "a+b" });
				const encoded = encodeQuery(query, "form");

				// ~name="a+b"  (+ encoded to avoid space interpretation)
				expect(encoded).toBe("~name=%22a%2Bb%22");
			});

			it("should encode percent sign", async () => {
				const query = asQuery({ "~name": "100%" });
				const encoded = encodeQuery(query, "form");

				// ~name="100%"  (% encoded to avoid escape sequence)
				expect(encoded).toBe("~name=%22100%25%22");
			});

		});

		describe("localized content", () => {

			it("should encode single tagged string", async () => {
				const query = asQuery({ "?name": { "en": "Widget" } });
				const encoded = encodeQuery(query, "form");

				// ?name="Widget"@en
				expect(encoded).toBe("%3Fname=%22Widget%22%40en");
			});

			it("should encode multiple tagged strings", async () => {
				const query = asQuery({ "?name": { "en": "Widget", "fr": "Gadget" } });
				const encoded = encodeQuery(query, "form");

				// ?name="Widget"@en&?name="Gadget"@fr
				expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40fr");
			});

			it("should encode dictionary with multi-value tags", async () => {
				const query = asQuery({ "?name": { "en": ["Widget", "Gadget"], "fr": "Bidule" } });
				const encoded = encodeQuery(query, "form");

				// ?name="Widget"@en&?name="Gadget"@en&?name="Bidule"@fr
				expect(encoded).toBe("%3Fname=%22Widget%22%40en&%3Fname=%22Gadget%22%40en&%3Fname=%22Bidule%22%40fr");
			});

		});

	});

});

describe("decodeQuery()", () => {

	describe("format auto-detection", () => {

		it("should detect and decode JSON format", async () => {
			const query = asQuery({ name: "", price: 0 });
			const encoded = encodeQuery(query, "json");
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should detect and decode base64 format", async () => {
			const query = asQuery({ name: "", price: 0 });
			const encoded = encodeQuery(query, "base64");
			const decoded = decodeQuery(encoded);

			expect(decoded).toEqual(query);
		});

		it("should detect and decode form format", async () => {
			const query = asQuery({ "~name": "widget", ">=price": 50 });
			const encoded = encodeQuery(query, "form");
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
			const encoded = encodeQuery(query, "base64");
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
				// $category=featured
				const decoded = decodeQuery("%24category=featured");

				expect(decoded).toHaveProperty("$category");
			});

			it("should decode focus constraint with single value unencoded", async () => {
				const decoded = decodeQuery("$category=featured");

				expect(decoded).toHaveProperty("$category");
			});

			it("should decode focus constraint with multiple values encoded", async () => {
				// $category=featured&$category=popular
				const decoded = decodeQuery("%24category=featured&%24category=popular") as Record<string, unknown>;

				expect(decoded["$category"]).toEqual(["featured", "popular"]);
			});

			it("should decode focus constraint with multiple values unencoded", async () => {
				const decoded = decodeQuery("$category=featured&$category=popular") as Record<string, unknown>;

				expect(decoded["$category"]).toEqual(["featured", "popular"]);
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
				const encoded = encodeQuery(query, "json");
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			}
		);

		it.each(testQueries.map((q, i) => [i, q] as const))(
			"should roundtrip query %i via base64 format",
			async (_, query) => {
				const encoded = encodeQuery(query, "base64");
				const decoded = decodeQuery(encoded);

				expect(decoded).toEqual(query);
			}
		);

	});

	describe("error handling", () => {

		it("should handle malformed JSON gracefully", async () => {
			expect(() => decodeQuery(encodeURIComponent("{invalid"))).toThrow();
		});

		it("should handle invalid base64 gracefully", async () => {
			// Invalid base64 that looks like base64 falls through to form parsing
			// This behavior allows graceful degradation
			const decoded = decodeQuery("eyJpbnZhbGlk"); // valid base64 but invalid JSON
			expect(decoded).toBeDefined(); // Parsed as form format
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
			// { target: "name", pipe: [], path: [] } => "name"
		});

		it("should encode property with path", async () => {
			// { target: "city", pipe: [], path: ["address"] } => "address.city"
		});

		it("should encode property with deep path", async () => {
			// { target: "city", pipe: [], path: ["customer", "address"] } => "customer.address.city"
		});

		it("should encode aliased property", async () => {
			// { target: "vendorName", pipe: [], path: ["vendor", "name"] } => "vendorName=vendor.name"
		});

		it("should encode property with transform", async () => {
			// { target: "releaseYear", pipe: ["year"], path: ["releaseDate"] } => "releaseYear=year:releaseDate"
		});

		it("should encode property with transform pipeline", async () => {
			// { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] } => "avgPrice=round:avg:price"
		});

		it("should encode aggregate without path", async () => {
			// { target: "total", pipe: ["count"], path: [] } => "total=count:"
		});

	});

	describe("constraint keys", () => {

		it("should encode less than constraint", async () => {
			// { target: "<", pipe: [], path: ["price"] } => "<price"
		});

		it("should encode less than or equal constraint", async () => {
			// { target: "<=", pipe: [], path: ["price"] } => "<=price"
		});

		it("should encode greater than constraint", async () => {
			// { target: ">", pipe: [], path: ["price"] } => ">price"
		});

		it("should encode greater than or equal constraint", async () => {
			// { target: ">=", pipe: [], path: ["price"] } => ">=price"
		});

		it("should encode search constraint", async () => {
			// { target: "~", pipe: [], path: ["name"] } => "~name"
		});

		it("should encode disjunctive constraint", async () => {
			// { target: "?", pipe: [], path: ["category"] } => "?category"
		});

		it("should encode conjunctive constraint", async () => {
			// { target: "!", pipe: [], path: ["tags"] } => "!tags"
		});

		it("should encode focus constraint", async () => {
			// { target: "$", pipe: [], path: ["category"] } => "$category"
		});

		it("should encode order constraint", async () => {
			// { target: "^", pipe: [], path: ["price"] } => "^price"
		});

		it("should encode offset constraint", async () => {
			// { target: "@", pipe: [], path: [] } => "@"
		});

		it("should encode limit constraint", async () => {
			// { target: "#", pipe: [], path: [] } => "#"
		});

		it("should encode constraint with path", async () => {
			// { target: ">=", pipe: [], path: ["vendor", "rating"] } => ">=vendor.rating"
		});

		it("should encode constraint with transform", async () => {
			// { target: ">=", pipe: ["year"], path: ["releaseDate"] } => ">=year:releaseDate"
		});

	});

});

describe("decodeCriterion()", () => {

	describe("projection keys", () => {

		it("should decode simple property", async () => {
			// "name" => { target: "name", pipe: [], path: [] }
		});

		it("should decode property with path", async () => {
			// "address.city" => { target: "city", pipe: [], path: ["address"] }
		});

		it("should decode property with deep path", async () => {
			// "customer.address.city" => { target: "city", pipe: [], path: ["customer", "address"] }
		});

		it("should decode aliased property", async () => {
			// "vendorName=vendor.name" => { target: "vendorName", pipe: [], path: ["vendor", "name"] }
		});

		it("should decode property with transform", async () => {
			// "releaseYear=year:releaseDate" => { target: "releaseYear", pipe: ["year"], path: ["releaseDate"] }
		});

		it("should decode property with transform pipeline", async () => {
			// "avgPrice=round:avg:price" => { target: "avgPrice", pipe: ["round", "avg"], path: ["price"] }
		});

		it("should decode aggregate without path", async () => {
			// "total=count:" => { target: "total", pipe: ["count"], path: [] }
		});

	});

	describe("constraint keys", () => {

		it("should decode less than constraint", async () => {
			// "<price" => { target: "<", pipe: [], path: ["price"] }
		});

		it("should decode less than or equal constraint", async () => {
			// "<=price" => { target: "<=", pipe: [], path: ["price"] }
		});

		it("should decode greater than constraint", async () => {
			// ">price" => { target: ">", pipe: [], path: ["price"] }
		});

		it("should decode greater than or equal constraint", async () => {
			// ">=price" => { target: ">=", pipe: [], path: ["price"] }
		});

		it("should decode search constraint", async () => {
			// "~name" => { target: "~", pipe: [], path: ["name"] }
		});

		it("should decode disjunctive constraint", async () => {
			// "?category" => { target: "?", pipe: [], path: ["category"] }
		});

		it("should decode conjunctive constraint", async () => {
			// "!tags" => { target: "!", pipe: [], path: ["tags"] }
		});

		it("should decode focus constraint", async () => {
			// "$category" => { target: "$", pipe: [], path: ["category"] }
		});

		it("should decode order constraint", async () => {
			// "^price" => { target: "^", pipe: [], path: ["price"] }
		});

		it("should decode offset constraint", async () => {
			// "@" => { target: "@", pipe: [], path: [] }
		});

		it("should decode limit constraint", async () => {
			// "#" => { target: "#", pipe: [], path: [] }
		});

		it("should decode constraint with path", async () => {
			// ">=vendor.rating" => { target: ">=", pipe: [], path: ["vendor", "rating"] }
		});

		it("should decode constraint with transform", async () => {
			// ">=year:releaseDate" => { target: ">=", pipe: ["year"], path: ["releaseDate"] }
		});

	});

	describe("roundtrip", () => {

		it("should roundtrip simple property", async () => {
			// decodeCriterion(encodeCriterion(criterion)) === criterion
		});

		it("should roundtrip aliased property with transform", async () => {
			// decodeCriterion(encodeCriterion(criterion)) === criterion
		});

		it("should roundtrip constraint with path", async () => {
			// decodeCriterion(encodeCriterion(criterion)) === criterion
		});

	});

});
