import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

// キャラクター詳細取得API
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // セッションからユーザー情報を取得
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    const { id: characterId } = await params
    
    if (!characterId) {
      return NextResponse.json(
        { error: 'キャラクターIDが必要です' },
        { status: 400 }
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
    
    // キャラクターを取得（所有者またはシェアされているユーザーのみアクセス可能）
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [
          { ownerId: user.id },
          { sharedWith: { has: user.id } }
        ]
      }
    })
    
    if (!character) {
      return NextResponse.json(
        { error: 'キャラクターが見つかりません' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(character)
    
  } catch (error) {
    console.error('キャラクター詳細取得エラー:', error)
    return NextResponse.json(
      { error: 'キャラクター詳細の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// キャラクター更新API
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // セッションからユーザー情報を取得
    const session = await getServerSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    const { id: characterId } = await params
    
    if (!characterId) {
      return NextResponse.json(
        { error: 'キャラクターIDが必要です' },
        { status: 400 }
      )
    }
    
    // リクエストボディを取得
    const body = await request.json()
    
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
    
    // キャラクターを取得（所有者のみ更新可能）
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        ownerId: user.id
      }
    })
    
    if (!character) {
      return NextResponse.json(
        { error: 'キャラクターが見つかりません、または更新権限がありません' },
        { status: 404 }
      )
    }
    
    // キャラクターを更新
    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: {
        name: body.name,
        stats: body.stats,
        evolutionHistory: body.evolutionHistory,
        sharedWith: body.sharedWith
      }
    })
    
    return NextResponse.json(updatedCharacter)
    
  } catch (error) {
    console.error('キャラクター更新エラー:', error)
    return NextResponse.json(
      { error: 'キャラクターの更新に失敗しました' },
      { status: 500 }
    )
  }
}