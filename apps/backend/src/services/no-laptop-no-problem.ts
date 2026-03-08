// no-laptop-no-problem.ts -- GitHub operations service.
// The entire point of this app is that you don't need a laptop.
// This service makes that possible by talking to GitHub's API
// so you can push code from a bus. Your manager would be so proud.
//
// Now with full ship flow: commit, push, and PR creation.
// The holy trinity of "I wrote this on the bus and you can't stop me."

import { openChapter } from './dear-diary.js';
import { pokeTheSandcastle } from './grass-toucher.js';

const log = openChapter('no-laptop-no-problem');

/** A GitHub repo as we present it to the mobile app. */
interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  cloneUrl: string;
  language: string | null;
  stargazersCount: number;
  pushedAt: string;
  isPrivate: boolean;
}

/** The result of validating a GitHub token. Pulse check. */
interface GitHubValidation {
  valid: boolean;
  username: string;
  scopes: string[];
}

/**
 * Validates that a GitHub token is alive and has the right scopes.
 * Like checking if your passport is expired before heading to the airport.
 *
 * @param token - The GitHub OAuth token to validate
 * @returns Validation result with username and scopes
 */
async function proofOfGitHubLife(token: string): Promise<GitHubValidation> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      log.warn({ status: response.status }, 'GitHub token validation failed');
      return { valid: false, username: '', scopes: [] };
    }

    const scopes = (response.headers.get('x-oauth-scopes') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const data = (await response.json()) as { login: string };
    const username = data.login;

    log.info({ username, scopes }, 'GitHub token validated');
    return { valid: true, username, scopes };
  } catch (error: unknown) {
    log.error({ error }, 'GitHub validation request failed');
    return { valid: false, username: '', scopes: [] };
  }
}

/**
 * Lists repos the user has access to. Sorted by recently pushed.
 * Limited to 100 because nobody needs to see all of them.
 * Certainly not at 11pm on a bus.
 *
 * @param token - GitHub OAuth token
 * @param page - Page number for pagination (default 1)
 * @returns Array of repos, sorted by most recently pushed
 */
async function listTheDamage(token: string, page: number = 1): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/user/repos?sort=pushed&direction=desc&per_page=30&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      log.warn({ status: response.status, page }, 'failed to list repos');
      return [];
    }

    const raw = (await response.json()) as Array<{
      name: string;
      full_name: string;
      description: string | null;
      clone_url: string;
      language: string | null;
      stargazers_count: number;
      pushed_at: string;
      private: boolean;
    }>;

    const repos: GitHubRepo[] = raw.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      cloneUrl: r.clone_url,
      language: r.language,
      stargazersCount: r.stargazers_count,
      pushedAt: r.pushed_at,
      isPrivate: r.private,
    }));

    log.info({ count: repos.length, page }, 'repos listed');
    return repos;
  } catch (error: unknown) {
    log.error({ error }, 'failed to fetch repo list');
    return [];
  }
}

/**
 * Exchanges an OAuth code for an access token.
 * The mobile app can't do this directly because client_secret
 * lives on the server. Like it should. We have standards.
 *
 * @param code - The OAuth authorization code
 * @param clientId - GitHub App client ID
 * @param clientSecret - GitHub App client secret
 * @returns The access token, or throws if exchange fails
 */
async function tradeCodeForToken(code: string, clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    log.error({ status: response.status }, 'OAuth token exchange failed');
    throw new Error('GitHub OAuth token exchange failed. Check your credentials.');
  }

  const data = (await response.json()) as { access_token?: string; error?: string };

  if (data.error || !data.access_token) {
    log.error({ error: data.error }, 'OAuth token exchange returned error');
    throw new Error(`GitHub OAuth error: ${data.error ?? 'no token returned'}`);
  }

  log.info('OAuth token exchange successful');
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Ship flow types
// ---------------------------------------------------------------------------

/** The aftermath of committing in the sandbox. No take-backsies indeed. */
interface CommitResult {
  branch: string;
  commitHash: string;
  filesChanged: number;
}

/** The aftermath of pushing to GitHub from literally anywhere. */
interface PushResult {
  branch: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Ship flow functions
// ---------------------------------------------------------------------------

/**
 * Generates a branch name from a description.
 * Prefix with ttr/, slug the rest, cap at 50 chars.
 * Because "ttr/add-dark-mode" is informative.
 * "ttr/i-was-on-a-bus-and-had-feelings" is too long.
 *
 * @param description - What the user claims they were doing
 * @returns A clean branch name that won't make git angry
 */
function generateBranchName(description: string): string {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // ttr/ prefix + slug, capped at 50 total chars
  const maxSlugLength = 50 - 'ttr/'.length;
  const trimmedSlug = slug.slice(0, maxSlugLength).replace(/-$/, '');

  // If somehow the description was empty or all special chars, fallback
  const finalSlug = trimmedSlug || 'unnamed-session';

  return `ttr/${finalSlug}`;
}

/**
 * Commits all changes in the sandbox to a new branch. No take-backsies.
 * Creates a branch with a descriptive name, stages everything, and commits.
 * The commit message carries the description because future-you deserves context.
 *
 * @param sandboxId - The sandbox where the code lives
 * @param description - What was done, in human terms. Becomes the commit message.
 * @returns The branch name, commit hash, and number of files changed
 * @throws If the sandbox doesn't exist or git commands fail
 */
async function noTakebacksies(sandboxId: string, description: string): Promise<CommitResult> {
  const branch = generateBranchName(description);

  log.info({ sandboxId, branch }, 'committing changes. no take-backsies.');

  // Configure git user so the commit isn't anonymous.
  // Anonymous commits are for cowards and broken CI pipelines.
  await pokeTheSandcastle(sandboxId, 'git config user.email "bot@timetorelax.app"');
  await pokeTheSandcastle(sandboxId, 'git config user.name "TimeToRelax"');

  // Create and switch to the new branch
  const checkoutResult = await pokeTheSandcastle(sandboxId, `git checkout -b ${branch}`);
  if (checkoutResult.exitCode !== 0) {
    log.error({ sandboxId, branch, stderr: checkoutResult.stderr }, 'branch creation failed');
    throw new Error(`Failed to create branch "${branch}": ${checkoutResult.stderr}`);
  }

  // Stage everything. Yes, everything. The user accepted the changes.
  await pokeTheSandcastle(sandboxId, 'git add -A');

  // Count what we're about to commit so the summary card has a number
  const diffStatResult = await pokeTheSandcastle(sandboxId, 'git diff --cached --numstat');
  const filesChanged = diffStatResult.stdout
    .split('\n')
    .filter((line) => line.trim().length > 0).length;

  if (filesChanged === 0) {
    log.warn({ sandboxId, branch }, 'no changes to commit. the agent did nothing. impressive.');
    throw new Error('No changes to commit. The agent either did nothing or undid everything.');
  }

  // Commit with a meaningful message
  const commitMessage = `feat: ${description}`;
  const commitResult = await pokeTheSandcastle(
    sandboxId,
    `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
  );

  if (commitResult.exitCode !== 0) {
    log.error({ sandboxId, stderr: commitResult.stderr }, 'commit failed');
    throw new Error(`Commit failed: ${commitResult.stderr}`);
  }

  // Extract the commit hash from the output
  const hashResult = await pokeTheSandcastle(sandboxId, 'git rev-parse --short HEAD');
  const commitHash = hashResult.stdout.trim();

  log.info(
    { sandboxId, branch, commitHash, filesChanged },
    'committed. the damage is done.',
  );

  return { branch, commitHash, filesChanged };
}

/**
 * Pushes the current branch to GitHub. From literally anywhere.
 * Injects the user's token into the remote URL for authentication.
 * Pushed from a bus, a park bench, or a dentist's waiting room.
 * Your manager would be so proud.
 *
 * @param sandboxId - The sandbox with the committed code
 * @param githubToken - The user's GitHub OAuth token
 * @param repoUrl - The repo URL (https://github.com/owner/repo.git)
 * @returns The branch name and URL to the branch on GitHub
 * @throws If push fails (bad token, network, permission issues)
 */
async function shipFromInappropriateLocation(
  sandboxId: string,
  githubToken: string,
  repoUrl: string,
): Promise<PushResult> {
  // Extract owner/repo from the URL for building the branch URL later
  const repoMatch = repoUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
  if (!repoMatch?.[1]) {
    throw new Error('Could not parse owner/repo from URL. Is this even a GitHub repo?');
  }
  const repoFullName = repoMatch[1];

  // Inject token into remote URL for authenticated push.
  // We set-url instead of adding a new remote because the sandbox
  // already has origin from the initial clone.
  const authedUrl = repoUrl.replace('https://', `https://${githubToken}@`);
  await pokeTheSandcastle(sandboxId, `git remote set-url origin ${authedUrl}`);

  // Get the current branch name
  const branchResult = await pokeTheSandcastle(sandboxId, 'git branch --show-current');
  const branch = branchResult.stdout.trim();

  if (!branch) {
    throw new Error('No current branch found. Did you commit first? Order of operations matters.');
  }

  log.info({ sandboxId, branch, repoFullName }, 'pushing to GitHub. from an inappropriate location.');

  const pushResult = await pokeTheSandcastle(sandboxId, `git push -u origin ${branch}`);

  if (pushResult.exitCode !== 0) {
    log.error({ sandboxId, branch, stderr: pushResult.stderr }, 'push failed');

    // Clean up the authed URL from the remote so the token doesn't linger.
    // Paranoia is a feature, not a bug.
    await pokeTheSandcastle(sandboxId, `git remote set-url origin ${repoUrl}`).catch(() => {
      // If this fails too, the sandbox is temporary anyway. It'll be destroyed soon.
    });

    throw new Error(`Push failed: ${pushResult.stderr}`);
  }

  // Clean up the authed URL from the remote
  await pokeTheSandcastle(sandboxId, `git remote set-url origin ${repoUrl}`).catch(() => {
    // Best effort. The sandbox is ephemeral.
  });

  const url = `https://github.com/${repoFullName}/tree/${branch}`;

  log.info({ sandboxId, branch, url }, 'shipped. from an inappropriate location.');

  return { branch, url };
}

/**
 * Creates a PR on GitHub. Makes it someone else's problem.
 * Uses the GitHub REST API directly because we don't need Octokit
 * to send a single POST request. We have standards, not dependencies.
 *
 * @param githubToken - The user's GitHub OAuth token
 * @param repoFullName - The repo in "owner/repo" format
 * @param branch - The branch to create the PR from
 * @param title - PR title. Keep it short. Unlike this session.
 * @param description - PR body. Written in the voice persona, naturally.
 * @returns The PR URL and number
 * @throws If PR creation fails
 */
async function makeItSomeoneElsesProblem(
  githubToken: string,
  repoFullName: string,
  branch: string,
  title: string,
  description: string,
): Promise<{ prUrl: string; prNumber: number }> {
  log.info({ repoFullName, branch, title }, 'creating PR. making it someone else\'s problem.');

  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/pulls`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: description,
        head: branch,
        base: 'main',
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    log.error(
      { repoFullName, branch, status: response.status, error: errorBody },
      'PR creation failed',
    );
    throw new Error(`PR creation failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    html_url: string;
    number: number;
  };

  log.info(
    { repoFullName, branch, prNumber: data.number, prUrl: data.html_url },
    'PR created. it is now someone else\'s problem.',
  );

  return { prUrl: data.html_url, prNumber: data.number };
}

export {
  proofOfGitHubLife,
  listTheDamage,
  tradeCodeForToken,
  noTakebacksies,
  shipFromInappropriateLocation,
  makeItSomeoneElsesProblem,
  generateBranchName,
};
export type { GitHubRepo, GitHubValidation, CommitResult, PushResult };
