import { FormEventHandler } from 'react';
import { Sparkles, Edit3, Palette, X, Check, Files, Cpu, Target } from 'lucide-react';

type ProjectFormProps = {
  mode: 'create' | 'edit';
  name: string;
  description: string;
  icon: string;
  color: string;
  error: string | null;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ProjectForm({
  mode,
  name,
  description,
  icon,
  color,
  error,
  isPending,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onColorChange,
  onCancel,
  onSubmit,
}: ProjectFormProps) {
  const isCreate = mode === 'create';

  return (
    <form
      onSubmit={onSubmit}
      className="relative mb-12 rounded-[3.5rem] border border-white/5 bg-slate-900/50 p-12 shadow-glass backdrop-blur-3xl overflow-hidden group"
    >
      {/* Texture & Light */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      <div
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 transition-all duration-1000 group-hover:opacity-40"
        style={{ backgroundColor: color || 'var(--color-brand-500)' }}
      />

      <div className="relative z-10 flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Target size={14} className="text-brand-400" />
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
                Node Manifest
              </span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              {isCreate ? 'Initialize Mission' : 'Modify Mission Specification'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-4 rounded-full bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Project Designation */}
          <div className="space-y-3 md:col-span-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">
              <Edit3 size={10} /> Designation
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={isCreate ? 'MISSION DESIGNATION (E.G. NEURAL_CORE_V2)' : undefined}
              className="w-full bg-slate-950 border border-white/5 rounded-3xl py-5 px-8 text-sm font-bold text-white placeholder:text-white/5 focus:outline-none focus:border-brand-500/50 transition-all shadow-inner"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">
              <Sparkles size={10} /> Visual Key
            </label>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl drop-shadow-luxe">
                {icon || '🚀'}
              </div>
              <input
                type="text"
                value={icon}
                onChange={(event) => onIconChange(event.target.value)}
                placeholder="🚀"
                className="w-full bg-slate-950 border border-white/5 rounded-3xl py-5 pl-16 pr-8 text-sm font-bold text-white placeholder:text-white/5 focus:outline-none focus:border-brand-500/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">
              <Palette size={10} /> Aura Chroma
            </label>
            <div className="flex items-center gap-4 bg-slate-950 border border-white/5 rounded-3xl p-2 pl-4">
              <div
                className="h-10 w-10 rounded-2xl flex-shrink-0 shadow-luxe"
                style={{ backgroundColor: color || '#6366f1' }}
              />
              <input
                type="text"
                value={color}
                onChange={(event) => onColorChange(event.target.value)}
                placeholder="#6366F1"
                className="flex-1 bg-transparent border-none text-sm font-mono font-bold text-white placeholder:text-white/5 focus:ring-0 uppercase"
              />
              <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 group/color">
                <input
                  type="color"
                  value={color}
                  onChange={(event) => onColorChange(event.target.value)}
                  className="absolute -inset-2 h-14 w-14 cursor-pointer bg-transparent border-none opacity-0 z-10"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 group-hover/color:bg-white/10 transition-colors pointer-events-none">
                  <Check size={14} className="text-white/20" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">
              <Files size={10} /> Objective Brief
            </label>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={4}
              placeholder={isCreate ? 'ELABORATE ON PRIMARY MISSION OBJECTIVES...' : undefined}
              className="w-full bg-slate-950 border border-white/5 rounded-3xl py-5 px-8 text-sm font-medium text-white/60 placeholder:text-white/5 focus:outline-none focus:border-brand-500/50 transition-all shadow-inner italic"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <p
              role="alert"
              className="text-[10px] font-black uppercase tracking-widest text-rose-400"
            >
              PROTOCOL BREACH: {error}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/5 transition-all"
          >
            ABORT
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex items-center gap-3 bg-white px-10 py-4 rounded-full text-slate-950 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-luxe overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
              {isPending ? <Cpu className="animate-spin" size={16} /> : <Check size={16} />}
              {isPending
                ? isCreate
                  ? 'SYNCHRONIZING...'
                  : 'UPDATING...'
                : isCreate
                  ? 'INITIALIZE NODE'
                  : 'UPDATE SPECIFICATION'}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
