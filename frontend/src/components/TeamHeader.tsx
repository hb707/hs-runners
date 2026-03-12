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
    <div className="px-4 py-3 border-b border-neutral-100 bg-white flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <Activity className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={2} />
        <span className="font-semibold text-base text-neutral-800 truncate">{team.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full font-medium">
          {memberCount}명
        </span>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="p-0.5 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all"
            aria-label="프로필 메뉴"
          >
            {user?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImageUrl} alt="프로필" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <UserCircle className="w-7 h-7 text-neutral-500" strokeWidth={2} />
            )}
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-card border border-neutral-100 min-w-[130px] z-50">
              <button
                type="button"
                onClick={() => { setShowMenu(false); router.push('/profile'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <UserIcon className="w-4 h-4" strokeWidth={2} />
                프로필
              </button>
              <button
                type="button"
                onClick={() => { setShowMenu(false); logout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
