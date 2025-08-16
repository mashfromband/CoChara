import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getEggTypeById } from '@/data/eggTypes'
import { prisma } from '@/lib/prisma'
import { generateColorBasedName } from '@/lib/agents/color-name-agent'

// 卵ガチャAPI
export async function POST(request: Request) {
  try {
    // セッションからユーザー情報を取得
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    // リクエストボディを取得
    const body = await request.json()
    const { eggTypeId, name } = body
    
    if (!eggTypeId) {
      return NextResponse.json(
        { error: '卵タイプIDが必要です' },
        { status: 400 }
      )
    }
    
    // 卵タイプの存在確認
    const eggType = getEggTypeById(eggTypeId)
    if (!eggType) {
      return NextResponse.json(
        { error: '指定された卵タイプが見つかりません' },
        { status: 404 }
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

    /**
     * キャラクター名の決定
     * - フロントからnameが来ていればそれを優先
     * - ない場合、Mastraツール（フォールバック含む）で卵の色から日本語名を生成
     * - 失敗時は eggType.name をフォールバック
     */
    let characterName: string | undefined = name
    if (!characterName) {
      try {
        characterName = await generateColorBasedName(
          eggType.gradient,
          eggType.strokeColor,
          eggType.pattern
        )
      } catch (genErr) {
        console.warn('名前自動生成に失敗、フォールバックを使用:', genErr)
        characterName = eggType.name
      }
    }
    
    // 初期ステータスを作成
    const initialStats = {
      level: 1,
      experience: 0,
      contentCount: 0,
      evolutionStage: 0
    }
    
    // キャラクターを作成
    const character = await prisma.character.create({
      data: {
        name: characterName || eggType.name,
        eggTypeId: eggTypeId,
        stats: initialStats,
        evolutionHistory: [],
        ownerId: user.id,
        sharedWith: []
      }
    })
    
    // 卵コレクションに追加
    await prisma.eggCollection.upsert({
      where: {
        userId_eggTypeId: {
          userId: user.id,
          eggTypeId: eggTypeId
        }
      },
      update: {},
      create: {
        userId: user.id,
        eggTypeId: eggTypeId
      }
    })
    
    return NextResponse.json(character)
    
  } catch (error) {
    console.error('卵ガチャエラー:', error)
    return NextResponse.json(
      { error: '卵ガチャに失敗しました' },
      { status: 500 }
    )
  }
}

// キャラクター一覧取得API
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
    
    // ユーザーのキャラクター一覧を取得
    const characters = await prisma.character.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { sharedWith: { has: user.id } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ characters })
    
  } catch (error) {
    console.error('キャラクター一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'キャラクター一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}