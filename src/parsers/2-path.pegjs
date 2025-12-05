// Shared Path rule - dot-separated identifiers

import {Identifier} from "./1-identifier.js"

Path "path"
  = first:Identifier rest:("." @Identifier)* { return [first, ...rest]; }
