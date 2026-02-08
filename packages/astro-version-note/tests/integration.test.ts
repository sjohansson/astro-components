import { describe, expect, it } from 'vitest';
import versionNoteIntegration from '../src/integration';

describe('VersionNote Integration', () => {
  it('should export integration function', () => {
    expect(versionNoteIntegration).toBeDefined();
    expect(typeof versionNoteIntegration).toBe('function');
  });

  it('should return valid Astro integration', () => {
    const result = versionNoteIntegration();

    expect(result).toBeDefined();
    expect(result.name).toBe('@sjohansson/astro-version-note');
    expect(result.hooks).toBeDefined();
    expect(result.hooks['astro:config:setup']).toBeDefined();
    expect(result.hooks['astro:config:done']).toBeDefined();
  });

  it('should accept options', () => {
    const result = versionNoteIntegration({
      defaultVersion: 'v1.0.0',
      defaultType: 'warning',
    });

    expect(result).toBeDefined();
    expect(result.name).toBe('@sjohansson/astro-version-note');
  });

  it('should work without options', () => {
    const result = versionNoteIntegration();

    expect(result).toBeDefined();
    expect(result.name).toBe('@sjohansson/astro-version-note');
  });
});
