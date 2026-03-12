'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!record) return null;

  const distance = record.manualDistanceKm ?? record.distanceKm;
  const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${record.imageUrl}`;
  const recordDate = new Date(record.recordedAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <div className="flex items-center px-4 py-4 border-b bg-white">
        <button onClick={() => router.back()} className="mr-3 text-neutral-500 hover:text-neutral-700">←</button>
        <h1 className="text-base font-bold">인증 기록</h1>
      </div>

      <div className="relative w-full aspect-square bg-neutral-100">
        <Image
          src={imageUrl}
          alt="러닝 인증사진"
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* 정보 카드 오버레이 */}
      <div className="-mt-6 mx-4 rounded-t-2xl bg-white shadow-card overflow-hidden relative z-10">
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm text-neutral-400">{recordDate}</p>
            {distance !== null && distance !== undefined ? (
              <p className="text-4xl font-bold text-primary mt-1">{distance.toFixed(2)} km</p>
            ) : (
              <p className="text-base text-neutral-400 mt-1">거리 정보 없음</p>
            )}
          </div>

          <div className="bg-surface rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">분석 정확도</span>
            <span className={`font-semibold ${
              record.visionConfidence === 'high' ? 'text-success' :
              record.visionConfidence === 'medium' ? 'text-warning' :
              record.visionConfidence === 'low' ? 'text-warning' :
              'text-danger'
            }`}>
              {record.visionConfidence === 'high' ? '높음' :
               record.visionConfidence === 'medium' ? '보통' :
               record.visionConfidence === 'low' ? '낮음' : '실패'}
            </span>
          </div>
          {record.visionRaw && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">인식된 텍스트</span>
              <span className="text-neutral-700 font-mono text-xs">{record.visionRaw}</span>
            </div>
          )}
          {record.manualDistanceKm !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">수동 입력</span>
              <span className="text-primary font-semibold">{record.manualDistanceKm} km</span>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
