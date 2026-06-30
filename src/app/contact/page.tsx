import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import styles from '../terms/static-pages.module.css'

export const metadata = {
  title: 'Contact Us | Trustline',
  description: 'Get in touch with the Trustline support team.',
}

export default function ContactPage() {
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
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.updated}>We are here to support your business hustle</p>
        
        <div className={styles.content}>
          <section className={styles.section}>
            <p className={styles.intro}>
              Have questions about your Trust Score, offline synchronization, or setting up a savings group? Reach out to our support team.
            </p>
          </section>

          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Mail size={20} />
              </div>
              <div>
                <h3>Email Support</h3>
                <p>support@trustline.africa</p>
              </div>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Phone size={20} />
              </div>
              <div>
                <h3>Phone &amp; WhatsApp</h3>
                <p>+234 (0) 906 813 3874</p>
              </div>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <MapPin size={20} />
              </div>
              <div>
                <h3>Office</h3>
                <p>Lagos, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
