'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/modules/auth/hooks/useAuth'

export interface CountryConfig {
  code: string
  name: string
  currency_code: string
  currency_symbol: string
  currency_name: string
  phone_country_code: string
  default_language: string
  date_format: string
  number_format: string
  is_active: boolean
  is_beta: boolean
  supported_id_types: string[]
  payment_providers: string[]
  pos_culture: boolean
  timezone: string
}

export interface AppConfigContextType {
  country: CountryConfig | null
  language: string
  currency: string
  timezone: string
  loading: boolean
  translations: Record<string, string>
  featureFlags: Record<string, boolean>
  formatCurrency: (amount: number) => string
  formatDate: (date: Date | string) => string
  t: (key: string, replacements?: Record<string, string | number>) => string
  updateLanguageRegion: (lang: string, countryCode: string, currencyCode?: string) => Promise<{ success: boolean; error?: string }>
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined)

const DEFAULT_COUNTRY: CountryConfig = {
  code: 'NG',
  name: 'Nigeria',
  currency_code: 'NGN',
  currency_symbol: '₦',
  currency_name: 'Nigerian Naira',
  phone_country_code: '+234',
  default_language: 'en-NG',
  date_format: 'DD/MM/YYYY',
  number_format: 'en-NG',
  is_active: true,
  is_beta: false,
  supported_id_types: ['BVN', 'NIN', 'voters_card', 'drivers_license', 'passport'],
  payment_providers: ['paystack', 'flutterwave', 'opay', 'moniepoint'],
  pos_culture: true,
  timezone: 'Africa/Lagos'
}

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const [country, setCountry] = useState<CountryConfig | null>(null)
  const [language, setLanguage] = useState('en-NG')
  const [currency, setCurrency] = useState('NGN')
  const [timezone, setTimezone] = useState('Africa/Lagos')
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // 1. Fetch Country details
  const loadCountryConfig = useCallback(async (countryCode: string) => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('code', countryCode)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setCountry(data as CountryConfig)
      } else {
        setCountry(DEFAULT_COUNTRY)
      }
    } catch (e) {
      console.error('Error loading country config:', e)
      setCountry(DEFAULT_COUNTRY)
    }
  }, [])

  // 2. Fetch Translations dictionary
  const loadTranslations = useCallback(async (langCode: string) => {
    try {
      // Fetch from local cache first if available (memory/localStorage is fine for public i18n asset caching)
      const cached = localStorage.getItem(`trustline_i18n_${langCode}`)
      if (cached) {
        setTranslations(JSON.parse(cached))
      }

      // Sync/Fetch from Edge Function
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'}/functions/v1/get-translations?lang=${langCode}`
      const res = await fetch(url, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        }
      })
      
      if (res.ok) {
        const dict = await res.json()
        setTranslations(dict)
        localStorage.setItem(`trustline_i18n_${langCode}`, JSON.stringify(dict))
      }
    } catch (e) {
      console.warn('Failed to fetch translations from Edge Function, using offline fallback:', e)
    }
  }, [])

  // 3. Fetch Feature Flags
  const loadFeatureFlags = useCallback(async (countryCode: string, kyc: number, trust: number, uId: string) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'}/functions/v1/get-feature-flags`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          country_code: countryCode,
          kyc_tier: kyc,
          trust_score: trust,
          profile_id: uId
        })
      })

      if (res.ok) {
        const flags = await res.json()
        setFeatureFlags(flags)
      }
    } catch (e) {
      console.warn('Failed to fetch feature flags from Edge Function:', e)
    }
  }, [])

  // Initialize Region/Language configuration
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      // Determine active values from Profile
      const pLang = profile?.language_code || (typeof window !== 'undefined' ? (localStorage.getItem('trustline_language') || 'en-NG') : 'en-NG')
      const pCountry = profile?.country_code || (typeof window !== 'undefined' ? (localStorage.getItem('trustline_country') || 'NG') : 'NG')
      const pCurrency = profile?.currency_code || (typeof window !== 'undefined' ? (localStorage.getItem('trustline_currency') || 'NGN') : 'NGN')
      const pTimezone = profile?.timezone || 'Africa/Lagos'

      setLanguage(pLang)
      setCurrency(pCurrency)
      setTimezone(pTimezone)

      let kyc = 0
      let trust = 65
      const uId = profile?.id || ''
      if (uId) {
        try {
          const [kycRes, trustRes] = await Promise.all([
            supabase.from('kyc_profiles').select('tier').eq('profile_id', uId).maybeSingle(),
            supabase.from('trust_metrics').select('reputation_score').eq('profile_id', uId).maybeSingle()
          ])
          if (kycRes.data) kyc = kycRes.data.tier
          if (trustRes.data) trust = Number(trustRes.data.reputation_score)
        } catch (e) {
          console.warn('Error fetching kyc/trust details for feature flags:', e)
        }
      }

      await Promise.all([
        loadCountryConfig(pCountry),
        loadTranslations(pLang),
        loadFeatureFlags(pCountry, kyc, trust, uId)
      ])
      setLoading(false)
    }

    init()
  }, [profile, loadCountryConfig, loadTranslations, loadFeatureFlags])

  // 3. Format Currency
  const formatCurrency = useCallback((amount: number): string => {
    const numberFormatLocale = country?.number_format || 'en-NG'
    const currencyCode = currency || 'NGN'
    try {
      return new Intl.NumberFormat(numberFormatLocale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount)
    } catch {
      // Fallback
      return `${country?.currency_symbol || '₦'}${Number(amount).toLocaleString()}`
    }
  }, [country, currency])

  // 4. Format Date
  const formatDate = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : ''
    
    const localeStr = country?.number_format || 'en-NG'
    try {
      return new Intl.DateTimeFormat(localeStr, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(d)
    } catch {
      return d.toLocaleDateString()
    }
  }, [country])

  // 5. Translate key
  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let value = translations[key] || key
    
    // Perform simple variable replacements in translations e.g. {amount}
    if (replacements) {
      Object.entries(replacements).forEach(([k, val]) => {
        value = value.replace(new RegExp(`{${k}}`, 'g'), String(val))
      })
    }
    return value
  }, [translations])

  // 6. Update Language & Region
  const updateLanguageRegion = useCallback(async (lang: string, countryCode: string, currencyCode?: string) => {
    const activeCurrency = currencyCode || (countryCode === 'NG' ? 'NGN' : countryCode === 'GH' ? 'GHS' : countryCode === 'KE' ? 'KES' : 'NGN')
    
    try {
      localStorage.setItem('trustline_language', lang)
      localStorage.setItem('trustline_country', countryCode)
      localStorage.setItem('trustline_currency', activeCurrency)

      setLanguage(lang)
      setCurrency(activeCurrency)

      if (profile?.id) {
        // Save to DB profiles table
        const { error } = await supabase
          .from('profiles')
          .update({
            language_code: lang,
            country_code: countryCode,
            currency_code: activeCurrency
          })
          .eq('id', profile.id)

        if (error) throw error
      }

      let kyc = 0
      let trust = 65
      const uId = profile?.id || ''
      if (uId) {
        try {
          const [kycRes, trustRes] = await Promise.all([
            supabase.from('kyc_profiles').select('tier').eq('profile_id', uId).maybeSingle(),
            supabase.from('trust_metrics').select('reputation_score').eq('profile_id', uId).maybeSingle()
          ])
          if (kycRes.data) kyc = kycRes.data.tier
          if (trustRes.data) trust = Number(trustRes.data.reputation_score)
        } catch (e) {}
      }

      await Promise.all([
        loadCountryConfig(countryCode),
        loadTranslations(lang),
        loadFeatureFlags(countryCode, kyc, trust, uId)
      ])

      return { success: true }
    } catch (e: any) {
      console.error('Error updating Language/Region:', e)
      return { success: false, error: e.message || e.toString() }
    }
  }, [profile?.id, loadCountryConfig, loadTranslations, loadFeatureFlags])

  const contextValue = useMemo(() => ({
    country,
    language,
    currency,
    timezone,
    loading,
    translations,
    featureFlags,
    formatCurrency,
    formatDate,
    t,
    updateLanguageRegion
  }), [country, language, currency, timezone, loading, translations, featureFlags, formatCurrency, formatDate, t, updateLanguageRegion])

  return (
    <AppConfigContext.Provider value={contextValue}>
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  const context = useContext(AppConfigContext)
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider')
  }
  return context
}
