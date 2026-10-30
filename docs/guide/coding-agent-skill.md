<a id="coding-agent-skill"></a>
# Coding-agent skill

One install copies every consumer skill. The [shared skill](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools) teaches an agent how to install and maintain `ai-i18n-tools` with `sync`, and loads only the reference that matches the task. Each workflow is a separate slash command, such as `/ai-i18n-vitepress`.

Installing the npm package or the standalone executable does not register the skills. Use one install method for each agent.

<a id="install-with-the-skills-cli"></a>
## Install with the skills CLI

This is the install to use when Node.js is 22.20 or newer. This package's own CLI allows Node.js 22.16, which is too old for the skills CLI. On 22.16 through 22.19, or on a machine with no Node.js, use [Download the skill directory](#download-the-skill-directory).

From the project you want the agent to work in:

```bash
npx skills add wsj-br/ai-i18n-tools
```

The command installs every directory under `skills/`, including the shared skill and each workflow command. It does not leave a checkout of this repository in your project. The default scope is the current project. Add `-g` to install for your user, across projects.

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y` is the one-step install: every skill, no prompt. Without `--all`, the installer asks which skills to copy. `--list` prints the skills and installs nothing. `--skill` and `-a` skip the prompts for one skill and one agent. `npx skills update` refreshes skills installed this way. Run `add` again to pick up a skill that was added after the first install.

To print the skill as a prompt, or to launch a supported agent with it, without installing:

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

The CLI detects the coding agents installed on the machine. Install paths for each agent are in the [skills CLI agent list](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). That list changes. This page does not repeat it and does not claim that every coding tool reads a skill folder.

The skills CLI collects anonymous usage data. Set `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` to turn that off.

After installing, start a new agent session if that product requires a reload. Type a workflow command such as `/ai-i18n-vitepress`, or ask the agent to use the `ai-i18n-tools` skill. The shared skill is the fallback for a request that does not name a command. A discovered skill is not a guarantee that the agent will invoke it on its own.

<a id="slash-commands"></a>
## Slash commands

The shared `ai-i18n-tools` skill stays available to the agent. The other skills are explicit commands. Each one follows the shared skill, then applies only its template and checks.

| Command | Workflow |
| --- | --- |
| `/ai-i18n-js` | JavaScript or TypeScript source-string UI |
| `/ai-i18n-python` | Generated Python helper and flat JSON catalogs |
| `/ai-i18n-django` | Django, Flask-Babel, or plain gettext |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Astro Starlight docs |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Vanilla Astro website |
| `/ai-i18n-plain-html` | One HTML file, switched in the browser |
| `/ai-i18n-plain-html-docs` | One HTML tree per locale |
| `/ai-i18n-readme` | README and repository Markdown |
| `/ai-i18n-migrate-intlayer` | One-time move from Intlayer to `t()` calls |
| `/ai-i18n-translate-intlayer` | Fill Intlayer dictionaries in place |

Skills copied into `.agents/skills/` or `.cursor/skills/` appear as these commands. A current Cursor bug hides marketplace-plugin skills that set `disable-model-invocation` from the `/` palette. Claude Code, Codex, and Copilot still show those commands. Use the skills CLI install when you want the commands in Cursor. A prose request still reaches the shared skill.

<a id="download-the-skill-directory"></a>
## Download the skill directory

Use this when the skills CLI is not available. Copy every skill directory, not only `ai-i18n-tools/`. Each workflow command is its own folder with a `SKILL.md`. A git clone and `npx degit` of one skill path both download the repository source archive, about 50 MB.

Pick one agent directory from the [skills CLI agent list](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). The examples below use `.agents/skills/`, which several agents read. Inspect that destination before replacing an existing copy. One copy per agent is enough. A second copy in another discovery folder for the same agent is a duplicate.

The npm package already contains the directories. When the package is installed:

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

With no `node_modules`, download the npm tarball for the same version the CLI reports. `ai-i18n-tools --version` prints the version, then the build timestamp. Use only the version number. The tarball member is `package/skills/`.

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

Replace `1.12.0` with the version you have installed. This works for the current release. The standalone executable does not contain the skill files. Match the tarball to `ai-i18n-tools --version`.

From the release that adds it, GitHub Releases also attach `ai-i18n-tools-skill.zip`. That zip contains every skill directory at its top level. Unpack it into the agent skills folder so the result includes both `ai-i18n-tools/SKILL.md` and the workflow folders, such as `ai-i18n-vitepress/SKILL.md`. Releases published before that zip do not include it. Older zips contain only `ai-i18n-tools/`. Use the npm tarball for those releases. The tag is `v` plus the CLI version, for example `v1.12.0` once that tag's release has the asset.

<a id="agents-the-skills-cli-installs"></a>
## Agents the skills CLI installs

Pass the id to `-a` when you want one agent. Nothing else is required in this repository for these tools.

CLI agents: Claude Code (`claude-code`), Codex CLI (`codex`), Gemini CLI (`gemini-cli`), Antigravity CLI (`antigravity-cli`), GitHub Copilot CLI (`github-copilot`), OpenCode (`opencode`), Goose (`goose`), Qwen Code (`qwen-code`), Kilo CLI (`kilo`), Grok Build (`grok`), Amp (`amp`), Crush (`crush`), Pi (`pi`), Kiro CLI (`kiro-cli`).

Editors and IDEs: Cursor (`cursor`), Windsurf (`windsurf`), Devin for Terminal (`devin`), Zed (`zed`), Antigravity (`antigravity`), Trae (`trae`), Junie (`junie`), Replit (`replit`), Cline (`cline`), Roo Code (`roo`), Kilo Code (`kilo`), Continue (`continue`), Augment (`augment`), Factory Droid (`droid`), Tabnine CLI (`tabnine-cli`). GitHub Copilot in an editor uses the same `github-copilot` id as the CLI.

Two path details that are easy to miss:

- Cursor: a project install from the skills CLI goes to `.agents/skills/`. `-g` goes to `~/.cursor/skills/`. Cursor's own docs also accept `.cursor/skills/` in a project. Use one of those.
- GitHub Copilot: the skills CLI writes `.agents/skills/` in the project and `~/.copilot/skills/` for `-g`. GitHub's cloud-agent docs also describe `.github/skills/`. That folder is not read by every Copilot chat. Use only the folder documented for the surface you use.

Kiro CLI's default agent loads `.kiro/skills/` and `~/.kiro/skills/` with no extra configuration. A custom Kiro agent needs the installed skills listed in `.kiro/agents/<agent>.json`:

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## Native catalogs

Some products also install the skills from a catalog in this repository. Use one channel for each agent: the catalog or the skills CLI. A package upgrade does not refresh a skill that was copied by hand. `npx skills update` refreshes a skills CLI install. Catalog installs follow that product's update command.

- Cursor Marketplace, after the listing is approved: install `ai-i18n-tools` from the Cursor Marketplace. Until that listing exists, use the skills CLI. [Cursor Directory](https://cursor.directory) is a separate community listing.
- Claude Code, from a Claude Code session:

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- GitHub Copilot CLI:

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

Then install the `ai-i18n-tools` plugin from that marketplace. The plugin id is `ai-i18n-tools@ai-i18n-tools`. Copilot CLI reads the same catalog file Claude Code uses.

- Codex:

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

A ChatGPT workspace listing is published separately by a workspace admin. It is a different install from this command.

<a id="agents-without-a-skills-install"></a>
## Agents without a skills install

These products are not in the skills CLI agent list. This repository does not ship a separate skill folder for them. Point the agent at the [consumer context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) from project instructions such as `AGENTS.md`:

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

That file uses documentation-site and repository URLs, so the instruction still works when the agent cannot read this repository. For an older CLI, open the same path on the matching release tag. Consumer projects use this context file. The maintainer `AGENTS.md` applies when changing this repository.

Products in this group: Aider, gptme, Amazon Q Developer CLI, DeepSeek Harness, JetBrains AI Assistant, Sourcegraph Cody, Qodo, the Tabnine IDE plugin, CodeGeeX, and AskCodi. Junie is the JetBrains agent that does take a skills CLI install. Tabnine CLI does too. AiderDesk is a different application from Aider.

CodeLayer and Superset do not have a skill directory of their own. CodeLayer runs Claude Code, so install the skill for Claude Code. Superset runs the CLI agents you configure, so install the skill for those agents.

<a id="stay-on-the-same-version"></a>
## Stay on the same version

Keep the skill on the same release as the `ai-i18n-tools` command. An npm upgrade, and a newer standalone executable, leave a hand-copied skill where it was. Install the skill again from the matching version, or run `npx skills update` for a skills CLI install.

Online documentation may describe a newer release than the command you have installed. Prefer `ai-i18n-tools --help` for flags. Further reference: [installation](/guide/installation), [configuration](/reference/configuration), [providers](/guide/providers-and-models), [CLI reference](/reference/cli-commands/).
