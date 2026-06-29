import Link from 'next/link'
import type { Metadata } from 'next'
import { LandingNav } from '@/modules/landing/components/LandingNav'
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
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <LandingNav />

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>FOR TRADERS · VENDORS · SERVICE PROVIDERS</span>
            <h1 className={styles.heroTitle}>
              Build your credit history.<br />
              <span className={styles.heroHighlight}>No bank account needed.</span>
            </h1>
            <p className={styles.heroDescription}>
              Track your daily income, get reviews from customers, and save together with your community. Trustline turns your everyday hustle into a provable financial record.
            </p>
            <div className={styles.heroCtaWrapper}>
              <Link href="/login" className={styles.heroCta} id="hero-get-started-button">
                Start building your record →
              </Link>
              <div className={styles.trustSignals}>
                <span>✓ Free to use</span>
                <span className={styles.divider}>·</span>
                <span>✓ No bank required</span>
                <span className={styles.divider}>·</span>
                <span>✓ Works offline</span>
              </div>
            </div>
          </div>

          {/* Signature CSS Trustline Card Mockup */}
          <div className={styles.heroCardWrapper}>
            <div className={styles.trustlineCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardLogo}>
                  <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                    <rect width="30" height="30" rx="7" fill="#E8A020" />
                    <path d="M9 21L12 10.5L15 16.5L18 12L21 18" stroke="#1A3D2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Trustline ID</span>
                </div>
                <span className={styles.cardWatermark}>VERIFIED</span>
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
                  <span className={styles.label}>DAILY AVERAGE INCOME</span>
                  <span className={styles.earningsValue}>₦12,450</span>
                </div>

                <div className={styles.scoreSection}>
                  <div className={styles.scoreRow}>
                    <span className={styles.label}>TRUST SCORE</span>
                    <span className={styles.scoreBadge}>Good</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div className={styles.barFill} style={{ width: '88%' }} />
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span>MEMBER SINCE 2026</span>
                <span>ID: TL-992-04</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* "Who It's For" Section */}
      <section className={styles.whoSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Built for people who work hard every day</h2>
          <p className={styles.sectionSubtitle}>Whether you sell goods, offer services, or save with a group — Trustline is for you</p>

          <div className={styles.cardGrid}>
            <div className={styles.whiteCard}>
              <div className={styles.iconCircle}>🛍️</div>
              <h3 className={styles.cardHeading}>Traders &amp; Vendors</h3>
              <p className={styles.cardText}>
                Market sellers, shop owners, and anyone who buys and sells. Log every sale, track what you spend on supplies, and see your real profit.
              </p>
            </div>

            <div className={styles.whiteCard}>
              <div className={styles.iconCircle}>🛠️</div>
              <h3 className={styles.cardHeading}>Service Providers</h3>
              <p className={styles.cardText}>
                Tailors, mechanics, hairdressers, electricians — anyone who earns by doing work. Build a public profile your customers can review.
              </p>
            </div>

            <div className={styles.whiteCard}>
              <div className={styles.iconCircle}>🤝</div>
              <h3 className={styles.cardHeading}>Savings Groups (Ajo/Esusu)</h3>
              <p className={styles.cardText}>
                Ajo, esusu, and contribution groups. Manage rotating savings digitally — track who has paid, whose turn it is, and build group trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section className={styles.howSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>How Trustline works</h2>
          <p className={styles.sectionSubtitle}>Three simple steps to start building your financial reputation</p>

          <div className={styles.stepsLayout}>
            <div className={styles.stepItem}>
              <div className={styles.stepBadge}>1</div>
              <h3 className={styles.stepHeading}>Log your income</h3>
              <p className={styles.stepText}>
                Record your daily sales and expenses in seconds. Works even without internet — your data syncs when you&apos;re back online.
              </p>
            </div>

            <div className={styles.stepItem}>
              <div className={styles.stepBadge}>2</div>
              <h3 className={styles.stepHeading}>Build your reputation</h3>
              <p className={styles.stepText}>
                Get reviews from your customers. Your public profile lets new customers find you and see that you&apos;re trustworthy.
              </p>
            </div>

            <div className={styles.stepItem}>
              <div className={styles.stepBadge}>3</div>
              <h3 className={styles.stepHeading}>Access credit &amp; savings</h3>
              <p className={styles.stepText}>
                Your consistent income records build a credit score. Join savings groups (ajo/esusu) to save and grow together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.featuresTitle}>Built for how you actually work</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🔌</span>
              <h3 className={styles.featureHeading}>Works offline</h3>
              <p className={styles.featureText}>
                Record sales and expenses even without internet. Everything syncs automatically when you reconnect.
              </p>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>⭐</span>
              <h3 className={styles.featureHeading}>Customer reviews</h3>
              <p className={styles.featureText}>
                Collect reviews from verified customers to build credibility and let people see how reliable you are.
              </p>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>👥</span>
              <h3 className={styles.featureHeading}>Savings groups</h3>
              <p className={styles.featureText}>
                Save money in rotating esusu circles with trusted partners. Digital ledgers keep everyone accountable.
              </p>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🆓</span>
              <h3 className={styles.featureHeading}>Completely free</h3>
              <p className={styles.featureText}>
                No subscription fees, no onboarding costs, no hidden rates. Build your record without paying anything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={styles.finalCtaSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.finalCtaHeading}>Your work is your proof.</h2>
          <p className={styles.finalCtaSub}>Start building your financial record today.</p>
          <Link href="/login" className={styles.finalCtaButton} id="bottom-cta-button">
            Get started — it&apos;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon}>
                <rect width="40" height="40" rx="10" fill="#E8A020" />
                <path d="M12 28L16 14L20 22L24 16L28 24" stroke="#1A3D2B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="28" cy="24" r="2.5" fill="#F7F3EC" />
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
          <p className={styles.footerCopyright}>&copy; 2026 Trustline. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
