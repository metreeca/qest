# @metreeca/qest

[![npm](https://img.shields.io/npm/v/@metreeca/qest)](https://www.npmjs.com/package/@metreeca/qest)

> [!WARNING]
>
> Work in proress…


Provides a type-safe data model for linked data resources represented using a controlled
subset of framed JSON-LD, ensuring compatibility with standard processors while providing:

- Validated IRI identifiers for resource references (RFC 3987)
- Validated Language tags for internationalization (BCP47)
- Embedded or referenced resource relationships

This serialization format simplifies front-end development by converting linked data descriptions
to/from idiomatic JSON objects structured according to the conventions a JavaScript developer would
expect from a typical REST/JSON API.

The format extends JSON-LD with an advanced query language for REST/JSON-LD APIs, enabling:

- Single-call retrieval of complex client-specified data envelopes
- Advanced filtering and aggregation capabilities supporting faceted search and analytics

These query extensions and client-defined envelopes enable rapid development of REST/JSON-LD APIs
functionally on par with GraphQL, while avoiding common GraphQL drawbacks:

- **Lower learning curve**: Built on familiar REST conventions and standard JSON
- **Minimal tooling**: No specialized client libraries, schema preprocessors, or code generators required
- **Simpler implementation**: Native TypeScript integration without complex resolvers or schema DSLs
- **Scales with complexity**: Simple CRUD remains simple, yet enables advanced deep fetching,
  filtering, and analytics when needed
- **Standard HTTP caching**: Works with CDNs and browser caches using standard GET requests
- **Natural REST versioning**: Standard URL-based versioning without field deprecation complexity
