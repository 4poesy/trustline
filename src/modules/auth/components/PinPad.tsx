'use client'

import React from 'react'
import { Delete } from 'lucide-react'
import styles from './PinPad.module.css'

interface PinPadProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export function PinPad({ value, onChange, maxLength = 4 }: PinPadProps) {
  const handleNumberClick = (num: number) => {
    if (value.length < maxLength) {
      onChange(value + num.toString())
    }
  }

  const handleDeleteClick = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handleClearClick = () => {
    onChange('')
  }

  return (
    <div className={styles.pinPadContainer}>
      {/* Visual Indicator of entered digits */}
      <div className={styles.indicatorRow}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i < value.length ? styles.dotActive : ''}`}
          />
        ))}
      </div>

      {/* Grid of keys */}
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            className={styles.key}
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </button>
        ))}
        
        <button
          type="button"
          className={`${styles.key} ${styles.utilityKey}`}
          onClick={handleClearClick}
        >
          Clear
        </button>

        <button
          type="button"
          className={styles.key}
          onClick={() => handleNumberClick(0)}
        >
          0
        </button>

        <button
          type="button"
          className={`${styles.key} ${styles.utilityKey}`}
          onClick={handleDeleteClick}
          aria-label="Delete last digit"
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  )
}
