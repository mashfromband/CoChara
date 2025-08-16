import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getSignedUrlForObject } from '@/lib/s3';

// Next.js App Routerでは、getServerSession()を引数なしで呼び出すことができます
const getSession = async () => {
  try {
    return await getServerSession();
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * ユーザープロフィール情報を取得するAPIエンドポイント
 * @returns ユーザー情報を含むレスポンス
 */
export async function GET() {
  try {
    // セッションからユーザー情報を取得
    const session = await getSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // データベースから最新のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * ユーザープロフィール情報を更新するAPIエンドポイント
 * @param request リクエストオブジェクト
 * @returns 更新されたユーザー情報を含むレスポンス
 */
export async function PATCH(request: NextRequest) {
  try {
    // セッションからユーザー情報を取得
    const session = await getSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // リクエストボディからデータを取得
    const data = await request.json();
    const { name, image } = data;
    
    // 更新するフィールドを準備
    const updateData: { name?: string; image?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    
    // データが空の場合はエラーを返す
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // データベースでユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
    
    // 表示用の署名URLを生成（image が "bucket/key" 形式の場合）
    let signedImageUrl: string | null = null;
    try {
      if (updatedUser.image && typeof updatedUser.image === 'string' && !updatedUser.image.startsWith('http')) {
        const parts = updatedUser.image.split('/');
        if (parts.length >= 2) {
          const bucket = parts[0];
          const key = parts.slice(1).join('/');
          signedImageUrl = await getSignedUrlForObject(bucket, key);
        }
      }
    } catch (e) {
      console.warn('署名URL生成に失敗しましたが処理を継続します:', e);
    }

    return NextResponse.json({
      user: {
        ...updatedUser,
        createdAt: updatedUser.createdAt?.toISOString(),
      },
      signedImageUrl,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}