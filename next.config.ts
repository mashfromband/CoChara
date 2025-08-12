const nextConfig = {
  // 開発環境での二重ログを避けるために Strict Mode を無効化
  // 本番ビルドには影響しません
  reactStrictMode: false,
  
  // 画像最適化の設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**', // すべてのパスを許可
      },
    ],
  },
};

export default nextConfig;
