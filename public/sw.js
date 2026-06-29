// Import OneSignal Web Push SDK Service Worker
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Listen for PWA Background Sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'sync-contributions') {
    event.waitUntil(syncContributions());
  }
});

/**
 * Invokes background sync API triggers to push local IndexedDB transactions
 */
async function syncTransactions() {
  console.log('[Service Worker] Background syncing transactions...');
  try {
    const response = await fetch('/api/sync/transactions', { method: 'POST' });
    if (!response.ok) throw new Error('Network response was not OK');
    return response.json();
  } catch (err) {
    console.error('[Service Worker] Sync transactions failed:', err);
    throw err; // Re-queues the sync event to retry later when connection stabilizes
  }
}

/**
 * Invokes background sync API triggers to push local IndexedDB contributions
 */
async function syncContributions() {
  console.log('[Service Worker] Background syncing contributions...');
  try {
    const response = await fetch('/api/sync/contributions', { method: 'POST' });
    if (!response.ok) throw new Error('Network response was not OK');
    return response.json();
  } catch (err) {
    console.error('[Service Worker] Sync contributions failed:', err);
    throw err;
  }
}
