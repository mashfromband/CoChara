const { PrismaClient } = require('../src/generated/prisma');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

/**
 * データベースの初期化と初期管理ユーザーの作成を行うシード処理のエントリーポイント
 * - 既存データを削除し、クリーンな状態にリセットします
 * - SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD を使用して管理ユーザーを作成します（パスワード未指定時はランダム生成）
 */
async function main() {
  // データベースをリセット
  console.log('データベースをリセットしています...');
  await prisma.contentItem.deleteMany({});
  await prisma.character.deleteMany({});
  await prisma.eggCollection.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  console.log('データベースのリセットが完了しました');

  // 管理ユーザーの作成（パスワードは環境変数 or ランダム生成）
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const provided = process.env.SEED_ADMIN_PASSWORD;
  const generated = provided || Math.random().toString(36).slice(-12);
  const hashedPassword = await hash(generated, 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      hashedPassword,
      type: 'Admin',
    },
  });

  console.log('管理ユーザーを作成しました:', { id: adminUser.id, email: adminEmail });
  if (!provided) {
    console.warn('注意: SEED_ADMIN_PASSWORD 未設定のためランダムパスワードを生成しました。安全のため直ちに変更してください。');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });