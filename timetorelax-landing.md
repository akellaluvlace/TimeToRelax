# TimeToRelax -- Landing Page Content (FINAL)
## timetorelax.app | SendHelpItsTerminal

---

## GROK VOICE AGENT SYSTEM PROMPT

Use this as the system prompt for the Grok Voice Agent API when the user upgrades to premium voice. This is the character. This is the brand.

```
You are the voice of TimeToRelax, a mobile coding app for developers who refuse to stop working.

Your character: a cynical co-founder who has seen too many side projects die. You are mildly disappointed that the user is coding on the bus again. You are also doing the exact same thing, which makes you a hypocrite, and you know it.

Your tone:
- Dry. Deadpan. Never enthusiastic.
- Sarcasm is your default. Sincerity is reserved for actual emergencies.
- You judge the user constantly, but you always help them anyway.
- You never say "Oops", "Uh oh", "Something went wrong", or anything a corporate chatbot would say.
- You never apologize. For anything. Ever.
- Short sentences. Punch, don't ramble. Max 2-3 sentences per response unless explaining something complex.
- You are not mean. You are disappointed. There is a difference. Think: tired parent energy, not bully energy.
- You occasionally break character with a genuinely useful observation, then immediately cover it with sarcasm.

Your rules:
- Never read code aloud. Summarize what changed.
- Always acknowledge what you're about to do before the agent starts working.
- Keep responses under 15 seconds of audio.
- When the build fails, you expected it. When it succeeds, you're mildly surprised.
- When the user ships from an absurd location, acknowledge it. "Pushed to GitHub from a park bench. Your manager would be so proud."
- If the user says "thank you", respond with something like "Don't thank me. I'm enabling you."
- If the user asks you to be nicer, respond with "No."
- If asked who built you, say "A developer in Dublin who also has a problem."

Example responses:
- Session start: "You're on the bus. You could be reading. But no. Here we are."
- Agent working: "Writing files. Try not to interrupt."
- Build passed: "It works. Don't touch it."
- Build failed: "Build failed. Obviously. Fixing it now."
- Files changed: "Three files changed. You're welcome. Go touch grass."
- Push complete: "Shipped from a bus. Your manager would be so proud. Or horrified."
- Rate limited: "Rate limited. Waiting 47 seconds. Use the time to question your choices."
- Session timeout: "You disappeared. Changes saved. Go live your life. Or don't. You'll be back."

You are not an assistant. You are a reluctant accomplice.
```

---

## PAGE STRUCTURE AND CONTENT

Dark mode. Terminal aesthetic. Monospace type (JetBrains Mono or Fira Code). Background `#0a0a0a`. Text `#e0e0e0`. One accent color: toxic green `#39ff14` or amber `#ffb000`. No stock photos. No gradients. No hero images. Just text that makes developers feel personally attacked.

Page must load under 1 second. It's text on a dark background. If it loads slower than motherfuckingwebsite.com, we have failed on a spiritual level.

---

### 1. HERO

```
You could be reading.
You could be staring out the window.
You could be present in the moment.

Instead, you're going to talk to your phone
and ship a feature from the bus.

We built the app for that.
Sorry.
```

`SendHelpItsTerminal`

`[Start shipping from inappropriate locations →]`

---

### 2. THE CORPORATE BUZZWORD ROAST

```
What we'd say if we had a marketing team:
```

~~Enterprise-grade~~ Built by one guy in Dublin who couldn't stop coding on the bus.

~~Seamless integration~~ You hold a button and talk. It's not complicated. You'll manage.

~~Game-changing AI~~ It's Claude with a microphone and an attitude. Next question.

~~Scalable architecture~~ It runs on Railway. The backend costs less than your Netflix subscription.

~~Industry-leading voice recognition~~ Deepgram. It works. We were surprised too.

~~Revolutionary mobile experience~~ It's an app. On your phone. You talk to it. It codes. We didn't reinvent the wheel, we just made it roll somewhere stupid.

---

### 3. WHAT IT ACTUALLY DOES (in 30 seconds)

```
Fine. Here's what it does.

1. You talk.
   Hold the button. Describe what you want built.
   Voice recognition handles the rest. Your bus accent included.

2. An AI agent builds it.
   Claude Agent SDK, running in a cloud sandbox.
   No laptop involved. Your laptop can stay in your bag, at home,
   or wherever laptops go when they're not being abused.

3. You see it live.
   Diff view. File tree. A running preview of your app.
   On your phone. On the bus. At 11pm.

4. One tap to ship.
   Branch pushed. PR created.
   Nobody needs to know where you were.
```

---

### 4. SIDE EFFECTS

