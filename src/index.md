---
title: "QEST: Queryable REST/JSON APIs"
summary: A REST/JSON data model and client-driven template language for retrieval, filtering, and aggregation
description: |
  Defines a JSON data model and a client-driven retrieval protocol for REST/JSON APIs. A uniform JSON payload,
  including localised text, carries resources through the standard create, read, update, and delete operations, while
  client-driven templates add retrieval, collection filtering, sorting, pagination, and computed projections, without
  requiring specialised client libraries or departing from standard HTTP caching semantics.
---

# Abstract

This document specifies a data model and a client-driven retrieval protocol for REST/JSON APIs. The data model defines a
JSON-LD-based resource representation that serves as the uniform payload across the standard create, read, update, and
delete (CRUD) operations of HTTP. On top of this baseline, the protocol defines a JSON-based template language that
allows clients to specify which properties to retrieve from a resource, how deeply to expand linked resources, and, for
collections, how to filter, sort, paginate, and aggregate results. The template is transmitted as a URL-encoded JSON
object in the query string of a standard HTTP GET request, preserving compatibility with content delivery networks
(CDNs) and browser caches.

The data model is grounded in JSON-LD 1.1 [W3C.REC-json-ld11] but constrains JSON-LD to a controlled subset that looks
and feels like plain idiomatic JSON, requiring no specialised client libraries, preprocessors, or code generators.

# Status of This Memo

This Internet-Draft, `draft-qest-00`, is submitted in full conformance with the provisions of BCP 78 and BCP 79. Its
intended status is Experimental.

Internet-Drafts are working documents of the Internet Engineering Task Force (IETF). Note that other groups may also
distribute working documents as Internet-Drafts. The list of current Internet-Drafts is at
https://datatracker.ietf.org/drafts/current/.

Internet-Drafts are draft documents valid for a maximum of six months and may be updated, replaced, or obsoleted by
other documents at any time. It is inappropriate to use Internet-Drafts as reference material or to cite them other than
as "work in progress."

This Internet-Draft will expire on 8 December 2026.

# Copyright Notice

Copyright (c) 2026 IETF Trust and the persons identified as the document authors. All rights reserved.

