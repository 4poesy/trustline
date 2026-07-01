import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'List Your Loan Products on Trustline365 | Reach Pre-Qualified Borrowers in Africa',
  description: 'Trustline365 connects licensed lenders with pre-qualified borrowers who have verified financial behavior. List your loan products and access traders, vendors, and service providers across Nigeria.',
  keywords: 'list loan products Nigeria fintech, reach informal economy borrowers, microfinance borrower leads Africa, loan marketplace Nigeria',
}

export default function LendersLandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandName}>Trustline365</span>
            <span className={styles.forLenders}>for Lenders</span>
          </Link>
          <Link href="/lenders/register" className={styles.headerCta}>Register</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.tagline}>Loan Marketplace</span>
          <h1 className={styles.title}>Reach pre-qualified borrowers with <em>verified</em> financial behavior</h1>
          <p className={styles.description}>
            Trustline365 gives licensed lenders access to Africa's informal economy — traders, vendors, and service providers 
            with real income data, savings discipline scores, and community reputation. Not self-reported forms. 
            Verified behavior.
          </p>
          <Link href="/lenders/register" className={styles.ctaBtn}>Register Your Organization</Link>
        </div>
      </section>

      <section className={styles.valueSection}>
        <h2 className={styles.sectionTitle}>What You Get Access To</h2>
        <div className={styles.valueGrid}>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon}>📊</div>
            <h3>Income Consistency</h3>
            <p>See verified cashflow data — daily sales logged over months, not a single bank statement snapshot.</p>
          </div>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon}>💰</div>
            <h3>Savings Discipline</h3>
            <p>Know if borrowers contribute to savings groups on time. Consistent savers make reliable repayers.</p>
          </div>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon}>⭐</div>
            <h3>Community Reputation</h3>
            <p>Real reviews from customers and peers. Social proof that goes beyond a credit bureau score.</p>
          </div>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon}>🛡️</div>
            <h3>KYC Verification</h3>
            <p>Tiered identity verification (BVN, NIN, document upload). Know exactly who you're lending to.</p>
          </div>
        </div>
      </section>

      <section className={styles.pricingSection}>
        <h2 className={styles.sectionTitle}>Transparent Pricing</h2>
        <div className={styles.pricingCard}>
          <div className={styles.pricingRow}>
            <div>
              <h3>Origination Fee</h3>
              <p>Charged per successful disbursement — you only pay when a loan is matched and funded.</p>
            </div>
            <span className={styles.pricingValue}>2.5%</span>
          </div>
          <div className={styles.pricingRow}>
            <div>
              <h3>Listing Fee</h3>
              <p>Currently free for early partners. List your products at no monthly cost.</p>
            </div>
            <span className={styles.pricingValue}>₦0</span>
          </div>
          <div className={styles.pricingRow}>
            <div>
              <h3>Featured Placement</h3>
              <p>Premium positioning for high-visibility on the loan discovery page.</p>
            </div>
            <span className={styles.pricingValue}>Coming Soon</span>
          </div>
        </div>
      </section>

      <section className={styles.howSection}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}><span className={styles.stepNum}>1</span><h3>Register</h3><p>Submit your organization details and CAC/CBN credentials for review.</p></div>
          <div className={styles.stepCard}><span className={styles.stepNum}>2</span><h3>Get Approved</h3><p>Our team verifies your credentials within 2-3 business days.</p></div>
          <div className={styles.stepCard}><span className={styles.stepNum}>3</span><h3>List Products</h3><p>Create loan products with your terms, rates, and eligibility criteria.</p></div>
          <div className={styles.stepCard}><span className={styles.stepNum}>4</span><h3>Receive Applications</h3><p>Pre-qualified borrowers discover your products and apply directly.</p></div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2>Ready to reach Africa's next generation of borrowers?</h2>
        <Link href="/lenders/register" className={styles.ctaBtn}>Register Your Organization</Link>
      </section>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Trustline365. All rights reserved.</p>
      </footer>
    </div>
  )
}
