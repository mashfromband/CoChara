'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { EggType } from '@/types/character'
import Sparkle from '../ui/Sparkle'

interface EggImageProps {
  eggType: EggType
  isSelected?: boolean
  onClick?: () => void
  className?: string
  size?: number
  animated?: boolean
  // 追加: 画像ソースの上書き（data URL や任意のURLを指定可能）
  src?: string
}

/**
 * 卵の画像を表示するコンポーネント
 * 画像ファイル（PNG優先、失敗時にSVGフォールバック）を使用
 *
 * サイズ仕様:
 * - size は『幅(px)』として扱います。高さはアスペクト比(約1:1.5)を維持して自動計算されます。
 * - 親から className で w-full/h-full が渡っても、inline style で上書きされるため size が優先されます。
 *
 * 拡張点:
 * - src プロパティを指定すると、その画像ソースを優先的に使用します（例: data:image/svg+xml）。
 */
const EggImage: React.FC<EggImageProps> = ({ 
  eggType, 
  isSelected = false, 
  onClick,
  className = '',
  size = 120,
  animated = false,
  src
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  /**
   * 画像パス生成ルール:
   * - PNG を最優先: /images/eggs/{id}.png
   * - ロード失敗時は SVG (/images/eggs/{id}_egg.svg) にフォールバック
   * - それでも失敗した場合はグラデーションのプレースホルダー表示
   */
  const getEggImagePath = (eggId: string) => {
    return `/images/eggs/${eggId}.png`
  }

  return (
    <motion.div
      className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      animate={animated ? { y: [0, -10, 0] } : {}}
      transition={animated ? { repeat: Infinity, duration: 3 } : {}}
      // size は幅(px)として適用。height は img の比率に任せるが、
      // フォールバック時に高さが潰れないよう minHeight も設定。
      style={{ width: size, height: size }}
    >
      {/* 卵の周りのスパークルエフェクト */}
      {(isSelected || animated) && (
        <>
          <Sparkle delay={0} />
          <Sparkle delay={0.5} />
          <Sparkle delay={1} />
          <Sparkle delay={1.5} />
        </>
      )}
      
      {/* 卵の画像 */}
      <motion.div
        className={`${isSelected ? 'drop-shadow-2xl' : 'drop-shadow-lg'} transition-all duration-300 inline-block`}
        style={{}}
        animate={{
          filter: isHovered || isSelected || isSelected || animated
            ? 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' 
            : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
        }}
      >
        {/* 注意: 画像は /public/images/eggs/ に {id}.png 形式で配置。存在しない場合は {id}_egg.svg を使用
            ただし src が指定されている場合はそちらを優先する */}
        <div 
          className={`inline-flex items-center justify-center rounded-xl overflow-visible`}
        >
          <img 
            src={src ?? getEggImagePath(eggType.id)} 
            alt={`${eggType.name}の卵`}
            className={`w-auto h-${size}px`}
            loading="lazy"
            onError={(e) => {
              // src が明示的に与えられている場合はフォールバックせずプレースホルダーへ
              if (src) {
                const imgElement = e.currentTarget
                imgElement.style.display = 'none'
                const parent = imgElement.parentElement as HTMLElement
                if (parent) {
                  parent.style.width = `${size}px`
                  parent.style.height = `${size}px`
                  parent.className += ` bg-gradient-to-b ${getGradientClasses(eggType.gradient)}`
                }
                return
              }

              const imgElement = e.currentTarget
              const currentSrc = imgElement.src

              // PNGが見つからない場合はSVGにフォールバック
              if (currentSrc.endsWith('.png')) {
                imgElement.src = `/images/eggs/${eggType.id}_egg.svg`
                return
              }

              // SVGも見つからない場合はプレースホルダーを表示
              imgElement.style.display = 'none'
              // ラッパーが潰れないようサイズを保持
              const parent = imgElement.parentElement as HTMLElement
              if (parent) {
                parent.style.width = `${size}px`
                parent.style.height = `${size}px`
                parent.className += ` bg-gradient-to-b ${getGradientClasses(eggType.gradient)}`
              }
            }}
          />
        </div>
      </motion.div>
      
      {/* 選択インジケーター - 枠なしバージョン */}
      {isSelected && (
        <motion.div
          className="absolute -inset-2 rounded-full bg-yellow-400/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}

/**
 * Tailwind CSSのグラデーションクラス名から実際のクラス名を生成
 */
const getGradientClasses = (gradient: string): string => {
  // 例: from-white via-blue-50 to-blue-100 → bg-white via-blue-50 to-blue-100
  return gradient.replace('from-', 'bg-')
}

/**
 * Tailwind CSSのグラデーションクラス名からグラデーションの背景色を取得
 */
const getTailwindGradientValue = (gradientClass: string): string => {
  // 簡易的な実装 - 実際のプロジェクトでは適切なグラデーションマッピングを使用
  const gradientMap: Record<string, string> = {
    'from-white via-blue-50 to-blue-100': 'linear-gradient(135deg, #ffffff, #eff6ff, #dbeafe)',
    'from-white via-green-50 to-green-100': 'linear-gradient(135deg, #ffffff, #f0fdf4, #dcfce7)',
    'from-white via-yellow-50 to-yellow-100': 'linear-gradient(135deg, #ffffff, #fefce8, #fef9c3)',
    'from-white via-red-50 to-red-100': 'linear-gradient(135deg, #ffffff, #fef2f2, #fee2e2)',
    'from-white via-purple-50 to-purple-100': 'linear-gradient(135deg, #ffffff, #faf5ff, #f3e8ff)',
    'from-white via-pink-50 to-pink-100': 'linear-gradient(135deg, #ffffff, #fdf2f8, #fce7f3)',
    'from-white via-gray-50 to-gray-100': 'linear-gradient(135deg, #ffffff, #f9fafb, #f3f4f6)'
  }
  
  return gradientMap[gradientClass] || 'linear-gradient(135deg, #ffffff, #f9fafb, #f3f4f6)' // デフォルトはグレー系
}

/**
 * Tailwind CSSのカラークラス名からカラーコードを取得
 */
const getTailwindColorValue = (tailwindClass: string): string => {
  // 簡易的な実装 - 実際のプロジェクトでは適切なカラーマッピングを使用
  const colorMap: Record<string, string> = {
    'stroke-gray-300': '#d1d5db',
    'stroke-gray-400': '#9ca3af',
    'stroke-pink-400': '#f472b6',
    'stroke-yellow-400': '#facc15',
    'stroke-green-500': '#22c55e',
    'stroke-red-600': '#dc2626',
    'stroke-white': '#ffffff'
  }
  
  return colorMap[tailwindClass] || '#d1d5db' // デフォルトはグレー
}

export default EggImage