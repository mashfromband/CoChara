import { PrismaAdapter } from '@auth/prisma-adapter'
import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { getSignedUrlForObject } from '@/lib/s3'

// DB接続の有無を判定（開発環境でDB未設定の場合のフォールバックに利用）
const hasDb = !!process.env.DATABASE_URL

/**
 * NextAuth.js認証設定
 * - 複数の認証プロバイダーをサポート（クレデンシャル、GitHub、Google）
 * - PrismaAdapterはDBが存在する場合のみ有効化（開発でDB未設定でもエラーにしない）
 */
export const authOptions: AuthOptions = {
  // PrismaAdapter は DB があるときだけ有効化
  ...(hasDb ? { adapter: PrismaAdapter(prisma) } : {}),
  providers: [
    // Credentials プロバイダーは DB がある場合のみ有効化
    ...(hasDb
      ? [
          CredentialsProvider({
            name: 'credentials',
            credentials: {
              username: { label: 'ユーザー名またはメールアドレス', type: 'text' },
              password: { label: 'パスワード', type: 'password' }
            },
            /**
             * 認証処理
             * - DB上のユーザーを検索し、パスワードを検証
             */
            async authorize(credentials) {
              if (!credentials?.username || !credentials?.password) {
                return null
              }

              try {
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
              } catch (error) {
                console.error('認証エラー:', error)
                return null
              }
            }
          })
        ]
      : []),
    // GitHubプロバイダー（環境変数が設定されている場合のみ有効）
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET
          })
        ]
      : []),
    // Googleプロバイダー（環境変数が設定されている場合のみ有効）
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
          })
        ]
      : [])
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },
  // 開発環境ではフォールバックのシークレットを使用（本番では必ず環境変数を設定）
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret' : undefined),
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    /**
     * セッションコールバック
     * - JWTからユーザーIDを付与
     * - DBから最新のユーザー name / image を取得してセッションへ反映（プロフィール更新を即時に反映するため）
     */
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user = {
          ...session.user,
          id: token.sub,
        }
      }
      try {
        if (session.user?.id && hasDb) {
          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, image: true },
          })
          if (dbUser) {
            session.user.name = dbUser.name ?? session.user.name
            // DBのimageがキー（bucket/key）で保存されている場合は、表示用に署名URLへ変換
            if (dbUser.image && typeof dbUser.image === 'string' && !dbUser.image.startsWith('http')) {
              const parts = dbUser.image.split('/')
              if (parts.length >= 2) {
                const bucket = parts[0]
                const key = parts.slice(1).join('/')
                try {
                  const signed = await getSignedUrlForObject(bucket, key)
                  session.user.image = signed
                } catch (e) {
                  console.warn('セッション画像の署名URL生成に失敗:', e)
                  session.user.image = (session.user.image as string | undefined)
                }
              } else {
                session.user.image = (session.user.image as string | undefined)
              }
            } else {
              session.user.image = (dbUser.image as string | undefined) ?? (session.user.image as string | undefined)
            }
          }
        } else if (session.user && (token as any)?.picture) {
          // DB参照ができない場合は JWT 内の picture をフォールバックとして使用
          session.user.image = ((token as any).picture as string) || (session.user.image as string | undefined)
        }
      } catch (e) {
        console.error('session callback error:', e)
      }
      return session
    },

    /**
     * JWTコールバック
     * - サインイン時に user.id をトークンへ付与
     * - user.image があれば picture/image として保持して、セッション更新時に利用
     */
    async jwt({ token, user }) {
      if (user) {
        // 型安全性のため any キャスト
        const u: any = user
        token.id = u.id
        if (u.image) {
          ;(token as any).picture = u.image
          ;(token as any).image = u.image
        }
      }
      return token
    }
  },
}