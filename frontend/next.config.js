/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

module.exports = nextConfig;
