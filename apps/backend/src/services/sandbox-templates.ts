// Pre-warmed template configurations for different project types.
// Because waiting for npm install is bad enough on a laptop,
// let alone on a bus where the cellular signal gives up every 30 seconds.
//
// If you're reading this on GitHub: yes, we pre-warm sandboxes.
// No, we cannot pre-warm your career decisions.

/**
 * Known project templates for E2B sandboxes.
 * Each template maps to a pre-configured Firecracker microVM image
 * so the user doesn't spend their commute watching `npm install` scroll.
 *
 * Add new templates here when E2B publishes them or when we create custom ones.
 * If you add one, add a test. If you forget the test, the CI will remind you.
 * Unlike your dentist, it never forgets.
 */
const SANDBOX_TEMPLATES = {
  nextjs: {
    templateId: 'nextjs-developer',
    description: 'Next.js with React and TypeScript',
    startCmd: 'npm run dev',
    waitForPort: 3000,
  },
  express: {
    templateId: 'base',
    description: 'Express.js with TypeScript',
    startCmd: 'npx tsx src/index.ts',
    waitForPort: 3000,
  },
  fastapi: {
    templateId: 'base',
    description: 'FastAPI with Python 3.12',
    startCmd: 'uvicorn main:app --host 0.0.0.0 --port 8000',
    waitForPort: 8000,
  },
  node: {
    templateId: 'base',
    description: 'Bare Node.js with TypeScript',
    startCmd: 'npx tsx src/index.ts',
    waitForPort: 3000,
  },
} as const;

/** The blessed template names. If it's not in here, we don't know what it is. */
type SandboxTemplate = keyof typeof SANDBOX_TEMPLATES;

export { SANDBOX_TEMPLATES };
export type { SandboxTemplate };
