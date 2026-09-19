# Tree-Sitter Grammar for MimIR

## Integrations

### Helix
Helix integration is currently available in [my fork](https://github.com/amaebel/helix/tree/mim/runtime/queries/mim). There is currently no plan to upstream the changes as MimIR is not (yet) relevant to the public and the grammar itself does not handle all of its grammar properly.
This will be moved to a plugin once plugin support lands in helix master.

### VSCode
A VSCode plugin is available [here](https://marketplace.visualstudio.com/items?itemName=MimIRExtensions.tree-sitter-mim-vscode)


### Neovim

Neovim does not know about Mim yet, so `nvim-treesitter` (branch `main`) has to be pointed at a local
clone of this repository.  Unlike Helix, Neovim uses the queries in [`queries/`](queries) - capture
names differ between the two editors, so the Helix queries linked above will *not* work here.

1. Clone this repository (here it was cloned at `~/treesitter/tree-sitter-mim`).

2. Add the following to your `init.lua`:

```lua
vim.filetype.add({
    extension = { mim = "mim" },
})

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
        }
    end,
})
```

3. Run `:TSInstall mim` inside of Neovim.  This compiles `src/parser.c` and symlinks `queries/` into
   Neovim's parser directory, so edits to the `.scm` files take effect without reinstalling.

4. `nvim-treesitter` `main` does not enable highlighting by itself.  Distributions such as LazyVim do
   it for you; otherwise add

```lua
vim.api.nvim_create_autocmd("FileType", {
    pattern = "mim",
    callback = function()
        vim.treesitter.start()
    end,
})
```
