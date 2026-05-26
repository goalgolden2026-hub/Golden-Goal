/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/portfolio',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/stake',
        destination: '/rewards/staking',
        permanent: true,
      },
      {
        source: '/spin',
        destination: '/rewards/reward-box',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
