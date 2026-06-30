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
  Check,
  TrendingUp
} from 'lucide-react'
import styles from './LandingPageClient.module.css'

// Simple Counter Component to animate numbers when in view
function StatCounter({ value }: { value: string }) {
  const suffix = value.replace(/[\d,]/g, '')
  const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          let start = 0
          const duration = 1400
          const step = (timestamp: number) => {
            if (!start) start = timestamp
            const progress = Math.min((timestamp - start) / duration, 1)
            setDisplayValue(Math.floor(progress * num))
            if (progress < 1) requestAnimationFrame(step)
            else setDisplayValue(num)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [num])

  return (
    <span ref={ref} className={styles.statNum}>
      {suffix.startsWith('₦') ? `₦${displayValue.toLocaleString()}${suffix.slice(1)}` : `${displayValue.toLocaleString()}${suffix}`}
    </span>
  )
}

export function LandingPageClient() {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'web'>('android')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [slideDir, setSlideDir] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const testimonials = [
    {
      quote: "I've been selling tomatoes here for 7 years. I never had proof of my earnings. Trustline gave me a record I could finally show — it opened doors I didn't know existed.",
      author: "Adaeze O.",
      role: "Market trader, Balogun Market, Lagos",
      image: "/images/market-tomatoes.jpg",
    },
    {
      quote: "Our ajo group had arguments every month about who had paid. Since we moved to Trustline, everything is clear and transparent. No more quarrels, no more missing money.",
      author: "Kemi B.",
      role: "Hairdresser & group admin, Ikeja",
      image: "/images/hairdresser.png",
    },
    {
      quote: "I carry goods every day and use my phone to track everything. Trustline is the first app that actually understands how we work — simple, fast, no stress.",
      author: "Fatima A.",
      role: "Goods carrier & small trader, Oshodi",
      image: "/images/trader-phone.jpg",
    },
    {
      quote: "From spices to savings — Trustline helped me organise my ajo contributions and show my income when I needed a small loan. Best thing I ever used.",
      author: "Ngozi E.",
      role: "Spice trader, Kano Market",
      image: "/images/spice-trader.jpg",
    }
  ]

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
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } else {
      window.open('https://play.google.com/store/apps/details?id=app.trustline', '_blank')
    }
  }

  const goPrev = () => {
    setSlideDir(-1)
    setActiveTestimonial(i => (i - 1 + testimonials.length) % testimonials.length)
  }
  const goNext = () => {
    setSlideDir(1)
    setActiveTestimonial(i => (i + 1) % testimonials.length)
  }

  // Auto-advance testimonials every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goNext()
    }, 6000)
    return () => clearInterval(timer)
  }, [activeTestimonial])

  const renderPhoneScreen = () => {
    switch (activeTab) {
      case 'android':
        return (
          <div className={styles.mockPlayStore}>
            <div className={styles.mockPlayHeader}>
              <span className={styles.mockPlayBack}>&larr;</span>
              <span className={styles.mockPlaySearch}>Google Play</span>
            </div>
            <div className={styles.mockPlayContent}>
              <div className={styles.mockPlayAppInfo}>
                <div className={styles.mockPlayIcon}>🛡️</div>
                <div className={styles.mockPlayAppText}>
                  <h4 className={styles.mockPlayTitle}>Trustline</h4>
                  <p className={styles.mockPlayDev}>Trustline Team</p>
                  <p className={styles.mockPlayRating}>4.8 ★ · 10K+ downloads</p>
                </div>
              </div>
              <button className={styles.mockPlayInstallBtn} onClick={handleAndroidInstall}>Install</button>
              <div className={styles.mockPlayScreenshots}>
                <div className={styles.mockPlayScreenItem}>
                  <div className={styles.mockInnerApp}>
                    <div className={styles.mockInnerHeader}>Dashboard</div>
                    <div className={styles.mockInnerCard}>₦85,000</div>
                    <div className={styles.mockInnerCardSecondary}>Trust Score: 85</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'ios':
        return (
          <div className={styles.mockSafari}>
            <div className={styles.mockSafariHeader}>
              <span className={styles.mockSafariLock}>🔒</span>
              <span className={styles.mockSafariUrl}>trustline.vercel.app</span>
            </div>
            <div className={styles.mockSafariPage}>
              <div className={styles.mockAppBranding}>
                <span className={styles.mockAppLogo}>🛡️</span>
                <h3>TRUSTLINE</h3>
                <p>Your Sales Diary</p>
              </div>
            </div>
            <div className={styles.mockSafariMenu}>
              <div className={styles.mockSafariMenuHeader}>
                <span className={styles.mockSafariMenuTitle}>Options</span>
              </div>
              <div className={styles.mockSafariMenuItem}>
                <span>📤 Share...</span>
              </div>
              <div className={`${styles.mockSafariMenuItem} ${styles.mockSafariMenuItemActive}`}>
                <span>➕ <strong>Add to Home Screen</strong></span>
              </div>
              <div className={styles.mockSafariMenuItem}>
                <span>🔖 Add Bookmark</span>
              </div>
            </div>
          </div>
        )
      case 'web':
        return (
          <div className={styles.mockPwa}>
            <div className={styles.mockPwaHeader}>
              <div className={styles.mockPwaDots}><span /><span /><span /></div>
              <span className={styles.mockPwaUrl}>trustline.vercel.app</span>
            </div>
            <div className={styles.mockPwaPage}>
              <div className={styles.mockAppBranding}>
                <span className={styles.mockAppLogo}>🛡️</span>
                <h3>TRUSTLINE</h3>
              </div>
              <div className={styles.mockPwaPrompt}>
                <h4>Install Trustline App?</h4>
                <p>Run full-screen, launch from desktop, and sync offline.</p>
                <div className={styles.mockPwaBtns}>
                  <button className={styles.mockPwaCancel} onClick={() => setActiveTab('android')}>Cancel</button>
                  <button className={styles.mockPwaInstall} onClick={() => window.open('/login', '_self')}>Install</button>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div ref={containerRef} className={styles.page}>

      {/* ===== NAVIGATION ===== */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <img src="/images/logo-full.jpg" alt="Trustline – Your Sales Diary" className={styles.logoFull} />
          </Link>
          <div className={styles.navLinksRight}>
            <Link href="/directory" className={styles.navLink}>Directory</Link>
            <Link href="/login" className={styles.navCta}>
              Get started — it&apos;s free
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION — full-bleed background image, centered text ===== */}
      <header className={styles.hero}>
        {/* Background image */}
        <div className={styles.heroBg} />
        {/* Dark gradient overlay */}
        <div className={styles.heroOverlay} />

        {/* Centered content */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={styles.heroContent}
        >
          <p className={styles.heroEyebrow}>For traders · vendors · service providers</p>
          <h1 className={styles.heroTitle}>
            Your daily hustle,<br />
            <span className={styles.heroTitleAccent}>now on record.</span>
          </h1>
          <p className={styles.heroDescription}>
            Track income, collect customer reviews, save with your group. Trustline turns your everyday work into a provable financial history.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/login" className={styles.heroPrimaryBtn}>
              Get started — it&apos;s free
            </Link>
            <Link href="/directory" className={styles.heroSecondaryBtn}>
              Explore directory <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.trustSignals}>
            <span><Check size={14} className={styles.signalCheck} /> Free to use</span>
            <span className={styles.signalsDot}>·</span>
            <span><Check size={14} className={styles.signalCheck} /> No bank required</span>
            <span className={styles.signalsDot}>·</span>
            <span><Check size={14} className={styles.signalCheck} /> Works offline</span>
          </div>
        </motion.div>
      </header>

      {/* ===== STATS BAR — Sage green, matching Screenshot 1 ===== */}
      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          {[
            { val: '500+', label: 'Active traders' },
            { val: '₦8.5M+', label: 'Income tracked' },
            { val: '45+', label: 'Ajo groups active' },
            { val: '4.8★', label: 'Average trust score' },
          ].map((s, i) => (
            <div key={i} className={styles.statItem}>
              <span className={styles.statNum}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HORIZONTAL TICKER BAR — scrolling under the hero/stats section ===== */}
      <div className={styles.tickerBar}>
        <div className={styles.tickerTrack}>
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className={styles.tickerText}>
              Trustline • Building financial trust for Africa&apos;s informal economy
            </span>
          ))}
        </div>
      </div>

      {/* ===== SOCIAL PROOF SECTION ===== */}
      <section className={styles.socialProofSection}>
        <div className={styles.socialProofInner}>

          {/* Left: Headline + Stats Grid */}
          <div className={styles.socialProofLeft}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
            >
              <span className={styles.sectionEyebrow}>OUR NUMBERS</span>
              <h2 className={styles.socialProofTitle}>Trusted by traders,<br />built for the hustle.</h2>
              <p className={styles.socialProofSub}>Real people. Real records. Real results — across markets and communities in Nigeria.</p>
            </motion.div>

            <div className={styles.statsGrid}>
              {[
                { val: '500+', label: 'Active traders', desc: 'Across Lagos, Abuja & beyond' },
                { val: '₦8.5M+', label: 'Income tracked', desc: 'And growing every week' },
                { val: '45+', label: 'Ajo groups', desc: 'Running on Trustline' },
                { val: '4.8★', label: 'Trust score avg', desc: 'From verified user reviews' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={styles.statCard}
                >
                  <span className={styles.statNum}>{s.val}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statDesc}>{s.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Photo mosaic of real traders */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className={styles.socialProofPhotos}
          >
            <div className={styles.photoMosaic}>
              <img src="/images/market-tomatoes.jpg" alt="Market trader" className={`${styles.mosaicImg} ${styles.mosaicMain}`} />
              <img src="/images/trader-phone.jpg" alt="Trader on phone" className={`${styles.mosaicImg} ${styles.mosaicTopRight}`} />
              <img src="/images/spice-trader.jpg" alt="Spice trader" className={`${styles.mosaicImg} ${styles.mosaicBottomRight}`} />
            </div>
          </motion.div>

        </div>
      </section>

      {/* ===== WHO IT'S FOR ===== */}
      <section className={styles.whoSection}>
        <div className={styles.sectionInner}>
          <div className={styles.whoIntro}>
            {/* Left Column: Image depicting hard workers */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
              className={styles.whoImageCol}
            >
              <img
                src="/images/barrow_pushers.png"
                alt="Hardworking workers pushing carts"
                className={styles.whoIntroImage}
              />
            </motion.div>

            {/* Right Column: Text content */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
              className={styles.whoTextCol}
            >
              <span className={styles.sectionEyebrow}>WHO WE SERVE</span>
              <h2 className={styles.sectionTitle}>Built for people who<br />work hard every day</h2>
              <p className={styles.sectionSubtitle}>Whether you sell goods, offer services, or save with a group — Trustline is for you</p>
            </motion.div>
          </div>

          <div className={styles.cardGrid}>
            {[
              { icon: <Wallet size={26} />, title: "Traders & Vendors", text: "Market sellers, shop owners, anyone who buys and sells. Log every sale, track supply costs, see your real profit day by day." },
              { icon: <Sparkles size={26} />, title: "Service Providers", text: "Tailors, mechanics, hairdressers, electricians. Build a public profile customers can review so new clients know you're trustworthy." },
              { icon: <Users size={26} />, title: "Savings Groups", text: "Ajo, esusu, contribution circles. Manage rotating savings digitally — track who's paid, whose turn it is, never lose money to poor records." },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={styles.whoCard}
              >
                <div className={styles.whoIconSquare}>{card.icon}</div>
                <h3 className={styles.whoCardTitle}>{card.title}</h3>
                <p className={styles.whoCardText}>{card.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — screenshot style ===== */}
      <section className={styles.howSection}>
        <div className={styles.sectionInner}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className={styles.sectionHeaderCenter}
          >
            <span className={styles.sectionEyebrow}>SIMPLE STEPS</span>
            <h2 className={styles.sectionTitle}>How Trustline works</h2>
            <p className={styles.sectionSubtitle}>Three simple steps to start building your financial reputation</p>
          </motion.div>

          {/* Steps row with dashed connector line */}
          <div className={styles.stepsRow}>
            {/* Dashed connector line sits behind all circles */}
            <div className={styles.stepsDashedLine} />

            {[
              { num: "1", icon: <TrendingUp size={32} />, title: "Log your income", text: "Record daily sales and expenses in seconds. Works without internet, syncs when you reconnect." },
              { num: "2", icon: <Star size={32} />, title: "Build your reputation", text: "Share your profile link with customers. Every review strengthens your record." },
              { num: "3", icon: <AwardIcon size={32} />, title: "Access credit & savings", text: "Your income record becomes your credit history. Join ajo groups, qualify for micro-credit, prove your worth." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={styles.stepItem}
              >
                {/* Circle with icon + badge */}
                <div className={styles.stepCircleWrap}>
                  <div className={styles.stepCircleBig}>{step.icon}</div>
                  <span className={styles.stepBadge}>{step.num}</span>
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID (Grey.co dark bento style) ===== */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionInner}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className={styles.sectionHeaderCenter}
          >
            <span className={styles.sectionEyebrowSaffron}>WHY CHOOSE TRUSTLINE</span>
            <h2 className={styles.featuresTitle}>Built for how you actually work</h2>
          </motion.div>

          <div className={styles.featuresGrid}>
            {[
              { icon: <WifiOff size={22} />, title: "Works offline", text: "Log income and expenses with no data. Syncs automatically when back online." },
              { icon: <Star size={22} />, title: "Customer reviews", text: "Customers rate you directly. A real public profile is your most powerful marketing tool." },
              { icon: <Users size={22} />, title: "Ajo & savings groups", text: "Manage rotating savings with full transparency. Everyone sees the records, no disputes." },
              { icon: <GiftIcon size={22} />, title: "Completely free", text: "No subscription fees, no hidden charges. Every hardworking person deserves a financial identity." },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className={styles.featureCard}
              >
                <div className={styles.featureIconWrapper}>{feat.icon}</div>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureText}>{feat.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS — Grey.co: one full-width card, horizontal slide ===== */}
      <section className={styles.testimonialsSection}>
        <div className={styles.testimonialsCard}>
          <AnimatePresence mode="wait" custom={slideDir}>
            <motion.div
              key={activeTestimonial}
              custom={slideDir}
              variants={{
                enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.32, 0, 0.67, 0] }}
              className={styles.tSlide}
            >
              {/* Photo */}
              <div className={styles.tPhotoCol}>
                <img
                  src={testimonials[activeTestimonial].image}
                  alt={testimonials[activeTestimonial].author}
                  className={styles.tPhoto}
                />
              </div>
              {/* Quote + author */}
              <div className={styles.tTextCol}>
                <p className={styles.tQuote}>
                  &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
                </p>
                <div className={styles.tAuthorRow}>
                  <div className={styles.tAuthorInfo}>
                    <span className={styles.tAuthorName}>{testimonials[activeTestimonial].author}</span>
                    <span className={styles.tAuthorRole}>{testimonials[activeTestimonial].role}</span>
                  </div>
                  {/* Navigation arrows — bottom right */}
                  <div className={styles.tNavArrows}>
                    <button onClick={goPrev} className={styles.tArrow} aria-label="Previous">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button onClick={goNext} className={styles.tArrow} aria-label="Next">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ===== PARALLAX DIVIDER ===== */}
      <div className={styles.parallaxSection} />

      {/* ===== INSTALL SECTION ===== */}
      <section className={styles.installSection}>
        <div className={styles.sectionInner}>
          <div className={styles.installGrid}>
            {/* Left Column: Interactive Phone Mockup */}
            <div className={styles.mockupContainer}>
              <div className={styles.mockupPhone}>
                <div className={styles.mockupSpeaker} />
                <div className={styles.mockupScreen}>
                  {renderPhoneScreen()}
                </div>
              </div>
            </div>

            {/* Right Column: Content + Tabs */}
            <div className={styles.installContent}>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className={styles.sectionHeaderLeft}
              >
                <span className={styles.sectionEyebrow}>EASY INSTALLATION</span>
                <h2 className={styles.sectionTitle}>Get Trustline on your phone</h2>
                <p className={styles.sectionSubtitle}>Choose your device below to install Trustline as a lightweight web app</p>
              </motion.div>

              <div className={styles.tabButtons}>
                <button onClick={() => setActiveTab('android')} className={`${styles.tabBtn} ${activeTab === 'android' ? styles.tabBtnActive : ''}`}>Android</button>
                <button onClick={() => setActiveTab('ios')} className={`${styles.tabBtn} ${activeTab === 'ios' ? styles.tabBtnActive : ''}`}>iPhone (iOS)</button>
                <button onClick={() => setActiveTab('web')} className={`${styles.tabBtn} ${activeTab === 'web' ? styles.tabBtnActive : ''}`}>Web App (PWA)</button>
              </div>

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
                          <li>Open Trustline in Safari on your iPhone</li>
                          <li>Tap the Share button (□↑) at the bottom of Safari</li>
                          <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
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
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
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

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <img src="/images/logo-full.jpg" alt="Trustline" className={styles.footerLogo} />
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
