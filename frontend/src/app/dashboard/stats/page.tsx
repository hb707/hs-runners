'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { UserStats } from '@/types';

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    if (!user?.teamId) return;

    setLoading(true);
    const query = viewMode === 'month' ? `month=${monthStr}` : `year=${year}`;
    api.get<{ success: boolean; data: UserStats[] }>(`/stats/team/${user.teamId}?${query}`)
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.teamId, viewMode, monthStr, year]);

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 2, 1));
    else setCurrentDate(new Date(year - 1, 0, 1));
  };

  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month, 1));
    else setCurrentDate(new Date(year + 1, 0, 1));
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-base font-bold">통계</h1>
      </div>

      {/* Period selector */}
      <div className="flex items-center px-4 py-3 gap-2 border-b">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'month' ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}
          >월별</button>
          <button
            onClick={() => setViewMode('year')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'year' ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}
          >연별</button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={prevPeriod} className="text-gray-400 px-1">←</button>
          <span className="text-sm font-medium">
            {viewMode === 'month' ? `${year}.${String(month).padStart(2, '0')}` : `${year}년`}
          </span>
          <button onClick={nextPeriod} className="text-gray-400 px-1">→</button>
        </div>
      </div>

      {/* Stats table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          {stats.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">데이터가 없습니다</p>
          ) : (
            stats.map((s) => (
              <div key={s.userId} className={`bg-white border rounded-xl p-4 space-y-3 ${s.userId === user?.id ? 'border-primary' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    {s.profileImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.profileImageUrl} alt={s.nickname} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{s.nickname}</span>
                  {s.userId === user?.id && <span className="text-xs text-primary bg-indigo-50 px-1.5 py-0.5 rounded">나</span>}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{s.totalRecords}</p>
                    <p className="text-xs text-gray-400">인증 횟수</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{s.totalKm.toFixed(1)}</p>
                    <p className="text-xs text-gray-400">총 km</p>
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${s.unpaidFineAmount > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {s.unpaidFineAmount > 0 ? `${(s.unpaidFineAmount / 10000).toFixed(1)}만` : '0'}
                    </p>
                    <p className="text-xs text-gray-400">미납 벌금</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
