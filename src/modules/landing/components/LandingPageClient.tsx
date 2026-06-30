'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Smartphone, 
  Sparkles, 
  Wallet, 
  Users, 
  Star, 
  ArrowRight, 
  WifiOff, 
  Download,
  TrendingUp
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

// Subtle fade-in animation (Grey.co style)
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }
}

export function LandingPageClient() {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'web'>('android')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Stats data for the marquee
  const stats = [
    { value: '12000+', label: 'Active traders' },
    { value: '₦2.4B+', label: 'Income tracked' },
    { value: '340+', label: 'Ajo groups active' },
    { value: '4.9★', label: 'Average trust score' },
  ]

  return (
    <div ref={containerRef} className={styles.page}>
      {/* Fixed Navigation */}
      <nav className={styles.nav}>
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
      </nav>

      {/* Hero Section — Clean: headline + subtitle + CTA + image */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            <Link href="/login" className={styles.heroPrimaryCta}>
              Get started — it&apos;s free <ArrowRight className={styles.btnArrow} />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            className={styles.heroImageContainer}
          >
            <img 
              src="/images/trader-hero.png" 
              alt="Trusted Trader" 
              className={styles.heroImage} 
            />
          </motion.div>
        </div>
      </header>

      {/* Stats Marquee — Infinite scrolling ticker */}
      <section className={styles.statsBar}>
        <div className={styles.marqueeTrack}>
          {/* Duplicate content for seamless loop */}
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className={styles.marqueeContent}>
              {stats.map((stat, i) => (
                <div key={`${setIndex}-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={styles.statItem}>
                    <StatCounter value={stat.value} />
                    <span className={styles.statLabel}>{stat.label}</span>
                  </div>
                  <div className={styles.statDivider} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* "Who It's For" Section */}
      <section className={styles.whoSection}>
        <div className={styles.sectionInner}>
          <motion.div {...fadeUp} className={styles.sectionHeaderLeft}>
            <span className={styles.sectionEyebrow}>WHO WE SERVE</span>
            <h2 className={styles.sectionTitle}>Built for people who work hard every day</h2>
            <p className={styles.sectionSubtitle}>Whether you sell goods, offer services, or save with a group — Trustline is for you</p>
          </motion.div>

          <div className={styles.cardGrid}>
            <motion.div 
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0 }}
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
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
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
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
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
          <motion.div {...fadeUp} className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>SIMPLE STEPS</span>
            <h2 className={styles.sectionTitle}>How Trustline works</h2>
            <p className={styles.sectionSubtitle}>Three simple steps to start building your financial reputation</p>
          </motion.div>

          <div className={styles.stepsGrid}>
            <motion.div {...fadeUp} className={styles.stepCard}>
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
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className={styles.stepCard}>
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
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className={styles.stepCard}>
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionInner}>
          <motion.div {...fadeUp} className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrowSaffron}>WHY CHOOSE TRUSTLINE</span>
            <h2 className={styles.featuresTitle}>Built for how you actually work</h2>
          </motion.div>

          <div className={styles.featuresGrid}>
            <motion.div {...fadeUp} className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <WifiOff size={22} />
              </div>
              <h3 className={styles.featureTitle}>Works offline</h3>
              <p className={styles.featureText}>
                Log income and expenses with no data. Syncs automatically when back online.
              </p>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Star size={22} />
              </div>
              <h3 className={styles.featureTitle}>Customer reviews</h3>
              <p className={styles.featureText}>
                Customers rate you directly. A real public profile is your most powerful marketing tool.
              </p>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Users size={22} />
              </div>
              <h3 className={styles.featureTitle}>Ajo &amp; savings groups</h3>
              <p className={styles.featureText}>
                Manage rotating savings with full transparency. Everyone sees the records, no disputes.
              </p>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className={styles.featureCard}>
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
          <motion.div {...fadeUp} className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>COMMUNITY VOICES</span>
            <h2 className={styles.sectionTitle}>Deserving profiles build real trust</h2>
          </motion.div>

          <div className={styles.testimonialsGrid}>
            <motion.div {...fadeUp} className={styles.testimonialCard}>
              <span className={styles.quoteMark}>&ldquo;</span>
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

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className={styles.testimonialCard}>
              <span className={styles.quoteMark}>&ldquo;</span>
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

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className={styles.testimonialCard}>
              <span className={styles.quoteMark}>&ldquo;</span>
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

      {/* Parallax Divider Image */}
      <div className={styles.parallaxSection} />

      {/* Install Section */}
      <section className={styles.installSection}>
        <div className={styles.installInner}>
          <motion.div {...fadeUp} className={styles.sectionHeaderCenter}>
            <span className={styles.sectionEyebrow}>EASY INSTALLATION</span>
            <h2 className={styles.sectionTitle}>Get Trustline on your phone</h2>
            <p className={styles.sectionSubtitle}>Choose your device below to install Trustline as a light web app</p>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
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
                      <Smartphone size={18} /> Open in Safari
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
                      Open Trustline in browser
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
              Get started — it&apos;s free
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
