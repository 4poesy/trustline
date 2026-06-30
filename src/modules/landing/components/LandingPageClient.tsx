'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  Users, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Lock, 
  WifiOff, 
  Heart,
  Download,
  Layers,
  ChevronRight,
  MapPin,
  Check
} from 'lucide-react'
import styles from './LandingPageClient.module.css'

// Simple Counter Component to animate numbers when in view
function StatCounter({ value, duration = 2 }: { value: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10)
  const suffix = value.replace(/[0-9]/g, '')

  useEffect(() => {
    let observer: IntersectionObserver
    let startTimestamp: number | null = null

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1)
      setDisplayValue(Math.floor(progress * numericValue))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        window.requestAnimationFrame(step)
        observer.disconnect()
      }
    }

    if (ref.current) {
      observer = new IntersectionObserver(handleIntersect, { threshold: 0.5 })
      observer.observe(ref.current)
    }

    return () => {
      if (observer) observer.disconnect()
    }
  }, [numericValue, duration])

  return (
    <span ref={ref} className={styles.statNum}>
      {suffix.startsWith('₦') ? `₦${displayValue.toLocaleString()}${suffix.slice(1)}` : `${displayValue.toLocaleString()}${suffix}`}
    </span>
  )
}

export function LandingPageClient() {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'web'>('android')
  const [isSticky, setIsSticky] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const heroCardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollY } = useScroll()
  const yNav = useTransform(scrollY, [0, 100], [0, 8])

  // Scroll handler for navbar background transitions
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 45) {
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
      window.open('https://play.google.com/store/apps/details?id=app.trustline', '_blank')
    }
  }

  // 3D card tilt effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = heroCardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = -(y - centerY) / 8
    const rotateY = (x - centerX) / 8
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
  }

  const handleCardMouseLeave = () => {
    const card = heroCardRef.current
    if (!card) return
    card.style.transform = 'perspective(1000px) rotateY(-8deg) rotateX(4deg) scale3d(1, 1, 1)'
  }

  return (
    <div ref={containerRef} className={styles.page}>
      {/* Background Accent Lights */}
      <div className={styles.radialGlowTeal} />
      <div className={styles.radialGlowGold} />

      {/* Navigation */}
      <motion.nav 
        style={{ y: yNav }}
        className={`${styles.nav} ${isSticky ? styles.navSticky : ''}`}
      >
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoMark}>T</div>
            <span className={styles.logoText}>Trustline</span>
          </Link>
          <div className={styles.navLinksRight}>
            <Link href="/login" className={styles.navCta}>
              Get the App
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={styles.heroContent}
          >
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
                <Smartphone className={styles.storeIcon} />
                <div className={styles.storeTextCol}>
                  <span className={styles.storeLabel}>Get it on</span>
                  <span className={styles.storeName}>Google Play</span>
                </div>
              </a>
              <a href="https://apps.apple.com/us/app/trustline/id164" target="_blank" rel="noopener noreferrer" className={styles.storeButton}>
                <Smartphone className={styles.storeIcon} />
                <div className={styles.storeTextCol}>
                  <span className={styles.storeLabel}>Download on the</span>
                  <span className={styles.storeName}>App Store</span>
                </div>
              </a>
            </div>

            <div className={styles.separator}>— or —</div>

            <Link href="/login" className={styles.heroBrowserCta}>
              Open in browser — it&apos;s free <ArrowRight className={styles.btnArrow} />
            </Link>

            <div className={styles.trustSignals}>
              <span className={styles.signalWord}><Check className={styles.signalCheck} /> Free to use</span>
              <span className={styles.signalsDot}>·</span>
              <span className={styles.signalWord}><Check className={styles.signalCheck} /> No bank required</span>
              <span className={styles.signalsDot}>·</span>
              <span className={styles.signalWord}><Check className={styles.signalCheck} /> Works offline</span>
            </div>
          </motion.div>

          {/* Right Column: Dynamic CSS Card Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: -8 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className={styles.heroCardCol}
          >
            <div 
              className={styles.trustlineCard}
              ref={heroCardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>TRUSTLINE</span>
                <span className={styles.verifiedBadge}>
                  <ShieldCheck size={10} className={styles.verifiedIcon} /> VERIFIED
                </span>
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
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className={styles.floatingBadge}
            >
              <div className={styles.badgeIconCircle}>
                <Star size={16} fill="currentColor" />
              </div>
              <div>
                <p className={styles.badgeTitle}>47 customer reviews</p>
                <p className={styles.badgeSub}>4.9 average rating</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Dynamic transition border */}
        <div className={styles.heroBorderBottom}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={styles.waveSvg}>
            <path d="M0,32L80,48C160,64,320,96,480,101.3C640,107,800,85,960,74.7C1120,64,1280,64,1360,64L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="var(--linen)"></path>
            <path d="M0,32L80,48C160,64,320,96,480,101.3C640,107,800,85,960,74.7C1120,64,1280,64,1360,64L1440,64" fill="none" stroke="var(--saffron)" strokeWidth="3"></path>
          </svg>
        </div>
      </header>

      {/* Stats Bar */}
      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          <div className={styles.statItem}>
            <StatCounter value="12000+" />
            <span className={styles.statLabel}>Active traders</span>
          </div>
          <div className={styles.statItem}>
            <StatCounter value="₦2.4B+" />
            <span className={styles.statLabel}>Income tracked</span>
          </div>
          <div className={styles.statItem}>
            <StatCounter value="340+" />
            <span className={styles.statLabel}>Ajo groups active</span>
          </div>
          <div className={styles.statItem}>
            <StatCounter value="4.9★" />
            <span className={styles.statLabel}>Average trust score</span>
          </div>
        </div>
      </section>

      {/* "Who It's For" Section */}
      <section className={styles.whoSection}>
        <div className={styles.sectionInner}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={styles.sectionHeaderLeft}
          >
            <span className={styles.sectionEyebrow}>WHO WE SERVE</span>
            <h2 className={styles.sectionTitle}>Built for people who work hard every day</h2>
            <p className={styles.sectionSubtitle}>Whether you sell goods, offer services, or save with a group — Trustline is for you</p>
          </motion.div>

          <div className={styles.cardGrid}>
            <motion.div 
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(26, 61, 43, 0.12)' }}
              className={styles.whoCard}
            >
              <div className={styles.whoIconSquare}>
                <Wallet className={styles.whoIcon} />
              </div>
              <h3 className={styles.whoCardTitle}>Traders &amp; Vendors</h3>
              <p className={styles.whoCardText}>
                Market sellers, shop owners, anyone who buys and sells. Log every sale, track supply costs, see your real profit day by day.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(26, 61, 43, 0.12)' }}
              className={styles.whoCard}
            >
              <div className={styles.whoIconSquare}>
                <Sparkles className={styles.whoIcon} />
              </div>
              <h3 className={styles.whoCardTitle}>Service Providers</h3>
              <p className={styles.whoCardText}>
                Tailors, mechanics, hairdressers, electricians. Build a public profile customers can review so new clients know you&apos;re trustworthy.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(26, 61, 43, 0.12)' }}
              className={styles.whoCard}
            >
              <div className={styles.whoIconSquare}>
                <Users className={styles.whoIcon} />
              </div>
              <h3 className={styles.whoCardTitle}>Savings Groups</h3>
              <p className={styles.whoCardText}>
                Ajo, esusu, contribution circles. Manage rotating savings digitally — track who&apos;s paid, whose turn it is, never lose money to poor records.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section className={styles.howSection}>
        <div className={styles.sectionInner}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={styles.sectionHeaderCenter}
          >
            <span className={styles.sectionEyebrow}>SIMPLE STEPS</span>
            <h2 className={styles.sectionTitle}>How Trustline works</h2>
            <p className={styles.sectionSubtitle}>Three simple steps to start building your financial reputation</p>
          </motion.div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepCircleWrapper}>
                <div className={styles.stepCircle}>
                  <TrendingUp size={28} />
                </div>
                <span className={styles.stepBadge}>1</span>
              </div>
              <h3 className={styles.stepTitle}>Log your income</h3>
              <p className={styles.stepText}>
                Record daily sales and expenses in seconds. Works without internet, syncs when you reconnect.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepCircleWrapper}>
                <div className={styles.stepCircle}>
                  <Star size={28} />
                </div>
                <span className={styles.stepBadge}>2</span>
              </div>
              <h3 className={styles.stepTitle}>Build your reputation</h3>
              <p className={styles.stepText}>
                Share your profile link with customers. Every review strengthens your record.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepCircleWrapper}>
                <div className={styles.stepCircle}>
                  <AwardIcon size={28} />
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
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={styles.sectionHeaderCenter}
          >
            <span className={styles.sectionEyebrowSaffron}>WHY CHOOSE TRUSTLINE</span>
            <h2 className={styles.featuresTitle}>Built for how you actually work</h2>
          </motion.div>

          <div className={styles.featuresGrid}>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={styles.featureCard}
            >
              <div className={styles.featureIconWrapper}>
                <WifiOff size={22} />
              </div>
              <h3 className={styles.featureTitle}>Works offline</h3>
              <p className={styles.featureText}>
                Log income and expenses with no data. Syncs automatically when back online.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={styles.featureCard}
            >
              <div className={styles.featureIconWrapper}>
                <Star size={22} />
              </div>
              <h3 className={styles.featureTitle}>Customer reviews</h3>
              <p className={styles.featureText}>
                Customers rate you directly. A real public profile is your most powerful marketing tool.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={styles.featureCard}
            >
              <div className={styles.featureIconWrapper}>
                <Users size={22} />
              </div>
              <h3 className={styles.featureTitle}>Ajo &amp; savings groups</h3>
              <p className={styles.featureText}>
                Manage rotating savings with full transparency. Everyone sees the records, no disputes.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={styles.featureCard}
            >
              <div className={styles.featureIconWrapper}>
                <GiftIcon size={22} />
              </div>
              <h3 className={styles.featureTitle}>Completely free</h3>
              <p className={styles.featureText}>
                No subscription fees, no hidden charges. Every hardworking person deserves a financial identity.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <div className={styles.sectionInner}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={styles.sectionHeaderCenter}
          >
            <span className={styles.sectionEyebrow}>COMMUNITY VOICES</span>
            <h2 className={styles.sectionTitle}>Deserving profiles build real trust</h2>
          </motion.div>

          <div className={styles.testimonialsGrid}>
            <motion.div 
              whileHover={{ y: -6 }}
              className={styles.testimonialCard}
            >
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
            </motion.div>

            <motion.div 
              whileHover={{ y: -6 }}
              className={styles.testimonialCard}
            >
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
            </motion.div>

            <motion.div 
              whileHover={{ y: -6 }}
              className={styles.testimonialCard}
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Install Section */}
      <section className={styles.installSection}>
        <div className={styles.installInner}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={styles.sectionHeaderCenter}
          >
            <span className={styles.sectionEyebrow}>EASY INSTALLATION</span>
            <h2 className={styles.sectionTitle}>Get Trustline on your phone</h2>
            <p className={styles.sectionSubtitle}>Choose your device layout below to install Trustline as a light web app</p>
          </motion.div>

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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className={styles.panel}
              >
                {activeTab === 'android' && (
                  <>
                    <ol className={styles.stepsList}>
                      <li>Tap &quot;Get it on Google Play&quot; below</li>
                      <li>Tap Install — it&apos;s free, no card required</li>
                      <li>Open Trustline and create your profile</li>
                    </ol>
                    <button className={styles.installActionBtn} onClick={handleAndroidInstall}>
                      <Download size={18} /> Get it on Google Play
                    </button>
                  </>
                )}

                {activeTab === 'ios' && (
                  <>
                    <ol className={styles.stepsList}>
                      <li>Open Trustline in Safari on your iPhone (Safari required for PWA install on iOS)</li>
                      <li>Tap the Share button (□↑) at the bottom of Safari</li>
                      <li>Scroll down and tap &quot;Add to Home Screen&quot; — Trustline appears like a native app</li>
                    </ol>
                    <Link href="/login" className={styles.installActionBtn}>
                      <Smartphone size={18} /> Open in Safari →
                    </Link>
                  </>
                )}

                {activeTab === 'web' && (
                  <>
                    <ol className={styles.stepsList}>
                      <li>Open Trustline in Chrome or Edge</li>
                      <li>Look for the install icon (⊕) in the address bar</li>
                      <li>Use it like a native app, even offline</li>
                    </ol>
                    <Link href="/login" className={styles.installActionBtn}>
                      🌐 Open Trustline in browser
                    </Link>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
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

function AwardIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  )
}

function GiftIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" rx="1" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}
