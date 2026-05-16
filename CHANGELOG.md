# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Release workflow:
  1. Add entries under [Unreleased] in your PR (CI warns if empty).
  2. When ready to release, rename [Unreleased] to [X.Y.Z] - YYYY-MM-DD
     and add a fresh empty [Unreleased] section above it.
  3. Commit, then tag: git tag vX.Y.Z && git push origin vX.Y.Z
  4. The release pipeline extracts this section for the GitHub Release body.
     It will fail if no matching ## [X.Y.Z] section exists. -->

<!-- Commit prefix conventions
  - Adheres to [conventional commits](https://www.conventionalcommits.org)
  - Uses scopes to map changes to relevant modules, i.e. `feat(astro-reactflow): new thing added`
  - `scripts/update-changelog.ps1` relies on these to auto-update this changelog
-->

<!-- Commit prefix → Changelog heading (1:1 mapping)

  feat:        → Added        New features
  refactor:    → Changed      Changes to existing functionality
  deprecated:  → Deprecated   Soon-to-be removed features
  removed:     → Removed      Now removed features
  fix:         → Fixed        Bug fixes
  security:    → Security     Vulnerability fixes
  chore:       → (omitted)    Maintenance, tooling, config
  docs:        → (omitted)    Documentation-only changes

  Append ! for breaking changes: feat!:, fix!:, removed!: etc. -->

## [Unreleased]

## [0.1.0] - 2026-04-01

### Added

- new stuff
