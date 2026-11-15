import { execFile } from "node:child_process"
import { createEffect, createSignal } from "solid-js"
import { Command, Plugin, TitlebarItem } from "@opencode/plugin/gui"
import { Remote } from "./contract"
import { issueUrlFor, projectFromRemote, type RemoteProject } from "./remote-url"

interface Resolved {
  readonly directory: string
  readonly project?: RemoteProject
}

export default Plugin.define({
  i18n: {
    en: {
      "pill.label": "Issues",
      "pill.title": "Open the issue tracker for this project",
      "command.group": "Remote issues",
      "command.open": "Open issue tracker",
      "command.open.description": "Opens the project's GitHub or GitLab issues in the browser",
      "missing.title": "No issue tracker found",
      "missing.description": "This session has no git origin remote to build an issues URL from.",
    },
  },
  setup(ctx) {
    const remote = ctx.main(Remote)
    const [resolved, setResolved] = createSignal<Resolved | undefined>(undefined)

    createEffect(() => {
      const directory = ctx.sessions.current()?.directory
      if (!directory) {
        setResolved(undefined)
        return
      }
      if (resolved()?.directory === directory) return
      setResolved({ directory })
      remote
        .url({ directory }, { signal: ctx.signal })
        .then((url) => {
          if (resolved()?.directory !== directory) return
          setResolved({ directory, project: url === null ? undefined : projectFromRemote(url) })
        })
        // The web app has no main process, and main may be off or failed:
        // no project, so the button stays hidden and the command disabled.
        .catch(() => {})
    })

    const open = async (input?: string) => {
      const session = ctx.sessions.current()
      if (!session) return

      let project = resolved()?.project
      try {
        const url = await remote.url({ directory: session.directory, refresh: true }, { signal: ctx.signal })
        project = url === null ? undefined : projectFromRemote(url)
        if (resolved()?.directory === session.directory) setResolved({ directory: session.directory, project })
      } catch {
        // Main unreachable: keep the cached project, if any.
      }

      if (!project) {
        await ctx.dialogs.alert({ title: ctx.t("missing.title"), description: ctx.t("missing.description") })
        return
      }
      await ctx.system.openExternal(issueUrlFor(project, input))
    }

    ctx.add(
      TitlebarItem,
      (): TitlebarItem | undefined => {
        const project = resolved()?.project
        if (!project) return undefined

        return {
          id: "issues",
          label: ctx.t("pill.label"),
          title: ctx.t("pill.title"),
          icon: project.provider === "github" ? "github" : "globe",
          run: () => void ctx.system.openExternal(project.issuesUrl),
        }
      },
    )

    ctx.add(Command, (): Command => {
      return {
        id: "open-issues",
        title: ctx.t("command.open"),
        description: ctx.t("command.open.description"),
        keywords: "issues github gitlab bitbucket tracker ticket",
        group: ctx.t("command.group"),
        slash: { name: "issues", arguments: true },
        enabled: resolved()?.project !== undefined,
        run: (input) => void open(input),
      }
    })
  },
  main(ctx) {
    const cache = new Map<string, string | null>()

    const read = (directory: string) =>
      new Promise<string | null>((resolve) => {
        execFile("git", ["-C", directory, "remote", "get-url", "origin"], { timeout: 5000 }, (error, stdout) => {
          const url = stdout.trim()
          resolve(error || !url ? null : url)
        })
      })

    ctx.provide(Remote, {
      url: async ({ directory, refresh }) => {
        if (refresh || !cache.has(directory)) cache.set(directory, await read(directory))
        return cache.get(directory) ?? null
      },
    })
  },
})
