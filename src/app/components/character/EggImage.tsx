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
}

/**
 * 卵の画像を表示するコンポーネント
 * SVGの代わりに画像ファイルを使用
 */
const EggImage: React.FC<EggImageProps> = ({ 
  eggType, 
  isSelected = false, 
  onClick,
  className = '',
  size = 120,
  animated = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // 卵タイプに基づいて画像パスを生成
  const getEggImagePath = (eggId: string) => {
    // SVGを優先的に使用（高品質表示が必要な場合）
    if (size >= 300) {
      return `/images/eggs/${eggId}_egg.svg`;
    }
    
    // サイズに応じて適切な画質の画像を選択
    let quality = 'medium';
    if (size <= 80) {
      quality = 'low';
    } else if (size >= 200) {
      quality = 'high';
    }
    
    return `/images/eggs/${eggId}_egg_${quality}.png`;
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
        className={`${isSelected ? 'drop-shadow-2xl' : 'drop-shadow-lg'} transition-all duration-300`}
        style={{ width: size, height: size * 1.5 }}
        animate={{
          filter: isHovered || isSelected || animated
            ? 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' 
            : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
        }}
      >
        {/* 注意: 実際の画像ファイルはプロジェクトに含まれていないため、
            画像が用意されるまではプレースホルダーとして表示します */}
        <div 
          className={`w-full h-full flex items-center justify-center rounded-full overflow-hidden`}
        >
          <img 
            src={getEggImagePath(eggType.id)} 
            alt={`${eggType.name}の卵`}
            className="w-full h-full object-contain"
            onError={(e) => {
              const imgElement = e.currentTarget;
              const currentSrc = imgElement.src;
              
              // SVGファイルが見つからない場合はPNG画像を試す
              if (currentSrc.endsWith('.svg')) {
                // SVGからPNGに切り替え
                const pngSrc = currentSrc.replace('.svg', '_high.png');
                imgElement.src = pngSrc;
                return;
              }
              
              // 画像が見つからない場合はプレースホルダーとして表示
              imgElement.style.display = 'none';
              // 親要素にグラデーション背景を適用
              imgElement.parentElement!.className += ` bg-gradient-to-b ${getGradientClasses(eggType.gradient)}`;
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