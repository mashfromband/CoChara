# 本番デプロイ作業チェックリスト

このチェックリストは、VPS PostgreSQL構築で行う本番デプロイの詳細作業手順です。
作業完了後は各項目にチェック（`[x]`）をつけてください。

## 🏁 開始前の準備
- [ ] ドメイン取得・DNS管理権限の確認（例: `cochara.bm1314.net`）
- [ ] VPS（Oracle Cloud Always Free）の契約・SSH秘密鍵の準備
- [ ] Cloudflare R2アカウント作成・API認証情報の準備
- [ ] VPS用にDB用サブドメイン決定（例: `db.cochara.bm1314.net`）

## 1️⃣ VPS環境構築

### 1.1 VPS初期設定
- [ ] VPSにSSHログイン成功確認
- [ ] OS更新（`sudo apt update && sudo apt upgrade -y`）
- [ ] 必要パッケージインストール
  - [ ] Docker/Docker Compose（`sudo apt install docker.io docker-compose-v2 -y`）
  - [ ] Nginx（一時的・証明書取得用）
  - [ ] Certbot（`sudo apt install certbot python3-certbot-nginx -y`）
  - [ ] UFW（`sudo apt install ufw -y`）

### 1.2 DNS設定
- [ ] Aレコード追加（名前: `db`, 値: VPSのグローバルIP）
- [ ] DNS伝播確認（`nslookup db.<your-domain>`で正引き成功）

### 1.3 ファイアウォール設定
- [ ] UFW基本設定（`sudo ufw default deny incoming`）
- [ ] SSH許可（`sudo ufw allow 22/tcp`）
- [ ] HTTP許可（一時・証明書取得用）（`sudo ufw allow 80/tcp`）
- [ ] PostgreSQL許可（`sudo ufw allow 5432/tcp`）
- [ ] UFW有効化（`sudo ufw enable`）

## 2️⃣ TLS証明書取得

### 2.1 Let's Encrypt証明書
- [ ] Nginx一時起動（80番ポートでHTTPアクセス可能に）
- [ ] Certbot実行（`sudo certbot certonly --nginx -d db.<your-domain>`）
- [ ] 証明書ファイル確認（`/etc/letsencrypt/live/db.<your-domain>/`）
  - [ ] `fullchain.pem` 存在確認
  - [ ] `privkey.pem` 存在確認
- [ ] Nginx停止・削除（不要になったため）

### 2.2 証明書更新設定（オプション）
- [ ] 自動更新テスト（`sudo certbot renew --dry-run`）
- [ ] cron設定（`sudo crontab -e`で `0 12 * * * certbot renew --quiet` 追加）

## 3️⃣ PostgreSQL構築

### 3.1 Docker Compose設定
- [ ] 作業ディレクトリ作成（例: `/home/ubuntu/cochara-db`）
- [ ] 強力なパスワード生成（`openssl rand -base64 24`など）
- [ ] `docker-compose.yml` 作成（TLS有効PostgreSQL設定）
- [ ] `pg_hba.conf` 作成（TLS必須認証設定）

### 3.2 PostgreSQL起動確認
- [ ] Docker Compose起動（`docker compose up -d`）
- [ ] コンテナ状態確認（`docker compose ps`で `healthy` 状態）
- [ ] ログ確認（`docker compose logs postgres`でエラーなし）

## 4️⃣ ローカル環境からの接続確認

### 4.1 接続テスト
- [ ] VPSのPostgreSQLにMacから接続テスト
  - [ ] 接続文字列準備（`postgresql://cochara:<PASSWORD>@db.<your-domain>:5432/cochara?sslmode=require`）
  - [ ] `psql` または Prisma Studioで接続成功確認

### 4.2 プロジェクト設定反映
- [ ] `.env.local` に本番DB接続文字列設定
- [ ] Prismaマイグレーション実行（`pnpm prisma migrate deploy`）
- [ ] シード実行
  - [ ] `SEED_ADMIN_EMAIL` 設定（あなたのメール）
  - [ ] `SEED_ADMIN_PASSWORD` 設定（強力なパスワード）
  - [ ] `pnpm prisma db seed` 実行成功

## 5️⃣ Cloudflare R2設定

### 5.1 R2バケット作成
- [ ] R2ダッシュボードでバケット作成（例: `cochara-uploads`）
- [ ] R2 API Token作成（S3 API互換）
- [ ] 接続情報記録
  - [ ] Account ID
  - [ ] Access Key ID
  - [ ] Secret Access Key
  - [ ] Endpoint URL

