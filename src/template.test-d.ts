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
import type { Tag, TagRange } from "@metreeca/core/language";
import { describe, expectTypeOf, test } from "vitest";
import type { Reference } from "./index.js";
import type { Text } from "./resource.js";
import type {
	Instance,
	Locale,
	Name,
	Operator,
	Option,
	Options,
	Placeholder,
	Probe,
	Selection,
	Slots,
	Template,
	Transform,
	Union
} from "./template.js";


describe("Instance", () => {

	describe("primitive placeholders", () => {

		test("boolean is preserved", () => {
			expectTypeOf<Instance<{ readonly flag: boolean }>>()
				.toEqualTypeOf<{ readonly flag: boolean }>();
		});

		test("number is preserved", () => {
			expectTypeOf<Instance<{ readonly count: number }>>()
				.toEqualTypeOf<{ readonly count: number }>();
		});

		test("string is preserved", () => {
			expectTypeOf<Instance<{ readonly name: string }>>()
				.toEqualTypeOf<{ readonly name: string }>();
		});

		test("Reference is preserved", () => {
			expectTypeOf<Instance<{ readonly link: Reference }>>()
				.toEqualTypeOf<{ readonly link: Reference }>();
		});

		test("undefined falls through to primitive branch", () => {
			expectTypeOf<Instance<undefined>>().toEqualTypeOf<undefined>();
		});

	});

	describe("locale placeholders", () => {

		test("Locale widens to Text", () => {
			expectTypeOf<Instance<{ readonly label: Locale }>>()
				.toEqualTypeOf<{ readonly label: Text }>();
		});

		test("tag-indexed object Locale variant is preserved structurally", () => {
			type In = { readonly [range: TagRange]: string };
			type Out = { readonly [tag: Tag]: string };

			expectTypeOf<Instance<{ readonly label: In }>>()
				.toEqualTypeOf<{ readonly label: Out }>();
		});

		test("tag-indexed singleton-array Locale variant widens the inner tuple", () => {
			type In = { readonly [range: TagRange]: readonly [string] };
			type Out = { readonly [tag: Tag]: readonly string[] };

			expectTypeOf<Instance<{ readonly label: In }>>()
				.toEqualTypeOf<{ readonly label: Out }>();
		});

	});

	describe("field nullability", () => {

		// The four canonical projections of a placeholder field through Instance:
		//
		//   T               ->  T
		//   undefined | T   ->  undefined | T
		//   [T]             ->  readonly T[]
		//   undefined | [T] ->  undefined | readonly T[]

		test("T -> T", () => {
			expectTypeOf<Instance<{ readonly v: number }>>()
				.toEqualTypeOf<{ readonly v: number }>();
		});

		test("undefined | T -> undefined | T", () => {
			expectTypeOf<Instance<{ readonly v: undefined | number }>>()
				.toEqualTypeOf<{ readonly v: undefined | number }>();
		});

		test("readonly [T] -> readonly T[]", () => {
			expectTypeOf<Instance<{ readonly v: readonly [number] }>>()
				.toEqualTypeOf<{ readonly v: readonly number[] }>();
		});

		test("undefined | readonly [T] -> undefined | readonly T[]", () => {
			expectTypeOf<Instance<{ readonly v: undefined | readonly [number] }>>()
				.toEqualTypeOf<{ readonly v: undefined | readonly number[] }>();
		});

		// Optional `?` modifier — TypeScript's other way to express an undefined-able field

		test("T? -> T?", () => {
			expectTypeOf<Instance<{ readonly v?: number }>>()
				.toEqualTypeOf<{ readonly v?: number }>();
		});

		test("readonly [T]? -> readonly T[]?", () => {
			expectTypeOf<Instance<{ readonly v?: readonly [number] }>>()
				.toEqualTypeOf<{ readonly v?: readonly number[] }>();
		});

		// Reference and Locale fields preserve undefined alongside the value rewrite

		test("undefined | Reference is preserved", () => {
			expectTypeOf<Instance<{ readonly link: undefined | Reference }>>()
				.toEqualTypeOf<{ readonly link: undefined | Reference }>();
		});

		test("undefined | Locale widens to undefined | Text", () => {
			expectTypeOf<Instance<{ readonly label: undefined | Locale }>>()
				.toEqualTypeOf<{ readonly label: undefined | Text }>();
		});

		test("undefined | nested Template is preserved", () => {
			type Inner = { readonly id: Reference; readonly name: string };
			type Expected = {
				readonly child: undefined | { readonly id: Reference; readonly name: string }
			};

			expectTypeOf<Instance<{ readonly child: undefined | Inner }>>().toEqualTypeOf<Expected>();
		});

		test("undefined | readonly [Template, Selection] preserves undefined and widens entries", () => {
			type Item = { readonly id: Reference; readonly name: string };
			type Expected = {
				readonly items: undefined | readonly { readonly id: Reference; readonly name: string }[]
			};

			expectTypeOf<Instance<{ readonly items: undefined | readonly [Item, Selection] }>>()
				.toEqualTypeOf<Expected>();
		});

		test("undefined | readonly [Projection, Selection] preserves undefined and widens entries", () => {
			type Row = { readonly name: string; readonly count: number };
			type Expected = {
				readonly rows: undefined | readonly { readonly name: string; readonly count: number }[]
			};

			expectTypeOf<Instance<{ readonly rows: undefined | readonly [Row, Selection] }>>()
				.toEqualTypeOf<Expected>();
		});

	});

	describe("recursion", () => {

		test("nested Template is recursively transformed", () => {
			type Inner = { readonly width: number };
			type Outer = { readonly id: Reference; readonly dimensions: Inner };
			type Expected = { readonly id: Reference; readonly dimensions: { readonly width: number } };

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

		test("nested singleton array of Template is recursively transformed", () => {
			type Inner = { readonly id: Reference; readonly name: string };
			type Outer = { readonly items: readonly [Inner] };
			type Expected = { readonly items: readonly { readonly id: Reference; readonly name: string }[] };

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

		test("nested Projection-shaped object recursively extracts binding identifiers", () => {
			type Row = { readonly "vendorName=vendor.name": string };
			type Outer = { readonly summary: Row };
			type Expected = { readonly summary: { readonly vendorName: string } };

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

	});

	describe("selection erasure", () => {

		test("readonly [Template, Selection] widens the Template slot and discards Selection", () => {
			type Item = { readonly id: Reference; readonly name: string };
			type Outer = { readonly items: readonly [Item, Selection] };
			type Expected = { readonly items: readonly { readonly id: Reference; readonly name: string }[] };

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

		test("readonly [Projection, Selection] widens the Projection slot and discards Selection", () => {
			type Row = { readonly name: string; readonly count: number };
			type Outer = { readonly rows: readonly [Row, Selection] };
			type Expected = { readonly rows: readonly { readonly name: string; readonly count: number }[] };

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

		test("Template & Selection alias intersection erases Selection at the top level", () => {
			type Row = { readonly id: Reference; readonly name: string };

			expectTypeOf<Instance<Row & Selection>>()
				.toEqualTypeOf<{ readonly id: Reference; readonly name: string }>();
		});

	});

	describe("union", () => {

		describe("indexed form", () => {

			test("single branch projects to the branch type", () => {
				type Indexed = { readonly "0": { readonly name: string } };
				type Expected = { readonly creator: { readonly name: string } };

				expectTypeOf<Instance<{ readonly creator: Indexed }>>().toEqualTypeOf<Expected>();
			});

			test("two branches project to a union of branch types", () => {
				type Indexed = {
					readonly "0": { readonly id: Reference; readonly name: string };
					readonly "1": { readonly id: Reference; readonly legalName: string };
				};
				type Expected = {
					readonly creator:
						| { readonly id: Reference; readonly name: string }
						| { readonly id: Reference; readonly legalName: string };
				};

				expectTypeOf<Instance<{ readonly creator: Indexed }>>().toEqualTypeOf<Expected>();
			});

			test("three branches project to a union of all three", () => {
				type Indexed = {
					readonly "0": { readonly a: string };
					readonly "1": { readonly b: string };
					readonly "2": { readonly c: string };
				};
				type Expected = {
					readonly creator:
						| { readonly a: string }
						| { readonly b: string }
						| { readonly c: string };
				};

				expectTypeOf<Instance<{ readonly creator: Indexed }>>().toEqualTypeOf<Expected>();
			});

			test("branches are recursively transformed", () => {
				type Indexed = {
					readonly "0": { readonly "vendorName=vendor.name": string };
					readonly "1": { readonly id: Reference };
				};
				type Expected = {
					readonly source:
						| { readonly vendorName: string }
						| { readonly id: Reference };
				};

				expectTypeOf<Instance<{ readonly source: Indexed }>>().toEqualTypeOf<Expected>();
			});

			test("primitive branches pass through", () => {
				type Indexed = { readonly "0": string; readonly "1": number };
				type Expected = { readonly label: string | number };

				expectTypeOf<Instance<{ readonly label: Indexed }>>().toEqualTypeOf<Expected>();
			});

			test("intersection with Selection preserves the union and discards Selection", () => {
				type Indexed = {
					readonly "0": { readonly id: Reference; readonly name: string };
					readonly "1": { readonly id: Reference; readonly legalName: string };
				};
				type Expected = {
					readonly creators: readonly (
						| { readonly id: Reference; readonly name: string }
						| { readonly id: Reference; readonly legalName: string }
						)[];
				};

				expectTypeOf<Instance<{ readonly creators: readonly [Indexed, Selection] }>>()
					.toEqualTypeOf<Expected>();
			});

		});

		describe("numeric-literal key form", () => {

			// TypeScript declaration emit serialises a `${number}`-keyed union frame with bare numeric
			// keys (`{ 0; 1 }`) rather than string-literal keys (`{ "0"; "1" }`), so the collapse must
			// recognise both forms to survive a cross-package `.d.ts` round-trip.

			test("two branches project to a union of branch types", () => {
				type Indexed = {
					readonly 0: { readonly id: Reference; readonly name: string };
					readonly 1: { readonly id: Reference; readonly legalName: string };
				};
				type Expected = {
					readonly creator:
						| { readonly id: Reference; readonly name: string }
						| { readonly id: Reference; readonly legalName: string };
				};

				expectTypeOf<Instance<{ readonly creator: Indexed }>>().toEqualTypeOf<Expected>();
			});

			test("primitive branches pass through", () => {
				type Indexed = { readonly 0: string; readonly 1: number };
				type Expected = { readonly label: string | number };

				expectTypeOf<Instance<{ readonly label: Indexed }>>().toEqualTypeOf<Expected>();
			});

		});

		describe("template distinction", () => {

			test("plain template with identifier keys is not treated as indexed form", () => {
				type Row = { readonly name: string; readonly count: number };
				type Expected = { readonly row: { readonly name: string; readonly count: number } };

				expectTypeOf<Instance<{ readonly row: Row }>>().toEqualTypeOf<Expected>();
			});

		});

		describe("nested union through templates", () => {

			test("indexed union branch contains a template with another indexed union field", () => {
				type Inner = {
					readonly "0": { readonly v: string };
					readonly "1": { readonly v: number };
				};
				type Outer = {
					readonly "0": { readonly nested: Inner };
					readonly "1": { readonly simple: boolean };
				};
				type Expected = {
					readonly outer:
						| { readonly nested: { readonly v: string } | { readonly v: number } }
						| { readonly simple: boolean };
				};

				expectTypeOf<Instance<{ readonly outer: Outer }>>().toEqualTypeOf<Expected>();
			});

			test("triple-depth indexed union through nested templates", () => {
				type L3 = {
					readonly "0": { readonly v: string };
					readonly "1": { readonly v: number };
				};
				type L2 = { readonly "0": { readonly inner: L3 } };
				type L1 = { readonly "0": { readonly middle: L2 } };
				type Expected = {
					readonly outer: {
						readonly middle: {
							readonly inner: { readonly v: string } | { readonly v: number };
						};
					};
				};

				expectTypeOf<Instance<{ readonly outer: L1 }>>().toEqualTypeOf<Expected>();
			});

		});

		describe("union with singleton tuples", () => {

			test("indexed union branch contains a primitive multi-valued field", () => {
				type Outer = {
					readonly "0": { readonly tags: readonly [string] };
					readonly "1": { readonly scores: readonly [number] };
				};
				type Expected = {
					readonly source:
						| { readonly tags: readonly string[] }
						| { readonly scores: readonly number[] };
				};

				expectTypeOf<Instance<{ readonly source: Outer }>>().toEqualTypeOf<Expected>();
			});

			test("indexed union branch contains a template multi-valued field with Selection", () => {
				type Item = { readonly id: Reference; readonly name: string };
				type Outer = {
					readonly "0": { readonly items: readonly [Item, Selection] };
					readonly "1": { readonly count: number };
				};
				type Expected = {
					readonly source:
						| { readonly items: readonly { readonly id: Reference; readonly name: string }[] }
						| { readonly count: number };
				};

				expectTypeOf<Instance<{ readonly source: Outer }>>().toEqualTypeOf<Expected>();
			});

		});

		describe("union with undefined", () => {

			test("undefined | indexed union preserves undefined and projects the union", () => {
				type Outer = {
					readonly "0": { readonly name: string };
					readonly "1": { readonly count: number };
				};
				type Expected = {
					readonly creator: undefined | { readonly name: string } | { readonly count: number };
				};

				expectTypeOf<Instance<{ readonly creator: undefined | Outer }>>().toEqualTypeOf<Expected>();
			});

			test("indexed union branch with undefined-able field preserves undefined in the branch", () => {
				type Outer = {
					readonly "0": { readonly name: undefined | string };
					readonly "1": { readonly id: Reference };
				};
				type Expected = {
					readonly source:
						| { readonly name: undefined | string }
						| { readonly id: Reference };
				};

				expectTypeOf<Instance<{ readonly source: Outer }>>().toEqualTypeOf<Expected>();
			});

			test("undefined | readonly [indexed union, Selection] preserves undefined and widens", () => {
				type Outer = {
					readonly "0": { readonly name: string };
					readonly "1": { readonly legalName: string };
				};
				type Expected = {
					readonly creators: undefined | readonly (
						| { readonly name: string }
						| { readonly legalName: string }
						)[];
				};

				expectTypeOf<Instance<{ readonly creators: undefined | readonly [Outer, Selection] }>>()
					.toEqualTypeOf<Expected>();
			});

		});

		describe("union with projections", () => {

			test("projection-style object with a union-valued computed binding", () => {
				type Indexed = {
					readonly "0": { readonly name: string };
					readonly "1": { readonly legalName: string };
				};
				type Row = {
					readonly id: Reference;
					readonly "creator=creator": Indexed;
				};
				type Outer = { readonly rows: readonly [Row, Selection] };
				type Expected = {
					readonly rows: readonly {
						readonly id: Reference;
						readonly creator:
							| { readonly name: string }
							| { readonly legalName: string };
					}[];
				};

				expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
			});

		});

		describe("union branches inside tuple boundaries", () => {

			test("singleton tuple of indexed union & Selection with template branches containing nested templates", () => {
				type Inner = { readonly id: Reference; readonly name: string };
				type Indexed = {
					readonly "0": { readonly inline: Inner };
					readonly "1": { readonly ref: Reference };
				};
				type Expected = {
					readonly items: readonly (
						| { readonly inline: { readonly id: Reference; readonly name: string } }
						| { readonly ref: Reference }
						)[];
				};

				expectTypeOf<Instance<{ readonly items: readonly [Indexed, Selection] }>>()
					.toEqualTypeOf<Expected>();
			});

			test("singleton tuple of indexed union & Selection with branches containing computed bindings", () => {
				type Indexed = {
					readonly "0": { readonly "vendorName=vendor.name": string };
					readonly "1": { readonly "count=count:": number };
				};
				type Expected = {
					readonly rows: readonly (
						| { readonly vendorName: string }
						| { readonly count: number }
						)[];
				};

				expectTypeOf<Instance<{ readonly rows: readonly [Indexed, Selection] }>>()
					.toEqualTypeOf<Expected>();
			});

		});

	});

	describe("computed bindings", () => {

		test("computed binding key extracts the identifier portion", () => {
			type Row = { readonly "vendorName=vendor.name": string };
			type Outer = { readonly rows: readonly [Row, Selection] };
			type Expected = { readonly rows: readonly { readonly vendorName: string }[] };

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

		test("transform binding key extracts the identifier portion", () => {
			type Row = { readonly "releaseYear=year:releaseDate": number };
			type Outer = { readonly rows: readonly [Row, Selection] };
			type Expected = { readonly rows: readonly { readonly releaseYear: number }[] };

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

		test("plain and computed bindings coexist", () => {
			type Row = {
				readonly id: Reference;
				readonly "vendorName=vendor.name": string;
				readonly "count=count:": number;
			};
			type Outer = { readonly rows: readonly [Row, Selection] };
			type Expected = {
				readonly rows: readonly {
					readonly id: Reference;
					readonly vendorName: string;
					readonly count: number;
				}[];
			};

			expectTypeOf<Instance<Outer>>().toEqualTypeOf<Expected>();
		});

		test("an optional binding preserves undefined", () => {
			expectTypeOf<Instance<{ readonly "total=count:": undefined | number }>>()
				.toEqualTypeOf<{ readonly total: undefined | number }>();
		});

		test("an exact-tag locale cell keeps its tags under the binding name", () => {
			expectTypeOf<Instance<{ readonly "label=title": { readonly en: string; readonly fr: string } }>>()
				.toEqualTypeOf<{ readonly label: { readonly en: string; readonly fr: string } }>();
		});

	});

	describe("exact-tag locale literal", () => {

		test("an inline exact-tag map keeps its tags rather than widening", () => {
			expectTypeOf<Instance<{ readonly title: { readonly en: string; readonly fr: string } }>>()
				.toEqualTypeOf<{ readonly title: { readonly en: string; readonly fr: string } }>();
		});

	});

	describe("mixed shapes", () => {

		test("scalar, locale, singleton-array, and nested-template properties compose", () => {
			type In = {
				readonly id: Reference;
				readonly count: number;
				readonly label: Locale;
				readonly tags: readonly [string];
				readonly child: { readonly name: string };
			};
			type Expected = {
				readonly id: Reference;
				readonly count: number;
				readonly label: Text;
				readonly tags: readonly string[];
				readonly child: { readonly name: string };
			};

			expectTypeOf<Instance<In>>().toEqualTypeOf<Expected>();
		});

	});

	describe("flat object projection", () => {

		// Flat (non-singleton-tuple-wrapped) object shapes — the case previously handled by
		// the standalone `Computed<P>` type, now subsumed by `Instance<T>`'s object branch.

		test("plain identifier keys are preserved", () => {
			type Row = { readonly name: string; readonly count: number };

			expectTypeOf<Instance<Row>>()
				.toEqualTypeOf<{ readonly name: string; readonly count: number }>();
		});

		test("computed binding keys are reduced to identifiers", () => {
			type Row = { readonly "vendorName=vendor.name": string };

			expectTypeOf<Instance<Row>>()
				.toEqualTypeOf<{ readonly vendorName: string }>();
		});

		test("computed binding extraction composes with nested Template recursion", () => {
			type Row = {
				readonly "vendorRow=vendor": { readonly id: Reference; readonly name: string };
			};
			type Expected = {
				readonly vendorRow: { readonly id: Reference; readonly name: string };
			};

			expectTypeOf<Instance<Row>>().toEqualTypeOf<Expected>();
		});

		describe("selection erasure", () => {

			test("comparison-operator keys are filtered out", () => {
				type Row = {
					readonly name: string;
					readonly "<xform:price": number;
					readonly ">xform:price": number;
					readonly "<=xform:price": number;
					readonly ">=xform:price": number;
				};

				expectTypeOf<Instance<Row>>().toEqualTypeOf<{ readonly name: string }>();
			});

			test("matching-operator keys are filtered out", () => {
				type Row = {
					readonly name: string;
					readonly "~xform:label": string;
					readonly "?xform:category": string;
					readonly "!xform:tag": string;
				};

				expectTypeOf<Instance<Row>>().toEqualTypeOf<{ readonly name: string }>();
			});

			test("ordering-operator keys are filtered out", () => {
				type Row = {
					readonly name: string;
					readonly "+xform:focus": string;
					readonly "^xform:sort": "asc" | "desc";
				};

				expectTypeOf<Instance<Row>>().toEqualTypeOf<{ readonly name: string }>();
			});

			test("pagination keys are filtered out", () => {
				type Row = {
					readonly name: string;
					readonly "@": number;
					readonly "#": number;
				};

				expectTypeOf<Instance<Row>>().toEqualTypeOf<{ readonly name: string }>();
			});

			test("Projection & Selection alias intersection erases Selection", () => {
				type Row = { readonly name: string; readonly count: number };

				expectTypeOf<Instance<Row & Selection>>()
					.toEqualTypeOf<{ readonly name: string; readonly count: number }>();
			});

			test("Selection-operator keys are filtered while computed bindings are extracted", () => {
				type Row = {
					readonly id: Reference;
					readonly "vendorName=vendor.name": string;
					readonly "<price": number;
					readonly "^price": "asc" | "desc";
				};
				type Expected = {
					readonly id: Reference;
					readonly vendorName: string;
				};

				expectTypeOf<Instance<Row>>().toEqualTypeOf<Expected>();
			});

		});

	});

});

describe("Slots", () => {

	// Slots projects each property key through Name and each value through Instance, without the
	// tuple/union/primitive dispatch that Instance wraps around it.

	test("maps plain identifier keys and recurses into values", () => {
		type Row = {
			readonly id: Reference;
			readonly child: { readonly name: string };
		};

		expectTypeOf<Slots<Row>>()
			.toEqualTypeOf<{ readonly id: Reference; readonly child: { readonly name: string } }>();
	});

	test("extracts binding identifiers and drops Selection keys", () => {
		type Row = {
			readonly "vendorName=vendor.name": string;
			readonly "<price": number;
			readonly "@": number;
		};

		expectTypeOf<Slots<Row>>().toEqualTypeOf<{ readonly vendorName: string }>();
	});

});

describe("Name", () => {

	describe("plain identifier passthrough", () => {

		test("plain identifier passes through", () => {
			expectTypeOf<Name<"name">>().toEqualTypeOf<"name">();
		});

	});

	describe("binding extraction", () => {

		test("path binding extracts the identifier portion", () => {
			expectTypeOf<Name<"vendorName=vendor.name">>().toEqualTypeOf<"vendorName">();
		});

		test("transform binding extracts the identifier portion", () => {
			expectTypeOf<Name<"releaseYear=year:releaseDate">>().toEqualTypeOf<"releaseYear">();
		});

		test("aggregate binding extracts the identifier portion", () => {
			expectTypeOf<Name<"count=count:">>().toEqualTypeOf<"count">();
		});

		test("multiple equals signs split at the first occurrence", () => {
			expectTypeOf<Name<"a=b=c">>().toEqualTypeOf<"a">();
		});

	});

	describe("selection key drop", () => {

		test("comparison-operator key drops to never", () => {
			expectTypeOf<Name<"<price">>().toEqualTypeOf<never>();
			expectTypeOf<Name<">price">>().toEqualTypeOf<never>();
			expectTypeOf<Name<"<=price">>().toEqualTypeOf<never>();
			expectTypeOf<Name<">=price">>().toEqualTypeOf<never>();
		});

		test("matching-operator key drops to never", () => {
			expectTypeOf<Name<"~label">>().toEqualTypeOf<never>();
			expectTypeOf<Name<"?category">>().toEqualTypeOf<never>();
			expectTypeOf<Name<"!tag">>().toEqualTypeOf<never>();
		});

		test("ordering-operator key drops to never", () => {
			expectTypeOf<Name<"+focus">>().toEqualTypeOf<never>();
			expectTypeOf<Name<"^sort">>().toEqualTypeOf<never>();
		});

		test("pagination keys drop to never", () => {
			expectTypeOf<Name<"@">>().toEqualTypeOf<never>();
			expectTypeOf<Name<"#">>().toEqualTypeOf<never>();
		});

	});

});

describe("Selection", () => {

	// Each constraint key maps to its operator's value type; pagination keys are numeric.

	test("ordering keys carry an asc/desc shorthand or a signed precedence number", () => {
		expectTypeOf<Selection["^price"]>().toEqualTypeOf<"asc" | "desc" | number>();
	});

	test("pagination keys carry a number", () => {
		expectTypeOf<Selection["@"]>().toEqualTypeOf<number | undefined>();
		expectTypeOf<Selection["#"]>().toEqualTypeOf<number | undefined>();
	});

	test("comparison keys carry a Literal bound", () => {
		expectTypeOf<Selection["<price"]>().toEqualTypeOf<boolean | number | string>();
	});

	test("text-search keys carry a string", () => {
		expectTypeOf<Selection["~name"]>().toEqualTypeOf<string>();
	});

	test("matching keys carry an Options set", () => {
		expectTypeOf<Selection["?category"]>().toEqualTypeOf<Options>();
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

	test("Options subsumes a scalar Option, a Text map, and an Option array", () => {
		expectTypeOf<Option>().toExtend<Options>();
		expectTypeOf<Text>().toExtend<Options>();
		expectTypeOf<readonly Option[]>().toExtend<Options>();
	});

});

describe("Probe", () => {

	test("a parsed projection or constraint key shape is assignable to Probe", () => {
		type Projection = { readonly target: Identifier; readonly pipe: readonly []; readonly path: readonly Identifier[] };
		type Constraint = { readonly target: Operator; readonly pipe: readonly Transform[]; readonly path: readonly Identifier[] };

		expectTypeOf<Projection>().toExtend<Probe>();
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

describe("Placeholders subsumption", () => {

	// Verify the design-level partition among the Query collection branches: nested resources flow
	// through `[Placeholder, Selection?]`, union forms (indexed) through `[Union, Selection?]`, and
	// projections through `[Projection, Selection?]`.

	test("Placeholder is not a subtype of Union", () => {
		// Union holds only the indexed/default object forms; a plain Placeholder
		// (Literal, Reference, or Template) is a sibling Model arm, not a Union.
		expectTypeOf<Placeholder>().not.toExtend<Union>();
	});

});
