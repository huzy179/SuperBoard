import { motion } from 'framer-motion';
import { ExternalLink, User, Layout } from 'lucide-react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export function TaskNodeEmbed(
  props: NodeViewProps | { taskId: string; title: string; status: string; assignee?: string },
) {
  // Support both Tiptap NodeView and direct React component usage
  const isTiptap = 'node' in props;
  const taskId = isTiptap ? props.node.attrs.taskId : props.taskId;
  const title = isTiptap ? props.node.attrs.title : props.title;
  const status = isTiptap ? props.node.attrs.status : props.status;
  const assignee = isTiptap ? props.node.attrs.assignee : props.assignee;

  const content = (
    <motion.div
      whileHover={{ x: 4 }}
      className="my-var(--space-8) p-var(--space-6) bg-slate-900/20 border border-white/10 rounded-md shadow-inner relative group cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex gap-6 items-start">
          {/* Neural Node Icon */}
          <div className="h-12 w-12 rounded-sm bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
            <Layout size={20} />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[9px] font-bold text-brand-400 uppercase tracking-widest">
                Jira_Task_Node
              </span>
              <div className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-xs text-[8px] font-bold text-white/20 font-mono">
                {taskId}
              </div>
            </div>
            <h3 className="text-[15px] font-black text-white uppercase tracking-tight mb-3 group-hover:text-brand-400 transition-colors">
              {title}
            </h3>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shadow-glow-amber" />
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  {status}
                </span>
              </div>
              <div className="w-px h-2 bg-white/10" />
              <div className="flex items-center gap-2">
                <User size={10} className="text-white/20" />
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  {assignee || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button className="p-2 bg-white/5 border border-white/5 text-white/20 rounded-sm hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all group/btn">
          <ExternalLink size={14} className="group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>

      {/* Decorative Neural Line */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5 overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
        />
      </div>
    </motion.div>
  );

  if (isTiptap) {
    return <NodeViewWrapper>{content}</NodeViewWrapper>;
  }

  return content;
}
