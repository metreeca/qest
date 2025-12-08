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
 * Defines the shape of data clients want to retrieve from an API. Clients specify which properties to include,
 * how deeply to expand linked resources, and what filters to apply. This enables efficient single-call retrieval
 * of exactly the data needed, without over or under-fetching.
 *
 * **Important:** Servers may provide default retrieval models to support regular REST/JSON access patterns.
 * When clients don't explicitly provide a model, the server applies its default model, enabling standard
 * REST operations while still supporting client-driven retrieval when needed.
 *
 * **Resource Models**
 *
 * A {@link Model} specifies which properties to retrieve from a single {@link Resource}. Properties map to
 * {@link Projection} values that define the expected shape and type:
 *
 * ```typescript
 * const model: Model = {
 *   id: "",               // resource identifier
 *   name: "",             // string property
 *   price: 0,             // numeric property
 *   available: true,      // boolean property
 *   publisher: {          // nested resource
 *     id: "",
 *     name: ""
 *   }
 * };
 * ```
 *
 * **Collection Queries**
 *
 * A {@link Query} extends resource models with filtering, ordering, and pagination for resource collections:
 *
 * ```typescript
 * const query: Query = {
 *
 *   // projections
 *
 *   id: "",
 *   name: "",
 *   price: 0,
 *
 *   // filtering
 *
 *   ">=price": 10,                        // price ≥ 10
 *   "<=price": 100,                       // price ≤ 100
 *   "~name": "widget",                    // name contains "widget"
 *   "?category": ["electronics", "home"], // category in list
 *
 *   // ordering
 *
 *   "^price": "asc",                      // sort by price ascending
 *   "^name": -2,                          // then by name descending
 *
 *   // pagination
 *
 *   "@": 0,                               // skip first 0 results
 *   "#": 25                               // return at most 25 results
 *
 * };
 * ```
 *
 * **Localized Content**
 *
 * For multilingual properties, use {@link Range} keys to select language tags to retrieve:
 *
 * ```typescript
 * const model: Model = {
 *   id: "",
 *   name: { "*": "" },                   // all available languages
 *   description: { "en": "", "fr": "" }, // English or French
 *   keywords: { "en": [""], "fr": [""] } // multi-valued, English or French
 * };
 * ```
 *
 * **Nested Collections**
 *
 * Use singleton array projections to retrieve nested resource collections with their own filtering criteria:
 *
 * ```typescript
 * const model: Model = {
 *   id: "",
 *   name: "",
 *   items: [{          // nested collection
 *     id: "",
 *     name: "",
 *     price: 0,
 *     "^price": "asc", // order items by price
 *     "#": 10          // limit to 10 items
 *   }]
 * };
 * ```
 *
 * **Virtual Properties**
 *
 * Queries can define computed properties using {@link Expression | expressions} with {@link Transforms}:
 *
 * ```typescript
 * const query: Query = {
 *   id: "",
 *   name: "",
 *   "total=sum:items.price": 0,       // computed sum
 *   "avgRating=round:avg:ratings": 0, // computed average, rounded
 *   "itemCount=count:items": 0        // computed count
 * };
 * ```
 *
 * **Faceted Search**
 *
 * Queries support common patterns for faceted search interfaces. These minimal sketches illustrate basic
 * usage; real-world facet analytics can combine filtering, grouping, and aggregation for richer and coordinated
 * results:
 *
 * ```typescript
 * // Multi-value facet with counts
 *
 * const categoriesFacet: Query = {
 *   "category=sample:categories": "",
 *   "products=count:": 0,
 *   "^products:": "desc"
 * };
 *
 * // → [{ category: "Electronics", products: 150 },
 * //    { category: "Clothing", products: 89 },
 * //    { category: "Home", products: 45 }]
 *
 * // Numeric range for slider bounds
 *
 * const priceFacet: Query = {
 *   "min=min:price": 0,
 *   "max=max:price": 0
 * };
 *
 * // → { min: 9.99, max: 1299.00 }
 *
 * // Total matching items
 *
 * const productCount: Query = {
 *   "products=count:": 0
 * };
 *
 * // → { products: 284 }
 * ```
 *
 * @module
 */

