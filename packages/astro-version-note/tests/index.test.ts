import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/VersionNote.astro', () => ({
  default: () => null,
}));

describe('VersionNote', () => {
  it('should export VersionNote component', async () => {
    const module = await import('../src/index');
    expect(module.VersionNote).toBeDefined();
  });
});
