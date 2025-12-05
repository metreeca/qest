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
import { Patch } from "./patch.js";

describe("Patch()", async () => {

	describe("valid patches", async () => {

		it("accepts empty patch", async () => {

			const testPatch = {};
			const result = Patch(testPatch);

			expect(result).toEqual({});

		});

		it("accepts patch with null property (deletion)", async () => {

			const testPatch = { name: null };
			const result = Patch(testPatch);

			expect(result).toEqual({ name: null });

		});

		it("accepts patch with boolean property", async () => {

			const testPatch = { active: true };
			const result = Patch(testPatch);

			expect(result).toEqual({ active: true });

		});

		it("accepts patch with number property", async () => {

			const testPatch = { count: 42 };
			const result = Patch(testPatch);

			expect(result).toEqual({ count: 42 });

		});

		it("accepts patch with string property", async () => {

			const testPatch = { name: "test" };
			const result = Patch(testPatch);

			expect(result).toEqual({ name: "test" });

		});

		it("accepts patch with multiple literal properties", async () => {

			const testPatch = {
				active: true,
				count: 42,
				name: "test"
			};
			const result = Patch(testPatch);

			expect(result).toEqual({
				active: true,
				count: 42,
				name: "test"
			});

		});

		it("accepts patch with mixed null and value properties", async () => {

			const testPatch = {
				name: "updated",
				obsolete: null,
				count: 5
			};
			const result = Patch(testPatch);

			expect(result).toEqual({
				name: "updated",
				obsolete: null,
				count: 5
			});

		});

		it("accepts patch with nested resource", async () => {

			const testPatch = {
				user: {
					name: "Alice",
					age: 30
				}
			};
			const result = Patch(testPatch);

			expect(result).toEqual({
				user: {
					name: "Alice",
					age: 30
				}
			});

		});

		it("accepts patch with array of literals", async () => {

			const testPatch = { tags: ["javascript", "typescript", "node"] };
			const result = Patch(testPatch);

			expect(result).toEqual({ tags: ["javascript", "typescript", "node"] });

		});

		it("accepts patch with array of resources", async () => {

			const testPatch = {
				users: [
					{ name: "Alice" },
					{ name: "Bob" }
				]
			};
			const result = Patch(testPatch);

			expect(result).toEqual({
				users: [
					{ name: "Alice" },
					{ name: "Bob" }
				]
			});

		});

		it("accepts patch with mixed value types", async () => {

			const testPatch = {
				id: "123",
				count: 5,
				active: true,
				tags: ["a", "b"],
				metadata: { created: "2025-01-01" }
			};
			const result = Patch(testPatch);

			expect(result).toEqual({
				id: "123",
				count: 5,
				active: true,
				tags: ["a", "b"],
				metadata: { created: "2025-01-01" }
			});

		});

		it("accepts deeply nested resources", async () => {

			const testPatch = {
				level1: {
					level2: {
						level3: {
							value: "deep"
						}
					}
				}
			};
			const result = Patch(testPatch);

			expect(result).toEqual({
				level1: {
					level2: {
						level3: {
							value: "deep"
						}
					}
				}
			});

		});

		it("accepts patch with empty array", async () => {

			const testPatch = { items: [] };
			const result = Patch(testPatch);

			expect(result).toEqual({ items: [] });

		});

		it("accepts patch with single-element array", async () => {

			const testPatch = { items: ["single"] };
			const result = Patch(testPatch);

			expect(result).toEqual({ items: ["single"] });

		});

		it("accepts patch with multiple null properties", async () => {

			const testPatch = {
				field1: null,
				field2: null,
				field3: null
			};
			const result = Patch(testPatch);

			expect(result).toEqual({
				field1: null,
				field2: null,
				field3: null
			});

		});

	});

	describe("immutability", async () => {

		it("prevents top-level property modification", async () => {

			const testPatch = { name: "test" };
			const result = Patch(testPatch);

			expect(() => {
				(result as any).name = "modified";
			}).toThrow();

		});

		it("prevents top-level property addition", async () => {

			const testPatch = { name: "test" };
			const result = Patch(testPatch);

			expect(() => {
				(result as any).newProp = "value";
			}).toThrow();

		});

		it("prevents top-level property deletion", async () => {

			const testPatch = { name: "test" };
			const result = Patch(testPatch);

			expect(() => {
				delete (result as any).name;
			}).toThrow();

		});

		it("prevents modification of null property", async () => {

			const testPatch = { deleted: null };
			const result = Patch(testPatch);

			expect(() => {
				(result as any).deleted = "value";
			}).toThrow();

		});

	});

	describe("validation", async () => {

		describe("nested objects", async () => {

			it("accepts nested resource (2 levels)", async () => {

				const testPatch = {
					user: { name: "Alice" }
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("accepts deeply nested resources (3 levels)", async () => {

				const testPatch = {
					organization: {
						department: {
							name: "Engineering"
						}
					}
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("accepts deeply nested resources (4 levels)", async () => {

				const testPatch = {
					level1: {
						level2: {
							level3: {
								value: "deep"
							}
						}
					}
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("rejects nested null values in resources", async () => {

				const testPatch = {
					user: { data: null }
				};

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

		});

		describe("arrays", async () => {

			it("accepts array of literals", async () => {

				const testPatch = { tags: ["a", "b", "c"] };

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("accepts array of resources", async () => {

				const testPatch = {
					users: [
						{ name: "Alice" },
						{ name: "Bob" }
					]
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("rejects nested arrays", async () => {

				const testPatch = {
					matrix: [["a", "b"], ["c", "d"]]
				};

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

			it("rejects array with null elements", async () => {

				const testPatch = {
					items: [1, 2, null]
				};

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

		});

		describe("arrays with nested objects", async () => {

			it("accepts objects within arrays", async () => {

				const testPatch = {
					users: [
						{ name: "Alice", age: 30 },
						{ name: "Bob", age: 25 }
					]
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("accepts deeply nested array-object structures", async () => {

				const testPatch = {
					departments: [
						{
							name: "Engineering",
							teams: [
								{ name: "Backend", size: 5 }
							]
						}
					]
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("rejects null values in nested array objects", async () => {

				const testPatch = {
					users: [
						{ name: "Alice", data: null }
					]
				};

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

		});

		describe("objects with nested arrays", async () => {

			it("accepts arrays nested in objects", async () => {

				const testPatch = {
					user: {
						name: "Alice",
						roles: ["admin", "user"]
					}
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("accepts deeply nested object-array structures", async () => {

				const testPatch = {
					config: {
						settings: {
							options: ["opt1", "opt2"]
						}
					}
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("rejects nested arrays in nested objects", async () => {

				const testPatch = {
					config: {
						matrix: [["a", "b"]]
					}
				};

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

		});

		describe("property names", async () => {

			it("accepts valid identifier property names", async () => {

				const testPatch = {
					name: "value",
					_private: "value",
					$special: "value",
					prop123: "value"
				};

				expect(() => Patch(testPatch)).not.toThrow();

			});

			it("rejects empty string property name", async () => {

				const testPatch = { "": "value" };

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

			it("rejects property names with special characters", async () => {

				const testPatch = { "prop-name": "value" };

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

			it("rejects property names with spaces", async () => {

				const testPatch = { "prop name": "value" };

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

			it("rejects property names starting with digits", async () => {

				const testPatch = { "123prop": "value" };

				expect(() => Patch(testPatch as any)).toThrow(TypeError);

			});

		});

	});

	describe("error handling", async () => {

		it("throws TypeError for null input", async () => {

			expect(() => {
				Patch(null as any);
			}).toThrow(TypeError);

		});

		it("throws TypeError for undefined input", async () => {

			expect(() => {
				Patch(undefined as any);
			}).toThrow(TypeError);

		});

		it("throws TypeError for non-object input", async () => {

			expect(() => {
				Patch("not an object" as any);
			}).toThrow(TypeError);

		});

		it("throws TypeError for array input", async () => {

			expect(() => {
				Patch([1, 2, 3] as any);
			}).toThrow(TypeError);

		});

	});

	describe("type inference", async () => {

		it("preserves input type structure", async () => {

			const testPatch = { name: "test", count: 42 } as const;
			const result = Patch(testPatch);

			// type test: result should have the same structure as input
			const name: "test" = result.name;
			const count: 42 = result.count;

			expect(name).toBe("test");
			expect(count).toBe(42);

		});

		it("preserves null type for deletion properties", async () => {

			const testPatch = { deleted: null, kept: "value" } as const;
			const result = Patch(testPatch);

			// type test: result should preserve null type
			const deleted: null = result.deleted;
			const kept: "value" = result.kept;

			expect(deleted).toBeNull();
			expect(kept).toBe("value");

		});

		it("infers correct type for nested resources", async () => {

			const testPatch = {
				user: {
					name: "Alice",
					age: 30
				}
			} as const;
			const result = Patch(testPatch);

			// type test: result should have nested structure
			const userName: "Alice" = result.user.name;
			const userAge: 30 = result.user.age;

			expect(userName).toBe("Alice");
			expect(userAge).toBe(30);

		});

		it("rejects invalid property values at compile time", async () => {

			// this should fail type checking - functions are not valid Values
			// @ts-expect-error
			const invalidPatch: Patch = { method: () => {} };

		});

	});

	describe("language dictionaries", async () => {

		it("accepts dictionary with hyphenated language tags", async () => {

			const testPatch = {
				label: {
					"en": "Hello",
					"en-US": "Hello",
					"en-GB": "Hello",
					"fr-CA": "Bonjour"
				}
			};

			expect(() => Patch(testPatch)).not.toThrow();

		});

	});

});
