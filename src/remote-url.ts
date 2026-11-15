export type IssueProvider = "github" | "gitlab" | "bitbucket"

export interface RemoteProject {
  readonly provider: IssueProvider
  readonly webUrl: string
  readonly issuesUrl: string
}

// ssh:// or http(s):// remotes, with an optional user such as git@.
const SCHEME_FORM = /^(ssh|https?):\/\/(?:[^@/]+@)?([^/?#]+)(?:\/(.*))?$/i
// scp-like remotes: [user@]host:path, with no scheme.
const SCP_FORM = /^(?:[^@/:]+@)?([^:/?#]+):(.+)$/

/**
 * Maps a git remote URL (https, ssh, or scp-like) to the project's issue tracker.
 * github.com and bitbucket.org map to their providers; every other host is
 * treated as GitLab, which covers gitlab.com and self-hosted instances.
 */
export function projectFromRemote(remote: string): RemoteProject | undefined {
  const value = remote.trim()

  let scheme = "https"
  let host = ""
  let path = ""

  const schemeMatch = SCHEME_FORM.exec(value)
  if (schemeMatch) {
    if (schemeMatch[1].toLowerCase() === "http") scheme = "http"
    host = schemeMatch[2].toLowerCase()
    path = schemeMatch[3] ?? ""
    // The port of an ssh remote belongs to ssh, not to the web UI.
    if (schemeMatch[1].toLowerCase() === "ssh") host = dropPort(host)
  } else {
    const scpMatch = SCP_FORM.exec(value)
    if (!scpMatch) return undefined
    host = dropPort(scpMatch[1].toLowerCase())
    path = scpMatch[2]
  }

  const segments = path
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/i, "")
    .split("/")
    .filter((segment) => segment !== "")
  if (segments.length < 2) return undefined

  const web = `${scheme}://${host}`
  const ownerRepo = segments.slice(0, 2).join("/")
  const slug = segments.join("/")
  const hostName = dropPort(host)

  if (hostName === "github.com") {
    return { provider: "github", webUrl: `${web}/${ownerRepo}`, issuesUrl: `${web}/${ownerRepo}/issues` }
  }
  if (hostName === "bitbucket.org") {
    return { provider: "bitbucket", webUrl: `${web}/${ownerRepo}`, issuesUrl: `${web}/${ownerRepo}/issues` }
  }
  return { provider: "gitlab", webUrl: `${web}/${slug}`, issuesUrl: `${web}/${slug}/-/issues` }
}

/**
 * The URL for one issue. `input` is the argument typed after the command:
 * an issue number, or a full URL to open unchanged. Anything else falls
 * back to the tracker's issue list.
 */
export function issueUrlFor(project: RemoteProject, input?: string): string {
  const argument = input?.trim()
  if (!argument) return project.issuesUrl
  if (/^\d+$/.test(argument)) return `${project.issuesUrl}/${argument}`
  if (/^https?:\/\//i.test(argument)) return argument
  return project.issuesUrl
}

function dropPort(host: string): string {
  const index = host.lastIndexOf(":")
  return index === -1 ? host : host.slice(0, index)
}
