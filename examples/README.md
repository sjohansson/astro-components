# Examples

This directory contains example projects demonstrating how to use the Astro components.

## Available Examples

### [Basic Usage](./basic-usage)

Demonstrates all three integrations working together in a single Astro project:
- Theme Toggle for dark/light mode
- Version Note for documentation callouts
- React Flow for interactive diagrams

## Running Examples

Each example is a standalone Astro project that uses workspace references to the packages.

### Prerequisites

From the repository root:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Running an Example

```bash
# Navigate to the example
cd examples/basic-usage

# Start dev server
pnpm dev
```

Visit `http://localhost:4321` to see the example in action.

## Creating Your Own Example

1. Create a new directory in `examples/`
2. Set up a standard Astro project
3. Reference the packages using workspace protocol:

```json
{
  "dependencies": {
    "@sjohansson/astro-theme-toggle": "workspace:*"
  }
}
```

4. Add your example to the workspace by including it in the root `pnpm-workspace.yaml`

## Testing Examples

Examples serve multiple purposes:
- **Documentation**: Show real-world usage
- **Testing**: Verify integrations work correctly
- **Development**: Test changes during development

## Learn More

- [Integration Guide](../INTEGRATION_GUIDE.md) - How to use components as integrations
- [Packaging Guide](../PACKAGING_GUIDE.md) - Architecture and best practices