((doc_comment
  (doc_content) @injection.content)
  (#set! injection.language "markdown")
  (#set! injection.combined))

([
  (line_comment)
  (block_comment)
] @injection.content
  (#set! injection.language "comment"))
