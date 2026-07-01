'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './TrustlineCodeInput.module.css'

interface TrustlineCodeInputProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
}

export function TrustlineCodeInput({ value, onChange, error }: TrustlineCodeInputProps) {
  const [seg1, setSeg1] = useState('')
  const [seg2, setSeg2] = useState('')
  const [seg3, setSeg3] = useState('')

  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const ref3 = useRef<HTMLInputElement>(null)

  // Parse initial value if provided as a whole code (e.g. on paste or auto-fill)
  useEffect(() => {
    if (value) {
      const parts = value.split('-')
      if (parts.length === 4 && parts[0] === 'TL') {
        setSeg1(parts[1].toUpperCase())
        setSeg2(parts[2].toUpperCase())
        setSeg3(parts[3].toUpperCase())
      }
    } else {
      setSeg1('')
      setSeg2('')
      setSeg3('')
    }
  }, [value])

  // Trigger onChange when segments change
  const updateFullCode = (s1: string, s2: string, s3: string) => {
    if (s1 || s2 || s3) {
      onChange(`TL-${s1.padEnd(3, '_')}-${s2.padEnd(4, '_')}-${s3.padEnd(4, '_')}`)
    } else {
      onChange('')
    }
  }

  const handleSeg1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    setSeg1(val)
    updateFullCode(val, seg2, seg3)
    if (val.length === 3) {
      ref2.current?.focus()
    }
  }

  const handleSeg2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    setSeg2(val)
    updateFullCode(seg1, val, seg3)
    if (val.length === 4) {
      ref3.current?.focus()
    }
  }

  const handleSeg3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    setSeg3(val)
    updateFullCode(seg1, seg2, val)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentSeg: string,
    prevRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    if (e.key === 'Backspace' && currentSeg === '' && prevRef) {
      prevRef.current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim().toUpperCase()
    
    // Check if it matches TL-XXX-XXXX-XXXX or XXX-XXXX-XXXX
    const parts = pastedData.startsWith('TL-') 
      ? pastedData.split('-') 
      : ['TL', ...pastedData.split('-')]

    if (parts.length === 4) {
      const s1 = parts[1].replace(/[^A-Z]/g, '').slice(0, 3)
      const s2 = parts[2].replace(/[^A-Z0-9]/g, '').slice(0, 4)
      const s3 = parts[3].replace(/[^A-Z0-9]/g, '').slice(0, 4)
      
      setSeg1(s1)
      setSeg2(s2)
      setSeg3(s3)
      
      onChange(`TL-${s1}-${s2}-${s3}`)
      ref3.current?.focus()
    }
  }

  return (
    <div className={`${styles.codeContainer} ${error ? styles.containerError : ''}`}>
      <span className={styles.prefix}>TL</span>
      <span className={styles.dash}>-</span>
      
      <input
        ref={ref1}
        type="text"
        placeholder="ABC"
        value={seg1}
        onChange={handleSeg1Change}
        onPaste={handlePaste}
        className={styles.segmentInput}
        style={{ width: '48px' }}
      />
      
      <span className={styles.dash}>-</span>
      
      <input
        ref={ref2}
        type="text"
        placeholder="1234"
        value={seg2}
        onChange={handleSeg2Change}
        onKeyDown={(e) => handleKeyDown(e, seg2, ref1)}
        onPaste={handlePaste}
        className={styles.segmentInput}
        style={{ width: '60px' }}
      />
      
      <span className={styles.dash}>-</span>
      
      <input
        ref={ref3}
        type="text"
        placeholder="K9XM"
        value={seg3}
        onChange={handleSeg3Change}
        onKeyDown={(e) => handleKeyDown(e, seg3, ref2)}
        onPaste={handlePaste}
        className={styles.segmentInput}
        style={{ width: '60px' }}
      />
    </div>
  )
}
