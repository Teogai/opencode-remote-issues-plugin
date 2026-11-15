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

```sh
opencode plugin add github:Teogai/opencode-remote-issues-plugin
```

or add it to your global `~/.config/opencode/opencode.json(c)` — the desktop app only reads plugins from the global
config:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:Teogai/opencode-remote-issues-plugin"],
}
```

Restart the desktop app, or flip the plugin under **Settings → Extensions → Plugins** (it has a Reload button).
Updates: `opencode plugin update`.

> **Why this repo declares zero dependencies:** OpenCode 2.3.0's standalone builds prepare git plugins by re-executing
> themselves as their embedded npm CLI, and the opencode argument parser rejects npm's flags — so installing *any* git
> plugin whose `package.json` has dependencies fails with
> `NpmInstallFailedError: … git dep preparation failed — Unrecognized flag: --force in command opencode`. A plugin with
> no dependencies skips that prepare step and installs cleanly, which is why the runtime artifact is the committed
> prebuilt `gui-experimental.cjs` at the repo root and nothing else. Don't add dependencies or a lockfile here, or the
> install breaks again.

## What you get

- **Titlebar button** — appears only while the open session's folder is a git clone with an `origin` remote. A folder
  that is not a git repository (e.g. a copy synced by Syncthing or Dropbox, which leaves `.git` behind) gets no button.
- **No model turn, no server tools, no API token** — the remote is read with a plain `git remote get-url origin` in the app's main process and cached per directory. Choosing **Open issue tracker** re-reads the remote, so a freshly added remote works immediately.
- **`/issues` and the palette entry are always there.** With no session open, or in a folder with no `origin` remote,
  they show a dialog saying why instead of disappearing. `/issues <url>` opens the URL in any folder.

## Limitations

- Uses the `origin` remote only.
- The GUI plugin API (`./gui-experimental`) is **experimental** in OpenCode and may change between releases; this plugin pins nothing of the app, so it should track along, but expect occasional breakage on new OpenCode versions.
- Desktop only. In the web app the button never appears (no Electron main process to run `git`); the plugin loads there without errors.
- A host that isn't GitHub or Bitbucket gets a GitLab-style URL — a project on, say, a bare `git` server with no web UI would get a link that 404s.

## Development

`package.json` intentionally declares no dependencies (see the note under Install), so install the build toolchain
explicitly — versions matching the OpenCode release you target:

```sh
npm i -D @opencode/plugin@2.3.0 effect@4.1.0 solid-js vite vite-plugin-solid typescript @types/node
npx vite build                              # writes gui-experimental.cjs at the repo root
npm test                                    # remote-url mapping + the built bundle against a fake host
npx tsc --noEmit
```

`gui-experimental.cjs` is **committed on purpose**: the desktop app loads `./gui-experimental` as one prebuilt CommonJS
file and the installing machine cannot build it. Rebuild and commit it whenever `src/` changes, and never commit
`node_modules` or `package-lock.json`.

To iterate live, point the config entry at the checkout (a local path works like any plugin); every rebuild then
reloads it in all open app windows:

```sh
npx vite build --watch
```

## License

MIT
