// Tailwind config. NativeWind translates these classes into
// something React Native can digest without having an existential crisis.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // The TimeToRelax palette. Dark terminal vibes.
        abyss: '#06060a',
        'toxic-green': '#39ff14',
        'terminal-text': '#dddde5',
        'terminal-dim': '#88889a',
        'danger-red': '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrainsMono', 'monospace'],
      },
    },
  },
  plugins: [],
};
