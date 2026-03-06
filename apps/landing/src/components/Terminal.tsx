'use client';

export default function Terminal({
  title = 'terminal',
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border overflow-hidden bg-bg-raised shadow-[0_4px_40px_rgba(0,0,0,0.4)] ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg">
        <span className="w-2.5 h-2.5 rounded-full bg-red/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-mid/70" />
        <span className="ml-2 text-text-muted text-xs select-none">{title}</span>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 text-sm leading-relaxed font-light">{children}</div>
    </div>
  );
}
