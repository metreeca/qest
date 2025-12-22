# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unpublished](https://github.com/metreeca/qest/compare/v0.9.1...HEAD)

### Added

- Add `Indexed` type for key-indexed property value containers
- Add `Model` type for projection property value models
- Add `Binding` type for named computed expressions in projections
- Add `isModel()` type guard and `asModel()` validator for projection models
- Add `isBinding()` and `isExpression()` type guards
- Add `BindingPattern` and `ExpressionPattern` regex constants

### Changed

- Extend `Resource` and `Patch` types to support `Indexed` property values
- Extend `Projection` type to support indexed model containers
- Rename `Text`/`Texts` types to `Local`/`Locals` for language-tagged text maps

### Fixed

- Add `Tag` validation for `Local`/`Locals` language maps in resource validators
- Add `TagRange` validation for language-tagged projection keys in query validators
- Add `Identifier | Binding` key validation for projection entries in query validators
- Add `Identifier` key validation for resource and patch entries in state validators

## [0.9.1](https://github.com/metreeca/qest/releases/tag/v0.9.1) - 2025-12-10

### Added

- Query types for client-driven REST/JSON APIs with property selection, filtering, ordering, and pagination
- State types for JSON-LD compatible resource representations
- Query string codecs supporting JSON and form-encoded formats
- Criterion key codecs for encoding/decoding query operators
