import { PrismaClient } from '@/generated/prisma'

/**
 * PrismaClientのグローバルインスタンスを作成
 * 開発環境での重複インスタンス化を防止するためのシングルトンパターン実装
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// 開発環境での重複インスタンス化を防止
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma