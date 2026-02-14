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

/**
 * Client-driven retrieval.
 *
 * Defines types for specifying what data to retrieve in REST/JSON APIs, including property selection, linked
 * resource expansion, and—for collections—filtering, ordering, and pagination:
 *
 * - {@link Model} — Resource projection
 * - {@link Query} — Collection query
 * - {@link ValuesModel} — Property projection specs
 * - {@link ValueModel} — Model value
 * - {@link LocalModel} — Single-valued language-tagged model
 * - {@link LocalsModel} — Multi-valued language-tagged model
 * - {@link Binding} — Named computed expression
 * - {@link Expression} — Computed expression
 * - {@link Options} — Constraint option set
 * - {@link Option} — Constraint option
 *
 * Defines structures for programmatic query key handling:
 *
 * - {@link Criterion} — Query criterion
 * - {@link Operator} — Constraint operator symbols
 *
 * Defines value transformation infrastructure:
 *
 * - {@link Transforms} — Standard transformations registry
 * - {@link Transform} — Value transform
 *
 * # Retrieval Patterns
 *
 * ## Resource Retrieval
 *
 * A {@link Model} specifies which properties to retrieve from a single {@link Resource} and how deeply to
 * expand linked resources. No over-fetching of unwanted fields, no under-fetching requiring additional calls:
 *
 * ```typescript
 * const model: Model = {
 *   id: "",               // resource identifier
 *   name: "",             // string property
 *   price: 0,             // numeric property
 *   available: true,      // boolean property
 *   vendor: {             // nested resource
 *     id: "",
 *     name: ""
 *   }
 * };
 * ```
 *
 * ## Collection Retrieval
 *
 * A {@link Query} extends {@link Model} with filtering, ordering, and pagination criteria for collections.
 * Collection queries are nested inside a managing resource that owns the collection, following REST/JSON best
 * practices. Singleton array projections retrieve filtered, sorted, and paginated results with arbitrarily deep
 * expansions in a single call - no over-fetching, no under-fetching:
 *
 * ```typescript
 * const model: Model = {
 *   items: [{                                 // collection query
 *     id: "",
 *     name: "",
 *     price: 0,
 *     vendor: { id: "", name: "" },           // nested resource
 *     ">=price": 50,                          // price ≥ 50
 *     "<=price": 150,                         // price ≤ 150
 *     "~name": "widget",                      // name contains "widget"
 *     "?category": ["electronics", "home"],   // category in list
 *     "^price": 1,                           // sort by price ascending
 *     "^name": -2,                            // then by name descending
 *     "@": 0,                                 // skip first 0 results
 *     "#": 25                                 // return at most 25 results
 *   }]
 * };
 * ```
 *
 * ## Localized Content
 *
 * For multilingual properties, use {@link TagRange} keys to select language tags to retrieve.
 *
 * Plain string or string array shorthands select language-neutral projections; if specified,
 * the retrieved value should use the same shorthand form:
 *
 * ```typescript
 * const model: Model = {
 *   id: "",
 *   name: "",                             // language-neutral shorthand
 *   title: { "*": "" },                   // all available languages
 *   description: { "en": "", "fr": "" },  // English or French
 *   keywords: { "en": [""], "fr": [""] }  // multi-valued, English or French
 * };
 * ```
 *
 * > [!IMPORTANT]
 * > The `@none` key for non-localised values is not supported; use the `und` tag for language-neutral
 * > values or plain string / string array shorthands, which are equivalent to `{ und: value }` and
 * > select language-neutral projections.
 *
 * ## Computed Properties
 *
 * Models can define computed properties using {@link Expression | expressions} combining property paths
 * with {@link Transforms}.
 *
 * Plain transforms operate on individual values:
 *
 * ```typescript
 * const model: Model = {
 *   id: "",
 *   name: "",
 *   price: 0,
 *   "vendorName=vendor.name": "",       // property path
 *   "releaseYear=year:releaseDate": 0   // transform
 * };
 * ```
 *
 * Aggregate transforms operate on collections:
 *
 * ```typescript
 * const model: Model = {
 *   items: [{
 *     vendor: { id: "", name: "" },    // group by vendor
 *     "items=count:": 0,               // count of items per vendor
 *     "avgPrice=avg:price": 0          // average price per vendor
 *   }]
 * };
 * ```
 *
 * ## Faceted Search
 *
 * Aggregates enable faceted search patterns, computing category counts, value ranges, and totals in a single call:
 *
 * ```typescript
 * // Category facet with product counts
 *
 * const categoryFacet: Model = {
 *   items: [{
 *     "category=sample:category": "",
 *     "count=count:": 0,
 *     "^count": "desc"
 *   }]
 * };
 *
 * // → { items: [
 * //      { category: "Electronics", count: 150 },
 * //      { category: "Home", count: 89 }
 * //    ]}
 *
 * // Price range for slider bounds
 *
 * const priceRange: Model = {
 *   items: [{
 *     "min=min:price": 0,
 *     "max=max:price": 0
 *   }]
 * };
 *
 * // → { items: [{ min: 9.99, max: 1299.00 }] }
 *
 * // Total product count
 *
 * const productCount: Model = {
 *   items: [{
 *     "count=count:": 0
 *   }]
 * };
 *
 * // → { items: [{ count: 284 }] }
 * ```
 *
 * # Model Serialization
 *
 * Multiple formats are supported for transmission as URL query strings in GET requests:
 *
 * | Mode     | Format                                                                     |
 * |----------|----------------------------------------------------------------------------|
 * | `json`   | [Percent-Encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON |
 * | `base64` | [Base64](https://www.rfc-editor.org/rfc/rfc4648#section-4) encoded JSON    |
 * | `form`   | [Form-encoded](#form-serialization)                                        |
 *
 * ## JSON Serialization
 *
 * Directly encodes {@link Model} objects using operator key prefixes.
 *
 * ## Form Serialization
 *
 * > [!WARNING]
 * >
 * > Form serialization specifies only query constraints; servers are expected to convert to a model by wrapping
 * > inside the target endpoint's collection property and providing a default projection.
 *
 * Supports `application/x-www-form-urlencoded` encoding via the `form` mode. The format encodes queries as
 * `label=value` pairs where:
 *
 * - Labels use the same prefixed operator syntax as {@link Query} constraint keys
 * - Each pair carries a single value; repeated labels are merged into arrays where accepted
 * - Postfix aliases provide natural form syntax for some operators:
 *   - `expression=value` for `?expression=value` (disjunctive matching)
 *   - `expression<=value` for `<=expression=value` (less than or equal)
 *   - `expression>=value` for `>=expression=value` (greater than or equal)
 *
 * **Encoding notes:**
 *
 * - Some operator characters are unreserved in RFC 3986 and remain unencoded: `~` (like), `!` (all)
 * - Reserved characters in values are percent-encoded: `&` (separator), `=` (key/value), `+` (space), `%` (escape)
 *
 * ```text
 * category=electronics
 *   &category=home
 *   &~name=widget
 *   &price>=50
 *   &price<=150
 *   &^price=asc
 *   &@=0
 *   &#=25
 * ```
 *
 * This query:
 *
 * 1. Filters items where `category` is "electronics" OR "home"
 * 2. Filters items where `name` contains "widget"
 * 3. Filters items where `price` is between 50 and 150 (inclusive)
 * 4. Sorts results by `price` ascending
 * 5. Returns the first 25 items (offset 0, limit 25)
 *
 * # Model Grammar
 *
 * The following grammar elements are shared by both JSON and Form serialization formats.
 *
 * ## Expressions
 *
 * Criterion keys identify properties or computed values combining an optional result name (forming a
 * {@link Binding}), a pipeline of {@link Transforms}, and a property path ({@link Expression}):
 *
 * ```text
 * expression  = ( name '=' )? transform* path?
 * name        = identifier
 * transform   = identifier ':'
 * path        = identifier ( '.' identifier )*
 * ```
 *
 * - Identifiers follow {@link Identifier} rules (ECMAScript names)
 * - Transforms form a pipeline applied right-to-left (functional composition order)
 * - An empty path computes aggregates over the input collection
 *
 * ```text
 * name                         // simple property
 * user.profile.email           // nested property path
 * total=sum:items.price        // named computed sum
 * round:avg:scores             // pipeline: inner transform applied first
 * count:                       // empty path (aggregate over collection)
 * ```
 *
 * ## Values
 *
 * Values are serialized as [JSON](https://www.rfc-editor.org/rfc/rfc8259) primitives:
 *
 * ```text
 * value       = primitive | localized
 * primitive   = null | boolean | number | string
 * localized   = string '@' tag
 * ```
 *
 * - {@link IRI}s are serialized as strings
 * - Localized strings in {@link Local} or {@link Locals} maps combine a value with a
 *   {@link https://metreeca.github.io/core/types/language.Tag.html language tag} suffix (e.g., `"text"@en`)
 * - The encoder always produces double-quoted strings; the decoder accepts unquoted strings as a shorthand
 *
 * > [!WARNING]
 * >
 * > Numeric-looking values like `123` are parsed as numbers unless quoted.
 *
 * @groupDescription Guards
 * Type guards for runtime validation of query and value types.
 *
 * @groupDescription Codecs
 * Functions for converting between serialized and structured representations.
 *
 * @module
 */

