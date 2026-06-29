'use client'

import { useRef, useState, useCallback, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react'
import styles from './OtpInput.module.css'

interface Props {
  length?: number
  onComplete: (otp: string) => void
  disabled?: boolean
}

export function OtpInput({ length = 6, onComplete, disabled = false }: Props) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus()
    }
  }, [length])

  const handleChange = useCallback((index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return

    const newValues = [...values]
    newValues[index] = digit
    setValues(newValues)

    if (digit && index < length - 1) {
      focusInput(index + 1)
    }

    // Check if complete
    const otp = newValues.join('')
    if (otp.length === length && newValues.every(v => v !== '')) {
      onComplete(otp)
    }
  }, [values, length, focusInput, onComplete])

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (values[index] === '' && index > 0) {
        focusInput(index - 1)
        const newValues = [...values]
        newValues[index - 1] = ''
        setValues(newValues)
      } else {
        const newValues = [...values]
        newValues[index] = ''
        setValues(newValues)
      }
    } else if (e.key === 'ArrowLeft') {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight') {
      focusInput(index + 1)
    }
  }, [values, focusInput])

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pastedData.length === 0) return

    const newValues = Array(length).fill('')
    pastedData.split('').forEach((digit, i) => {
      newValues[i] = digit
    })
    setValues(newValues)

    if (pastedData.length === length) {
      onComplete(pastedData)
    } else {
      focusInput(pastedData.length)
    }
  }, [length, focusInput, onComplete])

  return (
    <div className={styles.container} role="group" aria-label="One-time password">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={1}
          value={value}
          disabled={disabled}
          className={`${styles.input} ${value ? styles.inputFilled : ''}`}
          onChange={(e) => handleChange(index, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
