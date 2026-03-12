'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { User } from '@/types';

export function useAuth() {
  const { user, token, setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken && !user) {
      api.get<{ success: boolean; data: User }>('/users/me')
        .then((res) => {
          setAuth(res.data.data, storedToken);
        })
        .catch(() => {
          clearAuth();
        });
    }
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
      router.push('/auth/login');
    }
  };

  return { user, token, isAuthenticated, logout };
}