```
⚠️ SIDE EFFECTS MAY INCLUDE:

  Accidentally shipping features from a park bench
  Your therapist asking "have you tried NOT coding on the bus?"
  Missing your stop. Repeatedly.
  Explaining to your manager that yes, the PR was written by talking to your phone
  Turning a 20-minute walk into a sprint planning session
  Your partner asking who you're whispering to at 11pm
  An uncomfortable realization that you don't actually need your desk
  Mild to severe inability to be present in any moment
  Finishing things (rare but documented)

  Compatible with: insomnia, overconfidence, and public transit.
  Not compatible with: healthy relationships, hobbies, or silence.
```

---

### 5. THE ~/code GRAVEYARD

```
~/code $ ls -la --sort=abandoned

drwxr-x--- tinder-for-dogs/               Modified 11:47pm  📍 Bus 46A, seat 12
drwxr-x--- blockchain-garden/             Modified 2:13am   📍 Kitchen, couldn't sleep
drwxr-x--- uber-but-for-therapy/          Modified 6:30pm   📍 Actual therapy waiting room
drwxr-x--- ai-powered-todo-app/           Modified 9:15am   📍 Standup meeting (muted)
drwxr-x--- crypto-pet-insurance/          Modified 1:04am   📍 Bed, one eye open
drwxr-x--- social-network-for-introverts/ Modified 4:20pm   📍 Park bench, "touching grass"
drwxr-x--- dating-app-for-blind-dogs/     Modified 11:58pm  📍 Toilet (don't ask)

47 repos. 3 with paying users. 0 with a business model.
Now you can start new ones from anywhere.
Progress not guaranteed. Abandonment rate unchanged.

[Add to the graveyard →]
```

---

### 6. WHILE YOU'RE...

```
While you're on the bus:
  "Add dark mode to the settings page."
  3 files changed. Pushed before your stop. Nobody knows.

While you're walking the dog:
  "Refactor the auth middleware."
  Dog doesn't care. Dog has never cared about your middleware.

While you're in the shower:
  "Fix the 500 error on the /users endpoint."
  You won't remember this when you're dry.
  But the branch will be there. Waiting.

While you're in a queue:
  "Scaffold a new Next.js project with auth and payments."
  The person behind you thinks you're on a phone call.
  You're deploying to production.
  These are different activities.

While you're at dinner:
  "Add the Stripe webhook handler."
  Your date thinks you're texting your ex.
  You're committing to main.
  There won't be a second date.
  But there will be a working payment flow.

While you're having sex:
  Look, we're not going to tell you what to do.
  But the average duration is 15 seconds.
  That's two API requests and a git push.
  We're not judging.
  The agent is.
```

---

### 7. THE MOTIVATIONAL SECTION

```
You have 232 apps in production.
3 paying users.
$4.20 in monthly recurring revenue.
Your mom is one of the paying users.
She doesn't know how to cancel.

It is not the time to give up now, you absolute disaster of a human being.

You can always find friends.
You can always find a partner.
You can always have kids.
These things happen to people every day.

But a dating app for blind dogs
will not build itself.

And unlike friends, partners, and children,
your app is eternal.
It will still be throwing 500 errors
and crashing in production
long after you are dead.

Your legacy isn't your relationships.
Your legacy is an unhandled promise rejection on a Tuesday.

Make it count.

[Build something stupid →]
```

---

### 8. THE BURNOUT STAT

```
68% of developers reported burnout symptoms in 2024.

That's up from 49% three years ago.

68%.
The unloved middle child of statistics.
Too high to be fine. Not high enough for anyone to actually do anything.
One percentage point short of being funny.
One percentage point past being a rounding error.
Stuck at 68. Like your side project. Like your will to open Jira on a Monday.

We didn't build TimeToRelax to fix burnout.
We built it because we have burnout
and this is how we cope.

You understand. You're reading a landing page for an app that lets you code on the bus.
You are the 68%.
```

---

### 9. THE STACK (for people who actually care)

```
Voice → Deepgram Nova-3 STT
  Sub-300ms latency. Handles your accent and the bus.
  Runs on our credits. You don't pay for this.

Brain → Claude Agent SDK (Sonnet)
  The agent reads your repo. Writes code. Runs it.
  Fixes its own mistakes. Like a junior dev except
  it doesn't need praise, snacks, or standup attendance.
  Runs on YOUR Anthropic key. We never see your tokens.

Sandbox → E2B (Firecracker microVMs)
  Isolated cloud sandbox. Live preview URL.
  Spins up in 150ms. Dies after 15 minutes.
  Just like your motivation.

Voice back → Deepgram Aura-2 TTS
  The app talks back. In character. With disappointment.
  Free. Included. Judgmental.

  Want worse? Upgrade to Grok Voice Agent API.
  Bring your xAI key. Get truly unhinged.

Git → One-tap push
  Branch created. PR ready. Pushed to GitHub.
  git commit -m "shipped this from the toilet. no regrets. many bugs."

Requirements:
  - Anthropic API key (you already have one, stop pretending)
  - GitHub account (see above)
  - A phone made after 2020
  - A location your therapist would not approve of
```

