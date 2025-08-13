'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getEggTypeById } from '@/data/eggTypes'
import EggSVG from '@/app/components/character/EggSVG'

// キャラクター詳細ページ
export default function CharacterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [character, setCharacter] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // キャラクターIDを取得
  const characterId = params.id as string
  
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
        const dummyCharacter = {
          id: characterId,
          name: 'ミステリーエッグ',
          eggTypeId: 'cosmic', // デフォルトの卵タイプ
          stats: {
            level: 1,
            experience: 0,
            contentCount: 0,
            evolutionStage: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
    
    if (characterId) {
      fetchCharacter()
    }
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
          <Link href="/" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors inline-block">
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }
  
  // 卵タイプ情報を取得
  const eggType = getEggTypeById(character.eggTypeId) || {
    id: 'default',
    name: '不明な卵',
    description: '謎に包まれた卵',
    rarity: 'common' as const,
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    strokeColor: 'stroke-gray-400',
    pattern: 'stars',
    characteristics: ['謎', '未知', '可能性'],
    color: '#888888' // 互換性のために残す
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
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* 卵の表示 */}
            <div className="w-48 h-48 relative flex-shrink-0">
              <EggSVG eggType={eggType} size={192} animated={true} />
            </div>
            
            {/* キャラクター情報 */}
            <div className="flex-grow text-white">
              <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
              <p className="text-white/80 mb-4">{eggType.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-white/60 mb-1">レベル</h3>
                  <p className="text-2xl font-bold">{character.stats.level}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-white/60 mb-1">経験値</h3>
                  <p className="text-2xl font-bold">{character.stats.experience}</p>
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
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
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
          </div>
          
          {/* コンテンツ履歴（開発中は空の状態） */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">コンテンツ履歴</h2>
            <div className="bg-white/5 rounded-lg p-6 text-center text-white/60">
              <p>まだコンテンツがありません。「コンテンツを追加」ボタンからキャラクターにコンテンツを追加しましょう。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}