import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from './static-pages.module.css'

export const metadata = {
  title: 'Terms of Service | Trustline',
  description: 'Read the terms and conditions for using Trustline.',
}

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className={styles.logo}>
            <img src="/icons/icon-192x192.png" alt="Trustline Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>Trustline</span>
          </div>
        </div>
      </header>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: June 30, 2026</p>
        
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Terms of Use</h2>
            <p>
              By accessing and using Trustline, you agree to comply with and be bound by these terms. If you do not agree, please do not use the application.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Financial Disclaimer</h2>
            <p>
              Trustline is a bookkeeping, financial record, and reputation logging tool. Trustline is not a bank, micro-finance institution, or licensed lender. We do not provide credit directly, nor do we guarantee approval for third-party financing.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. User Account Security</h2>
            <p>
              You are responsible for keeping your phone number and verification OTP details secure. Any activity logged under your verified account is your sole responsibility.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Data Ownership & Accuracy</h2>
            <p>
              You retain ownership of the transaction records you enter. You agree to log honest financial records. Falsifying sales or reviews will result in permanent suspension of your Trust Profile.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
