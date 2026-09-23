; ───── Comments ─────
[
  (line_comment)
  (block_comment)
] @comment @spell

(doc_comment) @comment.documentation @spell

; ───── Literals ─────
(nat_literal) @number

(idx_literal) @number

; the size of an `Idx` literal is a type, and `23i32` spells it just like the `i32`
; primitive does - so colour it the same, but keep it inside the number's range
(idx_literal
  suffix: (idx_suffix) @type.builtin)

(float_literal) @number.float

; the base prefix and the exponent are markers within the number, not digits - the nested
; captures keep them inside the literal's range, so they read as one token still
[
  (base_prefix)
  (exponent)
] @punctuation.special

(char_literal) @character

(string_literal) @string

; ───── Keywords ─────
[
  "import"
  "plugin"
  "use"
] @keyword.import

"mod" @keyword.type

[
  "let"
  "axm"
  "rec"
  "and"
  "rule"
  "norm"
  "where"
  "end"
] @keyword

[
  "lam"
  "con"
  "fun"
  "λ"
  "lm"
  "cn"
  "fn"
] @keyword.function

"ret" @keyword.return

[
  "match"
  "with"
  "when"
] @keyword.conditional

[
  "as"
  "inj"
] @keyword.operator

(anx
  "anx" @keyword)

; a modifier is spelled like some of the keywords above, so it comes last
(modifier) @keyword.modifier

; ───── Types ─────
[
  "Type"
  "Rule"
  "Cn"
  "Fn"
] @type.builtin

(primitive) @type.builtin

; `*` abbreviates `Type (0:Univ)`
(star) @type.builtin

[
  (bot)
  (top)
] @constant.builtin

; `tt`/`ff` are `primitive`s, so this has to override the rule above
[
  "tt"
  "ff"
] @boolean

; so is `iN`, which is not a type at all: it is the literal 2^N, a `Nat`.  `IN` is the one that
; names the type `Idx 2^N` and keeps the rule above.
[
  "i1"
  "i8"
  "i16"
  "i32"
  "i64"
] @number

; ───── Operators ─────
[
  "="
  "#"
  ":"
  "@"
  "$"
  "->"
  "→"
  "<-"
  "←"
  "=>"
  "∪"
] @operator

(binary_expression
  operator: _ @operator)

(signed
  sign: _ @operator)

; ───── Punctuation ─────
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "«"
  "»"
  "‹"
  "›"
] @punctuation.bracket

[
  ","
  ";"
  "."
  "|"
] @punctuation.delimiter

; ───── Identifiers ─────
; the general rule comes first; everything below overrides it
(identifier) @variable

((identifier) @type
  (#lua-match? @type "^%u[%w_]*$"))

((identifier) @constant
  (#lua-match? @constant "^_*%u%u[%u%d_]*$"))

; every component of a path but the last one names a module
(path
  (identifier) @module
  .
  (identifier))

; ───── Declarations ─────
(import
  name: (identifier) @module)

(plugin
  name: (identifier) @module)

(mod
  name: (identifier) @module)

[
  (import
    alias: (identifier) @module)
  (plugin
    alias: (identifier) @module)
  (use
    alias: (identifier) @module)
]

(lam
  name: (identifier) @function
  (#not-lua-match? @function "^%u"))

(and
  name: (identifier) @function
  (#not-lua-match? @function "^%u"))

(rec
  name: (identifier) @function
  (#not-lua-match? @function "^%u"))

(rule
  name: (identifier) @function)

(axm
  name: (identifier) @function.builtin)

(axm
  normalizer: (identifier) @function)

(tag
  name: (identifier) @function.builtin
  alias: (identifier)? @function.builtin)

(anx
  name: (identifier) @constant)

; a variant's cases and the arms that name them are constructors, not values -
; an arm without a payload stays a plain binder, since a union arm looks the same
(variant_case
  name: (identifier) @constructor)

(match_arm
  pattern: (identifier) @constructor
  payload: (_))

; ───── Binders ─────
(typed_binder
  name: (identifier) @variable.parameter)

(group
  name: (identifier) @variable.parameter)

(domain
  pattern: (identifier) @variable.parameter)

(domain
  pattern: (tuple_pattern
    (identifier) @variable.parameter))

(alias_pattern
  alias: (identifier) @variable.parameter)

(alias_telescope
  alias: (identifier) @variable.parameter)

(ret
  pattern: (identifier) @variable.parameter)

(ret
  pattern: (tuple_pattern
    (identifier) @variable.parameter))

; ───── Applications ─────
(ret
  callee: (path
    (identifier) @function.call .))

; a capitalized name stays a type, even when applied
(application
  callee: (path
    (identifier) @function.call .)
  (#not-lua-match? @function.call "^%u"))

; the implicit `ret` continuation and its conventional spellings
((identifier) @keyword.return
  (#any-of? @keyword.return "return" "yield" "continue" "break" "merge"))
