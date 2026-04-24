'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, X, CheckSquare, Loader2, Target, Type, AlignLeft } from 'lucide-react';
import { getProjects } from '@/features/operations/project/api/project-service';
import { apiPost } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Message, ProjectItemDTO } from '@superboard/shared';

interface MessageToTaskDialogProps {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
}

export function MessageToTaskDialog({ message, isOpen, onClose }: MessageToTaskDialogProps) {
  const [projects, setProjects] = useState<ProjectItemDTO[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [title, setTitle] = useState(message.content.substring(0, 50));
  const [description, setDescription] = useState(
    `Nguồn: Tin nhắn từ ${message.author?.fullName}\n\n${message.content}`,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getProjects()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((data: any[]) => {
          setProjects(data);
          if (data.length > 0) setSelectedProjectId(data[0].id);
        })
        .finally(() => setIsLoadingProjects(false));
    }
  }, [isOpen]);

  const handleCreateTask = async () => {
    if (!selectedProjectId) {
      toast.error('Vui lòng chọn một dự án');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost(
        `/v1/projects/${selectedProjectId}/tasks`,
        {
          title,
          description,
          status: 'todo',
          priority: 'medium',
        },
        { auth: true },
      );

      toast.success('Đã chuyển thành công tin nhắn thành Task!');
      onClose();
    } catch (error) {
      console.error('Failed to convert message to task:', error);
      toast.error('Không thể tạo task từ tin nhắn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-950 border border-white/10 rounded-md shadow-luxe p-8 z-[101] overflow-hidden backdrop-blur-3xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-brand-500/10 rounded-sm text-brand-400 border border-brand-500/20 shadow-inner">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">
                    HANDOFF_TO_PROJECT
                  </h2>
                  <p className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-bold">
                    CROSS_PLATFORM_OPERATIONAL_SYNC
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/20 hover:text-white hover:bg-white/[0.03] rounded-sm transition-all border border-transparent hover:border-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[8px] font-bold text-white/20 uppercase tracking-widest ml-1">
                  <Target size={10} /> DESTINATION_NODE
                </label>
                <div className="relative">
                  {isLoadingProjects ? (
                    <div className="w-full h-11 bg-white/[0.02] animate-pulse rounded-sm" />
                  ) : (
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full h-11 bg-slate-950/50 border border-white/10 rounded-sm px-4 text-xs text-white focus:border-brand-500/30 focus:ring-0 transition-all outline-none appearance-none font-bold uppercase tracking-tight"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id} className="bg-slate-900 border-none">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[8px] font-bold text-white/20 uppercase tracking-widest ml-1">
                  <Type size={10} /> VECTOR_LABEL
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 bg-slate-950/50 border border-white/10 rounded-sm px-4 text-xs text-white placeholder:text-white/5 focus:border-brand-500/30 focus:ring-0 transition-all outline-none font-bold uppercase tracking-tight"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[8px] font-bold text-white/20 uppercase tracking-widest ml-1">
                  <AlignLeft size={10} /> METADATA_PAYLOAD
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-sm p-4 text-xs text-white placeholder:text-white/5 focus:border-brand-500/30 focus:ring-0 transition-all outline-none resize-none font-bold uppercase tracking-tight"
                />
              </div>

              <button
                onClick={handleCreateTask}
                disabled={isSubmitting || isLoadingProjects}
                className="w-full py-4 bg-brand-500 text-white rounded-sm font-black uppercase tracking-[0.2em] hover:bg-brand-400 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group shadow-glow-brand/10 border border-brand-400/20 active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Box size={16} className="group-hover:scale-110 transition-transform" />
                )}
                CONFIRM_DEPLOYMENT
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
