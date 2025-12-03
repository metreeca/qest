---
title: JSON-LD 1.1 Documentation
summary: High-level map of JSON-LD 1.1 specifications
---

The [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) specification suite consists of three W3C Recommendations:

## [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)

Core specification defining JSON-LD syntax and data model as a labeled, directed graph.

- JSON-LD values: string, number, true/false, typed value, or language-tagged string
- Typed values use datatype IRIs
- JSON literals (`rdf:JSON`) preserve native JSON structures
- No explicit JSON-to-XSD datatype mapping

## [JSON-LD 1.1 Processing Algorithms and API](https://www.w3.org/TR/json-ld11-api/)

Processing algorithms and programmatic API.

- Numbers map to "long" or "double" based on fractional parts
- WebIDL type definitions for number specifications

## [JSON-LD 1.1 Framing](https://www.w3.org/TR/json-ld11-framing/)

Framing algorithm for reshaping JSON-LD documents.

For detailed technical comparison of JSON/JavaScript types with XSD datatypes, see
[datatypes.md](../src/datatypes.md).

# Context Definitions

JSON-LD uses the `@context` to map JSON properties to RDF predicates and define value types.

## Node Identifiers

The `@id` keyword identifies a node:

```json
{
  "id": "https://example.com/123",
  "@context": {
    "id": "@id"
  }
}
```

This maps the `id` property to JSON-LD's `@id` keyword, making it the node's identifier.

## Typed Literals

Properties can be mapped to XSD datatypes:

```json
{
  "boolean": {
    "@id": "https://example.com/terms#boolean",
    "@type": "http://www.w3.org/2001/XMLSchema#boolean"
  }
}
```

The `@type` specifies the datatype for literal values. See [datatypes.md](datatypes.md) for XSD datatype details.

## IRI References

Properties referencing other resources use `@type: "@id"`:

```json
{
  "forward": {
    "@id": "https://example.com/terms#forward",
    "@type": "@id"
  }
}
```

This indicates the property value is a resource IRI, not a typed literal string.

**Comparison with `xsd:anyURI`:**

- `@type: "@id"`: Creates a relationship to another resource (object is an IRI)
- `@type: "xsd:anyURI"`: Stores a URI as a typed literal string (object is a string)

**Note:** `@type: "@id"` indicates values are IRI references but does not specify the expected class of referenced
resources. Use RDFS `rdfs:range` or SHACL constraints in separate vocabulary definitions to document expected types.

## Reverse Properties

Reverse properties use `@reverse` to create inverse relationships:

```json
{
  "reverse": {
    "@reverse": "https://example.com/terms#reverse"
  }
}
```

**Generated RDF:**

```json
{
  "id": "https://example.com/123",
  "reverse": "https://example.com/456"
}
```

Produces:

```turtle
<https://example.com/456> <https://example.com/terms#reverse> <https://example.com/123> .
```

The subject and object are swapped - the value becomes the subject pointing back to the document's `id`.

