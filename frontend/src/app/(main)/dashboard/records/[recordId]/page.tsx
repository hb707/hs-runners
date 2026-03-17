'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import type { RunRecord } from '@/types';

export default function RecordDetailPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const [record, setRecord] = useState<RunRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get<{ success: boolean; data: RunRecord }>(`/records/${recordId}`)
      .then((res) => setRecord(res.data.data))
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoading(false));
  }, [recordId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', backgroundColor: '#0D0D10' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  if (!record) return null;

  const distance = record.manualDistanceKm ?? record.distanceKm;
  const imageUrl = record.imageUrl;
  const recordDate = new Date(record.recordedAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  const confidenceColor = record.visionConfidence === 'high' ? '#34D399'
    : record.visionConfidence === 'medium' || record.visionConfidence === 'low' ? '#FBBF24'
    : '#EF4444';
  const confidenceLabel = record.visionConfidence === 'high' ? '높음'
    : record.visionConfidence === 'medium' ? '보통'
    : record.visionConfidence === 'low' ? '낮음' : '실패';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#0D0D10' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #1A1A22' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', color: '#5A5A72', fontSize: '20px', lineHeight: 1 }}>←</button>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 700, color: '#E8E8F0' }}>인증 기록</h1>
      </div>

      {/* Photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="러닝 인증사진" style={{ width: '100%', height: 'auto', display: 'block' }} />

      {/* Info card overlapping photo */}
      <div style={{
        marginTop: '-20px', marginLeft: '16px', marginRight: '16px',
        borderRadius: '20px', backgroundColor: '#16161C',
        border: '1px solid #252530', position: 'relative', zIndex: 10,
        padding: '20px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      }}>
        <p style={{ fontSize: '12px', color: '#5A5A72', marginBottom: '4px' }}>{recordDate}</p>
        {distance !== null && distance !== undefined ? (
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '44px', fontWeight: 900, color: '#FF6B00', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {distance.toFixed(2)} <span style={{ fontSize: '22px', letterSpacing: '0.02em' }}>km</span>
          </p>
        ) : (
          <p style={{ fontSize: '15px', color: '#3A3A4A', marginTop: '4px' }}>거리 정보 없음</p>
        )}

        <div style={{ marginTop: '16px', backgroundColor: '#0D0D10', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#5A5A72' }}>분석 정확도</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: confidenceColor }}>{confidenceLabel}</span>
          </div>
          <div style={{ height: '1px', backgroundColor: '#1A1A22' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#5A5A72' }}>인식된 텍스트</span>
            <span style={{ fontSize: '11px', color: '#C8C8D8', fontFamily: 'monospace' }}>
              {record.visionConfidence === 'failed' ? '-' : (record.visionRaw ?? '-')}
            </span>
          </div>
          {record.manualDistanceKm !== null && (
            <>
              <div style={{ height: '1px', backgroundColor: '#1A1A22' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#5A5A72' }}>수동 입력</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B00' }}>{record.manualDistanceKm} km</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
