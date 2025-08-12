import { Storage } from '@google-cloud/storage';

/**
 * Google Cloud Storageクライアントの初期化
 * サービスアカウントキーを使用して認証を行う
 */
export const createGCSClient = () => {
  try {
    // 環境変数からサービスアカウントキーのJSONを取得
    const serviceAccountKeyBase64 = process.env.GCP_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKeyBase64) {
      console.error('GCP_SERVICE_ACCOUNT_KEY環境変数が設定されていません');
      return null;
    }
    
    // Base64デコードしてからJSONをパース
    try {
      // Base64デコード
      const serviceAccountKeyJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString();
      // JSONをパースしてクレデンシャルとして使用
      const credentials = JSON.parse(serviceAccountKeyJson);
      
      console.log('GCSクライアント初期化: プロジェクトID =', credentials.project_id);
      
      // Storageクライアントを初期化
      return new Storage({
        credentials,
        projectId: credentials.project_id,
      });
    } catch (parseError) {
      console.error('サービスアカウントキーのパースに失敗しました:', parseError);
      return null;
    }
  } catch (error) {
    console.error('GCSクライアントの初期化に失敗しました:', error);
    return null;
  }
};

/**
 * ファイルをGCSにアップロードする関数
 * 
 * @param bucketName - バケット名
 * @param fileName - ファイル名
 * @param fileBuffer - ファイルのバッファ
 * @param contentType - ファイルのMIMEタイプ
 * @returns アップロードされたファイルの公開URL
 */
export const uploadFileToGCS = async (
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> => {
  console.log(`GCSアップロード開始: ${fileName} to ${bucketName}, サイズ: ${fileBuffer.length} bytes`);
  
  const storage = createGCSClient();
  
  if (!storage) {
    console.error('GCSクライアント初期化エラー: ストレージクライアントがnullです');
    throw new Error('GCSクライアントの初期化に失敗しました');
  }
  
  try {
    // バケットが存在するか確認
    try {
      const [exists] = await storage.bucket(bucketName).exists();
      if (!exists) {
        console.error(`バケットが存在しません: ${bucketName}`);
        throw new Error(`バケット '${bucketName}' が存在しません`);
      }
    } catch (bucketError) {
      console.error('バケット確認エラー:', bucketError);
      throw new Error(`バケット '${bucketName}' へのアクセスに失敗しました`);
    }
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    
    console.log(`ファイルアップロード処理: ${fileName}`);
    
    // ファイルをアップロード
    await file.save(fileBuffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    console.log(`ファイルアップロード完了: ${fileName}`);
    
    // uniform bucket-level accessが有効な場合はmakePublic()を使用せず、直接URLを生成
    const fileUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log(`アップロード成功: ${fileUrl}`);
    
    // 公開URLを返す
    return fileUrl;
  } catch (error) {
    console.error('GCSへのファイルアップロードに失敗しました:', error);
    if (error instanceof Error) {
      throw error; // 元のエラーをそのまま投げる
    } else {
      throw new Error('ファイルのアップロードに失敗しました');
    }
  }
};