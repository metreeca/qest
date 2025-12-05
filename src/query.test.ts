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
import { Expression, Query } from "./query.js";


describe("Query()", () => {

	describe("factory", () => {

		it("should create immutable query object", () => {
			const query = Query({ name: "string" });
			expect(() => {
				(query as any).name = "other";
			}).toThrow();
		});

		it("should create query with immutable nested objects", () => {
			const query = Query({
				user: { name: "string" }
			});
			expect(() => {
				(query.user as any).email = "string";
			}).toThrow();
		});

		it("should create query with immutable arrays", () => {
			const query = Query({
				items: [{ price: "number" }]
			});
			expect(() => {
				(query.items as any).push({ name: "string" });
			}).toThrow();
		});

		it("should create query with immutable dictionary values", () => {
			const query = Query({
				title: { en: "string", it: "string" }
			});
			expect(() => {
				(query.title as any).de = "string";
			}).toThrow();
		});

		it("should isolate result from input mutations", () => {
			const input = { name: "string", price: "number" };
			const query = Query(input);

			// Mutating input shouldn't affect the frozen result
			(input as any).email = "string";
			delete (input as { name: string; price?: string }).price;

			expect(query).toEqual({ name: "string", price: "number" });
		});

		it("should preserve query structure with simple keys", () => {
			const input = { name: "string", age: "number" };
			const query = Query(input);
			expect(query).toEqual({ name: "string", age: "number" });
		});

		it("should preserve query structure with computed keys", () => {
			const input = { "total=sum:items.price": "number" };
			const query = Query(input);
			expect(query).toEqual({ "total=sum:items.price": "number" });
		});

		it("should preserve query structure with nested arrays", () => {
			const input = {
				items: [
					{ name: "string" },
					{ ">=price": 10 }
				]
			};
			const query = Query(input);
			expect(query).toEqual(input);
		});

		it("should preserve nested query structure", () => {
			const input = {
				order: {
					customer: "string",
					items: [{ name: "string", price: "number" }]
				}
			};
			const query = Query(input);
			expect(query).toEqual(input);
		});

		describe("expression validation in query keys", () => {

			describe("valid simple property keys", () => {

				it("should accept valid identifier keys", () => {
					expect(() => Query({ name: "string" })).not.toThrow();
					expect(() => Query({ _private: "string" })).not.toThrow();
					expect(() => Query({ $ref: "string" })).not.toThrow();
					expect(() => Query({ value123: "number" })).not.toThrow();
				});

				it("should accept reserved keyword keys", () => {
					expect(() => Query({ class: "string" })).not.toThrow();
					expect(() => Query({ function: "string" })).not.toThrow();
					expect(() => Query({ return: "string" })).not.toThrow();
				});

				it("should accept multiple simple keys", () => {
					expect(() => Query({
						name: "string",
						age: "number",
						active: "boolean"
					})).not.toThrow();
				});

			});

			describe("valid computed property keys", () => {

				it("should accept path-only computed keys", () => {
					expect(() => Query({ "userName=user.name": "string" })).not.toThrow();
					expect(() => Query({ "firstName=['first-name']": "string" })).not.toThrow();
				});

				it("should accept transform computed keys", () => {
					expect(() => Query({ "total=sum:items.price": "number" })).not.toThrow();
					expect(() => Query({ "count=count:items": "number" })).not.toThrow();
					expect(() => Query({ "avg=avg:scores": "number" })).not.toThrow();
				});

				it("should accept multiple transform computed keys", () => {
					expect(() => Query({
						"totalRounded=sum:round:prices": "number"
					})).not.toThrow();
					expect(() => Query({
						"avgYear=avg:year:dates": "number"
					})).not.toThrow();
				});

				it("should accept computed keys with bracket notation", () => {
					expect(() => Query({
						"contentType=['content-type']": "string"
					})).not.toThrow();
					expect(() => Query({
						"id=data['@id']": "string"
					})).not.toThrow();
				});

				it("should accept computed keys with empty path", () => {
					expect(() => Query({ "total=sum:": "number" })).not.toThrow();
					expect(() => Query({ "value=": "string" })).not.toThrow();
				});

				it("should accept mixed simple and computed keys", () => {
					expect(() => Query({
						name: "string",
						"total=sum:items.price": "number",
						age: "number"
					})).not.toThrow();
				});

			});

			describe("invalid property keys", () => {

				it("should reject keys starting with digits", () => {
					expect(() => Query({ "123abc": "string" })).toThrow();
					expect(() => Query({ "9lives": "string" })).toThrow();
				});

				it("should reject keys with invalid characters in dot notation", () => {
					expect(() => Query({ "first-name": "string" })).toThrow();
					expect(() => Query({ "my property": "string" })).toThrow();
					expect(() => Query({ "@id": "string" })).toThrow();
				});

				it("should reject invalid computed key syntax", () => {
					expect(() => Query({ "name=user..name": "string" })).toThrow();
					expect(() => Query({ "total=:items": "string" })).toThrow();
					expect(() => Query({ "=value": "string" })).toThrow();
				});

			});

		});

		describe("expression validation in specs operators", () => {

			describe("comparison operators", () => {

				it("should validate expressions in < operator", () => {
					expect(() => Query({ items: [{ "<price": 100 }] })).not.toThrow();
					expect(() => Query({ items: [{ "<user.age": 30 }] })).not.toThrow();
					expect(() => Query({ items: [{ "<['max-value']": 50 }] })).not.toThrow();
				});

				it("should accept Literal for < operator", () => {
					expect(() => Query({ items: [{ "<count": 10 }] })).not.toThrow();
					expect(() => Query({ items: [{ "<enabled": true }] })).not.toThrow();
					expect(() => Query({ items: [{ "<name": "value" }] })).not.toThrow();
				});

				it("should validate expressions in > operator", () => {
					expect(() => Query({ items: [{ ">price": 10 }] })).not.toThrow();
					expect(() => Query({ items: [{ ">items.count": 5 }] })).not.toThrow();
				});

				it("should accept Literal for > operator", () => {
					expect(() => Query({ items: [{ ">score": 50 }] })).not.toThrow();
					expect(() => Query({ items: [{ ">active": false }] })).not.toThrow();
					expect(() => Query({ items: [{ ">code": "ABC" }] })).not.toThrow();
				});

				it("should validate expressions in <= operator", () => {
					expect(() => Query({ items: [{ "<=price": 100 }] })).not.toThrow();
					expect(() => Query({ items: [{ "<=round:price": 100 }] })).not.toThrow();
				});

				it("should accept Literal for <= operator", () => {
					expect(() => Query({ items: [{ "<=limit": 100 }] })).not.toThrow();
					expect(() => Query({ items: [{ "<=flag": true }] })).not.toThrow();
					expect(() => Query({ items: [{ "<=id": "xyz" }] })).not.toThrow();
				});

				it("should validate expressions in >= operator", () => {
					expect(() => Query({ items: [{ ">=price": 10 }] })).not.toThrow();
					expect(() => Query({ items: [{ ">=year:created": 2020 }] })).not.toThrow();
				});

				it("should accept Literal for >= operator", () => {
					expect(() => Query({ items: [{ ">=min": 5 }] })).not.toThrow();
					expect(() => Query({ items: [{ ">=valid": false }] })).not.toThrow();
					expect(() => Query({ items: [{ ">=key": "start" }] })).not.toThrow();
				});

				it("should reject invalid expressions in comparison operators", () => {
					expect(() => Query({ items: [{ "<first-name": "test" }] })).toThrow();
					expect(() => Query({ items: [{ ">123abc": 10 }] })).toThrow();
					expect(() => Query({ items: [{ "<=user..name": "test" }] })).toThrow();
				});

				it("should reject non-literal values for < operator", () => {
					expect(() => Query({ items: [{ "<price": ["100"] }] } as any)).toThrow();
					expect(() => Query({ items: [{ "<price": { max: 100 } }] } as any)).toThrow();
				});

				it("should reject non-literal values for > operator", () => {
					expect(() => Query({ items: [{ ">price": ["10"] }] } as any)).toThrow();
					expect(() => Query({ items: [{ ">price": { min: 10 } }] } as any)).toThrow();
				});

				it("should reject non-literal values for <= operator", () => {
					expect(() => Query({ items: [{ "<=price": ["100"] }] } as any)).toThrow();
					expect(() => Query({ items: [{ "<=price": { max: 100 } }] } as any)).toThrow();
				});

				it("should reject non-literal values for >= operator", () => {
					expect(() => Query({ items: [{ ">=price": ["10"] }] } as any)).toThrow();
					expect(() => Query({ items: [{ ">=price": { min: 10 } }] } as any)).toThrow();
				});

			});

			describe("text search operator", () => {

				it("should validate expressions in ~ operator", () => {
					expect(() => Query({ items: [{ "~title": "search" }] })).not.toThrow();
					expect(() => Query({ items: [{ "~user.bio": "keyword" }] })).not.toThrow();
					expect(() => Query({ items: [{ "~['description']": "text" }] })).not.toThrow();
				});

				it("should reject invalid expressions in ~ operator", () => {
					expect(() => Query({ items: [{ "~first-name": "search" }] })).toThrow();
					expect(() => Query({ items: [{ "~@title": "search" }] })).toThrow();
				});

				it("should reject non-string values for ~ operator", () => {
					expect(() => Query({ items: [{ "~title": 123 }] } as any)).toThrow();
					expect(() => Query({ items: [{ "~title": true }] } as any)).toThrow();
					expect(() => Query({ items: [{ "~title": ["search"] }] } as any)).toThrow();
				});

			});

			describe("matching operators", () => {

				it("should validate expressions in ? operator", () => {
					expect(() => Query({ items: [{ "?category": ["A", "B"] }] })).not.toThrow();
					expect(() => Query({ items: [{ "?user.role": "admin" }] })).not.toThrow();
					expect(() => Query({ items: [{ "?['tag']": null }] })).not.toThrow();
				});

				it("should accept Options for ? operator", () => {
					expect(() => Query({ items: [{ "?status": null }] })).not.toThrow();
					expect(() => Query({ items: [{ "?count": 5 }] })).not.toThrow();
					expect(() => Query({ items: [{ "?active": true }] })).not.toThrow();
					expect(() => Query({ items: [{ "?name": "test" }] })).not.toThrow();
					expect(() => Query({ items: [{ "?tags": ["a", "b"] }] })).not.toThrow();
					expect(() => Query({ items: [{ "?tags": [null, "a"] }] })).not.toThrow();
					expect(() => Query({ items: [{ "?label": { string: "text" } }] })).not.toThrow();
					expect(() => Query({ items: [{ "?label": { strings: ["a", "b"] } }] })).not.toThrow();
					expect(() => Query({ items: [{ "?items": [{ name: "A" }] }] })).not.toThrow();
					expect(() => Query({ items: [{ "?items": [{ id: 1, name: "A" }] }] })).not.toThrow();
				});

				it("should validate expressions in ! operator", () => {
					expect(() => Query({ items: [{ "!tags": ["red", "blue"] }] })).not.toThrow();
					expect(() => Query({ items: [{ "!user.permissions": ["read"] }] })).not.toThrow();
				});

				it("should accept Options for ! operator", () => {
					expect(() => Query({ items: [{ "!status": null }] })).not.toThrow();
					expect(() => Query({ items: [{ "!count": 10 }] })).not.toThrow();
					expect(() => Query({ items: [{ "!enabled": false }] })).not.toThrow();
					expect(() => Query({ items: [{ "!type": "user" }] })).not.toThrow();
					expect(() => Query({ items: [{ "!ids": [1, 2, 3] }] })).not.toThrow();
					expect(() => Query({ items: [{ "!ids": [null, 5] }] })).not.toThrow();
					expect(() => Query({ items: [{ "!title": { string: "name" } }] })).not.toThrow();
					expect(() => Query({ items: [{ "!title": { strings: ["x", "y"] } }] })).not.toThrow();
					expect(() => Query({ items: [{ "!products": [{ sku: "ABC" }] }] })).not.toThrow();
					expect(() => Query({ items: [{ "!products": [{ id: 1, sku: "ABC" }] }] })).not.toThrow();
				});

				it("should reject invalid expressions in matching operators", () => {
					expect(() => Query({ items: [{ "?first-name": ["test"] }] })).toThrow();
					expect(() => Query({ items: [{ "!@type": ["test"] }] })).toThrow();
				});

			});

			describe("ordering operators", () => {

				it("should validate expressions in $ operator", () => {
					expect(() => Query({ items: [{ "$category": ["A", "B"] }] })).not.toThrow();
					expect(() => Query({ items: [{ "$user.role": "admin" }] })).not.toThrow();
				});

				it("should accept Options for $ operator", () => {
					expect(() => Query({ items: [{ "$priority": null }] })).not.toThrow();
					expect(() => Query({ items: [{ "$index": 0 }] })).not.toThrow();
					expect(() => Query({ items: [{ "$visible": true }] })).not.toThrow();
					expect(() => Query({ items: [{ "$type": "primary" }] })).not.toThrow();
					expect(() => Query({ items: [{ "$status": ["new", "active"] }] })).not.toThrow();
					expect(() => Query({ items: [{ "$status": [null, "pending"] }] })).not.toThrow();
					expect(() => Query({ items: [{ "$name": { string: "title" } }] })).not.toThrow();
					expect(() => Query({ items: [{ "$name": { strings: ["a", "b"] } }] })).not.toThrow();
					expect(() => Query({ items: [{ "$categories": [{ code: "A" }] }] })).not.toThrow();
					expect(() => Query({ items: [{ "$categories": [{ id: 1, code: "A" }] }] })).not.toThrow();
				});

				it("should validate expressions in ^ operator", () => {
					expect(() => Query({ items: [{ "^name": "asc" }] })).not.toThrow();
					expect(() => Query({ items: [{ "^price": 1 }] })).not.toThrow();
					expect(() => Query({ items: [{ "^created": -1 }] })).not.toThrow();
					expect(() => Query({ items: [{ "^user.age": "desc" }] })).not.toThrow();
					expect(() => Query({ items: [{ "^rating": "ascending" }] })).not.toThrow();
					expect(() => Query({ items: [{ "^score": "descending" }] })).not.toThrow();
				});

				it("should reject invalid expressions in ordering operators", () => {
					expect(() => Query({ items: [{ "$first-name": ["test"] }] })).toThrow();
					expect(() => Query({ items: [{ "^@order": 1 }] })).toThrow();
				});

				it("should reject invalid values for ^ operator", () => {
					expect(() => Query({ items: [{ "^name": "invalid" }] } as any)).toThrow();
					expect(() => Query({ items: [{ "^price": true }] } as any)).toThrow();
					expect(() => Query({ items: [{ "^created": ["asc"] }] } as any)).toThrow();
				});

			});

			describe("pagination operators", () => {

				it("should accept pagination operators without expressions", () => {
					expect(() => Query({ items: [{ "@": 10 }] })).not.toThrow();
					expect(() => Query({ items: [{ "#": 20 }] })).not.toThrow();
					expect(() => Query({ items: [{ "@": 0, "#": 50 }] })).not.toThrow();
				});

				it("should reject non-number values for @ operator", () => {
					expect(() => Query({ items: [{ "@": "10" }] })).toThrow();
					expect(() => Query({ items: [{ "@": true }] })).toThrow();
				});

				it("should reject non-number values for # operator", () => {
					expect(() => Query({ items: [{ "#": "20" }] })).toThrow();
					expect(() => Query({ items: [{ "#": false }] })).toThrow();
				});

			});

			describe("complex specs with multiple operators", () => {

				it("should validate expressions in combined operators", () => {
					expect(() => Query({
						items: [{
							">=price": 10,
							"<=price": 100,
							"~title": "search",
							"?category": ["A", "B"],
							"^name": "asc",
							"@": 0,
							"#": 20
						}]
					})).not.toThrow();
				});

				it("should validate expressions with transforms in specs", () => {
					expect(() => Query({
						items: [{
							">=sum:items.price": 100,
							"<=avg:scores": 90,
							"^round:rating": 1
						}]
					})).not.toThrow();
				});

			});

		});

		describe("recursive validation", () => {

			describe("nested query objects", () => {

				it("should validate simple nested queries", () => {
					expect(() => Query({
						user: [{ name: "string", email: "string" }]
					})).not.toThrow();
				});

				it("should validate deeply nested queries", () => {
					expect(() => Query({
						order: [{
							customer: [{
								address: [{ city: "string", country: "string" }]
							}]
						}]
					})).not.toThrow();
				});

				it("should validate nested queries with computed keys", () => {
					expect(() => Query({
						items: [{
							"total=sum:price": "number",
							"count=count:": "number"
						}]
					})).not.toThrow();
				});

				it("should reject invalid expressions in nested queries", () => {
					expect(() => Query({
						user: [{ "first-name": "string" }]
					})).toThrow();
				});

			});

			describe("nested specs objects", () => {

				it("should validate simple nested specs", () => {
					expect(() => Query({
						items: [{ ">=price": 10, "<=price": 100 }]
					})).not.toThrow();
				});

				it("should validate deeply nested specs", () => {
					expect(() => Query({
						orders: [{
							items: [{
								">=price": 10,
								"^name": "asc"
							}]
						}]
					})).not.toThrow();
				});

				it("should reject invalid expressions in nested specs", () => {
					expect(() => Query({
						items: [{ ">=first-name": "test" }]
					})).toThrow();
				});

			});

			describe("mixed query and specs in arrays", () => {

				it("should validate mixed query and specs", () => {
					expect(() => Query({
						items: [
							{ name: "string", price: "number" },
							{ ">=price": 10, "^name": "asc" }
						]
					})).not.toThrow();
				});

				it("should validate multiple levels of mixing", () => {
					expect(() => Query({
						orders: [
							{ customer: "string" },
							{ ">=total": 100 },
							{
								items: [
									{ name: "string" },
									{ ">=price": 10 }
								]
							}
						]
					})).not.toThrow();
				});

			});

			describe("deep recursive structures", () => {

				it("should validate 5 levels of nesting", () => {
					expect(() => Query({
						level1: [{
							level2: [{
								level3: [{
									level4: [{
										level5: [{ name: "string" }]
									}]
								}]
							}]
						}]
					})).not.toThrow();
				});

				it("should validate expressions at all nesting levels", () => {
					expect(() => Query({
						"total=sum:level1.value": "number",
						level1: [{
							"avg=avg:level2.value": "number",
							level2: [{
								"count=count:level3": "number",
								level3: [{ name: "string" }]
							}]
						}]
					})).not.toThrow();
				});

				it("should validate specs at all nesting levels", () => {
					expect(() => Query({
						level1: [
							{ ">=value": 10 },
							{
								level2: [
									{ "^name": "asc" },
									{
										level3: [{ "~title": "search" }]
									}
								]
							}
						]
					})).not.toThrow();
				});

				it("should reject invalid expressions at any nesting level", () => {
					expect(() => Query({
						level1: [{
							level2: [{
								level3: [{ "first-name": "string" }]
							}]
						}]
					})).toThrow();

					expect(() => Query({
						level1: [{
							level2: [{ ">=first-name": "test" }]
						}]
					})).toThrow();
				});

			});

		});

		describe("value type validation", () => {

			describe("literal values", () => {

				it("should accept boolean values", () => {
					expect(() => Query({ active: true })).not.toThrow();
					expect(() => Query({ enabled: false })).not.toThrow();
				});

				it("should accept number values", () => {
					expect(() => Query({ age: 25 })).not.toThrow();
					expect(() => Query({ price: 99.99 })).not.toThrow();
					expect(() => Query({ count: 0 })).not.toThrow();
				});

				it("should accept string values", () => {
					expect(() => Query({ name: "test" })).not.toThrow();
					expect(() => Query({ description: "" })).not.toThrow();
				});

			});

			describe("dictionary values", () => {

				it("should accept dictionary with string values", () => {
					expect(() => Query({
						title: { en: "English", it: "Italiano" }
					})).not.toThrow();
				});

				it("should accept dictionary with array values", () => {
					expect(() => Query({
						tags: { en: ["red", "blue"], it: ["rosso", "blu"] }
					})).not.toThrow();
				});

				it("should accept nested dictionary structures", () => {
					expect(() => Query({
						content: [{
							title: { en: "Title", it: "Titolo" }
						}]
					})).not.toThrow();
				});

			});

			describe("resource values", () => {

				it("should accept nested resource objects", () => {
					expect(() => Query({
						user: { name: "string", age: "number" }
					})).not.toThrow();
				});

				it("should accept deeply nested resources", () => {
					expect(() => Query({
						order: {
							customer: {
								address: {
									city: "string",
									country: "string"
								}
							}
						}
					})).not.toThrow();
				});

			});

			describe("array values", () => {

				it("should accept arrays with query objects", () => {
					expect(() => Query({
						items: [{ name: "string", price: "number" }]
					})).not.toThrow();
				});

				it("should accept arrays with specs objects", () => {
					expect(() => Query({
						items: [{ ">=price": 10, "^name": "asc" }]
					})).not.toThrow();
				});

				it("should accept arrays with mixed query and specs", () => {
					expect(() => Query({
						items: [
							{ name: "string" },
							{ ">=price": 10 }
						]
					})).not.toThrow();
				});

				it("should accept empty arrays", () => {
					expect(() => Query({ items: [] })).not.toThrow();
				});

			});

		});

		describe("edge cases", () => {

			it("should accept empty query object", () => {
				expect(() => Query({})).not.toThrow();
			});

			it("should accept query with single property", () => {
				expect(() => Query({ name: "string" })).not.toThrow();
			});

			it("should accept query with many properties", () => {
				expect(() => Query({
					prop1: "string",
					prop2: "number",
					prop3: "boolean",
					prop4: { en: "test" },
					prop5: [{ name: "string" }]
				})).not.toThrow();
			});

			it("should accept complex real-world query", () => {
				expect(() => Query({
					name: "string",
					"total=sum:items.price": "number",
					items: [
						{ name: "string", price: "number" },
						{ ">=price": 10, "<=price": 100, "^name": "asc", "@": 0, "#": 20 }
					],
					customer: [{
						name: "string",
						address: [{ city: "string", country: "string" }]
					}]
				})).not.toThrow();
			});

		});

	});

	describe("decoder", () => {

		describe("equality filters", () => {

			it("should parse single equality filter", async () => {
				expect(Query("status=active")).toEqual({ "?status": "active" });
				expect(Query("name=test")).toEqual({ "?name": "test" });
			});

			it("should parse multiple values for same expression as any-of filter", async () => {
				expect(Query("status=active&status=pending")).toEqual({
					"?status": ["active", "pending"]
				});
			});

			it("should parse empty value as null", async () => {
				expect(Query("category=")).toEqual({ "?category": null });
			});

			it("should parse wildcard value as undefined filter", async () => {
				expect(Query("category=*")).toEqual({ "?category": [] });
			});

			it("should parse URL-encoded values", async () => {
				expect(Query("name=hello%20world")).toEqual({ "?name": "hello world" });
				expect(Query("path=%2Fapi%2Ftest")).toEqual({ "?path": "/api/test" });
			});

			it("should parse nested path expressions", async () => {
				expect(Query("user.name=test")).toEqual({ "?user.name": "test" });
				expect(Query("address.city=rome")).toEqual({ "?address.city": "rome" });
			});

		});

		describe("range filters", () => {

			it("should parse less-than-or-equal filter", async () => {
				expect(Query("price<=100")).toEqual({ "<=price": 100 });
				expect(Query("age<=65")).toEqual({ "<=age": 65 });
			});

			it("should parse greater-than-or-equal filter", async () => {
				expect(Query("price>=10")).toEqual({ ">=price": 10 });
				expect(Query("age>=18")).toEqual({ ">=age": 18 });
			});

			it("should parse combined range filter", async () => {
				expect(Query("price>=10&price<=100")).toEqual({
					">=price": 10,
					"<=price": 100
				});
			});

			it("should parse range filter with nested path", async () => {
				expect(Query("items.price<=50")).toEqual({ "<=items.price": 50 });
				expect(Query("user.age>=21")).toEqual({ ">=user.age": 21 });
			});

		});

		describe("pattern filters", () => {

			it("should parse pattern filter", async () => {
				expect(Query("~name=john")).toEqual({ "~name": "john" });
				expect(Query("~title=report")).toEqual({ "~title": "report" });
			});

			it("should parse pattern filter with nested path", async () => {
				expect(Query("~user.bio=developer")).toEqual({ "~user.bio": "developer" });
			});

			it("should parse URL-encoded pattern value", async () => {
				expect(Query("~name=hello%20world")).toEqual({ "~name": "hello world" });
			});

		});

		describe("sort order", () => {

			it("should parse ascending sort with 'increasing' value", async () => {
				expect(Query("^name=increasing")).toEqual({ "^name": 1 });
			});

			it("should parse ascending sort with empty value", async () => {
				expect(Query("^name=")).toEqual({ "^name": 1 });
			});

			it("should parse descending sort with 'decreasing' value", async () => {
				expect(Query("^date=decreasing")).toEqual({ "^date": -1 });
			});

			it("should parse numeric sort order value", async () => {
				expect(Query("^priority=1")).toEqual({ "^priority": 1 });
				expect(Query("^priority=-2")).toEqual({ "^priority": -2 });
				expect(Query("^priority=0")).toEqual({ "^priority": 0 });
			});

			it("should parse sort with nested path", async () => {
				expect(Query("^user.name=increasing")).toEqual({ "^user.name": 1 });
			});

			it("should parse multiple sort criteria", async () => {
				expect(Query("^name=increasing&^date=decreasing")).toEqual({
					"^name": 1,
					"^date": -1
				});
			});

		});

		describe("pagination", () => {

			it("should parse offset", async () => {
				expect(Query("@=0")).toEqual({ "@": 0 });
				expect(Query("@=10")).toEqual({ "@": 10 });
				expect(Query("@=100")).toEqual({ "@": 100 });
			});

			it("should parse limit", async () => {
				expect(Query("#=10")).toEqual({ "#": 10 });
				expect(Query("#=25")).toEqual({ "#": 25 });
				expect(Query("#=0")).toEqual({ "#": 0 });
			});

			it("should parse combined offset and limit", async () => {
				expect(Query("@=0&#=10")).toEqual({ "@": 0, "#": 10 });
				expect(Query("@=20&#=10")).toEqual({ "@": 20, "#": 10 });
			});

		});

		describe("combined operators", () => {

			it("should parse equality with pagination", async () => {
				expect(Query("status=active&@=0&#=10")).toEqual({
					"?status": "active",
					"@": 0,
					"#": 10
				});
			});

			it("should parse range with sort and pagination", async () => {
				expect(Query("price>=100&price<=1000&^date=decreasing&@=0&#=25")).toEqual({
					">=price": 100,
					"<=price": 1000,
					"^date": -1,
					"@": 0,
					"#": 25
				});
			});

			it("should parse complex query with multiple operator types", async () => {
				expect(Query("status=active&status=pending&~name=corp&price>=100&price<=1000&^date=decreasing&@=0&#=25")).toEqual({
					"?status": ["active", "pending"],
					"~name": "corp",
					">=price": 100,
					"<=price": 1000,
					"^date": -1,
					"@": 0,
					"#": 25
				});
			});

		});

		describe("edge cases", () => {

			it("should parse empty query string", async () => {
				expect(Query("")).toEqual({});
			});

			it("should handle leading ampersand", async () => {
				expect(Query("&name=test")).toEqual({ "?name": "test" });
			});

			it("should handle multiple ampersands", async () => {
				expect(Query("name=test&&age=25")).toEqual({
					"?name": "test",
					"?age": 25
				});
			});

			it("should parse deeply nested paths", async () => {
				expect(Query("a.b.c=value")).toEqual({ "?a.b.c": "value" });
				expect(Query("x.y.z>=100")).toEqual({ ">=x.y.z": 100 });
				expect(Query("~p.q.r=pattern")).toEqual({ "~p.q.r": "pattern" });
			});

		});

		describe("value parsing", () => {

			it("should parse integer values as numbers", async () => {
				expect(Query("code=123")).toEqual({ "?code": 123 });
				expect(Query("count=0")).toEqual({ "?count": 0 });
				expect(Query("value=-42")).toEqual({ "?value": -42 });
			});

			it("should parse decimal values as numbers", async () => {
				expect(Query("price=45.67")).toEqual({ "?price": 45.67 });
				expect(Query("rate=-0.5")).toEqual({ "?rate": -0.5 });
				expect(Query("factor=3.14159")).toEqual({ "?factor": 3.14159 });
			});

			it("should parse exponential notation as numbers", async () => {
				expect(Query("large=1e10")).toEqual({ "?large": 1e10 });
				expect(Query("small=1.5e-3")).toEqual({ "?small": 1.5e-3 });
				expect(Query("scientific=2.5E+6")).toEqual({ "?scientific": 2.5e+6 });
			});

			it("should parse single-quoted values as strings", async () => {
				expect(Query("code='123'")).toEqual({ "?code": "123" });
				expect(Query("sku='00042'")).toEqual({ "?sku": "00042" });
				expect(Query("price='45.67'")).toEqual({ "?price": "45.67" });
			});

			it("should preserve leading zeros in quoted strings", async () => {
				expect(Query("zip='00123'")).toEqual({ "?zip": "00123" });
				expect(Query("id='007'")).toEqual({ "?id": "007" });
			});

			it("should parse non-numeric strings as strings", async () => {
				expect(Query("name=hello")).toEqual({ "?name": "hello" });
				expect(Query("mixed=123abc")).toEqual({ "?mixed": "123abc" });
				expect(Query("partial=12.34.56")).toEqual({ "?partial": "12.34.56" });
			});

			it("should parse numeric values in range filters", async () => {
				expect(Query("price<=100")).toEqual({ "<=price": 100 });
				expect(Query("price>=10.5")).toEqual({ ">=price": 10.5 });
				expect(Query("temp>=-40")).toEqual({ ">=temp": -40 });
			});

			it("should parse quoted strings in range filters", async () => {
				expect(Query("date<='2024-01-01'")).toEqual({ "<=date": "2024-01-01" });
				expect(Query("code>='A100'")).toEqual({ ">=code": "A100" });
			});

			it("should parse numeric values in pattern filters", async () => {
				expect(Query("~code=123")).toEqual({ "~code": 123 });
			});

			it("should parse quoted strings in pattern filters", async () => {
				expect(Query("~sku='00042'")).toEqual({ "~sku": "00042" });
			});

		});

		describe("error handling", () => {

			it("should reject empty path expression", async () => {
				expect(() => Query("=value")).toThrow();
			});

			it("should reject bare label without value separator", async () => {
				expect(() => Query("active")).toThrow();
				expect(() => Query("name&status=ok")).toThrow();
			});

			it("should reject invalid offset value", async () => {
				expect(() => Query("@=invalid")).toThrow();
			});

			it("should reject empty offset value", async () => {
				expect(() => Query("@=")).toThrow();
			});

			it("should reject invalid limit value", async () => {
				expect(() => Query("#=invalid")).toThrow();
			});

			it("should reject empty limit value", async () => {
				expect(() => Query("#=")).toThrow();
			});

			it("should reject invalid sort order value", async () => {
				expect(() => Query("^name=invalid")).toThrow();
			});

			it("should reject float sort order value", async () => {
				expect(() => Query("^name=1.23")).toThrow();
			});

		});

	});

	describe("encoder", () => {

		describe("equality filters", () => {

			it("should encode single equality filter", async () => {
				expect(Query({ "?status": "active" }, { format: "form" })).toBe("status=active");
				expect(Query({ "?name": "test" }, { format: "form" })).toBe("name=test");
			});

			it("should encode multiple values as repeated parameters", async () => {
				expect(Query(Query("status=active&status=pending"), { format: "form" }))
					.toBe("status=active&status=pending");
			});

			it("should encode null value as empty", async () => {
				expect(Query(Query("category="), { format: "form" })).toBe("category=");
			});

			it("should encode empty array as wildcard", async () => {
				expect(Query(Query("category=*"), { format: "form" })).toBe("category=*");
			});

			it("should URL-encode special characters in values", async () => {
				expect(Query({ "?name": "hello world" }, { format: "form" })).toBe("name=hello%20world");
				expect(Query({ "?path": "/api/test" }, { format: "form" })).toBe("path=%2Fapi%2Ftest");
			});

			it("should encode nested path expressions", async () => {
				expect(Query({ "?user.name": "test" }, { format: "form" })).toBe("user.name=test");
				expect(Query({ "?address.city": "rome" }, { format: "form" })).toBe("address.city=rome");
			});

		});

		describe("range filters", () => {

			it("should encode less-than-or-equal filter", async () => {
				expect(Query({ "<=price": 100 }, { format: "form" })).toBe("price<=100");
				expect(Query({ "<=age": 65 }, { format: "form" })).toBe("age<=65");
			});

			it("should encode greater-than-or-equal filter", async () => {
				expect(Query({ ">=price": 10 }, { format: "form" })).toBe("price>=10");
				expect(Query({ ">=age": 18 }, { format: "form" })).toBe("age>=18");
			});

			it("should encode combined range filter", async () => {
				const result = Query({ ">=price": 10, "<=price": 100 }, { format: "form" });
				expect(result).toContain("price>=10");
				expect(result).toContain("price<=100");
			});

			it("should encode range filter with nested path", async () => {
				expect(Query({ "<=items.price": 50 }, { format: "form" })).toBe("items.price<=50");
				expect(Query({ ">=user.age": 21 }, { format: "form" })).toBe("user.age>=21");
			});

		});

		describe("pattern filters", () => {

			it("should encode pattern filter", async () => {
				expect(Query({ "~name": "john" }, { format: "form" })).toBe("~name=john");
				expect(Query({ "~title": "report" }, { format: "form" })).toBe("~title=report");
			});

			it("should encode pattern filter with nested path", async () => {
				expect(Query({ "~user.bio": "developer" }, { format: "form" })).toBe("~user.bio=developer");
			});

			it("should URL-encode pattern value", async () => {
				expect(Query({ "~name": "hello world" }, { format: "form" })).toBe("~name=hello%20world");
			});

		});

		describe("sort order", () => {

			it("should encode ascending sort", async () => {
				expect(Query({ "^name": 1 }, { format: "form" })).toBe("^name=increasing");
			});

			it("should encode descending sort", async () => {
				expect(Query({ "^date": -1 }, { format: "form" })).toBe("^date=decreasing");
			});

			it("should encode numeric sort order value", async () => {
				expect(Query({ "^priority": 2 }, { format: "form" })).toBe("^priority=2");
				expect(Query({ "^priority": -2 }, { format: "form" })).toBe("^priority=-2");
				expect(Query({ "^priority": 0 }, { format: "form" })).toBe("^priority=0");
			});

			it("should encode sort with nested path", async () => {
				expect(Query({ "^user.name": 1 }, { format: "form" })).toBe("^user.name=increasing");
			});

			it("should encode multiple sort criteria", async () => {
				const result = Query({ "^name": 1, "^date": -1 }, { format: "form" });
				expect(result).toContain("^name=increasing");
				expect(result).toContain("^date=decreasing");
			});

		});

		describe("pagination", () => {

			it("should encode offset", async () => {
				expect(Query({ "@": 0 }, { format: "form" })).toBe("@=0");
				expect(Query({ "@": 10 }, { format: "form" })).toBe("@=10");
				expect(Query({ "@": 100 }, { format: "form" })).toBe("@=100");
			});

			it("should encode limit", async () => {
				expect(Query({ "#": 10 }, { format: "form" })).toBe("#=10");
				expect(Query({ "#": 25 }, { format: "form" })).toBe("#=25");
				expect(Query({ "#": 0 }, { format: "form" })).toBe("#=0");
			});

			it("should encode combined offset and limit", async () => {
				const result = Query({ "@": 0, "#": 10 }, { format: "form" });
				expect(result).toContain("@=0");
				expect(result).toContain("#=10");
			});

		});

		describe("combined operators", () => {

			it("should encode equality with pagination", async () => {
				const result = Query({ "?status": "active", "@": 0, "#": 10 }, { format: "form" });
				expect(result).toContain("status=active");
				expect(result).toContain("@=0");
				expect(result).toContain("#=10");
			});

			it("should encode range with sort and pagination", async () => {
				const result = Query({
					">=price": 100,
					"<=price": 1000,
					"^date": -1,
					"@": 0,
					"#": 25
				}, { format: "form" });
				expect(result).toContain("price>=100");
				expect(result).toContain("price<=1000");
				expect(result).toContain("^date=decreasing");
				expect(result).toContain("@=0");
				expect(result).toContain("#=25");
			});

			it("should encode complex query with multiple operator types", async () => {
				const decoded = Query("status=active&status=pending&~name=corp&price>=100&price<=1000&^date=decreasing&@=0&#=25");
				const result = Query(decoded, { format: "form" });
				expect(result).toContain("status=active");
				expect(result).toContain("status=pending");
				expect(result).toContain("~name=corp");
				expect(result).toContain("price>=100");
				expect(result).toContain("price<=1000");
				expect(result).toContain("^date=decreasing");
				expect(result).toContain("@=0");
				expect(result).toContain("#=25");
			});

		});

		describe("edge cases", () => {

			it("should encode empty query", async () => {
				expect(Query({}, { format: "form" })).toBe("");
			});

			it("should encode deeply nested paths", async () => {
				expect(Query({ "?a.b.c": "value" }, { format: "form" })).toBe("a.b.c=value");
				expect(Query({ ">=x.y.z": 100 }, { format: "form" })).toBe("x.y.z>=100");
				expect(Query({ "~p.q.r": "pattern" }, { format: "form" })).toBe("~p.q.r=pattern");
			});

		});

		describe("value encoding", () => {

			it("should encode integer values", async () => {
				expect(Query({ "?code": 123 }, { format: "form" })).toBe("code=123");
				expect(Query({ "?count": 0 }, { format: "form" })).toBe("count=0");
				expect(Query({ "?value": -42 }, { format: "form" })).toBe("value=-42");
			});

			it("should encode decimal values", async () => {
				expect(Query({ "?price": 45.67 }, { format: "form" })).toBe("price=45.67");
				expect(Query({ "?rate": -0.5 }, { format: "form" })).toBe("rate=-0.5");
			});

			it("should encode exponential notation", async () => {
				expect(Query({ "?large": 1e10 }, { format: "form" })).toBe("large=10000000000");
				expect(Query({ "?small": 1.5e-3 }, { format: "form" })).toBe("small=0.0015");
			});

			it("should quote string values that look like numbers", async () => {
				expect(Query({ "?code": "123" }, { format: "form" })).toBe("code='123'");
				expect(Query({ "?sku": "00042" }, { format: "form" })).toBe("sku='00042'");
				expect(Query({ "?price": "45.67" }, { format: "form" })).toBe("price='45.67'");
			});

			it("should preserve leading zeros with quotes", async () => {
				expect(Query({ "?zip": "00123" }, { format: "form" })).toBe("zip='00123'");
				expect(Query({ "?id": "007" }, { format: "form" })).toBe("id='007'");
			});

			it("should not quote non-numeric strings", async () => {
				expect(Query({ "?name": "hello" }, { format: "form" })).toBe("name=hello");
				expect(Query({ "?mixed": "123abc" }, { format: "form" })).toBe("mixed=123abc");
				expect(Query({ "?partial": "12.34.56" }, { format: "form" })).toBe("partial=12.34.56");
			});

			it("should encode numeric values in range filters", async () => {
				expect(Query({ "<=price": 100 }, { format: "form" })).toBe("price<=100");
				expect(Query({ ">=price": 10.5 }, { format: "form" })).toBe("price>=10.5");
				expect(Query({ ">=temp": -40 }, { format: "form" })).toBe("temp>=-40");
			});

			it("should not quote non-numeric string values in range filters", async () => {
				expect(Query({ "<=date": "2024-01-01" }, { format: "form" })).toBe("date<=2024-01-01");
				expect(Query({ ">=code": "A100" }, { format: "form" })).toBe("code>=A100");
			});

		});

		describe("roundtrip", () => {

			it("should roundtrip equality filters", async () => {
				const original = "status=active";
				expect(Query(Query(original), { format: "form" })).toBe(original);
			});

			it("should roundtrip range filters", async () => {
				const decoded = Query("price>=10&price<=100");
				const encoded = Query(decoded, { format: "form" });
				expect(Query(encoded)).toEqual(decoded);
			});

			it("should roundtrip pagination", async () => {
				const original = "@=0&#=25";
				const decoded = Query(original);
				const encoded = Query(decoded, { format: "form" });
				expect(Query(encoded)).toEqual(decoded);
			});

			it("should roundtrip complex queries", async () => {
				const original = Query("status=active&~name=corp&price>=100&^date=decreasing&@=0&#=25");
				const encoded = Query(original, { format: "form" });
				expect(Query(encoded)).toEqual(original);
			});

		});

	});

});