import { Identifier, isIdentifier } from "@metreeca/core";
import { isBoolean } from "@metreeca/core/json";
import { IRI, Range } from "@metreeca/core/network";
import { Dictionary, Literal, Resource } from "./index.js";


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

	/** Count of values in collection */
	{ name: "count", aggregate: true, datatype: "number" },

	/** Minimum value in collection */
	{ name: "min", aggregate: true },

	/** Maximum value in collection */
	{ name: "max", aggregate: true },

	/** Sum of values in collection */
	{ name: "sum", aggregate: true, datatype: "number" },

	/** Average of values in collection */
	{ name: "avg", aggregate: true, datatype: "number" },

	/** Arbitrary value from collection */
	{ name: "sample", aggregate: true },


	/** Absolute value */
	{ name: "abs", aggregate: false, datatype: "number" },

	/** Floor to largest integer less than or equal to value */
	{ name: "floor", aggregate: false, datatype: "number" },

	/** Ceiling to smallest integer greater than or equal to value */
	{ name: "ceil", aggregate: false, datatype: "number" },

	/** Round to nearest integer */
	{ name: "round", aggregate: false, datatype: "number" },


	/** Extract year component from calendrical values */
	{ name: "year", aggregate: false, datatype: "number" },

	/** Extract month component from calendrical values */
	{ name: "month", aggregate: false, datatype: "number" },

	/** Extract day component from calendrical values */
	{ name: "day", aggregate: false, datatype: "number" }

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resource retrieval model.
 *
 * Defines the shape and content of a {@link Resource} object to be retrieved. Relevant properties
 * are mapped to {@link Projection} values specifying what to retrieve:
 *
 * - {@link Literal} — Plain literal
 * - {@link Model} — Nested resource
 * - `{ readonly [range: Range]: string }` — Single-valued {@link Dictionary}; {@link Range} key selects
 *   language tags to retrieve; `string` is a placeholder
 * - `{ readonly [range: Range]: [string] }` — Multi-valued {@link Dictionary}; {@link Range} key selects
 *   language tags to retrieve; array marks multi-valued
 * - `readonly [Query]` — Nested resource collection; singleton {@link Query} element provides filtering,
 *   ordering, and paginating criteria for members
 * - `[]` — Nothing (ignored during processing)
 *
 * Scalar values in projections serve as type placeholders; their actual value is immaterial, but
 * their type must match the property definition.
 *
 * This model enables efficient single-call retrieval of exactly the data needed, without over or
 * under-fetching.
 *
 * **Important:** The model is rejected with an error if it references undefined properties or if it
 * provides a projection of a mismatched type for a defined property.
 */
export type Model = {

	readonly [property: Identifier]: Projection

};

/**
 * Resource collection retrieval model.
 *
 * Extends resource retrieval {@link Model} with constraints for filtering, ordering, and paginating resource
 * collections, combining multiple elements:
 *
 * - {@link Projection} values mapping resource properties to projection models; unlike resource models,
 *   queries may define *virtual* properties, whose value is computed from an {@link Expression}; in this case,
 *   the projection defines the expected type of the computed value
 * - Filtering and ordering constraints selecting the collection subset to retrieve; each constraint is applied
 *   to the value computed by an {@link Expression} from a candidate member resource
 * - Pagination constraints applied to the filtered and ordered result set
 *
 * Scalar values in projections serve as type placeholders; their actual value is immaterial, but their type must match
 * the (possibly computed) property definition.
 *
 * **Important:** The query is rejected with an error if it references undefined properties or if it
 * provides projections or constraints of mismatched types for defined properties.
 *
 * The following constraints are supported:
 *
 * - **less than** — `"<expression": Literal`
 *
 *   Includes resources where at least one expression value is less than the literal.
 *
 * - **less than or equal** — `"<=expression": Literal`
 *
 *   Includes resources where at least one expression value is less than or equal to the literal.
 *
 * - **greater than** — `">expression": Literal`
 *
 *   Includes resources where at least one expression value is greater than the literal.
 *
 * - **greater than or equal** — `">=expression": Literal`
 *
 *   Includes resources where at least one expression value is greater than or equal to the literal.
 *
 * - **stemmed word search** — `"~expression": string`
 *
 *   Includes resources where at least one expression value contains all word stems from the search string,
 *   in the given order.
 *
 * - **disjunctive matching** — `"?expression": Options`
 *
 *   Includes resources where at least one expression value equals at least one of the specified {@link Options};
 *   applies to both single and multi-valued properties; `null` matches resources where the property is undefined.
 *
 * - **conjunctive matching** — `"!expression": Options`
 *
 *   Includes resources whose expression values include all specified {@link Options};
 *   applies to multi-valued properties.
 *
 * - **focus ordering** — `"$expression": Options`
 *
 *   Orders results prioritizing resources whose expression value appears in the specified {@link Options};
 *   matching resources appear before non-matching ones; overrides regular sorting criteria.
 *
 * - **sort ordering** — `"^expression": number`
 *
 *   Orders results by expression value; the sign of the priority gives ordering direction (positive for ascending,
 *   negative for descending); the absolute value gives 1-based ordering precedence (higher values sorted first);
 *   zero is ignored; `"asc"`/`"ascending"` and `"desc"`/`"descending"` are shorthands for `±1`.
 *
 * - **offset** — `"@": number`
 *
 *   Skips the first `number` resources from the filtered and ordered result set.
 *
 * - **limit** — `"#": number`
 *
 *   Returns at most `number` resources from the result set after applying offset.
 */
