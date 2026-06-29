'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './LandingPageClient.module.css'

export function LandingPageClient() {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'web'>('android')
  const [isSticky, setIsSticky] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const heroCardRef = useRef<HTMLDivElement>(null)

  // Scroll handler for navbar background transitions
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-detect user device on mount
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) {
      setActiveTab('android')
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab('ios')
    } else {
      setActiveTab('android')
    }
  }, [])

  // Capture PWA beforeinstallprompt event for Android
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Trigger PWA install prompt
  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      // Fallback redirection to Play Store
      window.open('https://play.google.com/store/apps/details?id=app.trustline', '_blank')
    }
  }

  // Scroll reveal intersections
  useEffect(() => {
    const revealElements = document.querySelectorAll(`.${styles.reveal}`)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed)
          }
        });
      },
      { threshold: 0.15 }
    )
    revealElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // 3D card tilt effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = heroCardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = -(y - centerY) / 10
    const rotateY = (x - centerX) / 10
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleCardMouseLeave = () => {
    const card = heroCardRef.current
    if (!card) return
    card.style.transform = 'perspective(900px) rotateY(-6deg) rotateX(3deg)'
  }

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={`${styles.nav} ${isSticky ? styles.navSticky : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>T</div>
            <span className={styles.logoText}>Trustline</span>
          </div>
          <Link href="/login" className={styles.navCta}>
            Get the App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={`${styles.heroContent} ${styles.reveal}`}>
            <div className={styles.heroEyebrowRow}>
              <span className={styles.heroEyebrowLine} />
              <span className={styles.heroEyebrow}>FOR TRADERS · VENDORS · SERVICE PROVIDERS</span>
            </div>
            <h1 className={styles.heroTitle}>
              Build your credit history.<br />
              <span className={styles.heroTitleItalic}>No bank needed.</span>
            </h1>
            <p className={styles.heroDescription}>
              Track your daily income, get reviews from customers, and save together with your community. Trustline turns your everyday hustle into a provable financial record.
            </p>
            
            {/* Frosted glass store buttons */}
            <div className={styles.storeButtonsRow}>
              <a href="https://play.google.com/store/apps/details?id=app.trustline" target="_blank" rel="noopener noreferrer" className={styles.storeButton}>
                <svg className={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3.22a.75.75 0 0 0-.22.53v16.5a.75.75 0 0 0 .22.53l9.07-9.06-9.07-9.5zm10.13 8.03l3.03-3.03a.5.5 0 0 0 0-.7l-3.03-3.03-3.03 3.03a.5.5 0 0 0 0 .7l3.03 3.03zm-1.78-4.8L5.59 2.5a1 1 0 0 0-1.18 0l9.07 9.07-2.12-2.12zM5.59 21.5l7.76-3.95-2.12-2.12-9.07 9.07a1 1 0 0 0 1.18-.5z" />
                </svg>
                <div className={styles.storeTextCol}>
                  <span className={styles.storeLabel}>Get it on</span>
                  <span className={styles.storeName}>Google Play</span>
                </div>
              </a>
              <a href="https://apps.apple.com/us/app/trustline/id164" target="_blank" rel="noopener noreferrer" className={styles.storeButton}>
                <svg className={styles.storeIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
                </svg>
                <div className={styles.storeTextCol}>
                  <span className={styles.storeLabel}>Download on the</span>
                  <span className={styles.storeName}>App Store</span>
                </div>
              </a>
            </div>

            <div className={styles.separator}>— or —</div>

            <Link href="/login" className={styles.heroBrowserCta}>
              Open in browser — it&apos;s free →
            </Link>

            <div className={styles.trustSignals}>
              <span>✓ Free to use</span>
              <span className={styles.signalsDot}>·</span>
              <span>✓ No bank required</span>
              <span className={styles.signalsDot}>·</span>
              <span>✓ Works offline</span>
            </div>
          </div>

          {/* Right Column: Dynamic CSS Card Mockup */}
          <div className={`${styles.heroCardCol} ${styles.reveal}`}>
            <div 
              className={styles.trustlineCard}
              ref={heroCardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>TRUSTLINE</span>
                <span className={styles.verifiedBadge}>VERIFIED</span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.profileSection}>
                  <div className={styles.avatarPlaceholder}>AI</div>
                  <div>
                    <h4 className={styles.memberName}>Aliko Ibrahim</h4>
                    <span className={styles.memberSubtitle}>Provision Retailer · Lagos</span>
                  </div>
                </div>

                <div className={styles.earningsSection}>
                  <span className={styles.cardLabel}>DAILY INCOME</span>
                  <span className={styles.earningsValue}><sup className={styles.currencySymbol}>₦</sup>12,450</span>
                  <span className={styles.earningsPeriod}>Average · Last 30 days</span>
                </div>

                <div className={styles.scoreSection}>
                  <div className={styles.scoreRow}>
                    <span className={styles.cardLabel}>TRUST SCORE</span>
                    <span className={styles.scoreBadgeText}>Good (72/100)</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div className={styles.barFill} style={{ width: '72%' }} />
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div>
                  <span className={styles.footerLabel}>MEMBER SINCE</span>
                  <span className={styles.footerVal}>2026</span>
                </div>
                <div>
                  <span className={styles.footerLabel}>REVIEWS</span>
                  <span className={styles.footerVal}>47 Verified</span>
                </div>
                <div>
                  <span className={styles.footerLabel}>SAVINGS GROUP</span>
                  <span className={styles.footerVal}>Active</span>
                </div>
              </div>
            </div>

            {/* Floating rating badge */}
            <div className={styles.floatingBadge}>
              <div className={styles.badgeIconCircle}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <p className={styles.badgeTitle}>47 customer reviews</p>
                <p className={styles.badgeSub}>4.9 average rating</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>12,000+</span>
            <span className={styles.statLabel}>Active traders</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>₦2.4B+</span>
            <span className={styles.statLabel}>Income tracked</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>340+</span>
            <span className={styles.statLabel}>Ajo groups active</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>4.9★</span>
            <span className={styles.statLabel}>Average trust score</span>
          </div>
        </div>
      </section>

      {/* "Who It's For" Section */}
      <section className={styles.whoSection}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeaderLeft} ${styles.reveal}`}>
            <span className={styles.sectionEyebrow}>WHO WE SERVE</span>
            <h2 className={styles.sectionTitle}>Built for people who work hard every day</h2>
            <p className={styles.sectionSubtitle}>Whether you sell goods, offer services, or save with a group — Trustline is for you</p>
          </div>

          <div className={styles.cardGrid}>
            <div className={`${styles.whoCard} ${styles.reveal}`}>
              <div className={styles.whoIconSquare}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h3 className={styles.whoCardTitle}>Traders &amp; Vendors</h3>
              <p className={styles.whoCardText}>
                Market sellers, shop owners, anyone who buys and sells. Log every sale, track supply costs, see your real profit day by day.
              </p>
            </div>

            <div className={`${styles.whoCard} ${styles.reveal}`}>
              <div className={styles.whoIconSquare}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <h3 className={styles.whoCardTitle}>Service Providers</h3>
              <p className={styles.whoCardText}>
                Tailors, mechanics, hairdressers, electricians. Build a public profile customers can review so new clients know you&apos;re trustworthy.
              </p>
            </div>

            <div className={`${styles.whoCard} ${styles.reveal}`}>
              <div className={styles.whoIconSquare}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={styles.whoCardTitle}>Savings Groups</h3>
              <p className={styles.whoCardText}>
                Ajo, esusu, contribution circles. Manage rotating savings digitally — track who&apos;s paid, whose turn it is, never lose money to poor records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section className={styles.howSection}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeaderCenter} ${styles.reveal}`}>
            <span className={styles.sectionEyebrow}>SIMPLE STEPS</span>
            <h2 className={styles.sectionTitle}>How Trustline works</h2>
            <p className={styles.sectionSubtitle}>Three simple steps to start building your financial reputation</p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={`${styles.stepCard} ${styles.reveal}`}>
              <div className={styles.stepCircleWrapper}>
                <div className={styles.stepCircle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <span className={styles.stepBadge}>1</span>
              </div>
              <h3 className={styles.stepTitle}>Log your income</h3>
              <p className={styles.stepText}>
                Record daily sales and expenses in seconds. Works without internet, syncs when you reconnect.
              </p>
            </div>

            <div className={`${styles.stepCard} ${styles.reveal}`}>
              <div className={styles.stepCircleWrapper}>
                <div className={styles.stepCircle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <span className={styles.stepBadge}>2</span>
              </div>
              <h3 className={styles.stepTitle}>Build your reputation</h3>
              <p className={styles.stepText}>
                Share your profile link with customers. Every review strengthens your record.
              </p>
            </div>

            <div className={`${styles.stepCard} ${styles.reveal}`}>
              <div className={styles.stepCircleWrapper}>
                <div className={styles.stepCircle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className={styles.stepBadge}>3</span>
              </div>
              <h3 className={styles.stepTitle}>Access credit &amp; savings</h3>
              <p className={styles.stepText}>
                Your income record becomes your credit history. Join ajo groups, qualify for micro-credit, prove your worth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeaderCenter} ${styles.reveal}`}>
            <span className={styles.sectionEyebrowSaffron}>WHY CHOOSE TRUSTLINE</span>
            <h2 className={styles.featuresTitle}>Built for how you actually work</h2>
          </div>

          <div className={styles.featuresGrid}>
            <div className={`${styles.featureCard} ${styles.reveal}`}>
              <div className={styles.featureIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                  <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Works offline</h3>
              <p className={styles.featureText}>
                Log income and expenses with no data. Syncs automatically when back online.
              </p>
            </div>

            <div className={`${styles.featureCard} ${styles.reveal}`}>
              <div className={styles.featureIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Customer reviews</h3>
              <p className={styles.featureText}>
                Customers rate you directly. A real public profile is your most powerful marketing tool.
              </p>
            </div>

            <div className={`${styles.featureCard} ${styles.reveal}`}>
              <div className={styles.featureIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12S6.48 2 12 2z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Ajo &amp; savings groups</h3>
              <p className={styles.featureText}>
                Manage rotating savings with full transparency. Everyone sees the records, no disputes.
              </p>
            </div>

            <div className={`${styles.featureCard} ${styles.reveal}`}>
              <div className={styles.featureIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Completely free</h3>
              <p className={styles.featureText}>
                No subscription fees, no hidden charges. Every hardworking person deserves a financial identity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeaderCenter} ${styles.reveal}`}>
            <span className={styles.sectionEyebrow}>COMMUNITY VOICES</span>
            <h2 className={styles.sectionTitle}>Deserving profiles build real trust</h2>
          </div>

          <div className={styles.testimonialsGrid}>
            <div className={`${styles.testimonialCard} ${styles.reveal}`}>
              <span className={styles.quoteMark}>“</span>
              <p className={styles.testimonialText}>
                &quot;I&apos;ve been selling fabrics for 9 years. I never had a way to show how much I earn. Trustline gave me a record I could actually show to a lender.&quot;
              </p>
              <div className={styles.authorRow}>
                <div className={styles.avatarCircle}>A</div>
                <div>
                  <h4 className={styles.authorName}>Adaeze O.</h4>
                  <span className={styles.authorRole}>Fabric seller, Balogun Market</span>
                </div>
              </div>
            </div>

            <div className={`${styles.testimonialCard} ${styles.reveal}`}>
              <span className={styles.quoteMark}>“</span>
              <p className={styles.testimonialText}>
                &quot;Our ajo group had arguments every month about who had paid. Since we moved to Trustline, everything is clear. No more quarrels.&quot;
              </p>
              <div className={styles.authorRow}>
                <div className={styles.avatarCircle}>K</div>
                <div>
                  <h4 className={styles.authorName}>Kemi B.</h4>
                  <span className={styles.authorRole}>Group admin, Ikeja</span>
                </div>
              </div>
            </div>

            <div className={`${styles.testimonialCard} ${styles.reveal}`}>
              <span className={styles.quoteMark}>“</span>
              <p className={styles.testimonialText}>
                &quot;My customers can now check my profile before they book. My new clients doubled in three months.&quot;
              </p>
              <div className={styles.authorRow}>
                <div className={styles.avatarCircle}>E</div>
                <div>
                  <h4 className={styles.authorName}>Emeka C.</h4>
                  <span className={styles.authorRole}>Auto mechanic, Abuja</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install Section */}
      <section className={styles.installSection}>
        <div className={styles.installInner}>
          <div className={`${styles.sectionHeaderCenter} ${styles.reveal}`}>
            <span className={styles.sectionEyebrow}>EASY INSTALLATION</span>
            <h2 className={styles.sectionTitle}>Get Trustline on your phone</h2>
            <p className={styles.sectionSubtitle}>Choose your device layout below to install Trustline as a light web app</p>
          </div>

          {/* Tab Selection */}
          <div className={styles.tabButtons}>
            <button
              onClick={() => setActiveTab('android')}
              className={`${styles.tabBtn} ${activeTab === 'android' ? styles.tabBtnActive : ''}`}
            >
              Android
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`${styles.tabBtn} ${activeTab === 'ios' ? styles.tabBtnActive : ''}`}
            >
              iPhone (iOS)
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`${styles.tabBtn} ${activeTab === 'web' ? styles.tabBtnActive : ''}`}
            >
              Web App (PWA)
            </button>
          </div>

          {/* Panels */}
          <div className={styles.panelContent}>
            {activeTab === 'android' && (
              <div className={styles.panel}>
                <ol className={styles.stepsList}>
                  <li>Tap &quot;Get it on Google Play&quot; below</li>
                  <li>Tap Install — it&apos;s free, no card required</li>
                  <li>Open Trustline and create your profile</li>
                </ol>
                <button className={styles.installActionBtn} onClick={handleAndroidInstall}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M5 3.22a.75.75 0 0 0-.22.53v16.5a.75.75 0 0 0 .22.53l9.07-9.06-9.07-9.5zm10.13 8.03l3.03-3.03a.5.5 0 0 0 0-.7l-3.03-3.03-3.03 3.03a.5.5 0 0 0 0 .7l3.03 3.03zm-1.78-4.8L5.59 2.5a1 1 0 0 0-1.18 0l9.07 9.07-2.12-2.12zM5.59 21.5l7.76-3.95-2.12-2.12-9.07 9.07a1 1 0 0 0 1.18-.5z" />
                  </svg>
                  Get it on Google Play
                </button>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className={styles.panel}>
                <ol className={styles.stepsList}>
                  <li>Open Trustline in Safari on your iPhone (Safari required for PWA install on iOS)</li>
                  <li>Tap the Share button (□↑) at the bottom of Safari</li>
                  <li>Scroll down and tap &quot;Add to Home Screen&quot; — Trustline appears like a native app</li>
                </ol>
                <Link href="/login" className={styles.installActionBtn}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
                  </svg>
                  Open in Safari →
                </Link>
              </div>
            )}

            {activeTab === 'web' && (
              <div className={styles.panel}>
                <ol className={styles.stepsList}>
                  <li>Open Trustline in Chrome or Edge</li>
                  <li>Look for the install icon (⊕) in the address bar</li>
                  <li>Use it like a native app, even offline</li>
                </ol>
                <Link href="/login" className={styles.installActionBtn}>
                  🌐 Open Trustline in browser
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={styles.finalCtaSection}>
        <div className={styles.finalCtaInner}>
          <span className={styles.finalEyebrow}>Your work is your proof</span>
          <h2 className={styles.finalTitle}>
            Your hustle deserves <span className={styles.finalTitleItalic}>a financial record.</span>
          </h2>
          <p className={styles.finalSub}>
            Join thousands of traders and service providers already building their credit history. It takes 60 seconds to start.
          </p>
          <div className={styles.finalCtaRow}>
            <Link href="/login" className={styles.finalPrimaryBtn}>
              Get started — it&apos;s free →
            </Link>
            <button className={styles.finalOutlineBtn} onClick={() => {
              document.querySelector(`.${styles.installSection}`)?.scrollIntoView({ behavior: 'smooth' })
            }}>
              See how to install
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoMarkSaffron}>T</div>
              <span className={styles.logoTextCharcoal}>Trustline</span>
            </div>
            <p className={styles.footerTagline}>Building financial trust for Africa&apos;s informal economy.</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/contact">Contact</a>
            <button className={styles.footerLinkBtn} onClick={() => {
              document.querySelector(`.${styles.installSection}`)?.scrollIntoView({ behavior: 'smooth' })
            }}>
              How to install
            </button>
          </div>
          <p className={styles.footerCopyright}>&copy; 2026 Trustline. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
