# @metreeca/qest

[![npm](https://img.shields.io/npm/v/@metreeca/qest)](https://www.npmjs.com/package/@metreeca/qest)

Minimalist foundations for client-driven, queryable REST/JSON APIs.

**@metreeca/qest** standardizes critical capabilities that vanilla REST/JSON APIs typically lack or implement in ad‑hoc,
non‑portable ways:

- **Client-driven** — clients specify exactly what data they need, retrieving complex data envelopes in a single call
- **Queryable** — advanced filtering and aggregation functionalities support faceted search and analytics

Developers seek these features in frameworks like GraphQL. **@metreeca/qest** brings them to REST/JSON, achieving:

- **Familiar patterns** — standard REST and JSON conventions, no new paradigms to learn
- **Simple clients** — no specialized libraries, preprocessors, or code generators
- **Automated servers** — model-driven development, dramatically reducing implementation effort
- **Standard caching** — compatibility with CDNs and browser caches using standard GET requests
- **URL-based versioning** — standard REST versioning without field deprecation complexity

**@metreeca/qest** is the foundation of an integrated full-stack ecosystem for rapid, model-driven REST/JSON
development:

| Package            | Description                                             |
|--------------------|---------------------------------------------------------|
| **@metreeca/qest** | Data models for client-driven, queryable REST/JSON APIs |
| @metreeca/blue     | Model-driven JSON validation (upcoming)                 |
| @metreeca/case     | Model-driven JSON storage (upcoming)                    |
| @metreeca/dock     | Model-driven REST/JSON publishing (upcoming)            |

# Installation

```shell
npm install @metreeca/qest
```

> [!WARNING]
>
> TypeScript consumers must use `"moduleResolution": "nodenext"/"node16"/"bundler"` in `tsconfig.json`.
> The legacy `"node"` resolver is not supported.

# Usage

| Module                                                                     | Description                   |
|----------------------------------------------------------------------------|-------------------------------|
| [@metreeca/qest/state](https://metreeca.github.io/qest/modules/state.html) | Resource state model          |
| [@metreeca/qest/query](https://metreeca.github.io/qest/modules/query.html) | Client-driven retrieval model |

## HTTP Operations

The data models define payload formats for standard REST operations:

| Operation | Method | Model                                                                 | Description                      |
|-----------|--------|-----------------------------------------------------------------------|----------------------------------|
| Retrieve  | GET    | [Resource](https://metreeca.github.io/qest/types/state.Resource.html) | Resource retrieval               |
| Query     | GET    | [Query](https://metreeca.github.io/qest/types/query.Query.html)       | Client-driven resource retrieval |
| Create    | POST   | [Resource](https://metreeca.github.io/qest/types/state.Resource.html) | Resource creation                |
| Update    | PUT    | [Resource](https://metreeca.github.io/qest/types/state.Resource.html) | Complete resource state update   |
| Mutate    | PATCH  | [Patch](https://metreeca.github.io/qest/types/state.Patch.html)       | Partial resource state update    |
| Delete    | DELETE | [IRI](https://www.rfc-editor.org/rfc/rfc3987)                         | Resource deletion                |

## Client-Driven Retrieval

A [Query](https://metreeca.github.io/qest/types/query.Query.html) is a declarative specification that controls how
resources are retrieved: which properties to include and how deeply to expand linked resources. For collections, queries
also support filtering, sorting, pagination, and computed projections including aggregates supporting faceted search and
analytics.

This is the core contribution of **@metreeca/qest**: vanilla REST/JSON APIs lack a standard way for clients to control
retrieval, forcing them to accept fixed server responses or rely on ad-hoc query parameters. The Query model fills this
gap, giving clients precise control over responses while remaining fully compatible with standard HTTP caching.

Client-driven retrieval is fully optional. When clients don't provide a query, servers apply a default model, typically
derived from the underlying data model. This preserves standard REST/JSON behavior while enabling advanced retrieval
capabilities when needed.

## Data Validation

**@metreeca/qest** doesn't specify any constraints on managed data; however, applications may still enforce their own
rules (for instance, required properties, expected types) and reject non-conforming data.

[@metreeca/blue](https://github.com/metreeca/blue), for instance, offers a shape-based validation framework that can
verify [resources](https://metreeca.github.io/qest/types/state.Resource.html),
[patches](https://metreeca.github.io/qest/types/state.Patch.html),
and [queries](https://metreeca.github.io/qest/types/query.Query.html) against declarative constraints defining allowed
properties, value types, cardinalities, ranges, patterns, relationships, and inheritance hierarchies.

## JSON-LD Interoperability

**@metreeca/qest** is built on a controlled subset of [JSON-LD](https://www.w3.org/TR/json-ld11/) (JSON for Linked
Data), a [W3C](https://www.w3.org/) standard that extends JSON with web
identifiers ([IRIs](https://www.rfc-editor.org/rfc/rfc3987)). This enables property names and values to reference shared
vocabularies, giving data a precise, machine-readable meaning that survives when combined with data from other sources —
a capability at the heart of the [Web of Data / Semantic Web](https://www.w3.org/2013/data/) vision and modern knowledge
graphs.

The subset is designed to feel like plain idiomatic JSON, letting JavaScript developers work with linked data using
familiar REST/JSON patterns, without mastering JSON-LD technicalities, while retaining full compatibility with standard
JSON-LD processors.

The JSON-LD subset is defined by the following constraints:

- only the [compacted document form](https://www.w3.org/TR/json-ld11/#compacted-document-form) is supported, which uses
  short property names and nested objects just like regular JSON

- property names ([JSON-LD terms](https://www.w3.org/TR/json-ld11/#terms)) are restricted
  to [ECMAScript identifiers](https://262.ecma-international.org/15.0/#sec-names-and-keywords), enabling property access
  with dot notation; this excludes [JSON-LD keywords](https://www.w3.org/TR/json-ld11/#keywords) (`@id`, `@type`,
  etc.), [blank node identifiers](https://www.w3.org/TR/json-ld11/#identifying-blank-nodes) (`_:`), and arbitrary
  property names; mapping from property names to IRIs, keywords and arbitrary strings may still be managed by an
  application-provided [`@context`](https://www.w3.org/TR/json-ld11/#the-context) object

- values are native JSON primitives (`boolean`, `number`, `string`) without support
  for [typed literals](https://www.w3.org/TR/json-ld11/#typed-values) with arbitrary datatypes; property-specific
  datatype coercion may still be handled by an application-provided `@context` object

- JSON-LD [`@language` containers](https://www.w3.org/TR/json-ld11/#language-indexing), don't support [
  `@none`](https://www.w3.org/TR/json-ld11/#dfn-none) keys for plain literals; for mixed non-localized/localized content
  use `string | Dictionary` union types or [`zxx`](https://iso639-3.sil.org/code/zxx)
  tags

# Support

- open an [issue](https://github.com/metreeca/qest/issues) to report a problem or to suggest a new feature
- start a [discussion](https://github.com/metreeca/qest/discussions) to ask a how-to question or to share an idea

# License

This project is licensed under the Apache 2.0 License –
see [LICENSE](https://github.com/metreeca/qest?tab=Apache-2.0-1-ov-file) file for details.
