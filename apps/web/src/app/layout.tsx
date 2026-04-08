import type { ReactNode } from 'react';
import './globals.css';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'inherit',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
