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

import { isString } from "@metreeca/core";
import { describe, expect, it } from "vitest";
import { isIndexed } from "./index.js";

const isAny = (_: unknown): _ is unknown => true;

describe("isIndexed", () => {

	it("should accept object with matching values", async () => {
		expect(isIndexed({ key1: "value1", key2: "value2" }, isString)).toBeTruthy();
	});

	it("should reject object with non-matching values", async () => {
		expect(isIndexed({ str: "value", num: 42 }, isString)).toBeFalsy();
	});

	it("should accept empty object", async () => {
		expect(isIndexed({}, isString)).toBeTruthy();
	});

	it("should reject primitives", async () => {
		expect(isIndexed("string", isAny)).toBeFalsy();
		expect(isIndexed(42, isAny)).toBeFalsy();
		expect(isIndexed(null, isAny)).toBeFalsy();
	});

	it("should reject arrays", async () => {
		expect(isIndexed([], isAny)).toBeFalsy();
		expect(isIndexed(["a", "b"], isAny)).toBeFalsy();
	});

});
