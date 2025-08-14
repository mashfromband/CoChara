# CoChara

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 環境設定

1. `.env`ファイルを設定します：

```bash
# MinIO (S3互換) 設定
# 例) MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
# MinIO はパススタイルが無難
MINIO_FORCE_PATH_STYLE=true
```

2. Docker で MinIO を起動します：

```bash
docker compose up -d minio
# コンソール: http://127.0.0.1:9001 (ユーザ/パス: minioadmin/minioadmin)
```

### 開発サーバーの起動

```bash
pnpm dev
```

Open [http://localhost:8500](http://localhost:8500) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
