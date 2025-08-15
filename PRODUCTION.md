# 本番デプロイガイド

このプロジェクトを本番環境（Vercel）にデプロイするための設定ガイドです。

## 必要なサービス

1. **MinIO**: ファイルストレージ（S3互換）
2. **PostgreSQL**: データベース（PlanetScale、Supabase、Neon.tech など）
3. **Vercel**: ホスティング

## 1. MinIO の設定

### 1.1 MinIO インスタンスの準備

#### 推奨オプション
- **VPS/クラウド**: DigitalOcean、Vultr、Linode、AWSのEC2 など
- **ドメイン**: カスタムドメインとSSL証明書（Let's Encrypt推奨）

#### セルフホスト MinIO の設定手順

1. **Docker Compose でMinIOをセットアップ**：
```yaml
version: '3.8'
services:
  minio:
    image: minio/minio:latest
    container_name: minio-production
    restart: unless-stopped
    ports:
      - "9000:9000"   # API ポート
      - "9001:9001"   # Web Console ポート
    environment:
      MINIO_ROOT_USER: your-access-key-here
      MINIO_ROOT_PASSWORD: your-secret-key-here
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
      - /etc/ssl/certs:/etc/ssl/certs:ro

volumes:
  minio_data:
```

2. **リバースプロキシ設定（Nginx）**：
```nginx
server {
    listen 443 ssl;
    server_name storage.yourdomain.com;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 1.2 MinIO の初期設定

1. **管理コンソールにアクセス**: `https://storage.yourdomain.com:9001`
2. **バケットを作成**: 例：`cochara-uploads`
3. **アクセスポリシーを設定**: Private（推奨）
4. **CORS設定** (必要に応じて):
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["https://your-app.vercel.app"],
        "ExposeHeaders": []
    }
]
```

## 2. PostgreSQL データベースの設定

### 推奨プロバイダー（無料プランあり）
- **Neon.tech**: 無料で512MB
- **PlanetScale**: 無料で5GB（現在新規受付停止）
- **Supabase**: 無料で500MB
- **Railway**: 無料で500MB

### データベース設定手順
1. プロバイダーでPostgreSQLインスタンスを作成
2. 接続文字列（DATABASE_URL）を取得
3. Prismaでマイグレーション実行:
```bash
pnpm prisma migrate deploy
pnpm prisma db seed
```

## 3. Vercel の環境変数設定

Vercelプロジェクトの設定画面で以下の環境変数を追加：

### 必須環境変数
```bash
# NextAuth設定
NEXTAUTH_SECRET=your-very-long-random-secret-string-here
NEXTAUTH_URL=https://your-app.vercel.app

# データベース
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# MinIO/S3設定
MINIO_ENDPOINT=https://storage.yourdomain.com
MINIO_ACCESS_KEY=your-access-key-here
MINIO_SECRET_KEY=your-secret-key-here
MINIO_FORCE_PATH_STYLE=false

# Next.js画像最適化
IMAGE_REMOTE_HOSTNAMES=storage.yourdomain.com

# オプション：署名付きURL有効期限（秒）
S3_SIGNED_URL_EXPIRES=3600
```

### セキュリティ設定

1. **MinIO アクセスキー**: 強力なランダム文字列（32文字以上）
2. **NEXTAUTH_SECRET**: `openssl rand -base64 32` で生成
3. **ファイアウォール**: MinIOサーバーのポート9000のみ許可

## 4. デプロイ手順

1. **GitHub リポジトリの更新**
2. **Vercel にプロジェクトをインポート**
3. **環境変数を設定**
4. **自動デプロイの確認**

## 5. 動作確認

### 確認項目
- [ ] ログイン・ログアウト
- [ ] キャラクター作成
- [ ] 画像アップロード
- [ ] 画像表示（署名付きURL）

### トラブルシューティング

#### 画像が表示されない場合
1. MinIOエンドポイントが正しく設定されているか確認
2. `IMAGE_REMOTE_HOSTNAMES` に MinIO ドメインが含まれているか確認
3. MinIO バケットが private に設定されているか確認

#### アップロードエラーの場合
1. MinIO アクセスキーとシークレットが正しいか確認
2. バケットが存在するか確認
3. CORS設定が正しいか確認（必要に応じて）

## 6. セキュリティチェックリスト

- [ ] MinIO はHTTPS経由でアクセス
- [ ] バケットはprivate設定
- [ ] 強力なアクセスキー・シークレット使用
- [ ] データベース接続はSSL使用
- [ ] 本番用の`NEXTAUTH_SECRET`設定
- [ ] 不要なポートはファイアウォールで遮断

## 7. 代替ストレージオプション

MinIOの代わりに以下のサービスも利用可能：

### Cloudflare R2（推奨）
- S3互換API
- 月10GB無料
- 既存のMinIOコードがそのまま使用可能

設定例：
```bash
MINIO_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=your-r2-access-key
MINIO_SECRET_KEY=your-r2-secret-key
MINIO_FORCE_PATH_STYLE=false
```

### AWS S3
- 本家S3サービス
- 月5GB無料（12ヶ月間）

## 8. パフォーマンス最適化

### CDN設定
MinIOの前段にCloudflareなどのCDNを配置することで、画像配信のパフォーマンスを向上できます。

### 画像最適化
- WebP形式への変換
- 適切なキャッシュヘッダー設定
- Next.js Image Optimization の活用

---

このガイドに従って設定すれば、セキュアで安定した本番環境を構築できます。何か問題が発生した場合は、各サービスのドキュメントを参照してください。

## 9. 自前VPSでPostgreSQLを運用（Always Free構成・推奨A案）

「永遠に無料」に最も近い構成として、Always FreeのVPS上にPostgreSQLを構築し、VercelからTLSで接続します。画像はR2に保存されるため、DBはメタデータ中心で十分です。

### 前提
- VPS: Ubuntu系（例: Oracle Cloud Always Free）
- ドメイン: 例 `cochara.bm1314.net`、DB用に `db.cochara.bm1314.net` を使用
- クライアント: あなたのMac（pnpm, prisma CLI）

### 9.1 DNS設定
1. DNSにAレコードを追加
   - 名前: `db`
   - 値: VPSのグローバルIP
2. 伝播完了後、`db.<your-domain>` で疎通可能になります。

### 9.2 VPS準備（SSHログイン後）
1. 必要パッケージの導入
   - Docker/Compose をインストール
   - Certbot と Nginx（証明書取得用に一時利用）
2. ファイアウォール（UFW）
   - 許可: 22/tcp（SSH）, 80/tcp（証明書取得/更新）, 443/tcp（任意）, 5432/tcp（PostgreSQL）

### 9.3 TLS証明書の取得（Let's Encrypt）
1. Nginxを起動し、`db.<your-domain>` へのHTTPアクセスを有効化
2. Certbotで証明書発行（HTTP-01）
   - 成功すると `/etc/letsencrypt/live/db.<your-domain>/` に `fullchain.pem` と `privkey.pem` が作成されます
3. 更新は `certbot renew` で自動化可能（cron/systemd timer）

> 証明書取得後、Nginxは停止/削除しても構いません（Certbot standaloneでの更新に切替可能）。不要になったものは削除してください。

### 9.4 Docker Compose（PostgreSQL/TLS有効）例
以下をVPS上の任意ディレクトリに配置して起動します。外部からのTLS接続を許可するため `pg_hba.conf` を明示します。

```yaml
services:
  postgres:
    image: postgres:17
    container_name: cochara_postgres_prod
    restart: unless-stopped
    environment:
      POSTGRES_USER: cochara
      POSTGRES_PASSWORD: <強力なパスワード>
      POSTGRES_DB: cochara
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
      - /etc/letsencrypt/live/db.<your-domain>/fullchain.pem:/certs/fullchain.pem:ro
      - /etc/letsencrypt/live/db.<your-domain>/privkey.pem:/certs/privkey.pem:ro
      - ./pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
    command: >
      postgres -c ssl=on \
               -c ssl_cert_file=/certs/fullchain.pem \
               -c ssl_key_file=/certs/privkey.pem \
               -c password_encryption=scram-sha-256 \
               -c listen_addresses='*' \
               -c hba_file=/etc/postgresql/pg_hba.conf

volumes:
  pg_data:
```

`pg_hba.conf` の内容例（必要最小限・TLS必須）:

```conf
# TYPE  DATABASE  USER      ADDRESS     METHOD
hostssl  all      all       0.0.0.0/0   scram-sha-256
hostssl  all      all       ::/0        scram-sha-256
```

- `POSTGRES_PASSWORD` は 16文字以上・記号含む強力な値にしてください（例: `openssl rand -base64 24`）
- これで 5432/TCP でTLS有効なPostgreSQLが待ち受けます

### 9.5 接続テスト（Mac）
- 接続文字列（sslmode=require を必ず付与）
  - `postgresql://cochara:<PASSWORD>@db.<your-domain>:5432/cochara?sslmode=require`
- psql または Prisma から接続確認

### 9.6 本プロジェクトへの反映
1. ローカル（.env.local）
   - `DATABASE_URL="postgresql://cochara:<PASSWORD>@db.<your-domain>:5432/cochara?sslmode=require"`
2. Prismaマイグレーション/シード
   - `pnpm prisma migrate deploy`
   - 管理者作成（任意）: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` を設定して `pnpm prisma db seed`
   - 参照: <mcfile name="schema.prisma" path="/Users/makhmeto/Private/cochara/prisma/schema.prisma"></mcfile> / <mcfile name="seed.ts" path="/Users/makhmeto/Private/cochara/prisma/seed.ts"></mcfile>
3. Vercel（本番）
   - <mcfile name=".env.vercel" path="/Users/makhmeto/Private/cochara/.env.vercel"></mcfile> の `DATABASE_URL` を実値に差し替え → Vercelの「Import .env」で適用

### 9.7 バックアップ（Cloudflare R2へ無料で保管）
1. VPSに `pg_dump` と `rclone` をインストール
2. rcloneでR2をS3互換ストレージとして設定（AccessKey/Secret/Endpoint をR2のものに）
3. 毎日cronでバックアップ＆アップロード
   - `pg_dump -U cochara -h 127.0.0.1 -d cochara | gzip > /backup/$(date +\%F).sql.gz`
   - `rclone copy /backup r2:cochara-backups/db --checksum --s3-no-check-bucket`
4. 復元テストも一度は実施して手順を確認

### 9.8 セキュリティ/運用チェック
- UFW: 22/80/5432 のみ許可（80は更新時のみでも可）
- OS自動更新（unattended-upgrades）
- ログイン試行制限（fail2ban など任意）
- 秘密情報の定期ローテーション（DBパスワード / NEXTAUTH_SECRET など）
- 不要になったコンポーネント（Nginx等）は削除

---

これで、自前VPS上のPostgreSQLをTLSで安全に公開し、Vercelから無料で長期運用できる構成が整います。