/*
 * Copyright © 2025 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Codec Grammar
 *
 * Parses Query form-encoded format as specified in pub/serialization.md
 *
 * @see pub/serialization.md#query-form-serialization
 */

{

  function decodeEscapes(chars) {
    return chars.map(char =>
      char === "\\'" ? "'"
        : char === "\\\\" ? "\\"
        : char
    ).join('');
  }

  function decodeURIComponentSafe(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }

  function parseValue(str) {
    // Replace + with space before decoding (application/x-www-form-urlencoded)
    const decoded = decodeURIComponentSafe(str.replace(/\+/g, " "));

    // Localized string: "text"@lang → [text, lang]
    const localizedMatch = decoded.match(/^"((?:[^"\\]|\\.)*)"\s*@\s*([a-zA-Z]+(?:-[a-zA-Z0-9]+)*)$/);
    if (localizedMatch) {
      return [parseJsonString(localizedMatch[1]), localizedMatch[2]];
    }

    // JSON string (double-quoted)
    if (decoded.startsWith('"') && decoded.endsWith('"')) {
      return parseJsonString(decoded.slice(1, -1));
    }

    // Boolean / null
    if (decoded === "true") {
      return true;
    }
    if (decoded === "false") {
      return false;
    }
    if (decoded === "null") {
      return null;
    }

    // JSON number
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(decoded)) {
      return Number(decoded);
    }

    // Unquoted string
    return decoded;
  }

  function parseJsonString(str) {
    // Handle JSON escape sequences (RFC 8259)
    return str.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (match, seq) => {
      if (seq.startsWith('u')) {
        return String.fromCharCode(parseInt(seq.slice(1), 16));
      }
      switch (seq) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'b': return '\b';
        case 'f': return '\f';
        case '"': return '"';
        case '/': return '/';
        case '\\': return '\\';
        default: return seq;
      }
    });
  }

  function parseDirection(value) {
    const lower = value.toLowerCase();
    if (lower === "asc" || lower === "ascending" || lower === "") {
      return 1;
    } else if (lower === "desc" || lower === "descending") {
      return -1;
    } else {
      const num = Number(value);
      if (!Number.isInteger(num)) {
        error("invalid sort order value");
      }
      return num;
    }
  }

  function parsePagination(value) {
    const num = Number(value);
    if (value === "") {
      error("empty pagination value");
    } else if (!Number.isInteger(num) || num < 0) {
      error("invalid pagination value");
    }
    return num;
  }

  function mergePairs(pairs) {
    const isOperator = ([key]) => /^[@#^~?!$<>]/.test(key);
    const isMultiValueOperator = ([key]) => /^[?!$]/.test(key);

    // Handle operator-prefixed pairs
    const direct = {};
    for (const [key, value] of pairs.filter(isOperator)) {
      if (isMultiValueOperator([key])) {
        // ?/!/$ operators accumulate multiple values into arrays
        if (key in direct) {
          const existing = direct[key];
          direct[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
        } else {
          direct[key] = value;
        }
      } else {
        // Other operators (@/#/^/~/</>/<=/>=) just overwrite
        direct[key] = value;
      }
    }

    const grouped = pairs
      .filter(p => !isOperator(p))
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: {
          values: value === "*" ? (acc[key]?.values ?? []) : [...(acc[key]?.values ?? []), value],
          hasWildcard: value === "*" || (acc[key]?.hasWildcard ?? false)
        }
      }), {});

    const equality = Object.fromEntries(
      Object.entries(grouped).map(([expr, { values, hasWildcard }]) => [
        "?" + expr,
        hasWildcard && values.length === 0 ? []
          : values.length === 1 ? values[0]
          : values
      ])
    );

    return { ...direct, ...equality };
  }

}

// ============================================================================
// Identifier
// ============================================================================

Identifier "identifier"
  = $([a-zA-Z_$][a-zA-Z0-9_$]*)

// ============================================================================
// Path (simple dot-separated identifiers)
// ============================================================================

