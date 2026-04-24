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
import { JiraTask } from '@/features/integrations/jira/components/JiraTaskExtension';
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
            'prose prose-invert max-w-none focus:outline-none min-h-[500px] prose-slate prose-headings:text-white prose-p:text-white/70 prose-strong:text-brand-400 prose-code:text-emerald-400 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-headings:uppercase prose-headings:tracking-widest prose-headings:italic',
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
      <div className="animate-pulse bg-white/[0.01] h-[500px] rounded-md border border-white/5" />
    );
  }

  return (
    <div className="relative">
      {/* Custom AI Bubble Menu */}
      {menuPos.show && editable && (
        <div
          ref={menuRef}
          className="fixed z-50 flex items-center gap-1 p-1 bg-slate-950/95 border border-white/10 rounded-sm shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
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
          className="fixed z-50 w-64 bg-slate-950/95 border border-white/10 rounded-md shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-3xl"
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
          <div className="px-4 py-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] border-t border-white/5 my-2">
            ĐỊNH DẠNG CƠ BẢN
          </div>
          <SlashMenuItem
            icon={<Type size={14} className="text-white" />}
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
            icon={<Type size={12} className="text-white/80" />}
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
            icon={<ListIcon size={14} className="text-white/60" />}
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
          <div className="px-4 py-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] border-t border-white/5 my-2">
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

          <div className="px-4 py-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] border-t border-white/5 my-2">
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
          className="fixed z-50 w-72 bg-slate-950/98 border border-white/10 rounded-md shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-3xl overflow-hidden"
          style={{ top: `${slashMenu.top}px`, left: `${slashMenu.left}px` }}
        >
          <div className="flex items-center gap-3 mb-4 px-2">
            <Search size={16} className="text-brand-400" />
            <input
              autoFocus
              value={taskQuery}
              onChange={(e) => setTaskQuery(e.target.value)}
              placeholder="Search Jira Tasks..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/10 w-full"
            />
          </div>

          <div className="max-h-64 overflow-y-auto elite-scrollbar space-y-1">
            {isSearching && (
              <div className="py-8 text-center">
                <Activity size={20} className="animate-spin text-brand-500 mx-auto mb-2" />
                <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest">
                  Searching...
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
                className="w-full p-var(--space-3) hover:bg-white/[0.03] rounded-sm transition-all text-left border border-transparent hover:border-white/5 group"
              >
                <div className="text-[11px] font-black text-white uppercase tracking-tight truncate group-hover:text-brand-400">
                  {task.title}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-white/20 uppercase font-mono">
                    {task.projectName?.substring(0, 3)}-{task.number}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-white/5" />
                  <span className="text-[9px] text-white/10 uppercase tracking-widest italic">
                    {task.status}
                  </span>
                </div>
              </button>
            ))}

            {!isSearching && (!searchResults?.tasks || searchResults.tasks.length === 0) && (
              <div className="py-8 text-center text-[10px] text-white/10 uppercase tracking-widest italic">
                No tactical matches
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between px-2">
            <button
              onClick={() => setSlashMenu((prev) => ({ ...prev, mode: 'default' }))}
              className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors"
            >
              Back
            </button>
            <span className="text-[9px] font-black text-brand-500/40 uppercase tracking-[0.2em]">
              Neural Sync Active
            </span>
          </div>
        </div>
      )}

      {editable && (
        <div className="sticky top-20 z-40 flex flex-wrap items-center gap-1 border border-white/10 bg-slate-950/80 p-2 backdrop-blur-2xl mb-var(--space-12) shadow-inner rounded-md">
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-emerald-400 font-bold text-[8px] uppercase tracking-widest">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-glow-emerald"></span>
            </div>
            AI_Synapse_Active
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto pb-48 flex gap-12">
        <div className="flex-1 min-w-0">
          {/* Notion-style Header */}
          <div className="relative group mb-20">
            {/* Cover Image */}
            <div className="h-48 md:h-56 w-full rounded-md overflow-hidden relative border border-white/10 mb-[-3rem] shadow-inner group/cover bg-gradient-to-br from-brand-500/20 via-slate-900/90 to-slate-950">
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
                className="w-24 h-24 bg-slate-950 rounded-sm shadow-inner flex items-center justify-center text-5xl border border-white/10 transform transition hover:scale-105 cursor-pointer active:scale-95 group/icon"
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
            <DocPropertyBar
              classification="TOP_SECRET"
              status="DRAFT"
              ownerName={user?.fullName || 'Protocol Agent'}
            />
            <EditorContent editor={editor} className="relative group/editor" />

            {/* Entity Embed Demo */}
            <div className="mt-20">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
                  Cross-Platform Asset Embed
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
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
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-sm transition-all text-[9px] font-bold uppercase tracking-widest ${className}`}
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
      className={`h-9 flex items-center justify-center rounded-sm transition-all font-bold text-[10px] border ${
        active
          ? 'bg-white text-slate-950 border-white'
          : 'text-white/30 border-transparent hover:bg-white/5 hover:text-white'
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
      className="w-full flex items-center gap-3 p-2 hover:bg-white/[0.03] rounded-sm transition-all group text-left border border-transparent hover:border-white/5"
    >
      <div className="w-10 h-10 rounded-sm bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:bg-brand-500/10 group-hover:border-brand-500/20 transition-all">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-white uppercase tracking-tight group-hover:text-brand-400 transition-colors">
          {title}
        </div>
        <div className="text-[9px] text-white/20 group-hover:text-white/40 truncate font-bold">
          {desc}
        </div>
      </div>
    </button>
  );
}
