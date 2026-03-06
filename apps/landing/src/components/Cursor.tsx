'use client';

/**
 * Blinking terminal cursor.
 * Renders an inline block that blinks via the CSS keyframe defined in globals.css.
 */
export default function Cursor({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block w-[0.55em] h-[1.1em] bg-green align-middle ml-0.5 ${className}`}
      style={{ animation: 'blink 1s step-end infinite' }}
      aria-hidden="true"
    />
  );
}
