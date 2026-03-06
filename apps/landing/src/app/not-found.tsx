import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-[96px] font-bold leading-none text-[var(--color-green)] [text-shadow:0_0_20px_rgba(57,255,20,0.3),0_0_60px_rgba(57,255,20,0.08)] tracking-tighter">
          404
        </div>
        <div className="mt-6 space-y-4 text-sm">
          <p className="text-[var(--color-text-bright)]">
            Unlike your will to live, this page actually ceased to exist.
          </p>
          <p className="text-[var(--color-text-dim)]">
            Your side projects are still 404ing in prod though.
            <br />
            Those are forever.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block mt-10 text-[var(--color-green-mid)] border border-[rgba(34,197,94,0.2)] px-9 py-3 text-xs hover:border-[var(--color-green-mid)] hover:bg-[rgba(34,197,94,0.05)] hover:shadow-[0_0_20px_rgba(34,197,94,0.08)] transition-all"
        >
          Go back to making bad decisions &rarr;
        </Link>
      </div>
    </div>
  );
}
