/**
 * @file Tree-sitter grammar for Mim, the front-end language of MimIR
 * @author Manuel Lata <contact@mlata.me>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// The precedence ladder of `docs/langref.md`, from loosest to tightest binding, spread out
// so that the two levels below `where` fit in.  `Err`, `Bot` and `Pi` name no syntax there
// and only bound how far a nested expression may extend, which here falls out of the rules
// themselves - `trailing` and `binder` take their place.
const PREC = {
  // Forms whose trailing expression extends as far as it possibly can: a `λ`/`ret`/`match`
  // body, the final expression of a declaration expression, and a `Cn` domain.  Below
  // everything, so every operator is shifted into that trailing expression instead.
  trailing: -1,
  // `I: e` - the type reaches across `→` and `where`, as it does within `[...]`.
  binder: 1,
  where: 10,
  ins: 20,
  inj: 30,
  union: 40,
  arrow: 50,
  eq: 70,
  rel: 80,
  add: 90,
  mul: 100,
  shift: 110,
  app: 120,
  extract: 130,
  lit: 140,
};

/** A comma-separated list of one or more `rule` with an optional trailing comma. */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}

/** A possibly empty comma-separated list with an optional trailing comma. */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/** An `import`/`plugin` declaration; the two differ only in `keyword`. */
function dependency($, keyword) {
  return seq(
    repeat($.modifier),
    keyword,
    field("name", choice($.identifier, $.string_literal)),
    optional($._as_clause),
    ";",
  );
}

