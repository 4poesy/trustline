# Trustline Infrastructure Stack Audit

This document audits and maps the fully free infrastructure architecture configured for **Trustline** based on the resources listed in [free-for-dev](https://github.com/ripienaar/free-for-dev).

---

## 1. Database & Backend: Supabase (Free Tier)
Supabase is the primary backend and database engine.

- **Service Provider**: Supabase (Hosted)
- **Free Tier Limits**:
  - **Database Storage**: 500 MB Postgres database storage limit.
  - **Bandwidth**: 2 GB egress bandwidth per month.
  - **Realtime**: 200 concurrent connections, 2 million messages/month.
  - **API Requests**: Up to 50,000 Monthly Active Users (MAU).
- **Upgrade Trigger**:
  - Upgrade to Pro tier ($25/month) when database storage approaches 500 MB, or when realtime subscription concurrent links exceed 200.

---

## 2. Authentication: Supabase Auth + Twilio/Africa's Talking
Authentication uses Supabase Auth with custom SMS OTP gateways.

- **Primary Provider**: Supabase Auth (Free, built-in)
  - **Limits**: 50,000 Monthly Active Users (MAU) for email/OAuth.
- **SMS Gateway (Nigeria)**: Africa's Talking Sandbox / Twilio Trial
  - **Limits**: 
    - **Africa's Talking**: Free developer sandbox for testing SMS delivery to Nigerian numbers.
    - **Twilio**: $15 free trial credits for sending SMS to pre-verified numbers.
- **Upgrade Trigger**:
  - Live production delivery of OTP SMS messages to Nigerian subscribers requires a paid Africa's Talking API account (NCC compliance and pre-registered Sender IDs cost approx. ₦4.00 per SMS).

---

## 3. PWA Web Push Notifications: OneSignal (Free Tier)
OneSignal handles background transactional push updates (esusu payout warnings, reviews).

- **Service Provider**: OneSignal
- **Free Tier Limits**:
  - **Subscribers**: Up to 10,000 active push subscribers.
  - **Notifications**: Unlimited Web Push alerts.
- **Upgrade Trigger**:
  - Upgrade to Growth tier when the platform exceeds 10,000 registered push subscribers.

---

## 4. Offline Sync: Client-side IndexedDB + Service Worker
Offline persistence utilizes Dexie.js wrapper to write directly to device storage.

- **Provider**: Browser native storage (IndexedDB)
- **Limits**:
  - Bound only by browser quota (typically 50% of free disk space on the user device).
  - Background Sync API: Supported natively on Chromium browsers.
- **Upgrade Trigger**: None (Free forever).

---

## 5. File Storage: Supabase Storage
Stores trader avatar profile pictures and receipts.

- **Service Provider**: Supabase Storage
- **Free Tier Limits**:
  - **Storage space**: 1 GB.
  - **Bandwidth**: 500 MB egress bandwidth per month.
  - **Image Compression**: Performed on the client side using `browser-image-compression` to ensure upload sizes are below 100 KB.
- **Upgrade Trigger**:
  - Upgrade when total profile avatars and uploaded receipts exceed 1 GB storage space.

---

## 6. Email: Resend (Free Tier)
Sends weekly transaction receipts and registration confirmations.

- **Service Provider**: Resend
- **Free Tier Limits**:
  - **Volume**: 3,000 emails per month (max 100 emails/day).
  - **Domains**: 1 custom sender domain.
- **Upgrade Trigger**:
  - Upgrade when daily transactional emails exceed 100 per day.

---

## 7. Hosting: Vercel (Hobby Tier)
Hosts the frontend Next.js PWA.

- **Service Provider**: Vercel
- **Free Tier Limits**:
  - **Bandwidth**: 100 GB bandwidth per month.
  - **Build minutes**: 6,000 build minutes per month.
  - **Serverless execution**: 10 seconds execution limit.
- **Upgrade Trigger**:
  - Upgrade to Pro ($20/user/month) for commercial terms or if monthly client bandwidth exceeds 100 GB.

---

## 8. Analytics: Microsoft Clarity (Free Forever)
Tracks UI interactions, heatmaps, and sessions.

- **Service Provider**: Microsoft Clarity
- **Free Tier Limits**:
  - **Completely Free**: No traffic limits, unlimited session recordings, and unlimited heatmaps.
- **Upgrade Trigger**: None.

---

## 9. Maps & Coordinates: Leaflet.js + OpenStreetMap
Renders search map markers in directory profiles.

- **Provider**: Leaflet.js (Client library) + OpenStreetMap Tile Server
- **Free Tier Limits**:
  - Completely free and open-source. Requires no API keys.
- **Upgrade Trigger**: None.

---

## 10. WhatsApp Integrations: Twilio WhatsApp Sandbox
Sends esusu cycle updates directly to chat.

- **Service Provider**: Twilio WhatsApp Sandbox
- **Free Tier Limits**:
  - Free sandbox testing to pre-joined numbers.
- **Upgrade Trigger**:
  - Production WhatsApp Business API requires profile registration and Meta approvals, costing fixed rates per conversation.
