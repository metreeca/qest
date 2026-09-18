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
 * Type guards for retrieval model types.
 *
 * Runtime validators for the retrieval model types declared in the `model` module, re-exported through it.
 *
 * @module
 */

import {
	type Guard,
	type Identifier,
	isArray,
	isIdentifier,
	isNull,
	isNumber,
	isObject,
	isOptional,
	isString,
	isUnion as isVariants
} from "@metreeca/core";
import { isTagRange } from "@metreeca/core/language";
import type {
	Atomic,
	Binding,
	Criteria,
	Expression,
	Locale,
	Operator,
	Option,
	Options,
	Order,
	Placeholder,
	Probe,
	Projection,
	Query,
	Template,
	Transform,
	Union
} from "./model.js";
import { isDictionary, isLiteral, isReference } from "./state.core.js";
import type { Dictionary, Literal, Reference } from "./state.js";


/**
 * Matches a {@link Union} branch key: a canonical non-negative integer string with no leading zeros.
 */
const BranchPattern = /^(0|[1-9]\d*)$/;


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
 * @returns True if `value` is a plain object whose keys are all {@link Identifier | identifiers} and whose entries
 * are all valid retrieval nodes, constraints included, or the absent marker `undefined`; false otherwise
 */
export function isTemplate(value: unknown): value is Template {

	return isObject(value, (entry, field) =>
		isIdentifier(field) && isOptional(entry, node => isQuery(node, value=> isVariants(value, [
				isPlaceholder,
				isUnion,
				isProjection
			])))
	);


}

/**
 * Checks if a value is a {@link Projection}.
 *
 * Constraint keys are not admitted among the bindings: they belong to the entry hosting the projection, so a node
 * carrying both is validated through {@link isQuery} instead.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose keys are all {@link Binding | bindings} with unique result names
 * and whose cells are all valid single-value placeholders or the absent marker `undefined`; false otherwise
 */
export function isProjection(value: unknown): value is Projection {

	return isObject(value, (cell, field) =>
		isBinding(field) && isOptional(cell, placeholder => isVariants(placeholder, [isPlaceholder, isUnion]))
	) && unique(Object.keys(value).map(binding =>
		binding.slice(0, binding.indexOf("="))
	));


	function unique(names: readonly string[]): boolean {
		return new Set(names).size === names.length;
	}

}


/**
 * Checks if a value is a {@link Placeholder}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a nested {@link Template}, an {@link Atomic} value template, or a {@link Locale}
 * tag-range map; false otherwise
 */
export function isPlaceholder(value: unknown): value is Placeholder {
	return isVariants(value, [
		isTemplate,
		isAtomic,
		isLocale
	]);
}

/**
 * Checks if a value is an {@link Atomic}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object carrying no entries; false otherwise
 */
export function isAtomic(value: unknown): value is Atomic {
	return isObject(value, {});
}

/**
 * Checks if a value is a {@link Locale} template.
 *
 * A locale map is filtered by its own tag ranges and carries no {@link Criteria}: matching by localised text attaches
 * at the enclosing collection through an {@link Expression}, not on the map.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose keys are all RFC 4647 basic language ranges and whose entries are
 * all {@link Atomic} value templates or the absent marker `undefined`; false otherwise
 */
export function isLocale(value: unknown): value is Locale {
	return isObject(value, (leaf, range) => isTagRange(range) && isOptional(leaf, isAtomic));
}


/**
 * Checks if a value is a {@link Union}.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose keys are all canonical non-negative integer strings and whose
 * branches are all valid {@link Placeholder | placeholders} or the absent marker `undefined`; false otherwise
 */
export function isUnion(value: unknown): value is Union<Placeholder> {
	return isObject(value, (placeholder, branch) =>
		BranchPattern.test(branch) && isOptional(placeholder, isPlaceholder)
	);
}


