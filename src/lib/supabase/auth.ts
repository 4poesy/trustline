import { supabase } from './client'

export function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

/**
 * Sends a one-time SMS verification code to the user.
 * Validates the number format before sending.
 */
export async function sendOTP(phone: string) {
  if (!validateE164(phone)) {
    return { data: null, error: new Error('Phone number must be in valid E.164 format (e.g. +2348012345678)') }
  }
  const { data, error } = await supabase.auth.signInWithOtp({ phone })
  return { data, error }
}

/**
 * Verifies the received OTP token against the registered phone number.
 */
export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  return { data, error }
}

/**
 * Signs out the current user session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Retrieves the current session object.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

/**
 * Sets up a subscription listener on auth state changes.
 */
export function onAuthStateChange(callback: (event: any, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
}
