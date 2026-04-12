import React, { useEffect, useState } from 'react';
import { List, ChevronRight } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface DocTOCProps {
  content: any; // TipTap JSON
}

export function DocTOC({ content }: DocTOCProps) {
  const [items, setItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const headings: TOCItem[] = [];
    
    const extractHeadings = (nodes: any[]) => {
      if (!nodes) return;
      nodes.forEach((node) => {
        if (node.type === 'heading' && node.content) {
          const text = node.content.map((c: any) => c.text).join('');
          const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
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
    <div className="w-64 shrink-0 border-l border-slate-100 bg-slate-50/50 p-6 hidden xl:block">
      <div className="sticky top-24">
        <div className="flex items-center gap-2 mb-6 text-slate-400">
          <List size={14} />
          <span className="text-[11px] font-black uppercase tracking-widest">Mục lục</span>
        </div>
        
        <nav className="space-y-1">
          {items.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => scrollToHeading(item.id)}
              className={`group flex items-center w-full text-left py-1.5 px-2 rounded-lg transition-all hover:bg-white hover:shadow-sm ${
                item.level === 1 ? 'text-[13px] font-bold text-slate-700' : 'text-[12px] text-slate-500 pl-4'
              }`}
            >
              <ChevronRight 
                size={12} 
                className={`mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500 ${item.level > 1 ? 'hidden' : ''}`} 
              />
              <span className="truncate">{item.text}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
