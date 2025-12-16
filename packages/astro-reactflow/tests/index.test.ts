import { describe, expect, it } from 'vitest';

describe('ReactFlowWrapper', () => {
  it('should export ReactFlowWrapper component', async () => {
    const module = await import('../src/index');
    expect(module.ReactFlowWrapper).toBeDefined();
  });
});
