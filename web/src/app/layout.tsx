import type { Metadata } from 'next';
import { Cormorant, DM_Sans } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const cormorant = Cormorant({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MyGourmetDiary',
  description: 'Your personal gourmet journal — restaurants, wines, and spirits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
