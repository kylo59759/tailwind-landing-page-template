/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/review/upload',
        destination: 'http://172.16.1.47:5000/review/upload',
      },
      // 移除 /api/review 的 rewrite，改用自定义 API 路由
      // {
      //   source: '/api/review',
      //   destination: 'http://172.16.1.47:5000/review',
      // },
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
