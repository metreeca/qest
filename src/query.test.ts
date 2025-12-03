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

		it("should create immutable query object", async () => {
			const query = Query({ name: "John", age: 30 });
			expect(() => {
				(query as any).name = "Jane";
			}).toThrow();
		});

		it("should isolate result from input mutations", async () => {
			const input = { name: "John", age: 30 };
			const query = Query(input);

			// Mutating input shouldn't affect the frozen result
			input.name = "Jane";
			input.age = 25;

			expect(query).toEqual({ name: "John", age: 30 });
		});

		it("should handle empty query object", async () => {
			const query = Query({});
			expect(query).toEqual({});
		});

		it("should handle nested objects", async () => {
			const input = {
				user: { name: "John", email: "john@example.com" },
				settings: { theme: "dark" }
			};
			const query = Query(input);
			expect(query).toEqual(input);
		});

		it("should handle array values", async () => {
			const query = Query({
				tags: ["javascript", "typescript"],
				scores: [10, 20, 30]
			});
			expect(query).toEqual({
				tags: ["javascript", "typescript"],
				scores: [10, 20, 30]
			});
		});

		it("should create immutable nested objects", async () => {
			const query = Query({
				user: { name: "John" }
			});
			expect(() => {
				(query.user as any).name = "Jane";
			}).toThrow();
		});

		it("should create immutable arrays", async () => {
			const query = Query({
				tags: ["javascript", "typescript"]
			});
			expect(() => {
				(query.tags as any).push("python");
			}).toThrow();
		});

		describe("Properties constraint validation", () => {

			it("should reject empty string as property name", async () => {
				expect(() => Query({ "": "value" } as any)).toThrow(TypeError);
			});

			it("should reject property names starting with @", async () => {
				expect(() => Query({ "@context": "value" } as any)).toThrow(TypeError);
				expect(() => Query({ "@id": "123" } as any)).toThrow(TypeError);
				expect(() => Query({ "@type": "Person" } as any)).toThrow(TypeError);
			});

			it("should accept valid property names", async () => {
				expect(() => Query({ name: "John" })).not.toThrow();
				expect(() => Query({ email: "test@example.com" })).not.toThrow();
				expect(() => Query({ _private: "value" })).not.toThrow();
				expect(() => Query({ $scope: "value" })).not.toThrow();
			});


		});

		describe("Query type structure validation", () => {

			it("should accept literal values", async () => {
				expect(() => Query({ name: "John" })).not.toThrow();
				expect(() => Query({ email: "test@example.com" })).not.toThrow();
				expect(() => Query({ age: 30 })).not.toThrow();
				expect(() => Query({ active: true })).not.toThrow();
			});

			it("should accept special numeric values", async () => {
				expect(() => Query({ count: 0 })).not.toThrow();
				expect(() => Query({ offset: -1 })).not.toThrow();
				expect(() => Query({ ratio: 0.5 })).not.toThrow();
				expect(() => Query({ large: Number.MAX_SAFE_INTEGER })).not.toThrow();
			});

			it("should accept empty arrays", async () => {
				expect(() => Query({ tags: [] })).not.toThrow();
				expect(() => Query({ items: [] })).not.toThrow();
			});

			it("should accept Resource objects as values", async () => {
				expect(() => Query({
					user: { name: "John", email: "john@example.com" }
				})).not.toThrow();
			});

			it("should accept array values", async () => {
				expect(() => Query({ tags: ["js", "ts"] })).not.toThrow();
				expect(() => Query({ scores: [1, 2, 3] })).not.toThrow();
			});

			it("should accept Dictionary values", async () => {
				expect(() => Query({
					title: { en: "Hello", it: "Ciao" }
				})).not.toThrow();
			});

			it("should accept arrays of Model/Specs objects", async () => {
				expect(() => Query({
					items: [
						{ name: "Item 1" },
						{ ">=price": 10 }
					]
				})).not.toThrow();
			});

			it("should accept arrays with only Model objects", async () => {
				expect(() => Query({
					items: [
						{ name: "Item 1" },
						{ name: "Item 2" }
					]
				})).not.toThrow();
			});

			it("should accept arrays with only Specs objects", async () => {
				expect(() => Query({
					items: [
						{ ">=price": 10 },
						{ "<=price": 100 }
					]
				})).not.toThrow();
			});

			it("should reject array objects mixing Model and Specs properties", async () => {
				expect(() => Query({
					items: [
						{ name: "Item 1", ">=price": 10 } as any
					]
				})).toThrow(TypeError);
			});

			it("should reject array objects mixing computed properties and Specs", async () => {
				expect(() => Query({
					items: [
						{ "totalPrice=sum:items.price": 100, "<price": 50 } as any
					]
				})).toThrow(TypeError);
			});

			it("should handle mixed value types", async () => {
				expect(() => Query({
					name: "John",
					tags: ["a", "b"],
					title: { en: "Hello", it: "Ciao" },
					nested: { id: 123 },
					items: [{ ">price": 10 }]
				})).not.toThrow();
			});

			it("should reject null at top level", async () => {
				expect(() => Query({ name: null } as any)).toThrow(TypeError);
			});

			it("should reject undefined at top level", async () => {
				expect(() => Query({ name: undefined } as any)).toThrow(TypeError);
			});

		});

		describe("Model key patterns validation", () => {

			it("should accept valid identifier keys", async () => {
				expect(() => Query({ "name": "value" })).not.toThrow();
				expect(() => Query({ "email": "value" })).not.toThrow();
				expect(() => Query({ "_id": "value" })).not.toThrow();
				expect(() => Query({ "$scope": "value" })).not.toThrow();
				expect(() => Query({ "user123": "value" })).not.toThrow();
			});

			it("should accept computed property syntax", async () => {
				expect(() => Query({ "totalPrice=sum:items.price": "value" })).not.toThrow();
				expect(() => Query({ "userName=user.name": "value" })).not.toThrow();
				expect(() => Query({ "avgScore=avg:round:scores": 0 })).not.toThrow();
				expect(() => Query({ "itemCount=count:items": 0 })).not.toThrow();
			});

			it("should reject keys with hyphens without named expression", async () => {
				expect(() => Query({ "first-name": "value" } as any)).toThrow(TypeError);
				expect(() => Query({ "content-type": "value" } as any)).toThrow(TypeError);
			});

			it("should reject keys with spaces without named expression", async () => {
				expect(() => Query({ "my property": "value" } as any)).toThrow(TypeError);
				expect(() => Query({ "user name": "value" } as any)).toThrow(TypeError);
			});

			it("should reject keys starting with digits", async () => {
				expect(() => Query({ "123abc": "value" } as any)).toThrow(TypeError);
				expect(() => Query({ "9lives": "value" } as any)).toThrow(TypeError);
			});

			it("should reject keys starting with =", async () => {
				expect(() => Query({ "=invalid": "value" } as any)).toThrow(TypeError);
				expect(() => Query({ "=sum:items": "value" } as any)).toThrow(TypeError);
			});

		});

		describe("Specs constraints validation", () => {

			it("should accept comparison operators", async () => {
				expect(() => Query({ "<price": 100 })).not.toThrow();
				expect(() => Query({ ">price": 10 })).not.toThrow();
				expect(() => Query({ "<=age": 65 })).not.toThrow();
				expect(() => Query({ ">=rating": 4 })).not.toThrow();
			});

			it("should reject non-Literal values for comparison operators", async () => {
				expect(() => Query({ "<price": { en: "10" } } as any)).toThrow(TypeError);
				expect(() => Query({ ">price": [1, 2] } as any)).toThrow(TypeError);
				expect(() => Query({ "<=age": null } as any)).toThrow(TypeError);
			});

			it("should accept text search operator", async () => {
				expect(() => Query({ "~title": "javascript" })).not.toThrow();
			});

			it("should reject non-string values for text search operator", async () => {
				expect(() => Query({ "~title": 123 } as any)).toThrow(TypeError);
				expect(() => Query({ "~title": true } as any)).toThrow(TypeError);
				expect(() => Query({ "~title": null } as any)).toThrow(TypeError);
			});

			it("should accept matching operators", async () => {
				expect(() => Query({ "?status": ["active", "pending"] })).not.toThrow();
				expect(() => Query({ "!tags": ["javascript", "typescript"] })).not.toThrow();
			});

			it("should accept Options value types for matching operators", async () => {
				expect(() => Query({ "?status": "active" })).not.toThrow();
				expect(() => Query({ "?title": { en: "Hello" } })).not.toThrow();
				expect(() => Query({ "?value": null } as any)).not.toThrow();
			});

			it("should accept ordering operators", async () => {
				expect(() => Query({ "$priority": [1, 2, 3] })).not.toThrow();
				expect(() => Query({ "^name": "asc" })).not.toThrow();
				expect(() => Query({ "^name": "ascending" })).not.toThrow();
				expect(() => Query({ "^name": 1 })).not.toThrow();
			});

			it("should accept desc ordering values", async () => {
				expect(() => Query({ "^name": "desc" })).not.toThrow();
				expect(() => Query({ "^name": "descending" })).not.toThrow();
				expect(() => Query({ "^name": -1 })).not.toThrow();
			});

			it("should reject invalid ordering values", async () => {
				expect(() => Query({ "^name": "invalid" } as any)).toThrow(TypeError);
				expect(() => Query({ "^name": true } as any)).toThrow(TypeError);
				expect(() => Query({ "^name": null } as any)).toThrow(TypeError);
			});

			it("should accept pagination with @ key", async () => {
				expect(() => Query({ "@": 10 } as any)).not.toThrow();
				expect(() => Query({ "@": 0 } as any)).not.toThrow();
			});

			it("should reject negative values for pagination", async () => {
				expect(() => Query({ "@": -1 } as any)).toThrow(TypeError);
			});

			it("should reject non-number values for pagination", async () => {
				expect(() => Query({ "@": "10" } as any)).toThrow(TypeError);
				expect(() => Query({ "@": true } as any)).toThrow(TypeError);
				expect(() => Query({ "@": null } as any)).toThrow(TypeError);
			});

			it("should accept limit with # key", async () => {
				expect(() => Query({ "#": 20 })).not.toThrow();
				expect(() => Query({ "#": 0 })).not.toThrow();
			});

			it("should reject negative values for limit", async () => {
				expect(() => Query({ "#": -1 } as any)).toThrow(TypeError);
			});

			it("should reject non-number values for limit", async () => {
				expect(() => Query({ "#": "20" } as any)).toThrow(TypeError);
				expect(() => Query({ "#": true } as any)).toThrow(TypeError);
				expect(() => Query({ "#": null } as any)).toThrow(TypeError);
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
				expect(Expression("user.profile.avatar")).toEqual({ pipe: [], path: ["user", "profile", "avatar"] });
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
				expect(Expression(".user.profile.avatar")).toEqual({ pipe: [], path: ["user", "profile", "avatar"] });
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
				expect(Expression("avg:abs:temperatures")).toEqual({ pipe: ["avg", "abs"], path: ["temperatures"] });
			});

			it("should parse three transforms", () => {
				expect(Expression("sum:round:abs:values")).toEqual({ pipe: ["sum", "round", "abs"], path: ["values"] });
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
				expect(Expression("sum:_private.$$value")).toEqual({ pipe: ["sum"], path: ["_private", "$$value"] });
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
				expect(Expression({ pipe: [], path: ["address", "city"] }, { format: "string" })).toBe("address.city");
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
				expect(Expression({ pipe: [], path: ["content-type"] }, { format: "string" })).toBe("['content-type']");
			});

			it("should encode properties with spaces using brackets", () => {
				expect(Expression({ pipe: [], path: ["my property"] }, { format: "string" })).toBe("['my property']");
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
				expect(Expression({ pipe: [], path: ["user's name"] }, { format: "string" })).toBe("['user\\'s name']");
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
				expect(Expression({ pipe: ["year"], path: ["created"] }, { format: "string" })).toBe("year:created");
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

				expect(Expression({ name: "avgYear", pipe: ["avg", "year"], path: ["dates"] }, { format: "string" }))
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
