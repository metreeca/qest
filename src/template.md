---
title: Template Design
summary: Cross-backend semantics for template query operations
description: |
  Documents the design rationale and cross-backend comparison for property path
  resolution, transform pipe composition, type coercion, collation, and prefix
  word search semantics across XPath 2.0, SPARQL 1.1, SQL:2011, and GQL:2024/openCypher.
---

# Design Rationale

The data model defined by **@metreeca/qest** is grounded in
[JSON-LD 1.1](https://www.w3.org/TR/json-ld11/), which together with
[SPARQL 1.1](https://www.w3.org/TR/sparql11-query/) references
[XSD 1.0](https://www.w3.org/TR/xmlschema-2/) / [XPath 2.0](https://www.w3.org/TR/xpath-functions/)
for its type system and operator semantics: transform semantics follow the same foundation.

However, a critical requirement is that model bindings must be implementable across a wide range of storage backends.
Both the supported set of operators and its semantics are therefore restricted to the intersection of well-defined
counterparts across
[XPath 2.0](https://www.w3.org/TR/xpath-functions/),
[SPARQL 1.1](https://www.w3.org/TR/sparql11-query/),
[SQL:2011](https://www.iso.org/standard/53681.html),
and [GQL:2024](https://www.iso.org/standard/76120.html) / [openCypher](https://opencypher.org/).

# Adopted Semantics

The following operational rules define the normalised behaviour of **bindings** (named property-path projections in a
query) in the JSON output, regardless of the underlying storage backend.

Properties are classified along two independent axes:

- **Single-valued** vs **multi-valued**: a single-valued property holds at most one value (for example, `name`); a
	multi-valued property holds a set of values (for example, `items`)
- **Plain** vs **union**: a plain property has a fixed type; a union property spans branches of a union type, where
	different branches may or may not carry a given property. Cardinality is defined for the property as a whole, not
	independently per branch

## Property Paths

- **No property / no value**: if any step in a property path references an unknown property, or if the property exists
	but carries no value, the entire path resolves to `undefined`; both cases produce the same result. This lenient
	behaviour is consistent with union handling, where non-matching branches are silently skipped; strict error semantics
	for unknown properties would make union traversal significantly more complex, as each branch would need explicit
	property-existence checks before resolution
- **Single-valued**: resolve to a single value or `undefined`
- **Multi-valued**: resolve to a possibly empty JSON array of values; the system does not guarantee ordering, even for
	backends that natively preserve it (for example, XPath document order)
- **Multi-valued intermediate steps**: if an intermediate step in a path is multi-valued, the remaining steps apply to
	each element independently and the results collect into a single flat array (no nesting); if any individual traversal
	produces `undefined`, that element is omitted from the result
- **Union**: for single-valued properties, the result is the value from the matching branch or `undefined`; for
	multi-valued properties, the result is the union of values across all branches as a possibly empty array. Union
	traversal is purely a shape-level operation: cardinality is defined on the range that wraps the union as a whole, not
	independently per branch; branches that lack a property are skipped and do not contribute to the result
- **Path cardinality**: the effective cardinality of a multi-step path is the accumulated product of the cardinality
	constraints at each step:
	- `maxCount` is the product of `maxCount` at each step; if any step has `maxCount` undefined, the result is undefined
	- `minCount` is the product of `minCount` at each step; if any step has `minCount` undefined or `0`, the result is
		undefined
	- union steps do not introduce additional cardinality; the cardinality of the property containing the union applies to
		all branches collectively

## Scalar Transforms

- **Domain violation**: applying a scalar transform to a value outside its declared domain produces `undefined` (for
	example, `abs` on a string, `lower` on a number, `year` from a time value, `hours` from a date value)
- **Undefined input**: applying any scalar transform to an `undefined` value produces `undefined`
- **Multi-valued**: the transform applies individually to each value in the array; domain violations resolve to
	`undefined` independently per value
- **Union**: the transform applies to whatever value the resolved path produces; the union structure is transparent to
	the transform
- **Transform cardinality**: all transforms set `minCount` to undefined; scalar transforms preserve `maxCount` from the
	path; aggregate transforms set `maxCount` to `1`

## Transform Pipes

A transform pipe is a sequence of transforms applied right-to-left (functional composition order) to the result of a
property path.

The following composition rules govern valid pipes and their evaluation order:

- **Scalar after scalar**: valid; each scalar consumes the output of the previous one and produces a single value or
	`undefined` (for example, `abs(floor(x))`); `undefined` propagates through the chain without evaluating subsequent
	transforms
- **Aggregate after scalar**: valid; the scalar applies element-wise first, then the aggregate operates on the resulting
	set (for example, `sum(abs(x))` computes the sum of absolute values)
- **Scalar after aggregate**: valid; the aggregate reduces the set to a single value, then the scalar applies to that
	value (for example, `floor(avg(x))` floors the average)
- **Aggregate after aggregate**: not valid; only one aggregate is permitted per pipe
- **Multi-valued**: in a pipe with only scalar transforms, each transform applies element-wise, preserving the array
	structure; when an aggregate is present, it collapses the array to a single value

## Aggregate Transforms

- **Invalid values**: aggregates silently skip `undefined` and type-invalid values before computing the result
- **Empty set**: after skipping invalid values, if the input set is empty:
	- `count` → `0`
	- `sum` → `0`
	- `avg` → `undefined`
	- `min` / `max` → `undefined`
- **Single-valued**: the aggregate operates on a set containing at most one value (a degenerate case of multi-valued)
- **Multi-valued**: the aggregate operates on the full set of values in the array
- **Union**: the aggregate operates on the collected values after path resolution; the union structure is transparent to
	the aggregate
- **Grouping context**: non-aggregate bindings in the projection implicitly define the grouping key, analogous to SQL
	`GROUP BY`; the aggregate reduces the set of values within each group

## Type Promotion

- **Numeric types**: `integer` values are implicitly promoted to `decimal` in arithmetic and aggregates; further
	promotion to `float` or `double` follows the same hierarchy
- **Temporal types**: `date`, `time`, and `dateTime` are distinct with no implicit promotion;
	`year` applies to `date` and `dateTime` but not to `time`; `hours` applies to `time` and
	`dateTime` but not to `date`
- **String / numeric**: no implicit parsing or formatting; `abs("3")` is a domain violation
	(→ `undefined`)

## Prefix Word Search

The `~` filter performs case-insensitive, order-sensitive prefix matching on whitespace-delimited words:

1. Split the search string into whitespace-separated tokens
1. Split the target value into whitespace-separated words
1. Case-fold both tokens and words (Unicode default case folding)
1. A resource matches when every token is a case-folded prefix of at least one word, and the matched words appear in the
	 target value in the same relative order as the corresponding tokens in the search string

- **Word boundaries**: transition from whitespace (or start-of-string) to non-whitespace; words are maximal
	non-whitespace runs, so punctuation stays part of the word (for example, `e-mail` is one word)
- **Case**: case-insensitive, using Unicode default case folding (same as
	[comparison and collation](#comparison-and-collation))
- **Diacritics**: diacritics-sensitive — no normalisation is applied; `cafe` does not match `café`
- **Token ordering**: order-sensitive — all tokens must match words in the same relative order; for example, `"red wid"`
	matches `"big red widget"` but not `"widget red"`

## Comparison and Collation

Comparison, ordering, and case mapping follow
[XPath 2.0 comparison operators](https://www.w3.org/TR/xpath-functions/#comparison-operators):

- **Numeric**: [standard numeric ordering](https://www.w3.org/TR/xpath-functions/#func-numeric-less-than)
- **String**: [Unicode codepoint collation](https://www.w3.org/TR/xpath-functions/#codepoint-collation); the system does
	not apply locale-sensitive collation
- **Case mapping**: Unicode default case folding, independent of locale

# Backend Comparison

The tables below document how each reference backend natively handles the cases covered by the adopted semantics, and
where query-level normalisation is required.

Each backend represents the absence of a value differently: XPath 2.0 uses an empty sequence, SPARQL 1.1 leaves the
variable unbound, SQL uses `NULL`, and GQL:2024/openCypher uses `null`. Throughout this section, all of these map
uniformly to `undefined` in the adopted semantics.

## Backend Property Paths

### No Property / No Value

| Aspect           | XPath 2.0        | SPARQL 1.1               | SQL:2011            | GQL:2024/openCypher    |
|------------------|------------------|--------------------------|---------------------|------------------------|
| Navigation       | child axis steps | triple pattern chains    | JOIN + column ref   | relationship traversal |
| Missing value    | empty sequence   | unbound (no binding row) | `NULL` (outer join) | `null`                 |
| Unknown property | empty sequence   | unbound                  | compile-time error  | `null`                 |

All backends propagate "no value" through path steps → `undefined`. Except for SQL, no backend distinguishes a missing
property from a null-valued one → `undefined`. SQL rejects unknown columns at compile time; see
[Unknown Property Guards](#unknown-property-guards) for the required normalisation.

### Multi-valued Properties

| Aspect              | XPath 2.0      | SPARQL 1.1            | SQL:2011                   | GQL:2024/openCypher    |
|---------------------|----------------|-----------------------|----------------------------|------------------------|
| Multi-valued result | sequence       | multiple binding rows | joined row set             | collected list / rows  |
| Ordering guarantees | document order | undefined             | undefined without ORDER BY | undefined              |
| Empty collection    | empty sequence | zero binding rows     | zero joined rows           | empty list / zero rows |

All backends naturally produce multi-valued results → JSON arrays.

### Union Properties

Union properties are transparent at the backend level: path resolution collects whatever values are available across all
branches, and missing branches contribute no values. The "no property / no value → `undefined`" rule applies per branch.

## Backend Scalar Transforms

| Aspect     | XPath 2.0                                                                       | SPARQL 1.1             | SQL:2011           | GQL:2024/openCypher |
|------------|---------------------------------------------------------------------------------|------------------------|--------------------|---------------------|
| Temporal   | separate typed functions (for example, `year-from-date()`, `hours-from-time()`) | `YEAR()` on dateTime   | `EXTRACT` per type | `.year` per type    |
| Wrong type | static error                                                                    | type error (→ unbound) | error (not NULL)   | type error (→ null) |
| Null input | no null — empty seq.                                                            | error (→ unbound)      | `NULL` propagated  | `null` propagated   |

### Domain Violations

All backends reject domain violations uniformly → `undefined`. XPath 2.0 and SQL raise static/compile-time type errors;
SPARQL 1.1 and GQL:2024/openCypher produce runtime errors that resolve to unbound or `null`. The table below documents
the specific error mechanism per scenario.

| Scenario           | XPath 2.0         | SPARQL 1.1             | SQL:2011            | GQL:2024/openCypher |
|--------------------|-------------------|------------------------|---------------------|---------------------|
| `abs(string)`      | static type error | type error (→ unbound) | type error          | runtime type error  |
| `floor(string)`    | static type error | type error (→ unbound) | type error          | runtime type error  |
| `lower(number)`    | static type error | type error (→ unbound) | type error          | runtime type error  |
| `length(number)`   | static type error | type error (→ unbound) | type error          | type error          |
| `year` from time   | no such function  | type error (→ unbound) | error               | type error          |
| `hours` from date  | no such function  | type error (→ unbound) | error               | type error          |
| any scalar on null | empty sequence    | error (→ unbound)      | `NULL` (propagated) | `null` (propagated) |

Multi-valued and union properties: the transform applies individually to each resolved value; domain violations resolve
to `undefined` independently per value.

## Backend Transform Pipes

Pipe composition is resolved entirely at query-building time. The query builder validates the composition rules (scalar
after scalar, aggregate after scalar, scalar after aggregate) and rejects invalid pipes (aggregate after aggregate)
before emitting any backend-specific code. No backend-level normalisation is required.

## Backend Aggregate Transforms

All backends silently exclude invalid values (`undefined`, nulls, type-invalid entries) before computing the aggregate
result.

### Empty Set Behaviour

| Aggregate     | XPath 2.0              | SPARQL 1.1            | SQL:2011             | GQL:2024/openCypher |
|---------------|------------------------|-----------------------|----------------------|---------------------|
| `count`       | `0`                    | `0`                   | `0`                  | `0`                 |
| `sum`         | `0`                    | `0`                   | `NULL` (**differs**) | `0`                 |
| `avg`         | empty sequence         | error (0/0 → unbound) | `NULL`               | `null`              |
| `min` / `max` | error (empty sequence) | error (propagated)    | `NULL`               | `null`              |

`count` / `sum` → `0` and `avg` / `min` / `max` → `undefined` match all backends natively, except SQL `SUM` which
requires `COALESCE(SUM(col), 0)`.

Single-valued, multi-valued, and union properties: the aggregate operates on the full set of resolved values after path
resolution; the cardinality and union structure are transparent to the aggregate.

## Backend Type Promotion

| Scenario          | XPath 2.0                      | SPARQL 1.1                    | SQL:2011             | GQL:2024/openCypher   |
|-------------------|--------------------------------|-------------------------------|----------------------|-----------------------|
| Integer + decimal | subtype substitution → decimal | follows XPath rules → decimal | implicit promotion   | implicit promotion    |
| Decimal → float   | numeric type promotion         | follows XPath rules           | implicit promotion   | implicit promotion    |
| Date → dateTime   | explicit cast only             | no implicit promotion         | explicit `CAST` only | no implicit promotion |
| Time → dateTime   | explicit cast only             | no implicit promotion         | explicit `CAST` only | no implicit promotion |
| String → numeric  | type error                     | type error (→ unbound)        | type error           | type error            |

Numeric promotion aligns natively across all backends. Temporal types and string/numeric conversions require no
normalisation as all backends consistently reject implicit conversion.

## Backend Prefix Word Search

| Aspect         | XPath 2.0                 | SPARQL 1.1                         | SQL:2011                       | GQL:2024/openCypher    |
|----------------|---------------------------|------------------------------------|--------------------------------|------------------------|
| Implementation | single `matches()` regex  | single `REGEX()` filter            | single `REGEXP` / `SIMILAR TO` | single `=~` regex      |
| Case folding   | `lower-case()` both sides | `LCASE()` both sides or `'i'` flag | `LOWER()` or `ILIKE`/collation | `toLower()` both sides |

Order-sensitive semantics allow all backends to evaluate the filter with a single case-insensitive regex, without
lookaheads or per-token conjunction. For search tokens `[t1, t2, …, tn]`, the canonical pattern is:

```
(?i)(?:^|\s)t1\S*\s+(?:\S+\s+)*t2\S*\s+(?:\S+\s+)*…tn
```

Each token is anchored at a word boundary and must appear as a prefix of a word, with matched words in left-to-right
order. This pattern uses only concatenation and alternation — no lookaheads — so it is expressible in the XML Schema
regex dialect shared by XPath 2.0 and SPARQL 1.1, as well as in SQL and GQL regex engines. No backend-specific
normalisation is required beyond case folding.

### Diacritics-insensitive Matching — Rejected

Diacritics-insensitive matching (NFD decomposition + strip combining marks) was evaluated but rejected because it is not
uniformly feasible across backends without application-level pre-processing at storage time:

| Backend             | In-query NFD + strip combining marks?                                       |
|---------------------|-----------------------------------------------------------------------------|
| XPath 2.0           | `normalize-unicode('NFD')` exists but no regex on combining marks — fragile |
| SPARQL 1.1          | no standard NFD function — requires extension or pre-computation            |
| SQL:2011            | PostgreSQL `UNACCENT()` (non-standard); MySQL collation-based only          |
| GQL:2024/openCypher | no standard support — requires pre-computation                              |

Application-level normalisation would require dual storage (original + normalised form), which is not acceptable.
Diacritics-sensitive matching aligns with the cross-backend intersection principle.

## Backend Comparison and Collation

| Aspect            | XPath 2.0              | SPARQL 1.1          | SQL:2011                | GQL:2024/openCypher |
|-------------------|------------------------|---------------------|-------------------------|---------------------|
| Default collation | implementation-defined | not specified       | column/database-defined | lexicographic       |
| Codepoint order   | supported (explicit)   | references XPath    | requires `COLLATE`      | not documented      |
| `lower` / `upper` | locale-free            | locale-free         | follows collation       | locale-free         |
| `min` / `max`     | follows collation      | follows XPath rules | follows collation       | lexicographic       |

Codepoint collation requires explicit selection or normalisation on XPath, SQL, and SPARQL backends where the default
collation is implementation-defined. GQL:2024/openCypher uses lexicographic ordering which aligns with codepoint order
for ASCII content but is not formally documented for the full Unicode range.

# Query Normalisation

Four categories of normalisation are required to enforce the adopted semantics uniformly across backends.

## Unknown Property Guards

SQL rejects unknown columns at compile time rather than producing a runtime `NULL`. The query builder normalises this by
detecting unknown properties at query-building time and short-circuiting to a `NULL` literal before emitting SQL. Other
backends resolve unknown properties to `undefined` natively without additional handling.

| Backend             | Normalisation                                                          |
|---------------------|------------------------------------------------------------------------|
| XPath 2.0           | none — unknown steps produce empty sequence (→ `undefined`) natively   |
| SPARQL 1.1          | none — unknown properties produce unbound (→ `undefined`) natively     |
| SQL                 | prevented at query-building time — short-circuit to `NULL` before emit |
| GQL:2024/openCypher | none — unknown properties produce `null` (→ `undefined`) natively      |

## Domain Violation Guards

For statically-typed backends (XPath 2.0, SQL), domain violations are rejected at compile time rather than producing a
runtime `undefined`. The query builder prevents these by detecting type mismatches at query-building time and
short-circuiting to an `undefined` literal before emitting backend-specific code. Dynamically-typed backends
(SPARQL 1.1, GQL:2024/openCypher) produce unbound/null results that map to `undefined` natively without additional
handling.

| Backend             | Normalisation                                                          |
|---------------------|------------------------------------------------------------------------|
| XPath 2.0           | prevented at query-building time — static type errors are compile-time |
| SPARQL 1.1          | none — type errors produce unbound (→ `undefined`) natively            |
| SQL                 | prevented at query-building time — type errors are compile-time        |
| GQL:2024/openCypher | none — runtime type errors produce `null` (→ `undefined`) natively     |

## Empty Set Aggregates

Only `sum` on an empty set requires backend-specific normalisation (SQL returns `NULL` instead of `0`):

| Backend             | Normalisation                                    |
|---------------------|--------------------------------------------------|
| XPath 2.0           | none — `fn:sum` returns `0` natively             |
| SPARQL 1.1          | none — `SUM` returns `0` natively                |
| SQL                 | `COALESCE(SUM(col), 0)` — standard SQL construct |
| GQL:2024/openCypher | none — `sum()` returns `0` natively              |

## Collation

The adopted codepoint collation is not the default on most backends. The query builder must explicitly select Unicode
codepoint collation for string comparison, ordering, and case mapping.

| Backend             | Normalisation                                                        |
|---------------------|----------------------------------------------------------------------|
| XPath 2.0           | specify Unicode Codepoint Collation URI in collation-sensitive calls |
| SPARQL 1.1          | specify codepoint collation — default is implementation-defined      |
| SQL                 | specify `COLLATE` clause or use codepoint-ordered column collation   |
| GQL:2024/openCypher | none — lexicographic ordering aligns for common cases                |

All other documented semantics (property paths, transform pipes, type promotion, invalid value handling, prefix word
search) align natively across all four backends without normalisation.
