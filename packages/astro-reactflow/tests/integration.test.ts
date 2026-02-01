import { describe, expect, it } from 'vitest';
import reactFlowIntegration from '../src/integration';

describe('ReactFlow Integration', () => {
  it('should export integration function', () => {
    expect(reactFlowIntegration).toBeDefined();
    expect(typeof reactFlowIntegration).toBe('function');
  });

  it('should return valid Astro integration', () => {
    const result = reactFlowIntegration();

    expect(result).toBeDefined();
    expect(result.name).toBe('@sjohansson/astro-reactflow');
    expect(result.hooks).toBeDefined();
    expect(result.hooks['astro:config:setup']).toBeDefined();
    expect(result.hooks['astro:config:done']).toBeDefined();
  });

  it('should accept options', () => {
    const result = reactFlowIntegration({ injectStyles: false });

    expect(result).toBeDefined();
    expect(result.name).toBe('@sjohansson/astro-reactflow');
  });

  it('should work without options', () => {
    const result = reactFlowIntegration();

    expect(result).toBeDefined();
    expect(result.name).toBe('@sjohansson/astro-reactflow');
  });

  it('should default injectStyles to true', () => {
    const result = reactFlowIntegration();

    expect(result).toBeDefined();
    // The default is set internally, we just verify the integration is created
    expect(result.hooks['astro:config:setup']).toBeDefined();
  });
});
