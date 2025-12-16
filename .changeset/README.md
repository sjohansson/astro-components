# Changesets

Welcome to the changesets documentation! 🦋

This folder contains changeset files that describe changes to be released in the next version.

## Creating a changeset

When you make changes to a package, run:

```bash
pnpm changeset
```

This will prompt you to describe your changes and select which packages are affected.

## Versioning

To update package versions based on changesets:

```bash
pnpm changeset:version
```

## Publishing

To publish packages to npm:

```bash
pnpm changeset:publish
```

Note: The release workflow in GitHub Actions handles this automatically when changes are merged to main.
