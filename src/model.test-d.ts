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

import type { Identifier } from "@metreeca/core";
import { describe, expectTypeOf, test } from "vitest";
import type { Dictionary, Reference } from "./state.js";
import type {
	Criteria,
	Locale,
	Operator,
	Option,
	Options,
	Placeholder,
	Probe,
	Projection,
	Query,
	Template,
	Atomic,
	Transform,
	Union
} from "./model.js";


describe("Template", () => {

	// A template is an object of objects: every leaf is `{}`, and no part of it carries a value.

	test("a leaf-only template is a Template", () => {
		type Product = {
			readonly id: Atomic;
			readonly name: Atomic;
		};

		expectTypeOf<Product>().toExtend<Template>();
	});

	test("a nested template is a Template", () => {
		type Product = {
			readonly vendor: { readonly name: Atomic };
		};

		expectTypeOf<Product>().toExtend<Template>();
	});

	test("a locale entry is a Template", () => {
		type Product = {
			readonly title: Locale;
		};

		expectTypeOf<Product>().toExtend<Template>();
	});

	test("a union entry is a Template", () => {
		type Product = {
			readonly creator: Union<Placeholder>;
		};

		expectTypeOf<Product>().toExtend<Template>();
	});

	test("a projection entry is a Template", () => {
		type Facets = {
			readonly items: Projection;
		};

		expectTypeOf<Facets>().toExtend<Template>();
	});

	test("an entry carrying collection constraints is a Template", () => {
		type Catalog = {
			readonly items: {
				readonly name: Atomic;
				readonly "^name": "asc";
				readonly "#": number;
			};
		};

		expectTypeOf<Catalog>().toExtend<Template>();
	});

	test("a constraint-only entry is a Template", () => {
		type Catalog = {
			readonly items: { readonly "#": number };
		};

		expectTypeOf<Catalog>().toExtend<Template>();
	});

	test("an undefined entry is not a Template", () => {
		type Product = {
			readonly name: Atomic | undefined;
		};

		expectTypeOf<Product>().not.toExtend<Template>();
	});

	test("a literal entry is not a Template", () => {
		expectTypeOf<{ readonly name: string }>().not.toExtend<Template>();
		expectTypeOf<{ readonly price: number }>().not.toExtend<Template>();
		expectTypeOf<{ readonly available: boolean }>().not.toExtend<Template>();
	});

	test("a non-object is not a Template", () => {
		expectTypeOf<string>().not.toExtend<Template>();
		expectTypeOf<number>().not.toExtend<Template>();
		expectTypeOf<null>().not.toExtend<Template>();
	});

});

describe("Projection", () => {

	// A projection is keyed by bindings and allots one single-value cell per binding.

	test("a binding-keyed cell map is a Projection", () => {
		type Facets = {
			readonly "category=category": Atomic;
			readonly "count=count:": Atomic;
		};

		expectTypeOf<Facets>().toExtend<Projection>();
	});

	test("a cell holds a placeholder or a union of placeholders", () => {
		expectTypeOf<Projection["count=count:"]>().toExtend<Placeholder | Union<Placeholder>>();
	});

	test("an undefined cell is not admitted", () => {
		type Facets = {
			readonly "count=count:": Atomic | undefined;
		};

		expectTypeOf<Facets>().not.toExtend<Projection>();
	});

});

describe("Placeholder", () => {

	test("every retrieval form is a Placeholder", () => {
		expectTypeOf<Template>().toExtend<Placeholder>();
		expectTypeOf<Atomic>().toExtend<Placeholder>();
		expectTypeOf<Locale>().toExtend<Placeholder>();
	});

	test("a literal or a reference is not a Placeholder", () => {
		expectTypeOf<string>().not.toExtend<Placeholder>();
		expectTypeOf<number>().not.toExtend<Placeholder>();
		expectTypeOf<Reference>().not.toExtend<Placeholder>();
	});

});

describe("Locale", () => {

	test("a tag-range map of value leaves is a Locale", () => {
		type Title = {
			readonly "*": Atomic;
		};

		expectTypeOf<Title>().toExtend<Locale>();
	});

	test("the value slot carries no request of its own", () => {
		expectTypeOf<Locale[Identifier]>().toEqualTypeOf<Atomic>();
	});

});

describe("Union", () => {

	test("a branch map of placeholders is a Union", () => {
		type Creator = {
			readonly "0": { readonly name: Atomic };
			readonly "1": { readonly legalName: Atomic };
		};

		expectTypeOf<Creator>().toExtend<Union<Placeholder>>();
	});

	test("a branch key is a non-negative integer string", () => {
		expectTypeOf<{ readonly "0": Atomic }>().toExtend<Union<Placeholder>>();
		expectTypeOf<{ readonly "10": Atomic }>().toExtend<Union<Placeholder>>();
	});

	test("a branch holds a placeholder", () => {
		expectTypeOf<Union<Placeholder>["0"]>().toExtend<Placeholder>();
	});

});

