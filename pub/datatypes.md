---
title: Datatypes
summary: Reference for common literal datatype shorthands
description: |
  Mapping of JSON types, XSD 1.1 datatypes, and shorthand names used for
  literal shape definitions, including JavaScript compatibility notes.
---

# Datatype Reference

This document maps JSON types to XSD 1.1 datatypes and the corresponding shorthand names used in literal shape
definitions. It includes range specifications, format patterns, and JavaScript compatibility information.

| [JSON Type](https://datatracker.ietf.org/doc/html/rfc8259#section-3) | [XSD 1.1 Datatype](https://www.w3.org/TR/xmlschema11-2/#built-in-datatypes) ¹ | Name        | Description                                                                                                                    | Range / Format                        |
|----------------------------------------------------------------------|-------------------------------------------------------------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| [boolean](https://datatracker.ietf.org/doc/html/rfc8259#section-3)   | [boolean](https://www.w3.org/TR/xmlschema11-2/#boolean)                       | boolean     | binary-valued logic                                                                                                            | {true, false}                         |
| [number](https://datatracker.ietf.org/doc/html/rfc8259#section-6)    | [byte](https://www.w3.org/TR/xmlschema11-2/#byte)                             | byte        | 8-bit signed integer                                                                                                           | [-2^7, 2^7-1]                         |
|                                                                      | [short](https://www.w3.org/TR/xmlschema11-2/#short)                           | short       | 16-bit signed integer                                                                                                          | [-2^15, 2^15-1]                       |
|                                                                      | [int](https://www.w3.org/TR/xmlschema11-2/#int)                               | int         | 32-bit signed integer                                                                                                          | [-2^31, 2^31-1]                       |
|                                                                      | [long](https://www.w3.org/TR/xmlschema11-2/#long)                             | long ²      | 64-bit signed integer                                                                                                          | [-2^63, 2^63-1]                       |
|                                                                      | [float](https://www.w3.org/TR/xmlschema11-2/#float)                           | float       | IEEE 754 single-precision 32-bit floating point                                                                                | \|m\| < 2^24, e ∈ [-126, 127]         |
|                                                                      | [double](https://www.w3.org/TR/xmlschema11-2/#double)                         | double      | IEEE 754 double-precision 64-bit floating point                                                                                | \|m\| < 2^53, e ∈ [-1022, 1023]       |
|                                                                      | [integer](https://www.w3.org/TR/xmlschema11-2/#integer)                       | integer ²   | arbitrary-precision integers                                                                                                   | `±#`                                  |
|                                                                      | [decimal](https://www.w3.org/TR/xmlschema11-2/#decimal)                       | decimal ²   | arbitrary-precision decimal numbers                                                                                            | `±#.#`                                |
| [string](https://datatracker.ietf.org/doc/html/rfc8259#section-7)    | [string](https://www.w3.org/TR/xmlschema11-2/#string)                         | string      | finite-length sequences of Unicode characters                                                                                  |                                       |
|                                                                      |                                                                               | url         | [RFC 1738](https://datatracker.ietf.org/doc/html/rfc1738) Uniform Resource Locator                                             |                                       |
|                                                                      |                                                                               | uri         | [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) absolute URI reference                                               |                                       |
|                                                                      |                                                                               | email       | [RFC 5321](https://datatracker.ietf.org/doc/html/rfc5321) email address                                                        |                                       |
|                                                                      | [gYear](https://www.w3.org/TR/xmlschema11-2/#gYear)                           | year ⁴      | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Years) calendar year                                                         | `YYYY[Z/±hh:mm]`                      |
|                                                                      | [date](https://www.w3.org/TR/xmlschema11-2/#date)                             | date        | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Dates) calendar date                                                         | `YYYY-MM-DD[Z/±hh:mm]`                |
|                                                                      | [time](https://www.w3.org/TR/xmlschema11-2/#time)                             | time        | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Times) time of day                                                           | `hh:mm:ss[.sss][Z/±hh:mm]`            |
|                                                                      | [dateTime](https://www.w3.org/TR/xmlschema11-2/#dateTime)                     | instant     | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Combined_date_and_time_representations) date and time                        | `YYYY-MM-DDThh:mm:ss[.sss][Z/±hh:mm]` |
|                                                                      | [dateTimeStamp](https://www.w3.org/TR/xmlschema11-2/#dateTimeStamp)           | timestamp ³ | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Combined_date_and_time_representations) timestamp with millisecond precision | `YYYY-MM-DDThh:mm:ss.sssZ`            |
|                                                                      | [duration](https://www.w3.org/TR/xmlschema11-2/#duration)                     | duration    | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Durations) duration                                                          | `[-]P[nY][nM][nD][T[nH][nM][nS]]`     |

## Notes

¹ XSD 1.1 datatypes are referenced by [RDF 1.1](https://www.w3.org/TR/rdf11-concepts/)
and [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) as normative

² Numeric types with ranges exceeding JavaScript's safe integer range (±2^53-1) or requiring arbitrary precision cannot
be fully represented in JSON/JavaScript.

³ The `timestamp` type applies further restrictions beyond `xsd:dateTimeStamp`: requires exactly 3 fractional second
digits (millisecond precision) and UTC timezone (`Z` only)

⁴ XSD permits optional timezone indicators for `gYear` as a deviation from ISO 8601
(see [XSD 1.1 Part 2 § D.3.4](https://www.w3.org/TR/xmlschema11-2/#deviantformats)). Values with and without timezones
are partially ordered and cannot always be definitively compared

## JavaScript Compatibility

| Type                         | JSON                            | XSD                                                              | JavaScript                                                          |
|------------------------------|---------------------------------|------------------------------------------------------------------|---------------------------------------------------------------------|
| boolean                      | `true`, `false`                 | `{true, false, 1, 0}` (canonical: `true`, `false`)               | `true`, `false` (compatible with XSD canonical form)                |
| number (fixed-precision)     | Integer and decimal numbers     | byte, short, int: fully representable                            | Safe integers within ±2^53-1 range                                  |
|                              |                                 | long: may exceed safe range (±2⁶³-1)                             | Cannot natively represent values beyond ±2^53-1                     |
| number (floating-point)      | No `NaN`, `INF`, `-INF`         | float, double: special values `NaN`, `INF`, `-INF` (`NaN = NaN`) | IEEE 754 double-precision with `NaN`, `INF`, `-INF` (`NaN !== NaN`) |
| number (arbitrary-precision) | Limited to safe integer range   | integer: arbitrary-precision integers                            | Requires `BigInt` for values beyond ±2^53-1                         |
|                              | Limited to double precision     | decimal: arbitrary-precision decimal                             | No native support; cannot be natively represented                   |
| string                       | UTF-8 encoded Unicode sequences | Unicode characters (XML 1.0 Char production)                     | UTF-16 encoded sequences (all JS strings are valid XSD strings)     |
