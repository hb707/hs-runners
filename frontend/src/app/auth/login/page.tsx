import { Activity } from 'lucide-react';

export default function LoginPage() {
  const kakaoLoginUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/kakao`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-surface bg-[linear-gradient(180deg,rgba(248,249,251,0)_0%,rgba(79,70,229,0.04)_100%)]">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Activity className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">팀 러너</h1>
          <p className="mt-2 text-neutral-500 text-sm">팀과 함께 달리고, 기록을 인증하세요</p>
        </div>

        <a
          href={kakaoLoginUrl}
          className="flex items-center justify-center gap-3 w-full py-4 px-4 bg-kakao rounded-xl font-semibold text-kakao-text hover:bg-kakao/90 transition-colors shadow-md"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9 0.5C4.305 0.5 0.5 3.467 0.5 7.1c0 2.34 1.554 4.393 3.9 5.565L3.4 16.2c-.052.188.124.355.294.243l4.2-2.793A10.637 10.637 0 009 13.7c4.695 0 8.5-2.967 8.5-6.6S13.695.5 9 .5z" fill="#191919"/>
          </svg>
          카카오로 시작하기
        </a>

        <p className="text-center text-xs text-neutral-400">
          로그인 시 서비스 이용약관에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
