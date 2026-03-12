'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, CalendarDays, BarChart2 } from 'lucide-react';
import TeamHeader from '@/components/TeamHeader';

const tabs = [
  { href: '/upload', Icon: Camera, label: '인증' },
  { href: '/dashboard', Icon: CalendarDays, label: '캘린더' },
  { href: '/dashboard/stats', Icon: BarChart2, label: '통계' },
];

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <TeamHeader />
      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-neutral-100 shadow-sm safe-bottom">
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.Icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center pt-3 pb-3 gap-1 text-xs transition-colors border-t-2 ${
                  isActive
                    ? 'text-primary font-semibold border-primary'
                    : 'text-neutral-400 border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
