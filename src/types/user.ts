// types/user.ts

export interface User {
  id: string
  name?: string
  email?: string
  emailVerified?: Date
  image?: string
  type?: 'User' | 'Admin'
  createdAt: Date
  updatedAt: Date
}

// Session/Account/VerificationToken は Prisma から削除したため、ここでの型定義も不要になりました。

export interface EggCollection {
  id: string
  userId: string
  eggTypeId: string
  obtainedAt: Date
}