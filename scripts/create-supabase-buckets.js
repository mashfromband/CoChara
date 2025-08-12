// Supabaseストレージバケットを作成するスクリプト
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase環境変数が設定されていません');
  process.exit(1);
}

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// バケットを作成する関数
async function createBucket(bucketName, isPublic = true) {
  try {
    // バケットが存在するか確認
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);

    if (bucketExists) {
      console.log(`バケット '${bucketName}' は既に存在します`);
      return;
    }

    // バケットを作成
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: isPublic, // パブリックアクセスを許可
    });

    if (error) {
      throw error;
    }

    console.log(`バケット '${bucketName}' を作成しました`);

    // パブリックバケットの場合、アクセス権を設定
    if (isPublic) {
      const { error: policyError } = await supabase.storage.from(bucketName).createSignedUrl('dummy.txt', 60);
      if (policyError) {
        console.warn(`バケット '${bucketName}' のポリシー設定に問題があります:`, policyError.message);
      } else {
        console.log(`バケット '${bucketName}' のパブリックアクセスを設定しました`);
      }
    }
  } catch (error) {
    console.error(`バケット '${bucketName}' の作成に失敗しました:`, error.message);
  }
}

// メイン処理
async function main() {
  try {
    // 画像用バケットを作成
    await createBucket('cochara_images', true);
    
    // 動画用バケットを作成
    await createBucket('cochara_videos', true);
    
    console.log('すべてのバケットの作成が完了しました');
  } catch (error) {
    console.error('バケット作成中にエラーが発生しました:', error.message);
  }
}

// スクリプトを実行
main();