# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unpublished](https://github.com/metreeca/qest/compare/v0.9.1...HEAD)

### Added

- Add `index` module with `CodecOpts` configuration type
- Add generic `Indexed<T>` type for key-indexed property value containers
- Add `Model` type for resource projection models
- Add `ValuesModel` type for property projection specs
- Add `ValueModel`, `LocalModel`, `LocalsModel` types for model value variants
- Add `isValueModel()`, `isLocalModel()`, `isLocalsModel()` type guards
- Add `Binding` type for named computed expressions in projections

### Changed

- Rename `query` module to `model` (export path `./query` → `./model`)
- Migrate validators to composable `is*()` type guard pattern
- Remove `ascending`/`descending` sort direction values (use `asc`/`desc` instead)
- Extend `Resource` and `Patch` types to support `Indexed` property values
- Extend `ValuesModel` type to support indexed model containers
- Rename `Text`/`Texts` types to `Local`/`Locals` for language-tagged text maps

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
- Criterion key codecs for encoding/decoding query operators
