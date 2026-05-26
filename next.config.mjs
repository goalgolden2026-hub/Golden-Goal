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
        destination: '/rewards/locking',
        permanent: true,
      },
      {
        source: '/rewards/staking',
        destination: '/rewards/locking',
        permanent: true,
      },
      {
        source: '/spin',
        destination: '/rewards/reward-box',
        permanent: true,
      },
      {
        source: '/api/stake',
        destination: '/api/lock',
        permanent: true,
      },
      {
        source: '/api/unstake',
        destination: '/api/unlock',
        permanent: true,
      },
      {
        source: '/api/stake/stats',
        destination: '/api/lock/stats',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