describe("Query", () => {

	// Constraints merge into the node they apply to, leaving every key optional.

	test("a node carrying retrieval keys alone is a Query", () => {
		expectTypeOf<{ readonly name: Atomic }>().toExtend<Query<Template>>();
	});

	test("a node carrying constraint keys alongside retrieval keys is a Query", () => {
		type Items = {
			readonly name: Atomic;
			readonly "~name": string;
			readonly "#": number;
		};

		expectTypeOf<Items>().toExtend<Query<Template>>();
	});

	test("a node carrying constraint keys alone is a Query", () => {
		expectTypeOf<{ readonly "#": number }>().toExtend<Query<Atomic>>();
		expectTypeOf<Record<string, never>>().toExtend<Query<Atomic>>();
	});

	test("constraint keys carry their operator's value type", () => {
		expectTypeOf<Query<Atomic>["@"]>().toExtend<number | undefined>();
		expectTypeOf<Query<Atomic>["~name"]>().toExtend<string | undefined>();
	});

});

describe("Criteria", () => {

	// Each constraint key maps to its operator's value type; pagination keys are numeric.

	test("ordering keys carry an asc/desc shorthand or a signed precedence number", () => {
		expectTypeOf<Criteria["^price"]>().toEqualTypeOf<"asc" | "desc" | number>();
	});

	test("pagination keys carry a number", () => {
		expectTypeOf<Criteria["@"]>().toEqualTypeOf<number | undefined>();
		expectTypeOf<Criteria["#"]>().toEqualTypeOf<number | undefined>();
	});

	test("comparison keys carry a Literal bound", () => {
		expectTypeOf<Criteria["<price"]>().toEqualTypeOf<boolean | number | string>();
	});

	test("text-search keys carry a string", () => {
		expectTypeOf<Criteria["~name"]>().toEqualTypeOf<string>();
	});

	test("matching keys carry an Options set", () => {
		expectTypeOf<Criteria["?category"]>().toEqualTypeOf<Options>();
	});

});

describe("Operator", () => {

	test("every constraint prefix is a member", () => {
		expectTypeOf<"<">().toExtend<Operator>();
		expectTypeOf<">=">().toExtend<Operator>();
		expectTypeOf<"~">().toExtend<Operator>();
		expectTypeOf<"?">().toExtend<Operator>();
		expectTypeOf<"^">().toExtend<Operator>();
		expectTypeOf<"@">().toExtend<Operator>();
		expectTypeOf<"#">().toExtend<Operator>();
	});

	test("a plain identifier is not an Operator", () => {
		expectTypeOf<"price">().not.toExtend<Operator>();
	});

});

describe("Transform", () => {

	test("an aggregate name is a member", () => {
		expectTypeOf<"count">().toExtend<Transform>();
		expectTypeOf<"avg">().toExtend<Transform>();
	});

	test("a scalar transform name is a member", () => {
		expectTypeOf<"round">().toExtend<Transform>();
		expectTypeOf<"year">().toExtend<Transform>();
	});

	test("an unknown name is not a Transform", () => {
		expectTypeOf<"median">().not.toExtend<Transform>();
	});

});

describe("Option / Options", () => {

	test("Option admits null, a Literal, or a Reference", () => {
		expectTypeOf<null>().toExtend<Option>();
		expectTypeOf<number>().toExtend<Option>();
		expectTypeOf<Reference>().toExtend<Option>();
	});

	test("Options subsumes a scalar Option, a Dictionary map, and an Option array", () => {
		expectTypeOf<Option>().toExtend<Options>();
		expectTypeOf<Dictionary>().toExtend<Options>();
		expectTypeOf<readonly Option[]>().toExtend<Options>();
	});

});

describe("Probe", () => {

	test("a parsed projection or constraint key shape is assignable to Probe", () => {
		type Binding = {
			readonly target: Identifier;
			readonly pipe: readonly [];
			readonly path: readonly Identifier[]
		};
		type Constraint = {
			readonly target: Operator;
			readonly pipe: readonly Transform[];
			readonly path: readonly Identifier[]
		};

		expectTypeOf<Binding>().toExtend<Probe>();
		expectTypeOf<Constraint>().toExtend<Probe>();
	});

	test("the target is an Identifier or an Operator", () => {
		expectTypeOf<Probe["target"]>().toEqualTypeOf<Identifier | Operator>();
	});

	test("the pipe is a Transform list and the path an Identifier list", () => {
		expectTypeOf<Probe["pipe"]>().toEqualTypeOf<readonly Transform[]>();
		expectTypeOf<Probe["path"]>().toEqualTypeOf<readonly Identifier[]>();
	});

});
