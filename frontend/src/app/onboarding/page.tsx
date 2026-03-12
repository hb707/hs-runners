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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🎫</div>
          <h1 className="text-xl font-bold">팀 합류하기</h1>
          <p className="mt-1 text-gray-500 text-sm">팀 어드민에게 받은 초대코드를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:border-primary"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 hover:bg-primary-hover transition-colors"
          >
            {loading ? '확인 중...' : '팀 합류하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
