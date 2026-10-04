import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';

export const isNativeMobile = () => Capacitor.isNativePlatform();

export const initNativeApp = async () => {
  if (!isNativeMobile()) return;

  try {
    // Hide splash screen smoothly after app is loaded
    await SplashScreen.hide();
  } catch (e) {
    console.warn('[Native] Splash screen error:', e);
  }

  try {
    // Hide status bar completely in immersive fullscreen mode (hides time, battery, network indicators)
    await StatusBar.hide();

    // Ensure status bar remains hidden whenever app regains focus or resumes
    App.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        try {
          await StatusBar.hide();
        } catch (_) {}
      }
    });
  } catch (e) {
    console.warn('[Native] Status bar hide error:', e);
  }

  try {
    // Handle Android hardware back button
    App.addListener('backButton', ({ canGoBack }) => {
      // Check if any modal is open
      const hasOpenModal = document.querySelector('.modal-backdrop, .low-stock-modal-backdrop, .m3-dialog-container');
      if (hasOpenModal) {
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
        document.dispatchEvent(escEvent);
        return;
      }

      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (e) {
    console.warn('[Native] Back button setup error:', e);
  }
};

export const shareInvoiceNative = async ({ title, text, url, dialogTitle }) => {
  if (isNativeMobile()) {
    try {
      await Share.share({
        title: title || 'Billie Invoice',
        text: text || 'Here is your invoice from Billie',
        url: url,
        dialogTitle: dialogTitle || 'Share Invoice'
      });
      return true;
    } catch (e) {
      if (e.message?.includes('canceled') || e.name === 'AbortError') return false;
      console.warn('[Native] Share error:', e);
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('[Web] Share failed:', e);
      }
    }
  }

  return false;
};

export const shareToWhatsAppDirectly = ({ phone, text }) => {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  let targetPhone = cleanPhone;
  if (targetPhone.length === 10) {
    targetPhone = `91${targetPhone}`;
  }

  const encodedText = encodeURIComponent(text);
  const url = targetPhone 
    ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(url, '_blank');
};

export const formatInvoiceForWhatsApp = (invoice, store) => {
  const storeName = store?.storeName || store?.name || 'Billie Store';
  const customer = invoice.customer?.name || 'Customer';
  const invNumber = invoice.invoiceNumber || invoice.id || 'INV';
  const date = new Date().toLocaleDateString('en-IN');
  const currency = invoice.currency || '₹';

  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    { name: invoice.product || 'Item', quantity: invoice.quantity || 1, price: invoice.price || 0, lineTotal: invoice.total || 0 }
  ];

  let msg = `🧾 *INVOICE: #${invNumber}*\n`;
  msg += `🏬 *${storeName}*\n`;
  msg += `📅 Date: ${date}\n`;
  msg += `👤 Customer: ${customer}\n`;
  msg += `----------------------------\n`;
  
  items.forEach((it, idx) => {
    const q = it.quantity || 1;
    const p = it.price || 0;
    const t = it.lineTotal || (q * p);
    msg += `${idx + 1}. *${it.name}* (x${q}) : ${currency}${t}\n`;
  });

  msg += `----------------------------\n`;
  msg += `💰 *Subtotal*: ${currency}${invoice.subtotal || invoice.total}\n`;
  if (invoice.discount) msg += `🏷️ *Discount*: -${currency}${invoice.discount}\n`;
  if (invoice.tax) msg += `📊 *Tax/GST*: +${currency}${invoice.tax}\n`;
  msg += `✅ *TOTAL DUE*: *${currency}${invoice.total}*\n`;

  if (store?.upiId) {
    msg += `💳 *UPI ID*: \`${store.upiId}\`\n`;
  }
  msg += `\n_Thank you for your business!_ 🙏`;

  return msg;
};

