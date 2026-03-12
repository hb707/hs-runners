import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', hover: '#4338CA' },
        kakao: { DEFAULT: '#FEE500', text: '#191919' },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'app-bg': '#EEF1F8',
        surface: '#F8F9FB',
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2933',
          900: '#111827',
        },
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
        md: '0 4px 12px rgba(15, 23, 42, 0.08)',
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        'card-sm': '0 4px 16px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
