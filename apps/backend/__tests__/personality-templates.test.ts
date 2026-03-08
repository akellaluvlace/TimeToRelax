import { describe, it, expect } from 'vitest';

import { PersonalityState } from '@timetorelax/shared';

import { templates } from '../src/personality/templates.js';
import { BANNED_WORDS } from '../src/personality/banned-words.js';

// Every personality state value. If you added one and forgot templates,
// this is where you find out.
const ALL_STATES = Object.values(PersonalityState);

// Regex to detect emojis. Covers most emoji ranges.
// We don't want a smiley face undermining our carefully crafted cynicism.
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/u;

describe('personality-templates', () => {
  describe('coverage', () => {
    it('should have templates for every PersonalityState because we leave no state unjudged', () => {
      for (const state of ALL_STATES) {
        expect(templates[state]).toBeDefined();
        expect(Array.isArray(templates[state])).toBe(true);
      }
    });

    it('should have at least 2 templates per state so we do not sound like a broken record', () => {
      for (const state of ALL_STATES) {
        expect(templates[state].length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have at least 3 templates per state because 2 is the bare minimum and we have standards', () => {
      for (const state of ALL_STATES) {
        expect(
          templates[state].length,
          `state "${state}" has only ${templates[state].length} templates, need at least 3`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it('should not have any empty template arrays because silence is not a personality', () => {
      for (const state of ALL_STATES) {
        expect(templates[state].length).toBeGreaterThan(0);
      }
    });
  });

  describe('banned words', () => {
    it('should never apologize for anything, because we have a brand to maintain', () => {
      for (const state of ALL_STATES) {
        for (const template of templates[state]) {
          const lowerTemplate = template.toLowerCase();
          for (const banned of BANNED_WORDS) {
            expect(
              lowerTemplate.includes(banned.toLowerCase()),
              `template "${template}" in state "${state}" contains banned word "${banned}"`,
            ).toBe(false);
          }
        }
      }
    });
  });

  describe('length', () => {
    it('should keep all templates under 200 characters because TTS has limits and so do we', () => {
      for (const state of ALL_STATES) {
        for (const template of templates[state]) {
          expect(
            template.length,
            `template in "${state}" is ${template.length} chars: "${template}"`,
          ).toBeLessThanOrEqual(200);
        }
      }
    });

    it('should not have any empty string templates because that is just sad', () => {
      for (const state of ALL_STATES) {
        for (const template of templates[state]) {
          expect(template.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('formatting', () => {
    it('should contain zero emojis because our cynicism speaks for itself', () => {
      for (const state of ALL_STATES) {
        for (const template of templates[state]) {
          expect(
            EMOJI_REGEX.test(template),
            `template in "${state}" contains an emoji: "${template}"`,
          ).toBe(false);
        }
      }
    });

    it('should contain zero em dashes because Nikita said so and we do not question editorial decisions', () => {
      for (const state of ALL_STATES) {
        for (const template of templates[state]) {
          expect(
            template.includes('\u2014'),
            `template in "${state}" contains an em dash: "${template}"`,
          ).toBe(false);
        }
      }
    });
  });

  describe('interpolation placeholders', () => {
    it('should have {n} in files_changed templates because the number of files matters', () => {
      for (const template of templates.files_changed) {
        expect(
          template.includes('{n}'),
          `files_changed template missing {n}: "${template}"`,
        ).toBe(true);
      }
    });

    it('should have {n} in rate_limited templates because knowing the wait time is basic decency', () => {
      for (const template of templates.rate_limited) {
        expect(
          template.includes('{n}'),
          `rate_limited template missing {n}: "${template}"`,
        ).toBe(true);
      }
    });
  });

  describe('template bank completeness', () => {
    it('should cover the exact set of PersonalityState values, no more, no fewer', () => {
      const templateKeys = Object.keys(templates).sort();
      const stateValues = ALL_STATES.slice().sort();
      expect(templateKeys).toEqual(stateValues);
    });
  });
});
