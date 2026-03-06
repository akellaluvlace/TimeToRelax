# Step 01: Git Init & Monorepo Scaffold

**Status:** not-started
**Depends on:** nothing
**Estimated scope:** ~15 files

## Done When

Running `npm install` from the root succeeds and `turbo build` runs (even if apps are empty).

## Tasks

- [ ] `git init` the repo
- [ ] Create root `package.json` with workspaces: `apps/*`, `packages/*`
- [ ] Create `turbo.json` with `build`, `dev`, `lint`, `test` pipelines
- [ ] Create root `tsconfig.base.json` with strict mode, paths, ES2022 target
- [ ] Create root `.eslintrc.json` per CLAUDE.md ESLint config
- [ ] Create root `.prettierrc` per CLAUDE.md Prettier config
- [ ] Create `.gitignore` (node_modules, dist, .env, .expo, *.tsbuildinfo)
- [ ] Create `.env.example` files for backend and mobile
- [ ] Create empty workspace dirs: `apps/mobile/`, `apps/backend/`, `packages/shared/`
- [ ] Create placeholder `package.json` in each workspace
- [ ] Create placeholder `tsconfig.json` in each workspace extending base
- [ ] Verify `npm install` succeeds from root
- [ ] Verify `npx turbo build` runs without error
- [ ] Initial commit

## Files To Create

```
package.json                    # Root workspace config
turbo.json                      # Turborepo pipeline config
tsconfig.base.json              # Base TS config (strict, paths, ES2022)
.eslintrc.json                  # Root ESLint config
.prettierrc                     # Prettier config
.gitignore                      # Standard ignores
.env.example                    # Root env example (points to app-level envs)
apps/backend/package.json       # Backend workspace
apps/backend/tsconfig.json      # Extends base
apps/backend/.env.example       # Backend env vars per CLAUDE.md
apps/backend/src/.gitkeep       # Placeholder
apps/mobile/package.json        # Mobile workspace
apps/mobile/tsconfig.json       # Extends base
apps/mobile/.env.example        # Mobile env vars per CLAUDE.md
apps/mobile/src/.gitkeep        # Placeholder
packages/shared/package.json    # Shared types workspace
packages/shared/tsconfig.json   # Extends base
packages/shared/src/.gitkeep    # Placeholder
```

## Key Decisions

- **Turborepo** for monorepo orchestration (not Nx, not Lerna)
- **npm workspaces** (not yarn, not pnpm) unless there's a reason to switch
- Root `tsconfig.base.json` is the source of truth; workspaces extend it
- No barrel exports (`index.ts` re-exporting) per CLAUDE.md

## Acceptance Criteria

- [ ] `npm install` from root succeeds
- [ ] `npx turbo build` completes (no-op is fine)
- [ ] TypeScript strict mode enabled in base config
- [ ] All three workspaces detected by npm
- [ ] `.gitignore` covers node_modules, dist, .env, .expo
- [ ] Prettier and ESLint configs match CLAUDE.md specs exactly

## Notes

- Don't install any app dependencies yet; that's in steps 03 (backend) and 07 (mobile)
- The `paths` aliases (`@/*`) go in workspace-level tsconfigs, not the base
- Keep package names scoped: `@timetorelax/backend`, `@timetorelax/mobile`, `@timetorelax/shared`
