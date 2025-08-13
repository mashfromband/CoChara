'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { EggType } from '@/types/character'
import Sparkle from '../ui/Sparkle'

interface EggSVGProps {
  eggType: EggType
  isSelected?: boolean
  onClick?: () => void
  className?: string
  size?: number
  animated?: boolean
}

// Tailwind CSSのクラス名からカラーコードに変換する関数
const getTailwindColor = (tailwindClass: string): string => {
  // stroke-{color}-{shade} 形式のクラス名からカラーコードに変換
  const colorMap: Record<string, Record<string, string>> = {
    gray: {
      '50': '#f9fafb',
      '100': '#f3f4f6',
      '200': '#e5e7eb',
      '300': '#d1d5db',
      '400': '#9ca3af',
      '500': '#6b7280',
      '600': '#4b5563',
      '700': '#374151',
      '800': '#1f2937',
      '900': '#111827'
    },
    pink: {
      '50': '#fdf2f8',
      '100': '#fce7f3',
      '200': '#fbcfe8',
      '300': '#f9a8d4',
      '400': '#f472b6',
      '500': '#ec4899',
      '600': '#db2777',
      '700': '#be185d',
      '800': '#9d174d',
      '900': '#831843'
    },
    purple: {
      '50': '#faf5ff',
      '100': '#f3e8ff',
      '200': '#e9d5ff',
      '300': '#d8b4fe',
      '400': '#c084fc',
      '500': '#a855f7',
      '600': '#9333ea',
      '700': '#7e22ce',
      '800': '#6b21a8',
      '900': '#581c87'
    },
    indigo: {
      '50': '#eef2ff',
      '100': '#e0e7ff',
      '200': '#c7d2fe',
      '300': '#a5b4fc',
      '400': '#818cf8',
      '500': '#6366f1',
      '600': '#4f46e5',
      '700': '#4338ca',
      '800': '#3730a3',
      '900': '#312e81'
    },
    blue: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a'
    },
    green: {
      '50': '#f0fdf4',
      '100': '#dcfce7',
      '200': '#bbf7d0',
      '300': '#86efac',
      '400': '#4ade80',
      '500': '#22c55e',
      '600': '#16a34a',
      '700': '#15803d',
      '800': '#166534',
      '900': '#14532d'
    },
    yellow: {
      '50': '#fefce8',
      '100': '#fef9c3',
      '200': '#fef08a',
      '300': '#fde047',
      '400': '#facc15',
      '500': '#eab308',
      '600': '#ca8a04',
      '700': '#a16207',
      '800': '#854d0e',
      '900': '#713f12'
    },
    orange: {
      '50': '#fff7ed',
      '100': '#ffedd5',
      '200': '#fed7aa',
      '300': '#fdba74',
      '400': '#fb923c',
      '500': '#f97316',
      '600': '#ea580c',
      '700': '#c2410c',
      '800': '#9a3412',
      '900': '#7c2d12'
    },
    red: {
      '50': '#fef2f2',
      '100': '#fee2e2',
      '200': '#fecaca',
      '300': '#fca5a5',
      '400': '#f87171',
      '500': '#ef4444',
      '600': '#dc2626',
      '700': '#b91c1c',
      '800': '#991b1b',
      '900': '#7f1d1d'
    },
    white: {
      '': '#ffffff'
    }
  }

  // 入力クラス名からプレフィックスを削除（stroke-, from-, via-, to-など）
  let cleanClass = tailwindClass
  const prefixes = ['stroke-', 'from-', 'via-', 'to-']
  for (const prefix of prefixes) {
    if (cleanClass.startsWith(prefix)) {
      cleanClass = cleanClass.replace(prefix, '')
      break
    }
  }

  // {color}-{shade} 形式のクラス名を解析
  const parts = cleanClass.split('-')
  const color = parts[0]
  const shade = parts[1] || ''

  // カラーマップから対応するカラーコードを取得
  if (colorMap[color] && colorMap[color][shade]) {
    return colorMap[color][shade]
  }

  // デフォルトのカラーコード
  return '#d1d5db' // gray-300 のカラーコード
}

