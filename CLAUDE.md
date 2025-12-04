---
title: Project Guidelines
description: Development guidelines and conventions for the @metreeca/qest package.
---

# MANDATORY WORKFLOW

1. **CHECK SKILLS FIRST**: Before ANY analysis, file reading, or planning: Review ALL available skills in the Skill tool
   description. If task matches a skill's domain, invoke that skill immediately. Do not proceed to step 2.

2. **PROCEED DIRECTLY**: Only if no skill matches: Proceed with direct implementation.

---

# ABSOLUTE CONSTRAINTS

**Code Modification**

- ONLY modify code when explicitly requested or clearly required
- NEVER refactor or rearchitect unrelated code beyond requested scope
- NEVER revert unrelated user edits

**Skill Usage**

- ALL relevant skills MUST be used without continuous prompting
- SKILL guidance ALWAYS supersedes general-purpose knowledge

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
