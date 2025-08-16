import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import EggGenerator from './EggGenerator'

/**
 * AdminPage (/admin)
 * 管理者（ユーザー名が "Admin"）のみアクセス可能な管理ページのエントリ。
 * - 未ログインの場合は /login へリダイレクト
 * - Admin 以外のユーザーは / へリダイレクト
 * - CoChara専用卵画像・名前・説明文を250種類生成するジェネレータを提供
 */
export default async function Page() {
  const session = await getServerSession(authOptions)

  // 未ログインはログインページへ
  if (!session) {
    redirect('/login')
  }

  // Admin ユーザーのみ許可（他はトップへ）
  const isAdmin = session.user?.name === 'Admin'
  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-800 via-slate-800 to-gray-900 p-6">
      <div className="flex items-center justify-center">
        <EggGenerator />
      </div>
    </div>
  )
}