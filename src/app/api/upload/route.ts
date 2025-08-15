import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFileToS3, getSignedUrlForObject } from '@/lib/s3';

// MinIOクライアントの初期化チェック
if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
  console.error('MinIO環境変数(MINIO_ENDPOINT/MINIO_ACCESS_KEY/MINIO_SECRET_KEY)が設定されていません');
  // 環境変数が設定されていない場合は、サーバー起動時に警告を表示するだけ
}

/**
 * ファイルアップロード処理のAPIエンドポイント（privateバケット前提）
 * - アップロード後は「署名付きURL」を返します
 * - レスポンスの fileUrl は互換性のため signedUrl と同じ値を返します
 * 
 * @param request - NextRequest オブジェクト
 * @returns NextResponse オブジェクト
 */
export async function POST(request: NextRequest) {
  try {
    // セッション確認（認証済みユーザーのみアップロード可能）
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // FormDataからファイルとメタデータを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requestedBucket = (formData.get('bucketName') as string) || '';
    const fileName = formData.get('fileName') as string;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: 'ファイルとファイル名が必要です' },
        { status: 400 }
      );
    }

    // MIMEタイプに応じてバケット名を決定（環境変数優先）
    const IMAGE_BUCKET = process.env.MINIO_IMAGE_BUCKET || 'image';
    const VIDEO_BUCKET = process.env.MINIO_VIDEO_BUCKET || 'video';
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // もしクライアントからbucketNameが明示され、かつ画像/動画のいずれかに合致するならそれを使用
    // ただし環境変数のデフォルトを優先するため、無効な値は上書き
    let bucketName = requestedBucket;
    if (isImage) bucketName = IMAGE_BUCKET;
    if (isVideo) bucketName = VIDEO_BUCKET;

    if (!bucketName) {
      return NextResponse.json(
        { error: 'バケット名を決定できませんでした' },
        { status: 400 }
      );
    }

    // ファイルタイプの検証
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: '画像またはビデオファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    // ファイルサイズの検証（10MB以下）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      );
    }

    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // MinIO(S3互換)にアップロード
    try {
      console.log(`アップロードAPI: バケット=${bucketName}, ファイル名=${fileName}, サイズ=${fileBuffer.length}バイト`);
      
      const filePath = await uploadFileToS3(
        bucketName,
        fileName,
        fileBuffer,
        file.type
      );

      // private前提のため、取得用に署名付きURLを返却（必要に応じて期限は環境変数で調整可能）
      const signedUrl = await getSignedUrlForObject(bucketName, fileName);

      console.log(`アップロード成功: ${filePath}`);
      
      // 成功レスポンス
      return NextResponse.json({
        success: true,
        filePath,              // 例: "bucket/key"
        signedUrl,             // 一定時間だけ有効
        fileUrl: signedUrl,    // 互換用フィールド
        path: filePath,
      });
    } catch (uploadError) {
      console.error('MinIOアップロードエラー:', uploadError);
      
      // エラーメッセージをより詳細に
      let errorMessage = 'ファイルのアップロードに失敗しました';
      let statusCode = 500;
      
      if (uploadError instanceof Error) {
        errorMessage = uploadError.message;
        
        // バケットが存在しない場合は404エラー
        if (errorMessage.includes('バケット') && errorMessage.includes('存在しません')) {
          statusCode = 404;
        }
        // 権限エラーの場合は403エラー
        else if (errorMessage.includes('アクセス') || errorMessage.includes('権限')) {
          statusCode = 403;
        }
      }
      
      console.error(`アップロード失敗: ${errorMessage} (${statusCode})`);
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('アップロード処理エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}