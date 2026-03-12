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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500 text-sm">로그인 중...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }
    >
      <CallbackContent />
    </Suspense>
  );
}
