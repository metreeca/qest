import {Identifier} from "./1-identifier.js"

{

  function decodeEscapes(chars) {
    return chars.map(char =>
      char === "\\'" ? "'"
        : char === "\\\\" ? "\\"
        : char
    ).join('');
  }

}

Expression
  = name:NamePrefix? pipe:Transform* path:Path {
      return name ? { name, pipe, path } : { pipe, path };
    }

NamePrefix
  = id:Identifier "=" { return id; }

Transform
  = id:Identifier ":" { return id; }

Path
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

