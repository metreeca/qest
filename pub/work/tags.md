---
title: Language Tags for JSON-LD Language Maps
summary: Representing non-localized content without @none
description: |
  Guide to using BCP 47 language tags (zxx, und) instead of @none keyword for
  non-localized content in JSON-LD language maps.
---

# Overview

How to represent non-localized content in JSON-LD language maps without using `@none` keyword.

## Quick Comparison

| Key     | Type            | Semantics                     | RDF Output       |
|---------|-----------------|-------------------------------|------------------|
| `@none` | JSON-LD keyword | No language tag metadata      | Plain literal    |
| `und`   | BCP 47 tag      | Language undetermined/unknown | `"value"@und`    |
| `zxx`   | BCP 47 tag      | No linguistic content         | `"value"@zxx`    |
| `""`    | ❌ Invalid       | Not spec-compliant            | Validation error |

## Key Distinctions

**`@none`**: JSON-LD keyword for plain RDF literals (no `@language` property). Spec-compliant but exposes keywords in
application data.

**`und`**: BCP 47 tag meaning "language undetermined." Use for linguistic content when the language cannot be
determined (e.g., corrupted text, mixed fragments).

**`zxx`**: BCP 47 tag meaning "no linguistic content / not applicable." Use for non-linguistic data (IDs, codes,
numbers, symbols). **Not for personal names** - names are linguistic and should use origin language or `und`.

**Empty string `""`**: Not spec-compliant. BCP 47 requires non-empty language tags. Fails validation in strict mode.

## Why Avoid `@none`?

**Problem**: Using `@none` exposes JSON-LD keywords in application data structures.

**Solution**: Use BCP 47 language tag `zxx` (no linguistic content) instead.

**Trade-off**: RDF output is `"value"@zxx` instead of plain literal `"value"`, but this explicitly marks the content as
non-linguistic.

**Practical equivalence**: `@none` and `zxx` are substantially synonymous - both signal "language tagging is not
meaningful here."

## Solutions

### Approach 1: Union Type

Separate non-localized (plain string) from localized (dictionary):

```typescript
type Label = string | { [language: string]: string }
```

**Advantages**: Clear type-level distinction between localized and non-localized content.

**Disadvantages**: Two different shapes to handle in application code.

### Approach 2: `zxx` Key in Dictionary

Mark non-localized content explicitly within language maps:

```typescript
type Label = {
  readonly "zxx"?: T  // Non-localized content
  readonly [language: `${Language}`]: T
}
```

**Advantages**: Consistent dictionary structure, explicit non-linguistic marking, avoids `@none` keyword.

**Trade-off**: RDF literal has `@zxx` tag instead of being a plain literal.

## Guidelines

- **Non-linguistic content** (IDs, codes, SKUs): Use `"zxx"`
- **Unknown language**: Use `"und"`
- **Personal names**: Use origin language (`"it"`, `"fr"`, `"de"`) or `"und"` if unknown
- **Empty string `""`**: Not spec-compliant - never use

## References

- [JSON-LD 1.1 Specification](https://www.w3.org/TR/json-ld11/)
- [BCP 47 Language Tags](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)
- [W3C: Tagging text with no language](https://www.w3.org/International/questions/qa-no-language)
