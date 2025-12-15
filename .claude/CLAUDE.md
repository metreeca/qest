---
title: Project Guidelines
description: Development guidelines and conventions for the @metreeca/qest package.
---

# References

- JSON-LD 1.1 W3C Recommendations:
  - [Core](https://www.w3.org/TR/json-ld11/) - Syntax and data model
  - [Processing API](https://www.w3.org/TR/json-ld11-api/) - Algorithms and number mapping
  - [Framing](https://www.w3.org/TR/json-ld11-framing/) - Document reshaping

- Parsing:
  - [Peggy](https://peggyjs.org/) - Parser generator for JavaScript
  - [Peggy Documentation](https://peggyjs.org/documentation.html) - Grammar syntax and API
  - [Parsing Expression Grammar (PEG)](https://en.wikipedia.org/wiki/Parsing_expression_grammar) - Formal grammar type
  - [peggy npm](https://www.npmjs.com/package/peggy) - Package repository

- Runtime Validation:
  - [Typia](https://typia.io/) - AOT TypeScript runtime validator
  - [Typia Setup](https://typia.io/docs/setup/) - Installation and configuration
  - [Typia Validators](https://typia.io/docs/validators/) - Validation functions API
  - [typia npm](https://www.npmjs.com/package/typia) - Package repository


# NPM Scripts

- **`npm run clean`** - Remove build artifacts and dependencies (dist, docs, node_modules)
- **`npm run setup`** - Install dependencies and apply security fixes
- **`npm run peggy`** - Generate Peggy parsers (must be used before testing grammar changes)
- **`npm run typia`** - Generate Typia validators (must be used before testing validator changes)
- **`npm run build`** - Build TypeScript and generate TypeDoc documentation
- **`npm run check`** - Run Vitest test suite
- **`npm run watch`** - Watch and recompile TypeScript on changes
- **`npm run proof`** - Start TypeDoc watch mode and documentation server

# Peggy Grammar Files

## Multiple Start Rules

**Generation** (CLI or build config):

```bash
npx peggy --allowed-start-rules rule1,rule2 grammar.pegjs
npx peggy --allowed-start-rules '*' grammar.pegjs  # Allow any rule
```

**Usage** (compiled parser):

```typescript
import * as parser from "./parsers/grammar.js";

// Use default start rule (first rule in grammar)
parser.parse(input);

// Use specific start rule
parser.parse(input, { startRule: "rule1" });
parser.parse(input, { startRule: "rule2" });
```

# Typia Runtime Validation

Typia generates optimized runtime validators from pure TypeScript types via AOT compilation.

## Usage Pattern

Prefer JSDoc comment tags (`@pattern`, `@minimum`, etc.) on interfaces in app code over `tags.*` type helpers.
Use `*Equals` variants to reject excess properties.

```typescript
// src/query.ts - interface with JSDoc constraints
export interface Transform {
    /** @pattern ^[_$A-Za-z][_$A-Za-z0-9]*$ */
    name: string;
}

// src/validators/templates/transforms.ts - minimal template
import typia from "typia";
import { Transform } from "../../query.js";

export const assertTransform = typia.createAssert<Transform>();       // allows extra fields
export const assertTransform = typia.createAssertEquals<Transform>(); // rejects extra fields
```

Run `npm run typia` to generate `src/validators/transforms.ts` with full validation logic.

## Validation Functions

| Function             | Returns          | Throws            | Excess Properties |
|----------------------|------------------|-------------------|-------------------|
| `is<T>()`            | `boolean`        | No                | Allowed           |
| `assert<T>()`        | `T`              | `TypeGuardError`  | Allowed           |
| `validate<T>()`      | `IValidation<T>` | No                | Allowed           |
| `equals<T>()`        | `boolean`        | No                | Rejected          |
| `assertEquals<T>()`  | `T`              | `TypeGuardError`  | Rejected          |
| `validateEquals<T>()`| `IValidation<T>` | No                | Rejected          |

## Limitations

Regex patterns lack `u` flag support for Unicode property escapes (`\p{ID_Start}`, `\p{ID_Continue}`).
Use explicit ranges or external validators for full Unicode. See [#1699](https://github.com/samchon/typia/issues/1699).
