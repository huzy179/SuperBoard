import type { ReactNode } from 'react';
import { AppBrand } from './app-brand';

type PublicShellProps = {
  children: ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      {/* Immersive Aura Backdrop */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[150px] rounded-full animate-pulse delay-1000" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-violet-500/10 blur-[120px] rounded-full animate-pulse delay-500" />

        {/* Physical Noise Texture Proxy */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-transparent backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-8 py-5">
          <AppBrand subtitle="AURA GATEWAY" variant="dark" />
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
            <p className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
              Secure Terminal
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-8">{children}</main>

      <footer className="relative z-10 border-t border-white/5 bg-transparent backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2.5 px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">
          <p>SuperBoard Intelligence Engine</p>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} IDENTITY PORTAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
