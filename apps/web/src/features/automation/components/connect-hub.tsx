'use client';

import { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  MessageCircle,
  Construction,
} from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  provider: 'SLACK' | 'GITHUB' | 'DISCORD' | 'GITLAB' | 'ZAPIER';
  type: string;
  status: string;
  createdAt: string;
}

export function ConnectHub({ workspaceId }: { workspaceId: string }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'monitor'>('connections');

  useEffect(() => {
    fetchIntegrations();
  }, [workspaceId]);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch(`/api/v1/connect/integrations?workspaceId=${workspaceId}`);
      const body = await res.json();
      if (res.ok) {
        setIntegrations(body.data.integrations);
      }
    } catch {
      toast.error('Failed to fetch integrations');
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/connect/integrations/${id}?workspaceId=${workspaceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Integration disconnected');
        fetchIntegrations();
      }
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'SLACK':
        return <MessageCircle className="text-[#4A154B]" />;
      case 'GITHUB':
        return <Globe className="text-white" />;
      case 'DISCORD':
        return <MessageCircle className="text-[#5865F2]" />;
      default:
        return <Globe />;
    }
  };

  return (
    <div className="flex flex-col gap-10 p-10 bg-black/40 rounded-[3rem] border border-white/5 font-sans min-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
            <Share2 size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter italic">
              SuperBoard Kết nối
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                Giao diện kết nối dịch vụ
              </span>
              <div className="h-1 w-1 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-indigo-400/60 uppercase">Đã kết nối</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/5">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'connections' ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:text-white'}`}
          >
            Kết nối
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'monitor' ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:text-white'}`}
          >
            Giám sát
          </button>
        </div>
      </div>

      {activeTab === 'connections' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Add New Hook */}
          <div className="group cursor-pointer p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/40 transition-all flex flex-col items-center justify-center gap-4 text-center border-dashed">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <div>
              <span className="text-sm font-black text-white uppercase tracking-tighter">
                Thêm kết nối
              </span>
              <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest mt-1 leading-relaxed">
                Kết nối dịch vụ mới vào workspace
              </p>
            </div>
          </div>

          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-6 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />

              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  {getProviderIcon(integration.provider)}
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    integration.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {integration.status}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-lg font-black text-white uppercase italic tracking-tighter">
                  {integration.name}
                </span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">
                  {integration.type}
                </span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <button className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">
                  Cấu hình <ExternalLink size={12} />
                </button>
                <button
                  onClick={() => deleteIntegration(integration.id)}
                  className="p-2.5 rounded-xl bg-rose-500/5 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Neural Monitor / Giám sát — empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-20">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
            <Construction size={40} />
          </div>
          <div className="text-center">
            <h3 className="text-white font-black text-xl uppercase tracking-widest mb-2">
              Tính năng đang phát triển
            </h3>
            <p className="text-white/30 text-sm font-medium">
              Chức năng giám sát sẽ sớm được cập nhật
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
