// Google Cloud Storageバケットを作成するスクリプト
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

// GCSクライアントの初期化
let storage;
try {
  // 環境変数からサービスアカウントキーのJSONを取得
  const serviceAccountKeyBase64 = process.env.GCP_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKeyBase64) {
    console.error('GCP_SERVICE_ACCOUNT_KEY環境変数が設定されていません');
    process.exit(1);
  }
  
  // Base64デコードしてからJSONをパースしてクレデンシャルとして使用
  const serviceAccountKeyJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
  const credentials = JSON.parse(serviceAccountKeyJson);
  
  // Storageクライアントを初期化
  storage = new Storage({
    credentials,
    projectId: credentials.project_id,
  });
} catch (error) {
  console.error('GCSクライアントの初期化に失敗しました:', error);
  process.exit(1);
}

// バケットを作成する関数
async function createBucket(bucketName, location = 'us-central1') {
  try {
    // バケットが存在するか確認
    const [buckets] = await storage.getBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);

    if (bucketExists) {
      console.log(`バケット '${bucketName}' は既に存在します`);
      return;
    }

    // バケットを作成
    const [bucket] = await storage.createBucket(bucketName, {
      location,
      storageClass: 'STANDARD',
      cors: [
        {
          origin: ['*'],
          method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          responseHeader: ['Content-Type', 'Access-Control-Allow-Origin'],
          maxAgeSeconds: 3600
        }
      ],
    });

    console.log(`バケット '${bucketName}' を作成しました`);

    // uniform bucket-level accessを有効にする
    await bucket.setIamPolicy({
      bindings: [
        {
          role: 'roles/storage.objectViewer',
          members: ['allUsers'],
        },
      ],
      uniformBucketLevelAccess: true,
    });
    console.log(`バケット '${bucketName}' をuniform bucket-level accessで公開設定にしました`);
  } catch (error) {
    console.error(`バケット '${bucketName}' の作成に失敗しました:`, error.message);
  }
}

// メイン処理
async function main() {
  try {
    // 画像用バケットを作成
    await createBucket('cochara_images');
    
    // 動画用バケットを作成
    await createBucket('cochara_videos');
    
    console.log('すべてのバケットの作成が完了しました');
  } catch (error) {
    console.error('バケット作成中にエラーが発生しました:', error.message);
  }
}

// スクリプトを実行
main();