import type { Metadata } from 'next';
import { DM_Sans, Manrope } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] });
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://recall-study-quiz.miamiranda50.chatgpt.site'),
  title: 'Recall — Turn your notes into a quiz',
  description: 'Create a focused study quiz from your own notes.',
  openGraph: {
    title: 'Recall — Turn your notes into a quiz',
    description: 'Create a focused study quiz from your own notes.',
    images: [{ url: '/og.png', width: 1792, height: 1024, alt: 'Recall — Turn your notes into a quiz' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recall — Turn your notes into a quiz',
    description: 'Create a focused study quiz from your own notes.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${manrope.variable} antialiased`}>{children}</body></html>;
}
