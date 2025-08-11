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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSparkle(sparkles[Math.floor(Math.random() * sparkles.length)])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className={`absolute text-lg pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
      style={{
        top: `${Math.random() * 60 + 10}%`,
        left: `${Math.random() * 60 + 10}%`,
      }}
    >
      {currentSparkle}
    </motion.div>
  )
}

export default Sparkle