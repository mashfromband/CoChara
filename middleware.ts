import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * NextAuth 保護用ミドルウェア
 * - /profile と /character 配下を未認証アクセスから保護します
 * - 未認証の場合はサーバーサイドで即座に /login へリダイレクト（RSCの中断ログを抑制）
 * - 開発環境では NEXTAUTH_SECRET が未設定でも 'dev-secret' をフォールバックとして使用
 */
export async function middleware(req: NextRequest) {
  // セッション(JWT)が存在するか確認
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-secret' })

  if (!token) {
    const url = req.nextUrl.clone()
    const loginUrl = new URL('/login', req.url)
    // 元のパスに戻せるよう callbackUrl を付与
    loginUrl.searchParams.set('callbackUrl', url.pathname + url.search)
    return NextResponse.redirect(loginUrl)
  }

  // 認証済みならそのまま続行
  return NextResponse.next()
}

/**
 * ミドルウェアを適用するルート
 * - /profile
 * - /character 以下すべて
 */
export const config = {
  matcher: ['/profile', '/character/:path*'],
}