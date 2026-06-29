'use client'

import styles from './RoleCard.module.css'

interface Props {
  role: 'trader' | 'service_provider' | 'group_member'
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
}

export function RoleCard({ role, title, description, icon, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      aria-label={title}
      id={`role-${role}`}
    >
      <div className={styles.iconWrapper}>{icon}</div>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <span className={styles.description}>{description}</span>
      </div>
      <div className={`${styles.radio} ${selected ? styles.radioSelected : ''}`}>
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  )
}
