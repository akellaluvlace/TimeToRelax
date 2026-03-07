import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: '// TimeToRelax',
  description:
    'Voice-first coding agent for your phone. No laptop. No keyboard. No peace. Ship from the bus.',
  metadataBase: new URL('https://timetorelax.app'),
  openGraph: {
    title: '// TimeToRelax',
    description: 'You could be present. Instead you\'re whispering code to your phone on a packed bus.',
    url: 'https://timetorelax.app',
    siteName: '// TimeToRelax',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '// TimeToRelax',
    description: 'Voice-first coding from your phone. No laptop. No peace.',
  },
  other: {
    'theme-color': '#06060a',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} font-mono antialiased`}>{children}</body>
    </html>
  );
}
