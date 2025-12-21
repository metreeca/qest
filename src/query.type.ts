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

/**
 * Runtime validators for query types.
 *
 * @module
 */

import { isIdentifier } from "@metreeca/core";
import { isArray, isBoolean, isNull, isNumber, isObject, isString } from "@metreeca/core/json";
import { error } from "@metreeca/core/error";
import type { Criterion, Query, Transform } from "./query.js";


const CriterionKeys = new Set(["target", "pipe", "path"]);

const TransformKeys = new Set(["name", "aggregate", "datatype"]);

const DatatypeValues = new Set(["boolean", "number", "string"]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates that a value is a string.
 *
 * @param value The value to validate
 * @returns The validated string
 * @throws TypeError If the value is not a string
 */
export function asString(value: unknown): string {
	return !isString(value) ? error(new TypeError("expected string"))
		: value;
}

/**
 * Validates that a value is a {@link Query}.
 *
 * @param value The value to validate
 * @returns The validated Query
 * @throws TypeError If the value is not a valid Query
 */
export function asQuery(value: unknown): Query {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isQueryObject(value) ? error(new TypeError("invalid query"))
			: value as unknown as Query;
}

/**
 * Validates that a value is a {@link Criterion}.
 *
 * @param value The value to validate
 * @returns The validated Criterion
 * @throws TypeError If the value is not a valid Criterion
 */
export function asCriterion(value: unknown): Criterion {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isString(value.target) ? error(new TypeError("expected string target"))
			: !(isArray(value.pipe) && value.pipe.every(isString)) ? error(new TypeError("expected string array pipe"))
				: !(isArray(value.path) && value.path.every(isString)) ? error(new TypeError("expected string array path"))
					: !Object.keys(value).every(key => CriterionKeys.has(key)) ? error(new TypeError("unexpected properties"))
						: value as unknown as Criterion;
}

/**
 * Validates that a value is a {@link Transform}.
 *
 * @param value The value to validate
 * @returns The validated Transform
 * @throws TypeError If the value is not a valid Transform
 */
export function asTransform(value: unknown): Transform {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isIdentifier(value.name) ? error(new TypeError("expected identifier name"))
			: !(value.aggregate === undefined || isBoolean(value.aggregate)) ? error(new TypeError("expected boolean aggregate"))
				: !(value.datatype === undefined || DatatypeValues.has(value.datatype as string)) ? error(new TypeError("expected datatype"))
					: !Object.keys(value).every(key => TransformKeys.has(key)) ? error(new TypeError("unexpected properties"))
						: value as unknown as Transform;
}

/**
 * Validates that a value is an array of {@link Transform}.
 *
 * @param value The value to validate
 * @returns The validated Transform array
 * @throws TypeError If the value is not a valid Transform array
 */
export function asTransforms(value: unknown): readonly Transform[] {
	return !isArray(value) ? error(new TypeError("expected array"))
		: value.map(asTransform);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if an object is a valid Query.
 */
function isQueryObject(obj: Record<string, unknown>): boolean {
	return Object.entries(obj).every(([key, value]) => isQueryEntry(key, value));
}

/**
 * Checks if a key-value pair is a valid Query entry.
 */
function isQueryEntry(key: string, value: unknown): boolean {
	return key === "@" || key === "#"
		? value === undefined || isNumber(value) || error(new TypeError(`expected number for '${key}'`))
		: isQueryValue(value) || error(new TypeError(`invalid value for '${key}'`));
}

/**
 * Checks if a value is a valid Query value type.
 */
function isQueryValue(value: unknown): boolean {
	return value === undefined
		|| isNull(value)
		|| isBoolean(value)
		|| isNumber(value)
		|| isString(value)
		|| (isArray(value) && isQueryArrayValue(value))
		|| (isObject(value) && isQueryObject(value));
}

/**
 * Checks if an array is a valid Query array value.
 */
function isQueryArrayValue(arr: readonly unknown[]): boolean {
	return arr.length === 0
		|| arr.every(isString)
		|| arr.every(isOption)
		|| arr.every(item => isObject(item) && isQueryObject(item as Record<string, unknown>));
}

/**
 * Checks if a value is a valid Option.
 */
function isOption(value: unknown): boolean {
	return isNull(value) || isBoolean(value) || isNumber(value) || isString(value);
}