module.exports = grammar({
  name: "mim",

  word: $ => $.identifier,

  externals: $ => [
    $.doc_content,
    $.error_sentinel,
  ],

  extras: $ => [
    /\s/,
    $.line_comment,
    $.doc_comment,
    $.block_comment,
  ],

  supertypes: $ => [
    $.declaration,
    $.expression,
    $.primary_expression,
    $.infix_expression,
    $.pattern,
    $.telescope,
  ],

  inline: $ => [
    $._atom,
    $._app_expression,
  ],

  conflicts: $ => [
    // `a b c: Nat` is a group, `f x y` an application; only the trailing `:` tells them apart.
    [$.group, $.path],
  ],

  rules: {
    source_file: $ => repeat(choice($.declaration, ";")),

    /*
     * declarations
     */

    declaration: $ => choice(
      $.import,
      $.plugin,
      $.use,
      $.mod,
      $.let,
      $.anx,
      $.axm,
      $.lam,
      $.rec,
      $.rule,
    ),

    modifier: $ => choice("priv", "pub", "extern", "anx"),

    _as_clause: $ => seq("as", field("alias", choice($.identifier, "*"))),

    // `import` and `plugin` differ only in the keyword: both take a module name or a file name.
    import: $ => dependency($, "import"),
    plugin: $ => dependency($, "plugin"),

    use: $ => seq(
      repeat($.modifier),
      "use",
      field("path", $.path),
      optional($._as_clause),
      ";",
    ),

    mod: $ => seq(
      repeat($.modifier),
      "mod",
      field("name", $.identifier),
      "{",
      repeat(choice($.declaration, ";")),
      "}",
    ),

    let: $ => seq(
      repeat($.modifier),
      "let",
      field("pattern", $.pattern),
      "=",
      field("value", $.expression),
    ),

    // `anx I = path` - an alias for the annex `path` denotes.
    anx: $ => seq(
      repeat($.modifier),
      "anx",
      field("name", $.identifier),
      "=",
      field("target", $.path),
    ),

    axm: $ => seq(
      repeat($.modifier),
      "axm",
      choice(
        seq(field("name", $.identifier), ":", field("type", $.expression)),
        seq(
          optional(seq(field("name", $.identifier), ".")),
          $.tag_list,
          ":",
          field("type", $.expression),
        ),
      ),
      optional(seq(",", field("normalizer", $.identifier))),
      optional(seq(
        ",",
        field("curry", $.nat_literal),
        optional(seq(",", field("trip", $.nat_literal))),
      )),
    ),

    tag_list: $ => seq("(", commaSep($.tag), ")"),

    tag: $ => seq(
      field("name", $.identifier),
      repeat(seq("=", field("alias", $.identifier))),
    ),

    lam: $ => prec.right(seq(
      repeat($.modifier),
      field("kind", choice("lam", "con", "fun")),
      field("name", $.identifier),
      repeat1($.domain),
      optional(seq(":", field("codomain", $.expression))),
      choice(
        seq("=", field("body", $.expression)),
        ";", // a bodyless `extern` forward declaration
      ),
      repeat($.and),
    )),

    rec: $ => prec.right(seq(
      repeat($.modifier),
      "rec",
      field("name", $.identifier),
      "=",
      field("body", $.expression),
      repeat($.and),
    )),

    and: $ => choice(
      seq("and", field("name", $.identifier), "=", field("body", $.expression)),
      seq(
        "and",
        field("kind", choice("lam", "con", "fun")),
        field("name", $.identifier),
        repeat1($.domain),
        optional(seq(":", field("codomain", $.expression))),
        "=",
        field("body", $.expression),
      ),
    ),

    rule: $ => seq(
      repeat($.modifier),
      field("kind", choice("rule", "norm")),
      field("name", $.identifier),
      field("pattern", $.pattern),
      ":",
      field("lhs", $.expression),
      optional(seq("when", field("guard", $.expression))),
      "=>",
      field("rhs", $.expression),
    ),

    // `d+ e` - one or more declarations followed by the resulting expression.
    _declarations: $ => prec.left(repeat1(seq($.declaration, repeat(";")))),

    /*
     * patterns and telescopes
     *
     * A pattern destructs a value, a telescope describes a type.  The two are identical
     * except that a telescope additionally admits a bare expression - which is what makes
     * almost anything parse as a telescope and forces the conflicts declared above.
     */

    pattern: $ => choice(
      $.identifier,
      $.typed_binder,
      $.tuple_pattern,
      $.alias_pattern,
    ),

    telescope: $ => choice(
      $.typed_binder,
      $.alias_telescope,
      $.expression,
    ),

    // `I: e`; the type extends as far as it can, as within `[...]`.
    typed_binder: $ => prec.right(PREC.binder, seq(
      field("name", $.identifier),
      ":",
      field("type", $.expression),
    )),

    // `I+ ":" e` distributes one type over several names; only ever a list element.
    group: $ => seq(
      field("name", $.identifier),
      repeat1(field("name", $.identifier)),
      ":",
      field("type", $.expression),
    ),

    tuple_pattern: $ => seq("(", commaSep(choice($.group, $.pattern)), ")"),

    // `{...}` - an implicit domain; its elements are telescopes.
    implicit: $ => seq("{", commaSep(choice($.group, $.telescope)), "}"),

    alias_pattern: $ => prec.left(PREC.binder, seq(
      $.pattern,
      "as",
      field("alias", $.identifier),
    )),

    // `t as I`; restricted to the bracketed forms, where it is actually useful -
    // `[...] as I -> e` names the whole domain of a dependent function type.
    alias_telescope: $ => prec.left(PREC.binder, seq(
      choice($.sigma, $.implicit, $.alias_telescope),
      "as",
      field("alias", $.identifier),
    )),

    // `p ("@" e)?` - a lambda domain plus its partial-evaluation filter.
    domain: $ => prec.right(seq(
      field("pattern", choice($.pattern, $.sigma, $.implicit)),
      optional($.filter),
    )),

    filter: $ => seq("@", field("value", $.expression)),

    /*
     * expressions
     */

    expression: $ => choice(
      $.primary_expression,
      $.infix_expression,
    ),

    primary_expression: $ => choice(
      $._operand,
      // `*` and a signed literal are the two primary expressions that may never stand as
      // an application argument: after a complete expression, `*`, `+` and `-` are always
      // the infix operators, so `f *` multiplies and `f -23` subtracts.
      $.star,
      $.signed,
    ),

    // A primary expression that may also stand as an application argument.
    _operand: $ => choice(
      $.primitive,
      $.path,
      $.type,
      $.rule_type,
      $.nat_literal,
      $.idx_literal,
      $.float_literal,
      $.char_literal,
      $.string_literal,
      $.bot,
      $.top,
      $.annotated,
      $.decl_expr,
      $.cn_type,
      $.fn_type,
      $.lambda,
      $.ret,
      $.uniq,
      $.array,
      $.pack,
      $.sigma,
      $.tuple,
      $.match,
    ),

    infix_expression: $ => choice(
      $.extract,
      $.insert,
      $.application,
      $.binary_expression,
      $.pi,
      $.union,
      $.injection,
      $.where,
    ),

    primitive: $ => choice(
      "Univ",
      "Nat",
      "Idx",
      "Bool",
      "tt",
      "ff",
      "i1", "i8", "i16", "i32", "i64",
      "I1", "I8", "I16", "I32", "I64",
      "□",
    ),

    // `*` abbreviates `Type (0:Univ)`; `★` is its Unicode spelling.
    star: $ => choice("*", "★"),

    bot: $ => choice("bot", "⊥"),
    top: $ => choice("top", "⊤"),

    // `Type e` and `Rule e` bound their argument at application level.
    type: $ => prec.left(PREC.app, seq("Type", field("level", $.expression))),
    rule_type: $ => prec.left(PREC.app, seq("Rule", field("meta", $.expression))),

    path: $ => seq(
      $.identifier,
      repeat(seq(".", $.identifier)),
    ),

    /*
     * literals
     */

    // A sign is part of the literal *expression*, never of the literal token.  It is kept
    // out of `_operand` on purpose: after a complete expression `+`/`-` are always the
    // infix operators, so `f -23` subtracts - pass a negative argument as `f (-23)`.
    signed: $ => seq(
      field("sign", choice("+", "-")),
      field("value", choice(
        $.annotated,
        $.nat_literal,
        $.idx_literal,
        $.float_literal,
      )),
    ),

    // The literal parser reads the ascription itself and bounds its type at `Lit` level,
    // so `0:Idx s` is `(0:Idx) s`.
    annotated: $ => prec(PREC.lit, seq(
      field("value", choice(
        $.nat_literal,
        $.idx_literal,
        $.float_literal,
        $.char_literal,
        $.string_literal,
        $.bot,
        $.top,
      )),
      ":",
      field("type", $._operand),
    )),

    nat_literal: $ => token(choice(
      /0[bB][01]+/,
      /0[oO][0-7]+/,
      /0[xX][0-9a-fA-F]+/,
      /[0-9]+/,
    )),

    // `23₂`, `23_2`, `23i32` - a literal of type `Idx n`; the `iN` form spells a bit width.
    idx_literal: $ => token(choice(
      /[0-9]+[₀-₉]+/,
      /[0-9]+_[0-9]+/,
      /[0-9]+[iI][0-9]+/,
      /0[xX][0-9a-fA-F]+[iI][0-9]+/,
    )),

    float_literal: $ => token(choice(
      /[0-9]+[eE][+-]?[0-9]+/,
      /[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?/,
      /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/,
      /0[xX][0-9a-fA-F]+[pP][+-]?[0-9]+/,
      /0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?[0-9]+/,
      /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+[pP][+-]?[0-9]+/,
    )),

    string_literal: $ => /"(\\.|[^"\\])*"/,

    char_literal: $ => /'(\\.|[^'\\])'/,

    /*
     * compound expressions
     */

    decl_expr: $ => prec.right(PREC.trailing, seq(
      $._declarations,
      field("body", $.expression),
    )),

    // `t → e`.  A bare `I: e` is *not* an expression, so a named domain only ever comes
    // out of `[...]`/`{...}` - which is what keeps `e → e` and `t → e` one rule.
    pi: $ => prec.right(PREC.arrow, seq(
      field("domain", choice($.expression, $.implicit, $.alias_telescope)),
      $._arrow_r,
      field("codomain", $.expression),
    )),

    // `Cn t` abbreviates `t → ⊥` and so has no codomain at all.
    cn_type: $ => prec.right(PREC.trailing, seq(
      "Cn",
      field("domain", choice($.telescope, $.implicit)),
    )),

    // `Fn t → e` receives an implicit `ret` continuation.  Unlike `Cn`, its domain is
    // bounded at `pi` level so that it stops before the `→`.
    fn_type: $ => prec.right(PREC.arrow, seq(
      "Fn",
      field("domain", choice($.typed_binder, $.alias_telescope, $.implicit, $._app_expression)),
      $._arrow_r,
      field("codomain", $.expression),
    )),

    lambda: $ => prec.right(PREC.trailing, seq(
      field("kind", choice("λ", "lm", "cn", "fn")),
      repeat1($.domain),
      optional(seq(":", field("codomain", $.expression))),
      "=",
      field("body", $.expression),
    )),

    ret: $ => prec.right(PREC.trailing, seq(
      "ret",
      field("pattern", $.pattern),
      "=",
      field("callee", $.expression),
      "$",
      field("argument", $.expression),
      ";",
      field("body", $.expression),
    )),

    uniq: $ => seq("⦃", field("inhabitant", $.expression), "⦄"),

    array: $ => seq(
      "«",
      field("shape", $.shape),
      ";",
      field("body", $.expression),
      "»",
    ),

    pack: $ => seq(
      "‹",
      field("shape", $.shape),
      ";",
      field("body", $.expression),
      "›",
    ),

    shape: $ => commaSep1($.arity),

    arity: $ => choice($.typed_binder, $.expression),

    sigma: $ => seq("[", commaSep(choice($.group, $.telescope)), "]"),

    tuple: $ => seq("(", commaSep($.expression), ")"),

    match: $ => prec.right(PREC.trailing, seq(
      "match",
      field("scrutinee", $.expression),
      "with",
      optional("|"),
      $.match_arm,
      repeat(seq("|", $.match_arm)),
    )),

    match_arm: $ => prec.right(PREC.trailing, seq(
      field("pattern", $.pattern),
      "=>",
      field("body", $.expression),
    )),

    /*
     * infix expressions
     */

    // An operand that binds at least as tightly as `#`.
    _atom: $ => choice($._operand, $.extract),

    // An operand that binds at least as tightly as application.
    _app_expression: $ => choice($._atom, $.application),

    extract: $ => prec.left(PREC.extract, seq(
      field("aggregate", $._atom),
      "#",
      field("index", $._operand),
    )),

    // `e ("#" e)+ ← e` yields a *new* aggregate; the `#` on the left is mandatory.
    insert: $ => prec.right(PREC.ins, seq(
      field("target", $.extract),
      $._arrow_l,
      field("value", $.expression),
    )),

    // Application juxtaposes its operands; only `#` and a literal ascription bind tighter,
    // so neither operand may be a looser infix expression.
    application: $ => prec.left(PREC.app, seq(
      field("callee", $._app_expression),
      optional("@"),
      field("argument", $._atom),
    )),

    // `a op b` is sugar for `` `op (a, b) ``.
    binary_expression: $ => choice(
      prec.left(PREC.shift, seq(
        field("left", $.expression),
        field("operator", choice("<<", ">>")),
        field("right", $.expression),
      )),
      prec.left(PREC.mul, seq(
        field("left", $.expression),
        field("operator", choice("*", "★", "/", "%")),
        field("right", $.expression),
      )),
      prec.left(PREC.add, seq(
        field("left", $.expression),
        field("operator", choice("+", "-")),
        field("right", $.expression),
      )),
      prec.left(PREC.rel, seq(
        field("left", $.expression),
        field("operator", choice("<", "<=", ">", ">=")),
        field("right", $.expression),
      )),
      prec.left(PREC.eq, seq(
        field("left", $.expression),
        field("operator", choice("==", "!=")),
        field("right", $.expression),
      )),
    ),

    union: $ => prec.left(PREC.union, seq(
      field("left", $.expression),
      "∪",
      field("right", $.expression),
    )),

    injection: $ => prec.right(PREC.inj, seq(
      field("value", $.expression),
      "inj",
      field("type", $.expression),
    )),

    where: $ => prec.left(PREC.where, seq(
      field("body", $.expression),
      "where",
      repeat(choice($.declaration, ";")),
      "end",
    )),

    /*
     * tokens
     */

    _arrow_r: $ => choice("->", "→"),
    _arrow_l: $ => choice("<-", "←"),

    // An identifier, or an infix operator escaped into one with a leading backtick.
    identifier: $ => token(choice(
      /[_a-zA-Z][_a-zA-Z0-9]*/,
      /`(==|!=|<<|<=|>>|>=|[-+*\/%<>])/,
    )),

    line_comment: $ => /\/\/([^/].*)?/,

    doc_comment: $ => seq("///", $.doc_content),

    block_comment: $ => seq("/*", /[\/\*]?|(\*[^\/]|[^\*]\/|[^\/\*])*\*+/, "/"),

    error_sentinel: $ => "unused token",
  }
});
