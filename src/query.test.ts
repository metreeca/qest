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
import { model, Model, specs, Specs } from "./query.js";


describe("Model", () => {

	it("should accept regular property keys", () => {

		// Positive: regular property names work

		const valid: Model = {
			name: "John",
			age: 30,
			city: "New York",
			items: ["a", "b", "c"]
		};

		expect(valid).toBeDefined();
	});

	it("should accept computed property keys with expression", () => {

		// Positive: computed properties work

		const valid: Model = {
			name: "John",
			"city=upper:address.city": "NEW YORK",
			"count=count:items": 5,
			"total=sum:items.price": 150.50
		};

		expect(valid).toBeDefined();
	});

	it("should exclude keys starting with =", () => {

		// Negative: keys starting with = are excluded

		const invalid1: Model = {
			// @ts-expect-error - Keys starting with = are not allowed
			"=invalid": "value"
		};

		expect(invalid1).toBeDefined();
	});

	it("should exclude empty string keys", () => {

		// Negative: empty string is excluded (inherited from Properties)

		const invalid: Model = {
			// @ts-expect-error - Empty string key should be excluded
			"": "value"
		};

		expect(invalid).toBeDefined();
	});

	it("should exclude @-prefixed keyword keys", () => {

		// Negative: @-prefixed keys are excluded (inherited from Properties)

		const invalid1: Model = {
			// @ts-expect-error - @id is reserved
			"@id": "value"
		};

		const invalid2: Model = {
			// @ts-expect-error - @type is reserved
			"@type": "Person"
		};

		const invalid3: Model = {
			name: "John",
			// @ts-expect-error - @context is reserved even with valid keys
			"@context": "https://schema.org"
		};

		expect(invalid1).toBeDefined();
		expect(invalid2).toBeDefined();
		expect(invalid3).toBeDefined();
	});

	it("should accept all valid value types", () => {

		// Positive: all value types work

		const valid: Model = {
			boolean: true,
			number: 42,
			string: "text",
			dictionary: { en: "English", it: "Italian" },
			array: [1, 2, 3],
			nested: { name: "Nested", value: 100 }
		};

		expect(valid).toBeDefined();
	});

});

describe("model()", () => {

	it("should accept regular property keys", () => {

		const valid: Model = model({
			name: "John",
			age: 30,
			city: "New York",
			items: ["a", "b", "c"]
		});

		expect(valid).toBeDefined();
	});

	it("should accept computed property keys with expression", () => {

		const prop = "address.city";
		const count = "items";
		const price = "items.price";

		const valid: Model = model({
			name: "John",
			[`city=${prop}`]: "NEW YORK",
			[`count=${count}`]: 5,
			[`total=${price}`]: 150.50
		});

		expect(valid).toBeDefined();
	});

	it("should accept all valid value types", () => {

		const valid: Model = model({
			boolean: true,
			number: 42,
			string: "text",
			dictionary: { en: "English", it: "Italian" },
			array: [1, 2, 3],
			nested: { name: "Nested", value: 100 }
		});

		expect(valid).toBeDefined();
	});

	it("should accept empty model", () => {

		const valid: Model = model({});

		expect(valid).toBeDefined();
	});

	it("should accept combining regular and computed properties", () => {

		const expr1 = "upper:address.city";
		const expr2 = "count:items";

		const valid: Model = model({
			name: "John",
			age: 30,
			[`city=${expr1}`]: "NEW YORK",
			[`itemCount=${expr2}`]: 5,
			tags: ["tag1", "tag2"],
			metadata: { en: "English", it: "Italian" }
		});

		expect(valid).toBeDefined();
	});

	it("should reject keys starting with =", () => {

		const invalid: Model = model({
			// @ts-expect-error - Keys starting with = are not allowed
			"=invalid": "value"
		});

		expect(invalid).toBeDefined();
	});

	it("should reject keys starting with = even with other valid keys", () => {

		const invalid: Model = model({
			name: "John",
			// @ts-expect-error - Keys starting with = are not allowed
			"=computed": "value"
		});

		expect(invalid).toBeDefined();
	});

	it("should reject empty string keys", () => {

		const invalid: Model = model({
			// @ts-expect-error - Empty string key should be excluded
			"": "value"
		});

		expect(invalid).toBeDefined();
	});

	it("should reject @-prefixed keyword keys", () => {

		const invalid1: Model = model({
			// @ts-expect-error - @id is reserved
			"@id": "value"
		});

		const invalid2: Model = model({
			// @ts-expect-error - @type is reserved
			"@type": "Person"
		});

		const invalid3: Model = model({
			name: "John",
			// @ts-expect-error - @context is reserved
			"@context": "https://schema.org"
		});

		expect(invalid1).toBeDefined();
		expect(invalid2).toBeDefined();
		expect(invalid3).toBeDefined();
	});

	it("should reject invalid value types", () => {

		const invalid1: Model = model({
			// @ts-expect-error - function not allowed
			callback: () => true
		});

		const invalid2: Model = model({
			// @ts-expect-error - Date object not allowed
			date: new Date()
		});

		const invalid3: Model = model({
			// @ts-expect-error - RegExp not allowed
			pattern: /test/
		});

		expect(invalid1).toBeDefined();
		expect(invalid2).toBeDefined();
		expect(invalid3).toBeDefined();
	});

	it("should reject invalid value types in computed properties", () => {

		const expr = "transform:value";

		const invalid: Model = model({
			// @ts-expect-error - function not allowed even in computed property
			[`result=${expr}`]: () => "computed"
		});

		expect(invalid).toBeDefined();
	});

});