/**
 * Checks if a value is a {@link Query} over a given retrieval form.
 *
 * Holds the node's two halves to their own contracts, so a node is accepted whether it carries retrieval keys,
 * constraint keys, or both.
 *
 * @typeParam T The retrieval form the constraints are merged into
 *
 * @param value The value to check
 * @param is The guard the node's retrieval half must satisfy
 *
 * @returns True if `value` is a plain object whose {@link isCriterion | constraint entries} are all valid and whose
 * remaining entries satisfy `is`; false otherwise
 */
export function isQuery<T>(value: unknown, is: Guard<T>): value is Query<T> {

	return isObject(value, (entry, key) => !isSelector(key) || isCriterion(entry, key))
		&& is(Object.fromEntries(Object.entries(value).filter(([key]) => !isSelector(key))));


}

/**
 * Checks if a value is a {@link Criteria}.
 *
 * Criteria entries combine filtering (`<`, `>`, `<=`, `>=`, `~`, `?`, `!`), sort focus and order (`+`, `^`), and
 * pagination (`@`, `#`) keys, each mapping to an operator-appropriate scalar or options set.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a plain object whose every entry is a valid {@link Criteria} constraint slot; false
 * otherwise
 */
export function isCriteria(value: unknown): value is Criteria {
	return isObject(value, isCriterion);
}

/**
 * Checks if an entry is a valid {@link Criteria} constraint.
 *
 * Holds a single constraint to its operator's contract, pairing the key's prefix with the value type that operator
 * accepts. Reach for it to validate constraints one at a time, as a form decoder collecting `label=value` pairs does,
 * rather than a whole map through {@link isCriteria}.
 *
 * @param value The entry value to check
 * @param key The entry key to check
 *
 * @returns True if `key` is a {@link isSelector | constraint key} and `value` is of the type its operator
 * accepts; false otherwise
 */
export function isCriterion(value: unknown, key: string): boolean {

	if ( key.startsWith("<=") || key.startsWith(">=") ) {

		return isExpression(key.slice(2)) && isLiteral(value);

	} else if ( key.startsWith("<") || key.startsWith(">") ) {

		return isExpression(key.slice(1)) && isLiteral(value);

	} else if ( key.startsWith("~") ) {

		return isExpression(key.slice(1)) && isString(value);

	} else if ( key.startsWith("?") || key.startsWith("!") || key.startsWith("+") ) {

		return isExpression(key.slice(1)) && isOptions(value);

	} else if ( key.startsWith("^") ) {

		return isExpression(key.slice(1)) && isOrder(value);

	} else if ( key === "@" || key === "#" ) {

		return isNumber(value) && Number.isInteger(value) && value >= 0;

	} else {

		return false;

	}

}

/**
 * Checks if a value is a {@link Criteria} constraint key.
 *
 * Classifies a key without looking at its value, which is what splitting a node into its retrieval and constraint
 * halves takes; {@link isCriterion} holds the whole entry to its operator's contract instead.
 *
 * @param value The value to check
 *
 * @returns True if `value` is a string composed of a {@link Criteria} operator prefix (`<`, `>`, `<=`, `>=`,
 * `~`, `?`, `!`, `+`, `^`) followed by a valid {@link Expression}, or exactly `"@"` or `"#"`; false otherwise
 */
export function isSelector(value: unknown): value is keyof Criteria {

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
 * @returns True if `value` is a single {@link Option}, a {@link Dictionary} of localised options, or an array of
 * {@link Option} elements; false otherwise
 */
export function isOptions(value: unknown): value is Options {
	return isVariants(value, [
		isOption,
		isDictionary,
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
		pipe: v => isArray(v, isTransform),
		path: v => isArray(v, isIdentifier)
	});
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
 * Checks if a value is an aggregate {@link Transform}.
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
 */
export function getOrderDirection(order: Order): number {
	return order === "asc" ? 1 : order === "desc" ? -1 : Math.sign(order);
}
