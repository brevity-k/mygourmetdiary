import type { Metadata } from 'next';
import { Cormorant, DM_Sans } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
      <body className={`${cormorant.variable} ${dmSans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
