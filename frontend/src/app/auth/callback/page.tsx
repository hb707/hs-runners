'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { User } from '@/types';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const needsOnboarding = searchParams.get('needsOnboarding') === 'true';
    const onboardingToken = searchParams.get('onboardingToken');
    const token = searchParams.get('token') ?? '';
    const hasTeam = searchParams.get('hasTeam') === 'true';

    if (needsOnboarding) {
      if (!onboardingToken) {
        router.replace('/auth/login');
        return;
      }
      localStorage.removeItem('access_token');
      localStorage.setItem('onboarding_token', onboardingToken);
      router.replace('/onboarding');
      return;
    }

    if (!token) {
      router.replace('/auth/login');
      return;
    }

    localStorage.removeItem('onboarding_token');
    localStorage.setItem('access_token', token);

    api.get<{ success: boolean; data: User }>('/users/me')
      .then((res) => {
        setAuth(res.data.data, token);
        if (!hasTeam) {
          router.replace('/onboarding');
        } else {
          router.replace('/upload');
        }
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        router.replace('/auth/login');
      });
  }, [router, searchParams, setAuth]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', backgroundColor: '#0D0D10' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto' }} />
        <p style={{ marginTop: '14px', color: '#5A5A72', fontSize: '13px' }}>로그인 중...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', backgroundColor: '#0D0D10' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      </div>
    }
    >
      <CallbackContent />
    </Suspense>
  );
}
