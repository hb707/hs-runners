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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#0D0D10' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #1A1A22' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A72', fontSize: '20px', lineHeight: 1 }}>←</button>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 700, color: '#E8E8F0' }}>프로필</h1>
        <div style={{ width: '20px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px', gap: '28px' }}>
        {/* 프로필 이미지 */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden',
            backgroundColor: '#16161C', border: '2px solid #252530',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayImage} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserCircle style={{ width: '56px', height: '56px', color: '#3A3A4A' }} />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '30px', height: '30px',
              background: uploadingAvatar ? 'rgba(255,107,0,0.6)' : 'linear-gradient(135deg, #FF6B00, #FF8C1A)',
              border: 'none', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(255,107,0,0.4)',
            }}
          >
            {uploadingAvatar ? (
              <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            ) : <span style={{ color: '#fff', fontSize: '16px', lineHeight: 1, fontWeight: 700 }}>+</span>}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        {/* 닉네임 폼 */}
        <form onSubmit={handleSave} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#5A5A72', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              style={{
                width: '100%', padding: '13px 15px', border: '1.5px solid #252530',
                borderRadius: '14px', fontSize: '15px', fontWeight: 500,
                background: '#16161C', color: '#E8E8F0', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && <p style={{ fontSize: '12px', color: '#EF4444' }}>{error}</p>}
          {success && <p style={{ fontSize: '12px', color: '#34D399' }}>{success}</p>}

          <button
            type="submit"
            disabled={saving || !nickname.trim()}
            style={{
              width: '100%', padding: '17px', border: 'none', borderRadius: '16px',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px',
              fontWeight: 800, letterSpacing: '0.06em',
              background: (saving || !nickname.trim()) ? '#1E1E28' : 'linear-gradient(135deg, #FF6B00, #FF8C1A)',
              color: (saving || !nickname.trim()) ? '#3A3A4A' : '#FFFFFF',
              cursor: (saving || !nickname.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: (saving || !nickname.trim()) ? 'none' : '0 10px 28px rgba(255,107,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {saving && <span style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />}
            {saving ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
