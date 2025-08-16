'use client';

import { useState, useRef } from 'react';
import { Upload, X, User, Camera } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onCancel: () => void;
  isUploading: boolean;
}

/**
 * プロフィール画像アップロードコンポーネント
 * - ワンクリックで選択→自動アップロード
 * - 対応形式: image/jpeg, image/png, image/gif, image/webp
 * - 最大ファイルサイズ: 10MB
 */
export default function ImageUpload({ 
  currentImage, 
  onImageChange, 
  onCancel, 
  isUploading 
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択時の処理（即座にアップロード実行）
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルタイプの検証
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('JPEG、PNG、GIF、WebP形式のファイルのみ対応しています');
      return;
    }

    // ファイルサイズの検証（10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('ファイルサイズは10MB以下にしてください');
      return;
    }

    setUploadError('');

    // プレビュー用のURLを生成
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // 即座にアップロードを実行
    await handleUpload(file);
  };

  /**
   * アップロード実行
   */
  const handleUpload = async (file: File) => {
    try {
      setUploadError('');

      // 一意なファイル名を生成（タイムスタンプ + ランダム文字列）
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile-${timestamp}-${randomString}.${fileExtension}`;

      // FormDataを作成
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('bucketName', 'image'); // 画像専用バケット

      // アップロードAPIを呼び出し
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アップロードに失敗しました');
      }

      const result = await response.json();
      
      // アップロード結果としては「オブジェクトキー（bucket/key）」を保存する
      // 署名URLは都度生成する方針のため、ここではキーを親に渡す
      const objectKey = result.filePath || result.fileUrl || result.path;
      if (!objectKey) {
        throw new Error('アップロードされた画像のキーを取得できませんでした');
      }

      // 親コンポーネントに画像キーを通知（DB保存用）
      onImageChange(objectKey);

      // プレビューはユーザーが「完了」を押すまで表示を維持する
      // setPreviewUrl('');

    } catch (error) {
      console.error('アップロードエラー:', error);
      setUploadError(error instanceof Error ? error.message : 'アップロードに失敗しました');
    }
  };

  /**
   * 画像選択/アップロードUIの完了処理
   * - プレビューをクリアして、親の onCancel を呼ぶ
   */
  const handleDone = () => {
    setPreviewUrl('');
    onCancel();
  };

  /**
   * アバター画像をクリック → ファイル選択を開く
   */
  const handleAvatarClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* アバター画像表示 & クリック選択エリア */}
      <div className="flex items-center justify-center">
        <div
          className="relative w-32 h-32 bg-indigo-100 dark:bg-indigo-900 rounded-full overflow-hidden cursor-pointer transition-all hover:ring-4 hover:ring-indigo-300 dark:hover:ring-indigo-600"
          onClick={handleAvatarClick}
          title="クリックで画像を変更"
        >
          {previewUrl ? (
            // プレビュー画像
            <img 
              src={previewUrl} 
              alt="プレビュー" 
              className="w-full h-full object-cover"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : currentImage ? (
            // 現在の画像
            <img 
              src={currentImage} 
              alt="現在のプロフィール画像" 
              className="w-full h-full object-cover"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement!;
                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>';
              }}
            />
          ) : (
            // デフォルト表示
            <div className="w-full h-full flex items-center justify-center">
              <User size={64} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          
          {/* ホバー時のカメラアイコン */}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {isUploading ? (
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white rounded-full"></div>
            ) : (
              <Camera size={32} className="text-white" />
            )}
          </div>
        </div>
      </div>

      {/* ファイル選択（非表示） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* 操作ヒント */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isUploading ? 'アップロード中...' : '画像をクリックして変更'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          JPEG, PNG, GIF, WebP • 最大10MB
        </p>
      </div>

      {/* エラーメッセージ */}
      {uploadError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
          <button
            type="button"
            onClick={() => {
              setUploadError('');
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="mt-2 text-xs text-indigo-600 hover:underline dark:text-indigo-400 disabled:opacity-50"
          >
            別の画像を選ぶ
          </button>
        </div>
      )}

      {/* 完了ボタン */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleDone}
          disabled={isUploading}
          className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          完了
        </button>
      </div>
    </div>
  );
}