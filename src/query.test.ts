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
import { Path } from "./query.js";


describe("Path() decoder", () => {

	describe("dot notation - valid identifiers", () => {

		it("should parse single property", () => {
			expect(Path("name")).toEqual(["name"]);
			expect(Path("email")).toEqual(["email"]);
			expect(Path("_id")).toEqual(["_id"]);
			expect(Path("$ref")).toEqual(["$ref"]);
		});

		it("should parse multiple properties", () => {
			expect(Path("user.name")).toEqual(["user", "name"]);
			expect(Path("address.city")).toEqual(["address", "city"]);
			expect(Path("user.profile.avatar")).toEqual(["user", "profile", "avatar"]);
		});

		it("should parse properties with numbers", () => {
			expect(Path("item1")).toEqual(["item1"]);
			expect(Path("value123")).toEqual(["value123"]);
			expect(Path("prop_99")).toEqual(["prop_99"]);
		});

		it("should parse properties with underscores", () => {
			expect(Path("first_name")).toEqual(["first_name"]);
			expect(Path("__proto__")).toEqual(["__proto__"]);
			expect(Path("_private")).toEqual(["_private"]);
		});

		it("should parse properties with dollar signs", () => {
			expect(Path("$scope")).toEqual(["$scope"]);
			expect(Path("$$watchers")).toEqual(["$$watchers"]);
		});

		it("should allow reserved keywords", () => {
			expect(Path("class")).toEqual(["class"]);
			expect(Path("function")).toEqual(["function"]);
			expect(Path("return")).toEqual(["return"]);
			expect(Path("if.then.else")).toEqual(["if", "then", "else"]);
		});

		it("should handle optional leading dot", () => {
			expect(Path(".name")).toEqual(["name"]);
			expect(Path(".user.name")).toEqual(["user", "name"]);
		});

	});

	describe("bracket notation - single quotes only", () => {

		it("should parse simple bracket properties", () => {
			expect(Path("['name']")).toEqual(["name"]);
			expect(Path("['email']")).toEqual(["email"]);
		});

		it("should parse properties with dots", () => {
			expect(Path("['first.name']")).toEqual(["first.name"]);
			expect(Path("['user.email']")).toEqual(["user.email"]);
		});

		it("should parse properties with spaces", () => {
			expect(Path("['my property']")).toEqual(["my property"]);
			expect(Path("['user name']")).toEqual(["user name"]);
		});

		it("should parse properties with hyphens", () => {
			expect(Path("['first-name']")).toEqual(["first-name"]);
			expect(Path("['content-type']")).toEqual(["content-type"]);
		});

		it("should parse properties with special characters", () => {
			expect(Path("['@id']")).toEqual(["@id"]);
			expect(Path("['@type']")).toEqual(["@type"]);
			expect(Path("['price-$']")).toEqual(["price-$"]);
			expect(Path("['100%']")).toEqual(["100%"]);
		});

		it("should parse empty string property", () => {
			expect(Path("['']")).toEqual([""]);
		});

		it("should parse properties with escaped single quotes", () => {
			expect(Path("['it\\'s']")).toEqual(["it's"]);
			expect(Path("['user\\'s name']")).toEqual(["user's name"]);
		});

		it("should parse properties with escaped backslashes", () => {
			expect(Path("['path\\\\to\\\\file']")).toEqual(["path\\to\\file"]);
			expect(Path("['C:\\\\Users']")).toEqual(["C:\\Users"]);
		});

		it("should parse multiple bracket properties", () => {
			expect(Path("['first']['second']")).toEqual(["first", "second"]);
			expect(Path("['a']['b']['c']")).toEqual(["a", "b", "c"]);
		});

	});

	describe("mixed notation", () => {

		it("should parse dot followed by bracket", () => {
			expect(Path("user['first-name']")).toEqual(["user", "first-name"]);
			expect(Path("data.items['@id']")).toEqual(["data", "items", "@id"]);
		});

		it("should parse bracket followed by dot", () => {
			expect(Path("['user'].name")).toEqual(["user", "name"]);
			expect(Path("['@context'].title")).toEqual(["@context", "title"]);
		});

		it("should parse complex mixed paths", () => {
			expect(Path("user['address'].city")).toEqual(["user", "address", "city"]);
			expect(Path("data.items['@type'].name")).toEqual(["data", "items", "@type", "name"]);
			expect(Path("['user'].profile['avatar-url']")).toEqual(["user", "profile", "avatar-url"]);
		});

		it("should handle leading dot with mixed notation", () => {
			expect(Path(".user['name']")).toEqual(["user", "name"]);
			expect(Path(".['user'].name")).toEqual(["user", "name"]);
		});

	});

	describe("edge cases", () => {

		it("should parse empty path", () => {
			expect(Path("")).toEqual([]);
		});

		it("should handle leading dot only", () => {
			expect(Path(".")).toEqual([]);
		});

	});

	describe("JSONPath root", () => {

		it("should strip leading $ (JSONPath root)", () => {
			expect(Path("$")).toEqual([]);
			expect(Path("$.name")).toEqual(["name"]);
			expect(Path("$['name']")).toEqual(["name"]);
			expect(Path("$.user.name")).toEqual(["user", "name"]);
		});

	});

	describe("invalid paths", () => {

		it("should reject double quotes in brackets", () => {
			expect(() => Path("[\"name\"]")).toThrow();
			expect(() => Path("[\"first\"][\"second\"]")).toThrow();
		});

		it("should reject brackets without quotes", () => {
			expect(() => Path("[name]")).toThrow();
			expect(() => Path("[0]")).toThrow();
		});

		it("should reject unclosed brackets", () => {
			expect(() => Path("['name'")).toThrow();
			expect(() => Path("['name']'")).toThrow();
		});

		it("should reject unescaped quotes", () => {
			expect(() => Path("['it's']")).toThrow();
		});

		it("should reject invalid dot notation", () => {
			expect(() => Path("user.")).toThrow();
			expect(() => Path(".user.")).toThrow();
			expect(() => Path("user..name")).toThrow();
		});

		it("should reject properties starting with digits", () => {
			expect(() => Path("123abc")).toThrow();
			expect(() => Path("user.9lives")).toThrow();
		});

		it("should reject properties with invalid characters in dot notation", () => {
			expect(() => Path("first-name")).toThrow();
			expect(() => Path("my property")).toThrow();
			expect(() => Path("@id")).toThrow();
		});

	});

});