### 5.2 署名付きURL設定確認
- [ ] ローカルから R2 への画像アップロードテスト
- [ ] 署名付きURL生成・表示確認

## 6️⃣ Vercel デプロイ設定

### 6.1 環境変数設定
- [ ] `.env.vercel` ファイル更新（実際の認証情報に差し替え）
  - [ ] `DATABASE_URL`（本番PostgreSQL）
  - [ ] `MINIO_ENDPOINT`（R2）
  - [ ] `MINIO_ACCESS_KEY`（R2）
  - [ ] `MINIO_SECRET_KEY`（R2）
  - [ ] `NEXTAUTH_SECRET`（本番用・新規生成）
  - [ ] `SEED_ADMIN_EMAIL`
  - [ ] `SEED_ADMIN_PASSWORD`

### 6.2 Vercel Project設定
- [ ] VercelでGitHubリポジトリ連携
- [ ] Build Command確認（`pnpm build`）
- [ ] Install Command確認（`pnpm install`）
- [ ] 環境変数インポート（`.env.vercel`を使用）

### 6.3 デプロイ実行
- [ ] 初回デプロイ実行
- [ ] デプロイ成功確認（Vercel Dashboard）
- [ ] 本番URLでサイト表示確認

## 7️⃣ 動作確認・テスト

### 7.1 認証機能確認
- [ ] ユーザー登録（新規）動作確認
- [ ] 管理者ログイン動作確認（シードで作成したアカウント）
- [ ] GitHubログイン動作確認（設定している場合）
- [ ] Googleログイン動作確認（設定している場合）

### 7.2 画像機能確認
- [ ] 画像アップロード動作確認
- [ ] 画像表示（署名付きURL）動作確認
- [ ] Next.js Image Optimization動作確認

### 7.3 データベース機能確認
- [ ] キャラクター作成・編集動作確認
- [ ] コンテンツ投稿・共有動作確認
- [ ] ユーザープロフィール更新動作確認

## 8️⃣ バックアップ設定（重要）

### 8.1 rclone設定
- [ ] VPSに `rclone` インストール（`sudo apt install rclone -y`）
- [ ] rclone設定（`rclone config`でR2をS3互換として設定）
- [ ] バックアップディレクトリ作成（`/backup`など）

### 8.2 バックアップスクリプト設定
- [ ] バックアップスクリプト作成
- [ ] 手動バックアップテスト実行（`pg_dump` + `rclone copy`）
- [ ] R2バケットでバックアップファイル確認
- [ ] cron設定（毎日自動バックアップ）

### 8.3 復元テスト
- [ ] テスト用のDB復元手順確認（一度は実施推奨）

## 9️⃣ セキュリティ・運用設定

### 9.1 セキュリティ強化
- [ ] パスワード認証無効化（SSH鍵認証のみ）
- [ ] OS自動更新設定（`unattended-upgrades`）
- [ ] fail2ban設定（オプション・ログイン試行制限）

### 9.2 監視設定（オプション）
- [ ] ディスク使用量監視
- [ ] PostgreSQL接続監視
- [ ] SSL証明書期限監視

## 🎯 最終確認

### 10.1 パフォーマンス確認
- [ ] サイト読み込み速度確認
- [ ] 画像配信速度確認
- [ ] DB応答速度確認

### 10.2 ドキュメント更新
- [ ] `README.md` の本番URL更新（存在する場合）
- [ ] `PRODUCTION.md` の設定値確認・追記

### 10.3 関係者への共有
- [ ] 本番環境URL共有
- [ ] 管理者アカウント情報共有（必要に応じて）
- [ ] 運用手順書共有

---

## 📝 備考

### 重要な接続情報（作業中にメモ）
- VPS IP: `___________________`
- DB FQDN: `db.<your-domain>`
- DB Password: `___________________(安全な場所に保管)`
- R2 Bucket: `___________________`
- Vercel URL: `___________________`

### トラブルシューティング
- VPS SSH接続問題 → セキュリティグループ・ファイアウォール確認
- Let's Encrypt失敗 → DNS設定・80番ポート開放確認
- PostgreSQL接続失敗 → SSL設定・認証設定確認
- Vercel デプロイ失敗 → 環境変数・ビルドログ確認

このチェックリストに従って作業を進めれば、安定した本番環境が構築できます。