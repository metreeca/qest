# @metreeca/qest

[![npm](https://img.shields.io/npm/v/@metreeca/qest)](https://www.npmjs.com/package/@metreeca/qest)

Minimalist foundations for client-driven, queryable REST/JSON APIs.

**@metreeca/qest** standardizes critical capabilities that vanilla REST/JSON APIs typically lack or implement in ad‑hoc,
non‑portable ways:

- **Client-driven** — clients specify what they need, retrieving complex envelopes in a single call
- **Queryable** — advanced filtering and aggregation, supporting faceted search and analytics

Developers seek these features in frameworks like GraphQL; **@metreeca/qest** brings them to REST/JSON, achieving:

- **Familiar patterns** — standard REST and JSON conventions, no new paradigms to learn
- **Simple clients** — no specialized libraries, preprocessors, or code generators
- **Automated servers** — model-driven development, dramatically reducing implementation effort
- **Standard caching** — compatibility with CDNs and browser caches using standard GET requests
- **URL-based versioning** — standard REST versioning without field deprecation complexity

# Installation

```shell
npm install @metreeca/qest
```

> [!WARNING]
>
> TypeScript consumers must use `"moduleResolution": "nodenext"/"node16"/"bundler"` in `tsconfig.json`.
> The legacy `"node"` resolver is not supported.

# Usage

> [!NOTE]
>
> This section introduces essential concepts; for complete coverage, see the API reference:
>
> | Module                                                                     | Description                      |
> | -------------------------------------------------------------------------- | -------------------------------- |
> | [@metreeca/qest/state](https://metreeca.github.io/qest/modules/state.html) | Resource state model             |
> | [@metreeca/qest/query](https://metreeca.github.io/qest/modules/query.html) | Client-driven resource retrieval |

**@metreeca/qest** types define payload semantics and formats for standard REST operations:

| Method | Type                                                                  | Description                      |
| ------ | --------------------------------------------------------------------- | -------------------------------- |
| GET    | [Resource](https://metreeca.github.io/qest/types/state.Resource.html) | Resource retrieval               |
| GET    | [Query](https://metreeca.github.io/qest/types/query.Query.html)       | Client-driven resource retrieval |
| POST   | [Resource](https://metreeca.github.io/qest/types/state.Resource.html) | Resource creation                |
| PUT    | [Resource](https://metreeca.github.io/qest/types/state.Resource.html) | Complete resource state update   |
| PATCH  | [Patch](https://metreeca.github.io/qest/types/state.Patch.html)       | Partial resource state update    |
| DELETE | [IRI](https://metreeca.github.io/core/types/resource.IRI.html)        | Resource deletion                |

## Resources and Patches

A [**Resource**](https://metreeca.github.io/qest/types/state.Resource.html) is a property map describing data returned
by a REST endpoint, with optional links to other endpoints:

```http request
GET https://data.example.com/products/123
```

```json
{
  "id": "https://data.example.com/products/123",
  "name": "Widget",
  "category": "Electronics",
  "tags": ["gadget", "featured"],
  "vendor": "https://data.example.com/vendors/456",
  "price": 99.99,
  "inStock": true
}
```

The same format is used for complete resource updates:

```http request
PUT https://data.example.com/products/123
```

```js
({
  name: "Widget",
  category: "Electronics",
  tags: ["gadget", "premium"],
  vendor: "https://data.example.com/vendors/456",
  price: 79.99,
  // inStock                     // not included → deleted
});
```

A [**Patch**](https://metreeca.github.io/qest/types/state.Patch.html) describes partial updates with the same effect:

```http request
PATCH https://data.example.com/products/123
```

```js
({
  tags: ["gadget", "premium"], // updated
  price: 79.99, // updated
  inStock: null, // deleted
});
```

Properties set to `null` are deleted; properties not included are unchanged.

## Client-Driven Retrieval

A [**Query**](https://metreeca.github.io/qest/types/query.Query.html) is a declarative specification that controls how
resources are retrieved: which properties to include and how deeply to expand linked resources. For collections, queries
also support filtering, sorting, pagination, and computed projections including aggregates supporting faceted search and
analytics.

```http request
GET https://data.example.com/products/?<query>
```

where `<query>` is the following URL-encoded JSON:

```js
({
  items: [
    {
      id: "",
      name: "",
      price: 0,
      vendor: {
        id: "",
        name: "",
      },
      ">=price": 50, // filter: price ≥ 50
      "<=price": 150, // filter: price ≤ 150
      "^price": "asc", // sort: by price ascending
      "#": 25, // limit: 25 results
    },
  ],
});
```

A single call returns exactly what the client requested:

- **projected**: product `id`, `name`, `price`
- **expanded**: linked `vendor` with only `id` and `name` (not its full state)
- **filtered**: `price` between 50 and 150
- **sorted**: by `price` ascending
- **paginated**: up to 25 results

Expansions and nested queries can be arbitrarily deep. No over-fetching of unwanted fields, no under-fetching requiring
additional calls to resolve linked resources:

```json
{
  "items": [
    {
      "id": "https://data.example.com/products/456",
      "name": "Gadget",
      "price": 59.99,
      "vendor": {
        "id": "https://data.example.com/vendors/145",
        "name": "Acme"
      }
    },
    {
      "id": "https://data.example.com/products/123",
      "name": "Widget",
      "price": 99.99,
      "vendor": {
        "id": "https://data.example.com/vendors/145",
        "name": "Acme"
      }
    },
    {
      "id": "https://data.example.com/products/789",
      "name": "Gizmo",
      "price": 129.99,
      "vendor": {
        "id": "https://data.example.com/vendors/236",
        "name": "Globex"
      }
    }
  ]
}
```

This is the core contribution of **@metreeca/qest**: vanilla REST/JSON APIs lack a standard way for clients to control
retrieval, forcing them to accept fixed server responses or rely on ad-hoc query parameters. The Query model fills this
gap, giving clients precise control over responses while remaining fully compatible with standard HTTP caching.

> [!IMPORTANT]
>
> Client-driven retrieval is fully optional. When clients don't provide a query, servers may provide a default one,
> typically derived from the underlying data model. This preserves standard REST/JSON behavior while enabling advanced
> retrieval capabilities when needed.

# Integrated Ecosystem

> [!IMPORTANT]
>
> **@metreeca/qest** defines data types only; applications are absolutely free to handle validation, storage, and
> publishing as they see fit.

But **@metreeca/qest** is also the foundation of an integrated ecosystem for rapid application development, turning
those same types into a complete model-driven stack:

| Package                     | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| **@metreeca/qest**          | Data types for client-driven, queryable REST/JSON APIs     |
| @metreeca/blue _(upcoming)_ | Shape-based validation for resources, patches, and queries |
| @metreeca/keep _(upcoming)_ | Shape-driven storage framework with pluggable adapters     |
| @metreeca/gate _(upcoming)_ | Shape-driven REST/JSON API publishing                      |

# JSON-LD Foundations

[JSON-LD](https://www.w3.org/TR/json-ld11/) (JSON for Linked Data) is a [W3C](https://www.w3.org/) standard for
publishing linked data on the web. It extends JSON with web identifiers ([IRIs](https://www.rfc-editor.org/rfc/rfc3987))
to link resources across systems and domains, and to give property names precise, machine-readable meaning by mapping
them to shared vocabularies — a capability at the heart of the [Web Data Activity](https://www.w3.org/2013/data/) (
Semantic Web)
and modern knowledge graphs.

**@metreeca/qest** defines a controlled JSON-LD subset designed to feel like plain idiomatic JSON, letting JavaScript
developers work with linked data using familiar REST/JSON patterns without mastering JSON-LD technicalities, while
retaining full compatibility with standard JSON-LD processors.

This controlled subset is specified by:

- [compacted documents](https://www.w3.org/TR/json-ld11/#compacted-document-form) with short property names and nested
  objects, just like regular JSON

- [ECMAScript identifiers](https://262.ecma-international.org/15.0/#sec-names-and-keywords) as property names
  ([terms](https://www.w3.org/TR/json-ld11/#terms)), enabling dot notation access;
  [JSON-LD keywords](https://www.w3.org/TR/json-ld11/#keywords) (`@id`, `@type`, etc.) and
  [blank node identifiers](https://www.w3.org/TR/json-ld11/#identifying-blank-nodes) are not allowed and must be mapped
  to identifiers via an application-provided [`@context`](https://www.w3.org/TR/json-ld11/#the-context) (for instance,
  `"id": "@id"`); `@context` must also maps property names to IRIs for semantic interoperability

- native JSON primitives (`boolean`, `number`, `string`) as values;
  [typed literals](https://www.w3.org/TR/json-ld11/#typed-values) with arbitrary datatypes are not allowed and must be
  represented as strings with [datatype coercion](https://www.w3.org/TR/json-ld11/#type-coercion) declared in `@context`

- [language maps](https://www.w3.org/TR/json-ld11/#language-indexing) for localised text; [
  `@none`](https://www.w3.org/TR/json-ld11/#dfn-none) keys for non-localised values in language maps are not allowed and
  must be handled using `string | Local` union types or the [`zxx`](https://iso639-3.sil.org/code/zxx) language tag

- [index maps](https://www.w3.org/TR/json-ld11/#data-indexing) for key-indexed property values; indexed semantics must
  be signalled by application-provided `@context` declarations, as indexed values are otherwise indistinguishable from
  nested resources

- [IRI references](https://www.w3.org/TR/json-ld11/#node-identifiers) for linking resources across systems and domains;
  applications may opt to restrict references to absolute or root-relative IRIs

# Support

- open an [issue](https://github.com/metreeca/qest/issues) to report a problem or to suggest a new feature
- start a [discussion](https://github.com/metreeca/qest/discussions) to ask a how-to question or to share an idea

# License

This project is licensed under the Apache 2.0 License –
see [LICENSE](https://github.com/metreeca/qest?tab=Apache-2.0-1-ov-file) file for details.
