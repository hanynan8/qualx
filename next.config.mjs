/** @type {import('next').NextConfig} */
const nextConfig = {
  // الصفحة فعليًا في /solutions، لكن لسه فيه روابط (الرئيسية، الفوتر، الـ seed)
  // بتشاور على /services — نحوّلها بدل ما تدي 404.
  async redirects() {
    return [
      { source: "/services", destination: "/solutions", permanent: false },
      { source: "/services/:slug", destination: "/solutions/:slug", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
    ],
  },
};

export default nextConfig;