'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import type { RunRecord, User } from '@/types';

function getInitials(nickname: string) {
  return nickname.slice(0, 1).toUpperCase();
}

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const [records, setRecords] = useState<RunRecord[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // date is YYYY-MM-DD
  const month = date?.slice(0, 7); // YYYY-MM

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: RunRecord[] }>(`/records/team?month=${month}`),
      api.get<{ success: boolean; data: User[] }>('/users/team'),
    ])
      .then(([recRes, usersRes]) => {
        const dayRecords = recRes.data.data.filter((r) => r.recordedAt.startsWith(date));
        setRecords(dayRecords);
        setMembers(usersRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date, month]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const displayDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
      })
    : '';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex items-center px-4 py-4 border-b">
        <button onClick={() => router.back()} className="mr-3 text-gray-500 text-lg">←</button>
        <h1 className="text-base font-bold">{displayDate}</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">이 날의 기록이 없습니다</p>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          {records.map((record) => {
            const member = memberMap.get(record.userId);
            const distance = record.manualDistanceKm ?? record.distanceKm;
            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${record.imageUrl}`;

            return (
              <div
                key={record.id}
                onClick={() => router.push(`/dashboard/records/${record.id}`)}
                className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors shadow-sm"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="러닝 사진" className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                      {member?.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.profileImageUrl} alt={member.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-primary">{getInitials(member?.nickname ?? '?')}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium truncate text-neutral-800">{member?.nickname ?? '알 수 없음'}</span>
                  </div>
                  {distance != null ? (
                    <p className="text-lg font-bold text-primary">{distance.toFixed(2)} km</p>
                  ) : (
                    <p className="text-sm text-neutral-400">거리 정보 없음</p>
                  )}
                </div>

                <span className="text-neutral-300 text-lg flex-shrink-0">›</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