const EggSVG: React.FC<EggSVGProps> = ({ 
  eggType, 
  isSelected = false, 
  onClick,
  className = '',
  size = 120,
  animated = false
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const renderPattern = () => {
    // 卵の中心座標（SVG座標系）
    const centerX = 60;
    const centerY = 70; // transformで20px下に移動しているため、90-20=70

    switch (eggType.pattern) {
      case 'heart':
        return (
          <path 
            d={`M${centerX-25} ${centerY-10} Q${centerX} ${centerY-15} ${centerX+25} ${centerY-10} Q${centerX+20} ${centerY} ${centerX} ${centerY+5} Q${centerX-20} ${centerY} ${centerX-25} ${centerY-10}`}
            fill="rgba(244,114,182,0.3)" 
          />
        )
      case 'stars':
        return (
          <g>
            <path d={`M${centerX-20} ${centerY-10} L${centerX-18} ${centerY-2} L${centerX-10} ${centerY} L${centerX-18} ${centerY+2} L${centerX-20} ${centerY+10} L${centerX-22} ${centerY+2} L${centerX-30} ${centerY} L${centerX-22} ${centerY-2} Z`} fill="rgba(255,215,0,0.3)" />
            <path d={`M${centerX+10} ${centerY+10} L${centerX+12} ${centerY+18} L${centerX+20} ${centerY+20} L${centerX+12} ${centerY+22} L${centerX+10} ${centerY+30} L${centerX+8} ${centerY+22} L${centerX} ${centerY+20} L${centerX+8} ${centerY+18} Z`} fill="rgba(255,215,0,0.25)" />
            <path d={`M${centerX+20} ${centerY-15} L${centerX+21} ${centerY-11} L${centerX+25} ${centerY-10} L${centerX+21} ${centerY-9} L${centerX+20} ${centerY-5} L${centerX+19} ${centerY-9} L${centerX+15} ${centerY-10} L${centerX+19} ${centerY-11} Z`} fill="rgba(255,215,0,0.2)" />
          </g>
        )
      case 'leaves':
        return (
          <g>
            <path d={`M${centerX-35} ${centerY-20} Q${centerX-20} ${centerY-25} ${centerX-5} ${centerY-20} Q${centerX-10} ${centerY-10} ${centerX-20} ${centerY-5} Q${centerX-30} ${centerY-10} ${centerX-35} ${centerY-20}`} fill="rgba(34,197,94,0.3)"/>
            <path d={`M${centerX+5} ${centerY-35} Q${centerX+20} ${centerY-40} ${centerX+35} ${centerY-35} Q${centerX+30} ${centerY-25} ${centerX+20} ${centerY-20} Q${centerX+10} ${centerY-25} ${centerX+5} ${centerY-35}`} fill="rgba(34,197,94,0.2)"/>
          </g>
        )
      case 'flames':
        return (
          <g>
            <path d={`M${centerX-30} ${centerY-5} Q${centerX-25} ${centerY-15} ${centerX-15} ${centerY-10} Q${centerX-5} ${centerY-15} ${centerX+5} ${centerY-5} Q${centerX} ${centerY+5} ${centerX-10} ${centerY+10} Q${centerX-20} ${centerY+5} ${centerX-30} ${centerY-5}`} fill="rgba(220,38,38,0.4)"/>
            <path d={`M${centerX+10} ${centerY-20} Q${centerX+15} ${centerY-30} ${centerX+25} ${centerY-25} Q${centerX+30} ${centerY-15} ${centerX+25} ${centerY-10} Q${centerX+15} ${centerY-15} ${centerX+10} ${centerY-20}`} fill="rgba(251,146,60,0.5)"/>
          </g>
        )
      case 'aurora':
        return (
          <g>
            <path d={`M${centerX-40} ${centerY-15} Q${centerX} ${centerY-25} ${centerX+40} ${centerY-15} Q${centerX+30} ${centerY-5} ${centerX} ${centerY+5} Q${centerX-30} ${centerY-5} ${centerX-40} ${centerY-15}`} fill="rgba(255,255,255,0.2)"/>
            <path d={`M${centerX-35} ${centerY+10} Q${centerX} ${centerY} ${centerX+35} ${centerY+10} Q${centerX+25} ${centerY+20} ${centerX} ${centerY+30} Q${centerX-25} ${centerY+20} ${centerX-35} ${centerY+10}`} fill="rgba(255,255,255,0.15)"/>
          </g>
        )
      case 'spots':
        return (
          <g>
            <ellipse cx={centerX-15} cy={centerY-15} rx="8" ry="5" fill="rgba(255,255,255,0.3)" />
            <ellipse cx={centerX+10} cy={centerY-5} rx="6" ry="4" fill="rgba(255,255,255,0.2)" />
            <ellipse cx={centerX-5} cy={centerY+10} rx="7" ry="5" fill="rgba(255,255,255,0.25)" />
          </g>
        )
      case 'stripes':
        return (
          <g>
            <path d={`M${centerX-30} ${centerY-20} Q${centerX} ${centerY-30} ${centerX+30} ${centerY-20}`} stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
            <path d={`M${centerX-30} ${centerY-5} Q${centerX} ${centerY-15} ${centerX+30} ${centerY-5}`} stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
            <path d={`M${centerX-30} ${centerY+10} Q${centerX} ${centerY} ${centerX+30} ${centerY+10}`} stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
          </g>
        )
      case 'dots':
        return (
          <g>
            <circle cx={centerX-20} cy={centerY-15} r="3" fill="rgba(255,255,255,0.3)" />
            <circle cx={centerX} cy={centerY-25} r="2" fill="rgba(255,255,255,0.25)" />
            <circle cx={centerX-10} cy={centerY} r="2.5" fill="rgba(255,255,255,0.3)" />
            <circle cx={centerX+15} cy={centerY-5} r="1.5" fill="rgba(255,255,255,0.2)" />
            <circle cx={centerX+5} cy={centerY+15} r="2" fill="rgba(255,255,255,0.25)" />
          </g>
        )
      case 'waves':
        return (
          <path
            d={`M${centerX-40} ${centerY} C${centerX-20} ${centerY-10} ${centerX} ${centerY+10} ${centerX+20} ${centerY} C${centerX+40} ${centerY-10} ${centerX+60} ${centerY+10} ${centerX+40} ${centerY}`}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="3"
          />
        )
      case 'scales':
        return (
          <g>
            <path d={`M${centerX-30} ${centerY-10} Q${centerX-20} ${centerY-20} ${centerX-10} ${centerY-10} Q${centerX-20} ${centerY} ${centerX-30} ${centerY-10}`} fill="rgba(255,255,255,0.2)" />
            <path d={`M${centerX-10} ${centerY-10} Q${centerX} ${centerY-20} ${centerX+10} ${centerY-10} Q${centerX} ${centerY} ${centerX-10} ${centerY-10}`} fill="rgba(255,255,255,0.2)" />
            <path d={`M${centerX-20} ${centerY+5} Q${centerX-10} ${centerY-5} ${centerX} ${centerY+5} Q${centerX-10} ${centerY+15} ${centerX-20} ${centerY+5}`} fill="rgba(255,255,255,0.2)" />
            <path d={`M${centerX-30} ${centerY+20} Q${centerX-20} ${centerY+10} ${centerX-10} ${centerY+20} Q${centerX-20} ${centerY+30} ${centerX-30} ${centerY+20}`} fill="rgba(255,255,255,0.2)" />
            <path d={`M${centerX-10} ${centerY+20} Q${centerX} ${centerY+10} ${centerX+10} ${centerY+20} Q${centerX} ${centerY+30} ${centerX-10} ${centerY+20}`} fill="rgba(255,255,255,0.2)" />
          </g>
        )
      case 'simple':
        return (
          <g>
            <ellipse cx={centerX} cy={centerY} rx="20" ry="15" fill="rgba(255,255,255,0.1)"/>
          </g>
        )
      default:
        // デフォルトでもシンプルなパターンを表示する
        return (
          <g>
            <ellipse cx={centerX} cy={centerY} rx="20" ry="15" fill="rgba(255,255,255,0.1)"/>
          </g>
        )
    }
  }

  const getGradientStops = () => {
    // デフォルトのグラデーション（eggType.idに基づく）
    switch (eggType.id) {
      case 'classic':
        return (
          <>
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#eff6ff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </>
        )
      case 'pastel':
        return (
          <>
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="50%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#f3e8ff" />
          </>
        )
      case 'cosmic':
        return (
          <>
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#3730a3" />
            <stop offset="100%" stopColor="#7c3aed" />
          </>
        )
      case 'natural':
        return (
          <>
            <stop offset="0%" stopColor="#f0fdf4" />
            <stop offset="50%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </>
        )
      case 'fire':
        return (
          <>
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#dc2626" />
          </>
        )
      case 'aurora':
        return (
          <>
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="25%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </>
        )
      default:
        return (
          <>
            <stop offset="0%" stopColor="#f9fafb" />
            <stop offset="50%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#d1d5db" />
          </>
        )
    }
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
      <motion.svg
        width={size}
        height={size * 1.5}
        viewBox="0 0 120 180"
        className={`${isSelected ? 'drop-shadow-2xl' : 'drop-shadow-lg'} transition-all duration-300`}
        animate={{
          filter: isHovered || isSelected || animated
            ? 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' 
            : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`grad-${eggType.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {/* eggType.gradientから適切なグラデーションを生成 */}
            {eggType.gradient ? (
              // Tailwind CSSのグラデーションクラスからSVGグラデーションに変換
              (() => {
                // 例: from-pink-400 to-purple-600 のようなクラスを解析
                const gradientClasses = eggType.gradient.split(' ');
                const fromClass = gradientClasses.find(c => c.startsWith('from-'));
                const viaClass = gradientClasses.find(c => c.startsWith('via-'));
                const toClass = gradientClasses.find(c => c.startsWith('to-'));
                
                return (
                  <>
                    {fromClass && <stop offset="0%" stopColor={getTailwindColor(fromClass)} />}
                    {viaClass && <stop offset="50%" stopColor={getTailwindColor(viaClass)} />}
                    {toClass && <stop offset="100%" stopColor={getTailwindColor(toClass)} />}
                    {!fromClass && !viaClass && !toClass && getGradientStops()}
                  </>
                );
              })()
            ) : (
              getGradientStops()
            )}
          </linearGradient>
        </defs>
        
        {/* メインの卵の形 */}
        <ellipse
          cx="60"
          cy="90"
          rx="45"
          ry="60"
          fill={`url(#grad-${eggType.id})`}
          stroke={getTailwindColor(eggType.strokeColor)}
          strokeWidth="2"
        />
        
        {/* デバッグ用 - 単色の卵を表示 */}
        {/* <ellipse
          cx="60"
          cy="90"
          rx="45"
          ry="60"
          fill="#f472b6"
          stroke={getTailwindColor(eggType.strokeColor)}
          strokeWidth="2"
        /> */}
        
        {/* パターン - 卵の中心に合わせて配置 */}
        <g transform="translate(0, 20)">
          {renderPattern()}
        </g>
        
        {/* ハイライト */}
        <ellipse
          cx="45"
          cy="65"
          rx="6"
          ry="10"
          fill="rgba(255,255,255,0.8)"
        />
        <circle
          cx="48"
          cy="68"
          r="2"
          fill="rgba(255,255,255,1)"
        />
      </motion.svg>
      
      {/* 選択インジケーター */}
      {isSelected && (
        <motion.div
          className="absolute -inset-2 border-4 border-yellow-400 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}

export default EggSVG