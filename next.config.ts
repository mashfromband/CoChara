// Next.js configuration with configurable remote image hostnames (for MinIO etc.)
const envHosts = (process.env.IMAGE_REMOTE_HOSTNAMES || '')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean)

const dynamicRemotePatterns = envHosts.map((hostname) => ({
  protocol: 'https' as const,
  hostname,
  pathname: '/**',
}))

const nextConfig = {
  // 開発環境での二重ログを避けるために Strict Mode を無効化
  // 本番ビルドには影響しません
  reactStrictMode: false,
  
  // 画像最適化の設定
  // - 開発: ローカルMinIO (http://127.0.0.1:9000 / http://localhost:9000)
  // - 本番: IMAGE_REMOTE_HOSTNAMES（カンマ区切り）から https://<host> を許可
  images: {
    remotePatterns: [
      // dev MinIO
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
      // prod MinIO (hostnames from env)
      ...dynamicRemotePatterns,
    ],
  },
};

export default nextConfig;
