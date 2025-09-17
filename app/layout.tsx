import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { UserMenu } from '@/app/product/UserMenu';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { StoreUser } from '@/components/StoreUser';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sprocket',
  description: 'AI app designed for robotics development',
  icons: {
    icon: '/convex.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('sprocket-theme') === 'dark' ||
                    (!localStorage.getItem('sprocket-theme') &&
                     window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ConvexClientProvider>
            <StoreUser />
            <>
              <header className="fixed top-0 flex h-16 w-full shrink items-center justify-end gap-2 px-4">
                <ThemeToggle />
                <UserMenu />
              </header>
              <main>{children}</main>
            </>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
