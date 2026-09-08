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
 * Type guards for retrieval template and query types.
 *
 * Runtime validators for the retrieval-template types declared in the `template` module, re-exported through it.
 *
 * @module
 */

import {
	type Identifier,
	isArray,
	isIdentifier,
	isNull,
	isNumber,
	isObject,
	isString,
	isUnion as isVariants
} from "@metreeca/core";
import { isTagRange, type TagRange } from "@metreeca/core/language";
import { isLiteral, isReference, isText } from "./resource.core.js";
import type { Literal, Reference, Text } from "./resource.js";
import type {
	Binding,
	Expression,
	Locale,
	Model,
	Operator,
	Option,
	Options,
	Order,
	Placeholder,
	Placeholders,
	Probe,
	Projection,
	Query,
	Selection,
	Template,
	Transform,
	Union,
	UnionKey
} from "./template.js";


/**
 * Matches a {@link Union} key: a canonical non-negative integer string with no leading zeros.
 */
const UnionKeyPattern = /^(0|[1-9]\d*)$/;


/**
 * Recognised {@link Order} sort directions.
 */
const Orders: ReadonlySet<string> = new Set([
	"asc", "desc"
]);

/**
 * Recognised {@link Operator} constraint symbols.
 */
const Operators: ReadonlySet<string> = new Set([
	"<", ">", "<=", ">=", "~", "?", "!", "+", "^", "@", "#"
]);

/**
 * Recognised aggregate {@link Transform} names.
 */
const Aggregates: ReadonlySet<string> = new Set([
	"count", "min", "max", "sum", "avg"
]);

/**
 * Recognised {@link Transform} names.
 */
