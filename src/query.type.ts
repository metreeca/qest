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
import { isArray, isBoolean, isNull, isNumber, isObject, isString } from "@metreeca/core/json";
import { isTagRange } from "@metreeca/core/language";
import { isIRI } from "@metreeca/core/resource";
import { BindingSource, ExpressionSource } from "./index.js";
import type { Criterion, Query, Transform } from "./query.js";

export { asString } from "./state.type.js";


const BindingPattern = new RegExp(`^${BindingSource}$`, "u");
const ExpressionPattern = new RegExp(`^${ExpressionSource}$`, "u");


const CriterionKeys = new Set(["target", "pipe", "path"]);
const TransformKeys = new Set(["name", "aggregate", "datatype"]);
const DatatypeValues = new Set(["boolean", "number", "string"]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function asQuery(value: unknown): Query {
	return !isQuery(value) ? error(new TypeError("invalid query"))
		: value as unknown as Query;
}

export function asCriterion(value: unknown): Criterion {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isString(value.target) ? error(new TypeError("expected string target"))
			: !isArray(value.pipe, isString) ? error(new TypeError("expected string array pipe"))
				: !isArray(value.path, isString) ? error(new TypeError("expected string array path"))
					: !Object.keys(value).every(key => CriterionKeys.has(key)) ? error(new TypeError("unexpected properties"))
						: value as unknown as Criterion;
}

export function asTransform(value: unknown): Transform {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isIdentifier(value.name) ? error(new TypeError("expected identifier name"))
			: !(value.aggregate === undefined || isBoolean(value.aggregate))
				? error(new TypeError("expected boolean aggregate"))
				: !(value.datatype === undefined || (isString(value.datatype) && DatatypeValues.has(value.datatype)))
					? error(new TypeError("expected datatype"))
					: !Object.keys(value).every(key => TransformKeys.has(key)) ? error(new TypeError("unexpected properties"))
						: value as unknown as Transform;
}

export function asTransforms(value: unknown): readonly Transform[] {
	return !isArray(value) ? error(new TypeError("expected array"))
		: value.map(asTransform);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Query = Projection & Filtering & Ordering & Paging

function isQuery(value: unknown): boolean {
	return isObject(value, isQueryEntry);
}

function isQueryEntry([key, value]: [unknown, unknown]): boolean {
	return isProjectionEntry(key as string, value)
		|| isFilteringEntry(key as string, value)
		|| isOrderingEntry(key as string, value)
		|| isPagingEntry(key as string, value);
}


// Projection

function isProjectionEntry(key: string, value: unknown): boolean {
	return isProjectionKey(key) && isProjectionValue(value);
}

function isProjectionKey(key: string): boolean {
	return isIdentifier(key) || BindingPattern.test(key);
}

function isProjectionValue(value: unknown): boolean {
	return isLiteral(value)
		|| isLocalModel(value)
		|| isLocalsModel(value)
		|| isReference(value)
		|| isReferenceCollection(value)
		|| isQuery(value)
		|| isQueryCollection(value);
}

function isLocalModel(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isString(v));
}

function isLocalsModel(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isArray(v, isString) && v.length === 1);
}

function isReference(value: unknown): boolean {
	return isIRI(value, "internal");
}

function isReferenceCollection(value: unknown): boolean {
	return isArray(value, isString) && value.length === 1;
}

function isQueryCollection(value: unknown): boolean {
	return isArray(value, isQuery) && value.length === 1;
}

function isLiteral(value: unknown): boolean {
	return isBoolean(value)
		|| isNumber(value)
		|| isString(value);
}


// Filtering

function isFilteringEntry(key: string, value: unknown): boolean {
	return (isLteKey(key) && isLiteral(value))
		|| (isGteKey(key) && isLiteral(value))
		|| (isLtKey(key) && isLiteral(value))
		|| (isGtKey(key) && isLiteral(value))
		|| (isLikeKey(key) && isString(value))
		|| (isAnyKey(key) && isOptions(value))
		|| (isAllKey(key) && isOptions(value));
}

function isLtKey(key: string): boolean {
	return key.startsWith("<") && isExpression(key.slice(1));
}

function isGtKey(key: string): boolean {
	return key.startsWith(">") && isExpression(key.slice(1));
}

function isLteKey(key: string): boolean {
	return key.startsWith("<=") && isExpression(key.slice(2));
}

function isGteKey(key: string): boolean {
	return key.startsWith(">=") && isExpression(key.slice(2));
}

function isLikeKey(key: string): boolean {
	return key.startsWith("~") && isExpression(key.slice(1));
}

function isAnyKey(key: string): boolean {
	return key.startsWith("?") && isExpression(key.slice(1));
}

function isAllKey(key: string): boolean {
	return key.startsWith("!") && isExpression(key.slice(1));
}


// Ordering

function isOrderingEntry(key: string, value: unknown): boolean {
	return (isFocusKey(key) && isOptions(value))
		|| (isOrderKey(key) && isOrderValue(value));
}

function isFocusKey(key: string): boolean {
	return key.startsWith("*") && isExpression(key.slice(1));
}

function isOrderKey(key: string): boolean {
	return key.startsWith("^") && isExpression(key.slice(1));
}

function isOrderValue(value: unknown): boolean {
	return isNumber(value)
		|| value === "asc" || value === "desc"
		|| value === "ascending" || value === "descending";
}


// Paging

function isPagingEntry(key: string, value: unknown): boolean {
	return (key === "@" || key === "#")
		&& (value === undefined || isNumber(value));
}


// Expression

function isExpression(expr: string): boolean {
	return expr.length > 0 && ExpressionPattern.test(expr);
}


// Options

function isOptions(value: unknown): boolean {
	return isOption(value)
		|| isLocal(value)
		|| isLocals(value)
		|| isOptionArray(value);
}

function isLocal(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isString(v));
}

function isLocals(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isArray(v, isString));
}

function isOptionArray(value: unknown): boolean {
	return isArray(value, isOption);
}


// Option

function isOption(value: unknown): boolean {
	return isNull(value)
		|| isLiteral(value);
}
