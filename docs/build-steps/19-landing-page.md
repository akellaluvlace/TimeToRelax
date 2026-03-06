# Step 19: Landing Page (timetorelax.app)

**Status:** not-started
**Depends on:** nothing (independent)
**Estimated scope:** ~5 files

## Done When

`timetorelax.app` is live on Vercel. Dark terminal aesthetic. All 14 sections from `timetorelax-landing.md`. Loads under 1 second. OG card looks like a terminal screenshot when shared. 404 page works.

## Tasks

- [ ] Create `apps/landing/` directory (or separate repo)
- [ ] Build single HTML page with all 14 sections from `timetorelax-landing.md`
- [ ] Style: dark mode, terminal aesthetic, monospace (JetBrains Mono / Fira Code)
- [ ] Colors: background `#0a0a0a`, text `#e0e0e0`, accent toxic green `#39ff14` or amber `#ffb000`
- [ ] No frameworks. Plain HTML + CSS. Maybe a sprinkle of vanilla JS for interactions.
- [ ] Implement OG meta tags with terminal-style card
- [ ] Create OG image: terminal screenshot aesthetic
- [ ] Create 404 page per `timetorelax-landing.md` spec
- [ ] Add HTML source comment easter egg (from landing doc)
- [ ] CTA buttons link to Play Store / GitHub / App download
- [ ] Responsive: works on mobile and desktop
- [ ] Performance: under 1 second load time
- [ ] Deploy to Vercel
- [ ] Write basic tests: all sections render, OG tags present, 404 works

## Files To Create

```
apps/landing/index.html          # The entire landing page
apps/landing/404.html            # The 404 page
apps/landing/style.css           # Terminal aesthetic styles
apps/landing/og-image.png        # Terminal-style OG card
apps/landing/vercel.json         # Vercel deployment config
apps/landing/package.json        # Minimal (just for Vercel)
```

## Design Specs (from timetorelax-landing.md)

### Typography
- Font: JetBrains Mono or Fira Code (monospace)
- Fallback: `monospace`

### Colors
- Background: `#0a0a0a`
- Text: `#e0e0e0`
- Accent: `#39ff14` (toxic green) or `#ffb000` (amber)
- Strikethrough text: dimmed color for buzzword roast section

### Layout
- Single column, generous vertical spacing
- Code blocks styled as terminal output
- CTA buttons: accent-colored, terminal-style (`[text -->]`)
- No images except OG card. Text only. Like motherfuckingwebsite.com.

### Sections (from landing doc)
1. Hero
2. Corporate Buzzword Roast
3. What It Actually Does
4. Side Effects
5. ~/code Graveyard
6. While You're...
7. The Motivational Section
8. The Burnout Stat
9. The Stack (Nerds Only)
10. Wall of Shame
11. Who This Isn't For
12. The Rare Sincere Moment
13. CTA
14. Footer

### OG Card
```
┌─────────────────────────────────────────┐
│ $ timetorelax                           │
│                                         │
│ > You had one escape left.              │
│ > We fixed that.                        │
│ > You're welcome.                       │
│                                         │
│ SendHelpItsTerminal                     │
│ timetorelax.app                         │
└─────────────────────────────────────────┘
```

### 404 Page
```
404

Unlike your will to live, this page actually ceased to exist.

Your side projects are still 404ing in prod though.
Those are forever.

[Go back to making bad decisions -->]
```

### HTML Source Easter Egg
```html
<!--
  If you're reading the source of this page,
  you are exactly our target user.
  ...
-->
```

## Acceptance Criteria

- [ ] All 14 sections from `timetorelax-landing.md` present
- [ ] Terminal aesthetic: dark, monospace, minimal
- [ ] Loads under 1 second (no frameworks, minimal assets)
- [ ] OG meta tags set with terminal-style card
- [ ] 404 page with personality
- [ ] HTML source contains easter egg comment
- [ ] Responsive on mobile and desktop
- [ ] CTA buttons have correct links
- [ ] Deployed to Vercel and accessible at timetorelax.app
- [ ] No JavaScript frameworks. HTML + CSS (+ vanilla JS if needed)

## Notes

- This is independent of the app. Can be built in parallel with anything.
- Per `timetorelax-landing.md`: "If it loads slower than motherfuckingwebsite.com, we have failed on a spiritual level."
- The copy is FINAL in `timetorelax-landing.md`. Don't rewrite it. Just implement it.
- The landing page IS the marketing. The copy does the distribution. Get it right.
- Vercel deployment is free tier. One static HTML page doesn't need anything more.
