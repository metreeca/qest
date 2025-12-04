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
import { Resource } from "./index.js";


describe("Resource()", async () => {

	describe("valid resources", async () => {

		it("accepts empty resource", async () => {

			const testResource = {};
			const result = Resource(testResource);

			expect(result).toEqual({});

		});

		it("accepts resource with boolean property", async () => {

			const testResource = { active: true };
			const result = Resource(testResource);

			expect(result).toEqual({ active: true });

		});

		it("accepts resource with number property", async () => {

			const testResource = { count: 42 };
			const result = Resource(testResource);

			expect(result).toEqual({ count: 42 });

		});

		it("accepts resource with string property", async () => {

			const testResource = { name: "test" };
			const result = Resource(testResource);

			expect(result).toEqual({ name: "test" });

		});

		it("accepts resource with multiple literal properties", async () => {

			const testResource = {
				active: true,
				count: 42,
				name: "test"
			};
			const result = Resource(testResource);

			expect(result).toEqual({
				active: true,
				count: 42,
				name: "test"
			});

		});

		it("accepts resource with nested resource", async () => {

			const testResource = {
				user: {
					name: "Alice",
					age: 30
				}
			};
			const result = Resource(testResource);

			expect(result).toEqual({
				user: {
					name: "Alice",
					age: 30
				}
			});

		});

		it("accepts resource with array of literals", async () => {

			const testResource = { tags: ["javascript", "typescript", "node"] };
			const result = Resource(testResource);

			expect(result).toEqual({ tags: ["javascript", "typescript", "node"] });

		});

		it("accepts resource with array of resources", async () => {

			const testResource = {
				users: [
					{ name: "Alice" },
					{ name: "Bob" }
				]
			};
			const result = Resource(testResource);

			expect(result).toEqual({
				users: [
					{ name: "Alice" },
					{ name: "Bob" }
				]
			});

		});

		it("accepts resource with mixed value types", async () => {

			const testResource = {
				id: "123",
				count: 5,
				active: true,
				tags: ["a", "b"],
				metadata: { created: "2025-01-01" }
			};
			const result = Resource(testResource);

			expect(result).toEqual({
				id: "123",
				count: 5,
				active: true,
				tags: ["a", "b"],
				metadata: { created: "2025-01-01" }
			});

		});

		it("accepts deeply nested resources", async () => {

			const testResource = {
				level1: {
					level2: {
						level3: {
							value: "deep"
						}
					}
				}
			};
			const result = Resource(testResource);

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

		it("accepts resource with empty array", async () => {

			const testResource = { items: [] };
			const result = Resource(testResource);

			expect(result).toEqual({ items: [] });

		});

		it("accepts resource with single-element array", async () => {

			const testResource = { items: ["single"] };
			const result = Resource(testResource);

			expect(result).toEqual({ items: ["single"] });

		});

	});

	describe("immutability", async () => {

		it("prevents top-level property modification", async () => {

			const testResource = { name: "test" };
			const result = Resource(testResource);

			expect(() => {
				(result as any).name = "modified";
			}).toThrow();

		});

		it("prevents top-level property addition", async () => {

			const testResource = { name: "test" };
			const result = Resource(testResource);

			expect(() => {
				(result as any).newProp = "value";
			}).toThrow();

		});

		it("prevents top-level property deletion", async () => {

			const testResource = { name: "test" };
			const result = Resource(testResource);

			expect(() => {
				delete (result as any).name;
			}).toThrow();

		});

	});

	describe("validation", async () => {

		describe("nested objects", async () => {

			it("accepts nested resource (2 levels)", async () => {

				const testResource = {
					user: { name: "Alice" }
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("accepts deeply nested resources (3 levels)", async () => {

				const testResource = {
					organization: {
						department: {
							name: "Engineering"
						}
					}
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("accepts deeply nested resources (4 levels)", async () => {

				const testResource = {
					level1: {
						level2: {
							level3: {
								value: "deep"
							}
						}
					}
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("rejects nested invalid values", async () => {

				const testResource = {
					user: { data: null }
				};

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

		});

		describe("arrays", async () => {

			it("accepts array of literals", async () => {

				const testResource = { tags: ["a", "b", "c"] };

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("accepts array of resources", async () => {

				const testResource = {
					users: [
						{ name: "Alice" },
						{ name: "Bob" }
					]
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("rejects nested arrays", async () => {

				const testResource = {
					matrix: [["a", "b"], ["c", "d"]]
				};

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

			it("rejects array with invalid elements", async () => {

				const testResource = {
					items: [1, 2, null]
				};

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

		});

		describe("arrays with nested objects", async () => {

			it("accepts objects within arrays", async () => {

				const testResource = {
					users: [
						{ name: "Alice", age: 30 },
						{ name: "Bob", age: 25 }
					]
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("accepts deeply nested array-object structures", async () => {

				const testResource = {
					departments: [
						{
							name: "Engineering",
							teams: [
								{ name: "Backend", size: 5 }
							]
						}
					]
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("rejects invalid values in nested array objects", async () => {

				const testResource = {
					users: [
						{ name: "Alice", data: null }
					]
				};

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

		});

		describe("objects with nested arrays", async () => {

			it("accepts arrays nested in objects", async () => {

				const testResource = {
					user: {
						name: "Alice",
						roles: ["admin", "user"]
					}
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("accepts deeply nested object-array structures", async () => {

				const testResource = {
					config: {
						settings: {
							options: ["opt1", "opt2"]
						}
					}
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("rejects nested arrays in nested objects", async () => {

				const testResource = {
					config: {
						matrix: [["a", "b"]]
					}
				};

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

		});

		describe("property names", async () => {

			it("accepts valid identifier property names", async () => {

				const testResource = {
					name: "value",
					_private: "value",
					$special: "value",
					prop123: "value"
				};

				expect(() => Resource(testResource)).not.toThrow();

			});

			it("rejects empty string property name", async () => {

				const testResource = { "": "value" };

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

			it("rejects property names with special characters", async () => {

				const testResource = { "prop-name": "value" };

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

			it("rejects property names with spaces", async () => {

				const testResource = { "prop name": "value" };

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

			it("rejects property names starting with digits", async () => {

				const testResource = { "123prop": "value" };

				expect(() => Resource(testResource as any)).toThrow(TypeError);

			});

		});

	});

	describe("error handling", async () => {

		it("throws TypeError for invalid input", async () => {

			expect(() => {
				Resource(null as any);
			}).toThrow(TypeError);

		});

		it("throws TypeError for undefined input", async () => {

			expect(() => {
				Resource(undefined as any);
			}).toThrow(TypeError);

		});

		it("throws TypeError for non-object input", async () => {

			expect(() => {
				Resource("not an object" as any);
			}).toThrow(TypeError);

		});

		it("throws TypeError for array input", async () => {

			expect(() => {
				Resource([1, 2, 3] as any);
			}).toThrow(TypeError);

		});

	});

	describe("type inference", async () => {

		it("preserves input type structure", async () => {

			const testResource = { name: "test", count: 42 } as const;
			const result = Resource(testResource);

			// Type test: result should have the same structure as input
			const name: "test" = result.name;
			const count: 42 = result.count;

			expect(name).toBe("test");
			expect(count).toBe(42);

		});

		it("infers correct type for nested resources", async () => {

			const testResource = {
				user: {
					name: "Alice",
					age: 30
				}
			} as const;
			const result = Resource(testResource);

			// Type test: result should have nested structure
			const userName: "Alice" = result.user.name;
			const userAge: 30 = result.user.age;

			expect(userName).toBe("Alice");
			expect(userAge).toBe(30);

		});

		it("rejects invalid property values at compile time", async () => {

			// This should fail type checking - functions are not valid Values
			// @ts-expect-error
			const invalidResource: Resource = { method: () => {} };

		});

	});

	describe("language dictionaries", async () => {

		it("accepts dictionary with hyphenated language tags", async () => {

			const testResource = {
				label: {
					"en": "Hello",
					"en-US": "Hello",
					"en-GB": "Hello",
					"fr-CA": "Bonjour"
				}
			};

			expect(() => Resource(testResource)).not.toThrow();

		});

	});

});
