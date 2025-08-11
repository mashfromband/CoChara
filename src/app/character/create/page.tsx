'use client'

import React, { useState } from 'react'
import { redirect } from 'next/navigation'
import EggSelection from '@/app/components/character/EggSelection'
import { getEggTypeById } from '@/data/eggTypes'

export default function CreateCharacterPage() {
  const [isCreating, setIsCreating] = useState(false)

  const handleEggSelected = async (eggId: string) => {
    setIsCreating(true)
    
    try {
      const selectedEgg = getEggTypeById(eggId)
      
      if (!selectedEgg) {
        throw new Error('選択された卵が見つかりません')
      }

      // キャラクター作成のAPIコール（実装時に追加）
      // const response = await fetch('/api/characters', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     eggTypeId: eggId,
      //     name: `${selectedEgg.name}の卵`,
      //   }),
      // })

      // if (!response.ok) {
      //   throw new Error('キャラクター作成に失敗しました')
      // }

      // const character = await response.json()

      // 成功時の処理（仮実装）
      console.log('キャラクター作成開始:', selectedEgg)
      
      // 少し待機してからキャラクター画面へ遷移
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // redirect(`/character/${character.id}`)
      window.location.href = '/character/dashboard' // 仮の遷移先
      
    } catch (error) {
      console.error('キャラクター作成エラー:', error)
      alert('キャラクター作成に失敗しました。もう一度お試しください。')
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

  return (
    <EggSelection 
      onEggSelected={handleEggSelected}
    />
  )
}