'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Avatar, { MEMBER_COLORS } from '@/components/Avatar';
import type { RunRecord } from '@/types';

interface TeamMember {
  id: string;
  nickname: string;
  profileImageUrl: string | null;
}

function getYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return getYearMonth(d);
}

export default function GalleryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState<RunRecord[]>([]);
  const [colorMap, setColorMap] = useState<Map<string, string>>(new Map());
  const [memberMap, setMemberMap] = useState<Map<string, TeamMember>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestMonth, setOldestMonth] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchMonth = useCallback(async (month: string): Promise<RunRecord[]> => {
    const res = await api.get<{ success: boolean; data: RunRecord[] }>(`/records/team?month=${month}`);
    return res.data.data;
  }, []);

  useEffect(() => {
    if (!user?.teamId) return;

    const init = async () => {
      try {
        const now = new Date();
        const thisMonth = getYearMonth(now);
        const lastMonth = prevMonth(thisMonth);

        const [membersRes, thisRecs, lastRecs] = await Promise.all([
          api.get<{ success: boolean; data: TeamMember[] }>('/users/team'),
          fetchMonth(thisMonth),
          fetchMonth(lastMonth),
        ]);

        const members: TeamMember[] = membersRes.data.data;
        const cm = new Map(members.map((m, i) => [m.id, MEMBER_COLORS[i % MEMBER_COLORS.length]]));
        const mm = new Map(members.map((m) => [m.id, m]));
        setColorMap(cm);
        setMemberMap(mm);

        const merged = [...thisRecs, ...lastRecs].sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
        setRecords(merged);
        setOldestMonth(lastMonth);

        // If last month returned empty, might still have older records
        setHasMore(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user?.teamId, fetchMonth]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextMonth = prevMonth(oldestMonth);
      const recs = await fetchMonth(nextMonth);
      if (recs.length === 0) {
        setHasMore(false);
        return;
      }
      setRecords((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        const newRecs = recs.filter((r) => !ids.has(r.id));
        return [...prev, ...newRecs].sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
      });
      setOldestMonth(nextMonth);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, oldestMonth, fetchMonth]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', backgroundColor: '#0D0D10' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0D0D10', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #1A1A22', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: 800, color: '#E8E8F0', letterSpacing: '-0.01em' }}>인증</h1>
        <button
          onClick={() => router.push('/upload/new')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '10px', cursor: 'pointer' }}
        >
          <Camera style={{ width: '17px', height: '17px', color: '#FF6B00' }} />
        </button>
      </div>

      {records.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <Camera style={{ width: '40px', height: '40px', color: '#252530' }} />
          <p style={{ fontSize: '14px', color: '#3A3A4A' }}>아직 인증 기록이 없어요</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {records.map((record) => {
              const member = memberMap.get(record.userId);
              const color = colorMap.get(record.userId) ?? MEMBER_COLORS[0];
              return (
                <div
                  key={record.id}
                  onClick={() => router.push(`/dashboard/records/${record.id}`)}
                  style={{ position: 'relative', aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#16161C' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={record.imageUrl}
                    alt="인증사진"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {member && (
                    <div style={{ position: 'absolute', bottom: '5px', right: '5px' }}>
                      <Avatar
                        profileImageUrl={member.profileImageUrl}
                        nickname={member.nickname}
                        color={color}
                        size={20}
                        showBorder
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loadingMore && (
              <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            )}
          </div>
        </>
      )}

    </div>
  );
}
