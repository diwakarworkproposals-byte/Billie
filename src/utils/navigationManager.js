/**
 * Billie PWA & Mobile Navigation Manager
 * 
 * Provides robust Android hardware back button and PWA browser history management:
 * 1. Closes modals, sub-modals, dialogs, and active invoice drafts in LIFO/priority order.
 * 2. Returns to the previous page/view (e.g. Admin -> Store) on back press.
 * 3. Prevents accidental PWA / App exit on the home screen with an authentic
 *    "Press back again to exit" (दो बार बैक दबाएं बाहर निकलने के लिए) toast.
 * 4. Works seamlessly across both Chrome PWA (standalone) and Capacitor Android.
 */
import { useEffect } from 'react';
import { App } from '@capacitor/app';

class NavigationManager {
  constructor() {
    this.backStack = []; // [{ id, onBack, priority, pushHistory }]
    this.toastListeners = new Set();
    this.isProgrammaticPop = false;
    this.lastBackPressTime = 0;
    this.exitDelayMs = 2500;
    this.exitTimer = null;
    this.initialized = false;
    this.isCapacitor = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Detect Capacitor native environment
    try {
      this.isCapacitor = Boolean(
        window?.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform()
      );
    } catch (_) {
      this.isCapacitor = false;
    }

    // Ensure baseline history entry for PWA root trap
    try {
      if (!window.history.state || !window.history.state.billieRoot) {
        window.history.replaceState({ billieRoot: true, ts: Date.now() }, '');
      }
    } catch (e) {
      console.warn('[NavManager] History init error:', e);
    }

    // Listen for browser popstate (fires on Android back swipe / hardware back in PWA)
    window.addEventListener('popstate', (e) => {
      this.handlePopState(e);
    });

    // Listen for Capacitor native back button
    if (this.isCapacitor) {
      try {
        App.addListener('backButton', () => {
          this.handleNativeBack();
        });
      } catch (e) {
        console.warn('[NavManager] Capacitor backButton listener error:', e);
      }
    }
  }

  // Subscribe to "Press back again to exit" toast updates
  subscribeToast(cb) {
    this.toastListeners.add(cb);
    return () => this.toastListeners.delete(cb);
  }

  notifyToast(show, lang = 'hi') {
    this.toastListeners.forEach((cb) => {
      try {
        cb(show, lang);
      } catch (e) {
        console.warn('[NavManager] Toast listener error:', e);
      }
    });
  }

  /**
   * Register a back action handler
   * @param {Object} options
   * @param {string} options.id - Unique ID (e.g., 'inventory-modal')
   * @param {Function} options.onBack - Callback invoked when user presses back
   * @param {number} [options.priority=10] - Higher priority runs first
   * @param {boolean} [options.pushHistory=true] - Whether to push entry to browser history
   * @returns {Function} unregister cleanup function
   */
  register({ id, onBack, priority = 10, pushHistory = true }) {
    if (!id || typeof onBack !== 'function') return () => {};

    // Remove existing with same id if any
    this.backStack = this.backStack.filter((item) => item.id !== id);

    // Push history state if requested
    let historyPushed = false;
    if (pushHistory && typeof window !== 'undefined') {
      try {
        window.history.pushState({ billieNavId: id, ts: Date.now() }, '');
        historyPushed = true;
      } catch (e) {
        console.warn('[NavManager] pushState failed:', e);
      }
    }

    const item = { id, onBack, priority, historyPushed };
    this.backStack.push(item);
    // Sort so highest priority is at the end of the array (LIFO)
    this.backStack.sort((a, b) => a.priority - b.priority);

    return () => {
      this.unregister(id);
    };
  }

  /**
   * Unregister an item (e.g. when closed via UI 'X' button or Cancel)
   */
  unregister(id) {
    const idx = this.backStack.findIndex((item) => item.id === id);
    if (idx === -1) return;

    const [removed] = this.backStack.splice(idx, 1);

    // If this item had pushed a history state and is currently at the top of history,
    // pop the history state without triggering another back action
    if (
      removed.historyPushed &&
      typeof window !== 'undefined' &&
      window.history.state?.billieNavId === id
    ) {
      this.isProgrammaticPop = true;
      try {
        window.history.back();
      } catch (e) {
        console.warn('[NavManager] history.back error:', e);
      }
    }
  }

  /**
   * Handler for popstate event (PWA browser back)
   */
  handlePopState(event) {
    // If pop was triggered programmatically by UI close, ignore
    if (this.isProgrammaticPop) {
      this.isProgrammaticPop = false;
      return;
    }

    // If there is an active item in our back stack, handle it!
    if (this.backStack.length > 0) {
      const top = this.backStack.pop();
      if (top && typeof top.onBack === 'function') {
        try {
          top.onBack();
        } catch (err) {
          console.error('[NavManager] Error in back handler:', err);
        }
      }
      return;
    }

    // Stack is empty -> User pressed back at the ROOT of the app!
    this.handleRootBack('popstate');
  }

  /**
   * Handler for Capacitor native back button
   */
  handleNativeBack() {
    if (this.backStack.length > 0) {
      const top = this.backStack.pop();
      if (top && typeof top.onBack === 'function') {
        try {
          top.onBack();
        } catch (err) {
          console.error('[NavManager] Error in native back handler:', err);
        }
      }

      // Sync browser history state if it had one
      if (top && top.historyPushed && window.history.state?.billieNavId === top.id) {
        this.isProgrammaticPop = true;
        try {
          window.history.back();
        } catch (_) {}
      }
      return;
    }

    // Root screen in Capacitor
    this.handleRootBack('native');
  }

  /**
   * Handle back press when at the root page (Double-tap to exit)
   */
  handleRootBack(source = 'popstate') {
    const now = Date.now();
    const timeSinceLast = now - this.lastBackPressTime;

    if (timeSinceLast < this.exitDelayMs) {
      // Second tap within 2.5 seconds -> User confirmed exit!
      if (this.exitTimer) clearTimeout(this.exitTimer);
      this.notifyToast(false);

      if (this.isCapacitor) {
        try {
          App.exitApp();
        } catch (_) {}
      } else {
        // In PWA, allow standard browser history back to leave the PWA
        try {
          window.history.back();
        } catch (_) {}
      }
      return;
    }

    // First tap -> Show toast and trap history
    this.lastBackPressTime = now;
    this.notifyToast(true);

    if (this.exitTimer) clearTimeout(this.exitTimer);
    this.exitTimer = setTimeout(() => {
      this.notifyToast(false);
      this.lastBackPressTime = 0;
    }, this.exitDelayMs);

    // In PWA, re-trap root history so the next back press is also caught
    if (source === 'popstate' && typeof window !== 'undefined') {
      try {
        window.history.pushState({ billieRoot: true, ts: Date.now() }, '');
      } catch (_) {}
    }
  }
}

export const navigationManager = new NavigationManager();

// Automatically initialize on import
if (typeof window !== 'undefined') {
  navigationManager.init();
}

/**
 * React Hook for registering a back handler
 * @param {string} id - Unique identifier for the modal/view
 * @param {boolean} isActive - Whether the view/modal is currently open/active
 * @param {Function} onBack - Callback when back is pressed
 * @param {number} [priority=10] - Execution priority (higher executes first)
 */
export function useBackHandler(id, isActive, onBack, priority = 10) {
  useEffect(() => {
    if (!isActive) return;
    return navigationManager.register({
      id,
      onBack,
      priority,
      pushHistory: true
    });
  }, [id, isActive, onBack, priority]);
}
