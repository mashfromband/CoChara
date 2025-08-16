/**
 * 画像関連のユーティリティ関数
 * - オブジェクトキーから署名URLを生成する機能
 */

import { getSignedUrlForObject } from '@/lib/s3';

/**
 * 画像キー（bucket/key形式）から署名URLを生成
 * @param imageKey - オブジェクトキー（例: "image/profile-123456.jpg"）
 * @param expiresInSec - 有効期限（秒）、未指定時は3600秒（1時間）
 * @returns 署名付きURL、エラー時は null
 */
export async function generateSignedImageUrl(
  imageKey: string | null | undefined,
  expiresInSec?: number
): Promise<string | null> {
  if (!imageKey || typeof imageKey !== 'string') {
    return null;
  }

  try {
    // キーが "bucket/key" 形式か確認
    const parts = imageKey.split('/');
    if (parts.length < 2) {
      console.warn('Invalid image key format:', imageKey);
      return null;
    }

    const bucket = parts[0];
    const key = parts.slice(1).join('/');

    // MinIO環境変数チェック
    if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
      console.warn('MinIO環境変数が設定されていません。署名URL生成をスキップします。');
      return null;
    }

    return await getSignedUrlForObject(bucket, key, expiresInSec);
  } catch (error) {
    console.error('署名URL生成エラー:', error);
    return null;
  }
}

/**
 * 画像キーが有効なフォーマットかチェック
 * @param imageKey - チェック対象のキー
 * @returns true if valid format
 */
export function isValidImageKey(imageKey: string | null | undefined): boolean {
  if (!imageKey || typeof imageKey !== 'string') {
    return false;
  }

  // "bucket/key" 形式をチェック
  const parts = imageKey.split('/');
  return parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0;
}