import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WeFix Invoice Builder',
  description: 'Professional invoice generation for WEFIX HANDYMAN',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
