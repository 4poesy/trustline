'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { AlertCircle, Printer, Calendar } from 'lucide-react'
import styles from './page.module.css'

export default function PublicInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<any>(null)
  const [merchant, setMerchant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) return
      try {
        // Fetch invoice
        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single()

        if (invErr || !inv) throw new Error('Invoice not found.')
        setInvoice(inv)

        // Fetch merchant profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('name, business_type, location, phone_number')
          .eq('id', inv.profile_id)
          .single()

        if (prof) setMerchant(prof)
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load invoice.')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoiceDetails()
  }, [invoiceId])

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

  if (errorMsg || !invoice) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} className={styles.errIcon} />
        <h2>Invoice Error</h2>
        <p>{errorMsg || 'Failed to find invoice details.'}</p>
      </div>
    )
  }

  const lineItems = invoice.line_items || []

  return (
    <div className={styles.container}>
      <div className={styles.noPrintActions}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Go Back
        </button>
        <button onClick={() => window.print()} className={styles.printBtn}>
          Print / PDF
        </button>
      </div>

      <div className={styles.invoicePaper}>
        {/* Header */}
        <div className={styles.billHeader}>
          <div className={styles.branding}>
            <img src="/icons/icon-192x192.png" alt="Trustline Logo" className={styles.logo} />
            <h2>TRUSTLINE INVOICE</h2>
          </div>
          <span className={`${styles.statusBadge} ${
            invoice.status === 'paid' ? styles.statusPaid : invoice.status === 'sent' ? styles.statusSent : styles.statusDraft
          }`}>
            {invoice.status.toUpperCase()}
          </span>
        </div>

        {/* Addresses */}
        <div className={styles.addressSection}>
          <div>
            <h5>FROM (MERCHANT)</h5>
            <h3>{merchant?.name || 'Trustline Merchant'}</h3>
            <p>{merchant?.business_type} · {merchant?.location}</p>
            <p>Phone: {merchant?.phone_number}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h5>BILL TO</h5>
            <h3>{invoice.recipient_name}</h3>
            {invoice.recipient_phone && <p>Phone: {invoice.recipient_phone}</p>}
          </div>
        </div>

        {/* Dates */}
        <div className={styles.datesGrid}>
          <div className={styles.dateBlock}>
            <h5>INVOICE NUMBER</h5>
            <p>{invoice.invoice_number}</p>
          </div>
          <div className={styles.dateBlock}>
            <h5>DATE OF ISSUE</h5>
            <p>{formatDate(invoice.created_at)}</p>
          </div>
          <div className={styles.dateBlock} style={{ textAlign: 'right' }}>
            <h5>DUE DATE</h5>
            <p>{invoice.due_date ? formatDate(invoice.due_date) : 'On Receipt'}</p>
          </div>
        </div>

        {/* Table */}
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colDesc}>Description</span>
            <span className={styles.colQty}>Qty</span>
            <span className={styles.colPrice}>Unit Price</span>
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
            <h5>PAYMENT TERMS & INSTRUCTIONS</h5>
            <p>{invoice.notes}</p>
          </div>
        )}

        <div className={styles.paperFooter}>
          <p>Generated by Trustline. Verified Informal Economy Financial Platform.</p>
        </div>
      </div>
    </div>
  )
}
