'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SparkleProps {
  delay?: number
  className?: string
}

const Sparkle: React.FC<SparkleProps> = ({ delay = 0, className = '' }) => {
  const sparkles = ['✨', '⭐', '💫', '🌟']
  const [currentSparkle, setCurrentSparkle] = useState(sparkles[0])
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // クライアントサイドでのみ実行される初期化
  useEffect(() => {
    // 卵の周りに表示されるように位置を調整
    // 卵の形状に合わせて楕円形に分布するように調整
    const angle = Math.random() * Math.PI * 2; // 0〜2πのランダムな角度
    const radiusX = 30 + Math.random() * 20; // X方向の半径（30〜50%）
    const radiusY = 40 + Math.random() * 20; // Y方向の半径（40〜60%）
    
    setPosition({
      // 中心(50,50)を基準に楕円形に配置
      left: 50 + Math.cos(angle) * radiusX,
      top: 50 + Math.sin(angle) * radiusY
    })
    
    // スパークルのアニメーション
    const interval = setInterval(() => {
      setCurrentSparkle(sparkles[Math.floor(Math.random() * sparkles.length)])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className={`text-lg pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
      style={{
        position: 'absolute',
        top: `${position.top}%`,
        left: `${position.left}%`,
        zIndex: 10, // 卵よりも10高いz-index
      }}
    >
      {currentSparkle}
    </motion.div>
  )
}

export default Sparkle