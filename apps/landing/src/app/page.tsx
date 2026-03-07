'use client';

import Section from '@/components/Section';
import Terminal from '@/components/Terminal';
import Cursor from '@/components/Cursor';

/* -- Shared helpers -------------------------------------------------------- */

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

function Logo() {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      <span
        className="text-4xl sm:text-5xl md:text-6xl font-bold text-red"
        style={{ textShadow: '0 0 12px rgba(239,68,68,0.5)' }}
      >
        //
      </span>
      <span
        className="text-4xl sm:text-5xl md:text-6xl font-bold text-green"
        style={{ textShadow: '0 0 20px rgba(57,255,20,0.3), 0 0 40px rgba(57,255,20,0.1)' }}
      >
        TimeToRelax
      </span>
    </div>
  );
}

/* -- Page ------------------------------------------------------------------ */

export default function Home() {
  return (
    <main className="relative">
      {/* 1. HERO */}
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
          <Logo />

          <p
            className="text-text-dim text-sm tracking-[0.4em] uppercase font-normal mb-14 md:mb-20 opacity-0"
            style={{ animation: 'fadeIn 0.8s ease-out 0.3s forwards' }}
          >
            SendHelpItsTerminal
          </p>

          {[
            'You could be present.',
            "Instead you're whispering code to your phone on a packed bus.",
          ].map((line, i) => (
            <p
              key={i}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-text-bright leading-relaxed opacity-0"
              style={{
                animation: 'fadeUp 0.7s ease-out forwards',
                animationDelay: `${0.6 + i * 0.25}s`,
              }}
            >
              {line}
            </p>
          ))}

          <div className="h-6 md:h-8" />

          <p
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-text-bright leading-relaxed opacity-0"
            style={{ animation: 'fadeUp 0.7s ease-out forwards', animationDelay: '1.3s' }}
          >
            We built the app for exactly that.
          </p>
          <p
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-text-bright leading-relaxed opacity-0"
            style={{ animation: 'fadeUp 0.7s ease-out forwards', animationDelay: '1.55s' }}
          >
            Sorry not sorry.
            <Cursor />
          </p>

          <div
            className="mt-10 md:mt-14 opacity-0"
            style={{ animation: 'fadeIn 0.8s ease-out 2.1s forwards' }}
          >
            <p className="text-text-dim text-base mb-6">
              Voice-first coding. No laptop. No peace.
            </p>
            <p className="text-text text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Hold button &rarr; talk feature &rarr; AI builds it &rarr; preview on phone &rarr; one-tap ship.
              <br />
              All while missing your stop.
            </p>
          </div>

          <div
            className="mt-10 md:mt-14 opacity-0"
            style={{ animation: 'fadeIn 0.8s ease-out 2.6s forwards' }}
          >
            <CTA>Start shipping from inappropriate locations</CTA>
          </div>
        </div>

        <div
          className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 text-text-muted text-xs tracking-[0.3em] uppercase opacity-0"
          style={{ animation: 'fadeIn 1s ease-out 3.2s forwards' }}
        >
          <span style={{ animation: 'scroll-hint 2.5s ease-in-out infinite' }} className="inline-block">
            scroll
          </span>
        </div>
      </Section>

      <Divider color="via-green/20" />

      {/* 2. CORPORATE BUZZWORD ROAST */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// what we'd say if we had a marketing team`}</SectionLabel>

          <div className="space-y-10 md:space-y-14">
            {[
              ['Enterprise-grade', 'Zero investors. Zero tests. Mass-transit psychosis.'],
              ['Seamless integration', 'Button. Talk. Your problem if it fails.'],
              ['Game-changing AI', 'Claude, disappointed father voice included.'],
              ['Revolutionary', 'Toilet to ship. Technical debt factory. Congrats.'],
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

      {/* 3. WHAT HAPPENS IN 30 SECONDS */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// what happens in 30 seconds`}</SectionLabel>

          <Terminal title="how-it-works.sh">
            <div className="space-y-8 md:space-y-12">
              {[
                { n: '01', title: 'You talk.', body: 'Bus accent? Deepgram eats it.' },
                { n: '02', title: 'Claude Agent codes it.', body: 'Your Anthropic key, cloud sandbox.' },
                { n: '03', title: 'See diff + live preview.', body: 'On your screen. Right now.' },
                { n: '04', title: 'Ship.', body: 'PR created. Nobody knows you were in the toilet.' },
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

      {/* 4. SIDE EFFECTS */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel color="text-amber">{`! side effects`}</SectionLabel>

          <div className="space-y-5 md:space-y-6">
            {[
              'Force-pushing to main during couples therapy',
              'Therapist calls it "terminal productivity"',
              'Driver knows your repo name better than your mom',
              '"Just one more commit" becomes your love language',
              'Explaining pole bruises in A&E: "diff review incident"',
              'Your dog thinks "good boy" means merge conflict fixed',
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
            <p className="text-base text-text-dim">Compatible with: insomnia, public transit, bad decisions.</p>
            <p className="text-base text-text-dim">Not compatible with: relationships, hobbies, mental health.</p>
          </div>

          <div className="mt-8 md:mt-10">
            <CTA ghost>Enable your worst impulses</CTA>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 5. WHILE YOU'RE... */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>{`// while you're...`}</SectionLabel>

          <div className="space-y-14 md:space-y-20">
            {[
              {
                title: 'On the bus:',
                command: '"Add dark mode."',
                result: 'Pushed before your stop.',
              },
              {
                title: 'Walking dog:',
                command: '"Refactor auth."',
                result: "Dog still doesn't care.",
              },
              {
                title: 'In a queue:',
                command: '"Scaffold Next + Stripe."',
                result: "Person behind thinks you're on a call. You're deploying prod.",
              },
              {
                title: 'At dinner:',
                command: '"Add webhook."',
                result: 'No second date. Payments work though.',
              },
            ].map((scenario, i) => (
              <div key={i} className="text-center">
                <p className="text-cyan font-medium text-lg md:text-xl mb-4">{scenario.title}</p>
                <p className="text-green text-base md:text-lg mb-4 font-medium">{scenario.command}</p>
                <p className="text-text text-base md:text-lg leading-relaxed">{scenario.result}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Divider color="via-red/15" />

      {/* 6. BURNOUT STAT */}
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
              of devs burned out in 2024.
            </p>
          </div>

          <div className="space-y-6 md:space-y-8 max-w-xl mx-auto">
            <div className="space-y-2 text-lg text-text">
              <p>We built this because we&apos;re in the 68%.</p>
              <p>This is our coping mechanism.</p>
              <p
                className="text-amber text-xl md:text-2xl font-medium mt-4"
                style={{ textShadow: '0 0 30px rgba(245,158,11,0.15)' }}
              >
                You&apos;re reading this. You&apos;re in too.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Divider color="via-purple/15" />

      {/* 7. WALL OF SHAME */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel color="text-purple">{`// wall of shame`}</SectionLabel>

          <div className="space-y-12 md:space-y-16">
            {[
              {
                quote: "Deployed hotfix from daughter's dance recital. She'll understand. Or won't.",
                who: '@anon, Row 4',
              },
              {
                quote: 'Girlfriend left. Thought I was cheating at 2am. I was refactoring.',
                who: '@anon, Alone now',
              },
              {
                quote: 'Wrote CRUD while wife in labor. Early labor. Clean API.',
                who: '@anon, Maternity ward',
              },
              {
                quote: "Used it at a funeral. Grandma would've approved. She was a workaholic too.",
                who: '@anon, Back pew',
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
            #btwIShippedThisFromMyToilet
          </p>
        </div>
      </Section>

      <Divider />

      {/* 8. DO NOT DOWNLOAD IF */}
      <Section className="px-6 py-20 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel color="text-red">{`! do NOT download if`}</SectionLabel>

          <div className="space-y-4 md:space-y-5">
            {[
              'You log off at 18:00 like a normal person',
              'Weekends \u2260 tailwind.config.js',
              'You\'ve never begged git "please work"',
              "Public transport doesn't make you mentally refactor",
              'You can ride a bus without whispering "just one more commit"',
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
            <p className="text-text-dim text-lg">None of that? Welcome. You&apos;re one of us.</p>
          </div>
        </div>
      </Section>

      <Divider color="via-green/20" />

      {/* 9. FINAL CTA */}
      <Section className="px-6 py-28 md:py-40 lg:py-52">
        <div className="max-w-xl mx-auto text-center relative">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(57,255,20,0.04) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <p
              className="text-green text-2xl md:text-3xl lg:text-4xl font-medium mb-12 md:mb-16"
              style={{ textShadow: '0 0 40px rgba(57,255,20,0.2)' }}
            >
              Ship stupid shit before the feeling passes.
            </p>

            <CTA>SendHelpItsTerminal</CTA>

            <p className="mt-8 text-text-dim text-base">
              Free. Bring your Anthropic key + your impending divorce.
            </p>
            <p className="mt-3 text-text-muted text-base">
              Android now. iOS soon.
            </p>
          </div>
        </div>
      </Section>

      {/* 10. FOOTER */}
      <footer className="border-t border-border px-6 py-14 md:py-20 text-center">
        <div className="flex items-center justify-center gap-1 mb-4">
          <span className="text-red font-bold text-lg" style={{ textShadow: '0 0 8px rgba(239,68,68,0.4)' }}>//</span>
          <span className="text-green font-bold text-lg" style={{ textShadow: '0 0 12px rgba(57,255,20,0.2)' }}>TimeToRelax</span>
        </div>
        <p className="text-text-dim text-base">Dublin, 2026</p>
        <p className="text-text-dim text-sm mt-3 tracking-[0.3em] uppercase font-normal">
          #SendHelpItsTerminal
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
      </footer>
    </main>
  );
}
