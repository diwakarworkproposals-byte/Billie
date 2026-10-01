import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Trial (14 Days)',
    nameHi: 'निःशुल्क ट्रायल (14 दिन)',
    basePrice: 0,
    gstRate: 0,
    gstAmount: 0,
    totalPrice: 0,
    durationDays: 14,
    tag: 'Free Trial',
    billingCycle: '14 Days Free'
  },
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
  },
  annual: {
    id: 'annual',
    name: '1-Year Annual Pro',
    nameHi: '1 वर्ष वार्षिक प्रो प्लान',
    basePrice: 8999,
    gstRate: 18,
    gstAmount: 1619.82,
    totalPrice: 10618.82,
    durationDays: 365,
    tag: 'Maximum Savings (Save ~₹3,500)',
    billingCycle: 'Per Year'
  }
};

export const DEFAULT_ADMIN = {
  id: 'admin_diwakar',
  name: 'Diwakar',
  username: 'Diwakar',
  email: 'diwakar@billie.app',
  password: 'Diwakar@123',
  role: 'admin',
  businessName: 'Billie Admin HQ',
  phone: '+91 99999 00000',
  address: 'New Delhi, India',
  taxId: '07DIWAKAR1234A1Z0',
  subscription: {
    planId: 'six_months',
    planName: 'Super Admin Master Access',
    basePrice: 0,
    gstRate: 0,
    gstAmount: 0,
    totalPaid: 0,
    status: 'active',
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 3650).toISOString()
  },
  createdAt: new Date().toLocaleDateString()
};

// Only keep Super Admin in initial users database (all demo accounts deleted)
const INITIAL_USERS = [DEFAULT_ADMIN];

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

export const DEFAULT_PURCHASES = [
  {
    id: 'pur_101',
    purchaseNumber: 'PUR-2026-001',
    supplierName: 'Vardhman Textiles Ltd.',
    supplierContact: '+91 98220 11223',
    supplierAddress: 'Ludhiana, Punjab',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
    product: 'Cotton T-Shirt Fabric & Blanks',
    items: [
      { name: 'T-Shirt', quantity: 60, unitCost: 320, totalCost: 19200 }
    ],
    totalAmount: 19200,
    paidAmount: 12000,
    pendingAmount: 7200,
    paymentStatus: 'partial', // 'paid' | 'partial' | 'unpaid'
    paymentHistory: [
      { id: 'pay_1', amount: 12000, date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0], method: 'NEFT Transfer', notes: 'Initial advance 60%' }
    ],
    notes: 'Advance ₹12,000 paid. Balance ₹7,200 due in 8 days.'
  },
  {
    id: 'pur_102',
    purchaseNumber: 'PUR-2026-002',
    supplierName: 'Surat Silk & Denim Mills',
    supplierContact: '+91 98450 67890',
    supplierAddress: 'Ring Road, Surat, Gujarat',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    product: 'Denim Jeans Fabric Rolls',
    items: [
      { name: 'Jeans', quantity: 35, unitCost: 850, totalCost: 29750 }
    ],
    totalAmount: 29750,
    paidAmount: 29750,
    pendingAmount: 0,
    paymentStatus: 'paid',
    paymentHistory: [
      { id: 'pay_2', amount: 29750, date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], method: 'Bank Transfer (IMPS)', notes: 'Full settlement on delivery' }
    ],
    notes: 'Full payment cleared upon delivery.'
  },
  {
    id: 'pur_103',
    purchaseNumber: 'PUR-2026-003',
    supplierName: 'Apex Leather & Accessories',
    supplierContact: '+91 97112 34567',
    supplierAddress: 'Dharavi, Mumbai',
    date: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // Overdue by 1 day
    product: 'Genuine Leather Belts',
    items: [
      { name: 'Leather Belt', quantity: 25, unitCost: 220, totalCost: 5500 }
    ],
    totalAmount: 5500,
    paidAmount: 2000,
    pendingAmount: 3500,
    paymentStatus: 'partial',
    paymentHistory: [
      { id: 'pay_3', amount: 2000, date: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0], method: 'Cash', notes: 'Booking deposit' }
    ],
    notes: 'Urgent: Payment due date passed! Balance ₹3,500 pending.'
  },
  {
    id: 'pur_104',
    purchaseNumber: 'PUR-2026-004',
    supplierName: 'Raymond Shirting & Suiting Co.',
    supplierContact: '+91 99100 88776',
    supplierAddress: 'Bhiwandi, Maharashtra',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0],
    product: 'Formal Shirts Fabric Lots',
    items: [
      { name: 'Formal Shirt', quantity: 20, unitCost: 600, totalCost: 12000 }
    ],
    totalAmount: 12000,
    paidAmount: 0,
    pendingAmount: 12000,
    paymentStatus: 'unpaid',
    paymentHistory: [],
    notes: 'Net 20 days credit terms. Full payment of ₹12,000 pending.'
  }
];

