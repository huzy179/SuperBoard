import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Sparkles, Languages, Type, Scissors, Loader2 } from 'lucide-react';
import { processText } from '../api/doc-service';
import { toast } from 'sonner';

interface RichTextEditorProps {
  docId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (content: any) => void;
  editable?: boolean;
  user?: {
    id: string;
    fullName: string;
    avatarColor?: string;
  };
}

export function RichTextEditor({ docId, content, onChange, editable = true, user }: RichTextEditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, show: false });
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ydoc = useMemo(() => new Y.Doc(), []);

  // Update selection for Bubble Menu
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
      toast.success('AI hoàn tất xử lý!');
    } catch (err) {
      toast.error('AI gặp lỗi, vui lòng thử lại.');
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
      token: localStorage.getItem('access_token') || '', // Standard JWT from our auth
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [docId, user, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'scroll-mt-20', // Add margin for sticky headers
          },
        },
      }),
      // Custom extension to add IDs to headings dynamically based on their content
      {
        name: 'heading-ids',
        addGlobalAttributes() {
          return [
            {
              types: ['heading'],
              attributes: {
                id: {
                  default: null,
                  renderHTML: (attributes) => {
                    // This is a simplified approach; in production, we'd sync this with the content
                    return {};
                  },
                },
              },
            },
          ];
        },
      },
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider as any,
        user: {
          name: user?.fullName || 'Anonymous',
          color: user?.avatarColor || '#6366f1',
        },
      }),
    ],
    content: provider ? undefined : content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] max-w-none',
      },
    },
  }, [provider]);

  useEffect(() => {
    if (editor && content && JSON.stringify(content) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="animate-pulse bg-slate-50 h-[500px] rounded-lg border border-slate-100" />
    );
  }

  return (
    <div className="relative">
      {/* Custom AI Bubble Menu */}
      {menuPos.show && editable && (
        <div
          ref={menuRef}
          className="fixed z-50 flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-indigo-500/20 glassmorphism animate-in zoom-in-95 duration-200"
          style={{
            top: `${menuPos.top}px`,
            left: `${menuPos.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {isAiProcessing ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-indigo-600">
              <Loader2 size={14} className="animate-spin" />
              <span>AI đang xử lý...</span>
            </div>
          ) : (
            <>
              <BubbleItem
                icon={<Sparkles size={14} />}
                label="Cải thiện"
                onClick={() => handleAiAction('improve')}
                className="text-indigo-600 hover:bg-indigo-50"
              />
              <BubbleItem
                icon={<Scissors size={14} />}
                label="Rút gọn"
                onClick={() => handleAiAction('shorten')}
                className="text-amber-600 hover:bg-amber-50"
              />
              <BubbleItem
                icon={<Type size={14} />}
                label="Tóm tắt"
                onClick={() => handleAiAction('summarize')}
                className="text-emerald-600 hover:bg-emerald-50"
              />
            </>
          )}
        </div>
      )}

      {editable && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white/80 py-2 px-4 backdrop-blur-sm mb-4">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            label="B"
            className="font-bold"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            label="I"
            className="italic font-serif"
          />
          <div className="w-px h-4 bg-slate-200 mx-1" />
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
            label="• List"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            label="1. List"
          />
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            label="Code"
          />
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors"
          >
            Undo
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors"
          >
            Redo
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
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
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold ${className}`}
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
  className = '',
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-[12px] font-bold transition-all ${
        active ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-100'
      } ${className}`}
    >
      {label}
    </button>
  );
}
