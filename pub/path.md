---
title: Path Format
summary: Dot-separated property paths for identifying nested values
description: |
  Specification of the shared path format used by expression and query parsers
  to identify properties within nested data structures.
---

# Overview

Paths identify properties or nested properties within a resource using dot-separated identifiers.

# Syntax

```
path       = identifier ("." identifier)*
identifier = [a-zA-Z_$][a-zA-Z0-9_$]*
```

# Identifiers

Valid identifiers follow JavaScript identifier rules:

- Must start with letter, underscore, or `$`
- May contain letters, digits, underscores, and `$`
- Reserved words are allowed (`class`, `function`, etc.)

**Examples:**

```
name                         # simple identifier
_private                     # underscore prefix
$ref                         # dollar prefix
item123                      # contains digits
```

# Nested Paths

Access nested properties using dot notation.

```
user.name
order.items.price
address.city.zipCode
```

Each segment must be a valid identifier.

# Parsing Result

Paths parse to an array of property name strings.

**Examples:**

| Input               | Result                        |
|---------------------|-------------------------------|
| `name`              | `["name"]`                    |
| `user.name`         | `["user", "name"]`            |
| `order.items.price` | `["order", "items", "price"]` |

# Usage

This path format is shared by:

- [Expression Format](expression.md) - extends with bracket notation and prefixes
- [Query String Format](query.md) - uses directly for filter expressions
