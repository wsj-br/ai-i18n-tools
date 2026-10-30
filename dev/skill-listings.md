# Skill listings

Maintainer steps for publishing the consumer skills. Users install them by following [Coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill). This page is how a release of those skills gets onto each directory.

The skills live in `skills/<name>/`. The shared skill is `skills/ai-i18n-tools/`, and each workflow command is a sibling directory whose folder name matches its frontmatter `name`. Do not add a `SKILL.md` at the repository root. A root skill file shadows `skills/` and the skills CLI then reports a single skill that is not one of these.

## Check the skills before any listing

On a machine with Node.js 22.20 or later, from the repository root:

```bash
npx skills add . --list
```

The output must include `ai-i18n-tools` and every workflow command (`ai-i18n-js`, `ai-i18n-python`, `ai-i18n-django`, `ai-i18n-vitepress`, `ai-i18n-starlight`, `ai-i18n-docusaurus`, `ai-i18n-nextra`, `ai-i18n-fumadocs`, `ai-i18n-astro-website`, `ai-i18n-plain-html`, `ai-i18n-plain-html-docs`, `ai-i18n-readme`, `ai-i18n-migrate-intlayer`, and `ai-i18n-translate-intlayer`). If one is missing, fix the skill layout before submitting anywhere. Every frontmatter `description` must stay valid YAML. A colon inside that value, left unquoted, makes the skills CLI skip the file. Workflow commands set `disable-model-invocation: true`. The shared skill does not.

`plugin.json` at the repository root, `.claude-plugin/plugin.json`, and the `version` fields in `.claude-plugin/marketplace.json` must match `package.json`. `node scripts/sync-example-ai-i18n-tools-version.mjs` rewrites them. `pnpm version` and `pnpm pre-release` run that script. `--check` exits 1 when a present manifest is stale.

## skills.sh

There is no submission form. skills.sh indexes a public repository after people run `npx skills add wsj-br/ai-i18n-tools`. When `--list` already finds these skills, do not file an indexing request.

An optional README badge, once installs have been counted:

```markdown
[![skills.sh](https://skills.sh/b/wsj-br/ai-i18n-tools)](https://skills.sh/wsj-br/ai-i18n-tools)
```

## Cursor Marketplace

This is the curated listing inside Cursor. It reviews the root `plugin.json` (Agent Plugins). This repository is one plugin, so it has no `.cursor-plugin/marketplace.json`. That file is for a repository that ships several plugins.

After `plugin.json` is on the public default branch:

1. Open [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).
2. Submit `https://github.com/wsj-br/ai-i18n-tools`.
3. Stop at the "Thanks for applying" screen. The form sends no email. That screen is the receipt.

Submit once. A second submission is a duplicate in the review queue. Review is manual and can take weeks. There is no status page. Questions go to marketplace-publishing@cursor.com.

Later changes to the skill are not published by submitting the form again. Ask Cursor to re-index the same repository, by emailing marketplace-publishing@cursor.com.

[Cursor Directory](https://cursor.directory/plugins/new) is a separate queue. A listing there does not appear in the official Cursor Marketplace, and an official submission does not appear on Cursor Directory.

## Cursor Directory

The community directory reads `skills/*/SKILL.md` from the public repository. It does not wait on `plugin.json`.

1. Open [cursor.directory/plugins/new](https://cursor.directory/plugins/new).
2. Sign in with GitHub or Google.
3. Paste `https://github.com/wsj-br/ai-i18n-tools` and submit once.

An automated scan reviews the repository. A verified badge is a later, optional review. Submit once. A second submission becomes another listing, and you cannot delete that duplicate yourself. Questions about a listing that is already accepted go to marketplace-publishing@cursor.com with the listing URL.

## Claude Code

There is no review form. Pushing these files publishes the catalog:

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`, with one plugin whose `source` is `"./"` and whose `name` matches the plugin manifest (`ai-i18n-tools`)

The marketplace `name` is `ai-i18n-tools`. Users add it themselves:

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

When the `claude` CLI is installed, run `claude plugin validate .` in the repository root before pushing. A failed validation should be fixed before the push. The command is not part of CI.

## GitHub Copilot

There is no separate application and no GitHub form that lists this repository in a central Copilot store. Copilot CLI reads `.claude-plugin/marketplace.json`, the same file Claude Code uses. Publishing is the push described above.

Users run:

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

The plugin id is `ai-i18n-tools@ai-i18n-tools`.

## Codex and ChatGPT

Pushing `.agents/plugins/marketplace.json` publishes the repository catalog. The Codex file uses `source.path` `"./"` and the policy fields from the Codex marketplace docs. It is not a copy of the Claude catalog.

Users run:

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

The public Plugins Directory inside ChatGPT is not a file in this repository. A workspace admin publishes a local plugin from the ChatGPT Plugins screen:

1. Open ChatGPT Plugins and select Personal.
2. Open the plugin's menu and select Publish.
3. Choose the workspace roles that should have access.

That copy stays inside the workspace. Accounts outside the workspace cannot install it. It is not part of the git release, and it is not the same as the repository catalog.

## Agents with no listing

OpenCode, Goose, Gemini CLI, Antigravity, and the other tools in the skills CLI agent list have no directory application. `npx skills add wsj-br/ai-i18n-tools` is how users install the skill for them. Install paths are in the [skills CLI agent list](https://github.com/vercel-labs/skills/blob/main/docs/agents.md).
