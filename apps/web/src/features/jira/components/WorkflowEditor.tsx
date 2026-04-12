'use client';

import { useState, useEffect } from 'react';
import type { WorkflowStatusCategory } from '@superboard/shared';
import { COLUMN_BORDER } from '@/lib/constants/task';

interface WorkflowData {
  statuses: {
    id: string;
    key: string;
    name: string;
    category: WorkflowStatusCategory;
    position: number;
    isSystem: boolean;
  }[];
  transitions: {
    id?: string;
    fromStatusId: string;
    toStatusId: string;
  }[];
}

interface WorkflowEditorProps {
  data?: WorkflowData;
  isLoading: boolean;
  onAddStatus: (data: {
    key: string;
    name: string;
    category: WorkflowStatusCategory;
    position: number;
  }) => Promise<void>;
  onUpdateStatus: (statusId: string, data: { name: string }) => Promise<void>;
  onDeleteStatus: (statusId: string) => Promise<void>;
  onSaveTransitions: (transitions: { fromStatusId: string; toStatusId: string }[]) => Promise<void>;
  isPending?: boolean;
  title?: string;
  description?: string;
  extraActions?: React.ReactNode;
}

export function WorkflowEditor({
  data,
  isLoading,
  onAddStatus,
  onUpdateStatus,
  onDeleteStatus,
  onSaveTransitions,
  isPending,
  title,
  description,
  extraActions,
}: WorkflowEditorProps) {
  const [localTransitions, setLocalTransitions] = useState<Set<string>>(new Set());
  const [isMatrixDirty, setIsMatrixDirty] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusCategory, setNewStatusCategory] = useState<WorkflowStatusCategory>('todo');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (data?.transitions) {
      const set = new Set<string>();
      data.transitions.forEach((t) => {
        set.add(`${t.fromStatusId}_${t.toStatusId}`);
      });
      setLocalTransitions(set);
      setIsMatrixDirty(false);
    }
  }, [data?.transitions]);

  const toggleTransition = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const key = `${fromId}_${toId}`;
    const next = new Set(localTransitions);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setLocalTransitions(next);
    setIsMatrixDirty(true);
  };

  const handleSaveTransitions = () => {
    const transitions = Array.from(localTransitions).map((key) => {
      const [fromStatusId, toStatusId] = key.split('_');
      return { fromStatusId: fromStatusId!, toStatusId: toStatusId! };
    });
    void onSaveTransitions(transitions);
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await onAddStatus({
      key: newStatusName.trim().toLowerCase().replace(/\s+/g, '_'),
      name: newStatusName.trim(),
      category: newStatusCategory,
      position: (data?.statuses?.length ?? 0) + 1,
    });
    setNewStatusName('');
  };

  const handleSaveStatusName = async (statusId: string) => {
    if (!editName.trim()) return;
    await onUpdateStatus(statusId, { name: editName.trim() });
    setEditingStatusId(null);
  };

  if (isLoading) return <div className="p-8">Đang tải cấu hình quy trình...</div>;

  const statuses = data?.statuses ?? [];

  return (
    <div className="flex flex-col gap-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title || 'Workflow & Trạng thái'}</h1>
          <p className="mt-2 text-slate-600 font-medium">
            {description ||
              'Tùy chỉnh các bước trong quy trình làm việc và quy tắc chuyển đổi trạng thái.'}
          </p>
        </div>
        <div className="flex items-center gap-3">{extraActions}</div>
      </header>

      {/* STATUSES SECTION */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Các trạng thái công việc (Cột trên Board)</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
            {statuses.length} trạng thái
          </span>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {statuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-brand-200 hover:bg-brand-50/30 transition-all group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`h-2 w-2 rounded-full ${COLUMN_BORDER[status.key]?.replace('border-t-', 'bg-') || 'bg-brand-500'} shadow-sm`}
                  />
                  <div className="flex-1">
                    {editingStatusId === status.id ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveStatusName(status.id)}
                          className="px-2 py-1 border border-brand-300 rounded text-sm font-bold"
                        />
                        <button
                          onClick={() => handleSaveStatusName(status.id)}
                          className="text-xs text-brand-600 font-bold"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingStatusId(null)}
                          className="text-xs text-slate-400"
                        >
                          Huỷ
                        </button>
                      </div>
                    ) : (
                      <p className="font-bold text-slate-900">{status.name}</p>
                    )}
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                      Phân loại: <span className="text-brand-600">{status.category}</span>
                    </p>
                  </div>
                </div>
                {!status.isSystem && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingStatusId(status.id);
                        setEditName(status.name);
                      }}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Chỉnh sửa tên"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteStatus(status.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Xoá trạng thái"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Thêm trạng thái mới</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Tên trạng thái (VD: QA, Testing...)"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
              <select
                value={newStatusCategory}
                onChange={(e) => setNewStatusCategory(e.target.value as WorkflowStatusCategory)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              >
                <option value="todo">Chưa thực hiện (Todo)</option>
                <option value="in_progress">Đang thực hiện (In Progress)</option>
                <option value="in_review">Đang review (In Review)</option>
                <option value="done">Đã xong (Done)</option>
                <option value="blocked">Đã chặn (Blocked)</option>
              </select>
              <button
                onClick={handleAddStatus}
                disabled={isPending || !newStatusName.trim()}
                className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                {isPending ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSITION MATRIX SECTION */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              Ma trận chuyển đổi trạng thái (Transition Rules)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xác định các luồng di chuyển hợp lệ của Task.
            </p>
          </div>
          {isMatrixDirty && (
            <button
              onClick={handleSaveTransitions}
              disabled={isPending}
              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
            >
              {isPending ? 'Đang lưu...' : 'Lưu quy tắc'}
            </button>
          )}
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left border-b border-slate-100 bg-slate-50/50">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold italic">
                    Từ \ Sang
                  </span>
                </th>
                {statuses.map((s) => (
                  <th
                    key={s.id}
                    className="p-3 text-center border-b border-slate-100 min-w-[100px]"
                  >
                    <span className="text-[11px] font-bold text-slate-700">{s.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((from) => (
                <tr key={from.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-3 border-r border-slate-100 bg-slate-50/20">
                    <span className="text-[11px] font-bold text-slate-700">{from.name}</span>
                  </td>
                  {statuses.map((to) => {
                    const isAllowed = localTransitions.has(`${from.id}_${to.id}`);
                    const isSelf = from.id === to.id;

                    return (
                      <td key={to.id} className="p-4 border border-slate-100 text-center">
                        {isSelf ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-200 mx-auto" />
                        ) : (
                          <button
                            onClick={() => toggleTransition(from.id, to.id)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all mx-auto border ${
                              isAllowed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-inner'
                                : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {isAllowed ? '✅' : '❌'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex items-center gap-6 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 rounded p-0.5 text-xs">
                ✅
              </span>
              <span className="text-[11px] font-medium text-slate-600 italic">
                Được phép di chuyển
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 bg-white border border-slate-200 rounded p-0.5 text-xs">
                ❌
              </span>
              <span className="text-[11px] font-medium text-slate-600 italic">Bị chặn</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
