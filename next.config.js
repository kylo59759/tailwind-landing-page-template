/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/review/upload',
        destination: 'http://172.16.1.47:5000/review/upload',
      },
      {
        source: '/api/review',
        destination: 'http://172.16.1.47:5000/review',
      },
      // {
      //   source: '/api/review',
      //   destination: 'http://localhost:5001/',
      // },
      // {
      //   source: '/events',
      //   destination: 'http://localhost:5001/events',
      // },
    ];
  },
};

module.exports = nextConfig;
