'use client';

import { useState } from 'react';
import { CheckCircle2, Code, Copy, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AppOverlay } from '@/components/ui/app-overlay';
import { generateTestSpec } from '../api/qa-service';

interface TestGeneratorModalProps {
  onClose: () => void;
}

export function TestGeneratorModal({ onClose }: TestGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const body = await generateTestSpec(prompt);
      setGeneratedCode(body.spec);
      toast.success('Đã tạo spec test');
    } catch {
      toast.error('Tạo spec thất bại');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success('Đã copy');
    } catch {
      toast.error('Không thể copy');
    }
  };

  return (
    <AppOverlay
      isOpen
      onClose={onClose}
      title="Test generator"
      subtitle="Tạo spec test tự động từ mô tả hành vi"
      variant="modal"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[color:var(--color-muted)]">
            Spec dạng TypeScript, hướng tới POM (Page Object Model).
          </p>
          <div className="flex items-center gap-2">
            {generatedCode ? (
              <button type="button" className="btn btn-secondary" onClick={copyToClipboard}>
                {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {isCopied ? 'Đã copy' : 'Copy'}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
              {isGenerating ? 'Đang tạo…' : 'Tạo spec'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2 space-y-3">
          <div className="text-sm font-semibold text-[color:var(--color-ink)] flex items-center gap-2">
            <Sparkles size={16} className="text-brand-600" />
            Yêu cầu test
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Test rằng user có thể tạo project, mời thành viên, và tạo comment."
            className="form-textarea h-44"
          />
          <div className="rounded-lg border border-surface-border bg-black/[0.02] p-4 text-sm text-[color:var(--color-muted)] leading-relaxed">
            Gợi ý: mô tả ngắn gọn các bước (Given / When / Then) và dữ liệu chính.
          </div>
        </section>

        <section className="lg:col-span-3 space-y-3">
          <div className="text-sm font-semibold text-[color:var(--color-ink)] flex items-center gap-2">
            <Code size={16} className="text-[color:var(--color-muted)]" />
            generated_spec.ts
          </div>

          <div className="rounded-xl border border-surface-border bg-black/[0.02] p-4 overflow-auto max-h-[60vh]">
            {generatedCode ? (
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[color:var(--color-ink)]">
                {generatedCode}
              </pre>
            ) : (
              <div className="p-10 text-center text-sm text-[color:var(--color-muted)]">
                Chưa có spec. Nhập yêu cầu và bấm “Tạo spec”.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppOverlay>
  );
}
