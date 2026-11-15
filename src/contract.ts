import { Schema } from "effect"
import { Ipc } from "@opencode/plugin/gui"

// The id must be the plugin id or start with it; the plugin id is the package name.
export const Remote = Ipc.define({
  id: "opencode-remote-issues-plugin.remote",
  methods: {
    url: {
      input: Schema.Struct({
        directory: Schema.String,
        refresh: Schema.optional(Schema.Boolean),
      }),
      output: Schema.NullOr(Schema.String),
    },
  },
})
