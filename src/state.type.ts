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
 * Runtime validators for state types.
 *
 * @module
 */

import { error } from "@metreeca/core/error";
import { isArray, isBoolean, isNumber, isObject, isString } from "@metreeca/core/json";
import { isTag } from "@metreeca/core/language";
import type { Patch, Resource } from "./state.js";


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
 * Validates that a value is a {@link Resource}.
 *
 * @param value The value to validate
 * @returns The validated Resource
 * @throws TypeError If the value is not a valid Resource
 */
export function asResource(value: unknown): Resource {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isResourceObject(value) ? error(new TypeError("invalid resource"))
			: value as unknown as Resource;
}

/**
 * Validates that a value is a {@link Patch}.
 *
 * @param value The value to validate
 * @returns The validated Patch
 * @throws TypeError If the value is not a valid Patch
 */
export function asPatch(value: unknown): Patch {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isPatchObject(value) ? error(new TypeError("invalid patch"))
			: value as unknown as Patch;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isResourceObject(obj: Record<string, unknown>): boolean {
	return Object.values(obj).every(isValues);
}

function isPatchObject(obj: Record<string, unknown>): boolean {
	return Object.values(obj).every(v => v === null || isValues(v));
}

function isValues(value: unknown): boolean {
	return isValue(value)
		|| isLocal(value)
		|| isLocals(value)
		|| (isArray(value) && value.every(isValue));
}

function isValue(value: unknown): boolean {
	return isBoolean(value)
		|| isNumber(value)
		|| isString(value)
		|| (isObject(value) && isResourceObject(value));
}

function isLocal(value: unknown): boolean {
	return isObject(value)
		&& Object.keys(value).length > 0
		&& Object.keys(value).every(isTag)
		&& Object.values(value).every(isString);
}

function isLocals(value: unknown): boolean {
	return isObject(value)
		&& Object.keys(value).length > 0
		&& Object.keys(value).every(isTag)
		&& Object.values(value).every(v => isArray(v) && v.every(isString));
}
