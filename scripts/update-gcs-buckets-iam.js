// 既存のGCSバケットにuniform bucket-level accessを設定するスクリプト
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

// バケットのIAMポリシーを更新する関数
async function updateBucketIAM(bucketName) {
  try {
    // バケットが存在するか確認
    const [exists] = await storage.bucket(bucketName).exists();
    if (!exists) {
      console.error(`バケット '${bucketName}' は存在しません`);
      return;
    }

    const bucket = storage.bucket(bucketName);
    
    // uniform bucket-level accessを有効にする
    await bucket.setMetadata({
      iamConfiguration: {
        uniformBucketLevelAccess: {
          enabled: true,
        },
      },
    });
    console.log(`バケット '${bucketName}' でuniform bucket-level accessを有効にしました`);
    
    // バケットを公開アクセス可能に設定
    // IAMポリシーを取得
    const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
    
    // allUsersにobjectViewerロールを付与
    if (!policy.bindings) {
      policy.bindings = [];
    }
    
    // 既存のobjectViewerロールの設定を確認
    let objectViewerBinding = policy.bindings.find(binding => binding.role === 'roles/storage.objectViewer');
    
    if (!objectViewerBinding) {
      // objectViewerロールがない場合は新規作成
      objectViewerBinding = {
        role: 'roles/storage.objectViewer',
        members: ['allUsers']
      };
      policy.bindings.push(objectViewerBinding);
    } else if (!objectViewerBinding.members.includes('allUsers')) {
      // objectViewerロールはあるがallUsersがない場合は追加
      objectViewerBinding.members.push('allUsers');
    }
    
    // 更新したポリシーを設定
    await bucket.iam.setPolicy(policy);
    
    console.log(`バケット '${bucketName}' のIAMポリシーを更新しました`);
  } catch (error) {
    console.error(`バケット '${bucketName}' のIAMポリシー更新に失敗しました:`, error.message);
  }
}

// メイン処理
async function main() {
  try {
    // 画像用バケットを更新
    await updateBucketIAM('cochara_images');
    
    // 動画用バケットを更新
    await updateBucketIAM('cochara_videos');
    
    console.log('すべてのバケットの更新が完了しました');
  } catch (error) {
    console.error('バケット更新中にエラーが発生しました:', error.message);
  }
}

// スクリプトを実行
main();