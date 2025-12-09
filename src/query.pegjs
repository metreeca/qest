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
 * Query Form-Encoded Format Grammar
 *
 * @see query.ts#form-serialization
 */

{

  const JsonEscapes = {
    'n': '\n', 'r': '\r', 't': '\t', 'b': '\b', 'f': '\f',
    '"': '"', '/': '/', '\\': '\\'
  };

  const LocalizedPattern = /^"((?:[^"\\]|\\.)*)"\s*@\s*([a-zA-Z]+(?:-[a-zA-Z0-9]+)*)$/;
  const NumberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
  const IdentifierPattern = /^[_$\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*$/u;


  function decodeValue(str) {
    try { return decodeURIComponent(str.replace(/\+/g, " ")); }
    catch { return str; }
  }

  function parseJsonString(str) {
    return str.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (match, seq) =>
      seq.startsWith('u') ? String.fromCharCode(parseInt(seq.slice(1), 16))
        : JsonEscapes[seq] ?? seq
    );
  }

  function parseValue(str) {
    const decoded = decodeValue(str);
    const localized = decoded.match(LocalizedPattern);

    return localized ? [parseJsonString(localized[1]), localized[2]]
      : decoded.startsWith('"') && decoded.endsWith('"') ? parseJsonString(decoded.slice(1, -1))
      : decoded === "true" ? true
      : decoded === "false" ? false
      : decoded === "null" ? null
      : NumberPattern.test(decoded) ? Number(decoded)
      : decoded;
  }

  function mergePairs(pairs) {
    const isOperator = ([key]) => /^[@#^~?!$<>]/.test(key);
    const isMultiValue = ([key]) => /^[?!$]/.test(key);

    const operators = pairs
      .filter(isOperator)
      .reduce((merged, [key, value]) => ({
        ...merged,
        [key]: isMultiValue([key]) && key in merged
          ? (Array.isArray(merged[key]) ? [...merged[key], value] : [merged[key], value])
          : value
      }), {});

    const grouped = pairs
      .filter(p => !isOperator(p))
      .reduce((groups, [key, value]) => ({
        ...groups,
        [key]: {
          values: value === "*" ? (groups[key]?.values ?? []) : [...(groups[key]?.values ?? []), value],
          hasWildcard: value === "*" || (groups[key]?.hasWildcard ?? false)
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

    return { ...operators, ...equality };
  }

}


/// Primitives /////////////////////////////////////////////////////////////////////////////////////////////////////////

Identifier "identifier"
  = id:$[^.=<>&:!?~^@#$\[\]]+ &{ return IdentifierPattern.test(id); }

Integer "integer"
  = n:$("-"? [0-9]+) { return parseInt(n, 10); }


/// Query //////////////////////////////////////////////////////////////////////////////////////////////////////////////

Query
  = pairs:PairList { return mergePairs(pairs); }

PairList
  = first:Pair? rest:("&" @Pair?)* { return [first, ...rest].filter(p => p !== null); }

Pair
  = LtePrefixPair   // <= before < (prefix)
  / GtePrefixPair   // >= before > (prefix)
  / LtPair
  / GtPair
  / LtePostfixPair  // postfix before equality
  / GtePostfixPair
  / LtPostfixPair
  / GtPostfixPair
  / LikePair
  / DisjunctivePair
  / ConjunctivePair
  / FocusPair
  / SortPair
  / OffsetPair
  / LimitPair
  / EqualityPair
  / BareExprPair


/// Comparisons ////////////////////////////////////////////////////////////////////////////////////////////////////////

LtPair
  = "<" expr:Expr "=" value:Value { return ["<" + expr, parseValue(value)]; }

GtPair
  = ">" expr:Expr "=" value:Value { return [">" + expr, parseValue(value)]; }

LtePrefixPair
  = "<=" expr:Expr "=" value:Value { return ["<=" + expr, parseValue(value)]; }

GtePrefixPair
  = ">=" expr:Expr "=" value:Value { return [">=" + expr, parseValue(value)]; }

LtePostfixPair
  = expr:Expr "<=" value:Value { return ["<=" + expr, parseValue(value)]; }

GtePostfixPair
  = expr:Expr ">=" value:Value { return [">=" + expr, parseValue(value)]; }

LtPostfixPair
  = expr:Expr "<" value:Value { return ["<" + expr, parseValue(value)]; }

GtPostfixPair
  = expr:Expr ">" value:Value { return [">" + expr, parseValue(value)]; }


/// Matching ///////////////////////////////////////////////////////////////////////////////////////////////////////////

LikePair
  = "~" expr:Expr "=" value:Value { return ["~" + expr, parseValue(value)]; }

DisjunctivePair
  = "?" expr:Expr "=" value:Value { return ["?" + expr, parseValue(value)]; }

ConjunctivePair
  = "!" expr:Expr "=" value:Value { return ["!" + expr, parseValue(value)]; }


/// Ordering ///////////////////////////////////////////////////////////////////////////////////////////////////////////

FocusPair
  = "$" expr:Expr "=" value:Value { return ["$" + expr, parseValue(value)]; }

SortPair
  = "^" expr:Expr "=" value:Direction { return ["^" + expr, value]; }

Direction
  = $("asc"i ("ending"i)?)
  / $("desc"i ("ending"i)?)
  / n:Integer &([&] / !.) { return n; }
  / $[^&]+ { error("invalid sort direction"); }


/// Pagination /////////////////////////////////////////////////////////////////////////////////////////////////////////

OffsetPair
  = "@=" value:Pagination { return ["@", value]; }

LimitPair
  = "#=" value:Pagination { return ["#", value]; }

Pagination
  = n:$[0-9]+ &([&] / !.) { return parseInt(n, 10); }
  / $[^&]+ { error("invalid pagination value"); }


/// Equality ///////////////////////////////////////////////////////////////////////////////////////////////////////////

EqualityPair
  = expr:Expr "=" value:Value { return [expr, value === "*" ? "*" : parseValue(value)]; }

BareExprPair
  = expr:Expr { return [expr, ""]; }


/// Expressions ////////////////////////////////////////////////////////////////////////////////////////////////////////

Expr
  = $(Transform* Path)

Transform
  = Identifier ":"

Path
  = Identifier ("." Identifier)*


/// Values /////////////////////////////////////////////////////////////////////////////////////////////////////////////

Value
  = $[^&]*
