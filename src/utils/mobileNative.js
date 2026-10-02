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
    // Style status bar for dark theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1E242C' });
  } catch (e) {
    console.warn('[Native] Status bar error:', e);
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
