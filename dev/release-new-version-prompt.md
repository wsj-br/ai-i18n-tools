Create a new release notes file `dev/RELEASE_NOTES_<version>.md` for the `ai-i18n-tools` package using the instructions below. This will be used as part of the GitHub release process.

Before you start, run **`pnpm pre-release`** from the repository root and fix any failures so format, lint, build, and tests match what CI runs before publish.

**Instructions:**

1. **Read `package.json`** to get the current version number (`x.y.z`).
2. **Open `dev/CHANGELOG.md`**.
3. **Copy all entries under the `## [Unreleased]` section** up to (but not including) the next `## [` heading (which marks the last released version).
4. **Format the new file** according to the prior release notes in `dev/RELEASE_NOTES_x.y.z.md`:
   - Title: `# ai-i18n-tools <version> Release Notes`
   - Sections:
     - `## Highlights` — Summarize the most important user-facing changes from the changelog bullets (focus on features, fixes, major improvements; don't list every change verbatim—write clear, user-focused summaries).
     - `## Why this release matters` — One or two sentences explaining the main impact or reason for this release.
     - `---`
     - `## Documentation` — Add links to major docs: Getting Started, Package Overview, Agent Context, as in previous release notes.
     - `---`
     - `## License` — Use the same license section as prior notes.
     - Don't include the `### Full Changelog` or the `[Unreleased]` section.
5. **Transfer the detailed change bullets** (from the `[Unreleased]` section) to a new section after the intro highlights (or as a collapsible section if desired for clarity).
6. **Update `dev/CHANGELOG.md`**:
   - Move all lines from `[Unreleased]` to a new section with the current version and today's date (`## [x.y.z] - YYYY-MM-DD`).
   - Leave an empty `[Unreleased]` section at the top for future work.

**Example format for the file:**

```markdown
# ai-i18n-tools 1.2.7 Release Notes

## Highlights

- Briefly state the most important new features, fixes, or improvements.
- Focus on what most directly affects users.

## Why this release matters

One or two sentences describing the practical impact or reason for this release (e.g., "Improves reliability of doc translation and editor browsing on Windows platforms.").

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)

```

**Summary:**  
Ensure the new release notes file follows the format of previous notes, highlights user-facing changes from the changelog, and leaves the changelog ready for the next iteration. Write clearly and concisely for GitHub/Git users.