import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeMobile } from './mobileNative';

/**
 * Request Notification Permissions (Native Android/iOS & Web)
 */
export async function requestNotificationPermission() {
  if (isNativeMobile()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (e) {
      console.warn('[Notification] Native permission error:', e);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('[Notification] Web permission error:', e);
      return false;
    }
  }

  return false;
}

/**
 * Send a notification
 */
export async function sendNotification({ id, title, body, extra = {} }) {
  const notifId = id || Math.floor(Math.random() * 100000);

  if (isNativeMobile()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: title,
            body: body,
            smallIcon: 'ic_launcher_round',
            iconColor: '#D97736',
            sound: 'beep.wav',
            extra: extra
          }
        ]
      });
      return true;
    } catch (e) {
      console.warn('[Notification] Native schedule error:', e);
    }
  }

  // Web Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
      return true;
    } catch (e) {
      console.warn('[Notification] Web notification error:', e);
    }
  }

  return false;
}

/**
 * Low Stock Notification Trigger
 */
export async function triggerLowStockNotification(productName, currentStock) {
  return sendNotification({
    title: `⚠️ Low Stock Alert: ${productName}`,
    body: `Only ${currentStock} pcs remaining in inventory. Please refill stock soon!`,
    extra: { type: 'low_stock', product: productName }
  });
}

/**
 * Invoice Created Notification Trigger
 */
export async function triggerInvoiceCreatedNotification(invoiceNum, total, customer) {
  return sendNotification({
    title: `🧾 Invoice Created: #${invoiceNum}`,
    body: `₹${total} billed successfully to ${customer || 'Customer'}.`,
    extra: { type: 'invoice_created', invoiceNum }
  });
}
