<!-- DOCTOC SKIP -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Use conventional types (**Added**, **Changed**, **Fixed**, etc.), a short **scope** (subsystem or UI area), and a clear description—see `.cursor/rules/project.mdc` (CHANGELOG section) for the full bullet pattern.

## Unreleased

- **Fixed**: GitHub Actions - Restore npm publish auth by passing `secrets.NPM_TOKEN` into `actions/setup-node` and the publish step (`ENEEDAUTH` when OIDC is not configured or the Trusted Publisher workflow name on npm does not match `ci.yml` exactly).
- **Changed**: GitHub Actions - Publish job targets environment `npm` (optional protection rules in repo Settings → Environments); `npm publish` uses `--ignore-scripts` (skip duplicate `prepublishOnly`), `--provenance`, and explicit `NODE_AUTH_TOKEN` on the publish step per GitHub’s npm publishing guide.


