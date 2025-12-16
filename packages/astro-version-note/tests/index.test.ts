import { describe, expect, it } from 'vitest';

describe('VersionNote', () => {
  it('should export VersionNote component', async () => {
    const module = await import('../src/index');
    expect(module.VersionNote).toBeDefined();
  });
});
