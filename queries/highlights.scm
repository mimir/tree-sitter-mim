; ───── Comments ─────
[
  (line_comment)
  (block_comment)
] @comment @spell

(doc_comment) @comment.documentation @spell

; ───── Literals ─────
(nat_literal) @number

(idx_literal) @number

(float_literal) @number.float

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
  "⦃"
  "⦄"
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
