import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { StoreUser } from '@/components/StoreUser';
import { ThemeIndicator } from '@/components/ThemeIndicator';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UserMenu } from '@/components/UserMenu';

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
            <div className="flex min-h-screen w-full flex-col">
              <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  <h1 className="text-lg font-semibold">Sprocket</h1>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeIndicator />
                  <UserMenu />
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
