'use client';

import { useRef, useState } from 'react';
import { useUploadAvatar, useUpdateProfile } from '@/hooks/user-profile';
import { AuthUserDTO } from '@superboard/shared';
import { AssigneeAvatar } from '../jira/task-badges';

interface AvatarUploadProps {
  user: AuthUserDTO;
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const updateProfile = useUpdateProfile();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      const avatarUrl = await uploadAvatar.mutateAsync(file);
      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatarUrl });
      setPreviewUrl(null); // Reset preview and use real URL from user session
    } catch {
      setPreviewUrl(null);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-white ring-4 ring-slate-100 shadow-lg">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <AssigneeAvatar
              name={user.fullName}
              color={user.avatarColor}
              size="xl"
              // We'll update AssigneeAvatar to support URLs next
              src={user.avatarUrl}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            Thay đổi
          </span>
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Ảnh đại diện</h3>
        <p className="text-xs text-slate-500 max-w-[200px]">
          Tải lên ảnh mới (JPG, PNG). Kích thước tối đa 2MB.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
            className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            {uploadAvatar.isPending ? 'Đang tải...' : 'Tải ảnh lên'}
          </button>
          {user.avatarUrl && (
            <button
              type="button"
              onClick={() => updateProfile.mutate({ avatarUrl: null })}
              disabled={updateProfile.isPending}
              className="px-3 py-1.5 text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
            >
              Gỡ bỏ
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
