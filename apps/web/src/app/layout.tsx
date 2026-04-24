import type { ReactNode } from 'react';
import './globals.css';
import { Sora, Hanken_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';

const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sora',
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-hanken',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${sora.variable} ${hanken.variable}`}>
      <body className="min-h-screen bg-surface-bg font-sans text-slate-200 antialiased selection:bg-brand-500/20 selection:text-white">
        {children}
        <Toaster
          position="top-center"
          expand={false}
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'oklch(0.16 0.01 260 / 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid oklch(1 0 0 / 0.05)',
              borderRadius: '12px',
              padding: '12px 20px',
              boxShadow: 'var(--shadow-glass)',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-sora)',
            },
            className: 'shadow-glass',
          }}
        />
      </body>
    </html>
  );
}
