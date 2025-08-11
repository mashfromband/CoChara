'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { EggType } from '@/types/character'
import Sparkle from '../ui/Sparkle'

interface EggSVGProps {
  eggType: EggType
  isSelected: boolean
  onClick: () => void
  className?: string
}

const EggSVG: React.FC<EggSVGProps> = ({ 
  eggType, 
  isSelected, 
  onClick,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const renderPattern = () => {
    switch (eggType.pattern) {
      case 'heart':
        return (
          <path 
            d="M35 90 Q60 85 85 90 Q80 100 60 105 Q40 100 35 90" 
            fill="rgba(244,114,182,0.3)" 
          />
        )
      case 'stars':
        return (
          <g>
            <circle cx="40" cy="90" r="2" fill="#fbbf24" opacity="0.8"/>
            <circle cx="70" cy="100" r="1.5" fill="#fbbf24" opacity="0.6"/>
            <circle cx="50" cy="110" r="1" fill="#fbbf24" opacity="0.7"/>
            <circle cx="75" cy="85" r="1" fill="#fbbf24" opacity="0.9"/>
          </g>
        )
      case 'leaves':
        return (
          <g>
            <path d="M25 100 Q40 95 55 100 Q50 110 40 115 Q30 110 25 100" fill="rgba(34,197,94,0.3)"/>
            <path d="M65 85 Q80 80 95 85 Q90 95 80 100 Q70 95 65 85" fill="rgba(34,197,94,0.2)"/>
          </g>
        )
      case 'flames':
        return (
          <g>
            <path d="M30 95 Q35 85 45 90 Q55 85 65 95 Q60 105 50 110 Q40 105 30 95" fill="rgba(220,38,38,0.4)"/>
            <path d="M70 80 Q75 70 85 75 Q90 85 85 90 Q75 85 70 80" fill="rgba(251,146,60,0.5)"/>
          </g>
        )
      case 'aurora':
        return (
          <g>
            <path d="M20 85 Q60 75 100 85 Q90 95 60 105 Q30 95 20 85" fill="rgba(255,255,255,0.2)"/>
            <path d="M25 110 Q60 100 95 110 Q85 120 60 130 Q35 120 25 110" fill="rgba(255,255,255,0.15)"/>
          </g>
        )
      default:
        return null
    }
  }

  const getGradientStops = () => {
    switch (eggType.id) {
      case 'classic':
        return (
          <>
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="70%" stopColor="rgba(240,248,255,0.6)" />
            <stop offset="100%" stopColor="rgba(224,231,255,1)" />
          </>
        )
      case 'pastel':
        return (
          <>
            <stop offset="0%" stopColor="rgba(253,242,248,1)" />
            <stop offset="50%" stopColor="rgba(252,231,243,1)" />
            <stop offset="100%" stopColor="rgba(243,232,255,1)" />
          </>
        )
      case 'cosmic':
        return (
          <>
            <stop offset="0%" stopColor="rgba(30,27,75,1)" />
            <stop offset="30%" stopColor="rgba(55,48,163,1)" />
            <stop offset="70%" stopColor="rgba(124,58,237,1)" />
            <stop offset="100%" stopColor="rgba(30,27,75,1)" />
          </>
        )
      case 'natural':
        return (
          <>
            <stop offset="0%" stopColor="rgba(240,253,244,1)" />
            <stop offset="40%" stopColor="rgba(220,252,231,1)" />
            <stop offset="100%" stopColor="rgba(187,247,208,1)" />
          </>
        )
      case 'fire':
        return (
          <>
            <stop offset="0%" stopColor="rgba(254,243,199,1)" />
            <stop offset="30%" stopColor="rgba(254,215,170,1)" />
            <stop offset="70%" stopColor="rgba(251,146,60,1)" />
            <stop offset="100%" stopColor="rgba(220,38,38,1)" />
          </>
        )
      case 'aurora':
        return (
          <>
            <stop offset="0%" stopColor="rgba(168,85,247,1)" />
            <stop offset="25%" stopColor="rgba(59,130,246,1)" />
            <stop offset="50%" stopColor="rgba(16,185,129,1)" />
            <stop offset="75%" stopColor="rgba(245,158,11,1)" />
            <stop offset="100%" stopColor="rgba(239,68,68,1)" />
          </>
        )
      default:
        return (
          <>
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </>
        )
    }
  }

  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 卵の周りのスパークルエフェクト */}
      <Sparkle delay={0} />
      <Sparkle delay={0.5} />
      <Sparkle delay={1} />
      <Sparkle delay={1.5} />
      <motion.svg
        width="120"
        height="150"
        viewBox="0 0 120 150"
        className={`${isSelected ? 'drop-shadow-2xl' : 'drop-shadow-lg'} transition-all duration-300`}
        animate={{
          filter: isHovered || isSelected 
            ? 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' 
            : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <radialGradient id={`grad-${eggType.id}`} cx="30%" cy="30%">
            {getGradientStops()}
          </radialGradient>
        </defs>
        
        {/* メインの卵の形 */}
        <ellipse
          cx="60"
          cy="120"
          rx="45"
          ry="60"
          fill={`url(#grad-${eggType.id})`}
          className={eggType.strokeColor}
          strokeWidth="2"
        />
        
        {/* パターン */}
        {renderPattern()}
        
        {/* ハイライト */}
        <ellipse
          cx="45"
          cy="95"
          rx="6"
          ry="10"
          fill="rgba(255,255,255,0.8)"
        />
        <circle
          cx="48"
          cy="98"
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