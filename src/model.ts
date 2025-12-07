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

/**
 * Client-driven retrieval model.
 *
 * A {@link Model} defines the shape of data clients want to retrieve from an API. Clients specify which properties
 * to include, how deeply to expand linked resources, and what filters to apply. This enables efficient single-call
 * retrieval of exactly the data needed, without over-fetching or under-fetching.
 *
 * **Default Models**
 *
 * Servers may provide default retrieval models to support regular REST/JSON access patterns. When clients don't
 * explicitly provide a model, the server applies its default model, enabling standard REST operations while still
 * supporting client-driven retrieval when needed.
 *
 * @module
 */

import { Identifier } from "../../Core/src/index.js";
import { Dictionary, Value } from "./value.js";

/**
 * Client-provided retrieval model.
 *
 * Specifies which properties to retrieve and how deeply to expand linked resources.
 */
export type Model =
	{
		readonly [property in Identifier]: | Value
		| readonly Value[]
		| Dictionary

	}
