import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  proofOfGitHubLife,
  listTheDamage,
  tradeCodeForToken,
  generateBranchName,
  noTakebacksies,
  shipFromInappropriateLocation,
  makeItSomeoneElsesProblem,
} from '../src/services/no-laptop-no-problem.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock pokeTheSandcastle so we don't need real E2B sandboxes
vi.mock('../src/services/grass-toucher.js', () => ({
  pokeTheSandcastle: vi.fn(),
}));

// Import the mocked function for fine-grained control in tests
import { pokeTheSandcastle } from '../src/services/grass-toucher.js';
const mockPoke = vi.mocked(pokeTheSandcastle);

describe('no-laptop-no-problem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('proofOfGitHubLife', () => {
    it('should confirm a valid token has a pulse', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'x-oauth-scopes': 'repo, read:user' }),
        json: async () => ({ login: 'akellaluvlace' }),
      });

      const result = await proofOfGitHubLife('ghp_valid_token');
      expect(result.valid).toBe(true);
      expect(result.username).toBe('akellaluvlace');
      expect(result.scopes).toContain('repo');
      expect(result.scopes).toContain('read:user');
    });

    it('should declare a bad token dead on arrival', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
      });

      const result = await proofOfGitHubLife('ghp_dead_token');
      expect(result.valid).toBe(false);
      expect(result.username).toBe('');
    });

    it('should survive network failures without crashing', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network down'));

      const result = await proofOfGitHubLife('ghp_whatever');
      expect(result.valid).toBe(false);
    });

    it('should handle tokens with no scopes header gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ login: 'scopeless' }),
      });

      const result = await proofOfGitHubLife('ghp_no_scopes');
      expect(result.valid).toBe(true);
      expect(result.scopes).toEqual([]);
    });
  });

  describe('listTheDamage', () => {
    it('should return a formatted list of repos sorted by recently pushed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: 'TimeToRelax',
            full_name: 'akellaluvlace/TimeToRelax',
            description: 'Ship from inappropriate locations',
            clone_url: 'https://github.com/akellaluvlace/TimeToRelax.git',
            language: 'TypeScript',
            stargazers_count: 42,
            pushed_at: '2026-03-08T00:00:00Z',
            private: false,
          },
        ],
      });

      const repos = await listTheDamage('ghp_valid');
      expect(repos).toHaveLength(1);
      expect(repos[0]!.name).toBe('TimeToRelax');
      expect(repos[0]!.fullName).toBe('akellaluvlace/TimeToRelax');
      expect(repos[0]!.stargazersCount).toBe(42);
      expect(repos[0]!.isPrivate).toBe(false);
    });

    it('should return empty array when GitHub says no', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const repos = await listTheDamage('ghp_expired');
      expect(repos).toEqual([]);
    });

    it('should handle network failure without drama', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'));

      const repos = await listTheDamage('ghp_whatever');
      expect(repos).toEqual([]);
    });

    it('should pass page parameter to GitHub API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await listTheDamage('ghp_valid', 3);

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('page=3');
    });
  });

  describe('tradeCodeForToken', () => {
    it('should exchange an OAuth code for a token like a shady backroom deal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ghp_fresh_token' }),
      });

      const token = await tradeCodeForToken('auth_code_123', 'client_id', 'client_secret');
      expect(token).toBe('ghp_fresh_token');

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string) as Record<string, string>;
      expect(body['client_id']).toBe('client_id');
      expect(body['client_secret']).toBe('client_secret');
      expect(body['code']).toBe('auth_code_123');
    });

    it('should throw when GitHub rejects the code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(
        tradeCodeForToken('bad_code', 'client_id', 'client_secret'),
      ).rejects.toThrow('GitHub OAuth token exchange failed');
    });

    it('should throw when GitHub returns an error in the response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'bad_verification_code' }),
      });

      await expect(
        tradeCodeForToken('expired_code', 'client_id', 'client_secret'),
      ).rejects.toThrow('bad_verification_code');
    });
  });

  describe('generateBranchName', () => {
    it('should create a clean slug from a description', () => {
      expect(generateBranchName('Add dark mode')).toBe('ttr/add-dark-mode');
    });

    it('should strip special characters', () => {
      expect(generateBranchName('Fix CORS headers!!!')).toBe('ttr/fix-cors-headers');
    });

    it('should collapse multiple spaces and hyphens', () => {
      expect(generateBranchName('fix   the   thing')).toBe('ttr/fix-the-thing');
    });

    it('should cap at 50 total chars', () => {
      const long = 'this is a very long description that should be truncated because branch names have limits';
      const result = generateBranchName(long);
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result.startsWith('ttr/')).toBe(true);
    });

    it('should handle empty or all-special-char descriptions', () => {
      expect(generateBranchName('!!!')).toBe('ttr/unnamed-session');
      expect(generateBranchName('')).toBe('ttr/unnamed-session');
    });

    it('should not end with a trailing hyphen after truncation', () => {
      const result = generateBranchName('add some really cool feature that');
      expect(result.endsWith('-')).toBe(false);
    });
  });

  describe('noTakebacksies', () => {
    beforeEach(() => {
      mockPoke.mockReset();
    });

    it('should commit changes to the correct branch', async () => {
      // git config calls
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git checkout -b
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git add -A
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git diff --cached --numstat
      mockPoke.mockResolvedValueOnce({
        stdout: '10\t2\tsrc/app.ts\n5\t0\tsrc/utils.ts\n',
        stderr: '',
        exitCode: 0,
      });
      // git commit
      mockPoke.mockResolvedValueOnce({ stdout: '[ttr/add-dark-mode abc1234]', stderr: '', exitCode: 0 });
      // git rev-parse --short HEAD
      mockPoke.mockResolvedValueOnce({ stdout: 'abc1234\n', stderr: '', exitCode: 0 });

      const result = await noTakebacksies('sandbox-123', 'add dark mode');
      expect(result.branch).toBe('ttr/add-dark-mode');
      expect(result.commitHash).toBe('abc1234');
      expect(result.filesChanged).toBe(2);
    });

    it('should throw when there are no changes to commit', async () => {
      // git config calls
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git checkout -b
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git add -A
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git diff --cached --numstat (empty -- no changes)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

      await expect(noTakebacksies('sandbox-123', 'nothing happened')).rejects.toThrow(
        'No changes to commit',
      );
    });

    it('should throw when branch creation fails', async () => {
      // git config calls
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git checkout -b fails
      mockPoke.mockResolvedValueOnce({
        stdout: '',
        stderr: 'fatal: branch already exists',
        exitCode: 128,
      });

      await expect(noTakebacksies('sandbox-123', 'duplicate')).rejects.toThrow(
        'Failed to create branch',
      );
    });
  });

  describe('shipFromInappropriateLocation', () => {
    beforeEach(() => {
      mockPoke.mockReset();
    });

    it('should push the branch with the token injected', async () => {
      // git remote set-url (inject token)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git branch --show-current
      mockPoke.mockResolvedValueOnce({ stdout: 'ttr/add-dark-mode\n', stderr: '', exitCode: 0 });
      // git push
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git remote set-url (cleanup)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

      const result = await shipFromInappropriateLocation(
        'sandbox-123',
        'ghp_token',
        'https://github.com/user/repo.git',
      );

      expect(result.branch).toBe('ttr/add-dark-mode');
      expect(result.url).toBe('https://github.com/user/repo/tree/ttr/add-dark-mode');
    });

    it('should throw on unparseable repo URL', async () => {
      await expect(
        shipFromInappropriateLocation('sandbox-123', 'ghp_token', 'not-a-url'),
      ).rejects.toThrow('Could not parse owner/repo');
    });

    it('should throw when push fails', async () => {
      // git remote set-url
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      // git branch --show-current
      mockPoke.mockResolvedValueOnce({ stdout: 'ttr/fix-stuff\n', stderr: '', exitCode: 0 });
      // git push fails
      mockPoke.mockResolvedValueOnce({
        stdout: '',
        stderr: 'remote: Permission denied',
        exitCode: 128,
      });
      // git remote set-url (cleanup)
      mockPoke.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

      await expect(
        shipFromInappropriateLocation(
          'sandbox-123',
          'ghp_bad_token',
          'https://github.com/user/repo.git',
        ),
      ).rejects.toThrow('Push failed');
    });
  });

  describe('makeItSomeoneElsesProblem', () => {
    it('should create a PR via GitHub API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html_url: 'https://github.com/user/repo/pull/99',
          number: 99,
        }),
      });

      const result = await makeItSomeoneElsesProblem(
        'ghp_token',
        'user/repo',
        'ttr/add-feature',
        'feat: add feature',
        'Shipped from a bus.',
      );

      expect(result.prUrl).toBe('https://github.com/user/repo/pull/99');
      expect(result.prNumber).toBe(99);

      // Verify the API was called correctly
      const [url, options] = mockFetch.mock.calls[0]!;
      expect(url).toBe('https://api.github.com/repos/user/repo/pulls');
      const body = JSON.parse((options as { body: string }).body) as Record<string, string>;
      expect(body['head']).toBe('ttr/add-feature');
      expect(body['base']).toBe('main');
    });

    it('should throw when GitHub rejects the PR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Validation Failed',
      });

      await expect(
        makeItSomeoneElsesProblem(
          'ghp_token',
          'user/repo',
          'ttr/bad-branch',
          'nope',
          'nope',
        ),
      ).rejects.toThrow('PR creation failed');
    });
  });
});
