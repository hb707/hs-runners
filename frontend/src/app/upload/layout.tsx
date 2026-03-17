'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, CalendarDays, BarChart2 } from 'lucide-react';

const tabs = [
  { href: '/upload', Icon: Camera, label: '인증' },
  { href: '/dashboard', Icon: CalendarDays, label: '캘린더' },
  { href: '/dashboard/stats', Icon: BarChart2, label: '통계' },
];

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#0D0D10' }}>
      <main style={{ flex: 1, paddingBottom: '64px' }}>{children}</main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#16161C',
        borderTop: '1px solid #252530',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex' }}>
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.Icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#FF6B00' : '#5A5A72',
                  textDecoration: 'none',
                  borderTop: `2px solid ${isActive ? '#FF6B00' : 'transparent'}`,
                  transition: 'color 0.2s ease',
                }}
              >
                <Icon style={{ width: '20px', height: '20px' }} strokeWidth={isActive ? 2.5 : 1.8} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
