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
      const result = {
        pipe,
        path
      };
      if (name !== null && name !== undefined) {
        result.name = name;
      }
      return result;
    }

NamePrefix
  = id:Identifier "=" { return id; }

Transform
  = id:Identifier ":" { return id; }

Path
  = prefix:Prefix? first:FirstProperty? rest:PropertyAccessor* {
      const properties = [];
      if (first !== undefined && first !== null) properties.push(first);
      if (rest) properties.push(...rest);
      return properties;
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

Identifier
  = [a-zA-Z_$][a-zA-Z0-9_$]* { return text(); }
