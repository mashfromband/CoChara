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