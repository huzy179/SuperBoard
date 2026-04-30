'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Code,
  Bold,
  Italic,
  Activity,
  Sparkles,
  Type,
  Scissors,
  List as ListIcon,
  Command,
  FileBox,
  Search,
  Box,
} from 'lucide-react';
import { processText } from '../api/doc-service';
import { DocPropertyBar } from './DocPropertyBar';
import { TaskNodeEmbed } from './TaskNodeEmbed';
import { JiraTask } from '@/features/jira/components/JiraTaskExtension';
import { toast } from 'sonner';
import { useSearch } from '@/features/system/search/hooks/use-search';

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
  const [slashMenu, setSlashMenu] = useState<{
    show: boolean;
    top: number;
    left: number;
    mode: 'default' | 'task_search';
  }>({ show: false, top: 0, left: 0, mode: 'default' });
  const [taskQuery, setTaskQuery] = useState('');
  const { data: searchResults, isLoading: isSearching } = useSearch(taskQuery);
  const menuRef = useRef<HTMLDivElement>(null);

  const ydoc = useMemo(() => new Y.Doc(), []);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
            HTMLAttributes: {
              class: 'scroll-mt-24 font-semibold tracking-tight text-[color:var(--color-ink)] mb-4',
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
        }),
        JiraTask,
      ],
      content: provider ? null : content,
      editable: editable,
      onUpdate: ({ editor }) => {
        onChange(editor.getJSON());

        const { selection } = editor.state;
        const isSlash = editor.state.doc.textBetween(selection.from - 1, selection.from) === '/';
        if (isSlash) {
          const { view } = editor;
          const coords = view.coordsAtPos(selection.from);
          setSlashMenu({
            show: true,
            top: coords.top + window.scrollY + 20,
            left: coords.left,
            mode: 'default',
          });
        } else if (!slashMenu.show) {
          // Do nothing if not already showing
        } else {
          // Close if not slash and not in search mode
          if (slashMenu.mode === 'default') {
            setSlashMenu((prev) => ({ ...prev, show: false }));
          }
        }
      },
      editorProps: {
        attributes: {
          class:
            'prose prose-slate max-w-none focus:outline-none min-h-[500px] prose-headings:text-[color:var(--color-ink)] prose-p:text-[color:var(--color-ink)] prose-strong:text-[color:var(--color-ink)] prose-a:text-brand-500 prose-code:text-emerald-700 prose-pre:bg-[color:var(--color-surface-alt)] prose-pre:border prose-pre:border-surface-border',
        },
      },
    },
    [provider],
  );

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
  }, [editable, editor]);

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
      // Error handled by hook
    } finally {
      setIsAiProcessing(false);
      setMenuPos((prev) => ({ ...prev, show: false }));
    }
  };

  const handleTemplateInject = (type: 'briefing' | 'rfc') => {
    if (!editor) return;
    const items =
      type === 'briefing'
        ? '<h1>MISSION BRIEFING</h1><p>Operation status: Active</p><ul><li>Target Objectives</li><li>Tactical Constraints</li></ul>'
        : '<h1>STRATEGIC RFC</h1><p>Proposed by: Analysis Node</p><blockquote>Core Hypothesis</blockquote>';

    editor.chain().focus().insertContent(items).run();
    setSlashMenu((prev) => ({ ...prev, show: false }));
    toast.success(`Đã tiêm mẫu ${type.toUpperCase()}`);
  };

  useEffect(() => {
    if (!docId || !user) return;

    const newProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:1234',
      name: docId,
      document: ydoc,
      token: localStorage.getItem('access_token') || '',
    });

    Promise.resolve().then(() => setProvider(newProvider));

    return () => {
      newProvider.destroy();
    };
  }, [docId, user, ydoc]);

  useEffect(() => {
    if (editor && content && JSON.stringify(content) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="animate-pulse bg-black/[0.03] h-[500px] rounded-md border border-surface-border" />
    );
  }

  return (
    <div className="relative">
      {/* Custom AI Bubble Menu */}
      {menuPos.show && editable && (
        <div
          ref={menuRef}
          className="fixed z-50 flex items-center gap-1 p-1 bg-surface-card border border-surface-border rounded-sm shadow-glass"
          style={{
            top: `${menuPos.top}px`,
            left: `${menuPos.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {isAiProcessing ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)]">
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
          className="fixed z-50 w-64 bg-surface-card border border-surface-border rounded-md shadow-glass p-2"
          style={{ top: `${slashMenu.top}px`, left: `${slashMenu.left}px` }}
        >
          <div className="px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] border-b border-surface-border mb-2">
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
          <div className="px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] border-t border-surface-border my-2">
            ĐỊNH DẠNG CƠ BẢN
          </div>
          <SlashMenuItem
            icon={<Type size={14} className="text-[color:var(--color-ink)]" />}
            title="Tiêu đề 1"
            desc="Tiêu đề chính cỡ lớn"
            onClick={() => {
              editor
                .chain()
                .focus()
                .deleteRange({
                  from: editor.state.selection.from - 1,
                  to: editor.state.selection.from,
                })
                .toggleHeading({ level: 1 })
                .run();
              setSlashMenu((prev) => ({ ...prev, show: false }));
            }}
          />
          <SlashMenuItem
            icon={<Type size={12} className="text-[color:var(--color-muted)]" />}
            title="Tiêu đề 2"
            desc="Tiêu đề phụ cỡ vừa"
            onClick={() => {
              editor
                .chain()
                .focus()
                .deleteRange({
                  from: editor.state.selection.from - 1,
                  to: editor.state.selection.from,
                })
                .toggleHeading({ level: 2 })
                .run();
              setSlashMenu((prev) => ({ ...prev, show: false }));
            }}
          />
          <SlashMenuItem
            icon={<ListIcon size={14} className="text-[color:var(--color-muted)]" />}
            title="Danh sách dấu chấm"
            desc="Tạo danh sách liệt kê"
            onClick={() => {
              editor
                .chain()
                .focus()
                .deleteRange({
                  from: editor.state.selection.from - 1,
                  to: editor.state.selection.from,
                })
                .toggleBulletList()
                .run();
              setSlashMenu((prev) => ({ ...prev, show: false }));
            }}
          />
          <SlashMenuItem
            icon={<Code size={14} className="text-emerald-400" />}
            title="Khối mã (Code)"
            desc="Viết code có highlight"
            onClick={() => {
              editor
                .chain()
                .focus()
                .deleteRange({
                  from: editor.state.selection.from - 1,
                  to: editor.state.selection.from,
                })
                .toggleCodeBlock()
                .run();
              setSlashMenu((prev) => ({ ...prev, show: false }));
            }}
          />
          <div className="px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] border-t border-surface-border my-2">
            MẪU TÀI LIỆU
          </div>
          <SlashMenuItem
            icon={<FileBox size={14} className="text-brand-400" />}
            title="Mission Briefing"
            desc="Mẫu báo cáo nhiệm vụ"
            onClick={() => {
              editor
                .chain()
                .focus()
                .deleteRange({
                  from: editor.state.selection.from - 1,
                  to: editor.state.selection.from,
                })
                .run();
              handleTemplateInject('briefing');
            }}
          />
          <SlashMenuItem
            icon={<Activity size={14} className="text-emerald-400" />}
            title="Strategic RFC"
            desc="Mẫu đề xuất kỹ thuật"
            onClick={() => {
              editor
                .chain()
                .focus()
                .deleteRange({
                  from: editor.state.selection.from - 1,
                  to: editor.state.selection.from,
                })
                .run();
              handleTemplateInject('rfc');
            }}
          />

          <div className="px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] border-t border-surface-border my-2">
            CROSS-PLATFORM
          </div>
          <SlashMenuItem
            icon={<Box size={14} className="text-brand-400" />}
            title="Jira Task"
            desc="Nhúng công việc từ Jira"
            onClick={() => {
              setSlashMenu((prev) => ({ ...prev, mode: 'task_search' }));
            }}
          />
        </div>
      )}

      {/* Task Search Mode */}
      {slashMenu.show && slashMenu.mode === 'task_search' && (
        <div
          className="fixed z-50 w-72 bg-surface-card border border-surface-border rounded-md shadow-glass p-4 overflow-hidden"
          style={{ top: `${slashMenu.top}px`, left: `${slashMenu.left}px` }}
        >
          <div className="flex items-center gap-3 mb-4 px-2">
            <Search size={16} className="text-brand-400" />
            <input
              autoFocus
              value={taskQuery}
              onChange={(e) => setTaskQuery(e.target.value)}
              placeholder="Search Jira Tasks..."
              className="bg-transparent border-none outline-none text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)] w-full"
            />
          </div>

          <div className="max-h-64 overflow-y-auto elite-scrollbar space-y-1">
            {isSearching && (
              <div className="py-8 text-center">
                <Activity size={20} className="animate-spin text-brand-500 mx-auto mb-2" />
                <span className="text-xs font-semibold text-[color:var(--color-muted)]">
                  Searching…
                </span>
              </div>
            )}

            {searchResults?.tasks?.map((task) => (
              <button
                key={task.id}
                onClick={async () => {
                  const e: any = editor;
                  e.chain()
                    .focus()
                    .deleteRange({
                      from: editor.state.selection.from - 1,
                      to: editor.state.selection.from,
                    })
                    .setJiraTask({
                      taskId: `${task.projectName?.substring(0, 3).toUpperCase()}-${task.number}`,
                      title: task.title,
                      status: task.status,
                      assignee: task.assigneeName || 'Unassigned',
                    })
                    .run();
                  setSlashMenu((prev) => ({ ...prev, show: false, mode: 'default' }));
                  setTaskQuery('');
                }}
                className="w-full p-[var(--space-3)] hover:bg-black/[0.03] rounded-sm transition-colors text-left border border-transparent"
              >
                <div className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                  {task.title}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[color:var(--color-muted)] font-mono">
                    {task.projectName?.substring(0, 3)}-{task.number}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-surface-border" />
                  <span className="text-xs text-[color:var(--color-faint)]">{task.status}</span>
                </div>
              </button>
            ))}

            {!isSearching && (!searchResults?.tasks || searchResults.tasks.length === 0) && (
              <div className="py-8 text-center text-sm text-[color:var(--color-faint)]">
                No tactical matches
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between px-2">
            <button
              onClick={() => setSlashMenu((prev) => ({ ...prev, mode: 'default' }))}
              className="text-xs font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
            >
              Back
            </button>
            <span className="text-xs font-semibold text-[color:var(--color-faint)]">
              Neural Sync Active
            </span>
          </div>
        </div>
      )}

      {editable && (
        <div className="sticky top-20 z-40 flex flex-wrap items-center gap-1 border border-surface-border bg-surface-card p-2 mb-[var(--space-12)] shadow-luxe rounded-md">
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
          <div className="w-px h-6 bg-surface-border mx-2" />
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
          <div className="w-px h-6 bg-surface-border mx-2" />
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            icon={<Code size={16} />}
          />
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-700 font-semibold text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            AI active
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto pb-48 flex gap-12">
        <div className="flex-1 min-w-0">
          {/* Notion-style Header */}
          <div className="relative group mb-20">
            {/* Cover Image */}
            <div className="h-48 md:h-56 w-full rounded-md overflow-hidden relative border border-surface-border mb-[-3rem] shadow-luxe bg-[color:var(--color-surface-alt)]" />

            <div className="px-12 relative z-10 flex items-end gap-8">
              {/* Icon */}
              <div
                onClick={() => {
                  const ICONS = ['📑', '💾', '🛡️', '⚡', '📊', '🏛️', '🎯'] as const;
                  const currentIcon = icon as (typeof ICONS)[number];
                  const nextIcon = ICONS[(ICONS.indexOf(currentIcon) + 1) % ICONS.length]!;
                  setIcon(nextIcon);
                }}
                className="w-24 h-24 bg-surface-card rounded-sm shadow-luxe flex items-center justify-center text-5xl border border-surface-border transition-colors hover:bg-black/[0.02] cursor-pointer active:scale-[0.98] group/icon"
              >
                <span className="group-hover/icon:scale-110 transition-transform">{icon}</span>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--color-muted)]">
                  <Command size={12} />
                  <span>Tài liệu</span>
                  <span>/</span>
                  <span className="text-[color:var(--color-faint)] font-mono">
                    ID_{docId?.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-12">
            <DocPropertyBar
              classification="TOP_SECRET"
              status="DRAFT"
              ownerName={user?.fullName || 'Protocol Agent'}
            />
            <EditorContent editor={editor} className="relative group/editor" />

            {/* Entity Embed Demo */}
            <div className="mt-20">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-surface-border" />
                <span className="text-xs font-semibold text-[color:var(--color-muted)]">
                  Cross-Platform Asset Embed
                </span>
                <div className="h-px flex-1 bg-surface-border" />
              </div>
              <TaskNodeEmbed
                taskId="JIRA-402"
                title="Finalize Neural Singularity UI/UX Purge"
                status="In Development"
                assignee="Protocol Agent"
              />
            </div>
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
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-sm transition-colors text-xs font-semibold ${className}`}
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
      className={`h-9 flex items-center justify-center rounded-sm transition-colors font-semibold text-xs border ${
        active
          ? 'bg-brand-50 text-brand-700 border-brand-500/25'
          : 'text-[color:var(--color-muted)] border-transparent hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
      } ${label ? 'px-3' : 'w-9'} ${className}`}
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
      className="w-full flex items-center gap-3 p-2 hover:bg-black/[0.03] rounded-sm transition-colors group text-left border border-transparent"
    >
      <div className="w-10 h-10 rounded-sm bg-black/[0.03] border border-surface-border flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</div>
        <div className="text-xs text-[color:var(--color-muted)] truncate">{desc}</div>
      </div>
    </button>
  );
}
