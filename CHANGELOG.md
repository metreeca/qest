# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unpublished](https://github.com/metreeca/qest/compare/v0.9.2...HEAD)

### Added

- Add `encodeModel`/`decodeModel` codecs for `Model` serialization with IRI internalization/resolution
- Add `lower`, `upper`, `length` string transforms to `Transform` enum
- Add `indent` option to `EncoderOpts` for pretty-printing encoded JSON output
- Add `lenient` option to `DecoderOpts` to skip structural validation in decoders

### Changed

- Split `CodecOpts` into separate `EncoderOpts` and `DecoderOpts` types
- Extract type guards into companion `.core.ts` modules
- Replace `zxx` language tag with `und` for language-neutral values
- Replace `Transform` enum with closed string union type
- Close transform set: `Probe.pipe` now typed as `Transform[]` and validated by `isTransform`
- Extend `Binding` to accept plain `Identifier` as shorthand for `{id}={id}`
- Align `decodeProbe`/`encodeProbe` with shorthand `Binding` semantics
- Merge `Local`/`Locals` state types into unified `Localised` type accepting both scalar and array forms per tag
- Merge `Locale`/`Locales` model types into unified `Locale` template accepting both scalar and array tag ranges
- Merge `isLocal()`/`isLocals()` guards into `isLocalised()`; merge `isLocale()`/`isLocales()` into `isLocale()`
- Rename `ValuesModel` to `Template`, `LocalModel` to `Locale`, `LocalsModel` to `Locales`
- Rename `Criterion` to `Probe`; rename `isCriterion`, `encodeCriterion`, `decodeCriterion` accordingly
- Inline `ValueModel` into `Template` union; remove `isValueModel` guard

### Removed

- Remove `sample` aggregate transform from `Transform` set
- Remove `Patch` type, `isPatch` guard, `encodePatch`/`decodePatch` codecs

### Fixed

- Fix form codec to reconstruct `Localised` objects from tagged form parameters during decoding
- Accept plain strings and string arrays as `Localised`/`Locale` shorthands for language-neutral values

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
