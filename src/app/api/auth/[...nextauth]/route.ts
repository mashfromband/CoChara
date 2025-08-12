import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth.jsのハンドラーを作成
const handler = NextAuth(authOptions)

// GETとPOSTリクエストに対応するハンドラーをエクスポート
export { handler as GET, handler as POST }