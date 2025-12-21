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
 * Regex source patterns for query grammar.
 *
 * Provides unanchored regex source strings for embedding in Peggy grammars and composite patterns. Derived from
 * {@link IdentifierPattern} to maintain consistency with the core identifier validation rules.
 *
 * @internal
 *
 * @module
 */

import { IdentifierPattern } from "@metreeca/core";


/**
 * Regex source for matching ECMAScript identifiers.
 *
 * Unanchored version of {@link IdentifierPattern} (without `^` and `$` anchors) for embedding in composite patterns.
 *
 * @internal
 */
export const IdentifierSource = IdentifierPattern.source.slice(1, -1); // strip ^ and $

/**
 * Regex source for matching query expressions.
 *
 * Matches the pattern `[transform:]*[path]` where `transform` and `path` steps are identifiers.
 *
 * @internal
 */
export const ExpressionSource = `(${IdentifierSource}:)*(${IdentifierSource}(\\.${IdentifierSource})*)?`;

/**
 * Regex source for matching query bindings.
 *
 * Matches the pattern `name=expression` where `name` is an identifier and `expression` follows
 * {@link ExpressionSource} syntax.
 *
 * @internal
 */
export const BindingSource = `${IdentifierSource}=${ExpressionSource}`;
