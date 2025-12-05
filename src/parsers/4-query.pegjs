import {Path} from "./2-path.js"

{

  function decodeURIComponentSafe(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }

  function parseValue(str) {
    const decoded = decodeURIComponentSafe(str);
    if (decoded === "") {
      return null;
    } else if (decoded.startsWith("'") && decoded.endsWith("'")) {
      return decoded.slice(1, -1);
    } else if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(decoded)) {
      return Number(decoded);
    } else {
      return decoded;
    }
  }

  function parseDirection(value) {
    const lower = value.toLowerCase();
    if (lower === "increasing" || lower === "") {
      return 1;
    } else if (lower === "decreasing") {
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
    const isOperator = ([key]) => /^[@#^~<>]/.test(key);

    const direct = Object.fromEntries(pairs.filter(isOperator));

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
  / LtePair
  / GtePair
  / EqualityPair

OffsetPair
  = "@=" value:Value { return ["@", parsePagination(value)]; }

LimitPair
  = "#=" value:Value { return ["#", parsePagination(value)]; }

SortPair
  = "^" expr:QueryPath "=" value:Value { return ["^" + expr, parseDirection(value)]; }

LikePair
  = "~" expr:QueryPath "=" value:Value { return ["~" + expr, parseValue(value)]; }

LtePair
  = expr:QueryPath "<=" value:Value { return ["<=" + expr, parseValue(value)]; }

GtePair
  = expr:QueryPath ">=" value:Value { return [">=" + expr, parseValue(value)]; }

EqualityPair
  = expr:QueryPath "=" value:Value {
      return [expr, value === "*" ? "*" : parseValue(value)];
    }

QueryPath
  = path:Path { return path.join("."); }

Value
  = $[^&]*
