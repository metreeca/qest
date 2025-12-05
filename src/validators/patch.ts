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

import { isObject } from "@metreeca/core";
import { $field, $property, $values } from "./index.js";


export function $patch(value: object): string {
	return !isObject(value) ? `invalid object type <${typeof value}>` : Object.entries(value)
		.map(([key, value]) =>
			$property(key) || $field(key, value === null ? "" : $values(value))
		)
		.filter(Boolean)
		.join("\n");
}
