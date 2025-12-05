---
title: Query Format
summary: Query encoding formats for filtering, sorting, and paginating collections
description: |
  Specification of the query encoding formats accepted by the Query parser for defining
  search criteria, sort order, and pagination parameters on collection resources.
---

# Overview

Queries define filtering criteria, sort order, and pagination parameters for linked data resource collections. Encoded
queries are passed as URL query strings in HTTP GET requests to retrieve filtered, sorted, and paginated results.

The Query parser supports multiple encoding formats for flexibility across different transport contexts.

# Encoding Formats

Queries can be encoded in four formats. The decoder auto-detects the format based on string patterns.

| Format   | Description                |
|----------|----------------------------|
| `json`   | JSON object representation |
| `url`    | URL-encoded JSON           |
| `base64` | Base64-encoded JSON        |
| `form`   | URL query string syntax    |

## Auto-Detection

When decoding without a collection parameter, the parser tests formats in order:

| Format      | Detection Pattern                                          |
|-------------|------------------------------------------------------------|
| URL-encoded | Contains `%XX` escape sequences                            |
| JSON        | Starts with `{` (after trimming whitespace)                |
| Base64      | Contains only `[A-Za-z0-9+/=]` and length is multiple of 4 |

When decoding with a collection parameter, the parser uses form format directly and wraps the result.

## JSON Representation

In JSON format, query operators are represented as key prefixes:

| Operator        | JSON Key Prefix | Example                 |
|-----------------|-----------------|-------------------------|
| Equality filter | `?`             | `{"?status": "active"}` |
| Pattern filter  | `~`             | `{"~name": "corp"}`     |
| Less than       | `<=`            | `{"<=price": 100}`      |
| Greater than    | `>=`            | `{">=price": 50}`       |
| Sort order      | `^`             | `{"^date": -1}`         |
| Offset          | `@`             | `{"@": 0}`              |
| Limit           | `#`             | `{"#": 10}`             |

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

## URL-Encoded JSON

The `url` format wraps JSON in URL encoding for safe transport in query strings:

```
%7B%22%3Fstatus%22%3A%22active%22%2C%22%40%22%3A0%2C%22%23%22%3A10%7D
```

Decodes to: `{"?status":"active","@":0,"#":10}`

## Base64-Encoded JSON

The `base64` format provides compact encoding for opaque token transport:

```
eyI/c3RhdHVzIjoiYWN0aXZlIiwiQCI6MCwiIyI6MTB9
```

Decodes to: `{"?status":"active","@":0,"#":10}`

# Form Format

The form format uses URL-encoded query string syntax with special operators. Query parameters consist of `label=value`
pairs separated by `&`.

Labels may include operator prefixes or suffixes to specify the type of criterion being applied.

## Syntax

```
query     = pair*
pair      = "&"? label ("=" value)?
label     = operator? expression operator?
operator  = "~" / "^" / "<" / ">" / "@" / "#"
value     = <URL-encoded string>
```

## Operators

### Equality Filter

Match items where the expression equals the specified value.

```
expression=value
```

- Multiple values for the same expression create an **any-of** filter (logical OR)
- Empty value matches nil/null values
- Wildcard `*` matches any value (marks expression as filtered without constraining)

**Examples:**

```
status=active                    # status equals "active"
status=active&status=pending     # status equals "active" OR "pending"
category=                        # category is nil/null
category=*                       # category has any value
```

### Range Filters

Match items where the expression falls within a range.

#### Less Than or Equal

```
expression<=value
```

#### Greater Than or Equal

```
expression>=value
```

The `=` serves as the standard key-value separator; the combined form reads naturally as ≤ and ≥.

**Examples:**

```
price<=100          # price d 100
date>=2024-01-01    # date e 2024-01-01
age>=18&age<=65     # 18 d age d 65 (combined range)
```

### Pattern Filter

Match items where the expression matches a text pattern.

```
~expression=pattern
```

The `~` prefix indicates pattern matching (like/contains).

**Examples:**

```
~name=john          # name contains "john"
~title=report       # title contains "report"
```

### Sort Order

Define the sort order for results.

```
^expression=direction
```

The `^` prefix indicates a sort criterion.

**Direction values:**

| Value        | Effect                |
|--------------|-----------------------|
| `increasing` | Ascending order (+1)  |
| *(empty)*    | Ascending order (+1)  |
| `decreasing` | Descending order (-1) |
| *integer*    | Numeric order value   |

**Examples:**

```
^name=increasing     # sort by name ascending
^name=               # sort by name ascending (default)
^date=decreasing     # sort by date descending
^priority=1          # sort by priority with order value 1
```

### Pagination

Control result set windowing.

#### Offset

```
@=value
```

Zero-based starting index for results.

#### Limit

```
#=value
```

Maximum number of items to return. Value of `0` means unlimited.

**Examples:**

```
@=0&#=10             # first 10 items
@=20&#=10            # items 21-30
@=100&#=50           # items 101-150
```

## Expressions

Expressions identify the property or path to evaluate using the [Path Format](path.md).

**Examples:**

- Simple property names: `name`, `status`
- Nested paths: `address.city`, `order.items.price`

## Value Encoding

- All values are URL-encoded
- Empty values represent `null` (e.g., `category=` matches null values)
- Values that conform to JSON number syntax are parsed as numbers
- To force numeric-looking values to be treated as strings, wrap them in single quotes (e.g., `'123'`)

**Examples:**

```
code=123                # parsed as number 123
code='123'              # parsed as string "123"
price=45.67             # parsed as number 45.67
sku='00042'             # parsed as string "00042" (preserves leading zeros)
```

## Complete Example

```url
status=active&status=pending&~name=corp&price>=100&price<=1000&^date=decreasing&@=0&#=25
```

```
status=active
	&status=pending
	&~name=corp
	&price>=100
	&price<=1000
	&^date=decreasing
	&@=0
	&#=25
```

This query:

1. Filters items where `status` is "active" OR "pending"
2. Filters items where `name` contains "corp"
3. Filters items where `price` is between 100 and 1000 (inclusive)
4. Sorts results by `date` in descending order
5. Returns the first 25 items (offset 0, limit 25)

# Collection Wrapping

Form format can only be decoded with a collection property name. The parser parses the form-encoded specs and wraps them
into a query object with the collection as the filtered property.

Form-encoded strings can only express a subset of possible queries (flat specs with filtering, sorting, and pagination).
Nested queries or projections cannot be represented in this format. Attempting to decode form format without a
collection parameter throws a `SyntaxError`.

**Input:**

```
status=active&@=0&#=10
```

**With collection property `items`:**

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

This wrapping enables direct use of form-encoded query strings to filter specific collection properties in linked data
resources.

# Format Equivalence

JSON, URL-encoded, and base64 formats decode to the same query structure directly:

**JSON:**

```json
{
  "?status": "active",
  "@": 0,
  "#": 10
}
```

**URL-encoded JSON:**

```
%7B%22%3Fstatus%22%3A%22active%22%2C%22%40%22%3A0%2C%22%23%22%3A10%7D
```

**Base64-encoded JSON:**

```
eyI/c3RhdHVzIjoiYWN0aXZlIiwiQCI6MCwiIyI6MTB9
```

Form format decodes to the same specs when used with collection wrapping:

**Form (with collection `items`):**

```
status=active&@=0&#=10
```

Decodes to:

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
