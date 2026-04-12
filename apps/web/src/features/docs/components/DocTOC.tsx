import React, { useEffect, useState } from 'react';
import { List, Activity, Zap } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface DocTOCProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any; // TipTap JSON
}

export function DocTOC({ content }: DocTOCProps) {
  const [items, setItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const headings: TOCItem[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractHeadings = (nodes: any[]) => {
      if (!nodes) return;
      nodes.forEach((node) => {
        if (node.type === 'heading' && node.content) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = node.content.map((c: any) => c.text).join('');
          const id = text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
          headings.push({
            id,
            text,
            level: node.attrs?.level || 1,
          });
        }
        if (node.content) {
          extractHeadings(node.content);
        }
      });
    };

    if (content?.content) {
      extractHeadings(content.content);
    }
    setItems(headings);
  }, [content]);

  if (items.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-80 shrink-0 border-l border-white/5 bg-slate-950/20 p-10 hidden xl:block relative group/toc">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/[0.01] to-transparent pointer-events-none" />

      <div className="sticky top-32">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <List size={14} className="text-brand-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Archive_Map
            </span>
          </div>
          <Activity size={12} className="text-white/10 animate-pulse" />
        </div>

        <nav className="space-y-2">
          {items.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => scrollToHeading(item.id)}
              className={`group flex items-center w-full text-left py-2.5 px-4 rounded-xl transition-all border border-transparent hover:border-white/5 hover:bg-white/[0.02] ${
                item.level === 1
                  ? 'text-[13px] font-black text-white/80'
                  : 'text-[12px] text-white/30 pl-8'
              }`}
            >
              <div
                className={`mr-3 flex items-center justify-center transition-all ${item.level > 1 ? 'hidden' : ''}`}
              >
                <Zap
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-all text-brand-500 -translate-x-2 group-hover:translate-x-0"
                />
              </div>
              <span className="truncate uppercase tracking-wider group-hover:text-white transition-colors">
                {item.text}
              </span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all text-[8px] font-bold text-white/10 font-mono">
                0{idx + 1}
              </div>
            </button>
          ))}
        </nav>

        {/* Tactical Metadata */}
        <div className="mt-12 p-5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-3">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
            <span>Nodes_Indexed</span>
            <span className="text-brand-500">{items.length}</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500/40 w-3/4 rounded-full" />
          </div>
          <p className="text-[8px] font-black text-white/10 uppercase tracking-widest">
            Archive_Integrity_Verified
          </p>
        </div>
      </div>
    </div>
  );
}
