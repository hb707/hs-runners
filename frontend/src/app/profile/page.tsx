'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const { setAuth, token } = useAuthStore();
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setNickname(user.nickname);
  }, [user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploadingAvatar(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<{ success: boolean; data: User }>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (token) setAuth(res.data.data, token);
    } catch {
      setError('이미지 업로드에 실패했습니다.');
      setPreviewUrl(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch<{ success: boolean; data: User }>('/users/me', {
        nickname: nickname.trim(),
      });
      if (token) setAuth(res.data.data, token);
      setSuccess('저장되었습니다.');
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const displayImage = previewUrl ?? user?.profileImageUrl;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-base font-bold">프로필</h1>
        <div />
      </div>

      <div className="flex flex-col items-center px-6 py-8 gap-6">
        {/* 프로필 이미지 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayImage} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-16 h-16 text-gray-300" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-lg leading-none shadow disabled:opacity-50"
          >
            {uploadingAvatar ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '+'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* 닉네임 폼 */}
        <form onSubmit={handleSave} className="w-full space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-green-500">{success}</p>}

          <button
            type="submit"
            disabled={saving || !nickname.trim()}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
