import typia from "typia";
import { Criterion, Query, Transform } from "../query.js";

export const assertCriterion=typia.createAssertEquals<Criterion>();
export const assertQuery=typia.createAssertEquals<Query>();
export const assertString=typia.createAssertEquals<string>();
export const assertTransform=typia.createAssertEquals<Transform>();
export const assertTransforms=typia.createAssertEquals<readonly Transform[]>();
