import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'

const prisma = new PrismaClient()

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'ユーザー名またはメールアドレス', type: 'text' },
        password: { label: 'パスワード', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // ユーザー名またはメールアドレスでユーザーを検索
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { name: credentials.username },
              { email: credentials.username }
            ]
          }
        })

        if (!user || !user.hashedPassword) {
          return null
        }

        // パスワードの検証
        const isPasswordValid = await compare(credentials.password, user.hashedPassword)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        }
      }
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // TypeScriptの型定義に合わせて拡張
        session.user = {
          ...session.user,
          id: token.sub
        }
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }