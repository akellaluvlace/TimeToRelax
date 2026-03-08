// The repo manifest generator. Named "archaeologist" because digging
// through someone else's codebase is basically an excavation.
// You brush away the dust, find some questionable artifacts,
// and try to piece together what civilization built this.
//
// If you're reading this on GitHub: we looked at your repo.
// We have notes. You won't like them.

import { openChapter } from './dear-diary.js';
import { pokeTheSandcastle } from './grass-toucher.js';

const log = openChapter('archaeologist');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single node in the file tree. Could be a file, could be a directory. */
interface FileNode {
  path: string;
  size: number;
  isDirectory: boolean;
}

/** The first 20 lines of a file. Like reading the first page of someone's diary. */
interface FileSignature {
  path: string;
  firstLines: string;
}

/** The full picture of a repo, minus the regret that built it. */
interface RepoManifest {
  fileTree: FileNode[];
  signatures: FileSignature[];
  readme: string | null;
  dependencies: string | null;
  totalFiles: number;
  estimatedTokens: number;
}

/**
 * How much of the repo we're willing to look at.
 * 'full' = everything (brave). 'signatures_only' = just the surface (wise).
 * 'subdirectory_focus' = one corner of the mess (strategic).
 */
type ManifestStrategy = 'full' | 'signatures_only' | 'subdirectory_focus';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Beyond this many files, we refuse to do a full excavation.
// Not because we can't. Because the token bill would require therapy.
const FULL_EXCAVATION_LIMIT = 500;

// The grey zone. We'll read signatures but won't go spelunking.
const SIGNATURES_ONLY_LIMIT = 2000;

// How many lines we read from each file. 20 is enough to understand
// the vibe without committing to the whole relationship.
const LINES_PER_SIGNATURE = 20;

// Rough token estimation: ~4 tokens per word, ~10 words per line.
// Not precise. But neither is the user's project timeline.
const TOKENS_PER_BYTE = 0.25;

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Digs through a repo and builds a lightweight manifest.
 * Like an archaeologist, except the artifacts are someone's
 * questionable architectural decisions from six months ago.
 *
 * @param sandboxId - The sandbox where the repo lives
 * @param repoRoot - Root path of the cloned repo in the sandbox
 * @param subdirectory - Optional subdirectory to focus on (for massive repos)
 * @returns A manifest with file tree, signatures, readme, and deps
 * @throws If the sandbox doesn't exist or the repo is too large without a subdirectory
 */
async function excavate(
  sandboxId: string,
  repoRoot: string,
  subdirectory?: string,
): Promise<RepoManifest> {
  log.info({ sandboxId, repoRoot, subdirectory }, 'beginning excavation. hard hats on.');

  // Count the files first so we know what we're dealing with
  const countResult = await pokeTheSandcastle(
    sandboxId,
    `find ${repoRoot} -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l`,
  );
  const totalFiles = parseInt(countResult.stdout.trim(), 10) || 0;

  log.info({ sandboxId, totalFiles }, 'file count complete. assessing the trauma.');

  const strategy = assessTheTrauma(totalFiles, subdirectory);

  log.info({ sandboxId, strategy, totalFiles }, 'strategy decided. proceeding with excavation.');

  const focusPath = subdirectory ? `${repoRoot}/${subdirectory}` : repoRoot;

  // Build the file tree
  const fileTree = await digUpFileTree(sandboxId, focusPath, strategy);

  // Read file signatures based on strategy
  const signatures = await readSignatures(sandboxId, fileTree, repoRoot, strategy);

  // Always try to read README and dependency files from the repo root
  const readme = await readFileIfExists(sandboxId, repoRoot, 'README.md');
  const dependencies = await readDependencyFile(sandboxId, repoRoot);

  // Estimate tokens. Not precise, but good enough for budgeting purposes.
  const totalSize = fileTree.reduce((sum, node) => sum + node.size, 0);
  const estimatedTokens = Math.ceil(totalSize * TOKENS_PER_BYTE);

  const manifest: RepoManifest = {
    fileTree,
    signatures,
    readme,
    dependencies,
    totalFiles,
    estimatedTokens,
  };

  log.info(
    { sandboxId, totalFiles, signatureCount: signatures.length, estimatedTokens },
    'excavation complete. artifacts catalogued.',
  );

  return manifest;
}

/**
 * Decides how much of the repo we're willing to look at
 * based on how much code the user has inflicted on the world.
 *
 * @param totalFiles - Number of files in the repo
 * @param subdirectory - Optional subdirectory focus
 * @returns The excavation strategy
 * @throws If the repo is too large and no subdirectory is specified
 */
