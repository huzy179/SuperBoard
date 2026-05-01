import type { ReactNode } from 'react';
import './globals.css';
import { Sora, Hanken_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${sora.variable} ${hanken.variable}`}>
      <body className="min-h-screen bg-surface-bg font-sans antialiased selection:bg-brand-500/15 selection:text-[color:var(--color-ink)]">
        {children}
        <Toaster
          position="top-center"
          expand={false}
          richColors
          closeButton
          theme="light"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.98)',
              border: '1px solid rgba(0,0,0,0.10)',
              borderRadius: '10px',
              padding: '10px 14px',
              boxShadow:
                'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.84688px, rgba(0,0,0,0.02) 0px 0.8px 2.925px, rgba(0,0,0,0.01) 0px 0.175px 1.04062px',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0',
              fontFamily: 'var(--font-sans)',
            },
            className: '',
          }}
        />
      </body>
    </html>
  );
}
