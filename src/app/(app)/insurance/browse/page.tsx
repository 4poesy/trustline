'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { ArrowLeft, Shield, Heart, Smartphone, Package, ChevronRight } from 'lucide-react'
import styles from './page.module.css'

const PLANS = [
  {
    id: 'inventory',
    icon: 'package',
    name: 'Inventory Protection',
    type: 'inventory',
    description: 'Covers loss or damage to your stock from fire, theft, or flooding. Ideal for market traders and shop owners.',
    premiumRange: '₦500 – ₦2,500/month',
    coverageRange: '₦50,000 – ₦500,000',
    features: ['Fire & theft coverage', 'Flood damage protection', 'Quick 48-hour claims processing'],
  },
  {
    id: 'health',
    icon: 'heart',
    name: 'Basic Health Cover',
    type: 'health',
    description: 'Affordable outpatient and emergency health coverage for traders and their immediate family.',
    premiumRange: '₦1,000 – ₦5,000/month',
    coverageRange: 'Up to ₦200,000/year',
    features: ['Outpatient visits', 'Emergency care', 'Prescription drugs coverage'],
  },
  {
    id: 'device',
    icon: 'smartphone',
    name: 'Device Insurance',
    type: 'device',
    description: 'Protects your smartphone or POS terminal against accidental damage, theft, or screen cracks.',
    premiumRange: '₦300 – ₦1,500/month',
    coverageRange: 'Up to ₦150,000',
    features: ['Accidental damage', 'Theft replacement', 'Screen crack repairs'],
  },
]

const IconMap: Record<string, React.ReactNode> = {
  package: <Package size={28} />,
  heart: <Heart size={28} />,
  smartphone: <Smartphone size={28} />,
}

export default function BrowseInsurancePage() {
  const { profile } = useAuth()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/insurance" className={styles.backButton} aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Browse Plans</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <Shield size={32} className={styles.introIcon} />
          <h2>Micro-Insurance for Informal Workers</h2>
          <p>Affordable, no-paperwork coverage designed for traders, vendors, and service providers across Africa.</p>
        </section>

        <section className={styles.plansList}>
          {PLANS.map((plan) => {
            const isExpanded = expandedId === plan.id
            return (
              <div key={plan.id} className={`card ${styles.planCard}`}>
                <button
                  className={styles.planHeader}
                  onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                  aria-expanded={isExpanded}
                >
                  <div className={styles.planIconWrap}>
                    {IconMap[plan.icon]}
                  </div>
                  <div className={styles.planInfo}>
                    <h3>{plan.name}</h3>
                    <span className={styles.premiumLabel}>{plan.premiumRange}</span>
                  </div>
                  <ChevronRight size={20} className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} />
                </button>

                {isExpanded && (
                  <div className={styles.planBody}>
                    <p className={styles.planDesc}>{plan.description}</p>

                    <div className={styles.coverageLabel}>
                      <strong>Coverage:</strong> {plan.coverageRange}
                    </div>

                    <ul className={styles.featuresList}>
                      {plan.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>

                    <Link
                      href={`/insurance/enroll?plan=${plan.id}&type=${plan.type}&name=${encodeURIComponent(plan.name)}`}
                      className="btn btn-primary"
                      style={{ marginTop: '16px', textAlign: 'center' }}
                    >
                      Enroll in {plan.name}
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </main>
    </div>
  )
}
