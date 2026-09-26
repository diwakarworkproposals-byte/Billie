import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const DEFAULT_USER = {
  isLoggedIn: true,
  name: 'Alex Morgan',
  email: 'alex@apexstudio.io',
  businessName: 'Apex Studio & Commerce',
  phone: '+1 (555) 019-2834',
  address: '742 Evergreen Terrace, Suite 100',
  taxId: 'TAX-8849-US'
};

const DEFAULT_SETTINGS = {
  currency: '$',
  defaultTaxRate: 5,
  defaultDiscount: 0,
  invoicePrefix: 'INV-2026-',
  voiceFeedback: true,
  theme: 'light'
};

export function AppProvider({ children }) {
  // 1. User Authentication & Profile
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // 2. App Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 3. Saved Invoices History
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_invoices');
      return saved ? JSON.parse(saved) : [
        {
          id: 'inv_demo_1',
          invoiceNumber: 'INV-2026-001',
          customerName: 'Acme Global Corp',
          customerEmail: 'billing@acme.com',
          date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
          dueDate: 'Net 15 Days',
          product: 'PWA Web Design & Development',
          quantity: 1,
          price: 1250,
          discount: 50,
          discountType: 'flat',
          subtotal: 1250,
          totalDiscount: 50,
          taxRate: 5,
          taxAmount: 60,
          total: 1260,
          currency: '$',
          items: [
            {
              name: 'PWA Web Design & Development',
              quantity: 1,
              price: 1250,
              discount: 50,
              discountType: 'flat',
              subtotal: 1250,
              lineDiscount: 50,
              lineTotal: 1200
            }
          ]
        }
      ];
    } catch {
      return [];
    }
  });

  // 4. PWA Installation state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    localStorage.setItem('billie_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('billie_settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('billie_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Network online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    // Handle beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[Billie PWA] beforeinstallprompt captured!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[Billie PWA] App successfully installed!');
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // PWA Install trigger
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
      return outcome;
    }
    return null;
  };

  // Auth actions
  const login = (email, name = 'Alex Morgan', businessName = 'My Business') => {
    setUser({
      isLoggedIn: true,
      name,
      email,
      businessName,
      phone: '+1 (555) 019-2834',
      address: '100 Market St, Suite 200',
      taxId: 'TAX-00123'
    });
  };

  const logout = () => {
    setUser({
      isLoggedIn: false,
      name: 'Guest User',
      email: '',
      businessName: '',
      phone: '',
      address: '',
      taxId: ''
    });
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const updateSettings = (updatedFields) => {
    setSettings((prev) => ({ ...prev, ...updatedFields }));
  };

  const addInvoice = (invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
  };

  const deleteInvoice = (id) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const getNextInvoiceNumber = () => {
    const prefix = settings.invoicePrefix || 'INV-2026-';
    const count = invoices.length + 1;
    return `${prefix}${String(count).padStart(3, '0')}`;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        settings,
        invoices,
        isInstallable,
        isInstalled,
        isOffline,
        installPWA,
        login,
        logout,
        updateProfile,
        updateSettings,
        addInvoice,
        deleteInvoice,
        getNextInvoiceNumber
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
