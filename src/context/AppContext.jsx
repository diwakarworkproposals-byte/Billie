import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Pro Plan',
    nameHi: 'मासिक प्रो प्लान (1 महीना)',
    basePrice: 999,
    gstRate: 18,
    gstAmount: 179.82,
    totalPrice: 1178.82,
    durationDays: 30,
    tag: 'Standard Plan',
    billingCycle: 'Per Month'
  },
  six_months: {
    id: 'six_months',
    name: '6-Months Super Saver',
    nameHi: '6 महीने का सुपर सेवर प्लान',
    basePrice: 4999,
    gstRate: 18,
    gstAmount: 899.82,
    totalPrice: 5898.82,
    durationDays: 180,
    tag: 'Best Value (Save ~₹1,074)',
    billingCycle: 'Per 6 Months'
  }
};

export const DEFAULT_ADMIN = {
  id: 'admin_diwakar',
  name: 'Diwakar',
  username: 'Diwakar',
  email: 'Diwakar',
  password: 'Diwakar@123',
  role: 'admin',
  businessName: 'Billie Admin HQ',
  phone: '+91 99999 00000',
  address: 'New Delhi, India',
  taxId: '07DIWAKAR1234A1Z0'
};

const INITIAL_USERS = [
  {
    id: 'usr_101',
    name: 'Rajesh Sharma',
    email: 'rajesh@store.com',
    password: 'user123',
    role: 'user',
    businessName: 'Rajesh Garments & Retail',
    phone: '+91 98112 23344',
    address: 'Shop 14, Karol Bagh, New Delhi',
    taxId: '07AAAAA0000A1Z5',
    subscription: {
      planId: 'monthly',
      planName: 'Monthly Pro (₹999 + 18% GST)',
      basePrice: 999,
      gstRate: 18,
      gstAmount: 179.82,
      totalPaid: 1178.82,
      status: 'active', // 'active' | 'expired' | 'suspended'
      startDate: new Date(Date.now() - 86400000 * 10).toISOString(),
      expiryDate: new Date(Date.now() + 86400000 * 20).toISOString()
    },
    createdAt: new Date(Date.now() - 86400000 * 10).toLocaleDateString()
  },
  {
    id: 'usr_102',
    name: 'Pooja Verma',
    email: 'pooja@boutique.in',
    password: 'user123',
    role: 'user',
    businessName: 'Pooja Fashion Boutique',
    phone: '+91 98991 12233',
    address: 'Plot 22, Sector 18, Noida',
    taxId: '09BBBBB1111B2Z6',
    subscription: {
      planId: 'six_months',
      planName: '6-Months Super Saver (₹4,999 + 18% GST)',
      basePrice: 4999,
      gstRate: 18,
      gstAmount: 899.82,
      totalPaid: 5898.82,
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 45).toISOString(),
      expiryDate: new Date(Date.now() + 86400000 * 135).toISOString()
    },
    createdAt: new Date(Date.now() - 86400000 * 45).toLocaleDateString()
  },
  {
    id: 'usr_103',
    name: 'Vikas Kumar',
    email: 'vikas@hardware.com',
    password: 'user123',
    role: 'user',
    businessName: 'Vikas Electricals & Hardware',
    phone: '+91 97110 55667',
    address: 'Main Market, Jaipur, Rajasthan',
    taxId: '08CCCCC2222C3Z7',
    subscription: {
      planId: 'monthly',
      planName: 'Monthly Pro (₹999 + 18% GST)',
      basePrice: 999,
      gstRate: 18,
      gstAmount: 179.82,
      totalPaid: 1178.82,
      status: 'expired', // Expired account to demonstrate subscription control
      startDate: new Date(Date.now() - 86400000 * 40).toISOString(),
      expiryDate: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    createdAt: new Date(Date.now() - 86400000 * 40).toLocaleDateString()
  }
];

