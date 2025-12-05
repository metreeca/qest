---
title: Expression Format
summary: Property path expressions with optional naming and transforms
description: |
  Specification of the expression format for identifying properties, applying transforms,
  and assigning result names in query projections.
---

# Overview

Expressions identify properties or computed values within a resource. An expression combines an optional result name, a
pipeline of transforms, and a property path.

# Syntax

```
expression = name? transform* path
name       = identifier "="
transform  = identifier ":"
path       = prefix? property*
prefix     = "$" / "."
property   = "." identifier / "['" chars "']"
identifier = [a-zA-Z_$][a-zA-Z0-9_$]*
```

# Components

## Result Name

Assign a name to the expression result for use in projections.

```
name=path
```

The name must be a valid identifier (starts with letter, underscore, or `$`).

**Examples:**

```
userName=user.name           # result named "userName"
total=sum:items.price        # computed result named "total"
```

## Transforms

Apply one or more transforms to the path value. Transforms form a pipeline, applied left to right.

```
transform:path
transform1:transform2:path
```

**Examples:**

```
count:items                  # count of items
sum:items.price              # sum of item prices
sum:round:items.price        # sum, then round
avg:abs:temperatures         # average of absolute values
```

## Property Path

Identify a property or nested property within a resource. Expression paths extend the base
[Path Format](./path.md) with bracket notation and optional prefixes.

### Dot Notation

See [Path Format](./path.md) for dot notation syntax and identifier rules.

### Bracket Notation

Access properties with special characters using bracket notation with single quotes.

```
['property-name']
['@id']
```

**Special character handling:**

- Single quotes inside property names must be escaped: `\'`
- Backslashes must be escaped: `\\`

**Examples:**

```
['first-name']               # hyphen in name
['@type']                    # at-sign prefix
['content-type']             # HTTP header style
['it\'s']                    # escaped single quote
['path\\to\\file']           # escaped backslashes
```

### Mixed Notation

Combine dot and bracket notation as needed.

```
user['first-name']
data.items['@id']
response.headers['content-type']
```

### Path Prefix

Paths may optionally start with `$` (JSONPath root) or `.` (leading dot). Both are stripped during parsing.

**Examples:**

```
$.user.name                  # JSONPath style
.user.name                   # leading dot style
user.name                    # plain path
```

All three forms produce the same result: `["user", "name"]`.

### Empty Path

An empty path references the root resource. Use empty path with transforms to compute aggregates over the entire input.

```
count:                       # count items in collection
sum:                         # sum all values
```

# Complete Examples

```
name                         # simple property
user.profile.email           # nested property
['content-type']             # special characters
userName=user.name           # named projection
total=sum:items.price        # named computed value
avgScore=avg:round:scores    # named multi-transform
data.items['@type']          # mixed notation path
```

# Parsing Result

Expressions parse to an object with three properties:

| Property | Type     | Description                             |
|----------|----------|-----------------------------------------|
| `name`   | string   | Result name (omitted if not specified)  |
| `pipe`   | string[] | Transform pipeline (empty if none)      |
| `path`   | string[] | Property path segments (empty for root) |

**Example:**

```
"total=sum:round:items.price"
```

Parses to:

```json
{
  "name": "total",
  "pipe": ["sum", "round"],
  "path": ["items", "price"]
}
```
