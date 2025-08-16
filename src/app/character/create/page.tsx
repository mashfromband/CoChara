'use client'

import React, { useState, useEffect } from 'react'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'
import EggSelection from '@/app/components/character/EggSelection'
import { getEggTypeById } from '@/data/eggTypes'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useSession } from 'next-auth/react'

export default function CreateCharacterPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [userOwnedEggIds, setUserOwnedEggIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ユーザーごとにlocalStorageキーを分離
  const storageKeySuffix = session?.user?.email ?? 'guest'
  
  const [selectedEggHistory, setSelectedEggHistory] = useLocalStorage<string[]>(`selectedEggHistory:${storageKeySuffix}`, [])
  const [currentGachaState, setCurrentGachaState] = useLocalStorage<{
    randomEggs: string[],
    selectedEgg: string | null,
    canReroll: boolean,
    rerollCount: number
  }>(`currentGachaState:${storageKeySuffix}`, {
    randomEggs: [],
    selectedEgg: null,
    canReroll: true,
    rerollCount: 0
  })
  const isAfterThirdEgg = selectedEggHistory.length >= 3
  
  // APIからユーザーの卵コレクションを取得
  useEffect(() => {
    const fetchUserEggs = async () => {
      try {
        const response = await fetch('/api/user/eggs')
        
        if (!response.ok) {
          // エラーの場合はモックデータを使用
          console.warn('卵コレクション取得エラー、モックデータを使用します')
          setUserOwnedEggIds(['pastel', 'cosmic'])
          return
        }
        
        const data = await response.json()
        setUserOwnedEggIds(data.eggs.map((egg: { id: string }) => egg.id))
      } catch (err) {
        console.error('卵コレクション取得エラー:', err)
        setError('卵コレクションの取得に失敗しました')
        // エラー時はモックデータを使用
        setUserOwnedEggIds(['pastel', 'cosmic'])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserEggs()
  }, [])

  /**
   * handleEggSelected
   * 卵選択後に呼び出されるハンドラ。
   * 1) 選択卵の履歴をユーザー別localStorageへ保存
   * 2) 卵からキャラクター作成APIを呼び出し
   * 3) 成功後にマイページ（/profile）へ遷移
   */
  const handleEggSelected = async (eggId: string) => {
    setIsCreating(true)
    
    try {
      const selectedEgg = getEggTypeById(eggId)
      
      if (!selectedEgg) {
        throw new Error('選択された卵が見つかりません')
      }

      // 選択した卵の履歴を更新
      setSelectedEggHistory([...selectedEggHistory, eggId])

      // 卵ガチャのAPIコール
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eggTypeId: eggId,
          name: `${selectedEgg.name}の卵`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '卵ガチャに失敗しました')
      }

      const character = await response.json()

      // 成功時の処理
      console.log('卵ガチャ成功:', character)
      
      // 少し待機してからマイページへ遷移
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/profile')
      
    } catch (error: any) {
      console.error('卵ガチャエラー:', error)
    alert(error.message || '卵ガチャに失敗しました。もう一度お試しください。')
    } finally {
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">キャラクターを作成中...</h2>
          <p className="text-white/80">あなたの相棒が誕生するまでしばらくお待ちください</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">データを読み込み中...</h2>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800">
      <div className="container mx-auto px-4 py-6">
        {/* 左上のホームに戻るボタン */}
        <div className="flex justify-start mb-6">
          <Link href="/" className="bg-white text-indigo-700 px-6 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            ホームに戻る
          </Link>
        </div>
        <EggSelection 
          onEggSelected={handleEggSelected}
          excludeEggIds={userOwnedEggIds}
          isAfterThirdEgg={isAfterThirdEgg}
        />
        {/* 左下のホームに戻るボタン */}
        <div className="flex justify-start mt-6">
          <Link href="/" className="bg-white text-indigo-700 px-6 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}