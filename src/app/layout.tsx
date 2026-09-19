import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knightsweeper: Chess Knight vs Mined Battlefield',
  description:
    'Chess movement meets Minesweeper deduction. Navigate your knight across a mined battlefield to capture the enemy King.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
