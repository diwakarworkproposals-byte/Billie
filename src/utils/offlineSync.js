/**
 * Offline Sync Engine for Billie POS
 * Manages pending actions when offline, and automatically synchronizes when connection is restored.
 */

const OFFLINE_QUEUE_KEY = 'billie_offline_sync_queue';

export function isAppOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    notifySyncListeners();
  } catch (e) {
    console.warn('[Offline Sync] Failed to save queue:', e);
  }
}

export function queueOfflineAction(type, data) {
  const queue = getOfflineQueue();
  const item = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    data,
    timestamp: new Date().toISOString()
  };
  queue.push(item);
  saveOfflineQueue(queue);
  return item;
}

export function removeOfflineAction(id) {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(queue);
}

export function clearOfflineQueue() {
  saveOfflineQueue([]);
}

export function getPendingSyncCount() {
  return getOfflineQueue().length;
}

function notifySyncListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('billie-sync-status', {
        detail: {
          isOnline: isAppOnline(),
          pendingCount: getPendingSyncCount()
        }
      })
    );
  }
}

/**
 * Process and synchronize all queued items
 */
export async function syncPendingActions(handlers = {}) {
  if (!isAppOnline()) return { synced: 0, remaining: getPendingSyncCount() };

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  let syncedCount = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      const handler = handlers[item.type];
      if (handler) {
        await handler(item.data);
      }
      syncedCount++;
    } catch (err) {
      console.warn(`[Offline Sync] Failed to sync item ${item.id}:`, err);
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return { synced: syncedCount, remaining: remaining.length };
}

/**
 * Setup global network status listeners
 */
export function initOfflineSync(onOnlineCallback) {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    notifySyncListeners();
    if (onOnlineCallback) onOnlineCallback();
  });

  window.addEventListener('offline', () => {
    notifySyncListeners();
  });

  // Initial notification
  notifySyncListeners();
}