import {
	Identifier,
	isArray,
	isBoolean,
	isIdentifier,
	isLiteral as isLiteralValue,
	isNull,
	isNumber,
	isObject,
	isOptional,
	isString,
	isUnion,
	key
} from "@metreeca/core";
import { assert, error } from "@metreeca/core/error";
import { isTagRange, TagRange } from "@metreeca/core/language";
import { immutable } from "@metreeca/core/nested";
import type { IRI } from "@metreeca/core/resource";
import { internalize, isIRI, resolve } from "@metreeca/core/resource";
import { decodeBase64, encodeBase64 } from "./base64.js";
import { type CodecOpts, defaultBase, Indexed, isCodecOpts, isIndexed } from "./index.js";
import * as QueryParser from "./model.pegjs.js";
import {
	isLiteral,
	isLocal,
	isLocals,
	isReference,
	Literal,
	Local,
	Locals,
	Reference,
	Resource,
	Value,
	Values
} from "./state.js";


/**
 * Standard value transformations for computed {@link Expression | expressions}.
 *
 * Each transform specifies:
 *
 * - `name` — Transform identifier used in {@link Expression | expressions}
 * - `aggregate` — Whether the transform operates on collections (`true`) or individual values (`false`)
 * - `datatype` — Optional result type; the expected type should match the final value of the transform pipe:
 *   - `"boolean"`, `"number"`, `"string"` — Transform produces specific primitive type
 *   - (omitted) — Transform preserves input type
 *
 * @remarks
 *
 * The expression parser accepts any valid identifier as a transform name, not just those defined
 * in this registry; this allows applications to extend the transform set without modifying the parser.
 *
 * @example
 *
 * ```typescript
 * "sum:items.price"      // sum of items.price values
 * "round:avg:scores"     // average of scores, rounded
 * ```
 */
