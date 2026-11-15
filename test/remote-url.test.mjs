import assert from "node:assert/strict"
import { test } from "node:test"
import { issueUrlFor, projectFromRemote } from "../src/remote-url.ts"

test("scp-like github remote", () => {
  const project = projectFromRemote("git@github.com:Teogai/opencode-remote-issues-plugin.git")
  assert.equal(project?.provider, "github")
  assert.equal(project?.webUrl, "https://github.com/Teogai/opencode-remote-issues-plugin")
  assert.equal(project?.issuesUrl, "https://github.com/Teogai/opencode-remote-issues-plugin/issues")
})

test("https github remote with trailing slash", () => {
  const project = projectFromRemote("https://github.com/owner/repo/")
  assert.equal(project?.provider, "github")
  assert.equal(project?.issuesUrl, "https://github.com/owner/repo/issues")
})

test("https self-hosted gitlab remote with nested groups", () => {
  const project = projectFromRemote("https://gitlab.home.teogai.com/teogai/team/repo.git")
  assert.equal(project?.provider, "gitlab")
  assert.equal(project?.issuesUrl, "https://gitlab.home.teogai.com/teogai/team/repo/-/issues")
})

test("ssh gitlab remote drops the ssh port", () => {
  const project = projectFromRemote("ssh://git@gitlab.home.teogai.com:2222/teogai/repo")
  assert.equal(project?.provider, "gitlab")
  assert.equal(project?.issuesUrl, "https://gitlab.home.teogai.com/teogai/repo/-/issues")
})

test("http remote keeps scheme and web port", () => {
  const project = projectFromRemote("http://git.internal:8080/group/repo.git")
  assert.equal(project?.webUrl, "http://git.internal:8080/group/repo")
  assert.equal(project?.issuesUrl, "http://git.internal:8080/group/repo/-/issues")
})

test("gitlab.com remote", () => {
  const project = projectFromRemote("git@gitlab.com:group/project.git")
  assert.equal(project?.provider, "gitlab")
  assert.equal(project?.issuesUrl, "https://gitlab.com/group/project/-/issues")
})

test("bitbucket remote", () => {
  const project = projectFromRemote("git@bitbucket.org:team/repo.git")
  assert.equal(project?.provider, "bitbucket")
  assert.equal(project?.issuesUrl, "https://bitbucket.org/team/repo/issues")
})

test("host is case insensitive, path keeps case", () => {
  const project = projectFromRemote("git@GitHub.com:Teogam/MyRepo.git")
  assert.equal(project?.issuesUrl, "https://github.com/Teogam/MyRepo/issues")
})

test("local or malformed remotes are skipped", () => {
  assert.equal(projectFromRemote("/srv/git/repo.git"), undefined)
  assert.equal(projectFromRemote("git@host:onlyowner"), undefined)
  assert.equal(projectFromRemote(""), undefined)
  assert.equal(projectFromRemote("weird"), undefined)
})

test("issue number argument opens the issue", () => {
  const project = projectFromRemote("https://gitlab.home.teogai.com/teogai/repo.git")
  assert.ok(project)
  assert.equal(issueUrlFor(project, "42"), "https://gitlab.home.teogai.com/teogai/repo/-/issues/42")
  assert.equal(issueUrlFor(project), project.issuesUrl)
  assert.equal(issueUrlFor(project, "  "), project.issuesUrl)
})

test("url argument opens unchanged, junk falls back to the list", () => {
  const project = projectFromRemote("git@github.com:owner/repo.git")
  assert.ok(project)
  assert.equal(issueUrlFor(project, "https://github.com/owner/repo/pull/7"), "https://github.com/owner/repo/pull/7")
  assert.equal(issueUrlFor(project, "not a number"), project.issuesUrl)
})
