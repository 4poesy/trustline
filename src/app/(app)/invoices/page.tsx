'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, FileText, Send, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

export default function InvoicesListPage() {
  const { profile } = useAuth()

  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!profile?.id) return
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })

        if (data) {
          setInvoices(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [profile?.id])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading invoices...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Invoices</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Floating action button area */}
        <section className={styles.actionHeader}>
          <h2>Manage Invoices</h2>
          <Link href="/invoices/create" className="btn btn-primary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Plus size={16} /> Create Invoice
          </Link>
        </section>

        {/* Invoice list */}
        <section className={styles.listSection}>
          {invoices.length === 0 ? (
            <div className={styles.emptyCard}>
              <FileText size={40} className={styles.emptyIcon} />
              <h3>No invoices created yet</h3>
              <p>Create professional branded invoices for your customers in one tap.</p>
              <Link href="/invoices/create" className="btn btn-secondary" style={{ marginTop: '12px' }}>
                Create First Invoice
              </Link>
            </div>
          ) : (
            <div className={styles.invoicesList}>
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className={`card ${styles.invCard}`}>
                  <div className={styles.invLeft}>
                    <span className={styles.invNumber}>{inv.invoice_number}</span>
                    <h4>{inv.recipient_name}</h4>
                    <span className={styles.invDate}>
                      <Calendar size={12} style={{ marginRight: '4px' }} />
                      Due {formatDate(inv.due_date || inv.created_at)}
                    </span>
                  </div>

                  <div className={styles.invRight}>
                    <span className={styles.invAmount}>
                      {inv.currency} {Number(inv.subtotal || 0).toLocaleString()}
                    </span>
                    <span className={`${styles.statusBadge} ${
                      inv.status === 'paid' ? styles.statusPaid : inv.status === 'sent' ? styles.statusSent : styles.statusDraft
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