describe("Expression()", () => {

	describe("factory", () => {

		it("should create immutable expression object", async () => {
			const expression = Expression({ pipe: ["sum"], path: ["items", "price"] });
			expect(() => {
				(expression as any).pipe = ["avg"];
			}).toThrow();
		});

		it("should create expression with immutable pipe array", async () => {
			const expression = Expression({ pipe: ["sum", "round"], path: ["prices"] });
			expect(() => { (expression.pipe as any).push("avg"); }).toThrow();
			expect(() => { (expression.pipe as any)[0] = "count"; }).toThrow();
		});

		it("should create expression with immutable path array", async () => {
			const expression = Expression({ pipe: [], path: ["user", "name"] });
			expect(() => { (expression.path as any).push("email"); }).toThrow();
			expect(() => { (expression.path as any)[0] = "admin"; }).toThrow();
		});

		it("should prevent modification of name property", async () => {
			const expression = Expression({ name: "totalPrice", pipe: ["sum"], path: ["items", "price"] });
			expect(() => { (expression as any).name = "avgPrice"; }).toThrow();
		});

		it("should isolate result from input mutations", async () => {
			const input = { pipe: ["sum"], path: ["items", "price"] };
			const expression = Expression(input);

			// Mutating input shouldn't affect the frozen result
			input.pipe.push("round");
			input.path.push("total");

			expect(expression.pipe).toEqual(["sum"]);
			expect(expression.path).toEqual(["items", "price"]);
		});

		it("should preserve expression structure with name", async () => {
			const input = { name: "totalPrice", pipe: ["sum"], path: ["items", "price"] };
			const expression = Expression(input);
			expect(expression).toEqual({
				name: "totalPrice",
				pipe: ["sum"],
				path: ["items", "price"]
			});
		});

		it("should preserve expression structure without name", async () => {
			const input = { pipe: ["avg", "round"], path: ["scores"] };
			const expression = Expression(input);
			expect(expression).toEqual({
				pipe: ["avg", "round"],
				path: ["scores"]
			});
		});

		it("should handle empty pipe array", async () => {
			const expression = Expression({ pipe: [], path: ["user", "name"] });
			expect(expression.pipe).toEqual([]);
			expect(() => { (expression.pipe as any).push("sum"); }).toThrow();
		});

		it("should handle empty path array", async () => {
			const expression = Expression({ pipe: ["count"], path: [] });
			expect(expression.path).toEqual([]);
			expect(() => { (expression.path as any).push("items"); }).toThrow();
		});

		it("should handle single-element arrays", async () => {
			const expression = Expression({ pipe: ["sum"], path: ["price"] });
			expect(expression.pipe).toHaveLength(1);
			expect(expression.path).toHaveLength(1);
			expect(() => { (expression.pipe as any)[0] = "avg"; }).toThrow();
		});

		it("should handle long transform chains", async () => {
			const expression = Expression({
				pipe: ["sum", "round", "abs"],
				path: ["orders", "items", "price"]
			});
			expect(expression.pipe).toEqual(["sum", "round", "abs"]);
			expect(expression.path).toEqual(["orders", "items", "price"]);
		});

		it("should handle special characters in path", async () => {
			const expression = Expression({
				pipe: [],
				path: ["content-type", "@id", "$value"]
			});
			expect(expression.path).toEqual(["content-type", "@id", "$value"]);
		});

		it("should handle empty string in path", async () => {
			const expression = Expression({ pipe: [], path: [""] });
			expect(expression.path).toEqual([""]);
			expect(() => { (expression.path as any)[0] = "name"; }).toThrow();
		});

		it("should return new reference not shared with input", async () => {
			const pipe = ["sum"];
			const path = ["items", "price"];
			const input = { pipe, path };
			const expression = Expression(input);

			// Expression should have its own frozen copies
			expect(expression.pipe).not.toBe(pipe);
			expect(expression.path).not.toBe(path);
		});

	});

	describe("decoder", () => {

		describe("path-only expressions", () => {

			describe("dot notation - valid identifiers", () => {

				it("should parse single property", () => {
					expect(Expression("name")).toEqual({ pipe: [], path: ["name"] });
					expect(Expression("email")).toEqual({ pipe: [], path: ["email"] });
					expect(Expression("_id")).toEqual({ pipe: [], path: ["_id"] });
					expect(Expression("$ref")).toEqual({ pipe: [], path: ["$ref"] });
				});

				it("should parse multiple properties", () => {
					expect(Expression("user.name")).toEqual({ pipe: [], path: ["user", "name"] });
					expect(Expression("address.city")).toEqual({ pipe: [], path: ["address", "city"] });
					expect(Expression("user.profile.avatar")).toEqual({
						pipe: [],
						path: ["user", "profile", "avatar"]
					});
				});

				it("should parse properties with numbers", () => {
					expect(Expression("item1")).toEqual({ pipe: [], path: ["item1"] });
					expect(Expression("value123")).toEqual({ pipe: [], path: ["value123"] });
					expect(Expression("prop_99")).toEqual({ pipe: [], path: ["prop_99"] });
				});

				it("should parse properties with underscores", () => {
					expect(Expression("first_name")).toEqual({ pipe: [], path: ["first_name"] });
					expect(Expression("__proto__")).toEqual({ pipe: [], path: ["__proto__"] });
					expect(Expression("_private")).toEqual({ pipe: [], path: ["_private"] });
				});

				it("should parse properties with dollar signs", () => {
					expect(Expression("$scope")).toEqual({ pipe: [], path: ["$scope"] });
					expect(Expression("$$watchers")).toEqual({ pipe: [], path: ["$$watchers"] });
				});

				it("should allow reserved keywords", () => {
					expect(Expression("class")).toEqual({ pipe: [], path: ["class"] });
					expect(Expression("function")).toEqual({ pipe: [], path: ["function"] });
					expect(Expression("return")).toEqual({ pipe: [], path: ["return"] });
					expect(Expression("if.then.else")).toEqual({ pipe: [], path: ["if", "then", "else"] });
				});

			});

			describe("bracket notation - single quotes only", () => {

				it("should parse simple bracket properties", () => {
					expect(Expression("['name']")).toEqual({ pipe: [], path: ["name"] });
					expect(Expression("['email']")).toEqual({ pipe: [], path: ["email"] });
				});

				it("should parse properties with dots", () => {
					expect(Expression("['first.name']")).toEqual({ pipe: [], path: ["first.name"] });
					expect(Expression("['user.email']")).toEqual({ pipe: [], path: ["user.email"] });
				});

				it("should parse properties with spaces", () => {
					expect(Expression("['my property']")).toEqual({ pipe: [], path: ["my property"] });
					expect(Expression("['user name']")).toEqual({ pipe: [], path: ["user name"] });
				});

				it("should parse properties with hyphens", () => {
					expect(Expression("['first-name']")).toEqual({ pipe: [], path: ["first-name"] });
					expect(Expression("['content-type']")).toEqual({ pipe: [], path: ["content-type"] });
				});

				it("should parse properties with special characters", () => {
					expect(Expression("['@id']")).toEqual({ pipe: [], path: ["@id"] });
					expect(Expression("['@type']")).toEqual({ pipe: [], path: ["@type"] });
					expect(Expression("['price-$']")).toEqual({ pipe: [], path: ["price-$"] });
					expect(Expression("['100%']")).toEqual({ pipe: [], path: ["100%"] });
				});

				it("should parse empty string property", () => {
					expect(Expression("['']")).toEqual({ pipe: [], path: [""] });
				});

				it("should parse properties with escaped single quotes", () => {
					expect(Expression("['it\\'s']")).toEqual({ pipe: [], path: ["it's"] });
					expect(Expression("['user\\'s name']")).toEqual({ pipe: [], path: ["user's name"] });
				});

				it("should parse properties with escaped backslashes", () => {
					expect(Expression("['path\\\\to\\\\file']")).toEqual({ pipe: [], path: ["path\\to\\file"] });
					expect(Expression("['C:\\\\Users']")).toEqual({ pipe: [], path: ["C:\\Users"] });
				});

				it("should parse multiple bracket properties", () => {
					expect(Expression("['first']['second']")).toEqual({ pipe: [], path: ["first", "second"] });
					expect(Expression("['a']['b']['c']")).toEqual({ pipe: [], path: ["a", "b", "c"] });
				});

			});

			describe("mixed notation", () => {

				it("should parse dot followed by bracket", () => {
					expect(Expression("user['first-name']")).toEqual({ pipe: [], path: ["user", "first-name"] });
					expect(Expression("data.items['@id']")).toEqual({ pipe: [], path: ["data", "items", "@id"] });
				});

				it("should parse bracket followed by dot", () => {
					expect(Expression("['user'].name")).toEqual({ pipe: [], path: ["user", "name"] });
					expect(Expression("['@context'].title")).toEqual({ pipe: [], path: ["@context", "title"] });
				});

				it("should parse complex mixed paths", () => {
					expect(Expression("user['address'].city")).toEqual({ pipe: [], path: ["user", "address", "city"] });
					expect(Expression("data.items['@type'].name")).toEqual({
						pipe: [],
						path: ["data", "items", "@type", "name"]
					});
					expect(Expression("['user'].profile['avatar-url']")).toEqual({
						pipe: [],
						path: ["user", "profile", "avatar-url"]
					});
				});

			});

			describe("leading dot handling", () => {

				it("should strip optional leading dot from paths", () => {
					expect(Expression(".name")).toEqual({ pipe: [], path: ["name"] });
					expect(Expression(".user.name")).toEqual({ pipe: [], path: ["user", "name"] });
					expect(Expression(".user.profile.avatar")).toEqual({
						pipe: [],
						path: ["user", "profile", "avatar"]
					});
				});

				it("should strip leading dot before bracket notation", () => {
					expect(Expression(".['name']")).toEqual({ pipe: [], path: ["name"] });
					expect(Expression(".['user'].name")).toEqual({ pipe: [], path: ["user", "name"] });
					expect(Expression(".user['name']")).toEqual({ pipe: [], path: ["user", "name"] });
				});

				it("should strip leading dot with transforms", () => {
					expect(Expression("sum:.items")).toEqual({ pipe: ["sum"], path: ["items"] });
					expect(Expression("count:.user.posts")).toEqual({ pipe: ["count"], path: ["user", "posts"] });
					expect(Expression("avg:.['scores']")).toEqual({ pipe: ["avg"], path: ["scores"] });
				});

				it("should strip leading dot with named expressions", () => {
					expect(Expression("userName=.name")).toEqual({ name: "userName", pipe: [], path: ["name"] });
					expect(Expression("total=sum:.items.price")).toEqual({
						name: "total",
						pipe: ["sum"],
						path: ["items", "price"]
					});
				});

				it("should handle leading dot only as empty path", () => {
					expect(Expression(".")).toEqual({ pipe: [], path: [] });
				});

			});

			describe("JSONPath root handling", () => {

				it("should strip $ as JSONPath root indicator", () => {
					expect(Expression("$")).toEqual({ pipe: [], path: [] });
					expect(Expression("$.name")).toEqual({ pipe: [], path: ["name"] });
					expect(Expression("$['name']")).toEqual({ pipe: [], path: ["name"] });
					expect(Expression("$.user.name")).toEqual({ pipe: [], path: ["user", "name"] });
				});

				it("should strip $ with transforms", () => {
					expect(Expression("sum:$")).toEqual({ pipe: ["sum"], path: [] });
					expect(Expression("count:$.items")).toEqual({ pipe: ["count"], path: ["items"] });
					expect(Expression("avg:$.items.price")).toEqual({ pipe: ["avg"], path: ["items", "price"] });
				});

				it("should strip $ with named expressions", () => {
					expect(Expression("total=$")).toEqual({ name: "total", pipe: [], path: [] });
					expect(Expression("userName=$.name")).toEqual({ name: "userName", pipe: [], path: ["name"] });
					expect(Expression("itemTotal=sum:$.items.price")).toEqual({
						name: "itemTotal",
						pipe: ["sum"],
						path: ["items", "price"]
					});
				});

			});

			describe("edge cases", () => {

				it("should parse empty path", () => {
					expect(Expression("")).toEqual({ pipe: [], path: [] });
				});

			});

		});

		describe("transform-only expressions (empty path)", () => {

			it("should parse single transform with empty path", () => {
				expect(Expression("count:")).toEqual({ pipe: ["count"], path: [] });
				expect(Expression("sum:")).toEqual({ pipe: ["sum"], path: [] });
				expect(Expression("avg:")).toEqual({ pipe: ["avg"], path: [] });
				expect(Expression("min:")).toEqual({ pipe: ["min"], path: [] });
				expect(Expression("max:")).toEqual({ pipe: ["max"], path: [] });
			});

			it("should parse multiple transforms with empty path", () => {
				expect(Expression("sum:round:")).toEqual({ pipe: ["sum", "round"], path: [] });
				expect(Expression("avg:abs:")).toEqual({ pipe: ["avg", "abs"], path: [] });
				expect(Expression("sum:round:abs:")).toEqual({ pipe: ["sum", "round", "abs"], path: [] });
			});

			it("should parse transform with explicit empty JSONPath root", () => {
				expect(Expression("count:$")).toEqual({ pipe: ["count"], path: [] });
				expect(Expression("sum:$")).toEqual({ pipe: ["sum"], path: [] });
			});

			it("should parse transform with dot only", () => {
				expect(Expression("count:.")).toEqual({ pipe: ["count"], path: [] });
				expect(Expression("sum:.")).toEqual({ pipe: ["sum"], path: [] });
			});

		});

		describe("complete expression", () => {

			describe("single transform", () => {

				it("should parse aggregate transforms", () => {
					expect(Expression("count:items")).toEqual({ pipe: ["count"], path: ["items"] });
					expect(Expression("sum:prices")).toEqual({ pipe: ["sum"], path: ["prices"] });
					expect(Expression("avg:scores")).toEqual({ pipe: ["avg"], path: ["scores"] });
					expect(Expression("min:values")).toEqual({ pipe: ["min"], path: ["values"] });
					expect(Expression("max:values")).toEqual({ pipe: ["max"], path: ["values"] });
				});

				it("should parse scalar transforms", () => {
					expect(Expression("abs:temperature")).toEqual({ pipe: ["abs"], path: ["temperature"] });
					expect(Expression("round:price")).toEqual({ pipe: ["round"], path: ["price"] });
					expect(Expression("year:created")).toEqual({ pipe: ["year"], path: ["created"] });
				});

				it("should parse transform with nested path", () => {
					expect(Expression("sum:order.items.price")).toEqual({
						pipe: ["sum"],
						path: ["order", "items", "price"]
					});
					expect(Expression("count:user.posts")).toEqual({ pipe: ["count"], path: ["user", "posts"] });
				});

				it("should parse transform with bracket notation", () => {
					expect(Expression("sum:['item-price']")).toEqual({ pipe: ["sum"], path: ["item-price"] });
					expect(Expression("count:items['@id']")).toEqual({ pipe: ["count"], path: ["items", "@id"] });
				});

				it("should parse transform with empty path", () => {
					expect(Expression("count:")).toEqual({ pipe: ["count"], path: [] });
					expect(Expression("sum:")).toEqual({ pipe: ["sum"], path: [] });
				});

			});

			describe("multiple transforms", () => {

				it("should parse two transforms", () => {
					expect(Expression("sum:round:prices")).toEqual({ pipe: ["sum", "round"], path: ["prices"] });
					expect(Expression("avg:abs:temperatures")).toEqual({
						pipe: ["avg", "abs"],
						path: ["temperatures"]
					});
				});

				it("should parse three transforms", () => {
					expect(Expression("sum:round:abs:values")).toEqual({
						pipe: ["sum", "round", "abs"],
						path: ["values"]
					});
				});

				it("should parse multiple transforms with nested path", () => {
					expect(Expression("avg:round:items.price")).toEqual({
						pipe: ["avg", "round"],
						path: ["items", "price"]
					});
				});

				it("should parse multiple transforms with empty path", () => {
					expect(Expression("sum:round:")).toEqual({ pipe: ["sum", "round"], path: [] });
				});

			});

			describe("transforms with special path cases", () => {

				it("should parse transform with JSONPath root", () => {
					expect(Expression("sum:$.items.price")).toEqual({ pipe: ["sum"], path: ["items", "price"] });
					expect(Expression("count:$['items']")).toEqual({ pipe: ["count"], path: ["items"] });
				});

				it("should parse transform with leading dot", () => {
					expect(Expression("sum:.items")).toEqual({ pipe: ["sum"], path: ["items"] });
				});

			});

			describe("complex real-world cases", () => {

				it("should parse deeply nested paths with transforms", () => {
					expect(Expression("sum:order.customer.address.location.coordinates"))
						.toEqual({ pipe: ["sum"], path: ["order", "customer", "address", "location", "coordinates"] });
					expect(Expression("avg:data.users.profile.stats.score"))
						.toEqual({ pipe: ["avg"], path: ["data", "users", "profile", "stats", "score"] });
				});

				it("should parse multiple transforms with complex paths", () => {
					expect(Expression("sum:round:order.items.product.price"))
						.toEqual({ pipe: ["sum", "round"], path: ["order", "items", "product", "price"] });
					expect(Expression("avg:abs:year:timestamps"))
						.toEqual({ pipe: ["avg", "abs", "year"], path: ["timestamps"] });
				});

				it("should parse transforms with mixed notation paths", () => {
					expect(Expression("sum:order.items['unit-price']"))
						.toEqual({ pipe: ["sum"], path: ["order", "items", "unit-price"] });
					expect(Expression("count:['@context'].items['@type']"))
						.toEqual({ pipe: ["count"], path: ["@context", "items", "@type"] });
					expect(Expression("avg:data['user-data'].scores['test-1']"))
						.toEqual({ pipe: ["avg"], path: ["data", "user-data", "scores", "test-1"] });
				});

				it("should parse multiple transforms with bracket notation", () => {
					expect(Expression("sum:round:['item-prices']"))
						.toEqual({ pipe: ["sum", "round"], path: ["item-prices"] });
					expect(Expression("avg:abs:data['raw-values']"))
						.toEqual({ pipe: ["avg", "abs"], path: ["data", "raw-values"] });
				});

				it("should parse transforms with paths containing special characters", () => {
					expect(Expression("sum:['@id']")).toEqual({ pipe: ["sum"], path: ["@id"] });
					expect(Expression("count:items['@type']")).toEqual({ pipe: ["count"], path: ["items", "@type"] });
					expect(Expression("avg:['100%']")).toEqual({ pipe: ["avg"], path: ["100%"] });
				});

				it("should parse transforms with underscore and dollar properties", () => {
					expect(Expression("sum:_private.$$value")).toEqual({
						pipe: ["sum"],
						path: ["_private", "$$value"]
					});
					expect(Expression("count:$scope.__proto__")).toEqual({
						pipe: ["count"],
						path: ["$scope", "__proto__"]
					});
				});

			});

		});

		describe("named expressions", () => {

			describe("name with path only", () => {

				it("should parse simple named path", () => {
					expect(Expression("displayName=name")).toEqual({ name: "displayName", pipe: [], path: ["name"] });
					expect(Expression("userId=id")).toEqual({ name: "userId", pipe: [], path: ["id"] });
				});

				it("should parse name with nested path", () => {
					expect(Expression("userName=user.name")).toEqual({
						name: "userName",
						pipe: [],
						path: ["user", "name"]
					});
					expect(Expression("cityName=address.city")).toEqual({
						name: "cityName",
						pipe: [],
						path: ["address", "city"]
					});
				});

				it("should parse name with bracket notation", () => {
					expect(Expression("firstName=['first-name']")).toEqual({
						name: "firstName",
						pipe: [],
						path: ["first-name"]
					});
					expect(Expression("contentType=['content-type']")).toEqual({
						name: "contentType",
						pipe: [],
						path: ["content-type"]
					});
				});

				it("should parse name with empty path", () => {
					expect(Expression("value=")).toEqual({ name: "value", pipe: [], path: [] });
				});

			});

			describe("name with transforms", () => {

				it("should parse name with single transform", () => {
					expect(Expression("totalPrice=sum:items.price")).toEqual({
						name: "totalPrice",
						pipe: ["sum"],
						path: ["items", "price"]
					});
					expect(Expression("itemCount=count:items")).toEqual({
						name: "itemCount",
						pipe: ["count"],
						path: ["items"]
					});
					expect(Expression("avgScore=avg:scores")).toEqual({
						name: "avgScore",
						pipe: ["avg"],
						path: ["scores"]
					});
				});

				it("should parse name with multiple transforms", () => {
					expect(Expression("totalRounded=sum:round:prices")).toEqual({
						name: "totalRounded",
						pipe: ["sum", "round"],
						path: ["prices"]
					});
					expect(Expression("avgYear=avg:year:dates")).toEqual({
						name: "avgYear",
						pipe: ["avg", "year"],
						path: ["dates"]
					});
				});

				it("should parse name with transforms and nested path", () => {
					expect(Expression("orderTotal=sum:order.items.price")).toEqual({
						name: "orderTotal",
						pipe: ["sum"],
						path: ["order", "items", "price"]
					});
				});

				it("should parse name with transforms and empty path", () => {
					expect(Expression("total=sum:")).toEqual({ name: "total", pipe: ["sum"], path: [] });
				});

			});

			describe("name syntax", () => {

				it("should parse names with underscores", () => {
					expect(Expression("first_name=name")).toEqual({ name: "first_name", pipe: [], path: ["name"] });
					expect(Expression("__private=value")).toEqual({ name: "__private", pipe: [], path: ["value"] });
				});

				it("should parse names with dollar signs", () => {
					expect(Expression("$scope=scope")).toEqual({ name: "$scope", pipe: [], path: ["scope"] });
					expect(Expression("$$value=val")).toEqual({ name: "$$value", pipe: [], path: ["val"] });
				});

				it("should parse names with numbers", () => {
					expect(Expression("value1=data")).toEqual({ name: "value1", pipe: [], path: ["data"] });
					expect(Expression("item123=item")).toEqual({ name: "item123", pipe: [], path: ["item"] });
				});

			});

			describe("complex named expressions", () => {

				it("should parse named expressions with deeply nested paths", () => {
					expect(Expression("fullAddress=user.profile.contact.address.street"))
						.toEqual({
							name: "fullAddress",
							pipe: [],
							path: ["user", "profile", "contact", "address", "street"]
						});
					expect(Expression("coordinates=location.geo.position.coords"))
						.toEqual({ name: "coordinates", pipe: [], path: ["location", "geo", "position", "coords"] });
				});

				it("should parse named expressions with multiple transforms and nested paths", () => {
					expect(Expression("totalRevenue=sum:round:orders.items.price"))
						.toEqual({ name: "totalRevenue", pipe: ["sum", "round"], path: ["orders", "items", "price"] });
					expect(Expression("avgAge=avg:round:users.profile.age"))
						.toEqual({ name: "avgAge", pipe: ["avg", "round"], path: ["users", "profile", "age"] });
				});

				it("should parse named expressions with mixed notation", () => {
					expect(Expression("contentType=response.headers['content-type']"))
						.toEqual({ name: "contentType", pipe: [], path: ["response", "headers", "content-type"] });
					expect(Expression("itemTotal=sum:order['line-items'].price"))
						.toEqual({ name: "itemTotal", pipe: ["sum"], path: ["order", "line-items", "price"] });
				});

				it("should parse named expressions with special characters in paths", () => {
					expect(Expression("identifier=data['@id']"))
						.toEqual({ name: "identifier", pipe: [], path: ["data", "@id"] });
					expect(Expression("typeCount=count:items['@type']"))
						.toEqual({ name: "typeCount", pipe: ["count"], path: ["items", "@type"] });
				});

				it("should parse complex camelCase names with transforms", () => {
					expect(Expression("totalPriceRounded=sum:round:items.price"))
						.toEqual({ name: "totalPriceRounded", pipe: ["sum", "round"], path: ["items", "price"] });
					expect(Expression("averageUserAge=avg:users.age"))
						.toEqual({ name: "averageUserAge", pipe: ["avg"], path: ["users", "age"] });
				});

			});

		});

		describe("invalid expressions", () => {

			describe("invalid paths", () => {

				it("should reject double quotes in brackets", () => {
					expect(() => Expression("[\"name\"]")).toThrow();
					expect(() => Expression("[\"first\"][\"second\"]")).toThrow();
					expect(() => Expression("sum:[\"items\"]")).toThrow();
				});

				it("should reject brackets without quotes", () => {
					expect(() => Expression("[name]")).toThrow();
					expect(() => Expression("[0]")).toThrow();
					expect(() => Expression("count:[items]")).toThrow();
				});

				it("should reject unclosed brackets", () => {
					expect(() => Expression("['name'")).toThrow();
					expect(() => Expression("['name']'")).toThrow();
					expect(() => Expression("sum:['items'")).toThrow();
				});

				it("should reject unescaped quotes", () => {
					expect(() => Expression("['it's']")).toThrow();
					expect(() => Expression("count:['it's']")).toThrow();
				});

				it("should reject empty property names in dot notation", () => {
					// Trailing dot - empty property after last dot
					expect(() => Expression("user.")).toThrow();
					expect(() => Expression("user.name.")).toThrow();
					expect(() => Expression(".user.")).toThrow();

					// Consecutive dots - empty property between dots
					expect(() => Expression("user..name")).toThrow();
					expect(() => Expression("..name")).toThrow();
					expect(() => Expression("user...name")).toThrow();

					// Leading dot followed by dot - empty after leading dot
					expect(() => Expression("..")).toThrow();

					// With transforms
					expect(() => Expression("sum:user.")).toThrow();
					expect(() => Expression("count:user..name")).toThrow();
					expect(() => Expression("avg:..name")).toThrow();

					// With names
					expect(() => Expression("total=user.")).toThrow();
					expect(() => Expression("result=user..name")).toThrow();

					// Complex cases
					expect(() => Expression("sum:order.items.")).toThrow();
					expect(() => Expression("total=sum:order..items")).toThrow();
				});

				it("should reject properties starting with digits", () => {
					expect(() => Expression("123abc")).toThrow();
					expect(() => Expression("user.9lives")).toThrow();
					expect(() => Expression("sum:123abc")).toThrow();
				});

				it("should reject properties with invalid characters in dot notation", () => {
					expect(() => Expression("first-name")).toThrow();
					expect(() => Expression("my property")).toThrow();
					expect(() => Expression("@id")).toThrow();
					expect(() => Expression("count:first-name")).toThrow();
				});

			});

			describe("invalid transforms", () => {

				it("should reject transform names starting with digits", () => {
					expect(() => Expression("123sum:items")).toThrow();
				});

				it("should reject transform names with invalid characters", () => {
					expect(() => Expression("sum-round:items")).toThrow();
					expect(() => Expression("sum round:items")).toThrow();
					expect(() => Expression("@sum:items")).toThrow();
				});

				it("should reject colon without transform", () => {
					expect(() => Expression(":items")).toThrow();
					expect(() => Expression("::items")).toThrow();
				});

			});

			describe("invalid names", () => {

				it("should reject names starting with digits", () => {
					expect(() => Expression("123name=value")).toThrow();
				});

				it("should reject names with invalid characters", () => {
					expect(() => Expression("first-name=value")).toThrow();
					expect(() => Expression("my name=value")).toThrow();
					expect(() => Expression("@name=value")).toThrow();
				});

				it("should reject equals sign without name", () => {
					expect(() => Expression("=value")).toThrow();
					expect(() => Expression("=sum:items")).toThrow();
				});

				it("should reject multiple equals signs", () => {
					expect(() => Expression("name=value=other")).toThrow();
					expect(() => Expression("a=b=c")).toThrow();
				});

			});

		});

	});

	describe("encoder", () => {

		describe("path-only expressions", () => {

			describe("dot notation encoding", () => {

				it("should encode single property", () => {
					expect(Expression({ pipe: [], path: ["name"] }, { format: "string" })).toBe("name");
					expect(Expression({ pipe: [], path: ["email"] }, { format: "string" })).toBe("email");
					expect(Expression({ pipe: [], path: ["_id"] }, { format: "string" })).toBe("_id");
					expect(Expression({ pipe: [], path: ["$ref"] }, { format: "string" })).toBe("$ref");
				});

				it("should encode multiple properties", () => {
					expect(Expression({ pipe: [], path: ["user", "name"] }, { format: "string" })).toBe("user.name");
					expect(Expression({
						pipe: [],
						path: ["address", "city"]
					}, { format: "string" })).toBe("address.city");
					expect(Expression({ pipe: [], path: ["user", "profile", "avatar"] }, { format: "string" }))
						.toBe("user.profile.avatar");
				});

				it("should encode properties with numbers", () => {
					expect(Expression({ pipe: [], path: ["item1"] }, { format: "string" })).toBe("item1");
					expect(Expression({ pipe: [], path: ["value123"] }, { format: "string" })).toBe("value123");
					expect(Expression({ pipe: [], path: ["prop_99"] }, { format: "string" })).toBe("prop_99");
				});

				it("should encode properties with underscores", () => {
					expect(Expression({ pipe: [], path: ["first_name"] }, { format: "string" })).toBe("first_name");
					expect(Expression({ pipe: [], path: ["__proto__"] }, { format: "string" })).toBe("__proto__");
					expect(Expression({ pipe: [], path: ["_private"] }, { format: "string" })).toBe("_private");
				});

				it("should encode properties with dollar signs", () => {
					expect(Expression({ pipe: [], path: ["$scope"] }, { format: "string" })).toBe("$scope");
					expect(Expression({ pipe: [], path: ["$$watchers"] }, { format: "string" })).toBe("$$watchers");
				});

				it("should encode reserved keywords", () => {
					expect(Expression({ pipe: [], path: ["class"] }, { format: "string" })).toBe("class");
					expect(Expression({ pipe: [], path: ["function"] }, { format: "string" })).toBe("function");
					expect(Expression({ pipe: [], path: ["return"] }, { format: "string" })).toBe("return");
					expect(Expression({ pipe: [], path: ["if", "then", "else"] }, { format: "string" }))
						.toBe("if.then.else");
				});

			});

			describe("bracket notation encoding", () => {

				it("should encode properties with hyphens using brackets", () => {
					expect(Expression({ pipe: [], path: ["first-name"] }, { format: "string" })).toBe("['first-name']");
					expect(Expression({
						pipe: [],
						path: ["content-type"]
					}, { format: "string" })).toBe("['content-type']");
				});

				it("should encode properties with spaces using brackets", () => {
					expect(Expression({
						pipe: [],
						path: ["my property"]
					}, { format: "string" })).toBe("['my property']");
					expect(Expression({ pipe: [], path: ["user name"] }, { format: "string" })).toBe("['user name']");
				});

				it("should encode properties with dots using brackets", () => {
					expect(Expression({ pipe: [], path: ["first.name"] }, { format: "string" })).toBe("['first.name']");
					expect(Expression({ pipe: [], path: ["user.email"] }, { format: "string" })).toBe("['user.email']");
				});

				it("should encode properties with special characters using brackets", () => {
					expect(Expression({ pipe: [], path: ["@id"] }, { format: "string" })).toBe("['@id']");
					expect(Expression({ pipe: [], path: ["@type"] }, { format: "string" })).toBe("['@type']");
					expect(Expression({ pipe: [], path: ["price-$"] }, { format: "string" })).toBe("['price-$']");
					expect(Expression({ pipe: [], path: ["100%"] }, { format: "string" })).toBe("['100%']");
				});

				it("should encode empty string property using brackets", () => {
					expect(Expression({ pipe: [], path: [""] }, { format: "string" })).toBe("['']");
				});

				it("should escape single quotes in bracket notation", () => {
					expect(Expression({ pipe: [], path: ["it's"] }, { format: "string" })).toBe("['it\\'s']");
					expect(Expression({
						pipe: [],
						path: ["user's name"]
					}, { format: "string" })).toBe("['user\\'s name']");
				});

				it("should escape backslashes in bracket notation", () => {
					expect(Expression({ pipe: [], path: ["path\\to\\file"] }, { format: "string" }))
						.toBe("['path\\\\to\\\\file']");
					expect(Expression({ pipe: [], path: ["C:\\Users"] }, { format: "string" })).toBe("['C:\\\\Users']");
				});

				it("should encode multiple properties with brackets", () => {
					expect(Expression({ pipe: [], path: ["first-name", "second-name"] }, { format: "string" }))
						.toBe("['first-name']['second-name']");
					expect(Expression({ pipe: [], path: ["@id", "@type"] }, { format: "string" }))
						.toBe("['@id']['@type']");
				});

			});

			describe("mixed notation encoding", () => {

				it("should encode mixed dot and bracket notation", () => {
					expect(Expression({ pipe: [], path: ["user", "first-name"] }, { format: "string" }))
						.toBe("user['first-name']");
					expect(Expression({ pipe: [], path: ["data", "items", "@id"] }, { format: "string" }))
						.toBe("data.items['@id']");
				});

				it("should encode deeply nested mixed paths", () => {
					expect(Expression({ pipe: [], path: ["user", "address", "city"] }, { format: "string" }))
						.toBe("user.address.city");
					expect(Expression({ pipe: [], path: ["data", "items", "@type", "name"] }, { format: "string" }))
						.toBe("data.items['@type'].name");
				});

			});

			describe("edge cases", () => {

				it("should encode empty path", () => {
					expect(Expression({ pipe: [], path: [] }, { format: "string" })).toBe("");
				});

			});

		});

		describe("transform-only expressions", () => {

			it("should encode single transform with empty path", () => {
				expect(Expression({ pipe: ["count"], path: [] }, { format: "string" })).toBe("count:");
				expect(Expression({ pipe: ["sum"], path: [] }, { format: "string" })).toBe("sum:");
				expect(Expression({ pipe: ["avg"], path: [] }, { format: "string" })).toBe("avg:");
			});

			it("should encode multiple transforms with empty path", () => {
				expect(Expression({ pipe: ["sum", "round"], path: [] }, { format: "string" })).toBe("sum:round:");
				expect(Expression({ pipe: ["avg", "abs"], path: [] }, { format: "string" })).toBe("avg:abs:");
				expect(Expression({ pipe: ["sum", "round", "abs"], path: [] }, { format: "string" }))
					.toBe("sum:round:abs:");
			});

		});

		describe("complete expressions", () => {

			describe("single transform", () => {

				it("should encode aggregate transforms with paths", () => {
					expect(Expression({ pipe: ["count"], path: ["items"] }, { format: "string" })).toBe("count:items");
					expect(Expression({ pipe: ["sum"], path: ["prices"] }, { format: "string" })).toBe("sum:prices");
					expect(Expression({ pipe: ["avg"], path: ["scores"] }, { format: "string" })).toBe("avg:scores");
				});

				it("should encode scalar transforms with paths", () => {
					expect(Expression({ pipe: ["abs"], path: ["temperature"] }, { format: "string" }))
						.toBe("abs:temperature");
					expect(Expression({ pipe: ["round"], path: ["price"] }, { format: "string" })).toBe("round:price");
					expect(Expression({
						pipe: ["year"],
						path: ["created"]
					}, { format: "string" })).toBe("year:created");
				});

				it("should encode transform with nested paths", () => {
					expect(Expression({ pipe: ["sum"], path: ["order", "items", "price"] }, { format: "string" }))
						.toBe("sum:order.items.price");
					expect(Expression({ pipe: ["count"], path: ["user", "posts"] }, { format: "string" }))
						.toBe("count:user.posts");
				});

				it("should encode transform with bracket notation paths", () => {
					expect(Expression({ pipe: ["sum"], path: ["item-price"] }, { format: "string" }))
						.toBe("sum:['item-price']");
					expect(Expression({ pipe: ["count"], path: ["items", "@id"] }, { format: "string" }))
						.toBe("count:items['@id']");
				});

			});

			describe("multiple transforms", () => {

				it("should encode two transforms with paths", () => {
					expect(Expression({ pipe: ["sum", "round"], path: ["prices"] }, { format: "string" }))
						.toBe("sum:round:prices");
					expect(Expression({ pipe: ["avg", "abs"], path: ["temperatures"] }, { format: "string" }))
						.toBe("avg:abs:temperatures");
				});

				it("should encode three transforms with paths", () => {
					expect(Expression({ pipe: ["sum", "round", "abs"], path: ["values"] }, { format: "string" }))
						.toBe("sum:round:abs:values");
				});

				it("should encode multiple transforms with nested paths", () => {
					expect(Expression({ pipe: ["avg", "round"], path: ["items", "price"] }, { format: "string" }))
						.toBe("avg:round:items.price");
				});

			});

			describe("complex cases", () => {

				it("should encode transforms with deeply nested paths", () => {
					expect(Expression({
						pipe: ["sum"],
						path: ["order", "customer", "address", "location", "coordinates"]
					}, { format: "string" })).toBe("sum:order.customer.address.location.coordinates");
				});

				it("should encode multiple transforms with mixed notation", () => {
					expect(Expression({ pipe: ["sum"], path: ["order", "items", "unit-price"] }, { format: "string" }))
						.toBe("sum:order.items['unit-price']");
					expect(Expression({
						pipe: ["avg"],
						path: ["data", "user-data", "scores", "test-1"]
					}, { format: "string" })).toBe("avg:data['user-data'].scores['test-1']");
				});

			});

		});

		describe("named expressions", () => {

			describe("name with path only", () => {

				it("should encode simple named paths", () => {
					expect(Expression({ name: "displayName", pipe: [], path: ["name"] }, { format: "string" }))
						.toBe("displayName=name");
					expect(Expression({ name: "userId", pipe: [], path: ["id"] }, { format: "string" }))
						.toBe("userId=id");
				});

				it("should encode named expressions with nested paths", () => {
					expect(Expression({ name: "userName", pipe: [], path: ["user", "name"] }, { format: "string" }))
						.toBe("userName=user.name");
					expect(Expression({ name: "cityName", pipe: [], path: ["address", "city"] }, { format: "string" }))
						.toBe("cityName=address.city");
				});

				it("should encode named expressions with bracket notation", () => {
					expect(Expression({ name: "firstName", pipe: [], path: ["first-name"] }, { format: "string" }))
						.toBe("firstName=['first-name']");
					expect(Expression({ name: "contentType", pipe: [], path: ["content-type"] }, { format: "string" }))
						.toBe("contentType=['content-type']");
				});

				it("should encode named expression with empty path", () => {
					expect(Expression({ name: "value", pipe: [], path: [] }, { format: "string" })).toBe("value=");
				});

			});

			describe("name with transforms", () => {

				it("should encode named expressions with single transform", () => {
					expect(Expression({
						name: "totalPrice",
						pipe: ["sum"],
						path: ["items", "price"]
					}, { format: "string" })).toBe("totalPrice=sum:items.price");

					expect(Expression({ name: "itemCount", pipe: ["count"], path: ["items"] }, { format: "string" }))
						.toBe("itemCount=count:items");

					expect(Expression({ name: "avgScore", pipe: ["avg"], path: ["scores"] }, { format: "string" }))
						.toBe("avgScore=avg:scores");
				});

				it("should encode named expressions with multiple transforms", () => {
					expect(Expression({
						name: "totalRounded",
						pipe: ["sum", "round"],
						path: ["prices"]
					}, { format: "string" })).toBe("totalRounded=sum:round:prices");

					expect(Expression({
						name: "avgYear",
						pipe: ["avg", "year"],
						path: ["dates"]
					}, { format: "string" }))
						.toBe("avgYear=avg:year:dates");
				});

				it("should encode named expressions with transforms and nested paths", () => {
					expect(Expression({
						name: "orderTotal",
						pipe: ["sum"],
						path: ["order", "items", "price"]
					}, { format: "string" })).toBe("orderTotal=sum:order.items.price");
				});

				it("should encode named expressions with transforms and empty path", () => {
					expect(Expression({ name: "total", pipe: ["sum"], path: [] }, { format: "string" }))
						.toBe("total=sum:");
				});

			});

			describe("name syntax variations", () => {

				it("should encode names with underscores", () => {
					expect(Expression({ name: "first_name", pipe: [], path: ["name"] }, { format: "string" }))
						.toBe("first_name=name");
					expect(Expression({ name: "__private", pipe: [], path: ["value"] }, { format: "string" }))
						.toBe("__private=value");
				});

				it("should encode names with dollar signs", () => {
					expect(Expression({ name: "$scope", pipe: [], path: ["scope"] }, { format: "string" }))
						.toBe("$scope=scope");
					expect(Expression({ name: "$$value", pipe: [], path: ["val"] }, { format: "string" }))
						.toBe("$$value=val");
				});

				it("should encode names with numbers", () => {
					expect(Expression({ name: "value1", pipe: [], path: ["data"] }, { format: "string" }))
						.toBe("value1=data");
					expect(Expression({ name: "item123", pipe: [], path: ["item"] }, { format: "string" }))
						.toBe("item123=item");
				});

			});

			describe("complex named expressions", () => {

				it("should encode named expressions with deeply nested paths", () => {
					expect(Expression({
						name: "fullAddress",
						pipe: [],
						path: ["user", "profile", "contact", "address", "street"]
					}, { format: "string" })).toBe("fullAddress=user.profile.contact.address.street");
				});

				it("should encode named expressions with multiple transforms and nested paths", () => {
					expect(Expression({
						name: "totalRevenue",
						pipe: ["sum", "round"],
						path: ["orders", "items", "price"]
					}, { format: "string" })).toBe("totalRevenue=sum:round:orders.items.price");

					expect(Expression({
						name: "avgAge",
						pipe: ["avg", "round"],
						path: ["users", "profile", "age"]
					}, { format: "string" })).toBe("avgAge=avg:round:users.profile.age");
				});

				it("should encode named expressions with mixed notation", () => {
					expect(Expression({
						name: "contentType",
						pipe: [],
						path: ["response", "headers", "content-type"]
					}, { format: "string" })).toBe("contentType=response.headers['content-type']");

					expect(Expression({
						name: "itemTotal",
						pipe: ["sum"],
						path: ["order", "line-items", "price"]
					}, { format: "string" })).toBe("itemTotal=sum:order['line-items'].price");
				});

			});

		});

		describe("round-trip encoding/decoding", () => {

			it("should round-trip path-only expressions", () => {
				const inputs = [
					"name",
					"user.name",
					"user.profile.avatar",
					"['first-name']",
					"user['first-name']",
					"data.items['@id']"
				];
				inputs.forEach(input => {
					const decoded = Expression(input);
					const encoded = Expression(decoded, { format: "string" });
					expect(Expression(encoded)).toEqual(decoded);
				});
			});

			it("should round-trip expressions with transforms", () => {
				const inputs = [
					"count:items",
					"sum:prices",
					"sum:round:prices",
					"avg:abs:temperatures",
					"sum:order.items.price"
				];
				inputs.forEach(input => {
					const decoded = Expression(input);
					const encoded = Expression(decoded, { format: "string" });
					expect(Expression(encoded)).toEqual(decoded);
				});
			});

			it("should round-trip named expressions", () => {
				const inputs = [
					"displayName=name",
					"userName=user.name",
					"totalPrice=sum:items.price",
					"totalRounded=sum:round:prices",
					"orderTotal=sum:order.items.price"
				];
				inputs.forEach(input => {
					const decoded = Expression(input);
					const encoded = Expression(decoded, { format: "string" });
					expect(Expression(encoded)).toEqual(decoded);
				});
			});

		});

	});

});
