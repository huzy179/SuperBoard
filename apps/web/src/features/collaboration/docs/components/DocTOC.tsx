import { useEffect, useState, useMemo } from 'react';
import { List } from 'lucide-react';

import { JSONContent } from '@tiptap/react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface DocTOCProps {
  content: JSONContent; // TipTap JSON
}

export function DocTOC({ content }: DocTOCProps) {
  const [items, setItems] = useState<TOCItem[]>([]);

  const headings = useMemo(() => {
    const extracted: TOCItem[] = [];
    const extractHeadings = (nodes: JSONContent[]) => {
      if (!nodes) return;
      nodes.forEach((node) => {
        if (node.type === 'heading' && node.content) {
          const text = node.content.map((c) => c.text).join('');
          const id = text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
          extracted.push({
            id,
            text,
            level: node.attrs?.level || 1,
          });
        }
        if (node.content) extractHeadings(node.content);
      });
    };

    if (content?.content) extractHeadings(content.content);
    return extracted;
  }, [content]);

  useEffect(() => {
    Promise.resolve().then(() => setItems(headings));
  }, [headings]);

  if (items.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="w-80 shrink-0 border-l border-surface-border bg-surface-card p-6 hidden xl:block">
      <div className="sticky top-24">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-500/15 flex items-center justify-center text-brand-500">
            <List size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">Table of contents</p>
            <p className="text-xs text-[color:var(--color-muted)]">{items.length} headings</p>
          </div>
        </div>

        <nav className="space-y-1">
          {items.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              type="button"
              onClick={() => scrollToHeading(item.id)}
              className={`w-full text-left rounded-md px-3 py-2 transition-colors hover:bg-black/[0.03] ${
                item.level === 1
                  ? 'text-sm font-medium text-[color:var(--color-ink)]'
                  : 'text-sm text-[color:var(--color-muted)] pl-6'
              }`}
              title={item.text}
            >
              <span className="truncate block">{item.text}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
