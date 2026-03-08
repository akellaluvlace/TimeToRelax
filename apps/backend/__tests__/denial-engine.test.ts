import { describe, it, expect } from 'vitest';

import { PersonalityState } from '@timetorelax/shared';

import { craftDisapproval, consultTheOracle } from '../src/services/denial-engine.js';

// Every personality state value, collected so we can iterate.
// If you add a state to the shared package and forget to add templates,
// these tests will remind you. Loudly.
const ALL_STATES = Object.values(PersonalityState);

describe('denial-engine', () => {
  describe('craftDisapproval', () => {
    it('should have a response for every personality state, no exceptions, no excuses', () => {
      for (const state of ALL_STATES) {
        const result = craftDisapproval(state);
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should roast the user differently each time (randomness check)', () => {
      // Call craftDisapproval many times for session_start (which has 4 templates)
      // and collect unique results. With 4 templates and 50 tries,
      // the odds of not seeing at least 2 different ones are astronomically low.
      // If this test is flaky, buy a lottery ticket.
      const results = new Set<string>();
      for (let i = 0; i < 50; i++) {
        results.add(craftDisapproval('session_start'));
      }
      expect(results.size).toBeGreaterThanOrEqual(2);
    });

    it('should interpolate {n} when context provides n, because math matters', () => {
      const result = craftDisapproval('files_changed', { n: 42 });
      expect(result).toContain('42');
      expect(result).not.toContain('{n}');
    });

    it('should interpolate multiple context keys without breaking a sweat', () => {
      // rate_limited templates use {n} for seconds
      const result = craftDisapproval('rate_limited', { n: 30 });
      expect(result).toContain('30');
      expect(result).not.toContain('{n}');
    });

    it('should leave placeholders intact when context is missing, because crashing is beneath us', () => {
      // Call without context on a state that uses {n}
      const result = craftDisapproval('files_changed');
      // The {n} should remain as-is since no context was provided
      expect(result).toContain('{n}');
    });

    it('should leave unknown placeholders alone when context has different keys', () => {
      const result = craftDisapproval('files_changed', { count: 5 });
      // {n} should still be there because we passed {count}, not {n}
      expect(result).toContain('{n}');
    });

    it('should handle empty context object without having an existential crisis', () => {
      const result = craftDisapproval('session_start', {});
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return a string, not undefined, not null, not your hopes and dreams', () => {
      for (const state of ALL_STATES) {
        const result = craftDisapproval(state);
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('consultTheOracle', () => {
    it('should return a string even in stub mode, because silence is not on-brand', async () => {
      const result = await consultTheOracle('agent_thinking', 'user asked to rewrite everything');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not throw when given unusual input, because the oracle is unflappable', async () => {
      const result = await consultTheOracle('', '');
      expect(typeof result).toBe('string');
    });

    it('should return the stubbed fallback until the real Haiku call is wired up', async () => {
      const result = await consultTheOracle('build_failed', 'fifth time this session');
      // The stub returns a specific hardcoded string
      expect(result).toContain('oracle');
    });
  });
});
