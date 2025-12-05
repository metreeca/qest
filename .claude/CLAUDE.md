---
title: Project Guidelines
description: Development guidelines and conventions for the @metreeca/qest package.
---

# Code Modification

**NON-NEGOTIABLE**

- Modify ONLY what is explicitly requested or clearly required to solve the stated problem.

**NEVER**

- Refactor, rearchitect, or "improve" code beyond requested scope
- Revert user edits unless explicitly asked
- Make changes "while we're here" or "for consistency"
- Add unrequested features, error handling, or enhancements

---

# Skill Delegation

A `PreToolUse` hook automatically detects file types and prints skill suggestions based on file extensions.

**When hook suggestion appears:**

- Immediately invoke the suggested skill using the Skill tool
- Do not proceed with file operations without using the skill

**Skill authority:**

- Skill guidance supersedes general knowledge
- Skills enforce project-specific patterns and standards

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
