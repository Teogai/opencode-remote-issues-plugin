# opencode-remote-issues-plugin

An [OpenCode](https://opencode.ai) **Desktop** plugin that puts your project's issue tracker one click away:

- an **Issues** pill in the window titlebar — click it and the GitHub/GitLab issue list opens in your browser
- a **`/issues`** command in the composer — `/issues 42` opens issue #42 directly; `/issues <url>` opens that URL
- **“Open issue tracker”** in the command palette

It reads the current session's project, resolves its `origin` remote, and maps it to the right tracker:

| Remote                                          | Opens                                                    |
| ----------------------------------------------- | -------------------------------------------------------- |
| `git@github.com:owner/repo.git`                 | `https://github.com/owner/repo/issues`                   |
| `https://gitlab.com/group/project.git`          | `https://gitlab.com/group/project/-/issues`              |
| `git@gitlab.example.com:team/project.git`       | `https://gitlab.example.com/team/project/-/issues`       |
| nested groups (`group/sub/project`)             | `.../group/sub/project/-/issues`                         |
| `git@bitbucket.org:team/repo.git`               | `https://bitbucket.org/team/repo/issues`                 |

Any host that isn't `github.com` or `bitbucket.org` is treated as GitLab, so **self-hosted GitLab instances work out of the box** (https, http with a port, and ssh remotes with non-standard ssh ports all map correctly).

## Install

> ⚠️ **Known OpenCode bug (verified on 2.3.0, macOS/Windows/Linux):** installing *any* plugin from git fails with
> `NpmInstallFailedError: … git dep preparation failed — Unrecognized flag: --force in command opencode`. OpenCode's
> standalone build re-executes itself as its embedded npm CLI when preparing git dependencies, and its own argument
> parser rejects npm's flags. It affects `opencode plugin add github:…` and background installs of `github:…` config
> entries alike — not this plugin. Use the local-clone install below until it is fixed upstream; the `github:` entry
> works on npm-installed OpenCode builds.

Clone the repo anywhere (no `npm install` needed — the plugin is one prebuilt bundle committed in `dist/`) and add the
path to your global `~/.config/opencode/opencode.json(c)` — the desktop app only reads plugins from the global config:

```sh
git clone https://github.com/Teogai/opencode-remote-issues-plugin ~/plugins/opencode-remote-issues-plugin
```

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-remote-issues-plugin"],
}
```

Restart the desktop app, or flip the plugin under **Settings → Extensions → Plugins** (it has a Reload button). Once
the OpenCode bug is fixed, the same slot accepts the git form — `opencode plugin update` then keeps it fresh:

```jsonc
{ "plugins": ["github:Teogai/opencode-remote-issues-plugin"] }
```

To update a clone: `git pull`.

## What you get

- **Titlebar button** — appears whenever the current session's project has a resolvable `origin` remote; hidden otherwise (plain `/issues` is still there).
- **No model turn, no server tools, no API token** — the remote is read with a plain `git remote get-url origin` in the app's main process and cached per directory. Choosing **Open issue tracker** re-reads the remote, so a freshly added remote works immediately.
- If there is no `origin` remote, the command says so instead of silently doing nothing.

## Limitations

- Uses the `origin` remote only.
- The GUI plugin API (`./gui-experimental`) is **experimental** in OpenCode and may change between releases; this plugin pins nothing of the app, so it should track along, but expect occasional breakage on new OpenCode versions.
- Desktop only. In the web app the button never appears (no Electron main process to run `git`); the plugin loads there without errors.
- A host that isn't GitHub or Bitbucket gets a GitLab-style URL — a project on, say, a bare `git` server with no web UI would get a link that 404s.

## Development

```sh
npm install
npm test          # remote-url mapping tests
npm run typecheck
npm run build     # emits dist/gui-experimental.cjs
```

`dist/gui-experimental.cjs` is **committed on purpose**: the desktop app loads `./gui-experimental` as one prebuilt CommonJS file. Rebuild and commit it whenever `src/` changes.

Because the install above is a plain clone, you can iterate live: with the plugin configured as a path, every rebuild
reloads it in all open app windows:

```sh
npx vite build --watch
```

## License

MIT