const DEFAULT_USER = INITIAL_USERS[0];

const DEFAULT_SETTINGS = {
  currency: '₹',
  defaultTaxRate: 5,
  defaultDiscount: 0,
  invoicePrefix: 'INV-2026-',
  voiceFeedback: true,
  theme: 'light',
  language: 'hi' // 'hi' (Hindi / Hinglish) | 'en' (English)
};

const DEFAULT_INVENTORY = [
  {
    id: 'prod_1',
    name: 'T-Shirt',
    quantity: 45,
    price: 500,
    costPrice: 320,
    lowStockThreshold: 10,
    updatedAt: new Date().toLocaleDateString()
  },
  {
    id: 'prod_2',
    name: 'Jeans',
    quantity: 28,
    price: 1200,
    costPrice: 850,
    lowStockThreshold: 5,
    updatedAt: new Date().toLocaleDateString()
  },
  {
    id: 'prod_3',
    name: 'Formal Shirt',
    quantity: 6, // Low stock warning!
    price: 900,
    costPrice: 600,
    lowStockThreshold: 10,
    updatedAt: new Date().toLocaleDateString()
  },
  {
    id: 'prod_4',
    name: 'Leather Belt',
    quantity: 18,
    price: 450,
    costPrice: 220,
    lowStockThreshold: 5,
    updatedAt: new Date().toLocaleDateString()
  }
];

