import { describe, expect, it } from 'vitest';

describe('ThemeToggle', () => {
  it('should export ThemeToggle component', async () => {
    const module = await import('../src/index');
    expect(module.ThemeToggle).toBeDefined();
  });
});
