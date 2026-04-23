'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, X, CheckSquare, Loader2, Target, Type, AlignLeft } from 'lucide-react';
import { getProjects } from '@/features/project/api/project-service';
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-luxe p-8 z-[101] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-500/20 rounded-lg text-brand-400">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                    Chuyển thành Task
                  </h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black italic">
                    Cross-Platform Operational Handoff
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  <Target size={12} /> Dự án đích
                </label>
                <div className="relative">
                  {isLoadingProjects ? (
                    <div className="w-full h-12 bg-white/[0.03] animate-pulse rounded-lg" />
                  ) : (
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full h-12 bg-slate-950/50 border border-white/5 rounded-lg px-4 text-sm text-white focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all outline-none appearance-none"
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
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  <Type size={12} /> Tiêu đề Task
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 bg-slate-950/50 border border-white/5 rounded-lg px-4 text-sm text-white placeholder:text-white/10 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  <AlignLeft size={12} /> Chi tiết
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-32 bg-slate-950/50 border border-white/5 rounded-lg p-4 text-sm text-white placeholder:text-white/10 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all outline-none resize-none"
                />
              </div>

              <button
                onClick={handleCreateTask}
                disabled={isSubmitting || isLoadingProjects}
                className="w-full py-4 bg-brand-500 text-white rounded-lg font-black uppercase tracking-[0.2em] italic hover:bg-brand-400 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group shadow-glow-brand/10"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Box size={18} className="group-hover:scale-110 transition-transform" />
                )}
                Xác nhận triển khai
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
