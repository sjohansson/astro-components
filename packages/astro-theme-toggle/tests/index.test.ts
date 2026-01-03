import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/ThemeToggle.astro', () => ({
  default: () => null,
}));

describe('ThemeToggle', () => {
  it('should export ThemeToggle component', async () => {
    const module = await import('../src/index');
    expect(module.ThemeToggle).toBeDefined();
  });
});
