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

import { isArray, isObject, isString } from "@metreeca/core";
import { Expression } from "../query.js";
import { $property } from "./index.js";


export function $expression(value: Expression): string {
	return !isObject(value) ? `invalid object type <${typeof value}>`
		: !isArray(value.pipe) ? `pipe: must be an array`
			: !isArray(value.path) ? `path: must be an array`
				: value.name !== undefined && $property(value.name) ? `name: ${$property(value.name)}`
					: value.pipe.some(item => $property(item)) ? `pipe: ${value.pipe.map($property).find(Boolean)}`
						: value.path.some(item => !isString(item)) ? `path: must contain only strings`
							: "";
}
