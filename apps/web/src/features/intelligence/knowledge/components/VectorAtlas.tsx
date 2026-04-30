'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, BrainCircuit, ChevronRight, Database, Layers, Network, Zap } from 'lucide-react';
import { getKnowledgeAtlas, getKnowledgeDiagnosis } from '../api/knowledge-service';

interface AtlasNode {
  id: string;
  label: string;
  type: 'doc' | 'task';
  group: string;
  projectName: string;
}

interface AtlasEdge {
  from: string;
  to: string;
  strength: number;
}

export function VectorAtlas() {
  const [data, setData] = useState<{ nodes: AtlasNode[]; edges: AtlasEdge[] } | null>(null);
  const [diagnosis, setDiagnosis] = useState<{
    diagnosis: string;
    recommendations: string[];
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getKnowledgeAtlas(), getKnowledgeDiagnosis()])
      .then(([atlas, diag]) => {
        setData(atlas);
        setDiagnosis(diag);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const nodesById = useMemo(() => {
    const map = new Map<string, AtlasNode>();
    for (const node of data?.nodes ?? []) map.set(node.id, node);
    return map;
  }, [data?.nodes]);

  if (isLoading) return <AtlasSkeleton />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Map */}
      <div className="xl:col-span-2 relative aspect-square md:aspect-video rounded-xl border border-surface-border bg-surface-card overflow-hidden shadow-luxe">
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          {(data?.edges ?? []).map((edge, i) => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);
            if (!from || !to) return null;

            const fromPos = getNodePosition(from.id);
            const toPos = getNodePosition(to.id);
            const width = Math.max(1, edge.strength * 1.5);

            return (
              <line
                key={`edge-${i}`}
                x1={`${fromPos.x}%`}
                y1={`${fromPos.y}%`}
                x2={`${toPos.x}%`}
                y2={`${toPos.y}%`}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth={width}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0">
          {(data?.nodes ?? []).map((node) => {
            const pos = getNodePosition(node.id);
            return (
              <NodeElement
                key={node.id}
                node={node}
                pos={pos}
                isSelected={selectedNode?.id === node.id}
                onClick={() => setSelectedNode(node)}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-3 rounded-md border border-surface-border bg-surface-bg px-3 py-2 text-xs text-[color:var(--color-muted)] shadow-sm">
            <Network size={14} className="text-[color:var(--color-faint)]" />
            <span>
              {(data?.nodes ?? []).length} nodes • {(data?.edges ?? []).length} links
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-md border border-surface-border bg-surface-bg px-3 py-2 text-xs text-[color:var(--color-muted)] shadow-sm">
            <BrainCircuit size={14} className="text-brand-600" />
            Click a node to inspect
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
              <Activity size={16} className="text-[color:var(--color-muted)]" />
              Knowledge health
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              Nominal
            </span>
          </div>

          <p className="mt-3 text-sm text-[color:var(--color-muted)] leading-relaxed">
            {diagnosis?.diagnosis || 'Đang phân tích dữ liệu…'}
          </p>

          <div className="mt-5 space-y-2">
            {(diagnosis?.recommendations ?? []).slice(0, 6).map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-surface-border bg-[color:var(--color-surface-alt)]/35 p-3"
              >
                <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-brand-600">
                  <Zap size={14} />
                </div>
                <div className="text-sm text-[color:var(--color-ink)] leading-relaxed">{rec}</div>
              </div>
            ))}
          </div>
        </section>

        {selectedNode ? (
          <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-medium text-[color:var(--color-muted)]">
                  {selectedNode.type === 'doc' ? 'Document' : 'Task'}
                </div>
                <div className="mt-1 truncate text-base font-semibold text-[color:var(--color-ink)]">
                  {selectedNode.label}
                </div>
              </div>
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-md border ${
                  selectedNode.type === 'doc'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-brand-200 bg-brand-50 text-brand-700'
                }`}
                aria-hidden
              >
                {selectedNode.type === 'doc' ? <Layers size={18} /> : <Database size={18} />}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-surface-border bg-surface-bg p-3">
                <div className="text-xs text-[color:var(--color-muted)]">Project</div>
                <div className="mt-1 text-sm font-medium text-[color:var(--color-ink)] truncate">
                  {selectedNode.projectName}
                </div>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-bg p-3">
                <div className="text-xs text-[color:var(--color-muted)]">Group</div>
                <div className="mt-1 text-sm font-medium text-[color:var(--color-ink)] truncate">
                  {selectedNode.group}
                </div>
              </div>
            </div>

            <button type="button" className="mt-5 w-full btn btn-secondary">
              <span className="inline-flex items-center gap-2">
                Mở chi tiết
                <ChevronRight size={16} />
              </span>
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function NodeElement({
  node,
  pos,
  isSelected,
  onClick,
}: {
  node: AtlasNode;
  pos: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
}) {
  const tone =
    node.type === 'doc'
      ? {
          dot: 'bg-indigo-500/25 border-indigo-500/50',
          ring: 'ring-indigo-500/20',
          label: 'border-indigo-200 bg-indigo-50 text-indigo-800',
        }
      : {
          dot: 'bg-brand-500/25 border-brand-500/50',
          ring: 'ring-brand-500/20',
          label: 'border-brand-200 bg-brand-50 text-brand-800',
        };

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute group"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
      aria-label={node.label}
    >
      <span
        className={`block h-3.5 w-3.5 rounded-full border ${tone.dot} ${
          isSelected ? `ring-4 ${tone.ring}` : ''
        }`}
      />

      <span className="pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-sm ${tone.label}`}
        >
          {node.label}
        </span>
      </span>
    </button>
  );
}

function getNodePosition(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 15 + (Math.abs(hash) % 30);

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function AtlasSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 aspect-video rounded-xl border border-surface-border bg-surface-card" />
      <div className="space-y-6">
        <div className="h-72 rounded-xl border border-surface-border bg-surface-card" />
        <div className="h-56 rounded-xl border border-surface-border bg-surface-card" />
      </div>
    </div>
  );
}
