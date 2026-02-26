# @metreeca/qest

[![npm](https://img.shields.io/npm/v/@metreeca/qest)](https://www.npmjs.com/package/@metreeca/qest)

Minimalist foundations for client-driven, queryable REST/JSON APIs.

**@metreeca/qest** standardizes critical capabilities that vanilla REST/JSON APIs typically lack or implement in ad‑hoc,
non‑portable ways:

- **Client-Driven**: clients specify what they need, retrieving complex envelopes in a single call
- **Queryable**: advanced filtering and aggregation, supporting faceted search and analytics
- **Localised**: full support for internationalised content with language-tagged text maps

Developers seek these features in frameworks like GraphQL; **@metreeca/qest** brings them to REST/JSON, achieving:

- **Familiar Patterns**: standard REST and JSON conventions, no new paradigms to learn
- **Simple Clients**: no specialized libraries, preprocessors, or code generators
- **Automated Servers**: model-driven development, dramatically reducing implementation effort
- **Standard Caching**: compatibility with CDNs and browser caches using standard GET requests
- **URL-Based Versioning**: standard REST versioning without field deprecation complexity

# Ecosystem

**@metreeca/qest** focuses on semantics and core data types, leaving applications free to handle validation, storage,
and publishing as they see fit; its standardised data model is the foundation of an integrated ecosystem that delivers a
powerful model-driven stack for rapid development of linked data applications:

| Package                                                | Description                                                    |
|--------------------------------------------------------|----------------------------------------------------------------|
| **@metreeca/qest**                                     | Data types for client-driven, queryable REST/JSON APIs         |
| [**@metreeca/blue**](https://github.com/metreeca/blue) | Declarative blueprints for model-driven linked data processing |
| @metreeca/keep _(upcoming)_                            | Shape-driven storage framework with pluggable adapters         |
| @metreeca/gate _(upcoming)_                            | Shape-driven REST/JSON API publishing                          |

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
> | Module                                                                     | Description                     |
> |----------------------------------------------------------------------------|---------------------------------|
> | [@metreeca/qest](https://metreeca.github.io/qest/modules/index.html)       | Shared values, types, and guards |
> | [@metreeca/qest/state](https://metreeca.github.io/qest/modules/state.html) | Resource state management       |
> | [@metreeca/qest/model](https://metreeca.github.io/qest/modules/model.html) | Client-driven retrieval         |

**@metreeca/qest** types define payload semantics and formats for standard REST operations:

| Method | Type         | Description                        |
|--------|--------------|------------------------------------|
| GET    | [Resource][] | Resource retrieval                 |
| GET    | [Resource][] | Collection retrieval               |
| GET    | [Model][]    | Client-driven resource retrieval   |
| GET    | [Query][]    | Client-driven collection retrieval |
| POST   | [Resource][] | Resource creation                  |
| PUT    | [Resource][] | Complete resource state update     |
| DELETE | [IRI][]      | Resource deletion                  |

[Resource]: https://metreeca.github.io/qest/types/state.Resource.html

[Model]: https://metreeca.github.io/qest/types/model.Model.html

[Query]: https://metreeca.github.io/qest/types/model.Query.html

[IRI]: https://metreeca.github.io/core/types/resource.IRI.html

## Resources

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
  "tags": [
    "gadget",
    "featured"
  ],
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

## Client-Driven Retrieval

Client-driven retrieval lets clients specify exactly what data to retrieve from both single resources and collections.
Expansions and nested queries can be arbitrarily deep: no over-fetching of unwanted fields, no under-fetching requiring
additional calls to resolve linked resources.

This is the core contribution of **@metreeca/qest**: vanilla REST/JSON APIs lack a standard way for clients to control
retrieval, forcing them to accept fixed server responses or rely on ad-hoc query parameters. Client-driven retrieval
fills this gap, supporting precise control over responses while remaining fully compatible with standard HTTP caching.

> [!IMPORTANT]
>
> Client-driven retrieval is fully optional. Servers may provide defaults, typically derived from the underlying data
> model, preserving standard REST/JSON behavior while enabling advanced capabilities when needed.

**Resources** — A [**Model**](https://metreeca.github.io/qest/types/model.Model.html) defines the data retrieval
envelope: which properties to include and how deeply and in how much detail to expand linked resources.

```http request
GET https://data.example.com/products/123?<model>
```

where `<model>` is the following URL-encoded JSON:

```js
({
    id: "",
    name: "",
    price: 0,
    vendor: {
        id: "",
        name: "",
    },
});
```

The response includes only the requested properties, with the linked `vendor` expanded to show just `id` and `name`:

```json
{
  "id": "https://data.example.com/products/123",
  "name": "Widget",
  "price": 99.99,
  "vendor": {
    "id": "https://data.example.com/vendors/145",
    "name": "Acme"
  }
}
```

**Collections** — A [**Query**](https://metreeca.github.io/qest/types/model.Query.html) combines a projection model with
filtering, ordering, and pagination criteria, also supporting computed projections including aggregates for faceted
search and analytics.

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

## Localised Content

Resource properties can hold localised text using language maps, which map
[BCP 47](https://www.rfc-editor.org/rfc/rfc5646.html) language tags to text values:

```json
{
  "id": "https://data.example.com/products/123",
  "name": {
    "en": "Widget",
    "fr": "Bidule"
  },
  "description": {
    "en": [
      "Compact",
      "Durable"
    ],
    "fr": [
      "Compact",
      "Résistant"
    ]
  }
}
```

A [`Local`](https://metreeca.github.io/qest/types/state.Local.html) map holds a single text value per language; a
[`Locals`](https://metreeca.github.io/qest/types/state.Locals.html) map holds multiple values per language. Plain
strings and string arrays are accepted as shorthands for language-neutral values, equivalent to tagging them with the [
`und`](https://iso639-3.sil.org/code/und) (Undetermined) language tag:

```js
({
    name: "Widget",              // equivalent to { und: "Widget" }
    tags: ["compact", "durable"] // equivalent to { und: ["compact", "durable"] }
});
```

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
  must be handled using the [`und`](https://iso639-3.sil.org/code/und) language tag or plain string / string array
  shorthands, which are equivalent to `{ und: value }`
- [index maps](https://www.w3.org/TR/json-ld11/#data-indexing) for key-indexed property values; indexed semantics must
  be signalled by application-provided `@context` declarations, as indexed values are otherwise indistinguishable from
  nested resources
- [IRI references](https://www.w3.org/TR/json-ld11/#node-identifiers) for linking resources across systems and domains;
  data structures require absolute IRIs; codec functions handle conversion to/from root-relative forms

# Support

- open an [issue](https://github.com/metreeca/qest/issues) to report a problem or to suggest a new feature
- start a [discussion](https://github.com/metreeca/qest/discussions) to ask a how-to question or to share an idea

# License

This project is licensed under the Apache 2.0 License –
see [LICENSE](https://github.com/metreeca/qest?tab=Apache-2.0-1-ov-file) file for details.
