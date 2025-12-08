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
 * Model serialization codecs.
 *
 * Provides encoding and decoding functions for {@link Query}, {@link State}, and {@link Patch} objects.
 *
 * The full serialization grammar is detailed in the
 * {@link https://metreeca.github.io/qest/documents/codec.html | Serialization} format specification.
 *
 * @module
 */

import { Patch } from "./patch.js";
import { Query } from "./query.js";
import { State } from "./state.js";

export function encode(query: Query, mode: "query" | "url" | "base64" | "form"): string;
export function encode(state: State, mode: "state"): string;
export function encode(patch: Patch, mode: "patch"): string;

export function encode(
	data: Query | State | Patch,
	mode: "query" | "url" | "base64" | "form" | "state" | "patch"
): string {
	throw new Error("not yet implemented");
}


export function decode(query: string, mode: "query" | Query): Query;
export function decode(state: string, mode: "state"): State;
export function decode(patch: string, mode: "patch"): Patch;

export function decode(
	data: string,
	mode: "query" | "url" | "base64" | Query | "state" | "patch"
): Query | State | Patch {
	throw new Error("not yet implemented");
}
