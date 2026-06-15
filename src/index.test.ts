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
import { defaultBase, isLiteral, isReference } from "./index.js";


describe("guards", () => {

	describe("isLiteral", () => {

		it.each([
			[ true, true ],
			[ false, true ],
			[ 42, true ],
			[ 3.14, true ],
			[ 0, true ],
			[ -1, true ],
			[ "", true ],
			[ "hello", true ],
			[ null, false ],
			[ undefined, false ],
			[ {}, false ],
			[ { value: 42 }, false ],
			[ [], false ],
			[ [ 1, 2, 3 ], false ]
		])("should classify %p as %p", (value, expected) => {
			expect(isLiteral(value)).toBe(expected);
		});

	});

	describe("isReference", () => {

		it.each([
			[ "https://example.com/resource", true ],
			[ "urn:isbn:0451450523", true ],
			[ "/path/to/resource", false ],
			[ "relative/path", false ],
			[ "", false ],
			[ 42, false ],
			[ null, false ],
			[ {}, false ]
		])("should classify %p as %p", (value, expected) => {
			expect(isReference(value)).toBe(expected);
		});

	});

});

describe("defaultBase", () => {

	it("should be the app: base IRI", () => {
		expect(defaultBase).toBe("app:/");
	});

});
