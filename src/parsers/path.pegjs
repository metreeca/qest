{

  function decodeEscapes(chars) {
    return chars.map(char => {
      if (char === "\\'") return "'";
      if (char === "\\\\") return "\\";
      return char;
    }).join('');
  }

}

Path
  = prefix:Prefix? first:FirstProperty? rest:PropertyAccessor* {
      const properties = [];
      if (first !== undefined && first !== null) properties.push(first);
      if (rest) properties.push(...rest);
      return properties;
    }

Prefix
  = "$" &("." / "[" / !.) / "."

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
