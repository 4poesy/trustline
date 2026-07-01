'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { 
  ArrowLeft, 
  Search, 
  Smartphone,
  Wifi,
  Zap,
  Tv,
  CheckCircle,
  Clock,
  XCircle,
  Info,
  History as HistoryIcon,
  Send,
  Download,
  CreditCard
} from 'lucide-react'
import styles from './page.module.css'

type BillTypeFilter = 'all' | 'airtime' | 'data' | 'electricity' | 'tv_subscription'

export default function BillHistoryPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { payments, walletTransactions, loading: dbLoading } = useBillPayments(profile?.id)

  const [viewMode, setViewMode] = useState<'bills' | 'wallet'>('bills')
  const [typeFilter, setTypeFilter] = useState<BillTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
  const [selectedTx, setSelectedTx] = useState<any | null>(null)

  // Filtered Payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false
      }
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

  // Filtered Wallet Transactions
  const filteredWalletTransactions = useMemo(() => {
    return walletTransactions.filter((item) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const descMatch = item.description?.toLowerCase().includes(query) || false
        const typeMatch = item.type.toLowerCase().includes(query)
        const refMatch = item.reference.toLowerCase().includes(query)
        return descMatch || typeMatch || refMatch
      }
      return true
    })
  }, [walletTransactions, searchQuery])

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

  const getWalletTxIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <Send size={18} style={{ color: 'var(--color-error)' }} />
      case 'deposit':
        return <Download size={18} style={{ color: 'var(--color-primary-500)' }} />
      case 'bill_payment':
        return <CreditCard size={18} style={{ color: 'var(--color-secondary-500)' }} />
      default:
        return <Info size={18} />
    }
  }

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

      <main className={styles.main}>
        {/* Toggle Switch */}
        <section className={styles.toggleSection}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'bills' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('bills')}
          >
            Bill Payments
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'wallet' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('wallet')}
          >
            Wallet Transfers
          </button>
        </section>

        {/* Search */}
        <section className={styles.filtersSection}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search by phone, description, reference..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {viewMode === 'bills' && (
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
          )}
        </section>

        {/* List Panel */}
        <section className={styles.listSection}>
          {viewMode === 'bills' ? (
            filteredPayments.length === 0 ? (
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
                  >
                    <div className={styles.itemLeft}>
                      <div className={styles.iconCircle}>
                        {getBillIcon(payment.type)}
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.itemName}>
                          {payment.network_or_provider} ({payment.type.replace('_', ' ')})
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
            )
          ) : (
            filteredWalletTransactions.length === 0 ? (
              <div className={styles.emptyCard}>
                <HistoryIcon size={40} className={styles.emptyIcon} />
                <h3>No wallet transactions found</h3>
                <p>Funds transferred or deposited will appear here.</p>
              </div>
            ) : (
              <div className={styles.historyList}>
                {filteredWalletTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className={styles.historyItem}
                    onClick={() => setSelectedTx(tx)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.itemLeft}>
                      <div className={styles.iconCircle}>
                        {getWalletTxIcon(tx.type)}
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.itemName}>
                          {tx.description || 'Wallet Transaction'}
                        </span>
                        <span className={styles.itemRecipient}>{tx.type.toUpperCase()}</span>
                        <span className={styles.itemDate}>{formatDate(tx.created_at)}</span>
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      <span className={`${styles.itemAmount} ${tx.type === 'deposit' ? styles.incomeText : styles.expenseText}`}>
                        {tx.type === 'deposit' ? '+' : '-'} {tx.currency} {tx.amount.toLocaleString()}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderStatusBadge(tx.status)}
                        <Info size={14} className={styles.infoIndicator} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </section>
      </main>

      {/* Bill Details Modal */}
      {selectedPayment && (
        <div className={styles.overlay} onClick={() => setSelectedPayment(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Purchase Details</h3>
            <div className={styles.modalHeaderGrid}>
              <span className={styles.modalHeaderAmount}>
                ₦{selectedPayment.amount.toLocaleString('en-NG')}
              </span>
              {renderStatusBadge(selectedPayment.status)}
            </div>
            <div className={styles.modalGrid}>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Product Type</span>
                <span className={styles.modalVal}>{selectedPayment.type.toUpperCase()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Biller/Operator</span>
                <span className={styles.modalVal}>{selectedPayment.network_or_provider}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Recipient ID</span>
                <span className={styles.modalVal}>{selectedPayment.recipient_number}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Created Date</span>
                <span className={styles.modalVal}>{formatDate(selectedPayment.created_at)}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Reference</span>
                <span className={styles.modalVal}>{selectedPayment.provider_reference}</span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setSelectedPayment(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Wallet Details Modal */}
      {selectedTx && (
        <div className={styles.overlay} onClick={() => setSelectedTx(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Wallet Transaction Details</h3>
            <div className={styles.modalHeaderGrid}>
              <span className={styles.modalHeaderAmount}>
                {selectedTx.currency} {selectedTx.amount.toLocaleString()}
              </span>
              {renderStatusBadge(selectedTx.status)}
            </div>
            <div className={styles.modalGrid}>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Transaction Type</span>
                <span className={styles.modalVal}>{selectedTx.type.toUpperCase()}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Description</span>
                <span className={styles.modalVal}>{selectedTx.description}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Payment Method</span>
                <span className={styles.modalVal}>{selectedTx.payment_method}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Created Date</span>
                <span className={styles.modalVal}>{formatDate(selectedTx.created_at)}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>Reference</span>
                <span className={styles.modalVal}>{selectedTx.reference}</span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setSelectedTx(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
