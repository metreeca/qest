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

# NPM Scripts

- **`npm run clean`** - Remove build artifacts and dependencies (dist, docs, node_modules)
- **`npm run setup`** - Install dependencies and apply security fixes
- **`npm run peggy`** - Generate Peggy parsers (must be used before testing grammar changes)
- **`npm run build`** - Build TypeScript and generate TypeDoc documentation
- **`npm run check`** - Run Vitest test suite
- **`npm run watch`** - Watch and recompile TypeScript on changes
- **`npm run proof`** - Start TypeDoc watch mode and documentation server

# Peggy Grammar Files

Peggy grammar files in `src/parsers/` use numeric prefixes (e.g., `1-`, `2-`) to ensure correct build order. Grammars
importing from other grammars must have a higher number than their dependencies.

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
