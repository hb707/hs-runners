'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { User } from '@/types';

export default function OnboardingPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const onboardingToken = localStorage.getItem('onboarding_token');
    const accessToken = localStorage.getItem('access_token');
    if (!onboardingToken && !accessToken) {
      router.replace('/auth/login');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const onboardingToken = localStorage.getItem('onboarding_token');
      const res = await api.post<{ success: boolean; data: { accessToken: string; user: User } }>(
        '/auth/onboarding',
        { code: code.trim().toUpperCase(), onboardingToken: onboardingToken ?? undefined }
      );
      const { accessToken, user } = res.data.data;
      localStorage.removeItem('onboarding_token');
      setAuth(user, accessToken);
      router.replace('/upload');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? '유효하지 않은 초대코드입니다';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', backgroundColor: '#0D0D10', padding: '0 28px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-80px', right: '-60px', width: '240px', height: '240px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '36px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(255,107,0,0.1)', border: '1.5px solid rgba(255,107,0,0.28)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '18px', fontSize: '28px',
          }}>🎫</div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: '34px', fontWeight: 900,
            letterSpacing: '-0.01em', color: '#E8E8F0', marginBottom: '8px',
          }}>팀 합류하기</h1>
          <p style={{ fontSize: '14px', color: '#5A5A72', lineHeight: 1.5 }}>
            팀 어드민에게 받은 초대코드를<br />입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
            style={{
              width: '100%', padding: '18px', border: '1.5px solid #252530', borderRadius: '16px',
              textAlign: 'center', fontSize: '22px', fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, letterSpacing: '0.18em', background: '#16161C', color: '#E8E8F0',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#EF4444', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              width: '100%', padding: '17px',
              background: (loading || !code.trim()) ? '#1E1E28' : 'linear-gradient(135deg, #FF6B00, #FF8C1A)',
              border: 'none', borderRadius: '16px',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px',
              fontWeight: 800, letterSpacing: '0.06em',
              color: (loading || !code.trim()) ? '#3A3A4A' : '#FFFFFF',
              cursor: (loading || !code.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: (loading || !code.trim()) ? 'none' : '0 10px 28px rgba(255,107,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
          >
            {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />}
            {loading ? '확인 중...' : '팀 합류하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