export function AppProvider({ children }) {
  // 1. Registered Users Database (Managed by Admin)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_users_db');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // 2. Active Logged-in User State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_user');
      return saved ? JSON.parse(saved) : { ...DEFAULT_USER, isLoggedIn: true };
    } catch {
      return { ...DEFAULT_USER, isLoggedIn: true };
    }
  });

  // 3. App Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 4. Saved Invoices History
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_invoices');
      return saved ? JSON.parse(saved) : [
        {
          id: 'inv_demo_1',
          invoiceNumber: 'INV-2026-001',
          customerName: 'Rajesh Enterprises',
          customerEmail: 'rajesh@enterprise.in',
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
          currency: '₹',
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

  // 5. Inventory Products State
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_inventory');
      return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
    } catch {
      return DEFAULT_INVENTORY;
    }
  });

  // 6. PWA Installation & Session state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('billie_users_db', JSON.stringify(users));
  }, [users]);

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

  useEffect(() => {
    localStorage.setItem('billie_inventory', JSON.stringify(inventory));
  }, [inventory]);

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

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
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

  // -------------------------------------------------------------
  // CREDENTIAL AUTHENTICATION & LOGIN (Requirement 1 & 2)
  // -------------------------------------------------------------
  const authenticate = (emailOrId, password) => {
    const cleanId = (emailOrId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Email/ID aur Password dono likhna zaroori hai.' };
    }

    // A. Master Admin Check - Only particular credentials: User Name: Diwakar | Password: Diwakar@123
    if (
      (cleanId === 'diwakar' || cleanId === 'diwakar@billie.io') &&
      password.trim() === 'Diwakar@123'
    ) {
      const adminSession = {
        isLoggedIn: true,
        role: 'admin',
        id: DEFAULT_ADMIN.id,
        name: 'Diwakar',
        username: 'Diwakar',
        email: 'Diwakar',
        businessName: DEFAULT_ADMIN.businessName,
        phone: DEFAULT_ADMIN.phone,
        address: DEFAULT_ADMIN.address,
        taxId: DEFAULT_ADMIN.taxId,
        subscription: {
          status: 'active',
          planName: 'Super Admin Master Access',
          expiryDate: new Date(Date.now() + 86400000 * 3650).toISOString()
        }
      };
      setUser(adminSession);
      return { success: true, isAdmin: true, user: adminSession };
    }

    // B. User Credentials Verification from registered users list
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (u.id && u.id.toLowerCase() === cleanId) ||
        (u.phone && u.phone.replace(/[\s+-]/g, '') === cleanId.replace(/[\s+-]/g, ''))
    );

    if (!found) {
      return {
        success: false,
        error: 'Ye User ID / Email registered nahi hai. Kripya Admin se ID aur Password create karwayen.'
      };
    }

    if (found.password !== cleanPass) {
      return {
        success: false,
        error: 'Password galat hai! Kripya sahi password enter karein ya Admin se reset karwayen.'
      };
    }

    // C. Subscription Expiration / Suspension check (Requirement 3 & 4)
    const isSuspended = found.subscription?.status === 'suspended';
    const isExpired =
      found.subscription?.status === 'expired' ||
      new Date(found.subscription?.expiryDate) < new Date();

    const loggedUser = {
      isLoggedIn: true,
      role: 'user',
      id: found.id,
      name: found.name,
      email: found.email,
      businessName: found.businessName,
      phone: found.phone,
      address: found.address,
      taxId: found.taxId,
      subscription: {
        ...found.subscription,
        status: isSuspended ? 'suspended' : isExpired ? 'expired' : 'active'
      }
    };

    setUser(loggedUser);

    return {
      success: true,
      isAdmin: false,
      isExpired,
      isSuspended,
      user: loggedUser
    };
  };

  const logout = () => {
    setUser({
      isLoggedIn: false,
      role: 'guest',
      name: 'Guest User',
      email: '',
      businessName: '',
      phone: '',
      address: '',
      taxId: ''
    });
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      // Also update in users database if user has an id
      if (prev.id) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === prev.id ? { ...u, ...updatedFields } : u))
        );
      }
      return updated;
    });
  };

  // -------------------------------------------------------------
  // ADMIN DASHBOARD USER & SUBSCRIPTION MANAGEMENT (Requirement 1, 3, 4)
  // -------------------------------------------------------------
  const addUser = ({
    name,
    email,
    password,
    businessName = '',
    phone = '',
    address = '',
    taxId = '',
    planId = 'monthly' // 'monthly' (₹999+GST) | 'six_months' (₹4999+GST)
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Is email se user pehle se registered hai.' };
    }

    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.monthly;
    const now = new Date();
    const expiry = new Date(now.getTime() + plan.durationDays * 86400000);

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password.trim() || 'user123',
      role: 'user',
      businessName: businessName.trim() || `${name}'s Business`,
      phone: phone.trim(),
      address: address.trim(),
      taxId: taxId.trim(),
      subscription: {
        planId: plan.id,
        planName: `${plan.name} (₹${plan.basePrice} + ${plan.gstRate}% GST)`,
        basePrice: plan.basePrice,
        gstRate: plan.gstRate,
        gstAmount: plan.gstAmount,
        totalPaid: plan.totalPrice,
        status: 'active',
        startDate: now.toISOString(),
        expiryDate: expiry.toISOString()
      },
      createdAt: now.toLocaleDateString()
    };

    setUsers((prev) => [newUser, ...prev]);
    return { success: true, user: newUser };
  };

  const updateUser = (userId, updatedFields) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u))
    );
    // If the currently logged in user is being updated, sync state
    if (user.id === userId) {
      setUser((prev) => ({ ...prev, ...updatedFields }));
    }
  };

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (user.id === userId) {
      logout();
    }
  };

  // Renew / Extend Subscription
  const renewSubscription = (userId, planId = 'monthly') => {
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.monthly;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;

        const currentExpiry = new Date(u.subscription?.expiryDate || Date.now());
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        const newExpiry = new Date(baseDate.getTime() + plan.durationDays * 86400000);

        const updatedSubscription = {
          planId: plan.id,
          planName: `${plan.name} (₹${plan.basePrice} + ${plan.gstRate}% GST)`,
          basePrice: plan.basePrice,
          gstRate: plan.gstRate,
          gstAmount: plan.gstAmount,
          totalPaid: (Number(u.subscription?.totalPaid) || 0) + plan.totalPrice,
          status: 'active',
          startDate: new Date().toISOString(),
          expiryDate: newExpiry.toISOString(),
          lastRenewedAt: new Date().toLocaleDateString()
        };

        const updatedUser = { ...u, subscription: updatedSubscription };
        if (user.id === userId) {
          setUser((curr) => ({ ...curr, subscription: updatedSubscription }));
        }
        return updatedUser;
      })
    );
  };

  // Toggle user status (active, suspended, expired)
  const toggleUserStatus = (userId, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const updated = {
          ...u,
          subscription: {
            ...u.subscription,
            status: newStatus
          }
        };
        if (user.id === userId) {
          setUser((curr) => ({
            ...curr,
            subscription: { ...curr.subscription, status: newStatus }
          }));
        }
        return updated;
      })
    );
  };

  const updateSettings = (updatedFields) => {
    setSettings((prev) => ({ ...prev, ...updatedFields }));
  };

  const setLanguage = (lang) => {
    updateSettings({ language: lang });
  };

  const addInvoice = (invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
    if (invoice.items && invoice.items.length > 0) {
      reduceStockForInvoice(invoice.items);
    }
  };

  const deleteInvoice = (id) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const getNextInvoiceNumber = () => {
    const prefix = settings.invoicePrefix || 'INV-2026-';
    const count = invoices.length + 1;
    return `${prefix}${String(count).padStart(3, '0')}`;
  };

  // Inventory actions
  const addOrUpdateStock = (name, quantityToAdd = 1, price = 0, costPrice = 0) => {
    const normName = name.trim();
    let updatedProduct = null;

    setInventory((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.name.toLowerCase() === normName.toLowerCase()
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = Math.max(0, (Number(existing.quantity) || 0) + Number(quantityToAdd));
        updatedProduct = {
          ...existing,
          quantity: newQty,
          price: price > 0 ? price : existing.price,
          costPrice: costPrice > 0 ? costPrice : existing.costPrice,
          updatedAt: new Date().toLocaleDateString()
        };
        updated[existingIndex] = updatedProduct;
        return updated;
      } else {
        updatedProduct = {
          id: `prod_${Date.now()}`,
          name: normName,
          quantity: Math.max(0, Number(quantityToAdd)),
          price: Number(price) || 0,
          costPrice: Number(costPrice) || 0,
          lowStockThreshold: 5,
          updatedAt: new Date().toLocaleDateString()
        };
        return [updatedProduct, ...prev];
      }
    });

    return updatedProduct;
  };

  const updateProduct = (id, fields) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...fields, updatedAt: new Date().toLocaleDateString() }
          : item
      )
    );
  };

  const deleteProduct = (id) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const reduceStockForInvoice = (billedItems = []) => {
    setInventory((prev) => {
      return prev.map((stockItem) => {
        const billed = billedItems.find(
          (b) => b.name && b.name.toLowerCase().trim() === stockItem.name.toLowerCase().trim()
        );
        if (billed) {
          const billedQty = Number(billed.quantity) || 1;
          const remaining = Math.max(0, stockItem.quantity - billedQty);
          return {
            ...stockItem,
            quantity: remaining,
            updatedAt: new Date().toLocaleDateString()
          };
        }
        return stockItem;
      });
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        settings,
        invoices,
        inventory,
        isInstallable,
        isInstalled,
        isOffline,
        isVoiceSessionActive,
        setIsVoiceSessionActive,
        installPWA,
        authenticate,
        logout,
        updateProfile,
        addUser,
        updateUser,
        deleteUser,
        renewSubscription,
        toggleUserStatus,
        updateSettings,
        setLanguage,
        addInvoice,
        deleteInvoice,
        getNextInvoiceNumber,
        addOrUpdateStock,
        updateProduct,
        deleteProduct,
        reduceStockForInvoice
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
