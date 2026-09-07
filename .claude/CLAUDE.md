---
title: Project Guidelines
description: Development guidelines and conventions for the @metreeca/qest package.
---

> [!CAUTION]
> [`.claude/skills/rfc-editor.md`](skills/rfc-editor.md) is a **LOCAL guidelines file**, not a registered Claude Code
> skill: **Read** it with the Read tool, do **not** invoke it via the Skill tool (`Skill(rfc-editor)` fails with
> "Unknown skill", since registered skills must live at `.claude/skills/<name>/SKILL.md`). Reading and applying it is
> **REQUIRED** before any work on the specs [`src/index.md`](../src/index.md): it enforces IETF editorial conventions
> (RFC 7322 structure, RFC 2119 / RFC 8174 requirement keywords, reference and citation style).

> [!CAUTION]
> **The template and resource types document the model; they are not expected to typecheck it.** Key types such as
> `Identifier` alias plain `string`, so index signatures admit binding keys, variant keys, tag ranges and constraint
> operators alike, and the forms are told apart at runtime by the validators, never by the compiler. Templates are
> normally produced by tooling rather than written by hand. **NEVER** raise weak structural discrimination, alias
> erosion, or missing compile-time checks as a finding: it is a known and accepted property of the design.

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

- Dependencies:
- [@metreeca/core](https://github.com/metreeca/core) - Core utilities and shared types

- Target backends (Appendix A companions, for the paywalled ISO standards):
	- [GQL Language Guide — Microsoft Fabric](https://learn.microsoft.com/fabric/graph/gql-language-guide) - GQL:2024
	  syntax reference
	- [ISO GQL documentation — Ultipa](https://www.ultipa.com/docs/gql/) - GQL:2024 functions and predicates reference
	- [GQL ANTLR4 grammar — TuGraph](https://github.com/TuGraph-family/gql-grammar) - formal ISO/IEC 39075 grammar

# NPM Scripts

- **`npm run clean`** - Remove dependencies and build artefacts
- **`npm run prime`** - Install dependencies from the lockfile
- **`npm run setup`** - Configure for local development
- **`npm run peggy`** - Generate Peggy parsers (must be used before testing grammar changes)
- **`npm run build`** - Compile sources and generate docs
- **`npm run check`** - Run the test suite
- **`npm run proof`** - Serve live docs

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
