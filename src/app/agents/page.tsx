'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Sparkles, TrendingUp, Users, ArrowRight } from 'lucide-react'
import styles from './page.module.css'

export default function AgentsLandingPage() {
  return (
    <div className={styles.page}>
      {/* Navigation header */}
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <img src="/icons/icon-192x192.png" alt="Trustline Logo" className={styles.logo} />
            <span className={styles.brandName}>Trustline</span>
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.tagline}>TRUSTLINE AGENT PROGRAM</span>
          <h1 className={styles.title}>Earn Consistent Income as a Trustline Agent</h1>
          <p className={styles.description}>
            Help traders, merchants, and service providers in your community digitize their cashflow, verify their identity, and access credit. Earn commission for every active user you register.
          </p>
          <div className={styles.heroActions}>
            <Link href="/agents/apply" className="btn btn-primary btn-large">
              Apply as Agent <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className={styles.benefits}>
        <h2 className={styles.sectionTitle}>Why Become an Agent?</h2>
        
        <div className={styles.grid}>
          <div className={`card ${styles.benefitCard}`}>
            <TrendingUp className={styles.benefitIcon} size={32} />
            <h3>High Earning Potential</h3>
            <p>Earn up to ₦500 per user referred as they unlock higher verification levels, plus additional volume-based bonuses.</p>
          </div>

          <div className={`card ${styles.benefitCard}`}>
            <Users className={styles.benefitIcon} size={32} />
            <h3>Empower Your Market</h3>
            <p>Give local vendors the tools to build their credit scores, track sales, and access business growth loans.</p>
          </div>

          <div className={`card ${styles.benefitCard}`}>
            <Shield className={styles.benefitIcon} size={32} />
            <h3>Partner with a Trusted Brand</h3>
            <p>Work directly with Africa's leading informal economy financial infrastructure platform.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.stepsSection}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h4>Apply Online</h4>
            <p>Sign up, submit your application form, and review the terms.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h4>Get Agent Code</h4>
            <p>Receive your unique referral code and promotional materials.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h4>Onboard & Earn</h4>
            <p>Register merchants, guide them through KYC checks, and receive direct commission in your wallet.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 Trustline Technologies. Empowering informal markets across Africa.</p>
      </footer>
    </div>
  )
}
