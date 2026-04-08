'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (content: any) => void;
  editable?: boolean;
}

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: content,
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
  });

  // Sync content from props if it changes externally
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
