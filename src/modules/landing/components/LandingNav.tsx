'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './LandingNav.module.css'

export function LandingNav() {
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`${styles.nav} ${isSticky ? styles.navSticky : ''}`}>
      <div className={styles.navInner}>
        <div className={styles.logo}>
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon}>
            <rect width="40" height="40" rx="10" fill="#E8A020" />
            <path d="M12 28L16 14L20 22L24 16L28 24" stroke="#1A3D2B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="28" cy="24" r="2.5" fill="#F7F3EC" />
          </svg>
          <span className={styles.logoText}>Trustline</span>
        </div>
        <Link 
          href="/login" 
          className={`${styles.ctaButton} ${isSticky ? styles.ctaSticky : ''}`}
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}
