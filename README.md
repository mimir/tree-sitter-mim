# Tree-Sitter Grammar for MimIR

## Integrations

### Helix
Helix integration is currently available in [my fork](https://github.com/amaebel/helix/tree/mim/runtime/queries/mim). There is currently no plan to upstream the changes as MimIR is not (yet) relevant to the public and the grammar itself does not handle all of its grammar properly.
This will be moved to a plugin once plugin support lands in helix master.

### VSCode
A VSCode plugin is available [here](https://marketplace.visualstudio.com/items?itemName=MimIRExtensions.tree-sitter-mim-vscode)


### Neovim

1. Clone this repository (Here it was cloned at `~/treesitter/tree-sitter-mim`)

2. Copy the [queries](https://github.com/amaebel/helix/tree/mim/runtime/queries/mim) into `~/treesitter/tree-sitter-mim/queries`

3. Add the following to your `init.lua`

```lua
vim.api.nvim_create_autocmd("User", {
	pattern = "TSUpdate",
	callback = function()
		require("nvim-treesitter.parsers").mim = {
			install_info = {
				path = vim.fn.expand("~/treesitter/tree-sitter-mim"),
				queries = "queries",
				generate = false,
				generate_from_json = false,
			},
			filetype = "mim",
		}
		vim.filetype.add({
			extension = { mim = "mim" },
		})
		vim.treesitter.language.register("mim", "mim")
	end,
})
```

4. Run `:TSInstall mim` inside of neovim