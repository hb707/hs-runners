import { Activity } from 'lucide-react';

export default function LoginPage() {
  const kakaoLoginUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/kakao`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      backgroundColor: '#0D0D10',
      padding: '0 28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Speed lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '240px', overflow: 'hidden', pointerEvents: 'none' }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${18 + i * 30}px`,
            left: '-10%',
            width: `${42 + i * 10}%`,
            height: '1px',
            background: `linear-gradient(90deg, transparent, rgba(255,107,0,${0.07 + i * 0.02}), transparent)`,
            transform: 'rotate(-6deg)',
          }} />
        ))}
        <div style={{
          position: 'absolute', top: '-60px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '48px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px',
            background: 'rgba(255,107,0,0.1)', border: '1.5px solid rgba(255,107,0,0.28)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
          }}>
            <Activity style={{ width: '32px', height: '32px', color: '#FF6B00' }} strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '52px', fontWeight: 900, letterSpacing: '-0.02em',
            lineHeight: 1, color: '#E8E8F0', marginBottom: '12px',
          }}>
            TEAM<br /><span style={{ color: '#FF6B00' }}>RUNNER</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#5A5A72', lineHeight: 1.6 }}>
            팀과 함께 달리고<br />기록을 인증하세요
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href={kakaoLoginUrl} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '17px', backgroundColor: '#FEE500', borderRadius: '16px',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px',
            fontWeight: 700, letterSpacing: '0.04em', color: '#191919',
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(254,229,0,0.2)',
          }}>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 0.5C4.305 0.5 0.5 3.467 0.5 7.1c0 2.34 1.554 4.393 3.9 5.565L3.4 16.2c-.052.188.124.355.294.243l4.2-2.793A10.637 10.637 0 009 13.7c4.695 0 8.5-2.967 8.5-6.6S13.695.5 9 .5z" fill="#191919"/>
            </svg>
            카카오로 시작하기
          </a>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#3A3A4A' }}>
            로그인 시 서비스 이용약관에 동의하게 됩니다
          </p>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)',
        width: '280px', height: '160px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,107,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
