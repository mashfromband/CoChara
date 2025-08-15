import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * S3互換クライアント(MinIO/R2)を生成
 */
export const createS3Client = () => {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const forcePathStyle = process.env.MINIO_FORCE_PATH_STYLE === 'false' ? false : true

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('MinIO環境変数(MINIO_ENDPOINT/MINIO_ACCESS_KEY/MINIO_SECRET_KEY)が設定されていません')
  }

  // Cloudflare R2用の最適化: region を auto に設定（R2の推奨）
  // R2のエンドポイント（*.r2.cloudflarestorage.com）の場合は region: 'auto'
  const isR2Endpoint = endpoint.includes('.r2.cloudflarestorage.com')
  const region = isR2Endpoint ? 'auto' : 'us-east-1'

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle,
  })
}

/**
 * バケットが存在しない場合に作成
 * @param bucket - バケット名
 */
export const ensureBucket = async (bucket: string) => {
  const s3 = createS3Client()
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))
  }
}

/**
 * MinIOへファイルをアップロード（private）
 * - 返り値は公開URLではなく、バケット/キー（パス）を返す
 * @param bucket - バケット名
 * @param key - アップロード先キー
 * @param body - ファイルバッファ
 * @param contentType - MIMEタイプ
 * @returns アップロードしたオブジェクトのパス（例: `${bucket}/${key}`）
 */
export const uploadFileToS3 = async (
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> => {
  const s3 = createS3Client()

  await ensureBucket(bucket)

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // ACLは指定しない（デフォルトprivate）
      CacheControl: 'public, max-age=31536000',
    })
  )

  // 公開URLは返さず、S3パスを返す
  return `${bucket}/${key}`
}

/**
 * オブジェクトを取得するための署名付きURLを生成
 * @param bucket - バケット名
 * @param key - オブジェクトキー
 * @param expiresInSec - 有効期限(秒)。未指定時は環境変数 S3_SIGNED_URL_EXPIRES、無ければ3600秒。
 * @returns 署名付きURL
 */
export const getSignedUrlForObject = async (
  bucket: string,
  key: string,
  expiresInSec?: number
): Promise<string> => {
  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) {
    throw new Error('MINIO_ENDPOINT環境変数が設定されていません')
  }

  const s3 = createS3Client()
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const expires = typeof expiresInSec === 'number'
    ? expiresInSec
    : (process.env.S3_SIGNED_URL_EXPIRES ? Number(process.env.S3_SIGNED_URL_EXPIRES) : 3600)

  // 署名付きURLを生成
  const signed = await getSignedUrl(s3, command, { expiresIn: expires })
  return signed
}