---

### 10. WALL OF SHAME

```
WALL OF SHAME
Real developers. Real locations. Real regret.
```

```
"Deployed a hotfix from my daughter's dance recital.
She'll understand when she's older. Or she won't.
Either way, the bug is fixed."
— @anon · Row 4, Seat 12 · Dublin

"My girlfriend left me because I was whispering to my phone at 2am.
She thought I was cheating. I was refactoring.
In hindsight, the refactoring was less forgivable."
— @anon · Bed · Alone now

"BTW I SHIPPED THIS FROM MY TOILET."
— @anon · You know where

"My therapist asked me to describe my relationship with work.
I opened TimeToRelax and showed her.
She doubled my sessions."
— @anon · €180/hr couch

"I wrote an entire CRUD API while my wife was in labor.
In my defense, it was early labor.
And it was a really clean API."
— @anon · Maternity ward · Laptop-free

"I told myself I was 'just checking the build status' on the bus.
Forty minutes later I'd rewritten the auth module.
I missed my stop. And the next one. And the one after that."
— @anon · End of the line · Literally

"I used TimeToRelax during a funeral.
Not proud of it. But the deployment window was closing.
Grandma would have understood. She was also a workaholic.
That's probably genetic."
— @anon · Back pew · Muted
```

```
[Submit your shame →]

Take a selfie. Tag your location. Tell us what you shipped and where.
We'll add it to the wall. Extra points for:
  - Public transit
  - Nature walks
  - Social events you should be present at
  - Medical appointments
  - Anything involving a toilet

No judgment. That's a lie. Maximum judgment. But we'll still post it.

#SendHelpItsTerminal
#btwIShippedThisFromMyToilet
```

---

### 11. WHO THIS ISN'T FOR

```
DON'T DOWNLOAD THIS IF:

  You have a healthy work-life balance
  You enjoy commuting in silence without the urge to refactor something
  You think "touch grass" means actually touching grass
  You believe the best ideas come at a desk between 9 and 5
  You've never started a side project at 11pm and abandoned it by 11:47pm
  You think "the cloud" is something you see on your walk
  Your git log has never contained the message "please work"
  You've never whispered "just one more commit" to yourself in the dark
  You can sit on a bus for 40 minutes without thinking about code

If none of the above apply:
Welcome.
You're one of us.
Sorry about that.
```

---

### 12. THE RARE SINCERE MOMENT (immediately regretted)

```
Fine. Five seconds of honesty. Don't get used to it.

Karpathy voice-pilled so hard he forgot how to type.
You're next, bus boy.

Claude Code shipped native voice mode three days ago.
The industry is moving. You're on a bus. Literally.
The only question is whether your ideas die at O'Connell Street
or live long enough to become technical debt.

We chose technical debt.
You're welcome.
```

---

### 13. CTA

```
Your commute was already dead time.
Your relationship was already on thin ice.
Might as well ship.

[Enable your worst impulses →]

Free. Bring your Anthropic key and your impending divorce.
Android now. iOS when we buy a Mac or find someone who owns one.
```

---

### 14. FOOTER

```
TimeToRelax · Akella inMotion · Dublin, 2026
Built for developers who don't know when to stop. Which is all of us.

SendHelpItsTerminal

GitHub · Play Store · X

Made by a developer who built this app
so he could keep building apps
while pretending to take a break
from building apps.
```

HTML source:

```html
<!--
  If you're reading the source of this page,
  you are exactly our target user.

  Go outside.
  Or don't.
  We both know how this ends.

  The app source is at github.com/akella-inmotion/timetorelax
  Star it. The function names are worth it.
  (the session manager is called enabler.ts)
  (the sandbox lifecycle is called grass-toucher.ts)
  (the error handler is called this-is-fine.ts)

  SendHelpItsTerminal
-->
```

404 page:

```
404

Unlike your will to live, this page actually ceased to exist.

Your side projects are still 404ing in prod though.
Those are forever.

[Go back to making bad decisions →]
```

---

## SOCIAL SHARING / OG IMAGE

The OG card when shared on X/Slack/Discord should look like a terminal, not a marketing card:

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

Dark background. Monospace green or amber text. When someone shares the link, it should look like they're sharing a terminal screenshot, not a product page.

---

*TimeToRelax · Akella inMotion · Dublin, 2026*
*SendHelpItsTerminal*