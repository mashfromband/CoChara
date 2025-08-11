import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // 常にContent-Typeヘッダーを設定
  const headers = {
    'Content-Type': 'application/json; charset=utf-8'
  };
  
  console.log('リクエスト受信: /api/register');
  try {
    // リクエストの詳細をログに出力
    console.log('リクエストメソッド:', request.method);
    console.log('リクエストヘッダー:', [...request.headers.entries()]);
    
    // リクエストボディのJSONパースを安全に行う
    let body;
    try {
      // リクエストボディをテキストとして取得
      const requestText = await request.text();
      console.log('リクエストボディ:', requestText);
      
      // JSONとしてパース
      body = JSON.parse(requestText);
    } catch (jsonError) {
      console.error('リクエストJSONパースエラー:', jsonError);
      return NextResponse.json(
        { message: 'リクエストの形式が不正です', error: jsonError instanceof Error ? jsonError.message : String(jsonError) },
        { 
          status: 400,
          headers
        }
      );
    }
    const { name, email, password } = body;

    // バリデーション
    if (!name || !password) {
      return NextResponse.json(
          { message: 'ユーザー名とパスワードは必須です' },
          { 
            status: 400,
            headers
          }
        );
    }
    
    // メールアドレスのバリデーション（Admin特別処理を削除）
    if (email === undefined || email === null || email === '') {
      return NextResponse.json(
          { message: 'メールアドレスは必須です' },
          { 
            status: 400,
            headers
          }
        );
    }

    // メールアドレスの形式チェック
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
            { message: '有効なメールアドレスを入力してください' },
            { 
              status: 400,
              headers
            }
          );
      }
    }

    // パスワードの長さチェック
    if (password.length < 8) {
      return NextResponse.json(
          { message: 'パスワードは8文字以上である必要があります' },
          { 
            status: 400,
            headers
          }
        );
    }

    // 既存メールアドレスのチェック（Admin特別処理を削除）
    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        return NextResponse.json(
            { message: 'このメールアドレスは既に使用されています' },
            { 
              status: 400,
              headers
            }
          );
      }
    }

    const existingUserByName = await prisma.user.findFirst({
      where: { name },
    });

    if (existingUserByName) {
      return NextResponse.json(
        { message: 'このユーザー名は既に使用されています' },
        { 
          status: 400,
          headers
        }
      );
    }

    // パスワードのハッシュ化（クライアント側でハッシュ化されている場合は不要）
    const hashedPassword = await hash(password, 10);

    // ユーザーの作成（Admin特別処理を削除）
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        emailVerified: null, // メール認証は別途行う
      },
    });

    // パスワードを除外したユーザー情報を返す
    const { hashedPassword: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'ユーザーが正常に登録されました', user: userWithoutPassword, success: true },
      { 
        status: 201,
        headers
      }
    );
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    
    // エラーの詳細をログに出力
    console.error('詳細なエラー情報:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Prismaのユニーク制約違反エラーをキャッチ
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      if (error.message.includes('name')) {
        return NextResponse.json(
          { message: 'このユーザー名は既に使用されています', success: false },
          { 
            status: 400,
            headers
          }
        );
      }
      if (error.message.includes('email')) {
        return NextResponse.json(
            { message: 'このメールアドレスは既に使用されています', success: false },
            { 
              status: 400,
              headers
            }
          );
      }
      return NextResponse.json(
          { message: 'ユーザー情報が重複しています', success: false },
          { 
            status: 400,
            headers
          }
        );
    }
    
    // その他のエラー
    try {
      return NextResponse.json(
        { 
          message: '登録中にエラーが発生しました。もう一度お試しください。', 
          error: error instanceof Error ? error.message : String(error),
          success: false 
        },
        { 
          status: 500,
          headers
        }
      );
    } catch (responseError) {
      console.error('レスポンス生成エラー:', responseError);
      // 最後の手段として、シンプルなレスポンスを返す
      return new NextResponse(
        JSON.stringify({ message: '登録処理中にエラーが発生しました', success: false }),
        { 
          status: 500,
          headers
        }
      );
    }
  }
}