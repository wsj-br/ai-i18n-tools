<!-- DOCTOC SKIP -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Use conventional types (**Added**, **Changed**, **Fixed**, etc.) and short descriptions in the same line.

## Unreleased

### Fixed

- CI: pin pnpm for `pnpm/action-setup` via `packageManager` in `package.json` and explicit `version` in the workflow (required by pnpm/action-setup v4).

### Added

- CI workflow supports manual runs (`workflow_dispatch`) with optional input **Tag this build as 'latest'**: when enabled, publishes to npm with the `latest` dist-tag; when disabled, runs checks only. Publishing on a GitHub release is unchanged.



