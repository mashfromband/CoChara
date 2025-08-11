// types/user.ts

export interface User {
  id: string
  name?: string
  email?: string
  emailVerified?: Date
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
  user: User
}

export interface Account {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string
  access_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  id_token?: string
  session_state?: string
}

export interface VerificationToken {
  identifier: string
  token: string
  expires: Date
}

export interface EggCollection {
  id: string
  userId: string
  eggTypeId: string
  obtainedAt: Date
}