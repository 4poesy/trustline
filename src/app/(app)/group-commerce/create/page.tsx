'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

export default function CreateGroupBuyPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!profile?.id) return
      try {
        // Query savings groups user belongs to
        // Note: For now we fetch all savings groups in the system to select from
        const { data } = await supabase
          .from('savings_groups')
          .select('id, name')

        if (data) {
          setGroups(data)
          if (data.length > 0) setSelectedGroupId(data[0].id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUserGroups()
  }, [profile?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !targetAmount || !selectedGroupId || submitting) return

    const amt = parseFloat(targetAmount)
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please specify a valid target amount.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('group_purchases')
        .insert({
          savings_group_id: selectedGroupId,
          title: title.trim(),
          description: description.trim() || null,
          target_amount: amt,
          amount_contributed: 0,
          supplier_name: supplierName.trim() || null,
          status: 'open',
          deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // default 7 days
          created_by_profile_id: profile?.id
        })

      if (error) throw error

      router.replace('/group-commerce')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create group buy.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading configurations...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/group-commerce" className={styles.backButton} aria-label="Back to listing">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Start Group Buy</h1>
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
          <div className="form-group">
            <label className="form-label">Select Savings Group</label>
            <select 
              className="form-input" 
              value={selectedGroupId} 
              onChange={(e) => setSelectedGroupId(e.target.value)}
              required
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Bulk Order Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 50 bags of rice from Bodija"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Description / Bulk Details</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', padding: '10px' }}
              placeholder="e.g. Splitting cost to get wholesale prices. Target is 50 bags."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Target Funding Amount ({profile?.currency || 'NGN'})</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 750000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Supplier Name (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alhaji Bodija Stores"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Funding Deadline</label>
            <input
              type="date"
              className="form-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '24px' }} disabled={submitting}>
            <Save size={18} style={{ marginRight: '8px' }} />
            {submitting ? 'Creating Order...' : 'Publish Bulk Order'}
          </button>
        </form>
      </main>
    </div>
  )
}
