// Loads the shipped bundle, gui-experimental.cjs, against a hand-written fake of the desktop host.
import assert from "node:assert/strict"
import Module, { createRequire } from "node:module"
import { test } from "node:test"

const Command = { registry: "Command" }
const TitlebarItem = { registry: "TitlebarItem" }
const fakeHost = {
  Plugin: { define: (definition) => definition },
  Ipc: { define: (contract) => contract },
  Command,
  TitlebarItem,
}

const load = Module._load
Module._load = function (request, ...rest) {
  if (request === "@opencode/plugin/gui") return fakeHost
  return load.call(this, request, ...rest)
}
const plugin = createRequire(import.meta.url)("../gui-experimental.cjs").default
Module._load = load

function host({ directory, remoteUrl }) {
  const added = []
  const alerts = []
  const opened = []
  const ctx = {
    signal: new AbortController().signal,
    t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key),
    main: () => ({ url: async () => remoteUrl }),
    sessions: { current: () => (directory === undefined ? undefined : { directory }) },
    add: (registry, value) => added.push({ registry, value }),
    dialogs: { alert: async (options) => void alerts.push(options) },
    system: { openExternal: async (url) => void opened.push(url) },
  }
  plugin.setup(ctx)
  const command = () => added.find((entry) => entry.registry === Command).value()
  const settle = () => new Promise((resolve) => setImmediate(resolve))
  return { command, alerts, opened, settle }
}

test("/issues stays available in a folder with no git origin, and says so when run", async () => {
  const app = host({ directory: "D:\\Projects\\claude-kb", remoteUrl: null })
  assert.notEqual(app.command().enabled, false)
  assert.equal(app.command().slash.name, "issues")

  app.command().run("")
  await app.settle()
  assert.equal(app.alerts.length, 1)
  assert.match(app.alerts[0].description, /claude-kb/)
  assert.deepEqual(app.opened, [])
})

test("/issues with no open session explains instead of doing nothing", async () => {
  const app = host({ directory: undefined, remoteUrl: null })
  assert.notEqual(app.command().enabled, false)

  app.command().run("")
  await app.settle()
  assert.equal(app.alerts.length, 1)
  assert.deepEqual(app.opened, [])
})

test("/issues 42 opens the issue in a gitlab project", async () => {
  const app = host({ directory: "/work/game", remoteUrl: "git@gitlab.home.teogai.com:teogai/game.git" })

  app.command().run("42")
  await app.settle()
  assert.deepEqual(app.opened, ["https://gitlab.home.teogai.com/teogai/game/-/issues/42"])
  assert.equal(app.alerts.length, 0)
})

test("/issues <url> opens that url even with no git origin", async () => {
  const app = host({ directory: "D:\\Projects\\claude-kb", remoteUrl: null })

  app.command().run("https://github.com/owner/repo/issues/7")
  await app.settle()
  assert.deepEqual(app.opened, ["https://github.com/owner/repo/issues/7"])
  assert.equal(app.alerts.length, 0)
})
