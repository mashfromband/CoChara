'use client';

import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Edit2, Save, X } from 'lucide-react';
import { Character } from '@/types/character';
import { getEggTypeById } from '@/data/eggTypes';
import EggImage from '../components/character/EggImage';
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
function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
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
      if (session?.user) {
        setUserData({
          id: session.user.id as string || 'dummy-id',
          name: session.user.name || 'テストユーザー',
          email: session.user.email || 'test@example.com',
          image: '/next.svg',
          createdAt: new Date().toISOString()
        });
      } else {
        setUserData({
          id: 'dummy-id',
          name: 'テストユーザー',
          email: 'test@example.com',
          image: '',
          createdAt: new Date().toISOString()
        });
      }
      
      setError(null); // エラーをクリア
    } catch (err) {
      console.error('Error refreshing user data:', err);
      // エラー時もダミーデータを表示
      const cosmicEggType = getEggTypeById('cosmic');
      const classicEggType = getEggTypeById('classic');
      
      if (!cosmicEggType || !classicEggType) {
        console.error('卵タイプが見つかりません');
        return;
      }
      
      setUserData({
        id: 'dummy-id',
        name: 'テストユーザー',
        email: 'test@example.com',
        image: '/next.svg',
        createdAt: new Date().toISOString(),
        characters: [
          {
            id: 'char-1',
            name: 'ミステリーエッグ',
            eggType: cosmicEggType,
            stats: {
              level: 1,
              experience: 0,
              contentCount: 0,
              evolutionStage: 0
            },
            evolutionHistory: [],
            ownerId: 'dummy-id',
            sharedWith: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'char-2',
            name: 'クラシックエッグ',
            eggType: classicEggType,
            stats: {
              level: 2,
              experience: 75,
              contentCount: 3,
              evolutionStage: 0
            },
            evolutionHistory: [],
            ownerId: 'dummy-id',
            sharedWith: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };


  
  // 編集モードを開始する関数
  const startEditing = () => {
    setEditName(userData?.name || session?.user?.name || '');
    setIsEditing(true);
  };

  // 編集をキャンセルする関数
  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };


  
  // ユーザー情報を更新する関数
  const updateUserProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      let imageUrl = userData?.image;

      // 開発中はAPIリクエストをスキップしてローカルで更新
      // 本番環境では以下のコメントを外してAPIリクエストを有効化
      /*
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
      // 更新されたユーザーデータを設定
      setUserData(data.user);
      */
      
      // 開発中はローカルでデータを更新
      setUserData(prev => ({
        ...prev,
        name: editName,
        image: imageUrl,
      }) as UserData);
      
      // 編集モードを終了
      setIsEditing(false);
      
      // 成功メッセージを表示
      showToast('プロフィールを更新しました', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
      showToast('プロフィールの更新に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // リダイレクト処理を追跡するためのフラグ
  const [redirected, setRedirected] = useState(false);

  // 認証状態に応じてリダイレクトまたはデータ取得
  useEffect(() => {
    // ローカルストレージを使用してリダイレクト状態を管理
    const hasRedirected = localStorage.getItem('profile_redirected') === 'true';
    
    if (status === 'unauthenticated' && !hasRedirected) {
      // 未ログインの場合はログインページにリダイレクト（一度だけ）
      console.log('Redirecting to login page...');
      localStorage.setItem('profile_redirected', 'true');
      router.push('/login');
      // リダイレクト中もローディング状態を維持
      setIsLoading(true);
    } else if (status === 'authenticated') {
      // 認証済みの場合はユーザーデータを更新
      console.log('User is authenticated, refreshing data...');
      localStorage.removeItem('profile_redirected'); // リダイレクトフラグをクリア
      refreshUserData();
      setIsLoading(false);
    } else if (status === 'loading') {
      // ロード中はisLoadingをtrueのままにする
      console.log('Authentication status is loading...');
      setIsLoading(true);
    }
  }, [status, router]); // 依存配列を最小限に
  

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">読み込み中...</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">プロフィール情報を取得しています</p>
      </div>
    );
  }
  
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
              <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-full relative group w-20 h-20 flex items-center justify-center overflow-hidden">
                <User size={80} className="text-indigo-600 dark:text-indigo-400 w-full h-full" />
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
                          <div className="w-16 h-16 flex-shrink-0">
                            <EggImage 
                              eggType={character.eggType} 
                              animated={false} 
                              isSelected={false} 
                            />
                          </div>
                          <div>
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

// メインのエクスポートコンポーネント - SessionProviderでラップ
export default function ProfilePage() {
  return (
    <SessionProvider>
      <ProfileContent />
    </SessionProvider>
  );
}