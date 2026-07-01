'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Check, Share2, Printer, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import styles from './page.module.css'

export default function InvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single()

        if (data) setInvoice(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [invoiceId])

  const handleMarkPaid = async () => {
    if (!invoiceId || updating) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          marked_paid_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) throw error

      setInvoice({ ...invoice, status: 'paid', marked_paid_at: new Date().toISOString() })
      setToastMsg('Invoice status updated to Paid!')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to update invoice status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleShareWhatsApp = () => {
    if (!invoice) return
    const publicUrl = `https://trustline365.vercel.app/invoices/${invoice.id}/public`
    const text = encodeURIComponent(`Please find your invoice ${invoice.invoice_number} from Trustline. View link: ${publicUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

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
        <p>Loading invoice details...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} style={{ color: 'var(--color-error)' }} />
        <h2>Invoice Not Found</h2>
        <Link href="/invoices" className="btn btn-secondary" style={{ marginTop: '12px' }}>
          Back to Invoices
        </Link>
      </div>
    )
  }

  const lineItems = invoice.line_items || []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/invoices" className={styles.backButton} aria-label="Back to list">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>{invoice.invoice_number}</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {toastMsg && (
          <div className={styles.toast}>
            <CheckCircle size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Invoice Card */}
        <section className={`card ${styles.invoicePaper}`}>
          <div className={styles.billHeader}>
            <div className={styles.branding}>
              <img src="/icons/icon-192x192.png" alt="Trustline Logo" className={styles.logo} />
              <h2>TRUSTLINE</h2>
            </div>
            <span className={`${styles.statusBadge} ${
              invoice.status === 'paid' ? styles.statusPaid : invoice.status === 'sent' ? styles.statusSent : styles.statusDraft
            }`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>

          <div className={styles.metaGrid}>
            <div>
              <h5>BILL TO</h5>
              <h4>{invoice.recipient_name}</h4>
              {invoice.recipient_phone && <p>{invoice.recipient_phone}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <h5>INVOICE DATE</h5>
              <p>{formatDate(invoice.created_at)}</p>
              
              <h5 style={{ marginTop: '12px' }}>DUE DATE</h5>
              <p>{invoice.due_date ? formatDate(invoice.due_date) : 'On Receipt'}</p>
            </div>
          </div>

          {/* Line items Table */}
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.colDesc}>Item</span>
              <span className={styles.colQty}>Qty</span>
              <span className={styles.colPrice}>Price</span>
              <span className={styles.colTotal}>Total</span>
            </div>

            <div className={styles.tableBody}>
              {lineItems.map((item: any, i: number) => (
                <div key={i} className={styles.tableRow}>
                  <span className={styles.colDesc}>{item.description}</span>
                  <span className={styles.colQty}>{item.quantity}</span>
                  <span className={styles.colPrice}>{invoice.currency} {Number(item.unit_price || 0).toLocaleString()}</span>
                  <span className={styles.colTotal}>{invoice.currency} {Number(item.total || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className={styles.tableFooter}>
              <span>Amount Due</span>
              <span>{invoice.currency} {Number(invoice.subtotal || 0).toLocaleString()}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className={styles.notesSection}>
              <h5>PAYMENT INSTRUCTIONS</h5>
              <p>{invoice.notes}</p>
            </div>
          )}
        </section>

        {/* Action Panel */}
        <section className={styles.actionSection}>
          {invoice.status !== 'paid' && (
            <button onClick={handleMarkPaid} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={updating}>
              <Check size={18} />
              Mark as Paid
            </button>
          )}

          <button onClick={handleShareWhatsApp} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Share2 size={16} />
            Share Invoice URL
          </button>

          <Link href={`/invoices/${invoice.id}/public`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Printer size={16} />
            Open Printable Layout
          </Link>
        </section>
      </main>
    </div>
  )
}
