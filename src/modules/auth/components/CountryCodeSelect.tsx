'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './CountryCodeSelect.module.css'

interface CountryCode {
  code: string
  country: string
  flag: string
}

const countryCodes: CountryCode[] = [
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
]

interface Props {
  value: string
  onChange: (code: string) => void
}

export function CountryCodeSelect({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = countryCodes.find(c => c.code === value) || countryCodes[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="country-code-select"
      >
        <span className={styles.flag}>{selected.flag}</span>
        <span className={styles.code}>{selected.code}</span>
        <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className={styles.dropdown} role="listbox" aria-labelledby="country-code-select">
          {countryCodes.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === value}>
              <button
                type="button"
                className={`${styles.option} ${c.code === value ? styles.optionSelected : ''}`}
                onClick={() => {
                  onChange(c.code)
                  setIsOpen(false)
                }}
              >
                <span className={styles.flag}>{c.flag}</span>
                <span className={styles.optionCountry}>{c.country}</span>
                <span className={styles.optionCode}>{c.code}</span>
              </button>
            </li>
          ))}  
        </ul>
      )}
    </div>
  )
}
