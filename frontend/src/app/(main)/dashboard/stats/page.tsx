'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { UserStats } from '@/types';
import Avatar, { MEMBER_COLORS } from '@/components/Avatar';

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getWeekBounds(weekStr: string): { start: Date; end: Date } {
  const [year, week] = weekStr.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime() - (jan4Day - 1) * 86400000 + (week - 1) * 7 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  return { start: monday, end: sunday };
}

function formatWeekLabel(weekStr: string): string {
  const { start, end } = getWeekBounds(weekStr);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fmt(start)}~${fmt(end)}`;
}

function addWeeks(weekStr: string, delta: number): string {
  const { start } = getWeekBounds(weekStr);
  const newDate = new Date(start.getTime() + delta * 7 * 86400000);
  return getISOWeek(newDate);
}

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(() => getISOWeek(new Date()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    if (!user?.teamId) return;

    setLoading(true);
    let query = '';
    if (viewMode === 'week') query = `week=${currentWeek}`;
    else if (viewMode === 'month') query = `month=${monthStr}`;
    else query = `year=${year}`;

    api.get<{ success: boolean; data: UserStats[] }>(`/stats/team/${user.teamId}?${query}`)
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.teamId, viewMode, currentWeek, monthStr, year]);

  const prevPeriod = () => {
    if (viewMode === 'week') setCurrentWeek((w) => addWeeks(w, -1));
    else if (viewMode === 'month') setCurrentDate(new Date(year, month - 2, 1));
    else setCurrentDate(new Date(year - 1, 0, 1));
  };

  const nextPeriod = () => {
    if (viewMode === 'week') setCurrentWeek((w) => addWeeks(w, 1));
    else if (viewMode === 'month') setCurrentDate(new Date(year, month, 1));
    else setCurrentDate(new Date(year + 1, 0, 1));
  };

  const periodLabel = viewMode === 'week'
    ? formatWeekLabel(currentWeek)
    : viewMode === 'month'
      ? `${year}.${String(month).padStart(2, '0')}`
      : `${year}년`;

  const card: React.CSSProperties = {
    backgroundColor: '#16161C', borderRadius: '18px', border: '1px solid #252530', padding: '16px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D10', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #1A1A22', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: 800, color: '#E8E8F0', letterSpacing: '-0.01em' }}>통계</h1>

        {/* Period toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', backgroundColor: '#1A1A22', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            {(['week', 'month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: viewMode === mode ? '#FF6B00' : 'transparent',
                  color: viewMode === mode ? '#FFFFFF' : '#5A5A72',
                }}
              >
                {mode === 'week' ? '주별' : mode === 'month' ? '월별' : '연별'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={prevPeriod} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A72', fontSize: '16px', padding: '0 2px' }}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#C8C8D8', minWidth: '70px', textAlign: 'center' }}>
              {periodLabel}
            </span>
            <button onClick={nextPeriod} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A72', fontSize: '16px', padding: '0 2px' }}>›</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#3A3A4A', padding: '40px 0', fontSize: '14px' }}>데이터가 없습니다</p>
          ) : (
            <>
              {/* 팀 전체 */}
              {(() => {
                const total = stats.reduce(
                  (acc, s) => ({
                    totalRecords: acc.totalRecords + s.totalRecords,
                    totalKm: acc.totalKm + s.totalKm,
                    unpaidFineAmount: acc.unpaidFineAmount + s.unpaidFineAmount,
                  }),
                  { totalRecords: 0, totalKm: 0, unpaidFineAmount: 0 },
                );
                return (
                  <div style={{ ...card, background: 'linear-gradient(135deg, rgba(255,107,0,0.12) 0%, rgba(255,107,0,0.04) 100%)', border: '1px solid rgba(255,107,0,0.25)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF6B00', background: 'rgba(255,107,0,0.12)', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>팀 전체</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginTop: '14px' }}>
                      <div>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', fontWeight: 900, color: '#FF6B00', lineHeight: 1 }}>{total.totalRecords}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,107,0,0.6)', marginTop: '3px' }}>인증 횟수</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', fontWeight: 900, color: '#FF6B00', lineHeight: 1 }}>{total.totalKm.toFixed(1)}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,107,0,0.6)', marginTop: '3px' }}>총 km</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', fontWeight: 900, color: total.unpaidFineAmount > 0 ? '#EF4444' : '#FF6B00', lineHeight: 1 }}>
                          {total.unpaidFineAmount > 0 ? `${(total.unpaidFineAmount / 10000).toFixed(1)}만` : '0'}
                        </p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,107,0,0.6)', marginTop: '3px' }}>미납 벌금</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 개인별 */}
              {stats.map((s, i) => (
                <div key={s.userId} style={{
                  ...card,
                  border: s.userId === user?.id ? '1.5px solid rgba(255,107,0,0.4)' : '1px solid #252530',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <Avatar
                      profileImageUrl={s.profileImageUrl}
                      nickname={s.nickname}
                      color={MEMBER_COLORS[i % MEMBER_COLORS.length]}
                      size={34}
                    />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#C8C8D8', flex: 1 }}>{s.nickname}</span>
                    {s.userId === user?.id && (
                      <span style={{ fontSize: '10px', color: '#FF6B00', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>나</span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 800, color: '#E8E8F0', lineHeight: 1 }}>{s.totalRecords}</p>
                      <p style={{ fontSize: '10px', color: '#3A3A4A', marginTop: '3px' }}>인증 횟수</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 800, color: '#E8E8F0', lineHeight: 1 }}>{s.totalKm.toFixed(1)}</p>
                      <p style={{ fontSize: '10px', color: '#3A3A4A', marginTop: '3px' }}>총 km</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 800, color: s.unpaidFineAmount > 0 ? '#EF4444' : '#E8E8F0', lineHeight: 1 }}>
                        {s.unpaidFineAmount > 0 ? `${(s.unpaidFineAmount / 10000).toFixed(1)}만` : '0'}
                      </p>
                      <p style={{ fontSize: '10px', color: '#3A3A4A', marginTop: '3px' }}>미납 벌금</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
