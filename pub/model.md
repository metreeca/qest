# Limitations

- no support for typed literal
  - controlled XSD datatypes subset
- no support for plain literals @language @containers (ie "@none" tags)
  - use string | dictionary union
  - or use zxx to clearly mark non-localized content wihin dictionaries
- at most one class per resource shape
