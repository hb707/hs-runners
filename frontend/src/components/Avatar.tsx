import React from 'react';

export const MEMBER_COLORS = [
  '#818CF8', '#F472B6', '#34D399', '#FBBF24',
  '#A78BFA', '#F87171', '#60A5FA', '#FB923C',
];

function getInitials(nickname: string): string {
  if (!nickname?.trim()) return '?';
  const parts = nickname.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return nickname.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  profileImageUrl?: string | null;
  nickname: string;
  color: string;
  size: number;
  showBorder?: boolean;
}

export default function Avatar({ profileImageUrl, nickname, color, size, showBorder }: AvatarProps) {
  const fontSize = size <= 24 ? '9px' : size <= 28 ? '10px' : size <= 32 ? '11px' : '12px';

  const baseStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
  };

  if (profileImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profileImageUrl}
        alt={nickname}
        style={{
          ...baseStyle,
          objectFit: 'cover',
          border: showBorder ? `2px solid ${color}` : undefined,
        }}
      />
    );
  }

  return (
    <span
      style={{
        ...baseStyle,
        backgroundColor: color,
        color: '#0D0D10',
        fontSize,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {getInitials(nickname)}
    </span>
  );
}
