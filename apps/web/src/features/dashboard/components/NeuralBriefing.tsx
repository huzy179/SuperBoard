'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { motion } from 'framer-motion';
import { Cpu, Download, Box, Globe, HardDrive, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { apiPost } from '@/lib/api-client';
import { toast } from 'sonner';

interface NeuralBriefingProps {
  projectId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NeuralBriefing({ projectId }: NeuralBriefingProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const toggleProvider = () => {
    setIsLocalMode(!isLocalMode);
    toast.success(
      isLocalMode ? 'Chuyển sang Neural Cloud (Gemini)' : 'Kích hoạt Local Node Failover (Ollama)',
    );
  };

  const handleExportDataset = async () => {
    setIsExporting(true);
    toast.info('Đang tổng hợp Dataset từ Neural Signals...');

    try {
      const { result } = await apiPost<any>(
        '/v1/ai/dataset/export',
        {
          format: 'llama3',
          limit: 1000,
        },
        { auth: true },
      );

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neural_signals_${new Date().toISOString().split('T')[0]}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dataset đã sẵn sàng để Fine-tune Llama!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Xuất Dataset thất bại');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      {/* Strategic Command Intent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 p-8 bg-slate-900/40 border border-white/5 rounded-[3rem] shadow-glass relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Cpu size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-[9px] font-black text-brand-400 uppercase tracking-[0.3em]">
              Neural Objective
            </div>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-6 leading-tight">
            Điểm hội tụ tri thức <br />{' '}
            <span className="text-brand-400">Jira x Notion x Slack</span>
          </h2>

          <p className="text-sm text-white/50 max-w-xl mb-12 font-medium leading-relaxed uppercase">
            Hệ thống đã đồng bộ 14 thảo luận từ Slack thành 3 Mission Briefings và 12 Jira Tasks. Độ
            lệch thông tin đã được giảm thiểu xuống mức 1.2%.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:bg-brand-500/5 transition-all">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest">
                  Sự hội tụ (Convergence)
                </div>
                <RefreshCcw size={14} className="text-brand-400 animate-spin-slow" />
              </div>
              <p className="text-xs text-white/70 italic font-medium uppercase tracking-tight">
                3 Briefings / 12 Tasks / 14 Contexts
              </p>
            </div>
            <div
              onClick={handleExportDataset}
              className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:bg-indigo-500/5 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Xuất kiến thức (Dataset)
                </div>
                <Download size={14} className={isExporting ? 'animate-bounce' : ''} />
              </div>
              <p className="text-xs text-white/70">Neural Signal Hub: 188 Tín hiệu.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Operational Pulse & AI Control */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 bg-brand-500/10 border border-brand-500/20 rounded-[3rem] shadow-glow-brand/5 relative overflow-hidden flex flex-col justify-between h-[200px]"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em] mb-2 font-mono italic">
                Control Node
              </div>
              <div className="text-2xl font-black text-white tracking-tighter uppercase italic">
                {isLocalMode ? 'Local Llama' : 'Neural Cloud'}
              </div>
            </div>
            <button
              onClick={toggleProvider}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
            >
              {isLocalMode ? (
                <HardDrive className="text-brand-400" size={20} />
              ) : (
                <Globe className="text-brand-400" size={20} />
              )}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-white/40 italic">
              <span>Latency</span>
              <span className={isLocalMode ? 'text-brand-400' : 'text-indigo-400'}>
                {isLocalMode ? '450ms' : '1.2s'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isLocalMode ? '90%' : '70%' }}
                className={`h-full ${isLocalMode ? 'bg-brand-500' : 'bg-indigo-500'} shadow-glow`}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 bg-slate-900/40 border border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:border-brand-500/30 transition-all h-[120px]"
        >
          <div className="h-12 w-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-brand-400 group-hover:scale-110 transition-all">
            <Box size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1 italic">
              Node Integrity
            </div>
            <div className="text-xs text-brand-400 font-black uppercase">Ollama: Active</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
