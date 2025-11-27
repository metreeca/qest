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

import { describe, it } from "vitest";

describe("Path Codecs", () => {

	describe("toPath() - decode path to properties", () => {

		it("should parse Path into Property array", () => {
			// const p = path("address.city");
			// const properties = toPath(p);
			// expect(properties).toEqual([property("address"), property("city")]);
		});

		// it("should parse empty Path into empty array", () => {
		// 	const p = path("");
		// 	const properties = toPath(p);
		// 	expect(properties).toEqual([]);
		// });
		//
		// it("should parse Path with escaped colon", () => {
		// 	const p = path("name\\:value");
		// 	const properties = toPath(p);
		// 	expect(properties).toEqual([property("name:value")]);
		// });
		//
		// it("should parse Path with escaped dot", () => {
		// 	const p = path("property\\.name");
		// 	const properties = toPath(p);
		// 	expect(properties).toEqual([property("property.name")]);
		// });
		//
		// it("should handle property starting with escaped dot", () => {
		// 	const p = path("\\.hidden");
		// 	const properties = toPath(p);
		// 	expect(properties).toEqual([property(".hidden")]);
		// });
		//
		// it("should handle leading dot as separator, not property content", () => {
		// 	const p = path(".name");
		// 	const properties = toPath(p);
		// 	expect(properties).toEqual([property("name")]);
		// });
		//
		// it("should handle multiple consecutive escaped characters", () => {
		// 	const p = path("a\\.b\\\\c\\:d");
		// 	const properties = toPath(p);
		// 	expect(properties).toEqual([property("a.b\\c:d")]);
		// });

	});

// 	describe("toPath() - encode properties to path", () => {
//
// 		it("should join Property array into Path", () => {
// 			const properties = [property("address"), property("city")];
// 			const p = toPath(properties);
// 			expect(p).toBe("address.city");
// 		});
//
// 		it("should join empty array into empty Path", () => {
// 			const properties: readonly Property[] = [];
// 			const p = toPath(properties);
// 			expect(p).toBe("");
// 		});
//
// 		it("should escape dots when joining properties", () => {
// 			const properties = [property("property.with.dots")];
// 			const p = toPath(properties);
// 			expect(p).toBe("property\\.with\\.dots");
// 		});
//
// 		it("should escape backslashes when joining properties", () => {
// 			const properties = [property("property\\with\\backslashes")];
// 			const p = toPath(properties);
// 			expect(p).toBe("property\\\\with\\\\backslashes");
// 		});
//
// 		it("should not escape spaces when joining properties", () => {
// 			const properties = [property("property with spaces")];
// 			const p = toPath(properties);
// 			expect(p).toBe("property with spaces");
// 		});
//
// 		it("should escape colons when joining properties (for expression interoperability)", () => {
// 			const properties = [property("name:with:colons")];
// 			const p = toPath(properties);
// 			expect(p).toBe("name\\:with\\:colons");
// 		});
//
// 		it("should escape dots when property contains them", () => {
// 			const props = [property("file.txt")];
// 			const p = toPath(props);
// 			expect(p).toBe("file\\.txt");
// 			const roundtrip = toPath(p);
// 			expect(roundtrip).toEqual(props);
// 		});
//
// 		it("should preserve spaces in property names", () => {
// 			const props = [property("first name"), property("last name")];
// 			const p = toPath(props);
// 			expect(p).toBe("first name.last name");
// 		});
//
// 		it("should handle property with only backslashes", () => {
// 			const props = [property("\\\\\\")];
// 			const p = toPath(props);
// 			expect(p).toBe("\\\\\\\\\\\\"); // Each backslash doubled
// 		});
//
// 	});
//
// 	describe("toPath() - roundtrip", () => {
//
// 		it("should roundtrip: parse then join", () => {
// 			const original = path("address.city");
// 			const properties = toPath(original);
// 			const rejoined = toPath(properties);
// 			expect(rejoined).toBe("address.city");
// 		});
//
// 		it("should roundtrip with escaped characters", () => {
// 			const original = path("name\\:value.with\\.dot");
// 			const properties = toPath(original);
// 			const rejoined = toPath(properties);
// 			expect(rejoined).toBe("name\\:value.with\\.dot");
// 		});
//
// 	});
//
// });


// describe("Expression Codecs", () => {
//
// 	describe("toExpression() - decode expression to parts", () => {
//
// 		it("should parse expression into transforms and properties", () => {
// 			const expr = expression("count:address.city");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([Transform.count]);
// 			expect(properties).toEqual([property("address"), property("city")]);
// 		});
//
// 		it("should parse expression with multiple transforms", () => {
// 			const expr = expression("min:max:price");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([Transform.min, Transform.max]);
// 			expect(properties).toEqual([property("price")]);
// 		});
//
// 		it("should parse expression with empty path", () => {
// 			const expr = expression("count:");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([Transform.count]);
// 			expect(properties).toEqual([]);
// 		});
//
// 		it("should parse empty expression", () => {
// 			const expr = expression("");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([]);
// 			expect(properties).toEqual([]);
// 		});
//
// 		it("should parse expression with no transforms", () => {
// 			const expr = expression("address.city");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([]);
// 			expect(properties).toEqual([property("address"), property("city")]);
// 		});
//
// 		it("should handle expression with leading dot in path", () => {
// 			const expr = expression("count:.name");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([Transform.count]);
// 			expect(properties).toEqual([property("name")]); // Leading dot stripped
// 		});
//
// 		it("should handle expression with escaped colon in path", () => {
// 			const expr = expression("count:name\\:value");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([Transform.count]);
// 			expect(properties).toEqual([property("name:value")]);
// 		});
//
// 		it("should handle all transforms chained", () => {
// 			const allTransforms = [Transform.count, Transform.min, Transform.max, Transform.sum, Transform.avg];
// 			const expr = toExpression([allTransforms, [property("value")]]);
// 			expect(expr).toBe("count:min:max:sum:avg:value");
// 			const [parsed] = toExpression(expr);
// 			expect(parsed).toEqual(allTransforms);
// 		});
//
// 		it("should handle transforms with no path", () => {
// 			const expr = expression("count:min:");
// 			const [transforms, properties] = toExpression(expr);
// 			expect(transforms).toEqual([Transform.count, Transform.min]);
// 			expect(properties).toEqual([]);
// 		});
//
// 	});
//
// 	describe("toExpression() - encode parts to expression", () => {
//
// 		it("should construct expression from tuple", () => {
// 			const expr = toExpression([[Transform.count], [property("address"), property("city")]]);
// 			expect(expr).toBe("count:address.city");
// 		});
//
// 		it("should construct expression from tuple with multiple transforms", () => {
// 			const expr = toExpression([[Transform.min, Transform.max], [property("price")]]);
// 			expect(expr).toBe("min:max:price");
// 		});
//
// 		it("should construct expression from tuple with empty path", () => {
// 			const expr = toExpression([[Transform.count], []]);
// 			expect(expr).toBe("count:");
// 		});
//
// 		it("should construct empty expression from empty parts", () => {
// 			const expr = toExpression([[], []]);
// 			expect(expr).toBe("");
// 		});
//
// 	});
//
// 	describe("toExpression() - roundtrip", () => {
//
// 		it("should roundtrip: parse then construct", () => {
// 			const original = expression("count:address.city");
// 			const parts = toExpression(original);
// 			const reconstructed = toExpression(parts);
// 			expect(reconstructed).toBe("count:address.city");
// 		});
//
// 		it("should roundtrip expression with escaped characters in path", () => {
// 			const original = expression("count:prop\\.name.nested\\:key");
// 			const parts = toExpression(original);
// 			const reconstructed = toExpression(parts);
// 			expect(reconstructed).toBe("count:prop\\.name.nested\\:key");
// 		});
//
// 	});

});
