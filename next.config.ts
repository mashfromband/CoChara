const nextConfig = {
  // 開発環境での二重ログを避けるために Strict Mode を無効化
  // 本番ビルドには影響しません
  reactStrictMode: false,
  
  // 画像最適化の設定
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
