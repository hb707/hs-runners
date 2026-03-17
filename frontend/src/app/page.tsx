'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.replace('/upload');
    } else {
      router.replace('/auth/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: '#0D0D10' }}>
      <div style={{ width: '28px', height: '28px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
    </div>
  );
}
