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

/**
 * Type guards for model and query types.
 *
 * @module
 */

import {
	isArray,
	isIdentifier,
	isLiteral as isLiteralValue,
	isNull,
	isNumber,
	isObject,
	isString,
	isUnion
} from "@metreeca/core";
import { isTagRange } from "@metreeca/core/language";
import { isIndexed } from "./index.core.js";
import type {
	Binding,
	Expression,
	Locale,
	Locales,
	Model,
	Operator,
	Option,
	Options,
	Probe,
	Query,
	Template,
	Transform
} from "./model.js";
import { isLiteral, isLocal, isLocals, isReference } from "./state.core.js";


/**
 * Checks if a value is a {@link Model}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid projection model
 */
export function isModel(value: unknown): value is Model {
	return isObject(value, (v, k) =>
		isBinding(k) && (isTemplate(v) || isIndexed(v, isTemplate))
	);
}


/**
 * Checks if a value is a {@link Template}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid property value template
 */
export function isTemplate(value: unknown): value is Template {
	return isUnion(value, [
		isLiteral,
		isReference,
		isModel,
		isLocale,
		isLocales,
		v => isArray(v, [isLiteral]),
		v => isArray(v, [isReference]),
		v => isArray(v, [isQuery])
	]);
}

/**
 * Checks if a value is a {@link Locale}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid single-valued locale placeholder
 */
export function isLocale(value: unknown): value is Locale {
	return isString(value) || isObject(value, (v, k) => isTagRange(k) && isString(v));
}

/**
 * Checks if a value is a {@link Locales}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid multi-valued locale placeholder
 */
export function isLocales(value: unknown): value is Locales {
	return isArray(value, [isString]) || isObject(value, (v, k) => isTagRange(k) && isArray(v, [isString]));
}

/**
 * Checks if a value is a {@link Query}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid query combining projection, filtering, ordering, and pagination
 */
export function isQuery(value: unknown): value is Query {
	return isObject(value, (v, k) => {

		// projection

		if ( isBinding(k) as boolean ) {

			return isTemplate(v) || isIndexed(v, isTemplate);

		}

		// filtering

		else if ( k.startsWith("<=") || k.startsWith(">=") ) {

			return isLiteral(v);

		} else if ( k.startsWith("<") || k.startsWith(">") ) {

			return isLiteral(v);

		} else if ( k.startsWith("~") ) {

			return isString(v);

		} else if ( k.startsWith("?") || k.startsWith("!") ) {

			return isOptions(v);

		}

		// ordering

		else if ( k.startsWith("*") ) {

			return isOptions(v);

		} else if ( k.startsWith("^") ) {

			return isNumber(v) || isLiteralValue(v, ["asc", "desc"]);

		}

		// paging

		else if ( k === "@" || k === "#" ) {

			return isNumber(v);

		} else {

			return false;

		}

	});
}


/**
 * Checks if a value is a {@link Binding}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a string matching the `{identifier}={expression}` syntax
 */
export function isBinding(value: unknown): value is Binding {
	return isIdentifier(value) || isString(value) && value.includes("=")
		&& isIdentifier(value.slice(0, value.indexOf("=")))
		&& isExpression(value.slice(value.indexOf("=")+1));
}

/**
 * Checks if a value is an {@link Expression}.
 *
 * @param value The value to check
 *
 * @returns True if the value matches expression syntax (transform pipeline and property path)
 */
export function isExpression(value: unknown): value is Expression {
	return isString(value) && (() => {

		const segments = value.split(":");
		const path = segments.at(-1) ?? "";

		return segments.slice(0, -1).every(isTransform)
			&& (path === "" || path.split(".").every(isIdentifier));

	})();
}


/**
 * Checks if a value is an {@link Options}.
 *
 * @param value The value to check
 *
 * @returns True if the value is an option, local, locals, or array of options
 */
export function isOptions(value: unknown): value is Options {
	return isUnion(value, [isOption, isLocal, isLocals, v => isArray(v, isOption)]);
}

/**
 * Checks if a value is an {@link Option}.
 *
 * @param value The value to check
 *
 * @returns True if the value is null, a literal, or a reference
 */
export function isOption(value: unknown): value is Option {
	return isUnion(value, [isNull, isLiteral, isReference]);
}


/**
 * Checks if a value is a {@link Probe}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid parsed probe
 */
export function isProbe(value: unknown): value is Probe {
	return isObject(value, {
		target: v => isIdentifier(v) || isOperator(v),
		pipe: (v: unknown) => isArray(v, isTransform),
		path: (v: unknown) => isArray(v, isIdentifier)
	});
}

/**
 * Checks if a value is an {@link Operator}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid constraint operator symbol
 */
export function isOperator(value: unknown): value is Operator {
	return isLiteralValue(value, ["<", ">", "<=", ">=", "~", "?", "!", "*", "^", "@", "#"]);
}

/**
 * Checks if a value is a {@link Transform}.
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid transform name
 */
export function isTransform(value: unknown): value is Transform {
	return isLiteralValue(value, [
		"count", "min", "max", "sum", "avg",
		"abs", "floor", "ceil", "round",
		"lower", "upper", "length",
		"year", "month", "day", "hours", "minutes", "seconds"
	]);
}
