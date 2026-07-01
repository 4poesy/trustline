'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Save, FileText, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

export default function CreateInvoicePage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState(profile?.currency || 'NGN')
  const [notes, setNotes] = useState('')
  
  // Line items state
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }])
  
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items]
    updated[index][field] = val
    
    // Auto calculate line total
    const qty = Number(updated[index].quantity || 0)
    const price = Number(updated[index].unit_price || 0)
    updated[index].total = qty * price
    
    setItems(updated)
  }

  // Calculate overall subtotal
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientName.trim() || submitting) return

    // Validate items
    const invalidItem = items.some(item => !item.description.trim() || item.quantity <= 0 || item.unit_price < 0)
    if (invalidItem) {
      setErrorMsg('Please specify descriptions, valid quantities, and prices for all items.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const year = new Date().getFullYear()
      // Generate unique invoice sequential number
      const seq = Math.floor(100 + Math.random() * 900)
      const invoiceNumber = `TL-${year}-${seq}`

      const { error } = await supabase
        .from('invoices')
        .insert({
          profile_id: profile?.id,
          invoice_number: invoiceNumber,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim() || null,
          line_items: items,
          subtotal,
          currency,
          notes: notes.trim() || null,
          due_date: dueDate || null,
          status: 'sent'
        })

      if (error) throw error

      router.replace('/invoices')
    } catch (err: any) {
      setErrorMsg(err.message || 'Invoice failed to save.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/invoices" className={styles.backButton} aria-label="Back to invoices">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Create Invoice</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`card ${styles.formCard}`}>
          <div className={styles.formSection}>
            <h3>Customer Details</h3>
            
            <div className="form-group">
              <label className="form-label">Recipient Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alaba Wholesale Store"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Recipient Phone (Optional)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +234..."
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formSection} style={{ marginTop: '20px' }}>
            <h3>Invoice Terms</h3>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Currency</label>
              <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="NGN">NGN (₦)</option>
                <option value="GHS">GHS (GH₵)</option>
                <option value="KES">KES (KSh)</option>
                <option value="TZS">TZS (TSh)</option>
                <option value="ZAR">ZAR (R)</option>
              </select>
            </div>
          </div>

          {/* Line items list */}
          <div className={styles.formSection} style={{ marginTop: '24px' }}>
            <div className={styles.itemHeadingRow}>
              <h3>Line Items</h3>
              <button type="button" onClick={handleAddItem} className={styles.addBtn}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className={styles.itemsList}>
              {items.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                  <div className={styles.colDesc}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className={styles.colQty}>
                    <input
                      type="number"
                      min={1}
                      className="form-input"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className={styles.colPrice}>
                    <input
                      type="number"
                      min={0}
                      className="form-input"
                      placeholder="Price"
                      value={item.unit_price || ''}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)} 
                    className={styles.deleteItemBtn}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div className={styles.totalRow}>
              <span>TOTAL DUE</span>
              <span>{currency} {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">Notes / Payment Instructions</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', padding: '10px' }}
              placeholder="e.g. Please transfer to Access Bank Account 0123456789"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '24px' }} disabled={submitting}>
            <Save size={18} style={{ marginRight: '8px' }} />
            {submitting ? 'Generating Invoice...' : 'Save & Issue Invoice'}
          </button>
        </form>
      </main>
    </div>
  )
}