const Transforms: ReadonlySet<string> = new Set([
	...Aggregates,
	"abs", "floor", "ceil", "round",
	"lower", "upper", "length",
	"year", "month", "day", "hours", "minutes", "seconds"
]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is a {@link Template}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose keys are all {@link Identifier | identifiers} and whose values
 * are all valid {@link Placeholders} sets; false otherwise
 */
export function isTemplate(value: unknown): value is Template {
	return isObject(value, (v, k) => isIdentifier(k) && isPlaceholders(v));
}


/**
 * Checks if a value is a {@link Placeholders} set.
 *
 * Accepts the absent marker `undefined`, a {@link Model} single-value placeholder, or a {@link Query}
 * collection-shaped placeholder.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a valid Placeholders set; false otherwise
 */
export function isPlaceholders(value: unknown): value is Placeholders {
	return value === undefined
		|| isModel(value)
		|| isQuery(value);
}

/**
 * Checks if a value is a {@link Placeholder}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a {@link Literal}, a {@link Reference}, or a nested {@link Template}; false otherwise
 */
export function isPlaceholder(value: unknown): value is Placeholder {
	return isVariants(value, [
		isLiteral,
		isReference,
		isTemplate
	]);
}


/**
 * Checks if a value is a {@link Model} single-value template.
 *
 * Accepts a single {@link Placeholder}, a {@link Union} per-branch placeholder, or a {@link Locale} localised text map:
 * the single-value forms admitted as {@link Placeholders} alongside the collection-valued {@link Query}, and as the
 * per-cell value of a {@link Projection}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a valid Model template; false otherwise
 */
export function isModel(value: unknown): value is Model {
	return isUnion(value)
		|| isPlaceholder(value)
		|| isLocale(value);
}

/**
 * Checks if a value is a {@link Query}.
 *
 * Accepts a tuple whose first element is the per-item placeholder (a {@link Union}, a
 * {@link Placeholder}, or a {@link Projection}), optionally followed by a {@link Selection} carrying filtering,
 * ordering, and pagination constraints.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a valid Query; false otherwise
 */
export function isQuery(value: unknown): value is Query {

	const isElement = (v: unknown): boolean => isPlaceholder(v) || isUnion(v) || isProjection(v);

	return isArray(value, [isElement])
		|| isArray(value, [isElement, isSelection]);

}


/**
 * Checks if a value is a {@link Locale} template.
 *
 * Accepts a map keyed by RFC 4647 basic language ranges (a subtag sequence or the standalone `*`) with values
 * uniformly scalar or uniformly singleton-tuple string. A `Locale` carries no {@link Selection}; filtering by
 * localised text attaches at the enclosing collection's `Selection` through an {@link Expression}, not on the map.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a valid Locale template; false otherwise
 */
export function isLocale(value: unknown): value is Locale {
	return isObject(value, (v, k) => isTagRange(k) && isString(v))
		|| isObject(value, (v, k) => isTagRange(k) && isArray(v, [isString]));
}

/**
 * Checks if a value is a {@link Union}.
 *
 * Accepts an object whose keys are non-negative integer strings, each mapping to a per-branch {@link Placeholder} or
 * {@link Locale} localised-text map.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a valid Union; false otherwise
 */
export function isUnion(value: unknown): value is Union {
	return isObject(value, (v, k) => isUnionKey(k) && (isPlaceholder(v) || isLocale(v)));
}

/**
 * Checks if a value is a {@link UnionKey | Union variant key}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a canonical non-negative integer string with no leading zeros; false otherwise
 */
export function isUnionKey(value: unknown): value is UnionKey {
	return isString(value) && UnionKeyPattern.test(value);
}


/**
 * Checks if a value is a {@link Projection}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose keys are all {@link Binding | bindings} and whose values
 * are all valid {@link Model} single-value placeholders or the absent marker `undefined`; false otherwise
 */
export function isProjection(value: unknown): value is Projection {

	return isObject(value, (v, k) =>
		isBinding(k) && (v === undefined || isModel(v))
	) && unique(Object.keys(value).map(k =>
		k.slice(0, k.indexOf("="))
	));


	function unique(names: readonly string[]): boolean {
		return new Set(names).size === names.length;
	}

}

/**
 * Checks if a value is a {@link Selection}.
 *
 * Selection entries combine filtering (`<`, `>`, `<=`, `>=`, `~`, `?`, `!`), sort focus and order (`+`, `^`), and
 * pagination (`@`, `#`) keys, each mapping to an operator-appropriate scalar or options set.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose every entry is a valid Selection constraint slot; false
 * otherwise
 */
export function isSelection(value: unknown): value is Selection {
	return isObject(value, (v, k) => {

		if ( k.startsWith("<=") || k.startsWith(">=") ) {

			return isExpression(k.slice(2)) && isLiteral(v);

		} else if ( k.startsWith("<") || k.startsWith(">") ) {

			return isExpression(k.slice(1)) && isLiteral(v);

		} else if ( k.startsWith("~") ) {

			return isExpression(k.slice(1)) && isString(v);

		} else if ( k.startsWith("?") || k.startsWith("!") ) {

			return isExpression(k.slice(1)) && isOptions(v);

		} else if ( k.startsWith("+") ) {

			return isExpression(k.slice(1)) && isOptions(v);

		} else if ( k.startsWith("^") ) {

			return isExpression(k.slice(1)) && isOrder(v);

		} else if ( k === "@" || k === "#" ) {

			return isNumber(v) && Number.isInteger(v) && v >= 0;

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
 * @returns True if `value` is a string matching the `identifier=expression` syntax; false otherwise
 */
export function isBinding(value: unknown): value is Binding {
	return isString(value) && value.includes("=")
		&& isIdentifier(value.slice(0, value.indexOf("=")))
		&& isExpression(value.slice(value.indexOf("=")+1));
}

/**
 * Checks if a value is an {@link Expression}.
 *
 * An expression is a colon-separated chain of {@link Transform | transforms} followed by an optional
 * dot-separated property {@link Path}.
 *
 * @param value The value to check
 *
 * @returns True if `value` matches the expression syntax; false otherwise
 */
export function isExpression(value: unknown): value is Expression {
	return isString(value) && (() => {

		const segments = value.split(":");
		const path = segments.at(-1) ?? "";
		const transforms = segments.slice(0, -1);

		return transforms.every(isTransform)
			&& transforms.filter(isAggregate).length <= 1
			&& (path === "" || path.split(".").every(isIdentifier));

	})();
}


/**
 * Checks if a value is an {@link Options} set.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a single {@link Option}, a {@link Text} map, or an array of
 * {@link Option} elements; false otherwise
 */
export function isOptions(value: unknown): value is Options {
	return isVariants(value, [
		isOption,
		isText,
		v => isArray(v, isOption)
	]);
}

/**
 * Checks if a value is an {@link Option}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is `null`, a {@link Literal}, or a {@link Reference}; false otherwise
 */
export function isOption(value: unknown): value is Option {
	return isVariants(value, [
		isNull,
		isLiteral,
		isReference
	]);
}


/**
 * Checks if a value is an {@link Order}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is `"asc"`, `"desc"`, or an integer; false otherwise
 */
export function isOrder(value: unknown): value is Order {
	return isString(value) && Orders.has(value) || Number.isInteger(value);
}


/**
 * Checks if a value is a {@link Probe}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object with a `target` ({@link Identifier} or {@link Operator}), a `pipe`
 * ({@link Transform} array), and a `path` ({@link Identifier} array); false otherwise
 */
export function isProbe(value: unknown): value is Probe {
	return isObject(value, {
		target: v => isIdentifier(v) || isOperator(v),
		pipe: (v: unknown) => isArray(v, isTransform),
		path: (v: unknown) => isArray(v, isIdentifier)
	});
}

/**
 * Checks if a value is a valid {@link Selection} entry key.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a string composed of a {@link Selection} operator prefix (`<`, `>`, `<=`, `>=`,
 * `~`, `?`, `!`, `+`, `^`) followed by a valid {@link Expression}, or exactly `"@"` or `"#"`; false otherwise
 */
export function isSelector(value: unknown): value is keyof Selection {

	if ( !isString(value) ) {

		return false;

	} else if ( value === "@" || value === "#" ) {

		return true;

	} else if ( /^[<>]=/.test(value) ) {

		return isExpression(value.slice(2));

	} else if ( /^[<>~?!+^]/.test(value) ) {

		return isExpression(value.slice(1));

	} else {

		return false;

	}

}

/**
 * Checks if a value is an {@link Operator}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is one of the constraint operator symbols (`<`, `>`, `<=`, `>=`, `~`, `?`, `!`,
 * `+`, `^`, `@`, `#`); false otherwise
 */
export function isOperator(value: unknown): value is Operator {
	return isString(value) && Operators.has(value);
}

/**
 * Checks if a value is a {@link Transform}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is one of the recognised aggregate, numeric, string, or temporal transform names;
 * false otherwise
 */
export function isTransform(value: unknown): value is Transform {
	return isString(value) && Transforms.has(value);
}

/**
 * Checks whether a value is an aggregate {@link Transform}.
 *
 * Aggregates summarise a set of values into a single result; non-aggregate transforms operate on individual values
 * and propagate the cardinality of their input.
 *
 * @param value The value to check
 *
 * @returns True if `value` is an aggregate transform name (`count`, `min`, `max`, `sum`, `avg`); false otherwise
 */
export function isAggregate(value: unknown): value is "count" | "min" | "max" | "sum" | "avg" {
	return isString(value) && Aggregates.has(value);
}


/**
 * Checks if a value is vacuous per the template elision rule.
 *
 * A placeholder is vacuous when, after recursive elision, it carries no retrieval instructions and must be ignored
 * as if the owning entry were omitted from the enclosing template:
 *
 * - the absent marker `undefined`
 * - an empty {@link Template}, {@link Union}, {@link Locale}, or {@link Projection} (`{}`)
 * - an object whose every entry is either a {@link Selection} key or a non-Selection key ({@link Identifier},
 *   {@link Binding}, {@link TagRange}, variant-index, or `""`) mapping to a vacuous value — transitively elided
 *   per the rule, leaving at most a selection-only inner
 * - an empty array, or an array whose every element is vacuous
 *
 * Primitive placeholders ({@link Literal}) are never vacuous — they are type markers for leaf retrieval.
 *
 * @param value The value to check
 *
 * @returns True if `value` reduces to a vacuous placeholder under recursive elision; false otherwise
 *
 * @remarks
 *
 * Vacuousness is a semantic property that crosscuts the template structural types and admits selection-only
 * objects (for example `{ "<price": 100 }`, whose slot value is itself non-vacuous), so there is no coherent
 * type to narrow to. The guard therefore narrows only to `undefined | object`, the broadest sound target: a
 * `true` result guarantees merely that `value` is not a primitive {@link Literal} leaf.
 */
export function isVacuous(value: unknown): value is undefined | object {
	return value === undefined
		|| isArray(value, isVacuous)
		|| isObject(value, (v, k) => isSelector(k) || isVacuous(v));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves an {@link Order} to its sort precedence.
 *
 * The 1-based magnitude ranking a sort key against other criteria: the `"asc"` and `"desc"` shorthands map to `1`, and
 * a numeric order to the absolute value of its precedence (`0` when the order is zero and thus ignored).
 *
 * @param order The sort order to resolve
 *
 * @returns The non-negative precedence of `order`, or `0` when it is zero and ignored
 *
 * @see {@link getOrderDirection} for the signed direction
 */
export function getOrderPrecedence(order: Order): number {
	return order === "asc" || order === "desc" ? 1 : Math.abs(order);
}

/**
 * Resolves an {@link Order} to its sort direction.
 *
 * Maps the `"asc"` and `"desc"` shorthands to `+1` and `-1`, and reduces a numeric order to the sign of its
 * precedence: `+1` ascending, `-1` descending, `0` when the order is zero (ignored).
 *
 * @param order The sort order to resolve
 *
 * @returns `+1` for an ascending order, `-1` for a descending order, or `0` when `order` is zero
 *
 * @see {@link getOrderPrecedence} for the precedence magnitude
 */
export function getOrderDirection(order: Order): number {
	return order === "asc" ? 1 : order === "desc" ? -1 : Math.sign(order);
}