const DEFAULT_INVOICES = [];

const DEFAULT_CUSTOMERS = [];

export function AppProvider({ children }) {
  // 1. Registered Users Database (Managed by Admin & Signups - demo accounts purged)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_users_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove all old demo accounts
          const cleanUsers = parsed.filter(
            (u) =>
              u &&
              !['usr_101', 'usr_102', 'usr_103'].includes(u.id) &&
              !['rajesh@store.com', 'pooja@boutique.in', 'vikas@hardware.com'].includes(
                (u.email || '').toLowerCase()
              )
          );
          // Ensure Super Admin is always present
          const hasAdmin = cleanUsers.some(
            (u) =>
              u.role === 'admin' ||
              (u.email || '').toLowerCase() === 'diwakar' ||
              (u.email || '').toLowerCase() === 'diwakar@billie.app'
          );
          if (!hasAdmin) {
            cleanUsers.unshift(DEFAULT_ADMIN);
          }
          localStorage.setItem('billie_users_db', JSON.stringify(cleanUsers));
          return cleanUsers;
        }
      }
      localStorage.setItem('billie_users_db', JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // 2. Active Logged-in User State (Requires Login/Signup before page loads)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If parsed is a demo user, purge session
        if (
          parsed &&
          (parsed.id === 'usr_101' ||
            parsed.id === 'usr_102' ||
            parsed.id === 'usr_103' ||
            (parsed.email || '').toLowerCase() === 'rajesh@store.com' ||
            parsed.name === 'Rajesh Sharma')
        ) {
          localStorage.removeItem('billie_user');
          return { isLoggedIn: false, role: 'guest', name: '', email: '' };
        }
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      }
      return { isLoggedIn: false, role: 'guest', name: '', email: '' };
    } catch {
      return { isLoggedIn: false, role: 'guest', name: '', email: '' };
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

  // 4. Saved Invoices History (Cleaned of all old demo bills per user request)
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove old demo bills
          return parsed.filter((inv) => inv && !String(inv.id || '').startsWith('inv_demo_'));
        }
      }
      return DEFAULT_INVOICES;
    } catch {
      return DEFAULT_INVOICES;
    }
  });

  // 5. Purchases & Accounting Ledger State
  const [purchases, setPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_purchases');
      return saved ? JSON.parse(saved) : DEFAULT_PURCHASES;
    } catch {
      return DEFAULT_PURCHASES;
    }
  });

  // 6. Inventory Products State
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_inventory');
      return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
    } catch {
      return DEFAULT_INVENTORY;
    }
  });

  // 7. Customers Database State (Cleaned of demo customers per user request)
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((c) => c && !['cust_1', 'cust_2', 'cust_3'].includes(c.id))
            .map((c, i) => ({
              id: c.id || `cust_saved_${i}`,
              name: c.name || c.companyName || 'Customer',
              companyName: c.companyName || '',
              phone: c.phone || '',
              email: c.email || '',
              gstNumber: c.gstNumber || '',
              address: c.address || '',
              createdAt: c.createdAt || new Date().toISOString()
            }));
        }
      }
      return DEFAULT_CUSTOMERS;
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  });

  // 8. PWA Installation & Session state
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
    if (user && user.isLoggedIn) {
      localStorage.setItem('billie_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('billie_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('billie_settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('billie_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('billie_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('billie_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('billie_customers', JSON.stringify(customers));
  }, [customers]);

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
  // REAL-TIME CREDENTIAL AUTHENTICATION & LOGIN (Requirement 1 & 2)
  // -------------------------------------------------------------
  const authenticate = (emailOrId, password) => {
    const cleanId = (emailOrId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Email / Username और Password दोनों लिखना अनिवार्य है।' };
    }

    // A. Master Super Admin Check
    if (
      (cleanId === 'diwakar' ||
        cleanId === 'diwakar@billie.app' ||
        cleanId === 'diwakar@billie.io' ||
        cleanId === 'diwakar admin') &&
      cleanPass === 'Diwakar@123'
    ) {
      const adminSession = {
        isLoggedIn: true,
        role: 'admin',
        id: DEFAULT_ADMIN.id,
        name: DEFAULT_ADMIN.name,
        username: 'Diwakar',
        email: DEFAULT_ADMIN.email,
        businessName: DEFAULT_ADMIN.businessName,
        phone: DEFAULT_ADMIN.phone,
        address: DEFAULT_ADMIN.address,
        taxId: DEFAULT_ADMIN.taxId,
        subscription: DEFAULT_ADMIN.subscription
      };
      setUser(adminSession);
      localStorage.setItem('billie_user', JSON.stringify(adminSession));
      return { success: true, isAdmin: true, user: adminSession };
    }

    // B. Check registered users list (by email, username, phone, or id)
    const found = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.id && u.id.toLowerCase() === cleanId) ||
        (u.phone && u.phone.replace(/[\s+-]/g, '') === cleanId.replace(/[\s+-]/g, ''))
    );

    if (!found) {
      return {
        success: false,
        error: 'यह यूज़र आईडी / ईमेल पंजीकृत नहीं है। कृपया "साइन अप" करके नया खाता बनाएं।'
      };
    }

    if (found.password !== cleanPass) {
      return {
        success: false,
        error: 'पासवर्ड गलत है! कृपया सही पासवर्ड दर्ज करें।'
      };
    }

    const isAdmin = found.role === 'admin';
    const isSuspended = found.subscription?.status === 'suspended';
    const isExpired =
      !isAdmin &&
      (found.subscription?.status === 'expired' ||
        (found.subscription?.expiryDate && new Date(found.subscription.expiryDate) < new Date()));

    const loggedUser = {
      isLoggedIn: true,
      role: found.role || 'user',
      id: found.id,
      name: found.name,
      email: found.email,
      businessName: found.businessName || '',
      phone: found.phone || '',
      address: found.address || '',
      taxId: found.taxId || '',
      subscription: {
        ...found.subscription,
        status: isSuspended ? 'suspended' : isExpired ? 'expired' : 'active'
      }
    };

    setUser(loggedUser);
    localStorage.setItem('billie_user', JSON.stringify(loggedUser));

    return {
      success: true,
      isAdmin,
      isExpired,
      isSuspended,
      user: loggedUser
    };
  };

  // -------------------------------------------------------------
  // REAL-TIME USER SIGNUP / REGISTRATION (Requirement 2)
  // -------------------------------------------------------------
  const registerUser = ({
    name,
    email,
    password,
    businessName = '',
    phone = '',
    address = '',
    taxId = '',
    planId = 'free' // 'free' (14 days) | 'monthly' | 'six_months' | 'annual'
  }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return { success: false, error: 'कृपया अपना नाम दर्ज करें।' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'कृपया ईमेल आईडी दर्ज करें।' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, error: 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' };
    }

    // Check if email already registered
    if (
      cleanEmail === 'diwakar' ||
      cleanEmail === 'diwakar@billie.app' ||
      users.some((u) => (u.email || '').toLowerCase() === cleanEmail)
    ) {
      return { success: false, error: 'इस ईमेल से खाता पहले से मौजूद है! कृपया सीधे लॉग इन करें।' };
    }

    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
    const now = new Date();
    const expiry = new Date(now.getTime() + plan.durationDays * 86400000);

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      role: 'user',
      businessName: businessName.trim() || `${cleanName}'s Business`,
      phone: phone.trim(),
      address: address.trim(),
      taxId: taxId.trim(),
      subscription: {
        planId: plan.id,
        planName: plan.name,
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

    setUsers((prev) => {
      const updated = [newUser, ...prev];
      localStorage.setItem('billie_users_db', JSON.stringify(updated));
      return updated;
    });

    // Real-time automatic login upon successful signup
    const loggedUser = {
      isLoggedIn: true,
      role: 'user',
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      businessName: newUser.businessName,
      phone: newUser.phone,
      address: newUser.address,
      taxId: newUser.taxId,
      subscription: newUser.subscription
    };
    setUser(loggedUser);
    localStorage.setItem('billie_user', JSON.stringify(loggedUser));

    return { success: true, user: loggedUser };
  };

  const logout = () => {
    localStorage.removeItem('billie_user');
    setUser({
      isLoggedIn: false,
      role: 'guest',
      name: '',
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

  // Extend User Subscription Validity (by days or exact Date ISO string)
  const extendUserValidity = (userId, daysOrDate) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;

        const currentExpiry = new Date(u.subscription?.expiryDate || Date.now());
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        let newExpiryDate;

        if (typeof daysOrDate === 'number') {
          newExpiryDate = new Date(baseDate.getTime() + daysOrDate * 86400000);
        } else {
          newExpiryDate = new Date(daysOrDate);
        }

        const updatedSub = {
          ...u.subscription,
          status: 'active',
          expiryDate: newExpiryDate.toISOString(),
          lastExtendedAt: new Date().toISOString()
        };

        const updatedUser = { ...u, subscription: updatedSub };
        if (user.id === userId) {
          setUser((curr) => ({ ...curr, subscription: updatedSub }));
        }
        return updatedUser;
      })
    );
  };

  // Change or Add Plan for User
  const changeUserPlan = (userId, planId, customDays = null) => {
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.monthly;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;

        const currentExpiry = new Date(u.subscription?.expiryDate || Date.now());
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        const days = customDays || plan.durationDays;
        const newExpiry = new Date(baseDate.getTime() + days * 86400000);

        const updatedSub = {
          ...u.subscription,
          planId: plan.id,
          planName: plan.name,
          basePrice: plan.basePrice,
          gstRate: plan.gstRate,
          gstAmount: plan.gstAmount,
          totalPaid: (Number(u.subscription?.totalPaid) || 0) + plan.totalPrice,
          status: 'active',
          expiryDate: newExpiry.toISOString(),
          lastRenewedAt: new Date().toLocaleDateString()
        };

        const updatedUser = { ...u, subscription: updatedSub };
        if (user.id === userId) {
          setUser((curr) => ({ ...curr, subscription: updatedSub }));
        }
        return updatedUser;
      })
    );
  };

  const updateSettings = (updatedFields) => {
    setSettings((prev) => ({ ...prev, ...updatedFields }));
  };

  const setLanguage = (lang) => {
    updateSettings({ language: lang });
  };

  // Customer Management actions
  const addOrUpdateCustomer = (custData) => {
    if (!custData || (!custData.name && !custData.companyName && !custData.phone)) {
      return null;
    }

    const cleanName = (custData.name || custData.companyName || 'Valued Customer').trim();
    const cleanCompany = (custData.companyName || '').trim();
    const cleanPhone = (custData.phone || '').trim();
    const cleanEmail = (custData.email || '').trim();
    const cleanGst = (custData.gstNumber || '').trim().toUpperCase();
    const cleanAddress = (custData.address || '').trim();

    let resultCustomer = null;

    setCustomers((prev) => {
      // Find if customer already exists by ID, by exact phone (if provided), or by case-insensitive name
      const idx = prev.findIndex((c) => {
        if (!c) return false;
        if (custData.id && c.id === custData.id) return true;
        if (cleanPhone && c.phone && c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) return true;
        const existingName = (c.name || c.companyName || '').toLowerCase();
        return existingName === cleanName.toLowerCase();
      });

      if (idx >= 0) {
        const existing = prev[idx];
        const updated = {
          ...existing,
          name: cleanName || existing.name,
          companyName: cleanCompany || existing.companyName,
          phone: cleanPhone || existing.phone,
          email: cleanEmail || existing.email,
          gstNumber: cleanGst || existing.gstNumber,
          address: cleanAddress || existing.address,
          updatedAt: new Date().toISOString()
        };
        resultCustomer = updated;
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      } else {
        const newCust = {
          id: custData.id || `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: cleanName,
          companyName: cleanCompany,
          phone: cleanPhone,
          email: cleanEmail,
          gstNumber: cleanGst,
          address: cleanAddress,
          createdAt: new Date().toISOString()
        };
        resultCustomer = newCust;
        return [newCust, ...prev];
      }
    });

    return resultCustomer;
  };

  const updateCustomer = (id, fields) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...fields, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const addInvoice = (invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
    if (invoice.items && invoice.items.length > 0) {
      reduceStockForInvoice(invoice.items);
    }

    // Automatically add or update customer in directory
    if (invoice.customerName && invoice.customerName.trim()) {
      const normName = invoice.customerName.trim().toLowerCase();
      const isGeneric = [
        'cash customer',
        'कैश ग्राहक',
        'valued customer',
        'सम्मानित ग्राहक',
        'walk-in',
        'walk in'
      ].includes(normName);

      if (!isGeneric || invoice.customerPhone || invoice.customerGst || invoice.customerCompany) {
        addOrUpdateCustomer({
          name: invoice.customerName.trim(),
          companyName: invoice.customerCompany || '',
          phone: invoice.customerPhone || '',
          email: invoice.customerEmail || '',
          gstNumber: invoice.customerGst || '',
          address: invoice.customerAddress || ''
        });
      }
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
    const normName = (name || '').trim();
    if (!normName) return null;

    const qtyToAdd = Number(quantityToAdd) || 0;
    const newCost = Number(costPrice) || 0;
    const newPrice = Number(price) || 0;
    let updatedProduct = null;

    setInventory((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.name && item.name.toLowerCase().trim() === normName.toLowerCase()
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const prevQty = Number(existing.quantity) || 0;
        const prevCost = Number(existing.costPrice) || 0;
        const newQty = prevQty + qtyToAdd;

        // Calculate Weighted Average Cost Price
        let avgCost = prevCost;
        if (newCost > 0) {
          if (prevQty > 0 && prevCost > 0) {
            // E.g., 10 chairs @ 600 + 5 chairs @ 550 => (6000 + 2750) / 15 = 583.33
            const totalCostVal = (prevQty * prevCost) + (qtyToAdd * newCost);
            const totalUnits = prevQty + qtyToAdd;
            avgCost = totalUnits > 0 ? Number((totalCostVal / totalUnits).toFixed(2)) : newCost;
          } else {
            // If previous stock was 0 or negative (deficit), incoming stock defines new unit cost
            avgCost = Number(newCost.toFixed(2));
          }
        }

        updatedProduct = {
          ...existing,
          quantity: newQty,
          price: newPrice > 0 ? newPrice : existing.price,
          costPrice: avgCost,
          updatedAt: new Date().toLocaleDateString()
        };
        updated[existingIndex] = updatedProduct;
        return updated;
      } else {
        const finalCost = newCost > 0 ? Number(newCost.toFixed(2)) : 0;
        updatedProduct = {
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: normName,
          quantity: qtyToAdd,
          price: newPrice,
          costPrice: finalCost,
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
      const updated = [...prev];

      billedItems.forEach((b) => {
        if (!b || !b.name) return;
        const normName = b.name.toLowerCase().trim();
        const billedQty = Number(b.quantity) || 1;
        const existingIndex = updated.findIndex(
          (s) => s.name && s.name.toLowerCase().trim() === normName
        );

        if (existingIndex >= 0) {
          const item = updated[existingIndex];
          // Can become negative if billedQty > item.quantity (e.g. 0 - 5 = -5)
          const newQty = (Number(item.quantity) || 0) - billedQty;
          updated[existingIndex] = {
            ...item,
            quantity: newQty,
            updatedAt: new Date().toLocaleDateString()
          };
        } else {
          // If item is not in inventory at all, create it with negative quantity!
          updated.unshift({
            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: b.name.trim(),
            quantity: -billedQty,
            price: Number(b.price) || 0,
            costPrice: 0,
            lowStockThreshold: 5,
            updatedAt: new Date().toLocaleDateString()
          });
        }
      });

      return updated;
    });
  };

  // -------------------------------------------------------------
  // PURCHASE & SUPPLIER ACCOUNTING ACTIONS
  // -------------------------------------------------------------
  const addPurchase = (purchaseData) => {
    const total = Math.max(0, Number(purchaseData.totalAmount) || 0);
    const paid = Math.max(0, Math.min(total, Number(purchaseData.paidAmount) || 0));
    const pending = Math.max(0, total - paid);
    const status = paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    const count = purchases.length + 1;
    const newPurchase = {
      id: `pur_${Date.now()}`,
      purchaseNumber: purchaseData.purchaseNumber || `PUR-2026-${String(count).padStart(3, '0')}`,
      supplierName: (purchaseData.supplierName || '').trim() || 'General Supplier',
      supplierContact: (purchaseData.supplierContact || '').trim(),
      supplierAddress: (purchaseData.supplierAddress || '').trim(),
      date: purchaseData.date || new Date().toISOString().split('T')[0],
      dueDate: purchaseData.dueDate || new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      product: purchaseData.product || (purchaseData.items?.[0]?.name) || 'Supplies',
      items: purchaseData.items || [
        {
          name: purchaseData.product || 'Supplies',
          quantity: Number(purchaseData.quantity) || 1,
          unitCost: Number(purchaseData.unitCost) || total,
          totalCost: total
        }
      ],
      totalAmount: total,
      paidAmount: paid,
      pendingAmount: pending,
      paymentStatus: status,
      paymentHistory: paid > 0 ? [
        {
          id: `pay_${Date.now()}`,
          amount: paid,
          date: purchaseData.date || new Date().toISOString().split('T')[0],
          method: purchaseData.paymentMethod || 'Initial Payment',
          notes: 'Paid upon bill entry'
        }
      ] : [],
      notes: purchaseData.notes || ''
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    // If restock requested, update inventory
    if (purchaseData.addToStock && purchaseData.items) {
      purchaseData.items.forEach((item) => {
        if (item.name) {
          addOrUpdateStock(item.name, item.quantity || 1, 0, item.unitCost || 0);
        }
      });
    }

    return newPurchase;
  };

  const recordPurchasePayment = (purchaseId, amountPaid, paymentMethod = 'UPI / Cash', notes = '') => {
    const payAmount = Math.max(0, Number(amountPaid) || 0);
    if (payAmount <= 0) return false;

    setPurchases((prev) =>
      prev.map((pur) => {
        if (pur.id === purchaseId) {
          const newPaid = pur.paidAmount + payAmount;
          const newPending = Math.max(0, pur.totalAmount - newPaid);
          const newStatus = newPaid >= pur.totalAmount ? 'paid' : 'partial';

          const newHistoryItem = {
            id: `pay_${Date.now()}`,
            amount: payAmount,
            date: new Date().toISOString().split('T')[0],
            method: paymentMethod,
            notes: notes || `Recorded payment of ₹${payAmount}`
          };

          return {
            ...pur,
            paidAmount: newPaid,
            pendingAmount: newPending,
            paymentStatus: newStatus,
            paymentHistory: [newHistoryItem, ...(pur.paymentHistory || [])],
            notes: notes ? `${pur.notes ? pur.notes + ' | ' : ''}${notes}` : pur.notes
          };
        }
        return pur;
      })
    );
    return true;
  };

  const deletePurchase = (purchaseId) => {
    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
  };

  const updatePurchase = (purchaseId, updatedFields) => {
    setPurchases((prev) =>
      prev.map((pur) => {
        if (pur.id === purchaseId) {
          const merged = { ...pur, ...updatedFields };
          merged.pendingAmount = Math.max(0, merged.totalAmount - merged.paidAmount);
          merged.paymentStatus = merged.paidAmount >= merged.totalAmount ? 'paid' : merged.paidAmount > 0 ? 'partial' : 'unpaid';
          return merged;
        }
        return pur;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        settings,
        invoices,
        inventory,
        purchases,
        customers,
        addOrUpdateCustomer,
        updateCustomer,
        deleteCustomer,
        isInstallable,
        isInstalled,
        isOffline,
        isVoiceSessionActive,
        setIsVoiceSessionActive,
        installPWA,
        authenticate,
        registerUser,
        logout,
        updateProfile,
        addUser,
        updateUser,
        deleteUser,
        renewSubscription,
        extendUserValidity,
        changeUserPlan,
        toggleUserStatus,
        updateSettings,
        setLanguage,
        addInvoice,
        deleteInvoice,
        getNextInvoiceNumber,
        addOrUpdateStock,
        updateProduct,
        deleteProduct,
        reduceStockForInvoice,
        addPurchase,
        recordPurchasePayment,
        deletePurchase,
        updatePurchase
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
