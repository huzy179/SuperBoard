import type { ReactNode } from 'react';
import './globals.css';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-950 text-slate-50 selection:bg-brand-500/30 selection:text-white">
        {children}
        <Toaster
          position="top-center"
          expand={false}
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(2, 6, 23, 0.8)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              padding: '16px 24px',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(37, 99, 235, 0.05)',
              fontSize: '12px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'inherit',
            },
            className: 'shadow-glass',
          }}
        />
      </body>
    </html>
  );
}
