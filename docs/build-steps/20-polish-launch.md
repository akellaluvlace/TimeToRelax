# Step 20: Polish, Onboarding & Launch Prep

**Status:** not-started
**Depends on:** all previous steps
**Estimated scope:** ~15 files

## Done When

Onboarding flow guides new users through setup. All screens polished with personality copy. Android APK built via EAS. README is cynical and complete. App is shippable.

## Tasks

### Onboarding (rock-bottom.ts)
- [ ] Create onboarding flow: GitHub OAuth -> Anthropic key -> optional xAI key -> first session
- [ ] Each step has personality copy (not corporate wizard language)
- [ ] "Grok Voice" shown as visible upgrade option during onboarding
- [ ] Skip onboarding for returning users (keys already stored)
- [ ] Write test: onboarding flow completes with minimum keys (GitHub + Anthropic)

### UX Polish
- [ ] All loading states have personality copy
- [ ] All error states have personality copy (not "Something went wrong")
- [ ] All empty states have personality copy
- [ ] Session history: scroll back through conversation
- [ ] Project switcher: one-tap switch between connected repos
- [ ] Accessibility: all touchable elements have accessible labels
- [ ] Keyboard dismissal handled on all forms

### Build & Distribution
- [ ] Android APK build: `eas build --platform android --profile preview`
- [ ] Play Store listing draft (screenshots, description in persona voice)
- [ ] Update `app.json` with production config
- [ ] Ensure all env vars documented in `.env.example`

### Documentation
- [ ] Write README.md per CLAUDE.md README Easter Eggs section
- [ ] Include: requirements, installation, contributing, license
- [ ] All cynical. All on-brand.
- [ ] Demo video: screen recording of the full loop (voice -> build -> diff -> push)

### Final Checks
- [ ] `tsc --noEmit` passes in all workspaces
- [ ] `eslint . --max-warnings 0` passes
- [ ] `jest --passWithNoTests --coverage` passes
- [ ] No `any` types (`grep -r ": any" --include="*.ts" --include="*.tsx"`)
- [ ] No `console.log` in production code
- [ ] No secrets in code (`grep -rn "sk-\|api_key\|secret" --include="*.ts"`)
- [ ] No expo-av imports (expo-audio only)
- [ ] No AsyncStorage for secrets (expo-secure-store only)
- [ ] All exported functions have JSDoc
- [ ] Bundle size check for mobile

## Files To Create/Update

```
apps/mobile/app/onboarding.tsx                    # Onboarding flow (rock-bottom.ts)
apps/mobile/src/components/OnboardingStep.tsx     # Reusable onboarding step
apps/mobile/src/components/ProjectSwitcher.tsx    # Project picker in header
apps/mobile/src/components/SessionHistory.tsx     # Conversation scroll-back
README.md                                         # The cynical README
apps/mobile/app.json                              # Production config
```

## Onboarding Flow

### Screen 1: Welcome (rock-bottom.ts)
```
You're here. That's step one.
Step two is giving us your keys.
Step three is coding on a bus.
There is no step four.

[Let's do this]
```

### Screen 2: GitHub
```
Connect GitHub.
We need it to push your regrettable decisions.

[Connect GitHub]
```

### Screen 3: Anthropic Key
```
Enter your Anthropic API key.
You already have one. We know you do.

[Paste key]  [Where do I find this?]
```

### Screen 4: Grok (Optional)
```
Want the premium voice experience?
Add your xAI key for Grok Voice.
It's funnier. It's faster. It's $0.05/min.
Or skip. Deepgram works fine. We won't judge.
(We will judge a little.)

[Add xAI key]  [Skip for now]
```

### Screen 5: Ready
```
You're set.
Anthropic key: alive.
GitHub: connected.
Voice: working.

Start something you'll probably abandon.

[New Project]  [Connect Repo]
```

## README.md Structure
```markdown
# TimeToRelax

> Voice-first coding for developers who don't know when to stop.

SendHelpItsTerminal

## Requirements
- An Anthropic API key (you already have one, let's not pretend)
- A GitHub account (see above)
- A phone (any phone made after 2020)
- A location your therapist would not approve of

## Installation
...

## Contributing
PRs welcome. If your function names are boring, we'll rename them.
...

## License
MIT. Do whatever you want. We're not your manager.
```

## Acceptance Criteria

- [ ] Onboarding guides new user from zero to first session
- [ ] All screens have loading/error/empty states with personality
- [ ] No corporate language anywhere in the UI
- [ ] Android APK builds successfully
- [ ] README matches CLAUDE.md README Easter Eggs spec
- [ ] All automated checks pass (tsc, eslint, jest, audit)
- [ ] No security issues (keys in code, AsyncStorage for secrets)
- [ ] App is installable and functional on a real Android device
- [ ] Session history scrollable
- [ ] Project switcher works

## Notes

- This is the final mile. Everything else must be working before this step.
- The onboarding flow file is called `rock-bottom.ts` per CLAUDE.md ("this is where it starts").
- Per spec: "Product Hunt launch prep" is Week 4. This step gets us to "shippable beta."
- Demo video is important for Product Hunt. Screen record the full loop on a real device.
- Per CLAUDE.md: "If a developer reads the source on GitHub and nothing makes them smirk, we failed."
