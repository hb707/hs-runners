'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import type { RunRecord } from '@/types';

type UploadState = 'idle' | 'analyzing' | 'analyzed' | 'saving' | 'success' | 'failed';

interface AnalyzeResult {
  imageUrl: string;
  distanceKm: number | null;
  recordedDate: string | null;
  visionRaw: string | null;
  visionConfidence: string;
}

const STEPS = [
  { key: 'select', label: '사진선택' },
  { key: 'analyzing', label: '분석중' },
  { key: 'input', label: '정보입력' },
  { key: 'done', label: '완료' },
];

function getStepIndex(state: UploadState): number {
  if (state === 'idle' || state === 'failed') return 0;
  if (state === 'analyzing') return 1;
  if (state === 'analyzed' || state === 'saving') return 2;
  return 3; // success
}

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [analyzed, setAnalyzed] = useState<AnalyzeResult | null>(null);
  const [kmInput, setKmInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [result, setResult] = useState<RunRecord | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setState('idle');
    setAnalyzed(null);
    setResult(null);
    setError('');
  }

  async function handleAnalyze() {
    if (!file) return;
    setState('analyzing');
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post<{ success: boolean; data: AnalyzeResult }>('/records/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data.data;
      setAnalyzed(data);
      setKmInput(data.distanceKm != null ? String(data.distanceKm) : '');
      setDateInput(data.recordedDate ?? new Date().toISOString().slice(0, 10));
      setState('analyzed');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? '분석에 실패했습니다';
      setError(msg);
      setState('failed');
    }
  }

  async function handleSave() {
    if (!analyzed) return;
    setState('saving');
    setError('');

    const distanceKm = kmInput.trim() ? parseFloat(kmInput) : null;
    const recordedAt = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    try {
      const res = await api.post<{ success: boolean; data: RunRecord }>('/records', {
        imageUrl: analyzed.imageUrl,
        distanceKm: distanceKm != null && !isNaN(distanceKm) ? distanceKm : null,
        recordedAt,
        visionRaw: analyzed.visionRaw,
        visionConfidence: analyzed.visionConfidence,
      });
      setResult(res.data.data);
      setState('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? '저장에 실패했습니다';
      setError(msg);
      setState('analyzed');
    }
  }

  const effectiveKm = result?.manualDistanceKm ?? result?.distanceKm;
  const stepIndex = getStepIndex(state);

  return (
    <div className="min-h-screen bg-surface flex flex-col px-4 py-5">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = index === stepIndex;
            const isDone = index < stepIndex;
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-semibold ${
                      isDone
                        ? 'bg-primary text-white'
                        : isActive
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </span>
                  <span className={`text-[11px] ${isActive ? 'text-primary font-semibold' : 'text-neutral-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index !== STEPS.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-2 ${index < stepIndex ? 'bg-primary' : 'bg-neutral-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center py-5 gap-4">
        <div
          onClick={() => (state === 'idle' || state === 'failed') ? inputRef.current?.click() : undefined}
          className={`relative w-full aspect-[4/5] max-h-[52vh] bg-white rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 overflow-hidden shadow-sm ${
            state === 'idle' || state === 'failed' ? 'cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors' : ''
          }`}
        >
          {preview ? (
            <Image src={preview} alt="preview" fill className="object-contain" />
          ) : (
            <div className="flex flex-col items-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-neutral-800">러닝 기록 이미지를 업로드하세요</p>
              <p className="text-xs text-neutral-500 mt-1">트래킹 앱 캡처 또는 워치 기록 사진을 권장해요</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Analyzed: editable form */}
        {state === 'analyzed' && analyzed && (
          <div className="w-full space-y-3 bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-sm font-medium text-neutral-700">러닝 날짜</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full max-w-full appearance-none border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-surface"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-700">거리 (km)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={kmInput}
                onChange={(e) => setKmInput(e.target.value)}
                placeholder="예: 5.23"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-surface"
              />
            </div>
            {analyzed.visionConfidence === 'failed' && (
              <p className="text-xs text-warning">사진에서 정보를 자동 인식하지 못했습니다. 직접 입력해주세요.</p>
            )}
          </div>
        )}

        {/* Success result */}
        {state === 'success' && result && (
          <div className="w-full p-5 bg-gradient-to-b from-primary/10 to-primary/5 rounded-2xl border border-primary/20 text-center">
            {effectiveKm != null ? (
              <>
                <div className="inline-flex items-center gap-1 text-primary mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold">인증 완료</span>
                </div>
                <p className="text-5xl font-black tracking-tight text-primary">{effectiveKm.toFixed(2)}</p>
                <p className="text-lg font-bold text-primary -mt-1">km</p>
                <p className="text-sm text-neutral-600 mt-2">오늘도 훌륭한 러닝이었어요!</p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-neutral-700">기록이 저장되었습니다</p>
                <p className="text-sm text-neutral-500 mt-1">거리 정보 없이 저장되었어요.</p>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="text-danger text-sm text-center">{error}</p>
        )}

        {/* Actions */}
        <div className="w-full space-y-3">
          {state === 'idle' && (
            <button
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors shadow-md"
            >
              분석하기
            </button>
          )}

          {state === 'analyzing' && (
            <button disabled className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold opacity-70">
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                분석 중...
              </span>
            </button>
          )}

          {state === 'analyzed' && (
            <button
              onClick={handleSave}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors shadow-md"
            >
              인증하기
            </button>
          )}

          {state === 'saving' && (
            <button disabled className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold opacity-70">
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                저장 중...
              </span>
            </button>
          )}

          {state === 'failed' && (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors shadow-md"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
