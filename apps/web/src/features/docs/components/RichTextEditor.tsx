'use client';

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Sparkles,
  Type,
  Scissors,
  Bold,
  Italic,
  List as ListIcon,
  Code,
  Command,
  Activity,
} from 'lucide-react';
import { processText } from '../api/doc-service';
import { toast } from 'sonner';

interface RichTextEditorProps {
  docId?: string;
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  editable?: boolean;
  user?:
    | {
        id: string;
        fullName: string;
        avatarColor?: string | undefined;
      }
    | undefined;
}

export function RichTextEditor({
  docId,
  content,
  onChange,
  editable = true,
  user,
}: RichTextEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, show: false });
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [icon, setIcon] = useState('📑');
  const [slashMenu, setSlashMenu] = useState({ show: false, top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const ydoc = useMemo(() => new Y.Doc(), []);

  useEffect(() => {
    if (!editor || !editable) return;

    const handleSelection = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setMenuPos((prev) => ({ ...prev, show: false }));
        return;
      }

      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      const top = Math.min(start.top, end.top) - 50;
      const left = (start.left + end.left) / 2;

      setMenuPos({ top: top + window.scrollY, left, show: true });
    };

    editor.on('selectionUpdate', handleSelection);
    return () => {
      editor.off('selectionUpdate', handleSelection);
    };
  }, [editable]);

  const handleAiAction = async (mode: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (!selectedText.trim()) return;

    setIsAiProcessing(true);
    try {
      const { result } = await processText(selectedText, mode);
      editor.chain().focus().insertContentAt({ from, to }, result).run();
      toast.success('Đã xử lý xong');
    } catch {
      toast.error('Lỗi xử lý');
    } finally {
      setIsAiProcessing(false);
      setMenuPos((prev) => ({ ...prev, show: false }));
    }
  };

  useEffect(() => {
    if (!docId || !user) return;

    const newProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:1234',
      name: docId,
      document: ydoc,
      token: localStorage.getItem('access_token') || '',
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [docId, user, ydoc]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
            HTMLAttributes: {
              class: 'scroll-mt-20 font-black tracking-tight text-white mb-6 uppercase',
            },
          },
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user?.fullName || 'Người dùng',
            color: user?.avatarColor || '#6366f1',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[],
      content: provider ? null : content,
      editable: editable,
      onUpdate: ({ editor }) => {
        onChange(editor.getJSON());

        const { selection } = editor.state;
        const isSlash = editor.state.doc.textBetween(selection.from - 1, selection.from) === '/';
        if (isSlash) {
          const { view } = editor;
          const coords = view.coordsAtPos(selection.from);
          setSlashMenu({ show: true, top: coords.top + window.scrollY + 20, left: coords.left });
        } else {
          setSlashMenu((prev) => ({ ...prev, show: false }));
        }
      },
      editorProps: {
        attributes: {
          class:
            'prose prose-invert max-w-none focus:outline-none min-h-[500px] prose-slate prose-headings:text-white prose-p:text-white/60 prose-strong:text-white prose-code:text-brand-400 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5',
        },
      },
    },
    [provider],
  );

  useEffect(() => {
    if (editor && content && JSON.stringify(content) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="animate-pulse bg-white/[0.02] h-[500px] rounded-[2.5rem] border border-white/5" />
    );
  }

  return (
    <div className="relative">
      {/* Custom AI Bubble Menu */}
      {menuPos.show && editable && (
        <div
          ref={menuRef}
          className="fixed z-50 flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
          style={{
            top: `${menuPos.top}px`,
            left: `${menuPos.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {isAiProcessing ? (
            <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-brand-400 uppercase tracking-widest">
              <Activity size={14} className="animate-spin" />
              <span>Synthesizing...</span>
            </div>
          ) : (
            <>
              <BubbleItem
                icon={<Sparkles size={14} />}
                label="Cải thiện"
                onClick={() => handleAiAction('improve')}
                className="text-brand-400 hover:bg-brand-500/10"
              />
              <BubbleItem
                icon={<Scissors size={14} />}
                label="Rút gọn"
                onClick={() => handleAiAction('shorten')}
                className="text-amber-400 hover:bg-amber-500/10"
              />
              <BubbleItem
                icon={<Type size={14} />}
                label="Tóm tắt"
                onClick={() => handleAiAction('summarize')}
                className="text-emerald-400 hover:bg-emerald-500/10"
              />
            </>
          )}
        </div>
      )}

      {/* Slash Command Menu */}
      {slashMenu.show && editable && (
        <div
          className="fixed z-50 w-72 bg-slate-950/90 border border-white/10 rounded-[2rem] shadow-2xl p-3 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-2xl"
          style={{ top: `${slashMenu.top}px`, left: `${slashMenu.left}px` }}
        >
          <div className="px-4 py-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] border-b border-white/5 mb-2">
            LỆNH AI
          </div>
          <SlashMenuItem
            icon={<Sparkles size={14} className="text-brand-400" />}
            title="Tiếp tục viết"
            desc="AI sẽ hoàn thành đoạn văn"
            onClick={() => handleAiAction('improve')}
          />
          <SlashMenuItem
            icon={<Type size={14} className="text-emerald-400" />}
            title="Trích xuất từ khóa"
            desc="Lấy các ý chính"
            onClick={() => handleAiAction('summarize')}
          />
          <SlashMenuItem
            icon={<Scissors size={14} className="text-amber-400" />}
            title="Rút gọn nội dung"
            desc="Tối ưu độ dài"
            onClick={() => handleAiAction('shorten')}
          />
        </div>
      )}

      {editable && (
        <div className="sticky top-20 z-40 flex flex-wrap items-center gap-1.5 border border-white/5 bg-slate-900/60 p-2.5 backdrop-blur-xl mb-12 shadow-2xl rounded-2xl">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            icon={<Bold size={16} />}
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            icon={<Italic size={16} />}
          />
          <div className="w-px h-6 bg-white/5 mx-2" />
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            label="H1"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            label="H2"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            icon={<ListIcon size={16} />}
          />
          <div className="w-px h-6 bg-white/5 mx-2" />
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            icon={<Code size={16} />}
          />
          <div className="flex-1" />
          <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-black text-[9px] uppercase tracking-widest">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-glow-emerald"></span>
            </div>
            Kết nối AI đang hoạt động
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto pb-48 flex gap-12">
        <div className="flex-1 min-w-0">
          {/* Notion-style Header */}
          <div className="relative group mb-20">
            {/* Cover Image */}
            <div className="h-64 md:h-80 w-full rounded-[3rem] overflow-hidden relative border border-white/5 mb-[-5rem] shadow-glass group/cover bg-gradient-to-br from-brand-500/20 via-slate-900/90 to-slate-950">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>

            <div className="px-12 relative z-10 flex items-end gap-8">
              {/* Icon */}
              <div
                onClick={() => {
                  const ICONS = ['📑', '💾', '🛡️', '⚡', '📊', '🏛️', '🎯'] as const;
                  const currentIcon = icon as (typeof ICONS)[number];
                  const nextIcon = ICONS[(ICONS.indexOf(currentIcon) + 1) % ICONS.length]!;
                  setIcon(nextIcon);
                }}
                className="w-32 h-32 bg-slate-900 rounded-[2.5rem] shadow-glow-brand/5 flex items-center justify-center text-6xl border border-white/10 transform transition hover:scale-110 cursor-pointer active:scale-95 group/icon"
              >
                <span className="group-hover/icon:scale-110 transition-transform">{icon}</span>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  <Command size={12} />
                  <span>Tài liệu</span>
                  <span>/</span>
                  <span className="text-brand-500/60 font-mono">ID_{docId?.substring(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-12">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BubbleItem({
  icon,
  label,
  onClick,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MenuButton({
  onClick,
  active,
  label,
  icon,
  className = '',
}: {
  onClick: () => void;
  active: boolean;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-11 flex items-center justify-center rounded-xl transition-all font-black text-[11px] border ${
        active
          ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
          : 'text-white/30 border-transparent hover:bg-white/5 hover:text-white'
      } ${label ? 'px-4' : 'w-11'} ${className}`}
    >
      {icon || label}
    </button>
  );
}

function SlashMenuItem({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 hover:bg-white/[0.03] rounded-2xl transition-all group text-left border border-transparent hover:border-white/5"
    >
      <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:bg-brand-500/10 group-hover:border-brand-500/20 transition-all">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-black text-white uppercase tracking-wider group-hover:text-brand-400 transition-colors">
          {title}
        </div>
        <div className="text-[10px] text-white/20 group-hover:text-white/40 truncate font-medium">
          {desc}
        </div>
      </div>
    </button>
  );
}
