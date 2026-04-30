'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Construction,
  ExternalLink,
  Globe,
  MessageCircle,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  disconnectIntegration,
  getIntegrations,
  type IntegrationItem,
} from '@/features/specialized/connect/api/connect-service';

export function ConnectHub({ workspaceId }: { workspaceId: string }) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'monitor'>('connections');

  const fetchIntegrations = useCallback(async () => {
    try {
      const body = await getIntegrations(workspaceId);
      setIntegrations(body.integrations);
    } catch {
      toast.error('Không tải được danh sách kết nối');
    }
  }, [workspaceId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchIntegrations());
  }, [fetchIntegrations]);

  const deleteIntegration = async (id: string) => {
    try {
      await disconnectIntegration(workspaceId, id);
      toast.success('Đã ngắt kết nối');
      fetchIntegrations();
    } catch {
      toast.error('Không thể ngắt kết nối');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'SLACK':
        return <MessageCircle className="text-[#4A154B]" size={18} />;
      case 'GITHUB':
        return <Globe className="text-[color:var(--color-ink)]" size={18} />;
      case 'DISCORD':
        return <MessageCircle className="text-[#5865F2]" size={18} />;
      default:
        return <Globe className="text-[color:var(--color-muted)]" size={18} />;
    }
  };

  return (
    <section className="rounded-xl border border-surface-border bg-surface-card shadow-luxe p-6 space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
            <Share2 size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--color-ink)] tracking-tight">
              Kết nối
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
              Quản lý các tích hợp (Slack, GitHub, Discord…) cho workspace.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-black/[0.02] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('connections')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'connections'
                ? 'bg-surface-card border border-surface-border shadow-glass text-[color:var(--color-ink)]'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
            }`}
          >
            Kết nối
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monitor')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'monitor'
                ? 'bg-surface-card border border-surface-border shadow-glass text-[color:var(--color-ink)]'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
            }`}
          >
            Giám sát
          </button>
        </div>
      </header>

      {activeTab === 'connections' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            type="button"
            className="group rounded-xl border border-dashed border-surface-border bg-black/[0.02] p-6 text-left hover:bg-black/[0.03] transition-colors"
            onClick={() => toast.info('Tính năng thêm kết nối sẽ được bổ sung.')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-brand-700">
                <Plus size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                  Thêm kết nối
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-muted)]">
                  Kết nối dịch vụ mới vào workspace.
                </div>
              </div>
            </div>
          </button>

          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-glass flex flex-col gap-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-black/[0.02] border border-surface-border flex items-center justify-center">
                  {getProviderIcon(integration.provider)}
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    integration.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {integration.status}
                </span>
              </div>

              <div className="min-w-0">
                <div className="text-base font-semibold text-[color:var(--color-ink)] truncate">
                  {integration.name}
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-muted)]">
                  {integration.type}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3">
                <button type="button" className="btn btn-secondary">
                  Cấu hình <ExternalLink size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteIntegration(integration.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                  aria-label="Disconnect"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-black/[0.02] p-10 text-center">
          <Construction size={36} className="mx-auto text-[color:var(--color-faint)]" />
          <h3 className="mt-3 text-base font-semibold text-[color:var(--color-ink)]">
            Tính năng đang phát triển
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Chức năng giám sát sẽ sớm được cập nhật.
          </p>
        </div>
      )}
    </section>
  );
}