describe.skip("Path() encoder", () => {

	describe("dot notation for valid identifiers", () => {

		it("should encode single property", () => {
			expect(Path(["name"], { format: "string" })).toBe("name");
			expect(Path(["email"], { format: "string" })).toBe("email");
			expect(Path(["_id"], { format: "string" })).toBe("_id");
			expect(Path(["$ref"], { format: "string" })).toBe("$ref");
		});

		it("should encode multiple properties", () => {
			expect(Path(["user", "name"], { format: "string" })).toBe("user.name");
			expect(Path(["address", "city"], { format: "string" })).toBe("address.city");
			expect(Path(["user", "profile", "avatar"], { format: "string" })).toBe("user.profile.avatar");
		});

		it("should encode properties with numbers", () => {
			expect(Path(["item1"], { format: "string" })).toBe("item1");
			expect(Path(["value123"], { format: "string" })).toBe("value123");
		});

		it("should encode properties with underscores", () => {
			expect(Path(["first_name"], { format: "string" })).toBe("first_name");
			expect(Path(["__proto__"], { format: "string" })).toBe("__proto__");
		});

		it("should encode properties with dollar signs", () => {
			expect(Path(["$scope"], { format: "string" })).toBe("$scope");
			expect(Path(["$$watchers"], { format: "string" })).toBe("$$watchers");
		});

		it("should encode reserved keywords", () => {
			expect(Path(["class"], { format: "string" })).toBe("class");
			expect(Path(["function"], { format: "string" })).toBe("function");
			expect(Path(["if", "then", "else"], { format: "string" })).toBe("if.then.else");
		});

	});

	describe("bracket notation for special characters", () => {

		it("should encode properties with dots", () => {
			expect(Path(["first.name"], { format: "string" })).toBe("['first.name']");
			expect(Path(["user.email"], { format: "string" })).toBe("['user.email']");
		});

		it("should encode properties with spaces", () => {
			expect(Path(["my property"], { format: "string" })).toBe("['my property']");
			expect(Path(["user name"], { format: "string" })).toBe("['user name']");
		});

		it("should encode properties with hyphens", () => {
			expect(Path(["first-name"], { format: "string" })).toBe("['first-name']");
			expect(Path(["content-type"], { format: "string" })).toBe("['content-type']");
		});

		it("should encode properties with special characters", () => {
			expect(Path(["@id"], { format: "string" })).toBe("['@id']");
			expect(Path(["@type"], { format: "string" })).toBe("['@type']");
			expect(Path(["price-$"], { format: "string" })).toBe("['price-$']");
			expect(Path(["100%"], { format: "string" })).toBe("['100%']");
		});

		it("should encode empty string property", () => {
			expect(Path([""], { format: "string" })).toBe("['']");
		});

		it("should encode properties with single quotes (escaped)", () => {
			expect(Path(["it's"], { format: "string" })).toBe("['it\\'s']");
			expect(Path(["user's name"], { format: "string" })).toBe("['user\\'s name']");
		});

		it("should encode properties with backslashes (escaped)", () => {
			expect(Path(["path\\to\\file"], { format: "string" })).toBe("['path\\\\to\\\\file']");
			expect(Path(["C:\\Users"], { format: "string" })).toBe("['C:\\\\Users']");
		});

		it("should encode properties starting with digits", () => {
			expect(Path(["123abc"], { format: "string" })).toBe("['123abc']");
			expect(Path(["9lives"], { format: "string" })).toBe("['9lives']");
		});

	});

	describe("mixed notation", () => {

		it("should use dot notation when possible, bracket when needed", () => {
			expect(Path(["user", "first-name"], { format: "string" })).toBe("user['first-name']");
			expect(Path(["data", "items", "@id"], { format: "string" })).toBe("data.items['@id']");
		});

		it("should handle bracket followed by dot", () => {
			expect(Path(["@context", "title"], { format: "string" })).toBe("['@context'].title");
			expect(Path(["first-name", "value"], { format: "string" })).toBe("['first-name'].value");
		});

		it("should handle complex mixed paths", () => {
			expect(Path(["user", "address", "city"], { format: "string" })).toBe("user.address.city");
			expect(Path(["data", "items", "@type", "name"], { format: "string" })).toBe("data.items['@type'].name");
			expect(Path(["user", "profile", "avatar-url"], { format: "string" })).toBe("user.profile['avatar-url']");
		});

	});

	describe("edge cases", () => {

		it("should encode empty path", () => {
			expect(Path([], { format: "string" })).toBe("");
		});

	});

	describe("roundtrip - encoder/decoder inverse", () => {

		it("should roundtrip dot notation", () => {
			const paths = ["name", "user.name", "a.b.c"];
			paths.forEach(p => {
				expect(Path(Path(p), { format: "string" })).toBe(p);
			});
		});

		it("should roundtrip bracket notation", () => {
			const paths = ["['@id']", "['first-name']", "['a']['b']"];
			paths.forEach(p => {
				expect(Path(Path(p), { format: "string" })).toBe(p);
			});
		});

		it("should roundtrip mixed notation", () => {
			const paths = ["user['first-name']", "['@context'].title", "a.b['c-d'].e"];
			paths.forEach(p => {
				expect(Path(Path(p), { format: "string" })).toBe(p);
			});
		});

	});

});
