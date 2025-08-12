# CoChara

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 環境設定

1. `.env`ファイルを設定します：

```bash
# Google Cloud Storage設定
# サービスアカウントキーのJSONをそのまま環境変数に設定
GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"あなたのプロジェクトID","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'


# または、Supabase設定（代替ストレージとして）
# NEXT_PUBLIC_SUPABASE_URL="あなたのSupabaseプロジェクトURL"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="あなたのSupabase匿名キー"
# SUPABASE_SERVICE_ROLE_KEY="あなたのSupabaseサービスロールキー"
```

2. Google Cloud Storageバケットをセットアップします：

```bash
pnpm setup-gcs
```

（または代替としてSupabaseストレージを使用する場合）

```bash
pnpm setup-storage
```

### 開発サーバーの起動

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