describe("query()", () => {

	it("should accept comparison constraints", () => {

		const age = "age";
		const price = "price";
		const count = "count";
		const year = "year";

		const valid: Specs = specs({
			[`<${age}`]: 50,
			[`>${price}`]: 100,
			[`<=${count}`]: 1000,
			[`>=${year}`]: 2020
		});

		expect(valid).toBeDefined();
	});

	it("should accept pattern match constraints", () => {

		const name = "name";
		const email = "year:email";

		const valid: Specs = specs({
			[`~${name}`]: "John*",
			[`~${email}`]: "*@EXAMPLE.COM"
		});

		expect(valid).toBeDefined();
	});

	it("should accept filter constraints", () => {

		const status = "status";
		const active = "active";
		const tags = "tags";

		const valid: Specs = specs({
			[`?${status}`]: null,
			[`?${active}`]: true,
			[`?${tags}`]: ["tag1", "tag2"]
		});

		expect(valid).toBeDefined();
	});

	it("should accept conjunctive filter constraints", () => {

		const status = "status";
		const roles = "roles";
		const level = "level";

		const valid: Specs = specs({
			[`!${status}`]: "active",
			[`!${roles}`]: ["admin", "user"],
			[`!${level}`]: null
		});

		expect(valid).toBeDefined();
	});

	it("should accept sort constraints", () => {

		const name = "name";
		const price = "price";
		const priority = "priority";

		const valid: Specs = specs({
			[`^${name}`]: "ascending",
			[`^${price}`]: "descending",
			[`^${priority}`]: 1
		});

		expect(valid).toBeDefined();
	});

	it("should accept focus constraints", () => {

		const category = "category";
		const fields = "fields";

		const valid: Specs = specs({
			[`$${category}`]: "electronics",
			[`$${fields}`]: ["name", "price"]
		});

		expect(valid).toBeDefined();
	});

	it("should accept special @ and # keys for offset and limit", () => {

		const valid: Specs = specs({
			"@": 10,
			"#": 50
		});

		expect(valid).toBeDefined();
	});

	it("should allow empty specs", () => {

		const valid: Specs = specs({});

		expect(valid).toBeDefined();
	});

	it("should allow combining all constraint types", () => {

		const age = "age";
		const price = "price";
		const name = "name";
		const status = "status";

		const valid: Specs = specs({
			[`<${age}`]: 50,
			[`>${price}`]: 10.0,
			[`~${name}`]: "John*",
			[`!${status}`]: "active",
			[`^${price}`]: "descending",
			"@": 0,
			"#": 20
		});

		expect(valid).toBeDefined();
	});

	it("should reject keys with invalid operator prefixes", () => {

		const name = "name";
		const active = "active";

		const invalid1: Specs = specs({
			// @ts-expect-error - invalid operator prefix *
			[`*${name}`]: "value"
		});

		const invalid2: Specs = specs({
			// @ts-expect-error - invalid operator prefix =
			[`=${name}`]: "value"
		});

		const invalid3: Specs = specs({
			// @ts-expect-error - invalid operator prefix %
			[`%${active}`]: true
		});

		expect(invalid1).toBeDefined();
		expect(invalid2).toBeDefined();
		expect(invalid3).toBeDefined();
	});

	it("should reject wrong value types for comparison constraints", () => {

		const age = "age";

		const invalid: Specs = specs({
			// @ts-expect-error - object not allowed for comparison constraint (only Literal: boolean | number | string)
			[`<${age}`]: { value: 50 }
		});

		expect(invalid).toBeDefined();
	});

	it("should reject wrong value types for pattern match constraints", () => {

		const name = "name";

		const invalid: Specs = specs({
			// @ts-expect-error - number not allowed for pattern match constraint
			[`~${name}`]: 123
		});

		expect(invalid).toBeDefined();
	});

	it("should reject wrong value types for sort constraints", () => {

		const price = "price";

		const invalid: Specs = specs({
			// @ts-expect-error - boolean not allowed for sort constraint (only string | number)
			[`^${price}`]: true
		});

		expect(invalid).toBeDefined();
	});

	it("should reject wrong value types for @ and #", () => {

		const invalid1: Specs = specs({
			// @ts-expect-error - string not allowed for @ (offset)
			"@": "10"
		});

		const invalid2: Specs = specs({
			// @ts-expect-error - boolean not allowed for # (limit)
			"#": true
		});

		expect(invalid1).toBeDefined();
		expect(invalid2).toBeDefined();
	});

	it("should reject wrong value types for filter constraints", () => {

		const status = "status";

		const invalid: Specs = specs({
			// @ts-expect-error - function not allowed for filter constraint
			[`?${status}`]: () => true
		});

		expect(invalid).toBeDefined();
	});

	it("should reject wrong value types for conjunctive filter constraints", () => {

		const roles = "roles";

		const invalid: Specs = specs({
			// @ts-expect-error - RegExp not allowed for conjunctive filter constraint
			[`!${roles}`]: /pattern/
		});

		expect(invalid).toBeDefined();
	});

	it("should reject wrong value types for focus constraints", () => {

		const fields = "fields";

		const invalid: Specs = specs({
			// @ts-expect-error - Date object not allowed for focus constraint
			[`$${fields}`]: new Date()
		});

		expect(invalid).toBeDefined();
	});

});