function assessTheTrauma(totalFiles: number, subdirectory?: string): ManifestStrategy {
  if (totalFiles <= FULL_EXCAVATION_LIMIT) {
    return 'full';
  }

  if (totalFiles <= SIGNATURES_ONLY_LIMIT) {
    return 'signatures_only';
  }

  // Over 2000 files without a subdirectory? We draw the line.
  if (!subdirectory) {
    throw new Error(
      `This repo has ${totalFiles} files. We're archaeologists, not masochists. ` +
        'Specify a subdirectory to focus on, or reconsider your life choices.',
    );
  }

  return 'subdirectory_focus';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Lists all files and directories in the focus path.
 * Excludes node_modules and .git because some things are best left buried.
 */
async function digUpFileTree(
  sandboxId: string,
  focusPath: string,
  strategy: ManifestStrategy,
): Promise<FileNode[]> {
  // For full and subdirectory_focus, get everything in the focus path.
  // For signatures_only, get only top-level and src/ files.
  let findCommand: string;

  if (strategy === 'signatures_only') {
    // Top-level files + src/ directory only
    findCommand =
      `find ${focusPath} -maxdepth 1 -not -path '*/node_modules/*' -not -path '*/.git/*' -printf '%s %y %p\\n' 2>/dev/null; ` +
      `find ${focusPath}/src -not -path '*/node_modules/*' -not -path '*/.git/*' -printf '%s %y %p\\n' 2>/dev/null`;
  } else {
    findCommand = `find ${focusPath} -not -path '*/node_modules/*' -not -path '*/.git/*' -printf '%s %y %p\\n' 2>/dev/null`;
  }

  const result = await pokeTheSandcastle(sandboxId, findCommand);
  const lines = result.stdout.trim().split('\n').filter(Boolean);

  const fileTree: FileNode[] = [];

  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length < 3) continue;

    const size = parseInt(parts[0] ?? '0', 10) || 0;
    const typeChar = parts[1] ?? '';
    const path = parts.slice(2).join(' ');

    if (!path) continue;

    fileTree.push({
      path,
      size,
      isDirectory: typeChar === 'd',
    });
  }

  return fileTree;
}

/**
 * Reads the first N lines of files to create signatures.
 * For 'full', reads everything. For 'signatures_only', reads top-level and src/ only.
 * For 'subdirectory_focus', reads everything in the subdirectory.
 */
async function readSignatures(
  sandboxId: string,
  fileTree: FileNode[],
  _repoRoot: string,
  strategy: ManifestStrategy,
): Promise<FileSignature[]> {
  const filesToRead = fileTree.filter((node) => !node.isDirectory && node.size > 0);

  // For signatures_only, we already filtered the file tree in digUpFileTree
  // so all files in the tree are eligible for signature reading.
  // For full and subdirectory_focus, read all files.
  const signatures: FileSignature[] = [];

  // Cap the number of files we read signatures for to avoid timeout
  const maxSignatures = strategy === 'full' ? FULL_EXCAVATION_LIMIT : 100;
  const filesToProcess = filesToRead.slice(0, maxSignatures);

  for (const file of filesToProcess) {
    try {
      const result = await pokeTheSandcastle(
        sandboxId,
        `head -n ${LINES_PER_SIGNATURE} "${file.path}" 2>/dev/null`,
      );

      if (result.exitCode === 0 && result.stdout.length > 0) {
        signatures.push({
          path: file.path,
          firstLines: result.stdout,
        });
      }
    } catch {
      // Some files can't be read (binary, permissions, etc.). That's fine.
      // We're archaeologists, not completionists.
      log.debug({ path: file.path }, 'could not read file signature. moving on.');
    }
  }

  return signatures;
}

/**
 * Reads a file from the repo root if it exists. Returns null if it doesn't.
 * Like checking if someone left a note before disappearing.
 */
async function readFileIfExists(
  sandboxId: string,
  repoRoot: string,
  filename: string,
): Promise<string | null> {
  try {
    const result = await pokeTheSandcastle(
      sandboxId,
      `cat "${repoRoot}/${filename}" 2>/dev/null`,
    );
    return result.exitCode === 0 && result.stdout.length > 0 ? result.stdout : null;
  } catch {
    return null;
  }
}

/**
 * Reads the dependency file from the repo root.
 * Checks package.json first (JS/TS), then requirements.txt (Python), then go.mod (Go).
 * Returns the first one found, or null if the repo is a lawless wasteland.
 */
async function readDependencyFile(
  sandboxId: string,
  repoRoot: string,
): Promise<string | null> {
  const candidates = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml'];

  for (const candidate of candidates) {
    const content = await readFileIfExists(sandboxId, repoRoot, candidate);
    if (content) {
      log.debug({ file: candidate }, 'dependency file found.');
      return content;
    }
  }

  log.debug('no dependency file found. this repo lives dangerously.');
  return null;
}

export { excavate, assessTheTrauma };
export type { FileNode, FileSignature, RepoManifest, ManifestStrategy };
