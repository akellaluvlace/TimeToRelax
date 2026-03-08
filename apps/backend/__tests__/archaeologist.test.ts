// archaeologist.test.ts -- Testing the repo excavation system.
// Making sure we can dig through someone's code without
// accidentally reading their diary. That's confessional.ts's job.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/services/grass-toucher.js', () => ({
  pokeTheSandcastle: vi.fn(),
  buildSandcastle: vi.fn(),
  destroySandcastle: vi.fn(),
  bringYourOwnMess: vi.fn(),
  seeWhatYouDid: vi.fn(),
  setSandboxFactory: vi.fn(),
  inspectSandcastle: vi.fn(),
  resetGrassToucher: vi.fn(),
}));

import { pokeTheSandcastle } from '../src/services/grass-toucher.js';
import { excavate, assessTheTrauma } from '../src/services/archaeologist.js';

const mockPoke = vi.mocked(pokeTheSandcastle);

describe('archaeologist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assessTheTrauma', () => {
    it('should return "full" for repos with 500 or fewer files', () => {
      expect(assessTheTrauma(1)).toBe('full');
      expect(assessTheTrauma(250)).toBe('full');
      expect(assessTheTrauma(500)).toBe('full');
    });

    it('should return "signatures_only" for repos with 501-2000 files', () => {
      expect(assessTheTrauma(501)).toBe('signatures_only');
      expect(assessTheTrauma(1000)).toBe('signatures_only');
      expect(assessTheTrauma(2000)).toBe('signatures_only');
    });

    it('should throw for repos with over 2000 files and no subdirectory', () => {
      expect(() => assessTheTrauma(2001)).toThrow(/archaeologists, not masochists/);
      expect(() => assessTheTrauma(5000)).toThrow(/subdirectory/);
    });

    it('should return "subdirectory_focus" for repos with over 2000 files when subdirectory is specified', () => {
      expect(assessTheTrauma(2001, 'src')).toBe('subdirectory_focus');
      expect(assessTheTrauma(10000, 'packages/core')).toBe('subdirectory_focus');
    });
  });

  describe('excavate', () => {
    it('should return a manifest with file tree and signatures', async () => {
      // Mock file count
      mockPoke.mockResolvedValueOnce({ stdout: '3\n', stderr: '', exitCode: 0 });

      // Mock file tree listing (find command)
      mockPoke.mockResolvedValueOnce({
        stdout: '100 f /repo/src/app.ts\n50 f /repo/src/index.ts\n0 d /repo/src\n',
        stderr: '',
        exitCode: 0,
      });

      // Mock file signature reads (head -n 20 for each file)
      mockPoke.mockResolvedValueOnce({
        stdout: 'import express from "express";\n',
        stderr: '',
        exitCode: 0,
      });
      mockPoke.mockResolvedValueOnce({
        stdout: 'export default function main() {}\n',
        stderr: '',
        exitCode: 0,
      });

      // Mock README.md read
      mockPoke.mockResolvedValueOnce({
        stdout: '# My Project\nA project that exists.',
        stderr: '',
        exitCode: 0,
      });

      // Mock dependency file read (package.json)
      mockPoke.mockResolvedValueOnce({
        stdout: '{"name": "my-project", "version": "1.0.0"}',
        stderr: '',
        exitCode: 0,
      });

      const manifest = await excavate('sb-123', '/repo');

      expect(manifest.totalFiles).toBe(3);
      expect(manifest.fileTree.length).toBe(3);
      expect(manifest.signatures.length).toBe(2);
      expect(manifest.readme).toBe('# My Project\nA project that exists.');
      expect(manifest.estimatedTokens).toBeGreaterThan(0);
    });

    it('should read README and package.json from repo root', async () => {
      // Mock file count
      mockPoke.mockResolvedValueOnce({ stdout: '1\n', stderr: '', exitCode: 0 });

      // Mock file tree listing
      mockPoke.mockResolvedValueOnce({
        stdout: '200 f /repo/index.js\n',
        stderr: '',
        exitCode: 0,
      });

      // Mock file signature read
      mockPoke.mockResolvedValueOnce({
        stdout: 'console.log("hello");\n',
        stderr: '',
        exitCode: 0,
      });

      // Mock README read
      mockPoke.mockResolvedValueOnce({
        stdout: '# Hello World',
        stderr: '',
        exitCode: 0,
      });

      // Mock package.json read
      mockPoke.mockResolvedValueOnce({
        stdout: '{"name": "hello"}',
        stderr: '',
        exitCode: 0,
      });

      const manifest = await excavate('sb-123', '/repo');

      expect(manifest.readme).toBe('# Hello World');
      expect(manifest.dependencies).toBe('{"name": "hello"}');
    });

    it('should estimate token count based on file sizes', async () => {
      // Mock file count
      mockPoke.mockResolvedValueOnce({ stdout: '2\n', stderr: '', exitCode: 0 });

      // Mock file tree listing with known sizes
      mockPoke.mockResolvedValueOnce({
        stdout: '400 f /repo/a.ts\n600 f /repo/b.ts\n',
        stderr: '',
        exitCode: 0,
      });

      // Mock signature reads
      mockPoke.mockResolvedValueOnce({ stdout: 'line1\n', stderr: '', exitCode: 0 });
      mockPoke.mockResolvedValueOnce({ stdout: 'line2\n', stderr: '', exitCode: 0 });

      // Mock README (not found)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });

      // Mock dependency files (not found)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });

      const manifest = await excavate('sb-123', '/repo');

      // 400 + 600 = 1000 bytes. At 0.25 tokens per byte = 250 tokens.
      expect(manifest.estimatedTokens).toBe(250);
    });

    it('should handle repos with no README gracefully', async () => {
      // Mock file count
      mockPoke.mockResolvedValueOnce({ stdout: '1\n', stderr: '', exitCode: 0 });

      // Mock file tree
      mockPoke.mockResolvedValueOnce({
        stdout: '100 f /repo/main.py\n',
        stderr: '',
        exitCode: 0,
      });

      // Mock signature
      mockPoke.mockResolvedValueOnce({ stdout: 'print("hi")\n', stderr: '', exitCode: 0 });

      // Mock README (not found)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: 'No such file', exitCode: 1 });

      // Mock dependency files (requirements.txt not found, then others)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });

      const manifest = await excavate('sb-123', '/repo');

      expect(manifest.readme).toBeNull();
    });

    it('should handle repos with no dependency file gracefully', async () => {
      // Mock file count
      mockPoke.mockResolvedValueOnce({ stdout: '1\n', stderr: '', exitCode: 0 });

      // Mock file tree
      mockPoke.mockResolvedValueOnce({
        stdout: '100 f /repo/main.c\n',
        stderr: '',
        exitCode: 0,
      });

      // Mock signature
      mockPoke.mockResolvedValueOnce({ stdout: '#include <stdio.h>\n', stderr: '', exitCode: 0 });

      // Mock README
      mockPoke.mockResolvedValueOnce({ stdout: '# C Project', stderr: '', exitCode: 0 });

      // Mock dependency files: package.json, requirements.txt, go.mod, Cargo.toml (all not found)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 1 });

      const manifest = await excavate('sb-123', '/repo');

      expect(manifest.dependencies).toBeNull();
    });
  });
});
