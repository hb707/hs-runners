'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Team, Fine, User } from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api';

function adminAxios(token: string) {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── 로그인 화면 ──────────────────────────────────────────────
function AdminLoginForm({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post<{ success: boolean; data: { accessToken: string } }>(
        `${API_BASE}/auth/admin`,
        { code },
      );
      onSuccess(res.data.data.accessToken);
    } catch {
      setError('잘못된 어드민 코드입니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <h1 className="text-xl font-bold mb-2">관리자 접속</h1>
      <p className="text-sm text-gray-400 mb-8">어드민 코드를 입력하세요</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <input
          type="password"
          placeholder="어드민 코드"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !code}
          className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {loading ? '확인 중...' : '접속하기'}
        </button>
      </form>
    </div>
  );
}

// ── 어드민 대시보드 ──────────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const api = adminAxios(token);

  const [teams, setTeams] = useState<Team[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [tab, setTab] = useState<'team' | 'codes' | 'fines'>('team');
  const [loading, setLoading] = useState(true);

  // 팀 생성 폼
  const [teamName, setTeamName] = useState('');
  const [weeklyCount, setWeeklyCount] = useState(3);
  const [fineAmount, setFineAmount] = useState(5000);
  const [creating, setCreating] = useState(false);

  // 초대코드
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // 벌금 탭 팀 선택
  const [fineTeamId, setFineTeamId] = useState('');

  useEffect(() => {
    api.get<{ success: boolean; data: Team[] }>('/teams')
      .then((res) => {
        setTeams(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedTeamId(res.data.data[0].id);
          setFineTeamId(res.data.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!fineTeamId) return;
    Promise.all([
      api.get<{ success: boolean; data: Fine[] }>(`/fines/team/${fineTeamId}`)
        .then((res) => setFines(res.data.data)),
      api.get<{ success: boolean; data: User[] }>(`/teams/${fineTeamId}/members`)
        .then((res) => setMembers(res.data.data)),
    ]);
  }, [fineTeamId]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post<{ success: boolean; data: Team }>('/teams', {
        name: teamName,
        weeklyRequiredCount: weeklyCount,
        fineAmountPerShortfall: fineAmount,
      });
      const newTeam = res.data.data;
      setTeams((prev) => [...prev, newTeam]);
      setTeamName('');
      if (!selectedTeamId) setSelectedTeamId(newTeam.id);
      if (!fineTeamId) setFineTeamId(newTeam.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerateCode() {
    if (!selectedTeamId) return;
    try {
      const res = await api.post<{ success: boolean; data: { code: string } }>(
        `/teams/${selectedTeamId}/invitation-codes`,
        { expiresInDays: 30 },
      );
      setGeneratedCode(res.data.data.code);
      setCopiedCode(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown } };
      console.error('[초대코드 발급 실패]', axiosErr.response?.data ?? err);
    }
  }

  async function handleMarkPaid(fineId: string) {
    try {
      const res = await api.patch<{ success: boolean; data: Fine }>(`/fines/${fineId}/paid`);
      setFines((prev) => prev.map((f) => (f.id === fineId ? res.data.data : f)));
    } catch (err) {
      console.error(err);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const memberNicknameMap = new Map(members.map((m) => [m.id, m.nickname]));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h1 className="text-base font-bold">관리자</h1>
        <button
          onClick={onLogout}
          className="text-xs text-gray-400 underline"
        >
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b">
        {[
          { key: 'team', label: '팀 관리' },
          { key: 'codes', label: '초대코드' },
          { key: 'fines', label: '벌금 관리' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-3 text-sm transition-colors ${
              tab === t.key ? 'border-b-2 border-primary font-medium text-primary' : 'text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-4">
        {/* 팀 관리 */}
        {tab === 'team' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateTeam} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h2 className="font-medium text-sm">새 팀 만들기</h2>
              <input
                type="text"
                placeholder="팀 이름"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">주간 인증 횟수</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={weeklyCount}
                    onChange={(e) => setWeeklyCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">회당 벌금 (원)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={fineAmount}
                    onChange={(e) => setFineAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating || !teamName}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {creating ? '생성 중...' : '팀 만들기'}
              </button>
            </form>

            <div className="space-y-2">
              {teams.map((team) => (
                <div key={team.id} className="border border-gray-100 rounded-xl p-4">
                  <p className="font-medium">{team.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    주 {team.weeklyRequiredCount}회 · 벌금 {team.fineAmountPerShortfall.toLocaleString()}원/회
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 초대코드 */}
        {tab === 'codes' && (
          <div className="space-y-4">
            {teams.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">먼저 팀을 생성하세요</p>
            ) : (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">팀 선택</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => {
                      setSelectedTeamId(e.target.value);
                      setGeneratedCode('');
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerateCode}
                  disabled={!selectedTeamId}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  초대코드 발급하기
                </button>

                {generatedCode && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-indigo-500 mb-1">
                      {teams.find((t) => t.id === selectedTeamId)?.name} · 30일 유효
                    </p>
                    <p className="text-2xl font-bold font-mono tracking-widest text-indigo-700">
                      {generatedCode}
                    </p>
                    <button
                      onClick={() => copyCode(generatedCode)}
                      className="mt-3 text-sm text-indigo-500 underline"
                    >
                      {copiedCode ? '복사됨!' : '클립보드에 복사'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 벌금 관리 */}
        {tab === 'fines' && (
          <div className="space-y-4">
            {teams.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">팀 선택</label>
                <select
                  value={fineTeamId}
                  onChange={(e) => setFineTeamId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              {fines.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">벌금 내역이 없습니다</p>
              ) : (
                fines.map((fine) => (
                  <div
                    key={fine.id}
                    className={`border rounded-xl p-4 ${fine.isPaid ? 'border-gray-100 opacity-60' : 'border-red-100 bg-red-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {memberNicknameMap.get(fine.userId) ?? fine.userId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fine.weekNumber} · {fine.shortfall}회 미달
                        </p>
                        <p className="text-sm font-bold text-red-500 mt-1">
                          {fine.totalFine.toLocaleString()}원
                        </p>
                      </div>
                      {!fine.isPaid ? (
                        <button
                          onClick={() => handleMarkPaid(fine.id)}
                          className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg font-medium"
                        >
                          납부 확인
                        </button>
                      ) : (
                        <span className="text-xs text-green-500 font-medium">납부 완료</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (stored) setAdminToken(stored);
  }, []);

  function handleLoginSuccess(token: string) {
    localStorage.setItem('admin_token', token);
    setAdminToken(token);
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
  }

  if (!adminToken) {
    return <AdminLoginForm onSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard token={adminToken} onLogout={handleLogout} />;
}
