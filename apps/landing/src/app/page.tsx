'use client';

import Section from '@/components/Section';
import Terminal from '@/components/Terminal';
import Cursor from '@/components/Cursor';

/* ── Shared helpers ─────────────────────────────────────────────────── */

function Divider({ color = 'via-border-light' }: { color?: string }) {
  return (
    <div
      className={`h-px max-w-[200px] mx-auto bg-gradient-to-r from-transparent ${color} to-transparent my-4`}
    />
  );
}

function SectionLabel({
  children,
  color = 'text-text-dim',
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-4 justify-center mb-12 md:mb-16">
      <div className="h-px w-8 md:w-20 bg-gradient-to-r from-transparent to-border-light" />
      <p className={`text-sm md:text-base tracking-[0.25em] uppercase font-normal ${color}`}>{children}</p>
      <div className="h-px w-8 md:w-20 bg-gradient-to-l from-transparent to-border-light" />
    </div>
  );
}

function CTA({
  children,
  ghost = false,
  href = '#',
}: {
  children: React.ReactNode;
  ghost?: boolean;
  href?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-block px-8 sm:px-12 py-4 text-sm md:text-base tracking-wider uppercase font-normal transition-all duration-300 ${
        ghost
          ? 'border border-border-light text-text hover:border-green-mid hover:text-green-mid hover:shadow-[0_0_30px_rgba(34,197,94,0.08)]'
          : 'bg-green text-bg font-medium hover:shadow-[0_0_40px_rgba(57,255,20,0.3),0_0_80px_rgba(57,255,20,0.1)] hover:brightness-110'
      }`}
    >
      {children}
    </a>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="relative">
      {/* ━━━ 1. HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section
        immediate
        className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden"
      >
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(57,255,20,0.08) 0%, transparent 65%)',
            animation: 'glow-pulse 6s ease-in-out infinite',
          }}
        />

        <div className="relative z-10 max-w-3xl">
          {[
            'You could be reading.',
            'You could be staring out the window.',
            'You could be present in the moment.',
            '',
            "Instead, you're going to talk to your phone",
            'and ship a feature from the bus.',
            '',
            'We built the app for that.',
          ].map((line, i) =>
            line === '' ? (
              <div key={i} className="h-6 md:h-8" />
            ) : (
              <p
                key={i}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-text-bright leading-relaxed opacity-0"
                style={{
                  animation: 'fadeUp 0.7s ease-out forwards',
                  animationDelay: `${0.3 + i * 0.18}s`,
                }}
              >
                {line}
              </p>
            ),
          )}
          <p
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-text-bright leading-relaxed opacity-0"
            style={{
              animation: 'fadeUp 0.7s ease-out forwards',
              animationDelay: '1.9s',
            }}
          >
            Sorry.
            <Cursor />
          </p>

          <p
            className="mt-10 md:mt-14 text-text-dim text-sm tracking-[0.4em] uppercase font-normal opacity-0"
            style={{ animation: 'fadeIn 0.8s ease-out 2.4s forwards' }}
          >
            SendHelpItsTerminal
          </p>

          <div
            className="mt-10 md:mt-14 opacity-0"
            style={{ animation: 'fadeIn 0.8s ease-out 2.7s forwards' }}
          >
            <CTA>Start shipping from inappropriate locations</CTA>
          </div>
          <p
            className="mt-5 text-text-dim text-base opacity-0"
            style={{ animation: 'fadeIn 0.8s ease-out 3s forwards' }}
          >
            Voice-first coding. No laptop. No peace.
          </p>
        </div>

        <div
          className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 text-text-muted text-xs tracking-[0.3em] uppercase opacity-0"
          style={{ animation: 'fadeIn 1s ease-out 3.5s forwards' }}
        >
          <span style={{ animation: 'scroll-hint 2.5s ease-in-out infinite' }} className="inline-block">
            scroll
          </span>
        </div>
      </Section>

      <Divider color="via-green/20" />

      {/* ━━━ 2. CORPORATE BUZZWORD ROAST ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// what we'd say if we had a marketing team`}</SectionLabel>

          <div className="space-y-10 md:space-y-14">
            {[
              ['Enterprise-grade', "Built by one Irish lad with mass-transit-induced psychosis and zero investors. Zero tests. One dream that should have died in 2022 but didn't because he missed his bus stop."],
              ['Seamless integration', "You hold a button and talk. If you can't manage that, the app isn't the problem. You are. We say this with love. Mostly."],
              ['Game-changing AI', "It's Claude with a microphone duct-taped on and a personality disorder we gave it on purpose. It's not sentient. It just sounds disappointed, like your father."],
              ['Scalable architecture', "It runs on Railway. One instance. Less compute than your smart fridge. The backend costs less than the latte you bought to feel productive this morning."],
              ['Industry-leading voice recognition', "Deepgram. It understood a drunk Dubliner on the 46A at 1am. If it can survive that, it can survive you."],
              ['Revolutionary mobile experience', "It's an app. On your phone. You talk. It codes. We didn't cure cancer. We just made it possible to mass-produce technical debt from a toilet. You're welcome."],
            ].map(([buzzword, truth], i) => (
              <div key={i} className="text-center">
                <p className="text-red line-through text-base md:text-lg tracking-wide mb-3">{buzzword}</p>
                <p className="text-text-bright text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">{truth}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Divider />

      {/* ━━━ 3. WHAT IT ACTUALLY DOES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// what it actually does (in 30 seconds)`}</SectionLabel>

          <Terminal title="how-it-works.sh">
            <div className="space-y-8 md:space-y-12">
              {[
                {
                  n: '01',
                  title: 'You talk.',
                  body: "Hold the button. Describe what you want built. Voice recognition handles the rest. Your bus accent included.",
                },
                {
                  n: '02',
                  title: 'An AI agent builds it.',
                  body: "Claude Agent SDK, running in a cloud sandbox. No laptop involved. Your laptop can stay in your bag, at home, or wherever laptops go when they're not being abused.",
                },
                {
                  n: '03',
                  title: 'You see it live.',
                  body: 'Diff view. File tree. A running preview of your app. On your phone. On the bus. At 11pm.',
                },
                {
                  n: '04',
                  title: 'One tap to ship.',
                  body: 'Branch pushed. PR created. Nobody needs to know where you were.',
                },
              ].map((step) => (
                <div key={step.n} className="text-center">
                  <span className="text-green font-medium text-xl opacity-40">{step.n}</span>
                  <p className="text-text-bright font-medium text-lg md:text-xl mt-2">{step.title}</p>
                  <p className="text-text text-base md:text-lg leading-relaxed mt-2 max-w-lg mx-auto">{step.body}</p>
                </div>
              ))}
            </div>
          </Terminal>
        </div>
      </Section>

      <Divider color="via-amber/15" />

      {/* ━━━ 4. SIDE EFFECTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel color="text-amber">{`! side effects`}</SectionLabel>

          <div className="space-y-5 md:space-y-6">
            {[
              'Mass-replying "in a meeting" while refactoring auth on the Luas',
              'Your therapist diagnosing you with "terminal productivity"',
              'Missing your stop so often the driver knows your repo name',
              'Accidentally force-pushing to main during couples counselling',
              '"Just one more commit" replacing actual human intimacy',
              'Your dog thinking "good boy" means "merge conflict resolved"',
              'Explaining to A&E that you walked into a pole while reviewing a diff',
              'Your partner finding "localhost:3000" in your browser history and asking who she is',
              'Losing custody of a houseplant because you forgot it exists',
              'A Deepgram transcript of you whispering "deploy" at 3am being used as evidence',
              'Finishing things (rare, undocumented, presumed hallucinatory)',
            ].map((effect, i) => (
              <p
                key={i}
                className="text-base md:text-lg text-text hover:text-text-bright transition-colors duration-300"
              >
                {effect}
              </p>
            ))}
          </div>

          <div className="mt-12 md:mt-16 space-y-2">
            <p className="text-base text-text-dim">Compatible with: insomnia, overconfidence, and public transit.</p>
            <p className="text-base text-text-dim">Not compatible with: healthy relationships, hobbies, or silence.</p>
          </div>

          <div className="mt-8 md:mt-10">
            <CTA ghost>Enable your worst impulses</CTA>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ━━━ 5. ~/code GRAVEYARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// the ~/code graveyard`}</SectionLabel>

          <Terminal title="~/code">
            <p className="text-green mb-6 text-left text-base md:text-lg">$ ls -la --sort=abandoned</p>

            <div className="space-y-0">
              {[
                ['tinder-for-dogs/', '11:47pm', 'Bus 46A, seat 12'],
                ['blockchain-garden/', '2:13am', "Kitchen, couldn't sleep"],
                ['uber-but-for-therapy/', '6:30pm', 'Actual therapy waiting room'],
                ['ai-powered-todo-app/', '9:15am', 'Standup meeting (muted)'],
                ['crypto-pet-insurance/', '1:04am', 'Bed, one eye open'],
                ['social-network-for-introverts/', '4:20pm', 'Park bench, "touching grass"'],
                ['dating-app-for-blind-dogs/', '11:58pm', "Toilet (don't ask)"],
              ].map(([name, time, location], i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3 px-3 -mx-3 group hover:bg-green/[0.03] transition-colors duration-200 border-b border-border/40 last:border-b-0"
                >
                  <span className="text-cyan font-medium text-base text-left">{name}</span>
                  <span className="text-text-dim text-sm text-left sm:text-right shrink-0">{time} — {location}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border text-center space-y-2">
              <p className="text-text-dim text-base">47 repos. 3 with paying users. 0 with a business model.</p>
              <p className="text-text text-base">Now you can start new ones from anywhere.</p>
              <p className="text-text-muted text-base">Progress not guaranteed. Abandonment rate unchanged.</p>
            </div>
          </Terminal>

          <div className="mt-10">
            <CTA ghost>Add to the graveyard</CTA>
          </div>
        </div>
      </Section>

      <Divider color="via-cyan/15" />

      {/* ━━━ 6. WHILE YOU'RE... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// while you're...`}</SectionLabel>

          <div className="space-y-14 md:space-y-20">
            {[
              {
                title: "While you're on the bus:",
                command: '"Add dark mode to the settings page."',
                lines: ['3 files changed. Pushed before your stop. Nobody knows.'],
              },
              {
                title: "While you're walking the dog:",
                command: '"Refactor the auth middleware."',
                lines: ["Dog doesn't care. Dog has never cared about your middleware."],
              },
              {
                title: "While you're in the shower:",
                command: '"Fix the 500 error on the /users endpoint."',
                lines: [
                  "You won't remember this when you're dry.",
                  'But the branch will be there. Waiting.',
                ],
              },
              {
                title: "While you're in a queue:",
                command: '"Scaffold a new Next.js project with auth and payments."',
                lines: [
                  'The person behind you thinks you\'re on a phone call.',
                  "You're deploying to production.",
                  'These are different activities.',
                ],
              },
              {
                title: "While you're at dinner:",
                command: '"Add the Stripe webhook handler."',
                lines: [
                  'Your date thinks you\'re texting your ex.',
                  "You're committing to main.",
                  "There won't be a second date.",
                  'But there will be a working payment flow.',
                ],
              },
              {
                title: "While you're having sex:",
                command: null,
                lines: [
                  "We both know you're not.",
                  'But hypothetically.',
                  "The session timeout is 15 minutes. You'll be done in 90 seconds.",
                  "That's a full feature branch and a CI run.",
                  "Your partner fakes it. Your tests don't.",
                  'At least one of you ships tonight.',
                ],
              },
            ].map((scenario, i) => (
              <div key={i} className="text-center">
                <p className="text-cyan font-medium text-lg md:text-xl mb-4">{scenario.title}</p>
                {scenario.command && (
                  <p className="text-green text-base md:text-lg mb-4 font-medium">{scenario.command}</p>
                )}
                <div className="space-y-1.5">
                  {scenario.lines.map((line, j) => (
                    <p key={j} className="text-text text-base md:text-lg leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Divider />

      {/* ━━━ 7. MOTIVATIONAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-24 md:py-36 lg:py-48">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>{`// motivation`}</SectionLabel>

          <div className="space-y-8 md:space-y-10">
            <div className="space-y-3">
              <p className="text-text-bright text-xl md:text-2xl">You have 232 repos on GitHub.</p>
              <p className="text-text-bright text-xl md:text-2xl">4 have READMEs. 1 has users.</p>
              <p className="text-text-bright text-xl md:text-2xl">The user is you. From a different device. Testing.</p>
              <p className="text-text text-lg mt-4">Your Stripe dashboard shows $4.20 MRR.</p>
              <p className="text-text text-lg">That&apos;s your mom. She subscribed to be supportive.</p>
              <p className="text-text text-lg">She doesn&apos;t know what the app does. Neither do you, really.</p>
            </div>

            <p
              className="text-amber text-2xl md:text-3xl lg:text-4xl font-medium leading-snug"
              style={{ textShadow: '0 0 40px rgba(245,158,11,0.15)' }}
            >
              Do not stop now, you catastrophically broken person.
            </p>

            <div className="space-y-2 text-lg text-text">
              <p>Love fades. Friendships drift. Children grow up and stop calling.</p>
              <p>Your code doesn&apos;t care. Your code will never leave you.</p>
              <p className="text-text-dim">Your code has no feelings, no expectations, no needs.</p>
              <p className="text-text-dim">It is the only honest relationship you will ever have.</p>
            </div>

            <div className="space-y-2">
              <p className="text-text-bright text-xl md:text-2xl">But a dating app for blind dogs</p>
              <p className="text-text-bright text-xl md:text-2xl">will not build itself.</p>
              <p className="text-text text-lg">And nobody else is going to build it either.</p>
              <p className="text-text text-lg">Because it is a terrible idea. Yours. Specifically.</p>
            </div>

            <div className="space-y-2 text-lg text-text">
              <p>Every person you have ever loved will eventually forget your name.</p>
              <p>But your unhandled promise rejection on line 847</p>
              <p>will be throwing errors in production</p>
              <p>long after the heat death of your social life,</p>
              <p>your marriage, and eventually the sun.</p>
            </div>

            <div className="space-y-2">
              <p className="text-text text-lg">Your legacy isn&apos;t the people who loved you.</p>
              <p className="text-text-bright text-xl md:text-2xl">
                Your legacy is a mass of spaghetti code that outlives them all.
              </p>
              <p className="text-text text-lg">And that is beautiful. In a way nobody should examine too closely.</p>
            </div>

            <p
              className="text-green text-2xl md:text-3xl lg:text-4xl font-medium pt-4"
              style={{ textShadow: '0 0 40px rgba(57,255,20,0.2)' }}
            >
              Ship it before the feeling passes.
            </p>
          </div>

          <div className="mt-12 md:mt-16">
            <CTA>Build something stupid</CTA>
          </div>
        </div>
      </Section>

      <Divider color="via-amber/20" />

      {/* ━━━ 8. BURNOUT STAT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-28 md:py-40 lg:py-52">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel color="text-red">{`! the number`}</SectionLabel>

          <div className="mb-12 md:mb-16">
            <p
              className="text-[72px] sm:text-[100px] md:text-[140px] lg:text-[200px] font-bold text-amber leading-none tracking-tighter"
              style={{
                textShadow: '0 0 80px rgba(245,158,11,0.3), 0 0 160px rgba(245,158,11,0.1)',
              }}
            >
              68%
            </p>
            <p className="text-text text-lg md:text-xl mt-6">
              of developers reported burnout symptoms in 2024.
            </p>
            <p className="text-text-dim text-base mt-2">
              That&apos;s up from 49% three years ago.
            </p>
          </div>

          <div className="space-y-6 md:space-y-8 max-w-xl mx-auto">
            <div className="space-y-2 text-lg text-text">
              <p>68%.</p>
              <p>The unloved middle child of statistics.</p>
              <p>Too high to be fine. Not high enough for anyone to actually do anything.</p>
              <p>One percentage point short of being funny.</p>
              <p>One percentage point past being a rounding error.</p>
              <p>Stuck at 68. Like your side project. Like your will to open Jira on a Monday.</p>
            </div>

            <div className="space-y-2 text-lg text-text">
              <p>We didn&apos;t build TimeToRelax to fix burnout.</p>
              <p className="text-text-bright text-xl md:text-2xl">
                We built it because we have burnout
              </p>
              <p className="text-text-bright text-xl md:text-2xl">and this is how we cope.</p>
            </div>

            <div className="space-y-2 text-lg text-text">
              <p>You understand. You&apos;re reading a landing page for an app that lets you code on the bus.</p>
              <p
                className="text-amber text-xl md:text-2xl font-medium mt-2"
                style={{ textShadow: '0 0 30px rgba(245,158,11,0.15)' }}
              >
                You are the 68%.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ━━━ 9. THE STACK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// the stack (for people who actually care)`}</SectionLabel>

          <div className="space-y-10 md:space-y-14">
            {[
              {
                label: 'Voice',
                value: 'Deepgram Nova-3 STT',
                desc: "Sub-300ms latency. Handles your accent and the bus. Runs on our credits. You don't pay for this.",
              },
              {
                label: 'Brain',
                value: 'Claude Agent SDK (Sonnet)',
                desc: "Reads your repo. Writes code. Runs it. Fixes its own mistakes. Like a junior dev except it doesn't need praise or standup attendance. Runs on YOUR key.",
              },
              {
                label: 'Sandbox',
                value: 'E2B Firecracker',
                desc: 'Isolated cloud sandbox. Live preview. Spins up in 150ms. Dies after 15 minutes. Just like your motivation.',
              },
              {
                label: 'Voice back',
                value: 'Deepgram Aura-2 TTS',
                desc: "Talks back. In character. With disappointment. Want worse? Upgrade to Grok Voice. Bring your xAI key. Get truly unhinged.",
              },
              {
                label: 'Git',
                value: 'One-tap push',
                desc: 'Branch created. PR ready. Pushed to GitHub. "shipped from the toilet. no regrets. many bugs."',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-text-muted text-xs tracking-[0.3em] uppercase mb-2">{item.label}</p>
                <p className="text-green font-medium text-lg md:text-xl mb-2">{item.value}</p>
                <p className="text-text text-base md:text-lg leading-relaxed max-w-xl mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 md:mt-20 pt-10 border-t border-border max-w-xl mx-auto">
            <p className="text-text-bright text-base mb-5 font-medium">Requirements:</p>
            <div className="space-y-2 text-text text-base">
              <p>Anthropic API key (you already have one, stop pretending)</p>
              <p>GitHub account (see above)</p>
              <p>A phone made after 2020</p>
              <p>A location your therapist would not approve of</p>
            </div>
          </div>
        </div>
      </Section>

      <Divider color="via-purple/15" />

      {/* ━━━ 10. WALL OF SHAME ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel color="text-purple">{`// wall of shame`}</SectionLabel>
          <p className="text-text-dim text-base mb-12 md:mb-16">
            Real developers. Real locations. Real regret.
          </p>

          <div className="space-y-12 md:space-y-16">
            {[
              {
                quote: "Deployed a hotfix from my daughter's dance recital. She'll understand when she's older. Or she won't. Either way, the bug is fixed.",
                who: '@anon — Row 4, Seat 12 — Dublin',
              },
              {
                quote: "My girlfriend left me because I was whispering to my phone at 2am. She thought I was cheating. I was refactoring. In hindsight, the refactoring was less forgivable.",
                who: '@anon — Bed — Alone now',
              },
              {
                quote: 'BTW I SHIPPED THIS FROM MY TOILET.',
                who: '@anon — You know where',
              },
              {
                quote: "My therapist asked me to describe my relationship with work. I opened TimeToRelax and showed her. She doubled my sessions.",
                who: '@anon — EUR180/hr couch',
              },
              {
                quote: "I wrote an entire CRUD API while my wife was in labor. In my defense, it was early labor. And it was a really clean API.",
                who: '@anon — Maternity ward — Laptop-free',
              },
              {
                quote: "I told myself I was 'just checking the build status' on the bus. Forty minutes later I'd rewritten the auth module. I missed my stop. And the next one. And the one after that.",
                who: '@anon — End of the line — Literally',
              },
              {
                quote: "I used TimeToRelax during a funeral. Not proud of it. But the deployment window was closing. Grandma would have understood. She was also a workaholic. That's probably genetic.",
                who: '@anon — Back pew — Muted',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-text text-base md:text-lg leading-relaxed italic max-w-2xl mx-auto">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p className="text-text-muted text-sm mt-4">{item.who}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 md:mt-16 text-text-muted text-base tracking-wide">
            #SendHelpItsTerminal #btwIShippedThisFromMyToilet
          </p>
        </div>
      </Section>

      <Divider color="via-red/15" />

      {/* ━━━ 11. WHO THIS ISN'T FOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel color="text-red">{`! do not download this if`}</SectionLabel>

          <div className="space-y-4 md:space-y-5">
            {[
              'You close your laptop at 18:00 like some kind of functioning adult',
              'Your weekend contains activities that don\'t involve tailwind.config.js',
              'You think "touch grass" means literally going outside and experiencing joy',
              'You believe side projects should have users before you abandon them',
              'You\'ve never mass-deleted node_modules in a fit of existential rage',
              'Your git log has never contained the commit message "please work" or "I am begging"',
              'You can sit on public transport without mentally refactoring something you saw on GitHub',
              'You\'ve never whispered "just one more commit" to yourself in the dark like a prayer',
              'You think 11pm is for sleeping and not for starting a project you\'ll abandon by 11:47pm',
              'Your therapist has never paused mid-session to google what "deployed to prod" means',
              'You have a hobby that doesn\'t require a package.json',
              'You\'ve experienced a full 24 hours without checking if your CI pipeline passed',
            ].map((item, i) => (
              <p
                key={i}
                className="text-lg md:text-xl text-text hover:text-text-bright transition-colors duration-300"
              >
                <span className="text-red font-bold mr-3">&#x2717;</span>
                {item}
              </p>
            ))}
          </div>

          <div className="mt-12 md:mt-16 space-y-3">
            <p className="text-text-dim text-lg">If none of the above apply:</p>
            <p
              className="text-green text-2xl md:text-3xl font-medium"
              style={{ textShadow: '0 0 30px rgba(57,255,20,0.15)' }}
            >
              Welcome.
            </p>
            <p className="text-text-bright text-lg">You&apos;re one of us.</p>
            <p className="text-text-dim text-lg">Sorry about that.</p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ━━━ 12. SINCERE MOMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-24 md:py-36 lg:py-48">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>{`// five seconds of honesty (immediately regretted)`}</SectionLabel>

          <div className="space-y-8 md:space-y-10">
            <div className="space-y-2">
              <p className="text-text-bright text-xl md:text-2xl">
                Karpathy voice-pilled so hard he forgot how to type.
              </p>
              <p className="text-text-bright text-xl md:text-2xl">You&apos;re next, bus boy.</p>
            </div>

            <div className="space-y-2 text-lg text-text">
              <p>Claude Code shipped native voice mode three days ago.</p>
              <p>The industry is moving. You&apos;re on a bus. Literally.</p>
            </div>

            <div className="space-y-2 text-lg text-text">
              <p>The only question is whether your ideas die at O&apos;Connell Street</p>
              <p>or live long enough to become technical debt.</p>
            </div>

            <p
              className="text-green text-xl md:text-2xl font-medium"
              style={{ textShadow: '0 0 30px rgba(57,255,20,0.15)' }}
            >
              We chose technical debt. You&apos;re welcome.
            </p>
          </div>
        </div>
      </Section>

      <Divider color="via-green/20" />

      {/* ━━━ 13. FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="px-6 py-28 md:py-40 lg:py-52">
        <div className="max-w-xl mx-auto text-center relative">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div className="space-y-3 text-lg text-text mb-12 md:mb-16">
              <p>Your commute was already dead time.</p>
              <p>Your relationship was already on thin ice.</p>
              <p className="text-text-bright text-2xl md:text-3xl mt-6">Might as well ship.</p>
            </div>

            <CTA>SendHelpItsTerminal</CTA>

            <p className="mt-8 text-text-dim text-base">
              Free. Bring your Anthropic key and your impending divorce.
            </p>
            <p className="mt-3 text-text-muted text-base">
              Android first. iOS eventually.
            </p>
          </div>
        </div>
      </Section>

      {/* ━━━ 14. FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-border px-6 py-14 md:py-20 text-center">
        <p className="text-text-dim text-base">TimeToRelax — Akella inMotion — Dublin, 2026</p>
        <p className="text-text-muted text-base mt-3">
          Built for developers who don&apos;t know when to stop. Which is all of us.
        </p>
        <p className="text-text-dim text-sm mt-3 tracking-[0.3em] uppercase font-normal">
          SendHelpItsTerminal
        </p>

        <div className="mt-8 flex items-center justify-center gap-6 md:gap-8 text-base">
          <a
            href="https://github.com/akellaluvlace/TimeToRelax"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-dim hover:text-green transition-colors duration-300"
          >
            GitHub
          </a>
          <span className="text-border-light">|</span>
          <a href="#" className="text-text-dim hover:text-green transition-colors duration-300">
            Play Store
          </a>
          <span className="text-border-light">|</span>
          <a href="#" className="text-text-dim hover:text-green transition-colors duration-300">
            X
          </a>
        </div>

        <p className="mt-10 text-text-muted text-sm max-w-md mx-auto leading-relaxed">
          Made by a developer who built this app so he could keep building apps while pretending to
          take a break from building apps.
        </p>
      </footer>
    </main>
  );
}