Path "path"
  = first:Identifier rest:("." @Identifier)* { return [first, ...rest]; }

// ============================================================================
// Expression
// ============================================================================

Expression
  = name:NamePrefix? pipe:Transform* path:ExpressionPath {
      return name ? { name, pipe, path } : { pipe, path };
    }

NamePrefix
  = id:Identifier "=" { return id; }

Transform
  = id:Identifier ":" { return id; }

ExpressionPath
  = prefix:Prefix? first:FirstProperty? rest:PropertyAccessor* {
      return [first, ...rest].filter(p => p != null);
    }

Prefix
  = "$" &("." / "[" / !.) / "." &([a-zA-Z_$] / "[" / !.)

FirstProperty
  = Identifier
  / BracketProperty

PropertyAccessor
  = "." id:Identifier { return id; }
  / BracketProperty

BracketProperty
  = "[" "'" chars:SingleQuotedChar* "'" "]" {
      return decodeEscapes(chars);
    }

SingleQuotedChar
  = "\\'" { return "\\'"; }
  / "\\\\" { return "\\\\"; }
  / [^'\\] { return text(); }

// ============================================================================
// Query (form-encoded)
// ============================================================================

Query
  = pairs:PairList { return mergePairs(pairs); }

PairList
  = first:Pair? rest:("&" @Pair?)* {
      return [first, ...rest].filter(p => p !== null);
    }

Pair
  = OffsetPair
  / LimitPair
  / SortPair
  / LikePair
  / DisjunctivePair
  / ConjunctivePair
  / FocusPair
  / LtePrefixPair
  / GtePrefixPair
  / LtPair
  / GtPair
  / LtePair
  / GtePair
  / LtPostfixPair
  / GtPostfixPair
  / EqualityPair
  / BareIdentifierPair

OffsetPair
  = "@=" value:Value { return ["@", parsePagination(value)]; }

LimitPair
  = "#=" value:Value { return ["#", parsePagination(value)]; }

SortPair
  = "^" expr:QueryPath "=" value:Value { return ["^" + expr, parseValue(value)]; }

LikePair
  = "~" expr:QueryPath "=" value:Value { return ["~" + expr, parseValue(value)]; }

DisjunctivePair
  = "?" expr:QueryPath "=" value:Value { return ["?" + expr, parseValue(value)]; }

ConjunctivePair
  = "!" expr:QueryPath "=" value:Value { return ["!" + expr, parseValue(value)]; }

FocusPair
  = "$" expr:QueryPath "=" value:Value { return ["$" + expr, parseValue(value)]; }

LtPair
  = "<" expr:QueryPath "=" value:Value { return ["<" + expr, parseValue(value)]; }

GtPair
  = ">" expr:QueryPath "=" value:Value { return [">" + expr, parseValue(value)]; }

LtePrefixPair
  = "<=" expr:QueryPath "=" value:Value { return ["<=" + expr, parseValue(value)]; }

GtePrefixPair
  = ">=" expr:QueryPath "=" value:Value { return [">=" + expr, parseValue(value)]; }

LtePair
  = expr:QueryPath "<=" value:Value { return ["<=" + expr, parseValue(value)]; }

GtePair
  = expr:QueryPath ">=" value:Value { return [">=" + expr, parseValue(value)]; }

LtPostfixPair
  = expr:QueryPath "<" value:Value { return ["<" + expr, parseValue(value)]; }

GtPostfixPair
  = expr:QueryPath ">" value:Value { return [">" + expr, parseValue(value)]; }

EqualityPair
  = expr:QueryPath "=" value:Value {
      return [expr, value === "*" ? "*" : parseValue(value)];
    }

BareIdentifierPair
  = expr:QueryPath { return [expr, ""]; }

QueryPath
  = expr:QueryExpr { return expr; }

// QueryExpr captures transform expressions like "year:releaseDate" or "round:avg:items.price"
QueryExpr
  = $(Transform* Path)

Value
  = $[^&]*
