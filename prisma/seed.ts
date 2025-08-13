const { PrismaClient } = require('../src/generated/prisma');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

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

  // 指定されたテストユーザーの作成
  const adminPassword = '|MzbDP~3AgUc';
  const hashedPassword = await hash(adminPassword, 10);
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@bm1314.com',
      hashedPassword,
      type: 'Admin',
    },
  });

  console.log('テストユーザーが作成されました:');
  console.log({ adminUser });
  console.log(`ユーザー名: Admin`);
  console.log(`パスワード: ${adminPassword}`);
  console.log(`メール: admin@bm1314.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });