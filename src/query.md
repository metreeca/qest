# Codec Grammar Test Plan

Test cases for `codec.pegjs` parser conformance to `pub/serialization.md`.

## Query Form Parsing

### Operators

| Operator      | Syntax           | Test Cases                                         |
|---------------|------------------|----------------------------------------------------|
| Equality      | `expr=value`     | Single value, multiple values (OR), wildcard `*`   |
| Disjunctive   | `?expr=value`    | Explicit `?` prefix                                |
| Conjunctive   | `!expr=value`    | AND semantics                                      |
| Focus         | `$expr=value`    | Focus ordering                                     |
| Pattern       | `~expr=value`    | Stemmed word search                                |
| Sort          | `^expr=order`    | `asc`, `ascending`, `desc`, `descending`, numeric  |
| Less/Equal    | `expr<=value`    | Range filter                                       |
| Greater/Equal | `expr>=value`    | Range filter                                       |
| Offset        | `@=value`        | Non-negative integer                               |
| Limit         | `#=value`        | Non-negative integer                               |

### Paths

| Input          | Expected           |
|----------------|--------------------|
| `name`         | `"name"`           |
| `user.profile` | `"user.profile"`   |
| `a.b.c`        | `"a.b.c"`          |

## JSON Value Parsing

### Primitives

| Type       | Input       | Expected        | Notes                    |
|------------|-------------|-----------------|--------------------------|
| Null       | `null`      | `null`          | JSON null literal        |
| True       | `true`      | `true`          | JSON boolean             |
| False      | `false`     | `false`         | JSON boolean             |
| Zero       | `0`         | `0`             | Number                   |
| Integer    | `123`       | `123`           | Number                   |
| Negative   | `-45`       | `-45`           | Number                   |
| Float      | `3.14`      | `3.14`          | Number                   |
| Neg float  | `-0.5`      | `-0.5`          | Number                   |
| Exp lower  | `1e10`      | `1e10`          | Scientific notation      |
| Exp upper  | `1E10`      | `1E10`          | Scientific notation      |
| Exp plus   | `1e+10`     | `1e+10`         | Explicit positive exp    |
| Exp minus  | `1e-10`     | `1e-10`         | Negative exponent        |
| Combined   | `-1.5e-10`  | `-1.5e-10`      | Full format              |

### String Values

| Type          | Input          | Expected       | Notes                    |
|---------------|----------------|----------------|--------------------------|
| Empty quoted  | `""`           | `""`           | Empty string             |
| Simple        | `"hello"`      | `"hello"`      | Basic string             |
| Quoted number | `"123"`        | `"123"`        | Preserved as string      |
| Quoted null   | `"null"`       | `"null"`       | String, not null         |
| Quoted true   | `"true"`       | `"true"`       | String, not boolean      |
| Unquoted      | `hello`        | `"hello"`      | Implicit string          |
| Empty unquot  | (empty)        | `""`           | Empty string             |

### JSON Escape Sequences (RFC 8259)

| Escape     | Input          | Expected  | Notes                     |
|------------|----------------|-----------|---------------------------|
| Quote      | `"a\"b"`       | `a"b`     | Escaped double quote      |
| Backslash  | `"a\\b"`       | `a\b`     | Escaped backslash         |
| Solidus    | `"a\/b"`       | `a/b`     | Escaped forward slash     |
| Backspace  | `"a\bb"`       | `a<BS>b`  | \b                        |
| Form feed  | `"a\fb"`       | `a<FF>b`  | \f                        |
| Newline    | `"a\nb"`       | `a<LF>b`  | \n                        |
| Return     | `"a\rb"`       | `a<CR>b`  | \r                        |
| Tab        | `"a\tb"`       | `a<TAB>b` | \t                        |
| Unicode    | `"\u0041"`     | `A`       | Unicode escape            |
| Unicode    | `"\u00e9"`     | `é`       | Accented character        |
| Unicode    | `"\u4e2d"`     | `中`      | CJK character             |
| Multi      | `"a\n\tb"`     | `a<LF><TAB>b` | Multiple escapes      |

### Localized Strings

| Input                 | Expected               | Notes                    |
|-----------------------|------------------------|--------------------------|
| `"Hello"@en`          | `["Hello", "en"]`      | Simple tag               |
| `"Bonjour"@fr`        | `["Bonjour", "fr"]`    | French                   |
| `"Hallo"@de-DE`       | `["Hallo", "de-DE"]`   | Region subtag            |
| `"Hello"@en-US`       | `["Hello", "en-US"]`   | US English               |
| `"Test"@zh-Hans-CN`   | `["Test", "zh-Hans-CN"]` | Extended tag           |
| `"Line\nbreak"@en`    | `["Line\nbreak", "en"]` | With escape             |
| `"Quote\"d"@en`       | `["Quote\"d", "en"]`   | Escaped quote            |