This document is subject to BCP 78 and the IETF Trust's Legal Provisions Relating to IETF Documents
(https://trustee.ietf.org/license-info) in effect on the date of publication of this document. Please review these
documents carefully, as they describe your rights and restrictions with respect to this document. Code Components
extracted from this document must include Revised BSD License text as described in Section 4.e of the Trust Legal
Provisions and are provided without warranty as described in the Revised BSD License.

# Table of Contents

- [1. Introduction](#1-introduction)
- [2. Conventions and Terminology](#2-conventions-and-terminology)
- [3. Type System](#3-type-system)
- [4. State Representation](#4-state-representation)
- [5. Client-Driven Retrieval](#5-client-driven-retrieval)
- [6. Localised Retrieval](#6-localised-retrieval)
- [7. IANA Considerations](#7-iana-considerations)
- [8. Security Considerations](#8-security-considerations)
- [9. References](#9-references)
- [Appendix A. Target Backends](#appendix-a-target-backends)
- [Author's Address](#authors-address)

# 1. Introduction

REST/JSON APIs carry resources through create, read, update, and delete (CRUD) operations over HTTP. Building on that
standard baseline, this specification adds what vanilla REST/JSON lacks: a standard, portable mechanism for clients to
control the shape and scope of the responses they read back. Without one, clients must either accept fixed
server-defined payloads, leading to over-fetching of unwanted fields and under-fetching that requires additional round
trips, or rely on ad-hoc, non-portable query parameters.

This specification defines a **data model** and a **template language** that together address these limitations while
remaining within standard REST/JSON conventions:

- **Uniform payload**: a single JSON resource representation serves as the request and response body across create,
  read, update, and delete operations
- **Client-driven retrieval**: clients specify exactly which properties to retrieve and how deeply to expand linked
  resources
- **Collection querying**: advanced filtering, sorting, pagination, computed projections, and aggregation, supporting
  faceted search and analytics
- **Localised content**: full support for localised content with language-tagged text maps

## 1.1. Design Goals

- **Familiarity**: standard REST and JSON conventions; no new paradigms
- **Simplicity**: plain JSON serves as both the query and the response format
- **No tooling**: no specialised libraries, preprocessors, or code generators required
- **Automation**: model-driven development, reducing server implementation effort
- **Cacheability**: templates transmitted as GET query strings, fully compatible with CDN and browser caches
- **Portability**: backend-agnostic operators with semantics defined by XPath 2.0 [W3C.REC-xpath-functions], chosen so
  each has a well-defined counterpart across representative target backends (SQL:2011 [ISO.9075.2011], GQL:2024
  [ISO.39075.2024], and SPARQL 1.1 [W3C.REC-sparql11-query])

## 1.2. JSON-LD Foundations

The data model is grounded in JSON-LD 1.1 [W3C.REC-json-ld11], constrained to a controlled subset that looks and feels
like idiomatic JSON: compacted form, identifier property names, native JSON values, language maps, and IRI references.
Its value type system derives from XML Schema Definition (XSD) 1.0 [W3C.REC-xmlschema-2] and XPath 2.0
[W3C.REC-xpath-functions], the same foundation referenced by SPARQL 1.1 [W3C.REC-sparql11-query]. Section 3 specifies
this subset normatively.

## 1.3. REST/JSON Operations

Resources are exchanged as a uniform `application/json` payload over the standard REST verbs of HTTP [RFC9110]:
creation (POST), retrieval (GET), update (PUT), and deletion (DELETE).

The default media type is the generic `application/json`. This specification deliberately defines no media type, profile
parameter, or structured suffix of its own, so standard JSON tooling, content negotiation, and HTTP caches apply
unchanged.

In responses, servers MAY alternatively use the JSON-LD media type `application/ld+json` [W3C.REC-json-ld11], including
an `@context` derived from the internal data model. Servers MUST reject JSON-LD request payloads: all processing is
driven by the internal data model, not by client-supplied mappings.

| Method | Payload  | Description                    |
|--------|----------|--------------------------------|
| GET    | resource | Resource retrieval             |
| POST   | resource | Resource creation              |
| PUT    | resource | Complete resource state update |
| DELETE | -        | Resource deletion              |

Each verb targets a resource by its request URL, with POST targeting the owning collection. HTTP defines the operation
semantics, status codes, and content negotiation; this specification adds only how payloads are interpreted (the data
model, Section 4) and how responses are shaped (client-driven retrieval templates, Section 5). Processors MUST validate
every resource payload they accept against the data model (Section 4).

Response status codes follow HTTP [RFC9110]. Servers SHOULD use the following codes for the conditions this document
defines:

| Condition                                        | Status                            |
|--------------------------------------------------|-----------------------------------|
| Successful retrieval                             | `200 OK`                          |
| Malformed request payload                        | `400 Bad Request`                 |
| Validation failure (Sections 3, 4, and 5)        | `422 Unprocessable Content`       |
| Outside the client's authorisation (Section 8.2) | `403 Forbidden` / `404 Not Found` |
| Over-long encoded template (Section 5)           | `414 URI Too Long`                |

A validation failure SHOULD carry a problem-details payload [RFC9457] including a machine-readable error trace, subject
to the disclosure limits of Section 8.2.

A **retrieval request** is a standard HTTP GET whose query component carries the template, encoded as described in
Section 5. The template is optional: a GET without one returns the server's default representation of the target
resource (Section 5). When a template is present, the response is a resource (Section 4) shaped to it: it contains
exactly the requested properties, with linked resources expanded and everything else omitted. A requested property
resolving to no value is itself omitted, never surfaced as an empty structure (Section 4). For collections, the results
are filtered, sorted, paginated, and aggregated as specified. Because the template travels in the query string of a GET,
retrieval remains safe, idempotent, and cacheable by CDNs and browser caches [RFC9110].

For example, a collection query that selects four item properties, filters by price, sorts ascending, and limits the
page to twenty-five items is issued as a single GET request:

```text
GET /products/?%7B%22items%22%3A%5B%7B%22id%22%3A%22%22%2C%22name%22%3A%22%22%2C%22price%22%3A0
  %2C%22vendor%22%3A%7B%22id%22%3A%22%22%2C%22name%22%3A%22%22%7D%7D%2C%7B%22%3E%3Dprice%22%3A50
  %2C%22%3C%3Dprice%22%3A150%2C%22%5Eprice%22%3A%22asc%22%2C%22%23%22%3A25%7D%5D%7D
```

whose query string decodes to the template:

```json
{
  "items": [
    {
      "id": "",
      "name": "",
      "price": 0,
      "vendor": {
        "id": "",
        "name": ""
      }
    },
    {
      ">=price": 50,
      "<=price": 150,
      "^price": "asc",
      "#": 25
    }
  ]
}
```

and yields a response like:

```json
{
  "items": [
    {
      "id": "https://example.com/products/456",
      "name": "Gadget",
      "price": 59.99,
      "vendor": {
        "id": "https://example.com/vendors/145",
        "name": "Acme"
      }
    },
    {
      "id": "https://example.com/products/123",
      "name": "Widget",
      "price": 99.99,
      "vendor": {
        "id": "https://example.com/vendors/145",
        "name": "Acme"
      }
    },
    {
      "id": "https://example.com/products/789",
      "name": "Gizmo",
      "price": 129.99,
      "vendor": {
        "id": "https://example.com/vendors/236",
        "name": "Globex"
      }
    }
  ]
}
```

# 2. Conventions and Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT
RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174]
when, and only when, they appear in all capitals, as shown here.

The data model is defined normatively in CDDL [RFC8610] and the textual micro-syntaxes in ABNF [RFC5234], over JSON
values [RFC8259]. These grammars are normative; any accompanying reference-implementation type definitions are not.

The following terms are used throughout this document:

- **processor**: an engine, typically model-driven, that validates and processes payloads and templates per this
  specification
- **server**: the HTTP endpoint hosting a processor, responsible for request handling and response generation
- **IRI**: Internationalized Resource Identifier as defined in [RFC3987]
- **identifier**: a property name conforming to ECMAScript identifier rules [ECMA-262], Section 12.7
- **literal**: a JSON primitive value (`boolean`, `number`, `string`)
- **reference**: an absolute IRI string identifying a linked resource without nesting its state
- **resource**: a JSON object describing the state of an identifiable or nested entity
- **value**: a single value held by a property: a literal, a reference, or a nested resource
- **value set**: a property's content: a single value, a localised text map, or an array of values (set semantics)
- **localised text**: a language map associating BCP 47 [RFC5646] language tags with text values
- **coalesced label**: the plain string, or array of plain strings, that a localised text property reduces to under
  language negotiation (Section 6), of corresponding cardinality
- **expected type**: the out-of-band declaration of a property's type and cardinality (Section 3.1)
- **effective type**: the type an expression resolves to (Section 5.8), derived from its path and pipe. It may combine
  several branch types in a form that no single expected type (Section 3.1) could express
- **undefined**: the result of resolving an expression, path, or transform (Section 5.8) to no value; an absent value
  (Section 4.2) resolves to `undefined`
- **template**: a JSON object specifying which properties to retrieve from a resource
- **placeholder**: a template value standing in for a property value, signalling its expected type rather than carrying
  retrieved data. Its value is immaterial and need not be a legal value of that type; only its kind (literal, reference,
  or template) matters, matching it to the type-compatible variants of a union-typed property (Section 5.4)
- **selection**: a set of constraints (filtering, sorting, pagination) applied to a collection
- **expression**: a property path, optionally piped through transforms, targeted by selection and projection keys
- **binding**: a projection key naming a computed expression (a plain identifier, or `name=expression`)
- **projection**: a template whose keys are computed bindings

# 3. Type System

REST/JSON payloads (Section 1.3) carry values as JSON [RFC8259] primitives, whose coarse kinds alone cannot drive
processing: comparison (Section 5.7.1) and sorting (Section 5.7.5) need a defined ordering, and transforms (Section
5.8.2) need defined input domains and output ranges, neither of which a JSON kind alone supplies.

To meet those needs, this specification defines a minimal processing type system, grounded in the value spaces of XSD
1.0 [W3C.REC-xmlschema-2] and the operators and functions of XPath 2.0 [W3C.REC-xpath-functions]: processors map each
payload value to the processing type system before any relevant operation is performed (**ingress**) and map the result
back before returning it (**egress**).

| Payload (JSON) | Processing (XSD)                                    |
|----------------|-----------------------------------------------------|
| `boolean`      | `xsd:boolean`                                       |
| `number`       | `xsd:double` (ingress default)                      |
|                | `xsd:float`                                         |
|                | `xsd:integer`                                       |
|                | `xsd:decimal`                                       |
|                | `numeric` (any XSD numeric datatype)                |
| `string`       | `xsd:string` (ingress default)                      |
|                | `temporal` (`xsd:dateTime`, `xsd:date`, `xsd:time`) |

References and localised text are not mapped into the processing space: a reference participates only in equality
matching (Section 5.7.3), and localised text is matched per tag (Section 5.7.3) or coalesced to a plain string or array
of plain strings (Section 6)
before any operation applies.

The `temporal` type comprises the point-in-time datatypes that are component-extractable and totally ordered (the latter
under XPath 2.0's implicit-timezone comparison) over the shared XSD 1.0 / XPath 2.0 basis of the target backends
(Appendix A.1.1). The other XSD 1.0 temporal datatypes, `xsd:duration` and the Gregorian partials (`xsd:gYearMonth`,
`xsd:gYear`, `xsd:gMonthDay`, `xsd:gMonth`, `xsd:gDay`), are not processing types, and neither are the temporal
datatypes added by XSD 1.1, such as `xsd:dateTimeStamp`, which lie outside this XSD 1.0 basis entirely; such a value, if
carried, is treated as an opaque `xsd:string` (equality and set matching only).

## 3.1. Expected Types

Processors resolve payloads and templates against the **expected type** of each property they process. A property's
expected type is one of:

- one or more **variants**, each a processing type, optionally narrowed to a sub-domain of its values, a reference, or a
  nested resource; a property with several variants is **union-typed**, its variants expected to be disjoint and
  resolved per branch by matching, not by position (Section 5.4);
- **localised text** (Section 4.3), together with its per-tag shape, a single string or an array per tag; localised text
  is a whole-property type, not one of a property's declared variants, though a path may resolve to it per branch
  downstream of a union-typed step (Section 5.8.1).

Alongside its type, each property carries an expected **cardinality**, single- or multi-valued.

Two regimes resolve a value against the variants, according to whether it carries content:

- a **data value**, whether a state value on ingress (Section 3.2) or a selection bound or option (Section 5.7), carries
  actual content and, the variants being disjoint, MUST match exactly one. Matching tests value-domain membership, so
  variants narrowed within a single processing type are told apart by value, not by type alone, and the matched variant
  fixes the value's processing type (Section 3.2). A value matching no variant is **unsatisfiable**, one matching
  several is **ambiguous**, and processors MUST reject either wherever this specification calls for such a match (
  Sections 3.2 and 5.7);
- a **template placeholder** (Sections 5.2 and 5.4) carries no content, its value immaterial. It matches a variant by
  type compatibility alone, a literal or reference by processing kind and a nested template by structure (Section 5.4);
  any value-domain narrowing on the variant (Section 3.1) is ignored, and the placeholder need not be a legal value. It
  matches every type-compatible variant and MAY match more than one, retrieving each. Like a data value, it MUST match
  at least one variant: one matching none is **unsatisfiable** and MUST be rejected, and a union placeholder (Section
  5.4) applies this to each of its alternatives.

Disjointness is a property of the declared variants, supplied out of band like the variants themselves, and adds no
conformance requirement of its own; a processor that observes a multiple match of a data value at runtime reports it as
ambiguous.

Expected types are supplied out of band, whether declared by a static property schema or derived dynamically by the
application; this specification constrains neither their source nor their provisioning, and they add no conformance
requirement of their own. They are definitional: the rules that reference an expected or declared characteristic, among
them ingress mapping (Section 3.2), placeholder matching (Section 5.2), locale classification (Section 5.3), union
retrieval (Section 5.4), collection queries (Section 5.5), selection (Section 5.7), and path resolution (Section 5.8.1),
are evaluated against them, and a property without an expected type is unknown (Section 5.8.1).

## 3.2. Ingress Mapping

A `boolean` maps to `xsd:boolean`. A `number` maps to `xsd:double` and a `string` to `xsd:string`, unless a more
specific processing type is expected for the value (Section 3.1).

A value that cannot be represented as the processing type expected for it, such as a literal whose JSON kind does not
match or a string that is not a valid lexical form of the expected temporal type, is malformed and MUST be rejected by
processors.

Over a union-typed property (Section 3.1), the value is matched against the variants and mapped to the one it singles
out. Since the variants are expected disjoint, the value matches at most one: a value matching no variant is
unsatisfiable and a value matching several is ambiguous, and processors MUST reject either (Section 3.1). The variant
the value singles out fixes its processing type, so the same matching that admits the value also casts it.

JSON [RFC8259] guarantees number interoperability only within IEEE 754 double precision, and this specification adopts
that interoperable range as the transport number space, so mapping a `number` to `xsd:double` preserves every
interoperable value. This mapping is defined by this specification and is independent of JSON-LD value conversion, which
assigns `xsd:integer` to integer-valued numbers; the two agree on ordering over that range, because such an integer and
its double promotion compare equal.

## 3.3. Egress Mapping

Every processing type maps to the transport type heading its group (`xsd:boolean`, `xsd:double`, or `xsd:string`). The
mapping is many-to-one; the processing-space distinctions are not preserved on the wire.

## 3.4. Extended Mappings

Processors MAY recognise processing types beyond the defaults of this section. Both mappings account for such an
extension: ingress (Section 3.2) selects the extended type for an incoming value when one is expected (Section 3.1), and
egress (Section 3.3) returns it to the transport type heading its group. The same mechanism MAY serve beyond the
retrieval operations defined here, for example, to validate a request payload against the expected type of each
property, or to persist values in a natively typed store. These are implementation capabilities; they impose no
additional conformance requirement and do not change the surfaced transport type set.

# 4. State Representation

The data model defines the JSON representation of a resource: its property structure, value types, and linking, together
with the JSON-LD subset and IRI conventions that constrain it. The same JSON surface syntax underlies both the resource
payloads of the REST operations (Section 1.3) and the retrieval templates of the query layer (Section 5): property keys
are ECMAScript identifiers; values are JSON primitives, nested objects, or arrays thereof.

The following CDDL [RFC8610] grammar is the data model's normative definition; the subsections below elaborate it in
prose.

```cddl
resource   = { * identifier => values }

values     = value / text / [* value]
value      = literal / reference / resource

literal    = bool / number / tstr
reference  = tstr   ; absolute IRI [RFC3987]

text       = { * tag => tstr } / { * tag => [* tstr] }

identifier = tstr   ; ECMAScript IdentifierName [ECMA-262]
tag        = tstr   ; BCP 47 language tag [RFC5646]
```

Within a single `text` map the values are uniformly `tstr` or uniformly `[* tstr]`.

An empty object (`{}`) carries no content, whether an empty nested resource or an empty `text` map; likewise an empty
array. Processors MUST ignore such a value: drop it where it appears as an array element or as a tag's value in a
`text` map, and otherwise treat the owning property as omitted (set semantics). Encoders MUST NOT emit one: a value set
resolving to no content, whatever its form, is never surfaced as an empty array, `text` map, or object; the owning
property is omitted from the document instead.

This data model is a controlled subset of JSON-LD 1.1 [W3C.REC-json-ld11], constraining JSON-LD to patterns that read as
plain idiomatic JSON, so no JSON-LD processor, preprocessor, or code generator is required. Conforming documents MUST
satisfy the following constraints:

1. Documents MUST be in compacted form [W3C.REC-json-ld11], Section 6
2. Property names MUST be valid ECMAScript identifiers [ECMA-262], Section 12.7
3. JSON-LD keywords (`@id`, `@type`, etc.) MUST NOT appear directly; they MUST be mapped to identifiers via an
   application-provided `@context` (for example, `"id": "@id"`)
4. Typed literals with arbitrary datatypes MUST NOT be used; structured values (dates, times) MUST be represented as
   strings, with datatype coercion declared in `@context`
5. Localised text is represented as JSON-LD language maps, declared with `"@container": "@language"` in `@context`; the
   `@none` language MUST NOT be used; `und` or `zxx` is used instead (Section 4.3)

A property mapped to `@type` carries class references, so its expected type (Section 3.1) is `reference`. Such a
property is commonly system-managed, derived from the expected model rather than supplied by clients; this provenance
does not alter its retrieval semantics. It is an ordinary reference-typed property and MAY be targeted by the
equality-based selection constraints, set matching (Section 5.7.3) and sort focus (Section 5.7.4), like any other
reference.

## 4.1. Resource

A resource is a property map where each property holds a **value set**. Resources MAY include a property mapped to `@id`
in the application-defined JSON-LD `@context`, identifying the resource globally; a resource without such a property is
anonymous.

```json
{
  "id": "https://example.com/products/42",
  "name": "Widget",
  "category": "Electronics",
  "tags": [
    "gadget",
    "featured"
  ],
  "vendor": "https://example.com/vendors/456",
  "price": 99.99,
  "inStock": true
}
```

## 4.2. Values

Each property holds a **value set**: a single value, a localised text map (Section 4.3), or an array of values. Arrays
follow set semantics: duplicate values are ignored, ordering is immaterial, and empty arrays are treated as absent
values. Element types within an array MAY be mixed.

A **value** is one of:

- **literal**: a JSON primitive (`boolean`, `number`, `string`)
- **reference**: an absolute IRI identifying a linked resource
- **resource**: a nested resource object

A **reference** carries only the linked resource's IRI; a nested **resource** carries its state inline. The two are
interchangeable ways to link. Resource identifiers and cross-resource links are absolute IRIs [RFC3987]; they MAY be
transmitted in relative form, and decoders MUST resolve them against a base IRI that defaults to `app:/`, so a decoded
reference is always absolute. Encoders MAY in turn relativise the IRIs of a response payload against the same base; in
that case they SHOULD prefer the root-relative form.

IRI reference (compact form):

```json
{
  "id": "https://example.com/products/42",
  "vendor": "https://example.com/vendors/456"
}
```

Nested description (expanded form):

```json
{
  "id": "https://example.com/products/42",
  "vendor": {
    "id": "https://example.com/vendors/456",
    "name": "Acme Corp"
  }
}
```

## 4.3. Text

Resource properties MAY hold localised text using language maps, which map BCP 47 [RFC5646] language tags to text
values. Within a single map, all values MUST be uniformly scalar or uniformly array; processors MUST reject mixed
content.

The `@none` key for non-localised values MUST NOT be used. Use the `und` (Undetermined) tag [ISO639-3.und] when the
language is unspecified, for example a proper name; use the `zxx` (No linguistic content) tag [ISO639-3.zxx] for values
that carry no language at all, such as identifiers, codes, or formulae.

A localised property can be addressed in two ways: **structurally**, preserving its language tags, or **coalesced** to a
plain string, or array of plain strings of corresponding cardinality, under language negotiation (Section 6).

```json
{
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
      "Resistant"
    ]
  }
}
```

# 5. Client-Driven Retrieval

Clients control the shape and scope of what they read back through JSON templates: which properties to retrieve, how
deeply to expand linked resources, and, for collections, how to filter, sort, paginate, and aggregate.

Client-driven retrieval is fully optional. Servers MUST provide defaults, typically derived from the expected types
(Section 3.1), preserving standard REST/JSON behaviour while enabling advanced capabilities when needed.

The query component of the GET request URL carries either a retrieval template (Section 5.1) or a selection
(Section 5.7). A template MUST use a URL-safe JSON encoding, either URL-encoded or base64url-encoded [RFC4648] JSON; the
plain JSON form is reserved for transmission off the query string, such as a POST body. A selection uses the
form-urlencoded [WHATWG.URL] shorthand detailed below. The decoder MUST auto-detect both which variant is present and,
for a template, its input encoding. The decoded result, like every payload, MUST be validated. Reference values, in
resource payloads and selections alike, MAY be transmitted in relative form; decoders MUST resolve them against the base
IRI (Section 4.2), so a decoded reference is always an absolute IRI. Encoders MAY in turn relativise the references of a
response payload, in which case the root-relative form SHOULD be preferred (Section 4.2).

A localised text property (Section 4.3) coalesces to a plain string, or array of plain strings of corresponding
cardinality, under language negotiation (Section 6). A plain string MUST therefore be accepted wherever such a property
is targeted, in a retrieval template (Section 5.1) as the placeholder for its coalesced value (Section 5.3), and in a
selection (Section 5.7) as an operand, including as an option value (Sections 5.7.3 and 5.7.4); the coalesced value is
then matched under ordinary string semantics, a multi-valued one existentially. A sort key (Section 5.7.5) targeting a
single-valued coalesced property MUST likewise be accepted, ordering by the coalesced string; localised text is never
ordered in any other form.

URL-encoded templates are subject to practical URL length limits; servers SHOULD document their maximum accepted query
string length and return `414 URI Too Long` when it is exceeded, and MAY accept an over-long template via POST with an
appropriate content type instead.

When a request query component carries a selection, the server synthesises a retrieval template for it:

1. the selection is decoded;
2. the endpoint's **default collection property** is identified as the single multi-valued property expected of the
   endpoint resource (Section 3.1); if the resource has no multi-valued property, or more than one, the request MUST be
   rejected;
3. a collection query (Section 5.5) is formed by pairing the server's default per-item template for that property with
   the decoded selection;
4. the query is wrapped in a template keyed by the collection property: `{ <collection-property>: [ <item-template>,
   <selection> ] }`.

The following elision rules then apply to the synthesised template. This fallback applies only at the request target;
nested templates have none.

An empty object (`{}`) as a template element carries no retrieval instructions and MUST be ignored, as if the owning
property were omitted: this elides an empty **template** (Section 5.1), an empty **union** (Section 5.4; no variants, or
all reducing to empty templates), an empty **locale** (Section 5.3; no tag ranges), and an empty **selection**
(Section 5.7; no constraints). A selection has nothing to apply to once its element is empty, so a tuple carrying only a
selection discards that selection as well.

The query string's formal syntax is defined in ABNF [RFC5234]:

```abnf
; query string (the request entry point; Section 5)

query           = template / selection  ; the decoder auto-detects the variant

; template variant: a `template` (CDDL below) serialised as JSON [RFC8259],
; then made URL-safe by percent- or base64url-encoding

template        = <URL-safe JSON encoding of template, Section 5>

; selection variant: form-urlencoded [WHATWG.URL] constraints

selection       = [ entry ] *( "&" [ entry ] )

entry           = lt / gt / lte / gte
                / like / any / all
                / focus / order
                / offset / limit

lt              = "<" expression "=" literal
gt              = ">" expression "=" literal
lte             = "<=" expression "=" literal / expression "<=" literal
gte             = ">=" expression "=" literal / expression ">=" literal
like            = "~" expression "=" string
any             = "?" expression "=" value / expression "=" value
all             = "!" expression "=" value
focus           = "+" expression "=" value
order           = "^" expression "=" ( "asc" / "desc" / [ "-" ] 1*DIGIT )
offset          = "@" "=" 1*DIGIT
limit           = "#" "=" 1*DIGIT

; value forms, classifying the text after "=" in each "&"-separated entry:

value           = option / tagged
option          = "null" / literal / reference
literal         = boolean / number / string
boolean         = <JSON boolean, [RFC8259]>
number          = <JSON number, [RFC8259]>
string          = quoted / unquoted
quoted          = <double-quoted JSON string, [RFC8259]>
unquoted        = <an unquoted text that is not "null", a boolean, or a number; its text is the string>
reference       = string   ; IRI reference [RFC3987], resolved against the base IRI (Section 4.2)
tagged          = string "@" tag   ; tag split from the right; quote the base to embed a literal "@"
tag             = <BCP 47 language tag, [RFC5646]>
```

Both variants decode into the **template structures**, defined in CDDL [RFC8610] (reusing `literal`, `reference`,
`text`, and `identifier` from the data model, Section 4):

```cddl
template     = { * identifier => placeholders }

placeholders = model / query
placeholder  = literal / iri / template

model        = union / placeholder / locale
query        = [ union, ? selection ] / [ placeholder, ? selection ] / [ projection, ? selection ]

locale       = { * tag-range => tstr } / { * tag-range => [ tstr ] }
union        = { * slot => placeholder / locale }

projection   = { * binding => model }

selection    = {
  * lt         => literal,                   ; <
  * gt         => literal,                   ; >
  * lte        => literal,                   ; <=
  * gte        => literal,                   ; >=
  * like       => tstr,                      ; ~
  * any        => options,                   ; ?
  * all        => options,                   ; !
  * focus      => options,                   ; +
  * order      => "asc" / "desc" / int,      ; ^
  ? offset     => number,                    ; @
  ? limit      => number                     ; #
}

; the *-key syntaxes are defined in the ABNF below

lt         = tstr   ; lt-key
gt         = tstr   ; gt-key
lte        = tstr   ; lte-key
gte        = tstr   ; gte-key
like       = tstr   ; like-key
any        = tstr   ; any-key
all        = tstr   ; all-key
focus      = tstr   ; focus-key
order      = tstr   ; order-key

offset     = "@"    ; literal
limit      = "#"    ; literal

options    = option / text / [* option]
option     = null / literal / reference

iri        = tstr   ; IRI reference [RFC3987], relative or absolute (Section 5.2)
tag-range  = tstr   ; RFC 4647 basic language range [RFC4647] (Section 5.3)
slot       = tstr   ; opaque Union key: a non-negative integer string (Section 5.4)
binding    = tstr   ; see ABNF below
```

A selector key is an operator prefix followed by an expression, the prefix fixing the value type per the `selection`
group above; the pagination keys `@` and `#` are literals, not selectors. The textual micro-syntaxes are defined in
ABNF:

```abnf
; selector keys (selection map keys)

lt-key         = "<" expression
gt-key         = ">" expression
lte-key        = "<=" expression
gte-key        = ">=" expression
like-key       = "~" expression
any-key        = "?" expression
all-key        = "!" expression
focus-key      = "+" expression
order-key      = "^" expression

; bindings and expressions (projection keys; Section 5.6, Section 5.8)

binding        = name [ "=" expression ]
name           = identifier

expression     = pipe path
pipe           = *( transform ":" )
path           = [ property *( "." property ) ]
property       = identifier
transform      = identifier

identifier     = <ECMAScript IdentifierName, [ECMA-262], Section 12.7>
```

A selection's form-urlencoded shorthand serialises the grammar above as `label=value` pairs, where labels are the
prefixed selector keys (Section 5.7). This is a convenience for readable URLs, covering the common selection constraints
rather than the full template grammar; a selection it cannot express is carried in the JSON template form instead. The
shorthand observes the following rules:

- An option-set operator (`?`, `!`, `+`) MAY be repeated, collecting its values into a set; any other operator MUST be
  rejected if repeated.
- Within an option set, plain options and tagged (localised) values MUST NOT be mixed; a mixed set MUST be rejected.
- The prefixed key is **canonical**; the infix forms are readable shorthands for it: `expression=value` for
  `?expression=value`, and `expression<=value` / `expression>=value` for `<=expression` / `>=expression`. Strict `<`
  and `>` are prefixed-only.
- Operator characters stay literal when query-safe in [RFC3986] and inert in form-urlencoding (`~`, `?`, `!`, `@`); the
  rest are percent-encoded (`^` `%5E`, `<` `%3C`, `>` `%3E`, `#` `%23`, and `+` `%2B`, which form-urlencoding would
  otherwise decode as a space), as are the reserved value characters `&`, `=`, `+`, `%`; this encoding is for transport
  safety only, and a decoder SHOULD parse leniently, accepting them unencoded too.

The example below filters items where `category` is "electronics" or "home", `name` contains "widget", `price` is
between 50 and 150 inclusive, sorts by `price` ascending, and returns the first 25 items (label operators shown in
decoded form for readability):

```text
category=electronics
  &category=home
  &~name=widget
  &price>=50
  &price<=150
  &^price=asc
  &@=0
  &#=25
```

## 5.1. Template

A **template** is a JSON object specifying which properties to retrieve from a resource and how deeply to expand linked
resources.

Template properties use **placeholder values** (Section 5.2) that indicate the expected type. The value of a literal
placeholder is never returned and is immaterial: it need not be a legal value of the property's type, only its kind
matters, matching a single-type property of that kind and, for a union-typed property (Section 5.4), every variant of
that kind. A nested object is instead a template in its own right, whose structure does matter: it selects the
properties of the linked resource to expand and, over a union-typed property, matches the variants it structurally
fits (Section 5.4); an empty one is elided (Section 5).

```text
GET /products/42?{url-encoded-template}
```

Template:

```json
{
  "id": "",
  "name": "",
  "price": 0,
  "vendor": {
    "id": "",
    "name": ""
  }
}
```

Response:

```json
{
  "id": "https://example.com/products/42",
  "name": "Widget",
  "price": 99.99,
  "vendor": {
    "id": "https://example.com/vendors/456",
    "name": "Acme Corp"
  }
}
```

The response includes only the requested properties, with the linked `vendor` expanded to show only `id` and `name`.

## 5.2. Placeholders

A **placeholder** stands in for one property value:

- **Literal placeholder**: `boolean`, `number`, or `string`, requesting a primitive value
- **Reference placeholder**: a relative IRI reference [RFC3987], requesting a linked resource identifier (Section 4.2)
- **Template placeholder**: a nested object (Section 5.1), requesting inline expansion of the linked resource

A placeholder's value is immaterial and need not lie within the expected value domain (Section 3.1); only its kind
matters. A placeholder MUST, by kind, match at least one variant of its property; one matching none can return nothing
and is unsatisfiable, and MUST be rejected, as a data value is (Sections 3.2 and 5.7).

A placeholder stands for data and never carries it back: its value is never returned and is immaterial. A literal
placeholder need not be a legal value of its property's type; only its kind matters, and over a union-typed property
that kind is what matches it to a variant (Section 5.4), a single-type property admitting any value of the kind. A
reference or template placeholder likewise conveys only its kind. A string matches a reference variant only when it
satisfies the `IRI-reference` production of [RFC3987], which admits the empty string together with the relative,
root-relative, and absolute forms, excluding only a string that could not reference a resource; a string outside it
matches no reference variant. Reference values proper, the options and operands of a selection
(Section 5.7), are instead resolved on decoding (Section 5) and are absolute thereafter.

The placeholder for a multi-valued property is a tuple, whose array form signals multi-valued cardinality. The first
element is the per-item template; an optional second element is a collection-wide selection (Section 5.7) that filters,
sorts, and paginates the property's values. Runtime validators MUST accept a one- or two-element tuple and reject arrays
of any other length.

```json
{
  "tags": [
    ""
  ],
  "categories": [
    {
      "id": "",
      "name": ""
    }
  ]
}
```

## 5.3. Locale

Tag-range keys [RFC4647] select which locales to retrieve. A tag-range key MUST be a basic language range
[RFC4647] (Section 2.1): a sequence of subtags, or the standalone `*` wildcard. Extended language ranges
[RFC4647] (Section 2.2), carrying `*` in a leading, interior, or trailing subtag position (for example `de-*`
or `*-CH`), MUST be rejected; under the basic filtering used here they add no matching power over their basic prefix,
and a processor MUST NOT attempt to interpret them.

The placeholder returns the subset of the property's localised text map (Section 4.3) matching the ranges by RFC 4647
basic **filtering** (Section 3.3.1; all matching tags) rather than **lookup** (a single best match), as a structured
map. Each tag-range value is itself a placeholder typed to the expected result: a string where the property holds one
value per tag, or a single-element array where it holds several (Section 4.3). Only the type matters, so the array
carries exactly one element.

A localised property MAY also be retrieved through a plain string placeholder, yielding its **coalesced label**
(Section 6): the value or values resolved by the request's negotiated language priority (Section 6.1). The placeholder
takes the ordinary string shape for the property's per-tag cardinality (Sections 5.2 and 4.3); processors MUST reject a
mismatch in either direction (Section 5.2). The tag-range map yields the full structure instead.

A locale is not syntactically disjoint from a nested template, since a tag-range such as `en` is also a valid property
identifier; processors classify the object by the targeted property's expected type (Section 3.1): a locale over a
localised property (Section 4.3) and a template (Section 5.1) otherwise.

```json
{
  "title": {
    "*": ""
  },
  "description": {
    "en": "",
    "fr": ""
  },
  "keywords": {
    "en": [
      ""
    ],
    "fr": [
      ""
    ]
  }
}
```

## 5.4. Union

For union-typed properties (Section 3.1), per-branch retrieval is expressed through a keyed object form whose values are
the per-branch placeholders, each a plain placeholder or, only within a projection binding (Section 5.6), a locale
placeholder (Section 5.3). This keyed form is the only way to address such a property: a plain placeholder over one is
mismatched and MUST be rejected (Section 5.2), whichever single branch it may resemble.

A variant carries a single value, never a collection: cardinality is defined for the property as a whole and applies to
the union slot, not independently per branch.

A variant MAY be a locale placeholder (Section 5.3) only within a projection binding (Section 5.6), addressing a branch
that resolves to a localised property (Section 4.3), as a path through a union-typed step can (Section 5.8.1); the
branch then occupies its own cell (Section 5.6) as a localised text map. A localised text map is not a value and cannot
be combined into a value set (Section 4.2) alongside the literals, references, and resources of sibling branches, so a
union retrieving a resource property directly admits no locale variant; only the per-cell decomposition of a projection
(Section 5.6) accommodates one. A locale variant carries its own per-tag cardinality (Section 5.3) and is therefore
never wrapped in a collection.

The keys are opaque: they label the alternatives but carry no positional or nominal meaning. Keys MUST be non-negative
integer strings (no decimals, negatives, or exponential forms), a namespace disjoint from property identifiers, and a
processor MUST NOT read positional meaning into them. Each value is an alternative placeholder, and the branches it
retrieves are fixed by matching the placeholder against the property's variants (Section 5.2), not by the key. Matching
is by kind, not by value: a literal alternative matches every variant of its processing kind, a reference alternative
every reference variant, and a template alternative every nested-resource variant whose type its properties are valid on
(Section 5.2). A placeholder's value is immaterial and need not be a legal value of any variant. An alternative MAY
match more than one variant, retrieving each, but like any placeholder MUST match at least one: one matching no variant
can return nothing and is unsatisfiable, and MUST be rejected (Sections 3.1 and 5.2). A literal or reference alternative
does not tell same-kind variants apart, while a template's structure discriminates the resource variants it fits.
Variants left unmatched are skipped at retrieval, contributing no values.

```json
{
  "id": "",
  "creator": {
    "0": {
      "id": "",
      "name": ""
    },
    "1": {
      "id": "",
      "legalName": ""
    }
  }
}
```

Where variants share a processing type, a placeholder matches them all by kind, its value immaterial: here `region` has
two string branches, an ISO 3166 alpha-2 country code and an internal macro-zone code. A single string alternative
already matches both, so retrieval returns whichever branch the stored value belongs to; the values `"US"` and `"EMEA"`
below are inert placeholders that select nothing, the two slots being equivalent:

```json
{
  "id": "",
  "region": {
    "0": "US",
    "1": "EMEA"
  }
}
```

Numeric keys suit the machine-generated templates that tooling, code generation, and schema-driven translation produce
and keep the surface syntax sigil-free; being disjoint from the identifier, binding, and operator-prefixed key spaces,
they leave a union structurally unambiguous while remaining opaque labels with no positional force.

## 5.5. Query

A **query** retrieves a collection, a multi-valued property (Section 3.1) of the enclosing resource. In the template,
that property maps to a tuple of two parts: a per-item element that shapes each item, and an optional selection (Section
5.7) that filters, sorts, and paginates the collection as a whole. A single-valued property cannot take such a tuple; a
query targeting one MUST be rejected.

The per-item element takes one of three forms, giving three query variants:

- a **placeholder** (Section 5.2) retrieves each item by its type, covering scalar collections (literals or references)
  and collections of shaped resources (nested templates);
- a **union** (Section 5.4) retrieves each union-typed item through the branch matching its variant, one placeholder per
  branch;
- a **projection** (Section 5.6) yields **computed values** per item or group, through expressions and aggregates.

## 5.6. Projection

A **projection** is a collection template whose keys are **bindings**: each pairs an expression with a result name
rather than naming an individual property, evaluated per item or, when an aggregate binding is present, per group
(Section 5.8.2.1). Binding result names MUST be unique within a projection.

```json
{
  "items": [
    {
      "vendor": {
        "id": "",
        "name": ""
      },
      "items=count:": 0,
      "avgPrice=avg:price": 0
    }
  ]
}
```

Each binding's value is a **model** (Section 5.1), taking one of three forms:

- a **union** (Section 5.4): one placeholder per branch, when the bound expression is union-typed;
- a **placeholder** (Section 5.2): a literal, a reference, or a nested template expanding a linked resource;
- a **locale** map (Section 5.3): a tag-range map declaring a localised result.

Each binding yields one **cell** per output row, holding a single value: a literal, a reference (optionally expanded to
a resource), or a localised text map. A union never appears in a cell; a union binding's cell holds one of its matching
branch's values. Where the matching branch resolves to a localised property (Section 4.3), that cell is a text map. This
per-cell decomposition is what keeps a binding representable when its expression reaches localised text downstream of a
union (Section 5.8.1): the mixed effective type is split across cells, the localised value occupying its own text-map
cell rather than mixing into a value set (Section 4.2), which has no shape for that combination.

A projection emits one row per combination of its bindings' resolved values: a multi-valued binding fans out into a row
per value, the result being the cross-product across bindings (a structural locale binding excepted, counting as a
single value; a coalesced multi-valued binding fans out per value, like any multi-valued placeholder). A binding that
resolves to no value preserves the row rather than collapsing the cross-product to zero; its label MUST be omitted from
that row.

A structural locale binding counts as a single value and does not fan out rows, however many tags it holds. The `label`
binding below yields the full `{ <tag>: <value>, … }` map for the matching tags as one cell:

```json
{
  "items": [
    {
      "id": "",
      "label=title": {
        "*": ""
      }
    }
  ]
}
```

Faceted search is one of the major use cases supported by aggregate projections: the following examples express three
common facet patterns.

A **category breakdown** groups items by a property and counts each group. The projection pairs a non-aggregate binding,
`category`, which becomes the grouping key (Section 5.8.2.1), with the aggregate `count=count:`, which counts the items
in each group; the sibling selection's `^count:` then orders the groups by descending count (Section 5.7.5). The query
returns one row per distinct `category` value, each carrying its item count:

```json
{
  "items": [
    {
      "category": "",
      "count=count:": 0
    },
    {
      "^count:": "desc"
    }
  ]
}
```

A **value range** reduces the whole collection to a single row carrying the minimum and maximum of a comparable
property. With no non-aggregate binding there is no grouping key, so the two aggregates range over every matching item:

```json
{
  "items": [
    {
      "min=min:price": 0,
      "max=max:price": 0
    }
  ]
}
```

A **result total** reduces the collection to a single row holding the number of matching items. The empty-path aggregate
`count=count:` counts rows rather than property values (Section 5.8.2.1):

```json
{
  "items": [
    {
      "count=count:": 0
    }
  ]
}
```

## 5.7. Selection

A **selection** is a collection query's optional second element (Section 5.5): a map of constraints that filters, sorts,
and paginates the collection as a whole. Each constraint key uses the `"{operator}{expression}"` syntax, where the
operator determines the constraint type and the expression (Section 5.8) identifies the target property or computed
value.

A constraint expression MAY include an aggregate transform (Section 5.8.2.1). In a grouped query (Section 5.8.2.1),
aggregate constraints filter groups and non-aggregate ones filter items; in an ungrouped query, an aggregate constraint
reduces over each item's own values (Section 5.8.1), filtering, sorting, or ranking the items by the reduced value.

Each operator below tabulates the **target types** and **cardinalities** it supports. Over a single-type target, a
constraint whose target type or cardinality is not listed for its operator, or whose bound or option type does not match
the target's resolved type, is unsupported and processors MUST reject it.

Over a union-typed target (Section 3.1), a bound or option is resolved against the declared variants exactly as a state
value is on ingress (Section 3.2): being expected disjoint (Section 3.1), the variants admit it on at most one branch,
and the processor maps it to that branch's type. A bound or option matching no variant is unsatisfiable and MUST be
rejected, and one matching several is ambiguous and MUST be rejected (a `null` option is typeless and exempt, Section
5.7.3). The matched branch fixes the regime: a value matches when it lies on that branch and the operator's regime holds
there, per the tables below; values on other branches are ignored (Section 5.8.2) and contribute no match. Since a
comparison bound is a literal (Section 5), comparison (Section 5.7.1) selects the literal branch its bound maps to; text
search (Section 5.7.2) is the exception, its operand a plain search string rather than a typed bound, so it selects no
single branch but applies to every `xsd:string` branch at once (Section 5.7.2); set matching and sort focus (Sections
5.7.3 and 5.7.4) carry options, so the option's kind selects the branch: a literal option a literal branch, a reference
option a reference branch, and a tagged option the localised text branch, with a `null` option selecting none and
matching absence (Section 5.7.3); sort (Section 5.7.5), which carries no bound, instead orders all branches within the
total order's tiers, selecting none. Appendix A.4.1's type guards realise this branch selection on the target backends.

A constraint that no resource can satisfy (for example `null` beside a present value under `!`, Section 5.7.3) MAY be
short-circuited to an empty result set rather than evaluated.

The operators follow the division drawn by the type system (Section 3), which maps values to processing types for
ordering and computation but leaves references and structurally addressed localised text outside that space, matched by
equality alone; a coalesced localised target (Section 6) is instead constrained as an ordinary `xsd:string` of
corresponding cardinality, a multi-valued one admitted existentially:

- **ordered operators** comparison (Section 5.7.1) and sort (Section 5.7.5) order values within the target's processing
  type, mapping the bound into that type before comparing.
- **matching operators** text search (Section 5.7.2) matches substrings over `xsd:string`.
- **equality operators** set matching (Section 5.7.3) and sort focus (Section 5.7.4) additionally accept `reference` and
  `text` (Section 4), matched by equality on their raw form, the only regime available to values outside the processing
  space; a literal target is matched in its processing type, as for the ordered operators.

Cardinality (single- or multi-valued) constrains the **target property**, not its type, and each table states it
separately.

### 5.7.1. Comparison

| Constraint                | Semantics                                                           |
|---------------------------|---------------------------------------------------------------------|
| `"<expression": literal`  | at least one expression value is strictly less than the bound       |
| `">expression": literal`  | at least one expression value is strictly greater than the bound    |
| `"<=expression": literal` | at least one expression value is less than or equal to the bound    |
| `">=expression": literal` | at least one expression value is greater than or equal to the bound |

| Target Type   | Cardinality             | Notes                       |
|---------------|-------------------------|-----------------------------|
| `xsd:boolean` | single- or multi-valued | ordered `false` < `true`    |
| `numeric`     | single- or multi-valued | standard numeric ordering   |
| `xsd:string`  | single- or multi-valued | Unicode codepoint collation |
| `temporal`    | single- or multi-valued | chronological ordering      |

- Ordering follows the XPath 2.0 basis of the processing type system (Section 3).
- An absent target satisfies no comparison and is excluded, whatever the bound.
- Appendix A.2.1 maps comparison and ordering onto the target backends.

Note that a query literal carries only IEEE-754 double precision (Section 3), so numeric comparison and equality
(Section 5.7.3) resolve only to that precision. On a backend storing finer-than-double numerics, a boundary match MAY
differ. This gap is left open by design, since forcing comparison into `xsd:double` would cast the stored column and
defeat numeric indexes, contrary to the native-alignment principle (Appendix A.1.2).

### 5.7.2. Text Search

| Constraint              | Semantics                                                                          |
|-------------------------|------------------------------------------------------------------------------------|
| `"~expression": string` | at least one expression value contains every token as a case-insensitive substring |

| Target Type  | Cardinality             | Notes                |
|--------------|-------------------------|----------------------|
| `xsd:string` | single- or multi-valued | diacritics-sensitive |

- The search string is split into tokens on whitespace.
- A value matches when it contains every token as a substring; token order is not significant.
- The search string is a plain pattern, not a data value: it is not resolved against the target's variants (Section
  3.1), so over a union-typed target it matches on every `xsd:string` branch rather than selecting one.
- Appendix A.2.5 maps substring matching onto the target backends.

### 5.7.3. Set Matching

| Constraint               | Semantics                                         |
|--------------------------|---------------------------------------------------|
| `"?expression": options` | at least one expression value equals an option    |
| `"!expression": options` | every option equals at least one expression value |

| Target Type | Cardinality             | Notes                 |
|-------------|-------------------------|-----------------------|
| literal     | single- or multi-valued | literal equality      |
| reference   | single- or multi-valued | reference equality    |
| text        | single- or multi-valued | tagged-value equality |

- Literal equality resolves in the processing type (Section 3), so a temporal option matches by value rather than
  lexically, consistent with comparison (Section 5.7.1).
- An option is `null`, a literal, or a reference.
- An option set is a single option, an array of options, or a localised text map (Section 4.3); in this context,
  single-string-per-tag map entries are shorthands for singleton sets.
- Option sets follow set semantics: duplicate options are immaterial, and, by convention under `?` and `!` alike, an
  empty set carries no options to match and MUST be ignored, leaving the collection unconstrained.
- `!` suits multi-valued targets; a single-valued one satisfies only a single-element set.
- A `null` option matches an absent value, so the operator's quantifier does the rest: under `?` it adds an "or unset"
  alternative; under `!` every option must hold, so `[null]` selects unset properties and `null` beside a present value
  matches nothing.

### 5.7.4. Sort Focus

| Constraint               | Semantics                                                        |
|--------------------------|------------------------------------------------------------------|
| `"+expression": options` | resources whose expression value is in the option set rank first |

| Target Type | Cardinality   | Notes                 |
|-------------|---------------|-----------------------|
| literal     | single-valued | literal equality      |
| reference   | single-valued | reference equality    |
| text        | single-valued | tagged-value equality |

- Focus ranking needs one value per resource, hence the single-valued target.
- A `null` option ranks resources whose value is absent first, mirroring the absent-value match of set matching
  (Section 5.7.3).
- Focus overrides the regular sort criteria (Section 5.7.5).

A common use of sort focus is to prioritise a user's selections within a discrete facet: the chosen option values rank
first while the rest of the listing keeps its order, keeping selected items visible without filtering the others out.

### 5.7.5. Sort Order

| Constraint             | Semantics                                                                               |
|------------------------|-----------------------------------------------------------------------------------------|
| `"^expression": order` | sorts results by the expression value, in the direction and precedence given by `order` |

| Target Type   | Cardinality   | Notes                               |
|---------------|---------------|-------------------------------------|
| `xsd:boolean` | single-valued | ordered by the value-ordering rules |
| `numeric`     | single-valued | ordered by the value-ordering rules |
| `temporal`    | single-valued | ordered by the value-ordering rules |
| `xsd:string`  | single-valued | ordered by the value-ordering rules |

- A positive `order` sorts ascending, a negative one descending; its absolute value gives 1-based precedence (1 is
  highest) among multiple sort keys; `"asc"` and `"desc"` abbreviate `+1` and `-1`; zero is ignored.
- The sort order is total: `undefined` first, then by processing type (`xsd:boolean` < `numeric` < `temporal` <
  `xsd:string`), then within each type by the comparison rules (Section 5.7.1). Ranking by processing type keeps
  `temporal` a tier distinct from `xsd:string`, ordering comparable temporal values ahead of plain strings, though
  egress surfaces both as JSON strings (Section 3), so a union-typed key sorts deterministically across mixed-type
  values.
- Appendix A.2.3 maps total ordering onto the target backends.

### 5.7.6. Pagination

| Constraint     | Semantics                |
|----------------|--------------------------|
| `"@": integer` | skip the first N results |
| `"#": integer` | return at most N results |

- Both values are non-negative integers; a negative or non-integer value is invalid and processors MUST reject it.
- Zero ignores the constraint: `@: 0` applies no offset and `#: 0` imposes no limit.
- To make pagination stable, processors MUST extend the client's `^` criteria with an implementation-defined
  deterministic tiebreaker so the result order is **total**, whatever the projection or grouping (Section 5.8.2.1) in
  effect; page boundaries are then stable across requests for the same query over unchanged data, while concurrent
  modification between page fetches is not covered (inherent to offset pagination).

## 5.8. Expression

An **expression** is a property path optionally preceded by a pipeline of transforms, targeted by projection
(Section 5.6) and selection (Section 5.7) keys.

```text
name                       simple property
user.profile.email         nested property path
sum:items.price            computed sum
round:avg:scores           pipeline: inner transform applied first
count:                     aggregate over collection (empty path)
```

### 5.8.1. Property Paths

A **path** is a possibly empty, dot-separated sequence of property identifiers (for example, `vendor.name`) that
navigates from a resource through its properties to a set of values. Processors MUST reject paths that reference unknown
properties, those without an expected type (Section 3.1).

A path is resolved by **walking** its steps from left to right over a working set of values. The set starts as the
collection's items (or the single target item). Each step **expands** it: for every value in the set, the step resolves
the named property and adds the resulting values to the next set, omitting `undefined`. An empty path has no steps, so
the set stays unchanged.

Each step contributes values per input value according to the property it resolves:

- **Single-valued property**: at most one value;
- **Multi-valued property**: any number of values, in no guaranteed order;
- **Union property**: contributes a mixed-type set, each value of a single branch type;
- **Localised property**: under coalesced access (Section 6.2), contributes the coalesced value as an ordinary
  `xsd:string` of corresponding cardinality; under structural access (Section 6), through a locale placeholder or
  binding (Sections 5.3 and 5.6) or a tagged option set (Section 5.7.3), contributes the text map whole, tags preserved.

The set remaining after the last step is the path's result: an empty set resolves to `undefined`, a single value to that
value, and several to an array. Appendix A.3 maps path resolution onto the target backends.

A path's **effective type** is that of its final step's property, or, for an empty path, the item type of the collection
it ranges over; a union-typed step yields a mixed-type set. Where a step downstream of a union-typed step resolves a
distinct property per branch, the effective type is the disjunction of those per-branch types. That disjunction can
include localised text, where a branch's resolved property is localised (Section 4.3) and addressed structurally
(Section 6); such a branch is expressed by a locale variant (Section 5.4). A localised step yields `xsd:string` instead
under coalesced access (Section 6.2), at the property's per-tag cardinality.

An effective type is a derived type, not an expected type (Section 3.1), and is never materialised as a value set
(Section 4.2): a mixed effective type that includes localised text is consumed per branch by a selection (Section 5.7)
and per cell by a projection (Section 5.6), each value keeping its own type, so it never forms a single serialised value
set. Processors MUST NOT reject a path on the ground that its effective type mixes localised text with other branch
types.

A path's **effective cardinality** follows statically from its steps:

- the **maximum** is the product of the per-step maxima, or undefined if any step's maximum is undefined;
- the **minimum** is the product of the per-step minima, or undefined if any step's minimum is undefined.

### 5.8.2. Transform Pipes

A **pipe** is a possibly empty sequence of colon-terminated transform identifiers (for example, `round:avg:`) that maps
the values a path produces (Section 5.8.1) through named functions. Processors MUST reject pipes that reference unknown
transforms.

A pipe is evaluated by **applying** its transforms right to left (functional composition) to the path's result: each
transform consumes the previous output and produces the next. An empty pipe leaves the result unchanged.

Each transform contributes to the result according to its kind:

- **Aggregate transform**: reduces the set to a single value, excluding `undefined` and the values of any incompatible
  branch (well-typedness, below) before computing (see Appendix A.4.2 for filtering on target backends); if none remain,
  the empty-set rules of Section 5.8.2.1 apply
- **Scalar transform**: maps each in-domain value to a single value, element-wise; the value of an incompatible branch,
  or an `undefined` input, yields `undefined`, which propagates through the rest of the pipe (see Appendix A.4.1 for type
  guards on target backends).

The set left after the last transform is the pipe's result, mapped to `undefined`, a value, or an array as for a path
(Section 5.8.1).

The supported transform set is defined so that each transform has a well-defined counterpart across the target backends
(Appendix A), keeping it portable. Type semantics follow the processing type system (Section 3).

A pipe is **well-formed** only if it applies at most one aggregate transform; processors MUST reject ill-formed pipes
(see Appendix A.4.4 for build-time rejection on target backends).

Transforms MUST be **well-typed**: a transform MAY be applied only to a value compatible with its declared domain, the
compatibility being resolved against the type its input step produces (Section 5.8.1). A transform whose domain admits
no value of that type is incompatible, and processors MUST report the incompatibility and reject the pipe (see Appendix
A.4.4 for build-time rejection on target backends). Where the input type is a union (Section 5.4), at least one branch
MUST be compatible with the domain for the transform to be well-typed; the transform then applies to the values of the
compatible branches and ignores those of the incompatible ones, which contribute no value (scalar) or drop from the
reduction (aggregate). Appendix A.4.5 maps this branch selection onto the target backends.

A pipe's **effective type** is the range of its outermost transform. Each transform maps an in-domain value to the range
declared in the following sections; an incompatible-branch value, or an already `undefined` input, maps to `undefined`.

A pipe's **effective cardinality** follows statically from its transforms:

- the **maximum** is preserved by scalar transforms (applied element-wise) and reduced to one by aggregates;
- the **minimum** is zero, except for the total aggregates `count` and `sum`, which always yield a value (`0` on the
  empty set) and so have minimum one.

#### 5.8.2.1. Aggregate Transforms

| Name    | Semantics                | Domain          | Range          | Empty set   |
|---------|--------------------------|-----------------|----------------|-------------|
| `count` | Count the values         | any value       | `xsd:integer`  | `0`         |
| `min`   | Select the minimum value | `xsd:boolean`   | `xsd:boolean`  | `undefined` |
|         |                          | `numeric`       | same as domain | `undefined` |
|         |                          | `xsd:string`    | `xsd:string`   | `undefined` |
|         |                          | `temporal`      | same as domain | `undefined` |
| `max`   | Select the maximum value | `xsd:boolean`   | `xsd:boolean`  | `undefined` |
|         |                          | `numeric`       | same as domain | `undefined` |
|         |                          | `xsd:string`    | `xsd:string`   | `undefined` |
|         |                          | `temporal`      | same as domain | `undefined` |
| `sum`   | Sum the values           | `numeric`       | same as domain | `0`         |
| `avg`   | Average the values       | `xsd:float`     | `xsd:float`    | `undefined` |
|         |                          | `xsd:double`    | `xsd:double`   | `undefined` |
|         |                          | other `numeric` | `xsd:decimal`  | `undefined` |

Unlike the other aggregates, `count` counts its values by presence, references included, and does not map its input into
the processing space (Section 3); hence its domain is any value rather than a processing type.

Over a mixed `numeric` input set, an aggregate computes in the least common type under XPath 2.0 numeric promotion
[W3C.REC-xpath-functions], which also fixes its range; the promotion aligns natively across the target backends
(Appendix A.1.2).

**Bag semantics.** An aggregate counts every contributing value, with no implicit deduplication. Set semantics
(Section 4.2) dedupes only within a single property's stored array, not across the aggregate's input, so equal values
count separately, whether from different rows or from a multi-valued fan-out within one row.

When an aggregate expression appears among the projection's bindings, the query is evaluated under **grouped semantics
**; otherwise the query is **ungrouped**: every item is evaluated independently, and an aggregate expression in the
selection reduces over the values the path gathers from the item under evaluation (Section 5.8.1), so the constraint
filters, sorts, or ranks the items by that reduction.

The ungrouped reduction supports cardinality constraints over plain templates; the query below retrieves the vendors
carrying at least three products:

```json
{
  "vendors": [
    {
      "id": "",
      "name": ""
    },
    {
      ">=count:products": 3
    }
  ]
}
```

Under grouped semantics, each operator's role is determined by whether its expression references an aggregate transform:

- **Projection bindings**: non-aggregate bindings contribute to the grouping key and appear verbatim in the output row;
  aggregate bindings compute per-group summaries.
- **Filter constraints**: non-aggregate filters restrict the input set before grouping; aggregate filters select groups
  after aggregation.
- **Ordering expressions**: a non-aggregate ordering or focus expression sorts or ranks the groups by one of the
  grouping keys; an aggregate one sorts or ranks them by its post-aggregation value.

Grouping is fixed by the projection alone and is never inferred from a sort key: a non-aggregate ordering or focus
expression MUST match, verbatim, the expression of an existing grouping-key binding; binding names are not expressions,
and processors MUST reject an expression that matches no key.

Grouping applies to the fanned-out rows of Section 5.6: a multi-valued grouping-key binding fans an item into one row,
and hence one group, per value. Rows sharing the same grouping-key values collapse into a single group. An `undefined`
grouping-key value (an absent or unresolved binding) groups with itself: all rows missing that key form one group, whose
output row omits the key, extending the no-value rule of the ungrouped case (Section 5.6). Every target backend realises
this natively through
`GROUP BY` null-grouping (Appendix A.4.6).

Aggregate filter and ordering constraints are independent of any projected bindings: an aggregate MAY appear in a
constraint without being projected, and a projected aggregate MAY appear without being constrained. Appendix A.4.6
summarises how this partition maps onto the reference query backends.

#### 5.8.2.2. Numeric Transforms

| Name    | Semantics                           | Domain    | Range          |
|---------|-------------------------------------|-----------|----------------|
| `abs`   | Take the absolute value             | `numeric` | same as domain |
| `floor` | Round down to an integral value     | `numeric` | same as domain |
| `ceil`  | Round up to an integral value       | `numeric` | same as domain |
| `round` | Round to the nearest integral value | `numeric` | same as domain |

#### 5.8.2.3. Textual Transforms

| Name     | Semantics            | Domain       | Range         |
|----------|----------------------|--------------|---------------|
| `lower`  | Convert to lowercase | `xsd:string` | `xsd:string`  |
| `upper`  | Convert to uppercase | `xsd:string` | `xsd:string`  |
| `length` | Count the characters | `xsd:string` | `xsd:integer` |

#### 5.8.2.4. Temporal Transforms

| Name      | Semantics           | Domain     | Range         |
|-----------|---------------------|------------|---------------|
| `year`    | Extract the year    | `temporal` | `xsd:integer` |
| `month`   | Extract the month   | `temporal` | `xsd:integer` |
| `day`     | Extract the day     | `temporal` | `xsd:integer` |
| `hours`   | Extract the hours   | `temporal` | `xsd:integer` |
| `minutes` | Extract the minutes | `temporal` | `xsd:integer` |
| `seconds` | Extract the seconds | `temporal` | `xsd:decimal` |

A temporal transform yields `undefined` when the input value lacks the component it extracts.

# 6. Localised Retrieval

A localised property (Section 4.3) is retrieved or constrained according to the form of the value used to address it:

- **structural** access preserves the language tags: a locale placeholder (Section 5.3) retrieves a tag-range subset of
  the text map, and a language-tagged option (Section 5.7.3) matches exactly the stored tagged values; - **coalesced**
  access reduces the property to a plain string, or array of plain strings of corresponding cardinality, under language
  negotiation: a placeholder (Section 5.3) retrieves the coalesced value or values, a plain-string operand
  (Section 5.7) constrains them, a sort key (Section 5.7.5) orders by the single-valued form, and an expression step
  (Section 5.8.1) resolves to them, so transforms and aggregates (Section 5.8.2) range over the coalesced values.

The same property MAY be accessed either way. Structural access is unaffected by language negotiation; coalesced access
depends on it (Section 6.3).

Note that the two forms call for different tagging granularities, so content SHOULD be tagged according to its usual
access pattern:

- content read **structurally**, such as dictionary or thesaurus entries, where regional nuance is meaningful, MAY carry
  tags of any specificity, since the client receives exactly the tag ranges it requests;
- content read by **coalescing**, typically resource display labels, SHOULD be tagged no finer than language and, where
  significant, script: language priority (Section 6.1) is deliberately resolved at that granularity to keep coalescing
  cheap; a finer tag such as `de-AT` is therefore never reached.

## 6.1. Language Negotiation

Text coalescing (Section 6.2) is driven by a **language priority**: an ordered list of exact language tags [RFC5646]
against which each localised value is resolved. The priority is drawn from two sources:

- the **requested languages** carried by the `Accept-Language` header field of the request [RFC9110], a list of
  quality-weighted basic language ranges [RFC4647];
- a **fallback chain**, an ordered tag list configured out of band, empty by default, that stands in wherever the
  request names no specific language; its tags are exact tags at language-and-script granularity, finer tags being
  unreachable under coalescing (Section 6).

Processors MUST derive it, treating an absent or empty `Accept-Language` header as `*`:

1. parse the field into (range, quality) pairs, treating a missing quality as 1 and skipping malformed pairs;
2. discard pairs of quality 0, which are explicitly unacceptable;
3. order the ranges by descending quality, stably, with header order breaking ties;
4. reduce each range to a single exact tag at language-and-script granularity, dropping region, variant, and any
   subsequent subtags (by tag shape [RFC5646], a script subtag is four letters and a region subtag is two letters or
   three digits):
	- a concrete tag becomes its language-and-script prefix (`de-AT` becomes `de`; `sr-Cyrl-RS` becomes `sr-Cyrl`);
	- a range of the form `lang-*` becomes the language-and-script prefix of `lang` (`fr-*` becomes `fr`);
	- the wildcard `*` becomes the fallback chain;
	- a range with any other wildcard placement is dropped;
5. append `und` as the final, language-neutral fallback;
6. concatenate the results in priority order and remove later duplicates.

Each range thus resolves to a single tag, so the list remains short and contains no wildcards. The `lang-*` and
other-wildcard cases in step 4 are defensive: a conformant `Accept-Language` carries only basic ranges [RFC4647], which
never take those forms, but reducing them gracefully keeps a lenient or non-HTTP input well-defined. The fallback chain,
being empty by default, imposes no language bias; servers SHOULD be configured with a chain of their primary languages,
so that content in them remains reachable when a request matches nothing else.

```text
Accept-Language: sr-Cyrl-RS, de-AT;q=0.9, *;q=0.5, it;q=0    (with fallback chain: fr, es)

1 parse      (sr-Cyrl-RS,1) (de-AT,.9) (*,.5) (it,0)
2 drop q=0   (sr-Cyrl-RS,1) (de-AT,.9) (*,.5)
3 order      sr-Cyrl-RS, de-AT, *                            (already quality-ordered)
4 reduce     sr-Cyrl | de | fr, es                           (region dropped, script kept; `*` replaced by fallback)
5 append     und
6 dedupe     [sr-Cyrl, de, fr, es, und]
```

## 6.2. Text Coalescing

Coalescing resolves a property's map (Section 4.3) against a client-defined language priority list (Section 6.1): it
selects the first priority tag present in the map, then gathers the value or values bound to that tag, or `undefined` if
the map holds none of the priority's tags. The coalesced result carries the property's per-tag cardinality and is an
ordinary `xsd:string` value or set thereafter, so coalescing adds no boundary of its own (Appendix A.5).

Coalescing may run without a negotiated priority (Section 6.1), for example outside an HTTP request. A priority supplied
out of band is taken literally: the trailing `und` belongs to the negotiation derivation (Section 6.1), not to
coalescing, so processors MUST NOT append it, and a caller wanting the language-neutral fallback appends `und` itself.
Where no priority is supplied at all, processors MUST default the whole priority to the single tag `und`, so that an
unscoped request still resolves language-neutral values, such as a proper name stored under `und`. This whole-priority
default is distinct from the trailing `und` that Section 6.1 appends to each negotiated priority.

Processors MUST substitute the coalesced value or values for the property and apply the ordinary string semantics of the
targeting construct, exactly as for any other string property of corresponding cardinality.

## 6.3. Response Caching

Servers MUST include a `Vary` header field naming `Accept-Language` in any response that depends on a coalesced value
(Section 6.2), whether through a coalesced label in the response body (Section 5.3) or through the result set (filtering
or ordering), so that such responses are cached per language.

Coalescing resolves each cell independently, so a single response MAY mix language tags across its cells. Servers MUST
NOT describe such a response with a response-wide `Content-Language` header field: the field describes the language of
the representation as a whole [RFC9110] and cannot convey which language each cell resolved to.

# 7. IANA Considerations

This document has no IANA actions.

# 8. Security Considerations

## 8.1. Query Complexity

Servers SHOULD impose limits on template nesting and query paths depth, the number of expanded properties, and
collection result sizes to prevent denial of service through excessively complex queries.

Aggregate transforms (Section 5.8.2.1) can be particularly expensive on large collections; servers SHOULD support
disabling them on a per-endpoint or per-role basis when the computational cost is unacceptable.

## 8.2. Information Disclosure

Servers MUST NOT let a query read or traverse any property path beyond what the requesting client is authorised to
access. Template-driven retrieval does not bypass access control; it constrains the query within the bounds of the
client's permissions, whether a value is returned directly, expanded from a reference, or only summarised by an
aggregate (Section 5.8.2.1), which MUST therefore be computed solely over values the client may read.

Rejection responses can themselves disclose structure. The validation rules of this document reject unknown properties
(Section 5.8.1), type mismatches (Section 3.2), type-incompatible transform pipes (Section 5.8.2), and malformed
templates (Section 5.2); verbose errors confirm the existence and types of properties a client is not authorised to
know. Servers SHOULD limit the detail of a rejection to
what the client is authorised to learn.

## 8.3. IRI Injection

Implementations that resolve internal IRIs against a base IRI MUST validate that the resolved IRI remains within the
expected authority scope. Malformed or adversarial IRI values MUST be rejected.

# 9. References

## 9.1. Normative References

- **[ECMA-262]** Ecma International, "ECMAScript 2024 Language Specification", June 2024, 15th Edition.
- **[RFC2119]** Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997,
  DOI 10.17487/RFC2119.
- **[RFC3986]** Berners-Lee, T., Fielding, R., and L. Masinter, "Uniform Resource Identifier (URI): Generic Syntax", STD
  66, RFC 3986, January 2005, DOI 10.17487/RFC3986.
- **[RFC3987]** Duerst, M. and M. Suignard, "Internationalized Resource Identifiers (IRIs)", RFC 3987, January 2005, DOI
  10.17487/RFC3987.
- **[RFC4647]** Phillips, A., Ed. and M. Davis, Ed., "Matching of Language Tags", BCP 47, RFC 4647, September 2006, DOI
  10.17487/RFC4647.
- **[RFC4648]** Josefsson, S., "The Base16, Base32, and Base64 Data Encodings", RFC 4648, October 2006, DOI
  10.17487/RFC4648.
- **[RFC5234]** Crocker, D., Ed. and P. Overell, "Augmented BNF for Syntax Specifications: ABNF", STD 68, RFC 5234,
  January 2008, DOI 10.17487/RFC5234.
- **[RFC5646]** Phillips, A., Ed. and M. Davis, Ed., "Tags for Identifying Languages", BCP 47, RFC 5646, September 2009,
  DOI 10.17487/RFC5646.
- **[RFC8174]** Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, May 2017, DOI
  10.17487/RFC8174.
- **[RFC8259]** Bray, T., Ed., "The JavaScript Object Notation (JSON) Data Interchange Format", STD 90, RFC 8259,
  December 2017, DOI 10.17487/RFC8259.
- **[RFC8610]** Birkholz, H., Vigano, C., and C. Bormann, "Concise Data Definition Language (CDDL): A Notational
  Convention to Express Concise Binary Object Representation (CBOR) and JSON Data Structures", RFC 8610, June 2019, DOI
  10.17487/RFC8610.
- **[RFC9110]** Fielding, R., Ed., Nottingham, M., Ed., and J. Reschke, Ed., "HTTP Semantics", STD 97, RFC 9110, June
  2022, DOI 10.17487/RFC9110.
- **[RFC9457]** Nottingham, M., Wilde, E., and S. Dalal, "Problem Details for HTTP APIs", RFC 9457, July 2023, DOI
  10.17487/RFC9457.
- **[W3C.REC-json-ld11]** Sporny, M., Longley, D., Kellogg, G., Lanthaler, M., and P. Champin, "JSON-LD 1.1", 16 July
  2020, W3C Recommendation.
- **[W3C.REC-xmlschema-2]** Biron, P. and A. Malhotra, "XML Schema Part 2: Datatypes Second Edition", 28 October 2004,
  W3C Recommendation.
- **[W3C.REC-xpath-functions]** Malhotra, A., Melton, J., and N. Walsh, "XQuery 1.0 and XPath 2.0 Functions and
  Operators", 23 January 2007, W3C Recommendation.
- **[WHATWG.URL]** WHATWG, "URL Standard".

## 9.2. Informative References

- **[ISO.39075.2024]** ISO/IEC, "Information technology - Database languages - GQL", 2024, ISO/IEC 39075:2024.
- **[ISO.9075.2011]** ISO/IEC, "Information technology - Database languages - SQL", 2011, ISO/IEC 9075:2011.
- **[ISO639-3.und]** SIL International, "ISO 639-3: und (Undetermined)".
- **[ISO639-3.zxx]** SIL International, "ISO 639-3: zxx (No linguistic content; Not applicable)".
- **[W3C.REC-sparql11-query]** Harris, S. and A. Seaborne, "SPARQL 1.1 Query Language", 21 March 2013, W3C
  Recommendation.

# Appendix A. Target Backends

The **target backends** are the query engines against which conforming processors are expected to emit queries:

- **SQL:2011** [ISO.9075.2011]
- **GQL:2024** [ISO.39075.2024]
- **SPARQL 1.1** [W3C.REC-sparql11-query]

A **query builder** is the component of a processor (Section 2) that translates a validated retrieval request into
queries for the target backends, as specified in Section 5; the subsections below are written from its perspective.

This appendix maps each protocol feature to its realisation across the target backends, documenting how each natively
handles the cases covered by the adopted semantics (Section 5.8.2) and where query-level normalisation is required to
reconcile their differences.

Property paths, transform pipes, type promotion, invalid value handling, and substring search align natively across all
target backends without normalisation; the remaining cases are detailed in the subsections below.

## A.1. Value Types

### A.1.1. Temporal Datatypes

The `temporal` type (Section 3) admits the point-in-time XSD datatypes `xsd:dateTime`, `xsd:date`, and `xsd:time`, the
temporal datatypes that are component-extractable and totally ordered (the latter under XPath 2.0's implicit-timezone
comparison) across the shared XSD 1.0 / XPath 2.0 basis of the target backends.

| Aspect     | SQL:2011                         | GQL:2024              | SPARQL 1.1                 |
|------------|----------------------------------|-----------------------|----------------------------|
| Ordering   | native `DATE`/`TIME`/`TIMESTAMP` | native temporal order | XPath operators            |
| Extraction | `EXTRACT` per type               | `.year` per type      | `YEAR()` on `xsd:dateTime` |

Ordering aligns across the target backends under the XPath 2.0 reference semantics (Section 5.7.1).

Component extraction is uniform across the target backends, with two specifics:

- GQL:2024 returns `seconds` as an integer plus separate sub-second fields rather than `xsd:decimal`; the query builder
  recombines them into one fractional value, which egress collapses to JSON `number` (Section 3) as for any XSD numeric,
  so the surfaced result agrees.
- SPARQL 1.1's accessors are defined on `xsd:dateTime` only. To extract from an `xsd:date` or `xsd:time`, the query
  builder synthesises an `xsd:dateTime`, supplying default values for the absent components (a zero time-of-day for a
  `date`, a fixed reference date for a `time`), then applies the `xsd:dateTime` accessor. The synthesised components are
  never surfaced: an accessor for a component the original type lacks (for example `hours` of a `date`) is `undefined`
  (Section 5.8.2.4), so the choice of default is immaterial.

The other XSD 1.0 temporal datatypes are excluded from the `temporal` type: `xsd:duration` is only partially ordered
(XPath defines equality only), and the Gregorian partials (`xsd:gYearMonth`, `xsd:gYear`, `xsd:gMonthDay`, `xsd:gMonth`,
`xsd:gDay`) are equality-only with no accessors. Neither lies in the portable ordered-and-extractable intersection, so
such values, if carried, are opaque `xsd:string` (Section 3). Temporal datatypes added by XSD 1.1 are excluded as well:
`xsd:dateTimeStamp`, though a totally ordered subtype of `xsd:dateTime`, is not portable across the target backends, as
SPARQL 1.1's operator mapping is defined over `xsd:dateTime` without subtype substitution, so the literal is an
unrecognised datatype on some engines: its comparison a type error, its ordering implementation-defined, and
`datatype()` yields the subtype IRI rather than `xsd:dateTime`. Such values are likewise opaque `xsd:string`.

### A.1.2. Type Promotion

| Scenario          | SQL:2011           | GQL:2024           | SPARQL 1.1         |
|-------------------|--------------------|--------------------|--------------------|
| Integer + decimal | implicit → decimal | implicit → decimal | implicit → decimal |
| Decimal → float   | implicit → float   | implicit → float   | implicit → float   |
| String → number   | type error         | type error         | type error         |

`integer` promotes to `decimal` in arithmetic and aggregates, with further promotion to `float` or `double` following
the same hierarchy. Temporal types (`date`, `time`, `dateTime`) are distinct with no implicit promotion, and
string/number conversions are never implicit; all backends reject implicit conversion consistently, so no normalisation
is required beyond numeric promotion, which aligns natively.

## A.2. Comparison and Search

### A.2.1. Comparison and Ordering

| Aspect            | SQL:2011                | GQL:2024       | SPARQL 1.1          |
|-------------------|-------------------------|----------------|---------------------|
| Default collation | column/database-defined | lexicographic  | not specified       |
| Codepoint order   | requires `COLLATE`      | not documented | references XPath    |
| `lower` / `upper` | follows collation       | locale-free    | locale-free         |
| `min` / `max`     | follows collation       | lexicographic  | follows XPath rules |

The adopted codepoint collation (Section 5.7.1) is not the default on most backends, so the query builder must select it
explicitly; see Codepoint Collation (Appendix A.2.4). GQL:2024 uses lexicographic ordering, which aligns with codepoint
order for ASCII content but is not formally documented for the full Unicode range.

### A.2.2. Absent-Value Comparison

A comparison against an absent target satisfies no operator: every backend yields a non-true result and drops the
resource, independent of where the total ordering (Appendix A.2.3) would place an absent value.

| Backend    | Comparison with an absent value                                     |
|------------|---------------------------------------------------------------------|
| SQL:2011   | `col <op> bound` over `NULL` is `UNKNOWN`; `WHERE` excludes the row |
| GQL:2024   | comparison with `null` is `null`; `WHERE` excludes the row          |
| SPARQL 1.1 | comparison with an unbound variable errors; `FILTER` drops the row  |

The rule that an absent target satisfies no comparison (Section 5.7.1) thus holds natively across all target backends,
with no normalisation.

### A.2.3. Total Ordering

The total ordering's **`undefined`-first** placement (Section 5.7.5) is the only sort divergence among backends; each
reaches it with an explicit clause:

| Backend    | `undefined` (null / empty) placement                  |
|------------|-------------------------------------------------------|
| SQL:2011   | `NULLS FIRST` (the default is implementation-defined) |
| GQL:2024   | none: `null` sorts lowest natively                    |
| SPARQL 1.1 | none: an unbound value sorts lowest natively          |

A union-typed sort key may resolve to values of different types across resources. No backend mandates any order between
value types: SPARQL 1.1 leaves cross-type comparison a type error and its `ORDER BY` placement implementation-defined,
and SQL:2011 and GQL:2024 fix no portable cross-type order either. The query builder therefore imposes one, emitting a
synthetic discriminator, `ORDER BY <undefined-flag>, <type-rank>, <value>`, with the type rank `xsd:boolean` <
`numeric` < `temporal` < `xsd:string` (Section 5.7.5). This ranking is a deliberate qest convention, not a backend
requirement: it places comparable temporal values (Appendix A.1.1) ahead of plain strings, including the opaque
temporals (`xsd:duration`, the Gregorian partials) that fall in the string tier.

The query builder assigns `<type-rank>` from each value's native type, which separates `temporal` from `xsd:string`
before egress collapses both to a JSON string (Appendix A.1.1). Each backend exposes the native type:

- a typed temporal column in SQL:2011;
- the value type in GQL:2024;
- the literal `datatype()` in SPARQL 1.1.

The temporal tier is thus realisable identically to the boolean, number, and string tiers, with no backend unable to
separate the two.

### A.2.4. Codepoint Collation

The adopted codepoint collation (Section 5.7.1) is not the default on most backends. The query builder must explicitly
select Unicode codepoint collation for string comparison, ordering, and case mapping.

| Backend    | Selecting codepoint collation                                      |
|------------|--------------------------------------------------------------------|
| SQL        | specify `COLLATE` clause or use codepoint-ordered column collation |
| GQL:2024   | none: lexicographic ordering aligns for common cases               |
| SPARQL 1.1 | specify codepoint collation: default is implementation-defined     |

### A.2.5. Substring Search

| Aspect       | SQL:2011       | GQL:2024   | SPARQL 1.1 |
|--------------|----------------|------------|------------|
| Substring    | `LIKE '%tok%'` | `CONTAINS` | `CONTAINS` |
| Case folding | `LOWER()`      | `lower()`  | `LCASE()`  |

A search token matches when the value contains it as a substring, compared over a lower-cased operand for
case-insensitivity (Section 5.7.2). For each token the query builder emits one substring test and conjoins the per-token
results; token order is not significant. No regular expression, word boundary, or whitespace handling is required, so
the filter is realisable over the raw stored value across all target backends with the native substring predicates
above, assuming no ingest normalisation:

- SQL:2011: `LOWER(v) LIKE '%tok%'`.
- GQL:2024: `lower(v) CONTAINS 'tok'`.
- SPARQL 1.1: `CONTAINS(LCASE(v), 'tok')`.

Substring rather than word-prefix matching is the portable intersection: detecting a word boundary needs a
whitespace-class metacharacter that `LIKE`, `CONTAINS`, and `STRSTARTS` / `CONTAINS` lack, and GQL:2024 has no
regular-expression facility, so word-prefix semantics are not realisable cross-backend without mandated indexing.

Diacritics-insensitive matching, namely Normalization Form D (NFD) decomposition plus stripping combining marks, is not
feasible in a cross-backend way: no in-query approach works uniformly across the target backends without
application-level pre-processing at storage time:

| Backend    | In-query NFD + strip combining marks?                                |
|------------|----------------------------------------------------------------------|
| SQL:2011   | no standard NFD function: requires pre-computation                   |
| GQL:2024   | `NORMALIZE(v, NFD)` decomposes, but no standard combining-mark strip |
| SPARQL 1.1 | no standard NFD function: requires extension or pre-computation      |

Application-level normalisation would require dual storage (original plus normalised form), which is not acceptable.
Diacritics-sensitive matching aligns with the cross-backend intersection principle.

## A.3. Property Paths

### A.3.1. No Property / No Value

| Aspect           | SQL:2011            | GQL:2024               | SPARQL 1.1               |
|------------------|---------------------|------------------------|--------------------------|
| Navigation       | JOIN + column ref   | relationship traversal | triple pattern chains    |
| Missing value    | `NULL` (outer join) | `null`                 | unbound (no binding row) |
| Unknown property | compile-time error  | `null`                 | unbound                  |

All backends propagate "no value" through path steps → `undefined`. Except for SQL, no backend distinguishes a missing
property from a null-valued one → `undefined`. SQL rejects unknown columns at compile time; see Unknown Property Guards
(Appendix A.3.4). Because processors reject paths that reference unknown properties (Section 5.8.1), no backend code is
emitted for the offending path.

### A.3.2. Multi-valued Properties

| Aspect              | SQL:2011                   | GQL:2024               | SPARQL 1.1            |
|---------------------|----------------------------|------------------------|-----------------------|
| Multi-valued result | joined row set             | collected list / rows  | multiple binding rows |
| Ordering guarantees | undefined without ORDER BY | undefined              | undefined             |
| Empty collection    | zero joined rows           | empty list / zero rows | zero binding rows     |

All backends naturally produce multi-valued results → JSON arrays.

### A.3.3. Union Properties

Union properties are transparent at the backend level: path resolution collects whatever values are available across all
branches, each value belonging to exactly one branch (the variants being expected disjoint, Section 3.1), and missing
branches contribute no values. The "no property / no value → `undefined`" rule applies per branch.

### A.3.4. Unknown Property Guards

Processors reject paths that reference unknown properties (Section 5.8.1) at query-building time, so no backend code is
emitted for them and the native behaviours each backend would otherwise apply do not arise.

| Backend    | Handling                                       |
|------------|------------------------------------------------|
| SQL        | rejected at query-building time; never emitted |
| GQL:2024   | rejected at query-building time; never emitted |
| SPARQL 1.1 | rejected at query-building time; never emitted |

## A.4. Transforms

### A.4.1. Scalar Transforms

| Aspect     | SQL:2011           | GQL:2024            | SPARQL 1.1             |
|------------|--------------------|---------------------|------------------------|
| Temporal   | `EXTRACT` per type | `.year` per type    | `YEAR()` on dateTime   |
| Wrong type | error (not NULL)   | type error (→ null) | type error (→ unbound) |
| Null input | `NULL` propagated  | `null` propagated   | error (→ unbound)      |

A scalar transform is applied only to compatible values (Section 5.8.2): a wholly incompatible pipe is reported and
rejected at query-building time (Appendix A.4.4), while over a union-typed path the query builder admits the compatible
branches and resolves the incompatible-branch values to `undefined`. The builder secures this rather than relying on
native behaviour, since most backends would otherwise raise the type errors tabulated below:

| Scenario           | SQL:2011            | GQL:2024            | SPARQL 1.1             |
|--------------------|---------------------|---------------------|------------------------|
| `abs(string)`      | type error          | runtime type error  | type error (→ unbound) |
| `floor(string)`    | type error          | runtime type error  | type error (→ unbound) |
| `lower(number)`    | type error          | runtime type error  | type error (→ unbound) |
| `length(number)`   | type error          | type error          | type error (→ unbound) |
| `year` from time   | error               | type error          | type error (→ unbound) |
| `hours` from date  | error               | type error          | type error (→ unbound) |
| any scalar on null | `NULL` (propagated) | `null` (propagated) | error (→ unbound)      |

The query builder admits only compatible values to the transform, by one of two means:

- a **static short-circuit** when the path's type bears no instance of the extracted component (a temporal subtype
  lacking it, below): the query builder emits a constant `undefined` (for example SQL `NULL`) at query-building time
  instead of the offending call;
- a **per-value type guard** when the path is union-typed or otherwise mixed, admitting the compatible branches and
  resolving the incompatible-branch values to `undefined`:

| Backend    | Domain guard                                            |
|------------|---------------------------------------------------------|
| SQL:2011   | select the variant's typed column (union held per type) |
| GQL:2024   | `v IS TYPED <type>` guard                               |
| SPARQL 1.1 | `FILTER` / `IF` on `datatype(?v)` / `isNumeric(?v)`     |

GQL scalar functions **throw** on a mismatch, so the guard is mandatory there to obtain `undefined` rather than a query
error; SPARQL 1.1, by contrast, resolves a scalar mismatch to unbound natively, so a guard is needed there only for
aggregates. The same per-value guards realise constraint matching over union-typed targets (Section 5.7), admitting the
values of the single branch the bound or option is mapped to and excluding the rest.

The `year` from time and `hours` from date rows above are a finer, subtype-level case: the value is temporal and so
compatible with the transform's domain, but lacks the component extracted (Section 5.8.2.4). The query builder
short-circuits such a pipe to `undefined` rather than emitting the component call, which also sidesteps engines that
coerce instead of erroring (for example, SQL `EXTRACT(HOUR FROM <date>)` returning `0`).

### A.4.2. Aggregate Transforms

Before computing, the query builder restricts each aggregate's input to its compatible values: `undefined` and nulls
drop natively, while incompatible-branch entries (Section 5.8.2) are removed by the same branch guard as for scalar
transforms (Appendix A.4.1), since `SUM` over a typed column (SQL:2011) and SPARQL `SUM` would otherwise raise a type
error rather than skip.
Aggregation uses bag semantics (Section 5.8.2.1): `DISTINCT` (SQL:2011, GQL:2024, SPARQL 1.1) is never applied
implicitly. The target backends match the protocol's bag semantics natively through `COUNT` / `SUM` without `DISTINCT`;
clients needing distinct-value aggregates obtain them through grouping (Section 5.8.2.1).

After invalid values are excluded (Section 5.8.2), aggregates over an empty input set produce:

| Aggregate     | Protocol    | SQL:2011             | GQL:2024 | SPARQL 1.1        |
|---------------|-------------|----------------------|----------|-------------------|
| `count`       | `0`         | `0`                  | `0`      | `0`               |
| `sum`         | `0`         | `NULL` (**differs**) | `0`      | `0`               |
| `avg`         | `undefined` | `NULL`               | `null`   | `0` (**differs**) |
| `min` / `max` | `undefined` | `NULL`               | `null`   | error             |

`count` / `sum` → `0` and `avg` / `min` / `max` → `undefined` match the target backends natively, except SQL `SUM` and
SPARQL `AVG`; see Empty-Set Aggregates (Appendix A.4.3) for the patches.

### A.4.3. Empty-Set Aggregates

Two backends deviate from the protocol's empty-set semantics (Appendix A.4.2) and require client-side normalisation: SQL
`SUM` returns `NULL` instead of `0`, and SPARQL `AVG` returns `0` instead of an unbound binding.

For SQL `sum`:

| Backend    | Normalisation                                   |
|------------|-------------------------------------------------|
| SQL        | `COALESCE(SUM(col), 0)`: standard SQL construct |
| GQL:2024   | none: `sum()` returns `0` natively              |
| SPARQL 1.1 | none: `SUM` returns `0` natively                |

For SPARQL `avg`, Section 18.5.1.4 of [W3C.REC-sparql11-query] defines `Avg` piecewise with
`Avg(M) = "0"^^xsd:integer when Count(M) = 0`, a literal `0`
rather than a derivation from `Sum/Count`. The protocol requires `undefined`. Wrap the binding to force an unbound
projection on the empty case:

| Backend    | Normalisation                                                                               |
|------------|---------------------------------------------------------------------------------------------|
| SQL        | none: `AVG` returns `NULL` natively                                                         |
| GQL:2024   | none: `avg()` returns `null` natively                                                       |
| SPARQL 1.1 | `IF(COUNT(?x) > 0, AVG(?x), <http://www.w3.org/2001/XMLSchema#integer>("unbound")) AS ?avg` |

The cast of a non-numeric string to `xsd:integer` fails, raising an error that propagates as an unbound binding. The
more obvious `1/0` divisor is brittle: some engines (for example, RDF4J) eagerly evaluate both `IF` branches and surface
the `BigInteger divide by zero` exception as an HTTP 500 rather than as an unbound projection.

### A.4.4. Transform Pipes

Structural composition is resolved entirely at query-building time. The query builder validates the structural rules (
scalar after scalar, aggregate after scalar, scalar after aggregate) and rejects structurally invalid pipes (aggregate
after aggregate) outright, before emitting any backend-specific code. No backend-level normalisation is required for
structural composition.

Type compatibility is a separate well-typedness rule (Section 5.8.2), checked in the same query-building pass. The query
builder walks the pipe from its innermost transform outward, and for each transform intersects its declared domain with
the effective type of its input step (the path's type for the innermost transform, the preceding transform's range
otherwise). It rejects the pipe when an intersection is empty, reporting the incompatibility before emitting any
backend-specific code. A non-empty intersection admits the transform: covering the whole input type needs no guard,
while covering only some branches of a union-typed input (Section 5.4) admits the transform on those branches and marks
the rest for guarding.

The builder then uses that shape information to place the branch guards (scalar, Appendix A.4.1; aggregate, Appendix
A.4.2) that filter the incompatible-branch values to `undefined` or exclude them from the reduction. No backend-level
normalisation is required for type compatibility itself: the rejection is emitted by the builder, and the guards are the
only backend-specific code the check produces.

### A.4.5. Branch Guards

A wholly incompatible transform is reported and rejected before query building (Appendix A.4.4). A transform compatible
on at least one branch of a union-typed input is admitted, and the query builder secures the incompatible branches from
its shape information, never emitting a call a backend would reject: a scalar yields `undefined` for their values and an
aggregate drops them (Section 5.8.2).

| Backend    | Handling                                                    |
|------------|-------------------------------------------------------------|
| SQL:2011   | static short-circuit to `NULL`, or typed-column selection   |
| GQL:2024   | `IS TYPED` guard (functions throw otherwise)                |
| SPARQL 1.1 | mismatch resolves to unbound natively; guard for aggregates |

See Appendix A.4.1 (scalar) and A.4.2 (aggregate) for the filtering mechanism.

### A.4.6. Filtering and Grouping

Selection constraints (Section 5.7) partition by aggregate-awareness into pre-grouping filters, grouping keys,
post-grouping (aggregate) filters, and, in ungrouped queries, per-item reductions (Section 5.8.2.1):

| Rule                                            | SQL:2011            | GQL:2024           | SPARQL 1.1        |
|-------------------------------------------------|---------------------|--------------------|-------------------|
| Non-aggregate filter (pre-grouping)             | `WHERE`             | `FILTER`           | `FILTER`          |
| Non-aggregate projection binding (grouping key) | `GROUP BY`          | `GROUP BY`         | `GROUP BY`        |
| Aggregate filter / ordering (post-grouping)     | `HAVING`            | `FILTER`           | `HAVING`          |
| Aggregate filter / ordering (ungrouped)         | correlated subquery | subquery aggregate | grouped subselect |

When the projection includes an aggregate binding, the non-aggregate bindings alone define the grouping key
(Section 5.8.2.1); ordering operators may only sort by an existing grouping key and never extend it. Each backend
enforces this through an explicit `GROUP BY` clause, which folds a null or unbound grouping key into a single group on
every backend, realising the `undefined`-key rule (Section 5.8.2.1) natively.

## A.5. Localised Coalescing

Coalescing (Section 6.2) resolves a localised text map (Section 4.3) by selecting the first tag of the priority
(Section 6.1) present in the map, then gathering the value or values bound to that tag. The priority is pre-expanded to
exact tags, so tag selection is first-present equality and needs no in-query language-range lookup [RFC4647]. One
construct covers both per-tag cardinalities inside the cross-backend intersection: a single-string-per-tag map gathers
one value, an array-per-tag map the winning tag's set.

The construct binds the winning tag by presence alone, then gathers that tag's values, decomposing into five primitives,
each inside the intersection and needing no window function, `LATERAL`, aggregate, or array value type:

| Primitive                    | SQL:2011                   | GQL:2024                      | SPARQL 1.1           |
|------------------------------|----------------------------|-------------------------------|----------------------|
| Seed from target set         | `JOIN (VALUES …)`          | keyed node lookup             | `VALUES`             |
| Presence probe               | `EXISTS (SELECT 1 …)`      | `EXISTS { … }`                | `EXISTS { … }`       |
| Winning-tag scalar (cascade) | searched `CASE WHEN … END` | searched `CASE WHEN … END`    | nested `IF`          |
| Exact tag equality           | `lang = 'de'`              | `t.lang = 'de'`               | `lang(?v) = "de"`    |
| Gather winning set           | `JOIN … ON lang = <CASE>`  | `MATCH … WHERE t.lang = lang` | `BIND(…)` + `FILTER` |

The presence probe and gather are both correlated to the seeded resource. The winning-tag `CASE` sits directly in the
gather's join or filter predicate, so no derived-column nesting or `LATERAL` is forced. GQL binds the winning tag with
`LET` and probes with a graph-pattern `EXISTS { (v)-[:label]->(t) WHERE t.lang = 'de' }`; SPARQL binds `?lang` with
`BIND` before the gather's `FILTER(lang(?label) = ?lang)`. A scalar `COALESCE(v_t1, v_t2, …)` over per-tag values
remains a valid optimiser rewrite of the single-valued path, invisible at the protocol level.

The cascade's searched `CASE WHEN EXISTS` is grammatical under ISO/IEC 39075: the searched case's `WHEN` expression
admits the EXISTS predicate, whereas the simple case (`CASE expr WHEN operand`) excludes it, so the cascade MUST use the
searched form. An engine that omits EXISTS from its documented searched `CASE` is an engine-coverage gap, not a grammar
gap.

In SPARQL, the gather accesses the tag as `if(lang(?x) = "", "und", lang(?x))`, folding the language-neutral encodings
so that a value stored as `"name"@und` and a plain literal both match the `und` branch; the `de`/`fr` probes use exact
`lang(?x) = "…"`. SQL and GQL store the literal tag `und` in a column or property and need no folding.

Storage imposes no further gate: because language tags are not constrained in advance (Section 4.3), a conformant store
cannot encode them as per-tag columns or fixed properties and MUST hold the tag as queryable data, so the tag the
cascade probes is always available as a column, property, or language-tagged literal. The per-tag-column shortcut
applied only to a closed, pre-declared tag set, which a localised map is not.

# Author's Address

Alessandro Bollini  
Metreeca srl

Email: info@metreeca.com  
URI: https://www.metreeca.com/contact
