import typia from "typia";
import { Criterion, Option, Query, Transform } from "../query.js";
import { Literal, Local, Locals } from "../state.js";

/**
 * Flattened Query type for Typia validation.
 *
 * Typia doesn't handle Query's intersection (Projection & Filtering & Ordering & Paging) correctly
 * because Projection's index signature (Identifier = string) overlaps all keys, causing Typia to
 * ignore Filtering's Options type. This flattened version makes all value types explicit.
 */
type QueryFlat = {
	readonly "@"?: number;
	readonly "#"?: number;
	readonly [key: string]:
		| Literal | Local | Locals                  // Projection scalars
		| QueryFlat | readonly QueryFlat[]          // Projection nested
		| readonly string[]                         // Reference collection
		| Option | readonly Option[]                // Filtering options
		| number | string                           // Ordering
		| undefined;
};

const assertQueryFlat=typia.createAssertEquals<QueryFlat>();

export const assertCriterion=typia.createAssertEquals<Criterion>();
export const assertQuery=(q: Query): Query => assertQueryFlat(q) as unknown as Query;
export const assertString=typia.createAssertEquals<string>();
export const assertTransform=typia.createAssertEquals<Transform>();
export const assertTransforms=typia.createAssertEquals<readonly Transform[]>();
