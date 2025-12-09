---
title: Serialization
summary: Serialization formats for Query, Resource, and Patch objects
description: |
  Standard serialization formats for @metreeca/qest model objects.
---

This document defines the standard serialization formats for **@metreeca/qest** model objects:

- [**JSON formats**](#model-serialization) for all model types (Query, Resource, Patch)
- [**Transport formats**](#query-serialization) for Query objects (percent-encoded, base64, form-encoded)
- [**Grammar rules**](#query-grammar) for expressions, paths, identifiers, and values

> [!IMPORTANT]
>
> This document specifies **serialization formats only** and assumes familiarity with the
> [Query](../modules/query.html) and [core](../modules/index.html) data models.
> See the [codec](../modules/codec.html) module for encoding and decoding functions.

# Model Serialization

All model objects support JSON serialization with type-specific mode labels; Query objects additionally support transport-optimized encoding formats:

| Model                             | Mode       | Format                                                                    | Auto-Detection                                       |
|-----------------------------------|------------|---------------------------------------------------------------------------|------------------------------------------------------|
| [Query](../modules/query.html)    | `query`    | [JSON](#query-json-serialization)                                         | Starts with `{`                                      |
|                                   | `url`      | [Percent-Encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2.1) JSON | Contains `%XX` sequences                             |
|                                   | `base64`   | [Base64](https://www.rfc-editor.org/rfc/rfc4648#section-4) encoded JSON   | Only `[A-Za-z0-9+/=]`, length ×4                     |
|                                   | `form`     | [Form-encoded](#query-form-serialization)                                 | Requires default [projection](../modules/query.html) |
| [Resource](../modules/index.html) | `resource` | [JSON](#query-json-serialization)                                         | -                                                    |
| [Patch](../modules/index.html)    | `patch`    | [JSON](#query-json-serialization)                                         | -                                                    |

# Query Serialization

## JSON Serialization

Query operators are represented as JSON key prefixes, mirroring the [Query](../modules/query.html) type definition. Keys
combine a prefix with an [expression](#expressions). Values are JSON-serialized according to operator type:

| Operator              | Key Prefix | Value Type | Example                 |
|-----------------------|------------|------------|-------------------------|
| Less than             | `<`        | Literal    | `{"<price": 100}`       |
| Greater than          | `>`        | Literal    | `{">price": 50}`        |
| Less than or equal    | `<=`       | Literal    | `{"<=price": 100}`      |
| Greater than or equal | `>=`       | Literal    | `{">=price": 50}`       |
| Pattern filter        | `~`        | string     | `{"~name": "corp"}`     |
| Disjunctive matching  | `?`        | Options    | `{"?status": "active"}` |
| Conjunctive matching  | `!`        | Options    | `{"!tags": ["a", "b"]}` |
| Focus ordering        | `$`        | Options    | `{"$status": "active"}` |
| Sort order            | `^`        | Order      | `{"^date": -1}`         |
| Offset                | `@`        | number     | `{"@": 0}`              |
| Limit                 | `#`        | number     | `{"#": 10}`             |

**Example:**

```json
{
  "?status": [
    "active",
    "pending"
  ],
  "~name": "corp",
  ">=price": 100,
  "<=price": 1000,
  "^date": -1,
  "@": 0,
  "#": 25
}
```

## Form Serialization

Query objects additionally support `application/x-www-form-urlencoded` encoding via the `form` mode.

The `form` format serializes Query objects as query strings, where each `label=value` pair represents a constraint.
Labels may include operator prefixes or suffixes to specify the type of criterion being applied.

```
query   = pair*
pair    = "&"? label ("=" value)?
label   = prefix? expression postfix? | "@" | "#"
prefix  = "~" | "?" | "!" | "$" | "^"
postfix = "<" | ">"
value   = <URL-encoded string>
```

### Operators

| Syntax                | Value                                        | Description                                       |
|-----------------------|----------------------------------------------|---------------------------------------------------|
| `expression=option`   | [value](#values)                             | Disjunctive; alias for `?expression=option`       |
| `expression<=literal` | [value](#values)                             | Less than or equal                                |
| `expression>=literal` | [value](#values)                             | Greater than or equal                             |
| `~expression=string`  | string                                       | Stemmed word search                               |
| `?expression=option`  | [value](#values)                             | Disjunctive; multiple instances combined with OR  |
| `!expression=option`  | [value](#values)                             | Conjunctive; multiple instances combined with AND |
| `$expression=option`  | [value](#values)                             | Focus ordering                                    |
| `^expression=order`   | `asc`/`ascending`/`desc`/`descending`/number | Sort ordering                                     |
| `@=number`            | number                                       | Offset                                            |
| `#=number`            | number                                       | Limit                                             |

**Example:**

```
status=active&status=pending&~name=corp&price>=100&price<=1000&^date=decreasing&@=0&#=25
```

This query:

1. Filters items where `status` is "active" OR "pending"
2. Filters items where `name` contains "corp"
3. Filters items where `price` is between 100 and 1000 (inclusive)
4. Sorts results by `date` in descending order
5. Returns the first 25 items (offset 0, limit 25)

### Baseline Queries

Form mode **decoding** is activated by providing a baseline [Query](../modules/query.html) object instead of a mode label.
The baseline must contain exactly one property with a singleton query tuple (`[Query]`) value, identifying the target
collection. The baseline also provides the default projection, which form queries cannot specify, and may include
default constraints to be merged with client-provided constraints.

> [!NOTE]
>
> {TBD} Constraint merging to be detailed

Form-encoded strings can only express flat constraints (filtering, sorting, pagination). Nested queries and projections
must be defined in the baseline.

> [!WARNING]
>
> Decoding throws a `SyntaxError` if the baseline contains no collection or multiple collections.

**Form input:**

```
status=active&@=0&#=10
```

**Baseline Query:**

```json
{
  "items": [{}]
}
```

**Decoded Query:**

```json
{
  "items": [
    {
      "?status": "active",
      "@": 0,
      "#": 10
    }
  ]
}
```

# Query Grammar

Grammar elements shared by both [JSON](#json-serialization) and
[Form](#form-serialization) Query serialization formats.

## Expressions

Expressions identify properties or computed values. An expression combines optional [transform pipes](#transform-pipes)
with a [property path](#property-paths).

```
expression = transforms path
```

Transforms form a pipeline applied right-to-left. An empty path with transforms computes aggregates over the input.

**Examples:**

```
name
user.profile
count:items
sum:items.price
round:avg:scores
count:
```


### Transform Pipes

Transforms apply operations to path values. Multiple transforms form a pipeline, applied right-to-left (functional order).

```
transforms = (identifier ":")*
```

**Examples:**

```
count:items                  # count of items
sum:items.price              # sum of item prices
round:avg:scores             # inner applied first, then outer
```

### Property Paths

Property paths identify nested properties within a resource using dot notation. An empty path references the root value.

```
path       = property ("." property)*
property   = identifier
identifier = [$_\p{ID_Start}][$\p{ID_Continue}]*
```

**Examples:**

```
name                         # simple property
user.profile.email           # nested property
count:                       # empty path (root)
```

### Identifiers

Property names and transform names follow [ECMAScript identifier](https://262.ecma-international.org/15.0/#sec-names-and-keywords) rules.

**Examples:**

```
name                         # simple identifier
_private                     # underscore prefix
$ref                         # dollar prefix
item123                      # contains digits
```

## Values

- [Values](../modules/index.html#Values) are serialized as [JSON](https://www.rfc-editor.org/rfc/rfc8259) primitives
- [IRIs](../modules/index.html#IRI) are serialized as strings
- Localized strings ([Dictionary](../modules/index.html#Dictionary)) combine a string with a [language tag](https://metreeca.github.io/core/types/language.Tag.html)

```
value      = literal | localized
literal    = boolean | number | string
boolean    = "true" | "false"
number     = <JSON number>
string     = <JSON string> | <unquoted>
localized  = <JSON string> "@" language-tag
```

String quotes may be omitted.

> [!WARNING]
>
> Omitting quotes may cause strings to be interpreted as numbers.
> Use `"123"` to preserve string type for numeric-looking values.
