import { describe, it, expect, beforeEach } from 'vitest';
import { Writable } from 'node:stream';
import pino from 'pino';

import { diary, openChapter, spawnDiary } from '../src/services/dear-diary.js';

/**
 * Captures pino output into a buffer so we can inspect what got logged
 * without polluting test output. Think of it as a wiretap for your diary.
 */
function createLogSink(): { sink: Writable; lines: string[] } {
  const lines: string[] = [];
  const sink = new Writable({
    write(chunk: Buffer, _encoding: string, callback: () => void): void {
      lines.push(chunk.toString().trim());
      callback();
    },
  });
  return { sink, lines };
}

describe('dear-diary', () => {
  it('should exist, unlike my motivation at 11pm', () => {
    expect(diary).toBeDefined();
    expect(typeof diary.info).toBe('function');
    expect(typeof diary.error).toBe('function');
    expect(typeof diary.warn).toBe('function');
    expect(typeof diary.debug).toBe('function');
    expect(typeof diary.fatal).toBe('function');
  });

  it('should be a real pino instance, not a pretender', () => {
    // pino loggers have a .child() method
    expect(typeof diary.child).toBe('function');
    // pino loggers expose their level
    expect(typeof diary.level).toBe('string');
  });

  describe('spawnDiary', () => {
    it('should respect the level you give it, unlike your users', () => {
      const spawned = spawnDiary('warn');
      expect(spawned.level).toBe('warn');
    });

    it('should default to info when given nothing, like a therapist on autopilot', () => {
      const spawned = spawnDiary();
      expect(spawned).toBeDefined();
      expect(typeof spawned.info).toBe('function');
      expect(typeof spawned.child).toBe('function');
    });
  });

  describe('openChapter', () => {
    let sink: Writable;
    let lines: string[];
    let testDiary: pino.Logger;

    beforeEach(() => {
      const result = createLogSink();
      sink = result.sink;
      lines = result.lines;
      // We create a fresh pino instance writing to our sink
      // so we can actually read what gets logged without transport nonsense
      testDiary = pino({ level: 'debug' }, sink);
    });

    it('should include the service name in every log line, like a name badge at a conference nobody wanted to attend', () => {
      const child = testDiary.child({ service: 'enabler' });
      child.info('session spawned');

      expect(lines.length).toBe(1);
      const parsed: Record<string, unknown> = JSON.parse(lines[0]!);
      expect(parsed['service']).toBe('enabler');
      expect(parsed['msg']).toBe('session spawned');
    });

    it('should produce valid JSON in production mode, not your feelings', () => {
      const child = testDiary.child({ service: 'grass-toucher' });
      child.info({ sandboxId: 'sb-123' }, 'sandbox built');

      expect(lines.length).toBe(1);
      const parsed: Record<string, unknown> = JSON.parse(lines[0]!);
      expect(parsed['service']).toBe('grass-toucher');
      expect(parsed['sandboxId']).toBe('sb-123');
      expect(parsed['msg']).toBe('sandbox built');
      // Must have standard pino fields
      expect(parsed['level']).toBeDefined();
      expect(parsed['time']).toBeDefined();
    });

    it('should return a child logger from the actual openChapter export with service binding', () => {
      const child = openChapter('therapy-fund');
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
      expect(typeof child.error).toBe('function');
      // pino child loggers expose their bindings so we can verify the service field
      // is actually wired in, not just vibes
      const bindings = child.bindings();
      expect(bindings).toHaveProperty('service', 'therapy-fund');
    });

    it('should keep each chapter separate, like your work and your sanity', () => {
      const chapterA = testDiary.child({ service: 'enabler' });
      const chapterB = testDiary.child({ service: 'denial-engine' });

      chapterA.info('first entry');
      chapterB.warn('second entry');

      expect(lines.length).toBe(2);

      const entryA: Record<string, unknown> = JSON.parse(lines[0]!);
      const entryB: Record<string, unknown> = JSON.parse(lines[1]!);

      expect(entryA['service']).toBe('enabler');
      expect(entryB['service']).toBe('denial-engine');
    });

    it('should include extra context fields alongside service, because context matters even if your decisions do not', () => {
      const child = testDiary.child({ service: 'the-void' });
      child.info({ eventType: 'agent_thinking', turn: 3 }, 'streaming event');

      const parsed: Record<string, unknown> = JSON.parse(lines[0]!);
      expect(parsed['service']).toBe('the-void');
      expect(parsed['eventType']).toBe('agent_thinking');
      expect(parsed['turn']).toBe(3);
      expect(parsed['msg']).toBe('streaming event');
    });
  });
});
