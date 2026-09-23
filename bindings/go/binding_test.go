package tree_sitter_mim_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_mim "github.com/mimir/tree-sitter-mim/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_mim.Language())
	if language == nil {
		t.Errorf("Error loading Mim grammar")
	}
}
