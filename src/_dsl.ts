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

import { immutable } from "@metreeca/core/structures";
import type { Literal } from "./resource.js";
import { isSelection } from "./template.core.js";
import type { Expression, Options, Order, Selection } from "./template.js";


/**
 * Key/value entry of an object type.
 *
 * Pairs each key of `T` with the type of the value stored under it, so a value of this type is well-formed only if the
 * key and the value agree.
 *
 * Elements are correlated on construction only: destructuring an entry yields the full key union and the full value
 * union, since TypeScript doesn't correlate tuple elements on read.
 */
export type Entry<T> = { [K in keyof T]-?: readonly [K, Required<T>[K]] }[keyof T]


/**
 * Selection criterion.
 *
 * Single filtering, ordering or pagination criterion of a {@link Selection}, paired with the value it is defined by.
 * Criteria are created by the constructors in this module and assembled into a {@link Selection} by {@link where}.
 */
export type Criterion = Entry<Selection>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a selection.
 *
 * Assembles independent {@link Criterion | criteria} into a {@link Selection} to be submitted to a query processor.
 * Criteria are conjunctive: a resource is included only if it satisfies every filtering criterion.
 *
 * @param criteria The criteria the selection is composed of; where two criteria share the same key, the last one
 * prevails
 *
 * @returns A deeply immutable selection asserting `criteria`; with no criteria, an empty selection matching
 * every resource in its natural order
 *
 * @throws {@link !TypeError TypeError} If `criteria` don't make up a well-formed {@link Selection}, for instance
 * where an expression is malformed or a paging bound is negative or fractional
 */
export function where(...criteria: readonly Criterion[]): Selection {
	return immutable(Object.fromEntries(criteria), isSelection);
}


/**
 * Creates a less-than criterion.
 *
 * Retains resources where at least one value of `expression` is strictly less than `bound`.
 *
 * @param expression The expression the criterion is applied to
 * @param bound The exclusive upper bound
 *
 * @returns A criterion asserting `expression < bound`
 *
 * @see {@link Selection} for applicability and comparison rules
 */
export function lt(expression: Expression, bound: Literal): Criterion {
	return [ `<${expression}`, bound ];
}

/**
 * Creates a greater-than criterion.
 *
 * Retains resources where at least one value of `expression` is strictly greater than `bound`.
 *
 * @param expression The expression the criterion is applied to
 * @param bound The exclusive lower bound
 *
 * @returns A criterion asserting `expression > bound`
 *
 * @see {@link Selection} for applicability and comparison rules
 */
export function gt(expression: Expression, bound: Literal): Criterion {
	return [ `>${expression}`, bound ];
}

/**
 * Creates a less-than-or-equal criterion.
 *
 * Retains resources where at least one value of `expression` is less than or equal to `bound`.
 *
 * @param expression The expression the criterion is applied to
 * @param bound The inclusive upper bound
 *
 * @returns A criterion asserting `expression <= bound`
 *
 * @see {@link Selection} for applicability and comparison rules
 */
export function lte(expression: Expression, bound: Literal): Criterion {
	return [ `<=${expression}`, bound ];
}

/**
 * Creates a greater-than-or-equal criterion.
 *
 * Retains resources where at least one value of `expression` is greater than or equal to `bound`.
 *
 * @param expression The expression the criterion is applied to
 * @param bound The inclusive lower bound
 *
 * @returns A criterion asserting `expression >= bound`
 *
 * @see {@link Selection} for applicability and comparison rules
 */
export function gte(expression: Expression, bound: Literal): Criterion {
	return [ `>=${expression}`, bound ];
}


/**
 * Creates a text search criterion.
 *
 * Retains resources where at least one value of `expression` contains every whitespace-separated token of `keywords`
 * as a case-insensitive substring, in any order.
 *
 * @param expression The expression the criterion is applied to
 * @param keywords The whitespace-separated search tokens
 *
 * @returns A criterion asserting that `expression` matches `keywords`
 *
 * @see {@link Selection} for applicability and matching rules
 */
export function like(expression: Expression, keywords: string): Criterion {
	return [ `~${expression}`, keywords ];
}


/**
 * Creates a disjunctive matching criterion.
 *
 * Retains resources where at least one value of `expression` equals one of `options`.
 *
 * @param expression The expression the criterion is applied to
 * @param options The alternative values; an empty set imposes no constraint
 *
 * @returns A criterion asserting that `expression` matches one of `options`
 *
 * @see {@link Selection} for applicability and matching rules
 */
export function any(expression: Expression, options: Options): Criterion {
	return [ `?${expression}`, options ];
}

/**
 * Creates a conjunctive matching criterion.
 *
 * Retains resources whose `expression` values include every one of `options`.
 *
 * @param expression The expression the criterion is applied to
 * @param options The required values; an empty set imposes no constraint
 *
 * @returns A criterion asserting that `expression` matches all `options`
 *
 * @see {@link Selection} for applicability and matching rules
 */
export function all(expression: Expression, options: Options): Criterion {
	return [ `!${expression}`, options ];
}


/**
 * Creates a sort focus criterion.
 *
 * Ranks resources whose `expression` value is one of `options` before the rest, taking precedence over the
 * {@link order} criteria applied within each group.
 *
 * @param expression The expression the criterion is applied to
 * @param options The values to be ranked first; an empty set imposes no focus
 *
 * @returns A criterion prioritising resources whose `expression` matches one of `options`
 *
 * @see {@link Selection} for applicability and ordering rules
 */
export function focus(expression: Expression, options: Options): Criterion {
	return [ `+${expression}`, options ];
}

/**
 * Creates a sort order criterion.
 *
 * Orders results by the value of `expression`.
 *
 * @param expression The expression the criterion is applied to
 * @param criterion The sort direction and its precedence among multiple sort keys
 *
 * @returns A criterion sorting results by `expression` according to `criterion`
 *
 * @see {@link Selection} for applicability and ordering rules
 */
export function order(expression: Expression, criterion: Order = "asc"): Criterion {
	return [ `^${expression}`, criterion ];
}


/**
 * Creates a pagination offset criterion.
 *
 * Skips the first `count` resources of the filtered and ordered result set.
 *
 * @param count The number of resources to be skipped; zero imposes no offset
 *
 * @returns A criterion offsetting results by `count`
 */
export function offset(count: number): Criterion {
	return [ "@", count ];
}

/**
 * Creates a pagination limit criterion.
 *
 * Retains at most `count` resources of the offset result set.
 *
 * @param count The maximum number of resources to be returned; zero imposes no limit
 *
 * @returns A criterion limiting results to `count`
 */
export function limit(count: number): Criterion {
	return [ "#", count ];
}
