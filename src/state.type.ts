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

import { isIdentifier } from "@metreeca/core";
import { error } from "@metreeca/core/error";
import { isArray, isBoolean, isNumber, isObject, isString } from "@metreeca/core/json";
import { isTag } from "@metreeca/core/language";
import type { Patch, Resource } from "./state.js";


export function asString(value: unknown): string {
	return !isString(value) ? error(new TypeError("expected string"))
		: value;
}

export function asResource(value: unknown): Resource {
	return !isResource(value) ? error(new TypeError("invalid resource"))
		: value as unknown as Resource;
}

export function asPatch(value: unknown): Patch {
	return !isPatch(value) ? error(new TypeError("invalid patch"))
		: value as unknown as Patch;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isResource(value: unknown): boolean {
	return isObject(value, ([k, v]) => isIdentifier(k) && (isIndexed(v) || isValues(v)));
}

function isPatch(value: unknown): boolean {
	return isObject(value, ([k, v]) => isIdentifier(k) && (v === null || isIndexed(v) || isValues(v)));
}


function isIndexed(value: unknown): boolean {
	return isObject(value, ([k, v]) => isIdentifier(k) && isValues(v));
}

function isValues(value: unknown): boolean {
	return isValue(value)
		|| isLocal(value)
		|| isLocals(value)
		|| isArray(value, isValue);
}

function isValue(value: unknown): boolean {
	return isBoolean(value)
		|| isNumber(value)
		|| isString(value)
		|| isResource(value);
}

function isLocal(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTag(k) && isString(v));
}

function isLocals(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTag(k) && isArray(v, isString));
}
