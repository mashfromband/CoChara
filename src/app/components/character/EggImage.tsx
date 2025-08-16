'use client'

import React, { useState, useEffect } from 'react'
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
  const [imageKey, setImageKey] = useState(0) // 画像の強制再レンダリング用
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  // 追加: キャッシュバスターと再試行回数
  const [cacheBuster, setCacheBuster] = useState<number | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  // 追加: 画像のアスペクト比 (height / width)。基準画像に合わせデフォルトは1:1
  const [aspectRatio, setAspectRatio] = useState(1)
  
  /**
   * 画像パス生成ルール:
   * - PNG を最優先: /images/eggs/default/{id}.png
   * - ロード失敗時は SVG へは切り替えず、グラデーションのプレースホルダー表示に移行
   */
  const getEggImagePath = (eggId: string) => {
    return `/images/eggs/default/${eggId}.png`
  }

  // src や eggType.id が変更された場合に画像を強制リロード
  useEffect(() => {
    setImageKey(prev => prev + 1)
    setIsLoading(true)
    setHasError(false)
    setCacheBuster(null)
    setRetryCount(0)
    // 基準画像サイズ(正方形)に合わせて一旦 1:1 に戻す
    setAspectRatio(1)
  }, [src, eggType.id])

  const actualSrc = src ?? getEggImagePath(eggType.id)
  const computedSrc = cacheBuster ? `${actualSrc}${actualSrc.includes('?') ? '&' : '?'}v=${cacheBuster}` : actualSrc

  return (
    <motion.div
      className={`relative flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      animate={animated ? { y: [0, -10, 0] } : {}}
      transition={animated ? { repeat: Infinity, duration: 3 } : {}}
      // size は基準画像(正方形)の『幅(px)』。高さは読み込んだ画像のアスペクト比で自動計算
      style={{ width: size, height: size * aspectRatio }}
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
          className={`mx-auto inline-flex items-center justify-center rounded-xl overflow-visible`}
          style={hasError ? {
            width: `${size}px`,
            height: `${size * aspectRatio}px`,
            background: getTailwindGradientValue(eggType.gradient)
          } : {}}
        >
          <img 
            key={imageKey} // 強制再レンダリング用のキー
            src={computedSrc} 
            alt={eggType.name}
            className={`block w-auto`}
            style={{ 
              width: `${size}px`,
              height: `${size * aspectRatio}px`,
              objectFit: 'contain',
              display: hasError ? 'none' : 'block',
              visibility: 'visible'
            }}
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onLoad={(e) => {
              console.log(`✅ 画像ロード成功: ${computedSrc}`)
              // 画像ロード成功時：状態をリセットし確実に表示
              setIsLoading(false)
              setHasError(false)
              setRetryCount(0)
              setCacheBuster(null)
              // naturalサイズからアスペクト比を計算
              const imgElement = e.currentTarget
              const naturalW = imgElement.naturalWidth || size
              const naturalH = imgElement.naturalHeight || size
              const ratio = naturalW > 0 ? naturalH / naturalW : 1
              setAspectRatio(ratio || 1)
              imgElement.style.display = 'block'
              imgElement.style.visibility = 'visible'
              const parent = imgElement.parentElement as HTMLElement
              if (parent) {
                clearPlaceholderStyles(parent)
              }
            }}
            onError={(e) => {
              console.error(`❌ 画像ロードエラー: ${computedSrc}`)
              // ロードエラー時の処理
              setIsLoading(false)
              
              // 一度だけキャッシュバスターで即時再試行（ブラウザキャッシュや部分コンテンツの影響を避ける）
              if (retryCount < 1) {
                const b = Date.now()
                console.warn(`↻ リトライ実行: ${actualSrc} ?v=${b}`)
                setRetryCount(retryCount + 1)
                setHasError(false)
                setCacheBuster(b)
                return
              }

              // src が明示的に与えられている場合はフォールバックせずプレースホルダーへ
              if (src) {
                setHasError(true)
                const imgElement = e.currentTarget
                imgElement.style.display = 'none'
                return
              }

              // PNGが見つからない/ロード失敗時はプレースホルダーを表示（SVGへの切替は行わない）
              setHasError(true)
              const imgElement = e.currentTarget
              imgElement.style.display = 'none'
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
 * Tailwind CSSのグラデーション用プレースホルダーを除去
 * - 画像が後から成功ロードされた場合に背景を元に戻すために使用
 */
function clearPlaceholderStyles(parent: HTMLElement) {
  // サイズ指定を除去（本来はコンテンツサイズにフィット）
  parent.style.width = ''
  parent.style.height = ''
  parent.style.background = ''

  // 追加されている可能性のある背景系クラスや非表示系ユーティリティを除去
  const tokens = parent.className.split(' ').filter(Boolean)
  const filtered = tokens.filter(
    (t) =>
      t !== 'bg-gradient-to-b' &&
      !t.startsWith('bg-') &&
      !t.startsWith('via-') &&
      !t.startsWith('to-') &&
      t !== 'hidden' &&
      t !== 'invisible'
  )
  parent.className = filtered.join(' ')
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