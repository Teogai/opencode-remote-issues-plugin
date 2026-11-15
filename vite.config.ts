import { defineConfig } from "vite"
import { gui } from "@opencode/plugin/gui/vite"

// The bundle goes to the repo root: the package ships zero dependencies, and a git install of a
// repo with devDependencies fails on OpenCode 2.3.0's standalone builds (their embedded npm CLI is
// spawned through process.execPath and re-enters the opencode CLI). Keep package.json dep-free.
export default defineConfig({ plugins: [gui({ outFile: "gui-experimental.cjs" })] })
