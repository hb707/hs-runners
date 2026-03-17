'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import api from '@/lib/api';
import type { RunRecord, User } from '@/types';

const MEMBER_COLORS = [
  '#818CF8', '#F472B6', '#34D399', '#FBBF24',
  '#A78BFA', '#F87171', '#60A5FA', '#FB923C',
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

  const memberColorMap = new Map<string, string>(members.map((m, i) => [m.id, MEMBER_COLORS[i % MEMBER_COLORS.length]]));

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

  const card: React.CSSProperties = {
    backgroundColor: '#16161C', borderRadius: '20px', border: '1px solid #252530', padding: '16px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '14px 16px', gap: '12px', backgroundColor: '#0D0D10', minHeight: '100%' }}>
      {/* Calendar card */}
      <div style={card}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#5A5A72' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays style={{ width: '16px', height: '16px', color: '#FF6B00' }} />
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: '#E8E8F0', letterSpacing: '-0.01em' }}>
              {year}년 {month}월
            </h1>
          </div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#5A5A72' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} style={{ fontSize: '11px', color: '#3A3A4A', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
          {calendarCells.map((day, idx) => {
            if (!day) return <div key={`blank-${idx}`} style={{ height: '46px' }} />;

            const dayRecords = recordsByDay.get(day) ?? [];
            const uniqueUsers = [...new Set(dayRecords.map((r) => r.userId))];
            const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
            const isSelected = selectedDay === day;
            const hasRecords = dayRecords.length > 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                style={{
                  height: '46px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer',
                  borderRadius: '10px', transition: 'background 0.15s',
                }}
              >
                <span style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: isSelected || isToday ? 700 : 400,
                  backgroundColor: isSelected ? '#FF6B00' : isToday ? 'rgba(255,107,0,0.15)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : isToday ? '#FF6B00' : hasRecords ? '#E8E8F0' : '#5A5A72',
                }}>
                  {day}
                </span>
                <span style={{ display: 'flex', gap: '2px', height: '5px', alignItems: 'center' }}>
                  {uniqueUsers.slice(0, 3).map((uid) => (
                    <span key={uid} style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: memberColorMap.get(uid) ?? '#3A3A4A' }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day records */}
      {loading ? (
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        </div>
      ) : (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#E8E8F0' }}>{selectedDateLabel} 인증 기록</h2>
            {selectedDay && selectedRecords.length > 0 && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/day/${monthStr}-${String(selectedDay).padStart(2, '0')}`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#FF6B00', fontWeight: 700 }}
              >
                전체 보기
              </button>
            )}
          </div>

          {selectedRecords.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#3A3A4A', textAlign: 'center', padding: '20px 0' }}>이 날짜에는 인증 기록이 없습니다</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedRecords.slice(0, 3).map((record) => {
                const member = members.find((m) => m.id === record.userId);
                const distance = record.manualDistanceKm ?? record.distanceKm;
                const color = memberColorMap.get(record.userId) ?? '#5A5A72';
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/records/${record.id}`)}
                    style={{
                      width: '100%', textAlign: 'left', borderRadius: '14px',
                      border: '1px solid #252530', backgroundColor: '#0D0D10',
                      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', background: 'none',
                    }}
                  >
                    {member?.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.profileImageUrl} alt={member.nickname} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <span style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: color, color: '#0D0D10', fontSize: '11px',
                        fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {getInitials(member?.nickname ?? '?')}
                      </span>
                    )}
                    <span style={{ flex: 1, fontSize: '13px', color: '#C8C8D8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member?.nickname ?? '알 수 없음'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#FF6B00', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em' }}>
                      {distance != null ? `${distance.toFixed(2)}km` : '-'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Team members */}
      {members.length > 0 && (
        <div style={{ ...card, marginBottom: '4px' }}>
          <p style={{ fontSize: '10px', color: '#3A3A4A', marginBottom: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>팀원</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {members.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {m.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.profileImageUrl} alt={m.nickname} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${MEMBER_COLORS[i % MEMBER_COLORS.length]}` }} />
                ) : (
                  <span style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: '#0D0D10', flexShrink: 0,
                  }}>
                    {getInitials(m.nickname)}
                  </span>
                )}
                <span style={{ fontSize: '12px', color: '#5A5A72', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
