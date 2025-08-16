'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'
import { getEggTypeById } from '@/data/eggTypes'
import EggImage from '@/app/components/character/EggImage'
import { motion } from 'framer-motion'
import { Character } from '@/types/character'
import { useSocket } from '@/hooks/useSocket'

// キャラクター詳細ページ
/**
 * キャラクター詳細ページ
 * - 卵表示領域はEggImage(size=192)の高さ(288px)に合わせてh-72を使用し、卵全体が見切れないように調整
 * - 左上の「戻る」ボタンは router.back() を用いて直前のページへ遷移
 */
export default function CharacterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // リアルタイム（Socket.IO）関連のフック
  // useSocketから必要なAPIだけ取得
  const { connected, joinRoom, shareState, on, off } = useSocket()
  
  // コンテンツ追加モーダル関連のstate
  const [showAddContentModal, setShowAddContentModal] = useState(false)
  const [contentUrl, setContentUrl] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  const [contentType, setContentType] = useState<'music' | 'video' | 'article' | 'image' | 'other'>('other')
  const [isAddingContent, setIsAddingContent] = useState(false)
  const [addContentError, setAddContentError] = useState<string | null>(null)
  
  // レベルアップモーダル関連のstate
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [levelUpInfo, setLevelUpInfo] = useState<{oldLevel: number, newLevel: number, expGained: number} | null>(null)
  
  // キャラクターIDを取得
  const characterId = params.id as string
  
  // 経験値からレベルを計算する関数
  const calculateLevel = (experience: number) => {
    // 50経験値ごとにレベルアップ
    return Math.floor(experience / 50) + 1;
  }

  /**
   * ルームに参加し、リアルタイム更新のリスナーを登録する
   * 同一キャラクターIDの閲覧者間でステータスを同期
   */
  useEffect(() => {
    if (!characterId || !connected) return

    // ルーム参加
    joinRoom(characterId)

    // 受信ハンドラ: 他クライアントからの状態共有（character更新）
    const handleState = (data: { sender: string; state: any }) => {
      const received = data?.state
      if (!received) return

      // 期待フォーマット: { event: 'character:update', character: Character }
      if (received.event === 'character:update' && received.character?.id === characterId) {
        // 受信したキャラクター情報でローカル状態を更新
        setCharacter((prev) => {
          // 競合を避けるため、最新をそのまま反映（将来的にマージ戦略を検討）
          return received.character as Character
        })
      }
    }

    // 登録
    on('room:state', handleState)

    // クリーンアップ
    return () => {
      off('room:state', handleState)
    }
  }, [characterId, connected, joinRoom, on, off])

  // コンテンツ追加時の処理
  const handleAddContent = async () => {
    if (!contentUrl || !contentTitle) {
      setAddContentError('URLとタイトルを入力してください');
      return;
    }

    if (!character) {
      setAddContentError('キャラクター情報が読み込まれていません');
      return;
    }

    try {
      setIsAddingContent(true);
      setAddContentError(null);

      // ランダムな経験値（1〜3）を生成
      const expGained = Math.floor(Math.random() * 3) + 1;
      
      // 現在のキャラクター情報をコピー
      const updatedCharacter: Character = {
        ...character,
        stats: { ...character.stats }
      };
      
      // 経験値とコンテンツ数を更新
      const oldExperience = updatedCharacter.stats.experience;
      const newExperience = oldExperience + expGained;
      const oldLevel = updatedCharacter.stats.level;
      const newLevel = calculateLevel(newExperience);
      
      updatedCharacter.stats.experience = newExperience;
      updatedCharacter.stats.contentCount += 1;
      updatedCharacter.stats.level = newLevel;
      
      // 本番環境では以下のようにAPIリクエストを実装
      /*
      const response = await fetch(`/api/characters/${characterId}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: contentUrl,
          title: contentTitle,
          type: contentType,
          expGained: expGained
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'コンテンツの追加に失敗しました');
      }
      
      const data = await response.json();
      setCharacter(data.character);
      */
      
      // 開発中はフロントエンドでデータを更新
      setCharacter(updatedCharacter);

      // 同じキャラクターIDの閲覧者へ状態を共有
      // ここでSocket.IOのstate共有を利用
      shareState(characterId, { event: 'character:update', character: updatedCharacter })
      
      // モーダルを閉じて入力をリセット
      setShowAddContentModal(false);
      setContentUrl('');
      setContentTitle('');
      setContentType('other');
      
      // レベルアップした場合はモーダルを表示
      if (newLevel > oldLevel) {
        setLevelUpInfo({
          oldLevel,
          newLevel,
          expGained
        });
        setShowLevelUpModal(true);
      }
      
    } catch (err) {
      console.error('コンテンツ追加エラー:', err);
      setAddContentError('コンテンツの追加に失敗しました');
    } finally {
      setIsAddingContent(false);
    }
  };

  // キャラクター情報を取得
  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        setIsLoading(true)
        
        // 開発中はAPIリクエストをスキップしてダミーデータを使用
        // 本番環境では以下のコメントを外してAPIリクエストを有効化
        /*
        const response = await fetch(`/api/characters/${characterId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'キャラクター情報の取得に失敗しました')
        }
        
        const data = await response.json()
        setCharacter(data)
        */
        
        // 開発中はダミーデータを使用
        // localStorage から選択された卵の履歴を取得
        let selectedEggType = null;
        try {
          const storageKeySuffix = session?.user?.email ?? 'guest'
          // まず selectedEggHistory から該当する卵を探す（ユーザー別キー）
          const historyData = localStorage.getItem(`selectedEggHistory:${storageKeySuffix}`);
          if (historyData) {
            const history = JSON.parse(historyData);
            // キャラクターIDから対応する卵を推定 (char-1なら最初の卵など)
            const characterIndex = parseInt(characterId.replace('char-', '')) - 1;
            if (characterIndex >= 0 && characterIndex < history.length) {
              selectedEggType = getEggTypeById(history[characterIndex]);
            }
          }
          
          // 履歴にない場合は currentGachaState から取得（ユーザー別キー）
          if (!selectedEggType) {
            const gachaState = localStorage.getItem(`currentGachaState:${storageKeySuffix}`);
            if (gachaState) {
              const parsed = JSON.parse(gachaState);
              if (parsed.selectedEgg) {
                selectedEggType = getEggTypeById(parsed.selectedEgg);
              }
            }
          }
        } catch (localStorageError) {
          console.warn('LocalStorage読み取りエラー:', localStorageError);
        }
        
        // localStorage から取得できない場合は cosmic をフォールバック
        if (!selectedEggType) {
          selectedEggType = getEggTypeById('cosmic');
        }
        
        if (!selectedEggType) {
          throw new Error('卵タイプが見つかりません');
        }
        
        const dummyCharacter: Character = {
          id: characterId,
          name: `${selectedEggType.name}の卵`,
          eggType: selectedEggType, // LocalStorage から取得した卵タイプを使用
          stats: {
            level: 1,
            experience: 0,
            contentCount: 0,
            evolutionStage: 0
          },
          evolutionHistory: [],
          ownerId: 'dummy-owner',
          sharedWith: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        setCharacter(dummyCharacter)
        setError(null)
      } catch (err) {
        console.error('キャラクター情報取得エラー:', err)
        setError('キャラクター情報の取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCharacter()
  }, [characterId])
  
  // 認証状態に応じてリダイレクト
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">読み込み中...</h2>
          <p className="text-white/80">しばらくお待ちください</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white bg-red-500/20 p-6 rounded-lg max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">エラーが発生しました</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }
  
  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white bg-yellow-500/20 p-6 rounded-lg max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">キャラクターが見つかりません</h2>
          <p className="text-white/80 mb-4">指定されたキャラクターは存在しないか、アクセス権限がありません。</p>
          <button onClick={() => router.back()} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors inline-block">
            戻る
          </button>
        </div>
      </div>
    )
  }
  
  // 卵タイプ情報を取得
  // character.eggTypeはすでにEggTypeオブジェクトなので、そのまま使用
  const eggType = character ? character.eggType : {
    id: 'default',
    name: '不明な卵',
    description: '謎に包まれた卵',
    rarity: 'common' as const,
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    strokeColor: 'stroke-gray-400',
    pattern: 'stars',
    characteristics: ['謎', '未知', '可能性']
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800">
      <div className="container mx-auto px-4 py-6">
        {/* 左上の戻るボタン（直前のページへ） */}
        <div className="flex justify-start mb-6">
          <button onClick={() => router.back()} className="bg-white text-indigo-700 px-6 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            戻る
          </button>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* 卵の表示 */}
            <div className="relative flex-shrink-0">
              <EggImage 
                eggType={eggType} 
                size={192} 
                animated={true} 
                isSelected={false} 
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
              {/* LIVE同期バッジ */}
              <div className="mb-3">
                {connected ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-300 mr-1.5 animate-pulse" />
                    LIVE同期中
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-200">
                    <span className="w-2 h-2 rounded-full bg-gray-300 mr-1.5" />
                    オフライン
                  </span>
                )}
              </div>
              <p className="text-white/80 mb-4">{eggType.description}</p>
            </div>
          </div>
            
            {/* キャラクター情報 */}
            <div className="flex-grow text-white">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-white/60 mb-1">レベル</h3>
                  <p className="text-2xl font-bold">{character.stats.level}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-white/60 mb-1">経験値</h3>
                  <p className="text-2xl font-bold">{character.stats.experience}</p>
                  <div className="text-xs text-white/60">
                    次のレベルまで: {50 - (character.stats.experience % 50)}
                  </div>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-white/60 mb-1">コンテンツ数</h3>
                  <p className="text-2xl font-bold">{character.stats.contentCount}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-white/60 mb-1">進化段階</h3>
                  <p className="text-2xl font-bold">{character.stats.evolutionStage}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => setShowAddContentModal(true)}
                >
                  コンテンツを追加
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                  進化を確認
                </button>
                <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors">
                  共有設定
                </button>
              </div>
            </div>
          
          {/* コンテンツ履歴（開発中は空の状態） */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">コンテンツ履歴</h2>
            <div className="bg-white/5 rounded-lg p-6 text-center text-white/60">
              <p>まだコンテンツがありません。「コンテンツを追加」ボタンからキャラクターにコンテンツを追加しましょう。</p>
            </div>
          </div>
        </div>
        
        {/* コンテンツ追加モーダル */}
        {showAddContentModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-indigo-900 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-white">コンテンツを追加</h2>
              
              {addContentError && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">{addContentError}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-white/80 mb-2" htmlFor="content-url">
                  URL
                </label>
                <input
                  id="content-url"
                  type="text"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="w-full bg-indigo-800/50 border border-indigo-700 rounded-md px-3 py-2 text-white"
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-white/80 mb-2" htmlFor="content-title">
                  タイトル
                </label>
                <input
                  id="content-title"
                  type="text"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  className="w-full bg-indigo-800/50 border border-indigo-700 rounded-md px-3 py-2 text-white"
                  placeholder="コンテンツのタイトル"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-white/80 mb-2" htmlFor="content-type">
                  タイプ
                </label>
                <select
                  id="content-type"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full bg-indigo-800/50 border border-indigo-700 rounded-md px-3 py-2 text-white"
                >
                  <option value="music">音楽</option>
                  <option value="video">動画</option>
                  <option value="article">記事</option>
                  <option value="image">画像</option>
                  <option value="other">その他</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddContentModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md transition-colors"
                  disabled={isAddingContent}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddContent}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  disabled={isAddingContent}
                >
                  {isAddingContent ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      追加中...
                    </>
                  ) : (
                    '追加する'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* レベルアップモーダル */}
        {showLevelUpModal && levelUpInfo && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-lg p-6 w-full max-w-md text-center"
            >
              <h2 className="text-3xl font-bold mb-2 text-yellow-100">レベルアップ！</h2>
              <p className="text-yellow-200 mb-6">おめでとうございます！</p>
              
              <div className="flex justify-center items-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-yellow-200 text-sm">Before</div>
                  <div className="text-4xl font-bold text-white">{levelUpInfo.oldLevel}</div>
                </div>
                
                <div className="text-4xl">→</div>
                
                <div className="text-center">
                  <div className="text-yellow-200 text-sm">After</div>
                  <div className="text-4xl font-bold text-white">{levelUpInfo.newLevel}</div>
                </div>
              </div>
              
              <p className="text-yellow-200 mb-8">
                コンテンツを追加して <span className="font-bold text-white">+{levelUpInfo.expGained} EXP</span> を獲得しました！
              </p>
              
              <button
                onClick={() => setShowLevelUpModal(false)}
                className="bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold px-6 py-3 rounded-md transition-colors"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}