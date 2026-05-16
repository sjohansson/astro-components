# Conventional Commits

Use Conventional Commits format for all commit messages.

Prefix every commit subject with one of these types, which map directly to
`Keep a Changelog` headings:

- `feat:` → **Added** — new features
- `refactor:` → **Changed** — changes to existing functionality
- `deprecated:` → **Deprecated** — soon-to-be removed features
- `removed:` → **Removed** — now removed features
- `fix:` → **Fixed** — bug fixes
- `security:` → **Security** — vulnerability fixes
- `chore:` → *(omitted from changelog)* — maintenance, tooling, config
- `docs:` → *(omitted from changelog)* — documentation-only changes

Append `!` after the type/scope for breaking changes, e.g. `feat!:` or `fix!:`.

Keep the subject line under 72 characters (including prefix), imperative mood, no trailing period.

Based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
