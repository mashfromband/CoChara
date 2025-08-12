const { PrismaClient } = require('../src/generated/prisma');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // テストユーザーの作成
  const hashedPassword = await hash('password123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'testuser',
      email: 'test@example.com',
      hashedPassword,
      type: 'User',
    },
  });

  console.log({ testUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });