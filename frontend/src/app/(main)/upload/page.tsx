'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle2, Sparkles, MapPin, CalendarDays } from 'lucide-react';
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
  return 3;
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
  const isLoading = state === 'analyzing' || state === 'saving';

  return (
    <div style={{
      backgroundColor: '#0D0D10',
      minHeight: '100%',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute',
        top: '-80px',
        right: '-60px',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,0,0.14) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '100px',
        left: '-100px',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,0,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ padding: '22px 22px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <p style={{
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#FF6B00',
            fontWeight: 700,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            TEAM RUNNER
          </p>
          {/* Step pills */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {STEPS.map((step, index) => (
              <div key={step.key} style={{
                height: '6px',
                width: index === stepIndex ? '22px' : '6px',
                borderRadius: '3px',
                backgroundColor: index < stepIndex ? '#FF6B00' : index === stepIndex ? '#FF6B00' : '#252530',
                opacity: index < stepIndex ? 0.5 : 1,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            ))}
          </div>
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 900,
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          transition: 'all 0.3s ease',
        }}>
          {state === 'success' ? '인증 완료!' : state === 'analyzed' ? '정보 확인' : '오늘의 러닝'}
        </h1>
        <p style={{ fontSize: '13px', color: '#5A5A72', marginTop: '3px' }}>
          {state === 'success'
            ? '훌륭한 러닝이었어요'
            : state === 'analyzed'
              ? 'AI가 인식한 정보를 확인하세요'
              : '러닝 기록 사진을 올려주세요'}
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 22px',
        gap: '14px',
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
      }}>
        {/* Upload / preview zone */}
        {state !== 'success' && (
          <div
            onClick={() => (state === 'idle' || state === 'failed') ? inputRef.current?.click() : undefined}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/5',
              maxHeight: '48vh',
              borderRadius: '26px',
              overflow: 'hidden',
              cursor: (state === 'idle' || state === 'failed') ? 'pointer' : 'default',
              backgroundColor: '#16161C',
              border: preview
                ? '1.5px solid #252530'
                : state === 'failed'
                  ? '1.5px dashed rgba(239,68,68,0.5)'
                  : '1.5px dashed rgba(255,107,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {preview ? (
              <Image src={preview} alt="preview" fill style={{ objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '32px 24px' }}>
                {/* Concentric ring icon */}
                <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,107,0,0.15)',
                    animation: 'upload-ring-pulse 2.8s ease-in-out infinite',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,107,0,0.28)',
                    animation: 'upload-ring-pulse 2.8s ease-in-out infinite 0.5s',
                  }} />
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,107,0,0.18) 0%, rgba(255,107,0,0.06) 100%)',
                    border: '1.5px solid rgba(255,107,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Camera style={{ width: '30px', height: '30px', color: '#FF6B00' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#E8E8F0', marginBottom: '5px' }}>
                    {state === 'failed' ? '업로드 실패' : '러닝 기록 이미지 업로드'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#5A5A72', lineHeight: 1.5 }}>
                    {state === 'failed'
                      ? '사진을 다시 선택해주세요'
                      : '트래킹 앱 캡처 또는\n워치 기록 사진을 권장해요'}
                  </p>
                </div>
              </div>
            )}

            {/* Analyzing overlay */}
            {state === 'analyzing' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(13,13,16,0.88)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '18px',
              }}>
                <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,107,0,0.15)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: '#FF6B00',
                    animation: 'spin 0.9s linear infinite',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '12px',
                    borderRadius: '50%',
                    background: 'rgba(255,107,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Sparkles style={{ width: '18px', height: '18px', color: '#FF6B00' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#E8E8F0' }}>AI 분석 중...</p>
                  <p style={{ fontSize: '12px', color: '#5A5A72', marginTop: '3px' }}>거리와 날짜를 읽고 있어요</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success screen */}
        {state === 'success' && result && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0',
            animation: 'upload-fade-up 0.5s ease',
            gap: '6px',
          }}>
            <div style={{
              position: 'relative',
              width: '230px',
              height: '230px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* Outer glow ring */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '1.5px solid rgba(255,107,0,0.25)',
                animation: 'upload-ring-pulse 2.2s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                inset: '14px',
                borderRadius: '50%',
                border: '1px solid rgba(255,107,0,0.15)',
              }} />
              {/* Inner circle */}
              <div style={{
                width: '170px',
                height: '170px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 40%, rgba(255,107,0,0.18) 0%, rgba(255,107,0,0.04) 100%)',
                border: '1.5px solid rgba(255,107,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'upload-glow-pulse 2.5s ease-in-out infinite',
              }}>
                {effectiveKm != null ? (
                  <>
                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '68px',
                      fontWeight: 900,
                      color: '#FF6B00',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      animation: 'upload-km-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}>
                      {effectiveKm.toFixed(2)}
                    </p>
                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'rgba(255,107,0,0.75)',
                      letterSpacing: '0.12em',
                      marginTop: '-4px',
                    }}>KM</p>
                  </>
                ) : (
                  <CheckCircle2 style={{ width: '48px', height: '48px', color: '#FF6B00' }} />
                )}
              </div>
            </div>

            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#E8E8F0',
              marginTop: '10px',
            }}>
              인증 완료!
            </p>
            <p style={{ fontSize: '14px', color: '#5A5A72' }}>오늘도 훌륭한 러닝이었어요</p>
          </div>
        )}

        {/* Analyzed form */}
        {state === 'analyzed' && analyzed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'upload-fade-up 0.4s ease' }}>
            {analyzed.visionConfidence !== 'failed' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '11px 15px',
                backgroundColor: 'rgba(255,107,0,0.08)',
                borderRadius: '14px',
                border: '1px solid rgba(255,107,0,0.2)',
              }}>
                <Sparkles style={{ width: '14px', height: '14px', color: '#FF6B00', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: 'rgba(255,140,50,0.95)', fontWeight: 600, lineHeight: 1.4 }}>
                  AI가 자동으로 정보를 인식했어요. 확인 후 인증하세요.
                </p>
              </div>
            )}

            <div style={{
              backgroundColor: '#16161C',
              borderRadius: '20px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid #252530',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5A5A72',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <CalendarDays style={{ width: '11px', height: '11px' }} />
                  러닝 날짜
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    border: '1.5px solid #2C2C38',
                    borderRadius: '13px',
                    padding: '13px 15px',
                    fontSize: '15px',
                    fontWeight: 600,
                    background: '#0D0D10',
                    color: '#E8E8F0',
                    outline: 'none',
                    boxSizing: 'border-box',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              <div style={{ height: '1px', backgroundColor: '#252530' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5A5A72',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <MapPin style={{ width: '11px', height: '11px' }} />
                  거리 (km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={kmInput}
                  onChange={(e) => setKmInput(e.target.value)}
                  placeholder="예: 5.23"
                  style={{
                    width: '100%',
                    border: '1.5px solid #2C2C38',
                    borderRadius: '13px',
                    padding: '13px 15px',
                    fontSize: '15px',
                    fontWeight: 600,
                    background: '#0D0D10',
                    color: '#E8E8F0',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {analyzed.visionConfidence === 'failed' && (
              <p style={{ fontSize: '12px', color: '#F59E0B', textAlign: 'center' }}>
                사진에서 정보를 자동 인식하지 못했습니다. 직접 입력해주세요.
              </p>
            )}
          </div>
        )}

        {error && (
          <p style={{ fontSize: '13px', color: '#EF4444', textAlign: 'center' }}>{error}</p>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '8px 22px 32px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
        {(state === 'idle' || state === 'failed') && (
          <button
            onClick={state === 'failed' ? () => inputRef.current?.click() : handleAnalyze}
            disabled={state === 'idle' && !file}
            style={{
              width: '100%',
              padding: '18px',
              background: (state === 'failed' || file)
                ? 'linear-gradient(135deg, #FF6B00 0%, #FF8C1A 100%)'
                : '#1E1E28',
              border: 'none',
              borderRadius: '18px',
              fontSize: '17px',
              fontWeight: 800,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.07em',
              color: (state === 'failed' || file) ? '#FFFFFF' : '#3A3A4A',
              cursor: (state === 'failed' || file) ? 'pointer' : 'not-allowed',
              boxShadow: (state === 'failed' || file) ? '0 10px 28px rgba(255,107,0,0.38)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            {state === 'failed' ? '다시 시도' : file ? 'AI로 분석하기' : '사진을 선택하세요'}
          </button>
        )}

        {isLoading && (
          <button disabled style={{
            width: '100%',
            padding: '18px',
            background: 'linear-gradient(135deg, rgba(255,107,0,0.55) 0%, rgba(255,140,26,0.55) 100%)',
            border: 'none',
            borderRadius: '18px',
            fontSize: '17px',
            fontWeight: 800,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.07em',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}>
            <span style={{
              width: '17px',
              height: '17px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#FFFFFF',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
              flexShrink: 0,
            }} />
            {state === 'analyzing' ? '분석 중...' : '저장 중...'}
          </button>
        )}

        {state === 'analyzed' && (
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C1A 100%)',
              border: 'none',
              borderRadius: '18px',
              fontSize: '17px',
              fontWeight: 800,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.07em',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 10px 28px rgba(255,107,0,0.38)',
            }}
          >
            인증하기
          </button>
        )}

        {state === 'success' && (
          <a
            href="/dashboard"
            style={{
              display: 'block',
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C1A 100%)',
              border: 'none',
              borderRadius: '18px',
              fontSize: '17px',
              fontWeight: 800,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.07em',
              color: '#FFFFFF',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 10px 28px rgba(255,107,0,0.38)',
              boxSizing: 'border-box',
            }}
          >
            인증현황 보기
          </a>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
