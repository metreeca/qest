# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unpublished](https://github.com/metreeca/qest/compare/v0.9.2...HEAD)

### Added

- Add `Union` type and `isUnion`/`isUnionIndex` guards for indexed union-typed property templates with per-branch
	placeholders
- Add `Projection` type and `isProjection` guard for collection property projections mapping bindings to cell models
- Add `Selection` type and `isSelection` guard for collection filtering, sorting, and pagination constraints
- Add `encodeSelection`/`decodeSelection` codecs for `Selection` form serialization
- Add `Placeholders`/`Placeholder` types and `isPlaceholders`/`isPlaceholder` guards for property template value forms
- Add `TransformSignature` type and expose per-transform signatures through the `Transforms` registry
- Add `Instance<T>`, `Slots<T>`, `Name<K>`, and `Index<T>` type-inference utilities deriving fetched resource shapes from templates
- Add `Pipe` and `Path` type aliases extracted from `Expression`
- Add `isSelector`, `isAggregate`, and `isVacuous` type guards
- Add `lower`, `upper`, `length` string transforms
- Add `format` option to `encodeTemplate` (`json`, `url`, or `base64`) with decoder auto-detection
- Add `indent` encoder option for pretty-printing encoded JSON output
- Add `lenient` decoder option to skip structural validation

### Changed

- Rename `./index` package export to `.` (root entry point)
- Rename `./state` module to `./resource`; rename `./model` module to `./template`
- Move `Literal` and `Reference` types from the state module to the index module
- Split `CodecOpts` into separate `EncoderOpts` and `DecoderOpts` types
- Merge `Local`/`Locals` types into a unified `Text` type; merge `isLocal`/`isLocals` into `isText`
- Merge `LocalModel`/`LocalsModel` into a unified `Locale` template; merge their guards into `isLocale`
- Rename `ValuesModel` to `Template`; rename `isValuesModel` to `isTemplate`
- Rename `Criterion` to `Probe`; rename `isCriterion`/`encodeCriterion`/`decodeCriterion` accordingly
- Rename `encodeQuery`/`decodeQuery` to `encodeTemplate`/`decodeTemplate`
- Redefine `Model` as the single-value placeholder union (scalar, union branch, or localised), replacing the former
	resource projection model
- Redefine `Query` as an `[element, Selection?]` tuple (`[Union | Placeholder | Projection, Selection?]`); filtering,
	sorting, and pagination move to `Selection`
- Replace the `Transform` registry-entry object type with a closed string union validated by `isTransform`
- Extend `Binding` to accept a plain `Identifier` as shorthand for `{id}={id}`
- Drop the `Indexed`/`Indexable` property wrapper from `Resource` and `Template`; property values are now optional
	(`undefined | Values` and `undefined | Placeholders`)
- Restrict `Union` template branches to `Placeholder`; `Locale` is no longer admitted as a union branch
- Rename the focus-ordering `Operator` from `*` to `+`
- Replace `zxx` language tag with `und` for language-neutral values
- Restrict `Locale` map keys to RFC 4647 basic language ranges (a subtag sequence or the standalone `*`); extended
	ranges (for example `de-*` or `*-CH`) are no longer accepted
- Require `@metreeca/core` `^0.9.19` for RFC 4647 basic-filtering language ranges

### Removed

- Remove the `Indexed` type and `isIndexed`/`isIndexable` guards
- Remove the `Patch` type, `isPatch` guard, and `encodePatch`/`decodePatch` codecs
- Remove the `ValueModel` type and `isValueModel` guard, inlined into the placeholder union
- Remove the `sample` aggregate transform
- Remove the empty-string-keyed `{ "": … }` default placeholder form

### Fixed

- Extend the form codec to encode/decode nested containers via stacked postfix `@key` suffixes
- Reconstruct `Text` objects from tagged form parameters during form decoding
- Accept plain strings and string arrays as `Text`/`Locale` shorthands for language-neutral values

## [0.9.2](https://github.com/metreeca/qest/releases/tag/v0.9.2) - 2026-02-09

### Added

- Add `defaultBase` IRI constant (`app:/`) as default base for codec operations
- Add `index` module with `CodecOpts` configuration type
- Add generic `Indexed<T>` type for key-indexed property value containers
- Add `Model` type for resource projection models
- Add `ValuesModel` type for property projection specs
- Add `ValueModel`, `LocalModel`, `LocalsModel` types for model value variants
- Add `isValueModel()`, `isLocalModel()`, `isLocalsModel()` type guards
- Add `Binding` type for named computed expressions in projections
- Add `hours`, `minutes`, `seconds` time-component transforms to `Transforms` registry

### Changed

- Restrict `isReference()` to accept only absolute IRIs (was accepting relative)
- Rename `query` module to `model` (export path `./query` → `./model`)
- Migrate validators to composable `is*()` type guard pattern
- Remove `ascending`/`descending` sort direction values (use `asc`/`desc` instead)
- Extend `Resource` type to support `Indexed` property values
- Extend `ValuesModel` type to support indexed model containers
- Rename `Text`/`Texts` types to `Local`/`Locals` for language-tagged text maps
- Upgrade `@metreeca/core` dependency to `^0.9.18`

### Fixed

- Fix expression grammar to support empty expressions and aggregates without path
- Add `Tag` validation for `Local`/`Locals` language maps in resource validators
- Add `TagRange` validation for language-tagged projection keys in query validators
- Add `Identifier | Binding` key validation for projection entries in query validators
- Add `Identifier` key validation for resource and patch entries in state validators

### Removed

- Remove `@metreeca/type` dependency

## [0.9.1](https://github.com/metreeca/qest/releases/tag/v0.9.1) - 2025-12-10

### Added

- Query types for client-driven REST/JSON APIs with property selection, filtering, ordering, and pagination
- State types for JSON-LD compatible resource representations
- Query string codecs supporting JSON and form-encoded formats
- Probe key codecs for encoding/decoding query operators
