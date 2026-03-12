'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import api from '@/lib/api';
import type { RunRecord, User } from '@/types';

const MEMBER_COLORS = [
  'bg-indigo-400', 'bg-pink-400', 'bg-green-400', 'bg-yellow-400',
  'bg-purple-400', 'bg-red-400', 'bg-blue-400', 'bg-orange-400',
];

function getInitials(nickname: string): string {
  if (!nickname?.trim()) return '?';
  const parts = nickname.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return nickname.slice(0, 2).toUpperCase();
}

function getYearMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<RunRecord[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthStr = getYearMonth(year, month);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: RunRecord[] }>(`/records/team?month=${monthStr}`),
      api.get<{ success: boolean; data: User[] }>('/users/team'),
    ])
      .then(([recRes, usersRes]) => {
        setRecords(recRes.data.data);
        setMembers(usersRes.data.data);
        const now = new Date();
        if (year === now.getFullYear() && month === now.getMonth() + 1) {
          setSelectedDay(now.getDate());
        } else {
          setSelectedDay(1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [monthStr]);

  const memberColorMap = new Map(members.map((m, i) => [m.id, MEMBER_COLORS[i % MEMBER_COLORS.length]]));

  // Group records by day
  const recordsByDay = new Map<number, RunRecord[]>();
  for (const rec of records) {
    const day = new Date(rec.recordedAt).getDate();
    if (!recordsByDay.has(day)) recordsByDay.set(day, []);
    recordsByDay.get(day)!.push(rec);
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));

  const today = new Date();
  const selectedRecords = selectedDay ? (recordsByDay.get(selectedDay) ?? []) : [];
  const selectedDateLabel = selectedDay
    ? `${month}월 ${selectedDay}일`
    : '날짜 선택';

  return (
    <div className="flex flex-col h-full bg-surface px-4 py-4 gap-3">
      <div className="bg-white rounded-3xl shadow-card-sm border border-neutral-100 p-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 text-neutral-500 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors">
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-neutral-900">{year}년 {month}월</h1>
          </div>
          <button onClick={nextMonth} className="p-2 text-neutral-500 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors">
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">전체</span>
          <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">인증일</span>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-neutral-400 py-3">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {calendarCells.map((day, idx) => {
            if (!day) return <div key={`blank-${idx}`} className="h-10" />;

            const dayRecords = recordsByDay.get(day) ?? [];
            const uniqueUsers = [...new Set(dayRecords.map((r) => r.userId))];
            const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                type="button"
                className="h-12 flex flex-col items-center justify-center gap-1 rounded-2xl hover:bg-neutral-100 transition-colors"
                onClick={() => setSelectedDay(day)}
              >
                <span
                  className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-semibold ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : isToday
                        ? 'bg-primary/10 text-primary'
                        : 'text-neutral-800'
                  }`}
                >
                  {day}
                </span>
                <span className="flex items-center gap-0.5">
                  {uniqueUsers.slice(0, 3).map((uid) => (
                    <span key={uid} className={`w-1.5 h-1.5 rounded-full ${memberColorMap.get(uid) ?? 'bg-neutral-300'}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-2xl">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-card-sm border border-neutral-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">{selectedDateLabel} 인증 기록</h2>
            {selectedDay && selectedRecords.length > 0 && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/day/${monthStr}-${String(selectedDay).padStart(2, '0')}`)}
                className="text-xs text-primary font-semibold"
              >
                전체 보기
              </button>
            )}
          </div>

          {selectedRecords.length === 0 ? (
            <p className="text-sm text-neutral-400 py-6 text-center">이 날짜에는 인증 기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {selectedRecords.slice(0, 3).map((record) => {
                const member = members.find((m) => m.id === record.userId);
                const distance = record.manualDistanceKm ?? record.distanceKm;
                const color = memberColorMap.get(record.userId) ?? 'bg-neutral-300';
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/records/${record.id}`)}
                    className="w-full text-left rounded-2xl border border-neutral-100 bg-surface px-3 py-2.5 flex items-center gap-3 hover:bg-neutral-100 transition-colors"
                  >
                    {member?.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.profileImageUrl} alt={member.nickname} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className={`w-8 h-8 rounded-full text-white text-xs font-semibold inline-flex items-center justify-center ${color}`}>
                        {getInitials(member?.nickname ?? '?')}
                      </span>
                    )}
                    <span className="flex-1 text-sm text-neutral-800 font-medium">{member?.nickname ?? '알 수 없음'}</span>
                    <span className="text-sm font-bold text-primary">{distance != null ? `${distance.toFixed(2)}km` : '-'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {members.length > 0 && (
        <div className="bg-white rounded-3xl shadow-card-sm border border-neutral-100 p-4 mb-1">
          <p className="text-xs text-neutral-400 mb-2">팀원</p>
          <div className="flex flex-wrap gap-2.5">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2">
                {m.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.profileImageUrl} alt={m.nickname} className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-sm" />
                ) : (
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${MEMBER_COLORS[i % MEMBER_COLORS.length]}`}>
                    {getInitials(m.nickname)}
                  </span>
                )}
                <span className="text-xs text-neutral-600 max-w-[80px] truncate">{m.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