export const Transforms = transforms([

	/**
	 * Count of values in collection.
	 */
	{ name: "count", aggregate: true, datatype: "number" },

	/**
	 * Minimum value in collection.
	 */
	{ name: "min", aggregate: true },

	/**
	 * Maximum value in collection.
	 */
	{ name: "max", aggregate: true },

	/**
	 * Sum of values in collection.
	 */
	{ name: "sum", aggregate: true, datatype: "number" },

	/**
	 * Average of values in collection.
	 */
	{ name: "avg", aggregate: true, datatype: "number" },

	/**
	 * Arbitrary value from collection.
	 */
	{ name: "sample", aggregate: true },


	/**
	 * Absolute value.
	 */
	{ name: "abs", aggregate: false, datatype: "number" },

	/**
	 * Floor to the largest integer less than or equal to value.
	 */
	{ name: "floor", aggregate: false, datatype: "number" },

	/**
	 * Ceiling to the smallest integer greater than or equal to value.
	 */
	{ name: "ceil", aggregate: false, datatype: "number" },

	/**
	 * Round to nearest integer.
	 */
	{ name: "round", aggregate: false, datatype: "number" },


	/**
	 * Extract year component from calendrical values.
	 */
	{ name: "year", aggregate: false, datatype: "number" },

	/**
	 * Extract month component from calendrical values.
	 */
	{ name: "month", aggregate: false, datatype: "number" },

	/**
	 * Extract day component from calendrical values.
	 */
	{ name: "day", aggregate: false, datatype: "number" },

	/**
	 * Extract hours component from calendrical values.
	 */
	{ name: "hours", aggregate: false, datatype: "number" },

	/**
	 * Extract minutes component from calendrical values.
	 */
	{ name: "minutes", aggregate: false, datatype: "number" },

	/**
	 * Extract seconds component from calendrical values.
	 */
	{ name: "seconds", aggregate: false, datatype: "number" }

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resource projection.
 *
 * A property map specifying which properties to retrieve from a {@link Resource}. Each property maps to
 * {@link ValuesModel} describing the expected value type and structure, or {@link Indexed} for union-typed or
 * dynamically-keyed properties. Indexed containers can only appear as top-level property values and cannot be nested.
 *
 * Models may define *computed* properties using the `{name}={expression}` syntax, where the value is computed
 * from an {@link Expression}. Scalar values serve as type placeholders; their actual value is immaterial.
 *
 * > [!WARNING]
 * > Model processors must reject models with an error if they reference undefined properties or provide projections
 * > of mismatched types for defined properties.
 *
 * @see {@link Query} for collection filtering, ordering, and pagination
 */
export type Model =
	| { readonly [property: Identifier | Binding]: ValuesModel | Indexed<ValuesModel> }

/**
 * Collection query.
 *
 * Extends {@link Model} with filtering, ordering, and pagination criteria for collections.
 *
 * > [!WARNING]
 * > Query processors must reject queries with an error if they reference undefined properties or provide projections
 * > or constraints of mismatched types for defined properties.
 *
 * @see {@link Model} for resource projection
 */
export type Query = Model & {

	/**
	 * Less-than filter (`"<expression": value`).
	 *
	 * Includes resources where at least one expression value is less than the literal.
	 */
	readonly [lt: `<${Expression}`]: Literal

	/**
	 * Greater-than filter (`">expression": value`).
	 *
	 * Includes resources where at least one expression value is greater than the literal.
	 */
	readonly [gt: `>${Expression}`]: Literal

	/**
	 * Less-than-or-equal filter (`"<=expression": value`).
	 *
	 * Includes resources where at least one expression value is less than or equal to the literal.
	 */
	readonly [lte: `<=${Expression}`]: Literal

	/**
	 * Greater-than-or-equal filter (`">=expression": value`).
	 *
	 * Includes resources where at least one expression value is greater than or equal to the literal.
	 */
	readonly [gte: `>=${Expression}`]: Literal

	/**
	 * Stemmed word search filter (`"~expression": value`).
	 *
	 * Includes resources where at least one expression value contains all word stems from the search string.
	 * Applicable to both plain string and {@link Local | localised text} properties.
	 *
	 * > [!WARNING]
	 * > When targeting a localised property, the target language must be communicated to the server
	 * > through an application-specific channel (e.g., `Accept-Language` header or request context).
	 */
	readonly [like: `~${Expression}`]: string

	/**
	 * Disjunctive matching filter (`"?expression": value`).
	 *
	 * Includes resources where at least one expression value equals one of the options; `null` matches undefined.
	 */
	readonly [any: `?${Expression}`]: Options

	/**
	 * Conjunctive matching filter (`"!expression": value`).
	 *
	 * Includes resources whose expression values include all specified options; for multi-valued properties.
	 */
	readonly [all: `!${Expression}`]: Options


	/**
	 * Focus ordering (`"*expression": options`).
	 *
	 * Orders results prioritising resources whose expression value appears in the specified {@link Options};
	 * matching resources appear before non-matching ones; overrides regular sorting criteria.
	 */
	readonly [focus: `*${Expression}`]: Options

	/**
	 * Sort ordering (`"^expression": priority`).
	 *
	 * Orders results by expression value; the sign gives direction (positive for ascending, negative for descending);
	 * the absolute value gives 1-based precedence (1 is highest priority); zero is ignored; `"asc"` and `"desc"` are
	 * shorthands for `±1`.
	 *
	 * > [!WARNING]
	 * > When targeting a localised property, the target language must be communicated to the server
	 * > through an application-specific channel (e.g., `Accept-Language` header or request context).
	 */
	readonly [order: `^${Expression}`]: "asc" | "desc" | number


	/**
	 * Pagination offset (`"@": number`).
	 *
	 * Skips the first `number` resources from the filtered and ordered result set; zero is ignored.
	 */
	readonly "@"?: number

	/**
	 * Pagination limit (`"#": number`).
	 *
	 * Returns at most `number` resources from the result set after applying offset; zero is ignored.
	 */
	readonly "#"?: number

};


/**
 * Property projection specs.
 *
 * Defines the expected type and structure for a {@link Model} property, mirroring {@link Values}:
 *
 * - {@link Literal} — Primitive value (`boolean`, `number`, `string`)
 * - {@link Reference} — IRI reference to a linked resource
 * - {@link Model} — Nested projection for expanding linked resources
 * - `string` — Language-neutral single-valued shorthand (see {@link LocalModel})
 * - `{ [TagRange]: string }` — Single-valued language-tagged text map
 * - `readonly [string]` — Language-neutral multi-valued shorthand (see {@link LocalsModel})
 * - `{ [TagRange]: readonly [string] }` — Multi-valued language-tagged text map
 * - `readonly [Literal]` — Array of primitive values
 * - `readonly [Reference]` — Array of IRI references
 * - `readonly [Query]` — Collection projection with filtering, ordering, and pagination
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html RFC 4647 - Matching of Language Tags}
 */
export type ValuesModel =
	| ValueModel
	| LocalModel
	| LocalsModel
	| readonly [Literal]
	| readonly [Reference]
	| readonly [Query]


/**
 * Model value.
 *
 * Represents property values in resource projection models:
 *
 * - {@link Literal}: primitive data placeholder (boolean, number, string)
 * - {@link Reference}: IRI reference placeholder
 * - {@link Model}: nested projection model
 *
 * @see {@link Value} for state values
 */
export type ValueModel =
	| Literal
	| Reference
	| Model

/**
 * Single-valued language-tagged model for internationalised text.
 *
 * Maps language {@link TagRange | tag ranges} to a single localised text placeholder per language.
 *
 * A plain string is accepted as shorthand for a language-neutral projection: `""` is equivalent to `{ und: "" }`.
 * Consumers are responsible for normalising shorthand values to the canonical object form, including shorthand
 * {@link Local} values within {@link Options} constraints.
 *
 * > [!NOTE]
 * > If the model specifies a string shorthand, the retrieved value should use the same shorthand form.
 *
 * The `@none` key for non-localised values is not supported; use the `und` tag or the plain string
 * shorthand for language-neutral values.
 *
 * @see {@link Local} for additional details on language tag semantics
 */
export type LocalModel =
	| string
	| { readonly [range: TagRange]: string };

/**
 * Multi-valued language-tagged model for internationalised text.
 *
 * Maps language {@link TagRange | tag ranges} to multiple localised text placeholders per language.
 *
 * A plain string array is accepted as shorthand for a language-neutral projection: `[""]` is equivalent to `{ und:
 * [""] }`. Consumers are responsible for normalising shorthand values to the canonical object form, including
 * shorthand {@link Locals} values within {@link Options} constraints.
 *
 * > [!NOTE]
 * > If the model specifies a string array shorthand, the retrieved value should use the same shorthand form.
 *
 * The `@none` key for non-localised values is not supported; use the `und` tag or the plain string array
 * shorthand for language-neutral values.
 *
 * @see {@link Locals} for additional details on language tag semantics
 */
export type LocalsModel =
	| readonly [string]
	| { readonly [range: TagRange]: readonly [string] };


/**
 * Named computed expression.
 *
 * Assigns a name to a computed {@link Expression} in {@link Model} projections using the
 * `{name}={expression}` syntax.
 *
 * @example
 *
 * ```typescript
 * const model: Model = {
 *   "vendorName=vendor.name": "",     // path binding
 *   "releaseYear=year:releaseDate": 0 // transform binding
 * };
 * ```
 */
export type Binding =
	`${Identifier}=${Expression}`;

/**
 * Computed expression.
 *
 * Combines value transformations and property access paths to define computed fields
 * in {@link Model} projections and {@link Query} constraints.
 *
 * Expressions use the compact string syntax `[transform:]*[path]` where:
 *
 * - **path** is a dot-separated list of property names (e.g., `order.items.price`);
 *   the empty path refers to the root value; path steps always refer to actual resource property names
 *   and not to projected computed properties defined by {@link Binding bindings}
 * - **transforms** is a sequence of transform names, each followed by a colon (e.g., `round:avg:`)
 *   and applied right-to-left (functional order)
 *
 * Both path steps and transform names follow {@link Identifier} rules (ECMAScript names).
 *
 * > [!WARNING]
 * > This is a type alias for documentation purposes only; expression syntax is validated at runtime
 * > by query processors.
 *
 * > [!WARNING]
 * > Processors are expected to reject expressions with an error if they reference undefined properties or undefined
 * transforms.
 *
 * @remarks
 *
 * Compliant processors are expected to support all standard {@link Transforms}.
 *
 * @example
 *
 * ```text
 * name                    // simple property
 * vendor.name             // nested property path
 * year:releaseDate        // single transform
 * round:avg:scores        // transform pipeline
 * count:                  // aggregate (empty path)
 * ```
 */
export type Expression =
	string;


/**
 * Constraint option set.
 *
 * Specifies the set of values for {@link Query} matching (`?` and `!`) and focus ordering (`*`) operators.
 *
 * > [!NOTE]
 * > Options are inherently multi-valued regardless of the cardinality of the target property: matching and ordering
 * > operators always work against a set of candidate values. Singular forms are accepted as shorthands
 * > for single-element sets.
 *
 * > [!IMPORTANT]
 * > Consumers must accept both {@link Local} and {@link Locals} when filtering or constraining on localised
 * > properties, regardless of the target property's cardinality: codec roundtrips may normalise between the two
 * > forms (see {@link decodeQuery}).
 *
 * - {@link Option} — Shorthand for a single-element option set
 * - {@link Local} — Shorthand for a single-valued language-tagged option set
 * - {@link Locals} — Multi-valued language-tagged option set
 * - `readonly Option[]` — Explicit option set
 */
export type Options =
	| Option
	| Local
	| Locals
	| readonly Option[];

/**
 * Constraint option.
 *
 * Single value for {@link Query} matching (`?` and `!`) and focus ordering (`*`) operators:
 *
 * - `null` — Undefined property value
 * - {@link Literal} — Literal value
 * - {@link Reference} — Resource reference
 */
export type Option =
	| null
	| Literal
	| Reference;


/**
 * Query criterion.
 *
 * Represents a projection, filtering, ordering, or pagination criterion in a {@link Query}.
 * Query keys are encoded string representation of criteria.
 *
 * A unified target suffices as projections and constraints are easily
 * disambiguated after parsing using {@link isIdentifier}.
 *
 * @example
 *
 * ```typescript
 * // Projection: "vendorName=vendor.name"
 * { target: "vendorName", pipe: [], path: ["vendor", "name"] }
 *
 * // Constraint: ">=year:releaseDate"
 * { target: ">=", pipe: ["year"], path: ["releaseDate"] }
 * ```
 *
 * @see {@link encodeCriterion}
 * @see {@link decodeCriterion}
 */
export type Criterion = {

	/**
	 * Property name for projections or constraint {@link Operator}.
	 */
	readonly target: Identifier | Operator;

	/**
	 * Transform pipeline applied to the value, in application order.
	 */
	readonly pipe: readonly Identifier[];

	/**
	 * Property path segments to the target value.
	 */
	readonly path: readonly Identifier[];

}

/**
 * Constraint operator symbols for {@link Query} keys.
 *
 * @see {@link Query} for constraint semantics
 */
export type Operator =
	| "<"
	| ">"
	| "<="
	| ">="
	| "~"
	| "?"
	| "!"
	| "*"
	| "^"
	| "@"
	| "#";

/**
 * Value transform.
 */
export type Transform = {

	/**
	 * Transform name.
	 */
	name: Identifier;

	/**
	 * Whether the transform operates on collections (`true`) or individual values (`false`).
	 */
	aggregate?: boolean;

	/**
	 * Result type of the transform; when omitted, the transform preserves the input type.
	 */
	datatype?: "boolean" | "number" | "string";

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is a {@link Model}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid projection model
 */
export function isModel(value: unknown): value is Model {
	return isObject(value, (v, k) =>
		(isIdentifier(k) || isBinding(k)) && (isValuesModel(v) || isIndexed(v, isValuesModel))
	);
}

/**
 * Checks if a value is a {@link Query}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid query combining projection, filtering, ordering, and pagination
 */
export function isQuery(value: unknown): value is Query {
	return isObject(value, (v, k) => {

		// projection

		if ( (isIdentifier(k) || isBinding(k)) as boolean ) { return isValuesModel(v) || isIndexed(v, isValuesModel); }

		// filtering

		else if ( k.startsWith("<=") || k.startsWith(">=") ) { return isLiteral(v); } else if ( k.startsWith("<") || k.startsWith(">") ) { return isLiteral(v); } else if ( k.startsWith("~") ) { return isString(v); } else if ( k.startsWith("?") || k.startsWith("!") ) { return isOptions(v); }

		// ordering

		else if ( k.startsWith("*") ) { return isOptions(v); } else if ( k.startsWith("^") ) { return isNumber(v) || isLiteralValue(v, ["asc", "desc"]); }

		// paging

		else if ( k === "@" || k === "#" ) { return isNumber(v); } else { return false; }

	});
}


/**
 * Checks if a value is a {@link ValuesModel}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid property projection spec
 */
export function isValuesModel(value: unknown): value is ValuesModel {
	return isUnion(value, [
		isValueModel,
		isLocalModel,
		isLocalsModel,
		v => isArray(v, [isLiteral]),
		v => isArray(v, [isReference]),
		v => isArray(v, [isQuery])
	]);
}

/**
 * Checks if a value is a {@link ValueModel}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a literal, reference, or nested model
 */
export function isValueModel(value: unknown): value is ValueModel {
	return isLiteral(value) || isReference(value) || isModel(value);
}

/**
 * Checks if a value is a {@link LocalModel}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a string or a single-valued language-tagged map
 */
export function isLocalModel(value: unknown): value is LocalModel {
	return isString(value) || isObject(value, (v, k) => isTagRange(k) && isString(v));
}

/**
 * Checks if a value is a {@link LocalsModel}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a singleton string array or a multi-valued language-tagged map
 */
export function isLocalsModel(value: unknown): value is LocalsModel {
	return isArray(value, [isString]) || isObject(value, (v, k) => isTagRange(k) && isArray(v, [isString]));
}


/**
 * Checks if a value is a {@link Binding}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a string matching the `{identifier}={expression}` syntax
 */
export function isBinding(value: unknown): value is Binding {
	return isString(value) && value.includes("=")
		&& isIdentifier(value.slice(0, value.indexOf("=")))
		&& isExpression(value.slice(value.indexOf("=")+1));
}

/**
 * Checks if a value is an {@link Expression}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value matches expression syntax (transform pipeline and property path)
 */
export function isExpression(value: unknown): value is Expression {
	return isString(value) && (() => {

		const segments = value.split(":");
		const path = segments.at(-1) ?? "";

		return segments.slice(0, -1).every(isIdentifier)
			&& (path === "" || path.split(".").every(isIdentifier));

	})();
}


/**
 * Checks if a value is an {@link Options}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is an option, local, locals, or array of options
 */
export function isOptions(value: unknown): value is Options {
	return isUnion(value, [isOption, isLocal, isLocals, v => isArray(v, isOption)]);
}

/**
 * Checks if a value is an {@link Option}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is null, a literal, or a reference
 */
export function isOption(value: unknown): value is Option {
	return isUnion(value, [isNull, isLiteral, isReference]);
}


/**
 * Checks if a value is a {@link Criterion}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid parsed criterion
 */
export function isCriterion(value: unknown): value is Criterion {
	return isObject(value, {
		target: v => isIdentifier(v) || isOperator(v),
		pipe: (v: unknown) => isArray(v, isIdentifier),
		path: (v: unknown) => isArray(v, isIdentifier)
	});
}

/**
 * Checks if a value is an {@link Operator}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid constraint operator symbol
 */
export function isOperator(value: unknown): value is Operator {
	return isLiteralValue(value, ["<", ">", "<=", ">=", "~", "?", "!", "*", "^", "@", "#"]);
}

/**
 * Checks if a value is a {@link Transform}.
 *
 * @group Guards
 *
 * @param value The value to check
 *
 * @returns True if the value is a valid transform definition
 */
export function isTransform(value: unknown): value is Transform {
	return isObject(value, {
		name: isIdentifier,
		aggregate: v => isOptional(v, isBoolean),
		datatype: v => isOptional(v, v => isLiteralValue(v, ["boolean", "number", "string"]))
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a query as a URL-safe string.
 *
 * Serializes a {@link Query} object into a string representation suitable for transmission as a URL query string in
 * GET requests. The output format can be selected based on readability, compactness, and compatibility requirements.
 *
 * If `base` is provided, converts absolute IRIs (matching `isIRI(value, "absolute")`) to root-relative IRIs
 * using {@link internalize}, recursively throughout the query structure. Otherwise, performs plain serialization.
 *
 * @group Codecs
 *
 * @param query The query object to encode
 * @param opts Encoding options
 * @param opts.mode The output format:
 *
 * - `"json"` (default) — [Percent-encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON; human-readable
 *   but verbose; see [JSON Serialization](#json-serialization)
 * - `"base64"` — [Base64-encoded](https://www.rfc-editor.org/rfc/rfc4648#section-4) JSON; compact and URL-safe
 * - `"form"` — [Form-encoded](https://url.spec.whatwg.org/#application/x-www-form-urlencoded) `key=value` pairs;
 *   most compatible with standard tooling; see [Form Serialization](#form-serialization)
 *
 * @returns The encoded query string, with internalized IRIs if `base` is provided
 *
 * @throws {TypeError} If `query` is not a valid {@link Query}, `opts.mode` is not a supported format,
 *   or `opts.base` is not an absolute hierarchical IRI
 *
 * @remarks
 *
 * The `"form"` format always encodes to canonical form:
 *
 * - Operators use prefix notation (e.g., `>=price=100`)
 * - String values are JSON double-quoted (e.g., `name="widget"`)
 * - Numbers, booleans, and `null` remain unquoted (JSON literals)
 * - Sorting criteria are always numeric (e.g., `^price=1`, `^name=-2`)
 *
 * This ensures consistent, predictable output. The decoder accepts both canonical and shorthand forms (e.g., postfix
 * operators like `price>=100`, unquoted strings like `name=widget`).
 *
 * @example
 *
 * ```typescript
 * encodeQuery(
 *   { "~name": "widget", ">=price": 50, "^price": 1, "#": 25 },
 *   { mode: "form" }
 * );
 * // → '~name=%22widget%22&%3E%3Dprice=50&%5Eprice=1&%23=25'
 * ```
 *
 * @see {@link decodeQuery}
 */
export function encodeQuery(
	query: Query,
	opts: CodecOpts & { readonly mode?: "json" | "base64" | "form" } = {}
): string {

	const $query = immutable(query, isQuery);
	const { base = defaultBase, mode = "json" } = assert(opts, isOpts);

	const internalized = internalizeIRIs(base, $query);

	return mode === "json" ? encodeURIComponent(JSON.stringify(internalized))
		: mode === "base64" ? encodeBase64(JSON.stringify(internalized))
			: mode === "form" ? encodeFormQuery(internalized)
				: error(new TypeError(`unsupported mode <${mode}>`));


	function isOpts(value: unknown): value is typeof opts {
		return isCodecOpts(value) && isObject(value, {
			mode: v => isOptional(v, v => isLiteralValue(v, ["json", "base64", "form"])),
			[key]: () => true
		});
	}


	function internalizeIRIs(base: string, q: Query): Query {
		return JSON.parse(JSON.stringify(q), (_key, value) =>
			isIRI(value, "absolute") ? internalize(base, value) : value
		);
	}

	function encodeFormQuery(query: Query): string {

		return Object.entries(query)
			.flatMap(([key, value]) => encodeFormEntry(key, value))
			.join("&");

	}

	function encodeFormEntry(key: string, value: unknown): string[] {

		const encodedKey = encodeURIComponent(key);

		return value === null ? [`${encodedKey}=null`]
			: isArray(value) ? value.flatMap(v => encodeFormEntry(key, v))
				: isObject(value) ? encodeFormDictionary(encodedKey, value as Record<string, unknown>)
					: [`${encodedKey}=${encodeFormValue(value)}`];

	}

	function encodeFormDictionary(encodedKey: string, dict: Record<string, unknown>): string[] {

		// Dictionary (localised content): expand to tagged strings

		return Object.entries(dict).flatMap(([tag, tagValue]) => isArray(tagValue)
			? tagValue.map(v => `${encodedKey}=${encodeFormValue(v)}%40${tag}`)
			: [`${encodedKey}=${encodeFormValue(tagValue)}%40${tag}`]
		);

	}

	function encodeFormValue(value: unknown): string {

		// Strings are double-quoted with inner quotes escaped

		return isString(value)
			? encodeURIComponent(`"${value
				.replace(/\\/g, "\\\\")
				.replace(/"/g, "\\\"")
			}"`)
			: encodeURIComponent(String(value));

	}

}

/**
 * Decodes a query from a URL-safe string.
 *
 * Parses an encoded query string back into a {@link Query} object. The encoding format is auto-detected from the
 * input string structure.
 *
 * If `base` is provided, resolves internal IRIs (matching `isIRI(value, "internal")`) to absolute IRIs
 * using `resolve()`, recursively throughout the query structure. Otherwise, performs plain parsing.
 *
 * @group Codecs
 *
 * @param json The URL-encoded {@link Query} string (JSON, base64, or form format)
 * @param opts Decoding options
 *
 * @returns The decoded query, with resolved IRIs if `base` is provided
 *
 * @throws {TypeError} If `json` is not a string, not a valid {@link Query}, or `opts` is not a valid {@link CodecOpts}
 * @throws {Error} If `json` is malformed or unparseable
 *
 * @remarks
 *
 * For `"form"` format, the decoder accepts both canonical and shorthand forms:
 *
 * - Prefix operators (canonical): `>=price=100`
 * - Postfix operators (shorthand): `price>=100`
 * - Double-quoted strings (canonical): `name="widget"`
 * - Unquoted strings (shorthand): `name=widget`
 *
 * Tagged strings always require the canonical `"value"@tag` format. Tagged values are always reconstructed
 * as {@link Locals} (never {@link Local}), since {@link Options} are inherently multi-valued and `Local`/`Locals`
 * are indistinguishable in form encoding.
 *
 * @example
 *
 * ```typescript
 * // Form format with shorthand operators (auto-detected)
 * decodeQuery("~name=widget&price>=50&^price=1&#=25");
 * // → { "~name": "widget", ">=price": 50, "^price": 1, "#": 25 }
 * ```
 *
 * @see {@link encodeQuery}
 */
export function decodeQuery(json: string, opts: CodecOpts = {}): Query {

	const $json = assert(json, isString);
	const { base = defaultBase } = assert(opts, isCodecOpts);

	try {

		if ( $json === "" ) {

			return immutable({}, isQuery, "malformed query");

		} else if ( $json.startsWith("%7B") || $json.startsWith("{") ) {

			// JSON format (starts with %7B which is encoded '{')

			const query = parseJSON(base, decodeURIComponent($json));

			return immutable(query, isQuery, "malformed query");

		} else if ( /^e[A-Za-z0-9+/_-]*=*$/.test($json) ) {

			// base64 format - JSON objects encode to base64 starting with 'e'

			const query = parseJSON(base, decodeBase64($json));

			return immutable(assert(query, isQuery, "malformed query"));

		} else {

			// form format (application/x-www-form-urlencoded) parsed via Peggy grammar
			// decode keys separately while preserving encoded values for the parser's value handling

			const query = resolveIRIs(base, QueryParser.parse(decodeFormKeys($json), { startRule: "Query" }));

			return immutable(assert(query, isQuery, "malformed query"));

		}

	} catch ( cause ) {
		throw new Error(`invalid query <${$json}>`, { cause });
	}


	function parseJSON(base: string, json: string): Query {
		return JSON.parse(json, (_key, value) =>
			isIRI(value, "internal") ? resolve(base, value) : value
		);
	}

	function resolveIRIs(base: string, parsed: Query): Query {
		return JSON.parse(JSON.stringify(parsed), (_key, value) =>
			isIRI(value, "internal") ? resolve(base, value) : value
		);
	}

	function decodeFormKeys(query: string): string {

		return query.split("&").map(pair => {

			const eqIndex = pair.indexOf("=");

			if ( eqIndex === -1 ) {
				return decodeURIComponent(pair);
			} else {
				const key = pair.slice(0, eqIndex);
				const value = pair.slice(eqIndex+1);
				return decodeURIComponent(key)+"="+value;
			}

		}).join("&");

	}

}


/**
 * Encodes a criterion as a {@link Query} key string.
 *
 * Serializes a parsed {@link Criterion} back into its compact string representation suitable for use as a Model key.
 *
 * @group Codecs
 *
 * @param criterion The criterion to encode
 *
 * @returns The encoded key string
 *
 * @throws TypeGuardError If `criterion` is not a valid {@link Criterion}
 *
 * @example
 *
 * ```typescript
 * encodeCriterion({ target: ">=", pipe: ["year"], path: ["releaseDate"] });
 * // → '>=year:releaseDate'
 * ```
 *
 * @see {@link decodeCriterion}
 */
export function encodeCriterion(criterion: Criterion): string {

	const { target, pipe, path } = immutable(criterion, isCriterion);

	const pipeString = pipe.map(p => `${p}:`).join("");
	const pathString = path.join(".");

	const expression = pipeString+pathString;

	return isIdentifier(target)
		? expression.length > 0 ? `${target}=${expression}` : target
		: `${target}${expression}`;

}

/**
 * Decodes a {@link Query} key string into a criterion.
 *
 * Parses a Model key string into its structural {@link Criterion} components, distinguishing projection keys
 * from constraint keys based on the presence of an {@link Operator} prefix.
 *
 * @group Codecs
 *
 * @param key The query key string to decode
 *
 * @returns The parsed criterion
 *
 * @throws TypeGuardError If `key` is not a string
 * @throws {Error} If `key` is malformed or unparseable
 *
 * @example
 *
 * ```typescript
 * decodeCriterion(">=year:releaseDate");
 * // → { target: ">=", pipe: ["year"], path: ["releaseDate"] }
 * ```
 *
 * @see {@link encodeCriterion}
 */
export function decodeCriterion(key: string): Criterion {

	const $key = assert(key, isString);

	try {

		const criterion = QueryParser.parse($key, { startRule: "Criterion" });

		return immutable(criterion, isCriterion, "malformed criterion");

	} catch ( cause ) {
		throw new Error(`invalid criterion <${key}>`, { cause });
	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a typed transform registry from transform definitions.
 *
 * Validates each transform definition and builds a type-safe record mapping transform names to their definitions.
 * Used internally to construct the {@link Transforms} registry.
 *
 * @internal
 *
 * @typeParam T The tuple type of transform definitions preserving literal name types
 *
 * @param transforms The array of transform definitions to register
 *
 * @returns A record mapping each transform name to its definition
 */
function transforms<const T extends readonly Transform[]>(transforms: T): { readonly [name: Identifier]: Transform; } {

	return immutable(Object.fromEntries(transforms.map(t => [t.name, t])));

}
