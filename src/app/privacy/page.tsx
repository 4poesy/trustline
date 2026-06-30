import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from '../terms/static-pages.module.css'

export const metadata = {
  title: 'Privacy Policy | Trustline',
  description: 'Read how Trustline secures and manages your business records.',
}

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className={styles.logo}>
            <div className={styles.logoMark}>T</div>
            <span className={styles.logoText}>Trustline</span>
          </div>
        </div>
      </header>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: June 30, 2026</p>
        
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Information We Collect</h2>
            <p>
              We collect your phone number for secure authentication. Additionally, we store transaction details (sales and expenses), business profile information (location, type of trade), and customer reviews you receive.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Offline Storage & Synchronization</h2>
            <p>
              Trustline utilizes browser IndexedDB to save your records locally when offline. When connection is established, this data is securely synced to our databases.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Third-Party Sharing</h2>
            <p>
              We do not sell or rent your personal business records. Your public profile is discoverable in the public directory to help clients find you. Trust metrics are shared with financial institutions only upon your explicit request.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Your Rights</h2>
            <p>
              You have the right to request deletion of your account and records at any time. To request data deletion, contact us using the details on our contact page.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
