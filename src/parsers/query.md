---
title: Query String Format
summary: URL-encoded query string format for filtering, sorting, and paginating collections
description: |
  Specification of the query string format accepted by the Query parser for defining
  search criteria, sort order, and pagination parameters on collection resources.
---

# Overview

The query format uses URL-encoded query string syntax with special operators to define filtering criteria, sort order,
and pagination. Query parameters consist of `label=value` pairs separated by `&`.

Labels may include operator prefixes or suffixes to specify the type of criterion being applied.

# Syntax

```
query     = pair*
pair      = "&"? label ("=" value)?
label     = operator? expression operator?
operator  = "~" / "^" / "<" / ">" / "@" / "#"
value     = <URL-encoded string>
```

# Operators

## Equality Filter

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

## Range Filters

Match items where the expression falls within a range.

### Less Than or Equal

```
expression<=value
```

### Greater Than or Equal

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

## Pattern Filter

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

## Sort Order

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

## Pagination

Control result set windowing.

### Offset

```
@=value
```

Zero-based starting index for results.

### Limit

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

# Expressions

Expressions identify the property or path to evaluate using the [Path Format](./path.md).

**Examples:**

- Simple property names: `name`, `status`
- Nested paths: `address.city`, `order.items.price`

Expression resolution depends on the shape context provided during parsing.

# Value Encoding

- All values are URL-encoded
- Values that conform to JSON number syntax are parsed as numbers
- To force numeric-looking values to be treated as strings, wrap them in single quotes (e.g., `'123'`)
- Values are decoded using the datatype inferred from the shape context
- For range and equality filters, the expression's datatype determines how values are parsed
- Relative URIs are resolved against the provided base URI

**Examples:**

```
code=123                # parsed as number 123
code='123'              # parsed as string "123"
price=45.67             # parsed as number 45.67
sku='00042'             # parsed as string "00042" (preserves leading zeros)
```

# Complete Example

```
status=active&status=pending&~name=corp&price>=100&price<=1000&^date=decreasing&@=0&#=25
```

This query:

1. Filters items where `status` is "active" OR "pending"
2. Filters items where `name` contains "corp"
3. Filters items where `price` is between 100 and 1000 (inclusive)
4. Sorts results by `date` in descending order
5. Returns the first 25 items (offset 0, limit 25)