**Important:** `@reverse` and `@id` are mutually exclusive in term definitions. Using both raises an `invalid reverse
property` error per the [Create Term Definition algorithm](https://www.w3.org/TR/json-ld11-api/#create-term-definition)
(step 13.1).

## Language Maps

Language maps enable multilingual text representation using BCP 47 (RFC 5646) language tags.

### Basic Language Tags

**Format:** Primary language subtag (ISO 639), optionally followed by region, script, or variant subtags.

**Common patterns:**

- Simple language: `en`, `it`, `de`, `fr`, `ja`
- Language with region: `en-US`, `en-GB`, `pt-BR`, `zh-CN`
- Language with script: `zh-Hans` (Simplified Chinese), `zh-Hant` (Traditional Chinese)

### Context Definition

Use `@container: "@language"` to define language maps:

```json
{
  "text": {
    "en": "one",
    "it": "uno",
    "de": "ein"
  },
  "@context": {
    "text": {
      "@id": "http://example.com/text",
      "@container": "@language"
    }
  }
}
```

**Generated RDF:**

```turtle
<subject> <http://example.com/text> "one"@en .
<subject> <http://example.com/text> "uno"@it .
<subject> <http://example.com/text> "ein"@de .
```

### Value Types

Language map values can be:

- **String**: Single value for a language
- **Array of strings**: Multiple values for the same language
- **`null`**: Explicitly no value

### Special Keys

**`@none` key:**

Values without language tags can be included using the `@none` key:

```json
{
  "text": {
    "@none": "no language",
    "en": "with language"
  },
  "@context": {
    "text": {
      "@id": "http://example.com/text",
      "@container": "@language"
    }
  }
}
```

**Generated RDF:**

```turtle
<subject> <http://example.com/text> "no language" .
<subject> <http://example.com/text> "with language"@en .
```

**Note:** The `@none` keyword is a special JSON-LD construct and cannot be substituted with an empty string `""` or any
other value. Empty strings are treated as (invalid) language tags, not as "no language tag".

**Note:** JSON-LD 1.1 supports text directionality via the `@direction` keyword (`"ltr"`, `"rtl"`) for proper rendering
of bidirectional text. This feature is not used in the current implementation.

## Datatype Maps

JSON-LD does not provide a container type for organizing typed literals by their XSD datatype.

**`@container: "@type"`** exists but only for organizing node objects by their class
([section 9.12](https://www.w3.org/TR/json-ld11/#type-maps)). Values must be node objects (JSON objects), not strings or
typed literals. Using strings violates the specification requirement that "the value must be a node object, or array of
node objects."

**Workaround:** Use separate properties with explicit `@type` definitions for different datatypes.

## Custom Annotations

The JSON-LD 1.1 specification does not explicitly define behavior for non-keyword properties in term definitions.

**Recognized keywords** per [section 9.15.1](https://www.w3.org/TR/json-ld11/#expanded-term-definition):
`@id`, `@reverse`, `@type`, `@container`, `@context`, `@language`, `@direction`, `@index`, `@prefix`, `@protected`,
`@propagate`

**Unrecognized properties:**
The [Create Term Definition algorithm](https://www.w3.org/TR/json-ld11-api/#create-term-definition) only processes
recognized keywords and includes no validation steps for additional properties. While most processors ignore extra
properties in practice, this is implementation behavior, not a specification guarantee.

# Sample

- hidden : boolean

- foreign : boolean
- embedded : boolean

- name : String
- description : String

- forward : Optional<URI>
- reverse : Optional<URI>

```json
{
  "id": "https://example.com/123",
  "boolean": true,
  "integer": 123,
  "decimal": 123.456,
  "string": "string",
  "uri": "https://example.com/123",
  "date": "2025-10-11",
  "text": {
    "en": "one",
    "it": "uno",
    "de": "ein"
  },
  "forward": "https://example.com/123",
  "reverse": "https://example.com/123",
  "object": {
    "id": "https://example.com/123"
  },
  "@context": {
    "id": "@id",
    "boolean": {
      "@id": "https://example.com/terms#boolean",
      "@type": "http://www.w3.org/2001/XMLSchema#boolean"
    },
    "integer": {
      "@id": "https://example.com/terms#integer",
      "@type": "http://www.w3.org/2001/XMLSchema#integer"
    },
    "decimal": {
      "@id": "https://example.com/terms#decimal",
      "@type": "http://www.w3.org/2001/XMLSchema#decimal"
    },
    "uri": {
      "@id": "https://example.com/terms#uri",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "string": {
      "@id": "https://example.com/terms#string",
      "@type": "http://www.w3.org/2001/XMLSchema#string"
    },
    "date": {
      "@id": "https://example.com/terms#date",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "text": {
      "@id": "https://example.com/terms#text",
      "@container": "@language"
    },
    "forward": {
      "@id": "https://example.com/terms#forward",
      "@type": "@id"
    },
    "reverse": {
      "@reverse": "https://example.com/terms#reverse"
    },
    "object": {
      "@id": "https://example.com/terms#object",
      "@type": "@id"
    }
  }
}
```
