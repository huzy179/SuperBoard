'use client';

import { Plus, BookOpen, Share2, Shield } from 'lucide-react';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDoc } from '@/features/docs/api/doc-service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function DocHomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.[0];

  const createDocMutation = useMutation({
    mutationFn: () => createDoc(activeWorkspace!.id, { title: 'Tài liệu không tên' }),
    onSuccess: (newDoc) => {
      toast.success('Đã tạo tài liệu mới');
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
      router.push(`/docs/${newDoc.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi tạo tài liệu');
    },
  });

  return (
    <div className="flex h-full flex-col bg-slate-50/20">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 mb-6 rounded-3xl bg-white shadow-xl shadow-brand-500/10 flex items-center justify-center border border-brand-100 animate-pulse">
          <BookOpen size={32} className="text-brand-600" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Trung tâm Tài liệu
        </h1>
        <p className="mt-4 text-slate-500 max-w-lg text-lg leading-relaxed">
          Nơi lưu trữ tất cả kiến thức, quy trình và biên bản cuộc họp của nhóm bạn. Bắt đầu ghi
          chép ngay hôm nay.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
          <FeatureCard
            icon={<Plus className="text-brand-600" />}
            title="Tạo Trang mới"
            description="Bắt đầu từ một trang trắng với trình soạn thảo thông minh."
            onClick={() => createDocMutation.mutate()}
            isPending={createDocMutation.isPending}
          />
          <FeatureCard
            icon={<Share2 className="text-brand-600" />}
            title="Chia sẻ & Cộng tác"
            description="Làm việc cùng nhau trên cùng một tài liệu theo thời gian thực."
            disabled
          />
          <FeatureCard
            icon={<BookOpen className="text-indigo-600" />}
            title="Vector Atlas"
            description="Bản đồ tri thức Neural. Phân tích sự trùng lặp khái niệm và điểm mù tri thức."
            onClick={() => router.push('/docs/atlas')}
            variant="indigo"
          />
        </div>
      </div>

      <div className="p-8 border-t border-slate-100 bg-white/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-[13px] text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield size={14} />
              <span>Dữ liệu được mã hóa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="fill-slate-400" />
              <span>Lưu tài liệu yêu thích</span>
            </div>
          </div>
          <span>SuperBoard Docs v1.0</span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  onClick,
  isPending,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  isPending?: boolean;
  disabled?: boolean;
  variant?: 'brand' | 'indigo';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending}
      className={`flex flex-col items-start p-6 rounded-2xl border transition-all text-left group ${
        disabled
          ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60'
          : variant === 'indigo'
            ? 'bg-indigo-50/10 border-indigo-500/20 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer'
            : 'bg-white border-slate-200 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer'
      }`}
    >
      <div
        className={`p-2 rounded-lg mb-3 group-hover:scale-110 transition-transform ${variant === 'indigo' ? 'bg-indigo-500/10' : 'bg-brand-50'}`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 leading-normal">{description}</p>
      {isPending && (
        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 animate-progress w-1/3" />
        </div>
      )}
    </button>
  );
}

function Star({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
}
