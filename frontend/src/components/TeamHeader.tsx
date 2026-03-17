'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, UserCircle, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Team, User } from '@/types';

export default function TeamHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.teamId) return;
    Promise.all([
      api.get<{ success: boolean; data: Team }>(`/teams/${user.teamId}`),
      api.get<{ success: boolean; data: User[] }>('/users/team'),
    ])
      .then(([teamRes, membersRes]) => {
        setTeam(teamRes.data.data);
        setMemberCount(membersRes.data.data.length);
      })
      .catch(console.error);
  }, [user?.teamId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  if (!team) return null;

  return (
    <div style={{
      padding: '12px 18px', borderBottom: '1px solid #252530', backgroundColor: '#0D0D10',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <Activity style={{ width: '18px', height: '18px', color: '#FF6B00', flexShrink: 0 }} strokeWidth={2.5} />
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: '17px', color: '#E8E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{team.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span style={{
          fontSize: '11px', color: '#FF6B00', background: 'rgba(255,107,0,0.1)',
          border: '1px solid rgba(255,107,0,0.2)', padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
        }}>
          {memberCount}명
        </span>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            style={{
              padding: '2px', borderRadius: '50%', overflow: 'hidden',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
            aria-label="프로필 메뉴"
          >
            {user?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImageUrl} alt="프로필" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <UserCircle style={{ width: '28px', height: '28px', color: '#5A5A72' }} strokeWidth={2} />
            )}
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              backgroundColor: '#1A1A22', border: '1px solid #252530', borderRadius: '12px',
              minWidth: '130px', zIndex: 50, padding: '4px 0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              <button
                type="button"
                onClick={() => { setShowMenu(false); router.push('/profile'); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', fontSize: '13px', color: '#C8C8D8',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <UserIcon style={{ width: '14px', height: '14px' }} strokeWidth={2} />
                프로필
              </button>
              <button
                type="button"
                onClick={() => { setShowMenu(false); logout(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', fontSize: '13px', color: '#C8C8D8',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <LogOut style={{ width: '14px', height: '14px' }} strokeWidth={2} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
