---
title: Project Guidelines
description: Development guidelines and conventions for the @metreeca/qest package.
---

> [!CAUTION]
>
> - **UNDER NO CIRCUMSTANCES** rearchitect or refactor unrelated code beyond the requested scope.
> - **NEVER** make unsolicited changes or revert **unrelated** user edits.
> - **ONLY** modify code when explicitly requested or clearly required.

> [!IMPORTANT]
>
> - **ALL** relevant skills **MUST** be used when applicable without continuous prompting.
> - **SKILL** guidance **ALWAYS** supersedes internal general-purpose knowledge.

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
- **`npm run build`** - Build TypeScript and generate TypeDoc documentation
- **`npm run check`** - Run Vitest test suite
- **`npm run watch`** - Watch and recompile TypeScript on changes
- **`npm run proof`** - Start TypeDoc watch mode and documentation server
