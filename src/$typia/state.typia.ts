import typia from "typia";
import { Patch, Resource } from "../state.js";

export const assertPatch=typia.createAssertEquals<Patch>();
export const assertResource=typia.createAssertEquals<Resource>();
export const assertString=typia.createAssertEquals<string>();
