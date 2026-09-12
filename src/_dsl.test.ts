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
import { all, any, focus, gt, gte, like, limit, lt, lte, offset, order, where } from "./_dsl.js";


describe("where", () => {

	it("should assemble criteria into a selection", async () => {
		expect(where(gte("price", 100), like("label", "widget"), limit(10))).toEqual({
			">=price": 100,
			"~label": "widget",
			"#": 10
		});
	});

	it("should create an empty selection from no criteria", async () => {
		expect(where()).toEqual({});
	});

	it("should retain the last of two criteria sharing the same key", async () => {
		expect(where(lt("price", 100), lt("price", 200))).toEqual({ "<price": 200 });
	});

	it("should retain criteria differing only by operator", async () => {
		expect(where(lt("price", 200), lte("price", 100))).toEqual({ "<price": 200, "<=price": 100 });
	});

	it("should reject malformed criteria", async () => {
		expect(() => where(lt("bad expression!", 100))).toThrow(TypeError);
		expect(() => where(offset(-1))).toThrow(TypeError);
		expect(() => where(limit(1.5))).toThrow(TypeError);
	});

	it("should create a deeply immutable selection", async () => {
		const selection = where(any("tag", [ "red", "blue" ]));

		expect(Object.isFrozen(selection)).toBe(true);
		expect(Object.isFrozen(selection["?tag"])).toBe(true);
	});

});


describe("filters", () => {

	it("should create comparison criteria", async () => {
		expect(lt("price", 100)).toEqual([ "<price", 100 ]);
		expect(gt("price", 100)).toEqual([ ">price", 100 ]);
		expect(lte("price", 100)).toEqual([ "<=price", 100 ]);
		expect(gte("price", 100)).toEqual([ ">=price", 100 ]);
	});

	it("should create a text search criterion", async () => {
		expect(like("label", "red widget")).toEqual([ "~label", "red widget" ]);
	});

	it("should create matching criteria", async () => {
		expect(any("tag", [ "red", "blue" ])).toEqual([ "?tag", [ "red", "blue" ] ]);
		expect(all("tag", [ "red", "blue" ])).toEqual([ "!tag", [ "red", "blue" ] ]);
	});

	it("should create matching criteria from scalar and localised options", async () => {
		expect(any("tag", "red")).toEqual([ "?tag", "red" ]);
		expect(any("tag", null)).toEqual([ "?tag", null ]);
		expect(any("label", { en: "widget" })).toEqual([ "?label", { en: "widget" } ]);
	});

	it("should target computed expressions", async () => {
		expect(gte("year:releaseDate", 2025)).toEqual([ ">=year:releaseDate", 2025 ]);
		expect(gt("count:", 0)).toEqual([ ">count:", 0 ]);
	});

});


describe("order", () => {

	it("should create an ascending criterion by default", async () => {
		expect(order("price")).toEqual([ "^price", "asc" ]);
	});

	it("should create a criterion with an explicit direction", async () => {
		expect(order("price", "desc")).toEqual([ "^price", "desc" ]);
	});

	it("should create a criterion with an explicit precedence", async () => {
		expect(order("price", -2)).toEqual([ "^price", -2 ]);
	});

	it("should create a focus criterion", async () => {
		expect(focus("tag", [ "red" ])).toEqual([ "+tag", [ "red" ] ]);
	});

});


describe("paging", () => {

	it("should create an offset criterion", async () => {
		expect(offset(20)).toEqual([ "@", 20 ]);
	});

	it("should create a limit criterion", async () => {
		expect(limit(10)).toEqual([ "#", 10 ]);
	});

});
