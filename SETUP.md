# CoChara セットアップガイド

## 🚀 プロジェクト構造

```
cochara/
├── app/                          # Next.js 15 App Router
│   └── character/
│       └── create/
│           └── page.tsx         # 卵選択ページ
├── components/                   # 再利用可能コンポーネント
│   ├── character/
│   │   ├── EggSelection.tsx     # メイン卵選択コンポーネント
│   │   ├── EggCard.tsx          # 卵カードコンポーネント
│   │   └── EggSVG.tsx           # 卵SVGコンポーネント
│   └── ui/
│       └── Sparkle.tsx          # スパークルエフェクト
├── data/
│   └── eggTypes.ts              # 卵データ定義
├── types/
│   └── character.ts             # TypeScript型定義
├── package.json                 # pnpm対応
├── pnpm-workspace.yaml         # ワークスペース設定
├── .pnpmfile.cjs               # pnpm設定
├── .npmrc                       # pnpm/npm設定
├── next.config.js              # Next.js + PWA設定
├── tailwind.config.js          # Tailwind設定
└── tsconfig.json               # TypeScript設定
```

## 📦 インストール手順

### 1. pnpmのインストール（未インストールの場合）

```bash
# npm経由でインストール
npm install -g pnpm

# または Homebrew（macOS）
brew install pnpm

# または winget（Windows）
winget install pnpm
```

### 2. プロジェクトのセットアップ

```bash
# プロジェクトディレクトリを作成
mkdir cochara
cd cochara

# 各ファイルを配置後、依存関係をインストール
pnpm install
```

### 3. 開発環境の起動

```bash
# 開発サーバー起動
pnpm dev

# ブラウザで http://localhost:3000 を開く
```

## 🛠️ 主要コマンド

```bash
# 開発サーバー起動
pnpm dev

# 本番ビルド
pnpm build

# 本番サーバー起動
pnpm start

# 型チェック
pnpm type-check

# リント実行
pnpm lint

# 依存関係の追加
pnpm add <package-name>

# 開発依存関係の追加
pnpm add -D <package-name>

# 依存関係の更新
pnpm update

# キャッシュクリア
pnpm store prune
```

## 🔧 設定ファイルの説明

### package.json
- pnpm 8.15.0を指定
- Next.js 15とReact 18対応
- PWA、認証、データベース関連の依存関係を含む

### .npmrc
- pnpmの動作設定
- ピア依存関係の厳密チェックを無効化
- ホイスティングパターンの設定

### .pnpmfile.cjs
- framer-motionとReact 18の互換性調整

### pnpm-workspace.yaml
- 将来のモノレポ対応のための設定

## 🎯 使用方法

1. `/character/create` にアクセス
2. 6種類の卵から1つを選択
3. 「この卵で始める」ボタンをクリック
4. キャラクター作成処理が開始

## 🔄 次のステップ

このセットアップ後、以下の機能を追加できます：

- [ ] Supabaseデータベース接続
- [ ] NextAuth.js認証設定
- [ ] Prismaスキーマ定義
- [ ] PWAマニフェスト設定
- [ ] AI画像生成API統合
- [ ] リアルタイム機能実装

## 📝 注意事項

- Node.js 18.17.0以上が必要
- pnpm 8.x系推奨
- 開発時はService Workerが無効化される設定
- 型安全性を重視した実装

## 🐛 トラブルシューティング

### pnpmインストールエラー
```bash
# キャッシュクリア
pnpm store prune
rm -rf node_modules
pnpm install
```

### 型エラー
```bash
# 型チェック実行
pnpm type-check
```

### ビルドエラー
```bash
# Next.jsキャッシュクリア
rm -rf .next
pnpm build
```