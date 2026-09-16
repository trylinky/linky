import { marshal, unmarshal } from './dynamo';
import { describe, expect, it } from 'vitest';

// lib-dynamodb did this for us. Getting it wrong corrupts reaction counters
// silently, so the mapping is pinned in both directions.
describe('marshal', () => {
  it('maps a string', () => {
    expect(marshal('abc')).toEqual({ S: 'abc' });
  });

  it('maps a number as a string, per the wire format', () => {
    expect(marshal(0)).toEqual({ N: '0' });
    expect(marshal(12)).toEqual({ N: '12' });
  });

  it('maps an empty map', () => {
    expect(marshal({})).toEqual({ M: {} });
  });

  it('maps a nested counter map', () => {
    expect(marshal({ love: 3, rocket: 1 })).toEqual({
      M: { love: { N: '3' }, rocket: { N: '1' } },
    });
  });

  it('maps a boolean and null', () => {
    expect(marshal(true)).toEqual({ BOOL: true });
    expect(marshal(null)).toEqual({ NULL: true });
  });

  it('throws on values it cannot represent', () => {
    expect(() => marshal(BigInt(1))).toThrow();
    expect(() => marshal(() => {})).toThrow();
    expect(() => marshal(Symbol('x'))).toThrow();
  });
});

describe('unmarshal', () => {
  it('round-trips a counter map', () => {
    expect(unmarshal(marshal({ love: 3, rocket: 1 }))).toEqual({
      love: 3,
      rocket: 1,
    });
  });

  it('returns numbers as numbers, not strings', () => {
    expect(unmarshal({ N: '7' })).toBe(7);
  });

  it('round-trips a full item', () => {
    const item = { PK: 'page-1', SK: 'totals', reactionTotals: { love: 2 } };
    expect(unmarshal(marshal(item))).toEqual(item);
  });

  it('round-trips the per-IP reactions item shape', () => {
    const item = {
      PK: 'page-1',
      SK: 'entries#198.51.100.21',
      reactions: { love: 3, rocket: 1 },
    };
    expect(unmarshal(marshal(item))).toEqual(item);
  });
});
