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

import { Identifier, isIdentifier } from "@metreeca/core";
import { error } from "@metreeca/core/error";
import { isArray, isBoolean, isNull, isNumber, isObject, isString } from "@metreeca/core/json";
import { isTagRange } from "@metreeca/core/language";
import { BindingSource, ExpressionSource } from "./index.js";
import type { Binding, Criterion, Expression, Model, Query, Transform } from "./query.js";
import { isLiteral, isReference } from "./state.type.js";


const BindingPattern = new RegExp(`^${BindingSource}$`, "u");
const ExpressionPattern = new RegExp(`^${ExpressionSource}$`, "u");

const CriterionKeys = new Set(["target", "pipe", "path"]);
const TransformKeys = new Set(["name", "aggregate", "datatype"]);
const DatatypeValues = new Set(["boolean", "number", "string"]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Type guard for {@link Query} values.
 *
 * Validates that a value is an object containing valid projection, filtering, ordering, and paging entries.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid query
 */
export function isQuery(value: unknown): value is Query {
	return isObject(value, isQueryEntry);
}

/**
 * Type guard for {@link Binding} values.
 *
 * Validates that a value is a string matching the `name=expression` syntax,
 * where `name` is a valid {@link Identifier} and `expression` is a valid {@link Expression}.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid binding string
 */
export function isBinding(value: unknown): value is Binding {
	return isString(value) && BindingPattern.test(value);
}

/**
 * Type guard for {@link Expression} values.
 *
 * Validates that a value is a string matching the expression syntax `[transform:]*[path]`.
 * Empty strings are valid (both transform and path are optional).
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid expression string
 */
export function isExpression(value: unknown): value is Expression {
	return isString(value) && ExpressionPattern.test(value);
}

/**
 * Type guard for {@link Model} values.
 *
 * Validates that a value is a valid projection model: a literal, a TagRange-keyed language map,
 * a reference, a singleton reference array, a query, or a singleton query array.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid model
 */
export function isModel(value: unknown): value is Model {
	return isLiteral(value)
		|| isLocalModel(value)
		|| isLocalsModel(value)
		|| isReference(value)
		|| isReferenceCollection(value)
		|| isQuery(value)
		|| isQueryCollection(value);
}

/**
 * Type guard for {@link Criterion} values.
 *
 * Validates that a value is an object with `target` (string), `pipe` (string array), and `path` (string array)
 * properties, with no additional properties.
 *
 * @param value The value to check
 *
 * @returns `true` if the value is a valid criterion
 */
export function isCriterion(value: unknown): value is Criterion {
	return isObject(value)
		&& isString(value.target)
		&& isArray(value.pipe, isString)
		&& isArray(value.path, isString)
		&& Object.keys(value).every(key => CriterionKeys.has(key));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates a {@link Query} value.
 *
 * @param value The value to validate
 *
 * @returns The validated query
 *
 * @throws {TypeError} If the value is not a valid query
 */
export function asQuery(value: unknown): Query {
	return !isQuery(value) ? error(new TypeError("invalid query"))
		: value;
}

/**
 * Validates a {@link Binding} value.
 *
 * @param value The value to validate
 *
 * @returns The validated binding
 *
 * @throws {TypeError} If the value is not a valid binding
 */
export function asBinding(value: unknown): Binding {
	return !isBinding(value) ? error(new TypeError("invalid binding"))
		: value;
}

/**
 * Validates an {@link Expression} value.
 *
 * @param value The value to validate
 *
 * @returns The validated expression
 *
 * @throws {TypeError} If the value is not a valid expression
 */
export function asExpression(value: unknown): Expression {
	return !isExpression(value) ? error(new TypeError("invalid expression"))
		: value;
}

/**
 * Validates a {@link Model} value.
 *
 * @param value The value to validate
 *
 * @returns The validated model
 *
 * @throws {TypeError} If the value is not a valid model
 */
export function asModel(value: unknown): Model {
	return !isModel(value) ? error(new TypeError("invalid model"))
		: value;
}

/**
 * Validates a {@link Criterion} value.
 *
 * @param value The value to validate
 *
 * @returns The validated criterion
 *
 * @throws {TypeError} If the value is not a valid criterion
 */
export function asCriterion(value: unknown): Criterion {
	return !isCriterion(value) ? error(new TypeError("invalid criterion"))
		: value;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// query = projection & filtering & ordering & paging

function isQueryEntry([key, value]: [unknown, unknown]): boolean {
	return isProjectionEntry(key as string, value)
		|| isFilteringEntry(key as string, value)
		|| isOrderingEntry(key as string, value)
		|| isPagingEntry(key as string, value);
}


// projection

function isProjectionEntry(key: string, value: unknown): boolean {
	return isProjectionKey(key) && isProjectionValue(value);
}

function isProjectionKey(key: string): boolean {
	return isIdentifier(key) || BindingPattern.test(key);
}

function isProjectionValue(value: unknown): boolean {
	return isIndexedModel(value) || isModel(value);
}

function isIndexedModel(value: unknown): boolean {
	return isObject(value, ([k, v]) => isIdentifier(k) && isModel(v));
}

function isLocalModel(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isString(v));
}

function isLocalsModel(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isArray(v, isString) && v.length === 1);
}

function isReferenceCollection(value: unknown): boolean {
	return isArray(value, isReference) && value.length === 1;
}

function isQueryCollection(value: unknown): boolean {
	return isArray(value, isQuery) && value.length === 1;
}


// filtering

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


// ordering

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


// paging

function isPagingEntry(key: string, value: unknown): boolean {
	return (key === "@" || key === "#")
		&& (value === undefined || isNumber(value));
}


// options

function isOptions(value: unknown): boolean {
	return isOption(value)
		|| isLocalOption(value)
		|| isLocalsOption(value)
		|| isOptionArray(value);
}

function isLocalOption(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isString(v));
}

function isLocalsOption(value: unknown): boolean {
	return isObject(value, ([k, v]) => isTagRange(k) && isArray(v, isString));
}

function isOptionArray(value: unknown): boolean {
	return isArray(value, isOption);
}


// option

function isOption(value: unknown): boolean {
	return isNull(value)
		|| isLiteral(value);
}


// transform

function asTransform(value: unknown): Transform {
	return !isObject(value) ? error(new TypeError("expected object"))
		: !isIdentifier(value.name) ? error(new TypeError("expected identifier name"))
			: !(value.aggregate === undefined || isBoolean(value.aggregate))
				? error(new TypeError("expected boolean aggregate"))
				: !(value.datatype === undefined || (isString(value.datatype) && DatatypeValues.has(value.datatype)))
					? error(new TypeError("expected datatype"))
					: !Object.keys(value).every(key => TransformKeys.has(key)) ? error(new TypeError("unexpected properties"))
						: value as unknown as Transform;
}

function asTransforms(value: unknown): readonly Transform[] {
	return !isArray(value) ? error(new TypeError("expected array"))
		: value.map(asTransform);
}
