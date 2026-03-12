export type UserRole = 'master_admin' | 'team_admin' | 'user';
export type VisionConfidence = 'high' | 'medium' | 'low' | 'failed';

export interface User {
  id: string;
  kakaoId: string;
  nickname: string;
  profileImageUrl: string;
  role: UserRole;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  adminUserId: string;
  weeklyRequiredCount: number;
  fineAmountPerShortfall: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationCode {
  id: string;
  code: string;
  teamId: string;
  createdBy: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface RunRecord {
  id: string;
  userId: string;
  teamId: string;
  imageUrl: string;
  distanceKm: number | null;
  visionRaw: string | null;
  visionConfidence: VisionConfidence;
  manualDistanceKm: number | null;
  recordedAt: string;
  weekNumber: string;
  createdAt: string;
}

export interface Fine {
  id: string;
  userId: string;
  teamId: string;
  weekNumber: string;
  requiredCount: number;
  actualCount: number;
  shortfall: number;
  fineAmountPerShortfall: number;
  totalFine: number;
  isPaid: boolean;
  paidAt: string | null;
  confirmedBy: string | null;
  createdAt: string;
}

export interface DataStore {
  users: User[];
  teams: Team[];
  invitationCodes: InvitationCode[];
  records: RunRecord[];
  fines: Fine[];
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  teamId: string | null;
}

export interface OnboardingTokenPayload {
  kakaoId: string;
  nickname: string;
  profileImageUrl: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