## Custom Value Parsing

### Sort Direction Values

| Input        | Expected | Notes                    |
|--------------|----------|--------------------------|
| (empty)      | `1`      | Default ascending        |
| `asc`        | `1`      | Ascending                |
| `ASC`        | `1`      | Case insensitive         |
| `ascending`  | `1`      | Long form                |
| `ASCENDING`  | `1`      | Case insensitive         |
| `desc`       | `-1`     | Descending               |
| `DESC`       | `-1`     | Case insensitive         |
| `descending` | `-1`     | Long form                |
| `1`          | `1`      | Numeric positive         |
| `-1`         | `-1`     | Numeric negative         |
| `2`          | `2`      | Arbitrary integer        |
| `1.5`        | ERROR    | Non-integer rejected     |
| `invalid`    | ERROR    | Invalid string rejected  |

### Pagination Values

| Input   | Expected | Notes                    |
|---------|----------|--------------------------|
| `0`     | `0`      | Zero offset/unlimited    |
| `1`     | `1`      | Positive integer         |
| `100`   | `100`    | Larger value             |
| (empty) | ERROR    | Empty rejected           |
| `-1`    | ERROR    | Negative rejected        |
| `1.5`   | ERROR    | Non-integer rejected     |
| `abc`   | ERROR    | Non-numeric rejected     |

## Edge Cases

### Query Structure

| Input                    | Expected                           | Notes                    |
|--------------------------|------------------------------------|--------------------------|
| (empty)                  | `{}`                               | Empty query              |
| `&`                      | `{}`                               | Only separator           |
| `&&`                     | `{}`                               | Multiple separators      |
| `a=1&`                   | `{ "?a": 1 }`                      | Trailing separator       |
| `&a=1`                   | `{ "?a": 1 }`                      | Leading separator        |
| `a=1&&b=2`               | `{ "?a": 1, "?b": 2 }`             | Double separator         |

### URL Encoding

| Input             | Expected           | Notes                    |
|-------------------|--------------------|--------------------------|
| `a=%20`           | `{ "?a": " " }`    | Space                    |
| `a=%3D`           | `{ "?a": "=" }`    | Equals sign              |
| `a=%26`           | `{ "?a": "&" }`    | Ampersand                |
| `a=%22hello%22`   | `{ "?a": "hello" }`| URL-encoded quotes       |
| `a=%E4%B8%AD`     | `{ "?a": "中" }`   | UTF-8 encoded            |

### Equality Grouping (mergePairs)

| Input                     | Expected                          | Notes                    |
|---------------------------|-----------------------------------|--------------------------|
| `a=1`                     | `{ "?a": 1 }`                     | Single → value           |
| `a=1&a=2`                 | `{ "?a": [1, 2] }`                | Multiple → array         |
| `a=1&a=2&a=3`             | `{ "?a": [1, 2, 3] }`             | More values              |
| `a=*`                     | `{ "?a": [] }`                    | Wildcard only → empty    |
| `a=1&a=*`                 | `{ "?a": [1] }`                   | Wildcard ignored         |
| `a=*&a=1`                 | `{ "?a": [1] }`                   | Order irrelevant         |

### Explicit Operators (bypass grouping)

| Input                     | Expected                          | Notes                    |
|---------------------------|-----------------------------------|--------------------------|
| `?a=1&?a=2`               | `{ "?a": 2 }`                     | Last wins (direct)       |
| `!a=1&!a=2`               | `{ "!a": 2 }`                     | Last wins (direct)       |
| `$a=1&$a=2`               | `{ "$a": 2 }`                     | Last wins (direct)       |
| `a=1&?a=2`                | `{ "?a": 2 }`                     | Explicit overwrites      |

### Malformed Input

| Input              | Behavior              | Notes                    |
|--------------------|-----------------------|--------------------------|
| `"unclosed`        | Unquoted string       | Missing end quote        |
| `"text"@`          | Unquoted string       | Missing language tag     |
| `"text"@123`       | Unquoted string       | Invalid tag format       |
| `\u00`             | Pass through          | Incomplete Unicode       |

## Integration Tests

### Full Query

```
status=active&status=pending&~name=corp&price>=100&price<=1000&^date=desc&@=0&#=25
```

Expected:

```json
{
  "?status": ["active", "pending"],
  "~name": "corp",
  ">=price": 100,
  "<=price": 1000,
  "^date": -1,
  "@": 0,
  "#": 25
}
```

### Mixed Operators

```
?type=a&!tag=x&!tag=y&$focus=main&^sort=asc
```

Expected:

```json
{
  "?type": "a",
  "!tag": "y",
  "$focus": "main",
  "^sort": 1
}
```
