import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  buildSandcastle,
  pokeTheSandcastle,
  seeWhatYouDid,
  destroySandcastle,
  bringYourOwnMess,
  setSandboxFactory,
  inspectSandcastle,
  resetGrassToucher,
  MAX_REGRET_DURATION_MS,
} from '../src/services/grass-toucher.js';
import type { SandboxFactory } from '../src/services/grass-toucher.js';

// A mock sandbox that pretends to be a Firecracker microVM.
// It does not contain fire. It does not contain crackers.
// It contains vitest spies and broken dreams.
function createMockSandbox(id = 'sb-test-123') {
  return {
    id,
    getHost: vi.fn((port: number) => `${id}-${port}.e2b.dev`),
    commands: {
      run: vi.fn().mockResolvedValue({ stdout: 'ok', stderr: '', exitCode: 0 }),
    },
    kill: vi.fn().mockResolvedValue(undefined),
  };
}

describe('grass-toucher', () => {
  let mockSandbox: ReturnType<typeof createMockSandbox>;
  let mockFactory: SandboxFactory;

  beforeEach(() => {
    vi.clearAllMocks();
    resetGrassToucher();

    mockSandbox = createMockSandbox();
    mockFactory = vi.fn().mockResolvedValue(mockSandbox);
    setSandboxFactory(mockFactory);

    // Set the E2B API key so buildSandcastle doesn't throw
    vi.stubEnv('E2B_API_KEY', 'e2b_test_key_fake');
  });

  afterEach(() => {
    resetGrassToucher();
    vi.unstubAllEnvs();
  });

  describe('buildSandcastle', () => {
    it('should create a sandbox and return info with ID, like building something from nothing', async () => {
      const info = await buildSandcastle('node');

      expect(info).toBeDefined();
      expect(info.sandboxId).toBe('sb-test-123');
      expect(info.templateId).toBe('base');
      expect(info.previewUrl).toBe('https://sb-test-123-3000.e2b.dev');
    });

    it('should set timeout to 15 minutes because we learn from our mistakes', async () => {
      await buildSandcastle('node');

      expect(mockFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: MAX_REGRET_DURATION_MS,
        }),
      );
      expect(MAX_REGRET_DURATION_MS).toBe(900_000);
    });

    it('should resolve known template keys to their E2B template IDs', async () => {
      await buildSandcastle('nextjs');

      expect(mockFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'nextjs-developer',
        }),
      );
    });

    it('should pass through unknown template keys as raw E2B template IDs', async () => {
      await buildSandcastle('custom-template-id');

      expect(mockFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'custom-template-id',
        }),
      );
    });

    it('should pass the E2B API key from environment', async () => {
      await buildSandcastle('node');

      expect(mockFactory).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'e2b_test_key_fake',
        }),
      );
    });

    it('should throw if E2B_API_KEY is missing because credentials matter', async () => {
      vi.stubEnv('E2B_API_KEY', '');

      await expect(buildSandcastle('node')).rejects.toThrow(/E2B_API_KEY/);
    });

    it('should handle getHost throwing gracefully and set previewUrl to null', async () => {
      const shySandbox = createMockSandbox('sb-shy');
      shySandbox.getHost.mockImplementation(() => {
        throw new Error('port not exposed');
      });

      const shyFactory: SandboxFactory = vi.fn().mockResolvedValue(shySandbox);
      setSandboxFactory(shyFactory);

      const info = await buildSandcastle('node');

      expect(info.previewUrl).toBeNull();
      expect(info.sandboxId).toBe('sb-shy');
    });

    it('should use the correct port for each template', async () => {
      await buildSandcastle('fastapi');

      // fastapi waits on port 8000
      expect(mockSandbox.getHost).toHaveBeenCalledWith(8000);
    });

    it('should track the sandbox internally after creation', async () => {
      const info = await buildSandcastle('node');

      const inspected = inspectSandcastle(info.sandboxId);
      expect(inspected).toBeDefined();
      expect(inspected!.sandboxId).toBe(info.sandboxId);
    });
  });

  describe('pokeTheSandcastle', () => {
    it('should run a command and return stdout, stderr, and exitCode', async () => {
      const info = await buildSandcastle('node');

      mockSandbox.commands.run.mockResolvedValueOnce({
        stdout: 'hello world',
        stderr: '',
        exitCode: 0,
      });

      const result = await pokeTheSandcastle(info.sandboxId, 'echo hello world');

      expect(result.stdout).toBe('hello world');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
      expect(mockSandbox.commands.run).toHaveBeenCalledWith('echo hello world');
    });

    it('should return non-zero exit codes without throwing because failure is information', async () => {
      const info = await buildSandcastle('node');

      mockSandbox.commands.run.mockResolvedValueOnce({
        stdout: '',
        stderr: 'command not found',
        exitCode: 127,
      });

      const result = await pokeTheSandcastle(info.sandboxId, 'nonexistent-command');

      expect(result.exitCode).toBe(127);
      expect(result.stderr).toBe('command not found');
    });

    it('should throw for unknown sandbox because you cannot poke what does not exist', async () => {
      await expect(
        pokeTheSandcastle('sb-ghost', 'echo hi'),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('seeWhatYouDid', () => {
    it('should return preview URL for tracked sandbox', async () => {
      const info = await buildSandcastle('node');

      const url = seeWhatYouDid(info.sandboxId);
      expect(url).toBe('https://sb-test-123-3000.e2b.dev');
    });

    it('should return null for unknown sandbox because ghosts have no URLs', () => {
      const url = seeWhatYouDid('sb-does-not-exist');
      expect(url).toBeNull();
    });
  });

  describe('destroySandcastle', () => {
    it('should kill the sandbox and remove it from tracking', async () => {
      const info = await buildSandcastle('node');

      await destroySandcastle(info.sandboxId);

      expect(mockSandbox.kill).toHaveBeenCalled();
      expect(inspectSandcastle(info.sandboxId)).toBeUndefined();
    });

    it('should handle unknown sandbox gracefully because you cannot destroy nothing', async () => {
      // Should not throw
      await expect(destroySandcastle('sb-already-gone')).resolves.toBeUndefined();
    });

    it('should survive sandbox.kill() throwing because sometimes death is messy', async () => {
      const info = await buildSandcastle('node');

      mockSandbox.kill.mockRejectedValueOnce(new Error('already dead'));

      // Should not throw even when kill fails
      await expect(destroySandcastle(info.sandboxId)).resolves.toBeUndefined();

      // Should still remove from tracking
      expect(inspectSandcastle(info.sandboxId)).toBeUndefined();
    });
  });

  describe('bringYourOwnMess', () => {
    it('should clone repo with depth=1 because bandwidth is precious', async () => {
      const info = await buildSandcastle('node');

      mockSandbox.commands.run.mockResolvedValueOnce({
        stdout: "Cloning into 'repo'...",
        stderr: '',
        exitCode: 0,
      });

      const result = await bringYourOwnMess(
        info.sandboxId,
        'https://github.com/user/repo.git',
      );

      expect(result.exitCode).toBe(0);
      expect(mockSandbox.commands.run).toHaveBeenCalledWith(
        'git clone --depth 1 https://github.com/user/repo.git',
      );
    });

    it('should inject token for authenticated clones because private repos exist', async () => {
      const info = await buildSandcastle('node');

      mockSandbox.commands.run.mockResolvedValueOnce({
        stdout: "Cloning into 'repo'...",
        stderr: '',
        exitCode: 0,
      });

      await bringYourOwnMess(
        info.sandboxId,
        'https://github.com/user/private-repo.git',
        'ghp_secrettoken123',
      );

      expect(mockSandbox.commands.run).toHaveBeenCalledWith(
        'git clone --depth 1 https://ghp_secrettoken123@github.com/user/private-repo.git',
      );
    });

    it('should not inject token when none is provided', async () => {
      const info = await buildSandcastle('node');

      mockSandbox.commands.run.mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });

      await bringYourOwnMess(info.sandboxId, 'https://github.com/user/public-repo.git');

      expect(mockSandbox.commands.run).toHaveBeenCalledWith(
        'git clone --depth 1 https://github.com/user/public-repo.git',
      );
    });

    it('should throw for unknown sandbox because you cannot clone into the void', async () => {
      await expect(
        bringYourOwnMess('sb-ghost', 'https://github.com/user/repo.git'),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('setSandboxFactory', () => {
    it('should allow injection of custom factory for testing purposes', async () => {
      const customSandbox = createMockSandbox('sb-custom');
      const customFactory: SandboxFactory = vi.fn().mockResolvedValue(customSandbox);

      setSandboxFactory(customFactory);

      const info = await buildSandcastle('node');

      expect(customFactory).toHaveBeenCalled();
      expect(info.sandboxId).toBe('sb-custom');
    });
  });

  describe('inspectSandcastle', () => {
    it('should return info for tracked sandboxes', async () => {
      const info = await buildSandcastle('node');

      const inspected = inspectSandcastle(info.sandboxId);
      expect(inspected).toEqual(info);
    });

    it('should return undefined for untracked sandboxes', () => {
      expect(inspectSandcastle('sb-who')).toBeUndefined();
    });
  });
});
