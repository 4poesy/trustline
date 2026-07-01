'use client'

import React from 'react'
import Link from 'next/link'
import { Terminal, Shield, Key, HelpCircle, ArrowRight } from 'lucide-react'
import styles from './page.module.css'

export default function DeveloperPlatformLandingPage() {
  return (
    <div className={styles.page}>
      {/* Navigation header */}
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <img src="/icons/icon-192x192.png" alt="Trustline Logo" className={styles.logo} />
            <span className={styles.brandName}>Trustline Developer</span>
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.tagline}>OPEN API & GATEWAY</span>
          <h1 className={styles.title}>The Credit API for Africa's Informal Economy</h1>
          <p className={styles.description}>
            Integrate Trustline's consent-gated credit scores, cashflow summaries, and verified directory reviews directly into your microfinance, cooperative, or lending software.
          </p>
          <div className={styles.heroActions}>
            <Link href="/developers/dashboard" className="btn btn-primary btn-large">
              Go to Dev Dashboard <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Documentation Stub */}
      <section className={styles.docsSection}>
        <h2 className={styles.sectionTitle}>API Reference Documentation</h2>

        <div className={styles.endpointCard}>
          <div className={styles.endpointHeader}>
            <span className={styles.methodGet}>GET</span>
            <code className={styles.endpointPath}>/api/v1/trust-score?profile_id=&#123;id&#125;</code>
          </div>
          <p className={styles.endpointDesc}>Returns the 3-component Trust Score (Income Consistency, Savings Discipline, and Reputation score).</p>
          
          <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Example Request</h4>
          <pre className={styles.codeSnippet}>
{`curl -X GET "https://trustline365.vercel.app/api-gateway/v1/trust-score?profile_id=usr_09283" \\
  -H "Authorization: Bearer tl_live_abc123"`}
          </pre>

          <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Example Response</h4>
          <pre className={styles.codeSnippet}>
{`{
  "success": true,
  "trust_metrics": {
    "income_consistency_score": 85,
    "savings_discipline_score": 92,
    "reputation_score": 4.8
  }
}`}
          </pre>
        </div>

        <div className={styles.endpointCard} style={{ marginTop: '24px' }}>
          <div className={styles.endpointHeader}>
            <span className={styles.methodGet}>GET</span>
            <code className={styles.endpointPath}>/api/v1/income-summary?profile_id=&#123;id&#125;</code>
          </div>
          <p className={styles.endpointDesc}>Retrieves monthly aggregated income volumes for the last 6 months (anonymised/consented).</p>
        </div>

        <div className={styles.endpointCard} style={{ marginTop: '24px' }}>
          <div className={styles.endpointHeader}>
            <span className={styles.methodGet}>GET</span>
            <code className={styles.endpointPath}>/api/v1/reviews?profile_id=&#123;id&#125;</code>
          </div>
          <p className={styles.endpointDesc}>Retrieves customer reviews, average star rating, and testimonials.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 Trustline Developer Platform. Consent-gated Credit Infrastructure.</p>
      </footer>
    </div>
  )
}
