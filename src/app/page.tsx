import Link from 'next/link'
import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Trustline — Build Credit, Track Income, Save Together',
  description: 'Trustline helps traders, vendors, and service providers track income, build verifiable credit history, and save together in rotating savings groups. No bank account needed.',
  openGraph: {
    title: 'Trustline — Build Credit, Track Income, Save Together',
    description: 'Track your daily income, build a verifiable financial record, and access savings groups — all from your phone. Made for African traders and entrepreneurs.',
    type: 'website',
    locale: 'en_NG',
    siteName: 'Trustline',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trustline — Build Credit, Track Income, Save Together',
    description: 'Track your daily income, build a verifiable financial record, and access savings groups — all from your phone.',
  },
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <div className={styles.logo}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon} aria-hidden="true">
              <rect width="40" height="40" rx="10" fill="#0D7C66" />
              <path d="M12 28L16 14L20 22L24 16L28 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="28" cy="24" r="2" fill="#D4A24E" />
            </svg>
            <span className={styles.logoText}>Trustline</span>
          </div>
          <Link href="/login" className="btn btn-primary" id="nav-login-button">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>For traders, vendors &amp; service providers</span>
            <h1 className={styles.heroTitle}>
              Build your credit history.<br />
              <span className={styles.heroHighlight}>No bank account needed.</span>
            </h1>
            <p className={styles.heroDescription}>
              Track your daily income, get reviews from customers, and save together with your community. Trustline turns your everyday hustle into a provable financial record.
            </p>
            <div className={styles.heroCta}>
              <Link href="/login" className="btn btn-primary btn-large" id="hero-get-started-button">
                Start building your record
              </Link>
              <p className={styles.heroCtaNote}>Free to use · No bank required · Works offline</p>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className={styles.section} id="how-it-works">
        <div className="container">
          <h2 className={styles.sectionTitle}>How Trustline works</h2>
          <p className={styles.sectionSubtitle}>Three simple steps to start building your financial reputation</p>

          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3 className={styles.stepTitle}>Log your income</h3>
              <p className={styles.stepDescription}>Record your daily sales and expenses in seconds. Works even without internet — your data syncs when you&apos;re back online.</p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className={styles.stepTitle}>Build your reputation</h3>
              <p className={styles.stepDescription}>Get reviews from your customers. Your public profile lets new customers find you and see that you&apos;re trustworthy.</p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className={styles.stepTitle}>Access credit &amp; savings</h3>
              <p className={styles.stepDescription}>Your consistent income records build a credit score. Join savings groups (ajo/esusu) to save and grow together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="who-its-for">
        <div className="container">
          <h2 className={styles.sectionTitle}>Built for people who work hard every day</h2>
          <p className={styles.sectionSubtitle}>Whether you sell goods, offer services, or save with a group — Trustline is for you</p>

          <div className={styles.audienceGrid}>
            <article className={styles.audienceCard}>
              <div className={`${styles.audienceIcon} ${styles.audienceIconTrader}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h3 className={styles.audienceTitle}>Traders &amp; Vendors</h3>
              <p className={styles.audienceDescription}>Market sellers, shop owners, and anyone who buys and sells. Log every sale, track what you spend on supplies, and see your real profit.</p>
            </article>

            <article className={styles.audienceCard}>
              <div className={`${styles.audienceIcon} ${styles.audienceIconService}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <h3 className={styles.audienceTitle}>Service Providers</h3>
              <p className={styles.audienceDescription}>Tailors, mechanics, hairdressers, electricians — anyone who earns by doing work. Build a public profile your customers can review.</p>
            </article>

            <article className={styles.audienceCard}>
              <div className={`${styles.audienceIcon} ${styles.audienceIconSavings}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={styles.audienceTitle}>Savings Groups</h3>
              <p className={styles.audienceDescription}>Ajo, esusu, and contribution groups. Manage your rotating savings digitally — track who&apos;s paid, whose turn it is, and never lose money to poor records.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className={styles.section} id="trust">
        <div className="container">
          <div className={styles.trustContent}>
            <h2 className={styles.sectionTitle}>Your hustle deserves a record</h2>
            <div className={styles.trustPoints}>
              <div className={styles.trustPoint}>
                <div className={styles.trustCheck}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.trustPointTitle}>Works offline</h3>
                  <p className={styles.trustPointDescription}>Record sales and expenses even without internet. Everything syncs automatically when you reconnect.</p>
                </div>
              </div>
              <div className={styles.trustPoint}>
                <div className={styles.trustCheck}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.trustPointTitle}>Your data is yours</h3>
                  <p className={styles.trustPointDescription}>Your financial records are private. Only you decide what to share and with whom.</p>
                </div>
              </div>
              <div className={styles.trustPoint}>
                <div className={styles.trustCheck}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.trustPointTitle}>No bank needed</h3>
                  <p className={styles.trustPointDescription}>Sign up with just your phone number. No bank account, no BVN, no paperwork required to start.</p>
                </div>
              </div>
              <div className={styles.trustPoint}>
                <div className={styles.trustCheck}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.trustPointTitle}>Completely free</h3>
                  <p className={styles.trustPointDescription}>No subscription fees, no hidden charges. Trustline is free to use for tracking income and building your record.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to start building your credit?</h2>
          <p className={styles.ctaDescription}>Join thousands of traders and service providers already using Trustline</p>
          <Link href="/login" className="btn btn-primary btn-large" id="bottom-cta-button">
            Get started — it&apos;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon} aria-hidden="true">
                <rect width="40" height="40" rx="10" fill="#0D7C66" />
                <path d="M12 28L16 14L20 22L24 16L28 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="28" cy="24" r="2" fill="#D4A24E" />
              </svg>
              <span className={styles.logoText}>Trustline</span>
            </div>
            <p className={styles.footerTagline}>Building financial trust for Africa&apos;s informal economy.</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/contact">Contact</a>
          </div>
          <p className={styles.footerCopyright}>&copy; {new Date().getFullYear()} Trustline. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
