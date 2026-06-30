'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Info,
  History as HistoryIcon
} from 'lucide-react'
import styles from './page.module.css'

type BillTypeFilter = 'all' | 'airtime' | 'data' | 'electricity' | 'tv_subscription'

export default function BillHistoryPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { payments, loading: dbLoading, refresh } = useBillPayments(profile?.id)

  // Filters
  const [typeFilter, setTypeFilter] = useState<BillTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)

  // Filtered Payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // 1. Filter by category type
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false
      }
      // 2. Filter by search query (biller name or recipient number)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const providerMatch = item.network_or_provider.toLowerCase().includes(query)
        const recipientMatch = item.recipient_number.includes(query)
        const refMatch = item.provider_reference?.toLowerCase().includes(query) || false
        return providerMatch || recipientMatch || refMatch
      }
      return true
    })
  }, [payments, typeFilter, searchQuery])

  if (authLoading || dbLoading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading transaction history...</p>
      </div>
    )
  }

  if (!profile) {
    router.replace('/login')
    return null
  }

  // Utility to render status badges
  const renderStatusBadge = (status: 'pending' | 'successful' | 'failed') => {
    switch (status) {
      case 'successful':
        return (
          <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
            <CheckCircle size={10} className={styles.badgeIcon} />
            Success
          </span>
        )
      case 'pending':
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
            <Clock size={10} className={styles.badgeIcon} />
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className={`${styles.statusBadge} ${styles.statusFailed}`}>
            <XCircle size={10} className={styles.badgeIcon} />
            Failed
          </span>
        )
    }
  }

  // Get service icon
  const getBillIcon = (type: string) => {
    switch (type) {
      case 'airtime':
        return <Smartphone size={18} />
      case 'data':
        return <Wifi size={18} />
      case 'electricity':
        return <Zap size={18} />
      case 'tv_subscription':
        return <Tv size={18} />
      default:
        return <Smartphone size={18} />
    }
  }

  // Format Date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button 
            className={styles.backButton} 
            onClick={() => router.replace('/pay')} 
            aria-label="Back to payment hub"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.title}>Payment History</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className={styles.main}>
        {/* ===== FILTERS PANEL ===== */}
        <section className={styles.filtersSection}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search by phone number, provider, or reference..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${typeFilter === 'all' ? styles.filterTabActive : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterTab} ${typeFilter === 'airtime' ? styles.filterTabActive : ''}`}
              onClick={() => setTypeFilter('airtime')}
            >
              Airtime
            </button>
            <button
              className={`${styles.filterTab} ${typeFilter === 'data' ? styles.filterTabActive : ''}`}
              onClick={() => setTypeFilter('data')}
            >
              Data
            </button>
            <button
              className={`${styles.filterTab} ${typeFilter === 'electricity' ? styles.filterTabActive : ''}`}
              onClick={() => setTypeFilter('electricity')}
            >
              Power
            </button>
            <button
              className={`${styles.filterTab} ${typeFilter === 'tv_subscription' ? styles.filterTabActive : ''}`}
              onClick={() => setTypeFilter('tv_subscription')}
            >
              TV
            </button>
          </div>
        </section>

        {/* ===== LIST PANEL ===== */}
        <section className={styles.listSection}>
          {filteredPayments.length === 0 ? (
            <div className={styles.emptyCard}>
              <HistoryIcon size={40} className={styles.emptyIcon} />
              <h3>No purchases found</h3>
              <p>Try refining your search query or choosing another tab filter.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {filteredPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className={styles.historyItem}
                  onClick={() => setSelectedPayment(payment)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedPayment(payment)
                    }
                  }}
                  title="Click to view details"
                >
                  <div className={styles.itemLeft}>
                    <div className={styles.iconCircle}>
                      {getBillIcon(payment.type)}
                    </div>
                    <div className={styles.meta}>
                      <span className={styles.itemName}>
                        {payment.network_or_provider} ({payment.type === 'tv_subscription' ? 'Cable TV' : payment.type})
                      </span>
                      <span className={styles.itemRecipient}>{payment.recipient_number}</span>
                      <span className={styles.itemDate}>{formatDate(payment.created_at)}</span>
                    </div>
                  </div>

                  <div className={styles.itemRight}>
                    <span className={styles.itemAmount}>
                      ₦{payment.amount.toLocaleString('en-NG')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusBadge(payment.status)}
                      <Info size={14} className={styles.infoIndicator} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ===== TRANSACTION DETAILS MODAL OVERLAY ===== */}
      {selectedPayment && (
        <div className={styles.overlay} onClick={() => setSelectedPayment(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Transaction Details</h3>
            
            <div className={styles.modalHeaderGrid}>
              <span className={styles.modalHeaderAmount}>
                ₦{selectedPayment.amount.toLocaleString('en-NG')}
              </span>
              {renderStatusBadge(selectedPayment.status)}
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Product Type</span>
                <span className={styles.modalVal}>{selectedPayment.type.toUpperCase().replace('_', ' ')}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Biller/Operator</span>
                <span className={styles.modalVal}>{selectedPayment.network_or_provider}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Recipient ID</span>
                <span className={styles.modalVal} style={{ fontFamily: 'monospace' }}>
                  {selectedPayment.recipient_number}
                </span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Created Date</span>
                <span className={styles.modalVal}>{formatDate(selectedPayment.created_at)}</span>
              </div>
              {selectedPayment.completed_at && (
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Completed Date</span>
                  <span className={styles.modalVal}>{formatDate(selectedPayment.completed_at)}</span>
                </div>
              )}
              <div className={styles.modalRow} style={{ borderTop: '1px solid var(--color-neutral-200)', paddingTop: '12px', marginTop: '4px' }}>
                <span className={styles.modalLabel}>Provider Reference</span>
                <span className={`${styles.modalVal} ${styles.modalRef}`}>
                  {selectedPayment.provider_reference || 'N/A'}
                </span>
              </div>
            </div>

            <button 
              className={styles.closeBtn}
              onClick={() => setSelectedPayment(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
