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

; The prefix of `0xdeadbeef`, the size of `23i32` and the exponent of `1.5e10` are markers
; within the number rather than digits, and hard to tell from them.  Each is captured under
; its own literal's group, so an undefined group falls back to exactly that - the marker then
; simply looks like the rest of the number.  Define the group with an *attribute only* and no
; colour to set it apart without breaking the literal into two tokens:
;
;   vim.api.nvim_set_hl(0, "@number.suffix", { bold = true })
;
; Neovim combines an extmark that sets no foreground with the one below it, so the marker keeps
; the number's colour and merely gains the attribute.  vim-mim ships these defaults.
(nat_literal
  prefix: (base_prefix) @number.prefix)

(idx_literal
  suffix: (idx_suffix) @number.suffix)

(float_literal
  prefix: (base_prefix) @number.float.prefix)

(float_literal
  exponent: (exponent) @number.float.exponent)

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