export type Query = Partial<{

	readonly [property: Identifier | `${Identifier}=${Expression}`]: Projection

	readonly [lt: `<${Expression}`]: Literal
	readonly [gt: `>${Expression}`]: Literal

	readonly [lte: `<=${Expression}`]: Literal
	readonly [gte: `>=${Expression}`]: Literal

	readonly [like: `~${Expression}`]: string

	readonly [any: `?${Expression}`]: Options
	readonly [all: `!${Expression}`]: Options

	readonly [focus: `$${Expression}`]: Options
	readonly [order: `^${Expression}`]: "asc" | "desc" | "ascending" | "descending" | number

	readonly "@": number
	readonly "#": number

}>;

/**
 * Property value specification for retrieval models.
 *
 * Defines the shape and type of property values in {@link Model} and {@link Query} objects:
 *
 * - {@link Literal} — Plain literal
 * - {@link Model} — Nested resource
 * - `{ readonly [range: Range]: string }` — Single-valued {@link Dictionary}; {@link Range} keys select
 *   matching language tags to retrieve; `string` is an immaterial scalar placeholder
 * - `{ readonly [range: Range]: [string] }` — Multi-valued {@link Dictionary}; {@link Range} keys select
 *   matching language tags to retrieve; `[string]` is an immaterial array placeholder
 * - `readonly [Query]` — Nested resource collection; singleton {@link Query} element provides model for retrieved
 * resources and filtering, ordering, and paginating criteria
 *
 * @see [RFC 4647 - Matching of Language Tags](https://www.rfc-editor.org/rfc/rfc4647.html)
 */
export type Projection =
	| Literal
	| Model
	| { readonly [range: Range]: string }
	| { readonly [range: Range]: [string] }
	| readonly [Query];

/**
 * Computed expression for deriving values from resource properties.
 *
 * Expressions combine value transformations and property access paths to define computed fields
 * in {@link Query} projections and constraints.
 *
 * Expressions use the compact string syntax `[transform:]*[path]` where:
 *
 * - **path** is a dot-separated list of property names (e.g., `order.items.price`);
 *   the empty path refers to the root value
 * - **transforms** is a sequence of transform names, each followed by a colon (e.g., `round:avg:`)
 *   and applied right-to-left (functional order)
 *
 * Both path steps and transform names are
 * {@link https://262.ecma-international.org/15.0/#sec-names-and-keywords | ECMAScript identifiers}.
 *
 * **Important:** Expressions are rejected with an error if they reference undefined properties
 * or undefined transforms.
 *
 * @remarks
 *
 * Compliant processors support all standard {@link Transforms}.
 */
export type Expression =
	string & { readonly __brand: unique symbol };

/**
 * Option values for {@link Query} matching and ordering operators.
 *
 * Represents possible values for query matching (`?` and `!` operators) and focus ordering (`$` operator):
 *
 * - {@link Option} — Single option value
 * - {@link Dictionary} — Language-tagged option values
 * - `readonly Option[]` — Array of option values
 */
export type Options =
	| Option
	| Dictionary
	| readonly Option[];

/**
 * Single option value for {@link Query} matching and ordering operators.
 *
 * Represents a single value for query matching (`?` and `!` operators) and focus ordering (`$` operator):
 *
 * - `null` — Undefined property value
 * - {@link Literal} — Literal value
 * - {@link IRI} — Resource reference
 */
export type Option =
	| null
	| Literal
	| IRI;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function transforms<const T extends readonly {

	/** Transform name */
	name: string,

	/** Whether the transform operates on collections (`true`) or individual values (`false`) */
	aggregate?: boolean,

	/** Result type of the transform; when omitted, the transform preserves the input type */
	datatype?: "boolean" | "number" | "string"

}[]>(transforms: T): Record<T[number]["name"], T[number]> {

	return Object.fromEntries(transforms.map(t => {

		if ( !isIdentifier(t.name) ) {
			throw new TypeError(`invalid transform name <${t.name}>`);
		}

		if ( t.aggregate !== undefined && isBoolean(t.aggregate) ) {
			throw new TypeError(`invalid transform aggregate <${t.aggregate}>`);
		}

		if ( t.datatype !== undefined && !["boolean", "number", "string"].includes(t.datatype) ) {
			throw new TypeError(`invalid transform datatype <${t.datatype}>`);
		}

		return [t.name, {
			name: t.name,
			aggregate: t.aggregate,
			datatype: t.datatype
		}];

	})) as unknown as Record<T[number]["name"], T[number]>;

}
