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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#0D0D10' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #1A1A22' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', color: '#5A5A72', fontSize: '20px', lineHeight: 1 }}>←</button>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 700, color: '#E8E8F0' }}>{displayDate}</h1>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        </div>
      ) : records.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#3A3A4A', fontSize: '14px' }}>이 날의 기록이 없습니다</p>
        </div>
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {records.map((record) => {
            const member = memberMap.get(record.userId);
            const distance = record.manualDistanceKm ?? record.distanceKm;
            const imageUrl = record.imageUrl;

            return (
              <div
                key={record.id}
                onClick={() => router.push(`/dashboard/records/${record.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  backgroundColor: '#16161C', border: '1px solid #252530', borderRadius: '16px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#252530', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="러닝 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {member?.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.profileImageUrl} alt={member.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF6B00' }}>{getInitials(member?.nickname ?? '?')}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#C8C8D8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member?.nickname ?? '알 수 없음'}
                    </span>
                  </div>
                  {distance != null ? (
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: '#FF6B00', lineHeight: 1 }}>{distance.toFixed(2)} km</p>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#3A3A4A' }}>거리 정보 없음</p>
                  )}
                </div>

                <span style={{ color: '#3A3A4A', fontSize: '18px', flexShrink: 0 }}>›</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
