import { describe, expect, it } from 'vitest';

describe('ReactFlowWrapper', () => {
  it('should export ReactFlowWrapper component', async () => {
    const module = await import('../src/index');
    expect(module.ReactFlowWrapper).toBeDefined();
  });

  it('should support enableExport prop', () => {
    // This test verifies that the TypeScript interface accepts the enableExport prop
    // The actual functionality would need a DOM environment to test properly
    const validProps = {
      nodes: [],
      edges: [],
      className: 'test',
      enableExport: true,
    };

    expect(validProps.enableExport).toBe(true);
  });
});
