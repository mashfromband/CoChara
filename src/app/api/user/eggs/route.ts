import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ユーザーの卵コレクションを取得するAPI
export async function GET() {
  try {
    // セッションからユーザー情報を取得
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // ユーザーIDを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }
    
    // ユーザーの卵コレクションを取得
    const eggCollection = await prisma.eggCollection.findMany({
      where: { userId: user.id },
      select: { eggTypeId: true, obtainedAt: true }
    })
    
    // 卵IDのリストを返す
    return NextResponse.json({
      eggs: eggCollection.map((egg: { eggTypeId: string; obtainedAt: Date }) => ({
        id: egg.eggTypeId,
        obtainedAt: egg.obtainedAt
      }))
    })
    
  } catch (error) {
    console.error('卵コレクション取得エラー:', error)
    return NextResponse.json(
      { error: '卵コレクションの取得に失敗しました' },
      { status: 500 }
    )
  }
}