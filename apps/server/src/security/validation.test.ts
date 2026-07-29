import { describe, it, expect } from 'vitest';
import { hasUnsafeObjectKey, exceedsJsonDepth } from './validation.js';

describe('hasUnsafeObjectKey', () => {
  it('accepts ordinary structures', () => {
    expect(hasUnsafeObjectKey({ a: 1, b: { c: [1, 2, { d: 'x' }] } })).toBe(false);
    expect(hasUnsafeObjectKey(null)).toBe(false);
    expect(hasUnsafeObjectKey('string')).toBe(false);
  });

  it('detects prototype-pollution keys at the top level', () => {
    expect(hasUnsafeObjectKey(JSON.parse('{"__proto__": {"admin": true}}'))).toBe(true);
    expect(hasUnsafeObjectKey({ constructor: {} })).toBe(true);
    expect(hasUnsafeObjectKey({ prototype: {} })).toBe(true);
  });

  it('detects them when nested inside objects and arrays', () => {
    expect(hasUnsafeObjectKey({ a: { b: JSON.parse('{"__proto__": 1}') } })).toBe(true);
    expect(hasUnsafeObjectKey([{ ok: 1 }, JSON.parse('{"__proto__": 1}')])).toBe(true);
  });
});

describe('exceedsJsonDepth', () => {
  function nest(depth: number): unknown {
    let value: unknown = 'leaf';
    for (let i = 0; i < depth; i += 1) value = { next: value };
    return value;
  }

  it('allows structures within the limit', () => {
    expect(exceedsJsonDepth(nest(3), 10)).toBe(false);
    expect(exceedsJsonDepth({ a: 1 }, 1)).toBe(false);
    expect(exceedsJsonDepth('scalar', 1)).toBe(false);
  });

  it('rejects structures deeper than the limit', () => {
    expect(exceedsJsonDepth(nest(30), 24)).toBe(true);
  });

  it('counts array nesting too', () => {
    expect(exceedsJsonDepth([[[[['deep']]]]], 3)).toBe(true);
  });
});
