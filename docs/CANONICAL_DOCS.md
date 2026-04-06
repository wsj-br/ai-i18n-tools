# Canonical documentation

All **user, migration, and contributor** documentation for **ai-i18n-tools** is maintained in **this repository** under [`docs/`](./README.md).

- Do **not** maintain duplicate copies of these guides under other repos’ `dev/` trees; link here instead (or to a published site generated from this folder).
- **Map of every doc**: [docs/README.md](./README.md).

**Rollout order** (for consuming applications):

1. Develop and test **ai-i18n-tools** in this repo.
2. Integrate into **Transrewrt** (smaller surface).
3. Integrate into **Duplistatus** (UI + Docusaurus; most moving parts).
4. Validate **locally** end-to-end.
5. **Publish** `ai-i18n-tools` to npm.
6. **Release** updated Transrewrt and Duplistatus versions that depend on the published package.
