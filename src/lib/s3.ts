import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3'

/**
 * S3互換クライアント(MinIO)を生成
 */
export const createS3Client = () => {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const forcePathStyle = process.env.MINIO_FORCE_PATH_STYLE === 'false' ? false : true

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('MinIO環境変数(MINIO_ENDPOINT/MINIO_ACCESS_KEY/MINIO_SECRET_KEY)が設定されていません')
  }

  return new S3Client({
    region: 'us-east-1',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle,
  })
}

/**
 * バケットが存在しない場合に作成
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
 * MinIOへファイルをアップロードして公開URLを返す
 * @param bucket バケット名
 * @param key アップロード先キー
 * @param body ファイルバッファ
 * @param contentType MIMEタイプ
 * @returns 公開URL（http://HOST/bucket/key）
 */
export const uploadFileToS3 = async (
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> => {
  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) {
    throw new Error('MINIO_ENDPOINT環境変数が設定されていません')
  }

  const s3 = createS3Client()

  await ensureBucket(bucket)

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000',
    })
  )

  // パススタイルURLを返却
  const url = `${endpoint.replace(/\/$/, '')}/${bucket}/${encodeURI(key)}`
  return url
}