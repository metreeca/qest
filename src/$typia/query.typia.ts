import typia from "typia";
import { Criterion, Query, Transform } from "../query.js";


/**
 * Helper type for Typia validation that explicitly represents all valid Query value types.
 *
 * The original Query type uses complex intersection of Projection, Filtering, Ordering, and Paging
 * with template literal index signatures. Typia doesn't correctly handle intersections where
 * index signature key patterns overlap (since Identifier = string matches all keys).
 *
 * This helper type flattens the union of all possible value types into a single index signature
 * that Typia can validate correctly.
 */
type QueryHelper = {

	// Paging: explicit keys
	readonly "@"?: number;
	readonly "#"?: number;

	// All other keys: union of all possible value types
	readonly [key: string]:
		// From Projection
		| boolean | number | string                           // Literal
		| { readonly [tag: string]: string }                  // Local
		| { readonly [tag: string]: readonly string[] }       // Locals
		| readonly QueryHelper[]                              // Query collection (any length, not 1-tuple)
		| readonly string[]                                   // Reference collection (any length, not 1-tuple)
		| QueryHelper                                         // Nested Query
		// From Filtering Options
		| null                                                // Option null
		| readonly (null | boolean | number | string)[]       // Option array
		| undefined;

};

const assertQueryHelper=typia.createAssertEquals<QueryHelper>();

export const assertCriterion=typia.createAssertEquals<Criterion>();
export const assertQuery=(query: Query): Query => assertQueryHelper(query) as unknown as Query;
export const assertString=typia.createAssertEquals<string>();
export const assertTransform=typia.createAssertEquals<Transform>();
export const assertTransforms=typia.createAssertEquals<readonly Transform[]>();
