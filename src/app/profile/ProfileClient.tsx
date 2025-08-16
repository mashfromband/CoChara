'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Edit2, Save, X } from 'lucide-react';
import { Character } from '@/types/character';
import { getEggTypeById } from '@/data/eggTypes';
import EggImage from '../components/character/EggImage';
import ImageUpload from '@/app/components/profile/ImageUpload';
// toast関数の代わりにアラート表示用の関数を定義
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  alert(`${type === 'success' ? '成功' : 'エラー'}: ${message}`);
};

// 日付フォーマット用の関数
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// プロフィールページのメインコンポーネント
/**
 * プロフィールページ
 * - 卵の一覧カードではEggImage(size=80)の高さ(120px)に対してコンテナをw-24 h-32に設定し、切れを防止
 * - API未接続環境ではlocalStorageのselectedEggHistoryからダミー表示
 */
function ProfileContent() {
  // useSession から update を取得してセッション情報を即時更新できるようにする
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  // Admin 判定（現状はユーザー名が 'Admin' の場合）
  const isAdmin = session?.user?.name === 'Admin';

  interface UserData {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    createdAt?: string;
    characters?: Character[];
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editImage, setEditImage] = useState<string | undefined>(undefined);

  /**
   * プロフィールアイコン押下時の遷移
   * Admin の場合のみ /admin へ遷移する
   */
  const handleProfileIconClick = () => {
    if (!isAdmin) return;
    router.push('/admin');
  };

  // APIからユーザー情報を取得する関数
  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      
      // 開発中はAPIリクエストをスキップしてダミーデータを使用
      // 本番環境では以下のコメントを外してAPIリクエストを有効化
      /*
      // APIからユーザー情報を取得
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setUserData(data.user);
      */
      
      // 開発中はダミーデータを使用
      // localStorage から選択した卵の履歴を取得
      let selectedEggHistory: string[] = [];
      try {
        const storageKeySuffix = session?.user?.email ?? 'guest'
        const historyData = localStorage.getItem(`selectedEggHistory:${storageKeySuffix}`);
        if (historyData) {
          selectedEggHistory = JSON.parse(historyData);
        }
      } catch (localStorageError) {
        console.warn('LocalStorage読み取りエラー:', localStorageError);
      }
      
      // 選択された卵からキャラクターデータを作成
      const characters: Character[] = selectedEggHistory.map((eggId, index) => {
        const eggType = getEggTypeById(eggId);
        if (!eggType) return null;
        
        return {
          id: `char-${index + 1}`,
          name: `${eggType.name}の卵`,
          eggType: eggType,
          stats: {
            level: 1, // ダミーデータは常にLv.1で表示（ランダムにしない）
            experience: Math.floor(Math.random() * 150), // ランダム経験値 0-149
            contentCount: Math.floor(Math.random() * 5), // ランダムコンテンツ数 0-4
            evolutionStage: 0
          },
          evolutionHistory: [],
          ownerId: 'dummy-id',
          sharedWith: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }).filter(Boolean) as Character[];
      
      if (session?.user) {
        setUserData({
          id: (session.user.id as string) || 'dummy-id',
          name: session.user.name || 'テストユーザー',
          email: session.user.email || 'test@example.com',
          image: (session.user.image as string) || undefined,
          createdAt: new Date().toISOString(),
          characters: characters
        });
      } else {
        setUserData({
          id: 'dummy-id',
          name: 'テストユーザー',
          email: 'test@example.com',
          image: undefined,
          createdAt: new Date().toISOString(),
          characters: characters
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  
  
  // 編集モードを開始する関数
  const startEditing = () => {
    setEditName(userData?.name || session?.user?.name || '');
    setEditImage(userData?.image || (session?.user?.image as string | undefined) || undefined);
    setIsEditing(true);
  };

  // 編集をキャンセルする関数
  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
    setEditImage(undefined);
  };


  
  // ユーザー情報を更新する関数
  /**
   * プロフィール更新処理
   * - /api/user/profile へ PATCH を送り、name と image をDBに保存
   * - 成功後は useSession.update でセッションの name/image を即時反映
   * - 開発時にAPIが未接続ならローカル状態のみ更新（フォールバック）
   */
  const updateUserProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      let imageUrl = editImage ?? userData?.image;

      // APIにPATCH（本番動作）
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editName,
            image: imageUrl,
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
        }
  
        const data = await response.json();
        setUserData(data.user);
        // セッションを即時更新してヘッダー等へ反映
        await update?.({ user: { ...(session?.user || {}), name: data.user.name, image: (data.signedImageUrl as string) || (session?.user?.image as string) } });
      } catch (apiError) {
        // APIが無効 or 失敗した場合はフォールバック（開発用）
        console.warn('API更新に失敗、ローカル状態でフォールバックします:', apiError);
        setUserData(prev => ({
          ...prev,
          name: editName,
          image: imageUrl,
        }) as UserData);
      }
      
      setIsEditing(false);
      showToast('プロフィールを更新しました', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
      showToast('プロフィールの更新に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // クライアント側のリダイレクト処理はサーバー側へ移行したため削除
  // 認証済みの場合のみデータ取得
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }
    if (status === 'authenticated') {
      refreshUserData();
    }
  }, [status]);

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">読み込み中...</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">プロフィール情報を取得しています</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen pt-20 flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={refreshUserData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold">プロフィール</h1>
          </div>
          
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div
                className={`bg-indigo-100 dark:bg-indigo-900 p-4 rounded-full relative group w-20 h-20 flex items-center justify-center overflow-hidden ${isAdmin ? 'cursor-pointer hover:opacity-90' : ''}`}
                onClick={handleProfileIconClick}
                title={isAdmin ? '管理ページへ移動' : undefined}
                role={isAdmin ? 'button' : undefined}
                aria-label={isAdmin ? '管理ページへ移動' : undefined}
              >
                {(session?.user?.image || (userData?.image && userData.image.startsWith('http'))) ? (
                   // NOTE: ここでの image は将来的に「オブジェクトキー(image/bucket/key)」を保持する
                   // 表示時にはキーから署名URLを生成して <img src={signedUrl}> とする方針
                   <img
                    src={(session?.user?.image as string) || (userData?.image as string)}
                     alt="プロフィール画像"
                     className="w-full h-full object-cover"
                     onError={(e) => { e.currentTarget.style.display = 'none'; }}
                   />
                 ) : (
                   <User size={80} className="text-indigo-600 dark:text-indigo-400 w-full h-full" />
                 )}
              </div>
              
              <div className="flex-grow">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="ユーザー名"
                        />
                      </div>
                      <div className="mt-4">
                        <ImageUpload
                          currentImage={(session?.user?.image as string) || (userData?.image && userData.image.startsWith('http') ? userData.image : undefined)}
                          onImageChange={(url: string) => setEditImage(url)}
                          onCancel={() => { /* 画像アップロードUIの完了。編集モードは維持する */ }}
                          isUploading={isSaving}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={updateUserProfile}
                        disabled={isSaving}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            保存
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        <X size={16} className="mr-2" />
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mr-2">{userData?.name || session?.user?.name}</h2>
                      <button
                        onClick={startEditing}
                        className="inline-flex items-center p-1.5 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                        aria-label="プロフィールを編集"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{userData?.email || session?.user?.email}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">キャラクター</h3>
              {userData?.characters && userData.characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {userData.characters.map((character) => (
                    <div key={character.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                      <a href={`/character/${character.id}`} className="block">
                        <div className="p-4 flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <EggImage 
                              eggType={character.eggType} 
                              animated={false} 
                              isSelected={false} 
                              size={80}
                            />
                          </div>
                          <div className="w-px h-20 bg-gray-200 dark:bg-gray-600 mx-4"></div>
                          <div style={{ marginLeft: 32}}>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{character.name}</h4>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                Lv.{character.stats.level}
                              </span>
                              <span className="ml-2">{character.eggType.name}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">まだキャラクターを持っていません。</p>
              )}
              <div className="mt-4">
                <a 
                  href="/character/create" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {userData?.characters && userData.characters.length > 0 ? '新しい卵を手に入れる' : '初めての卵を手に入れる'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileContent;