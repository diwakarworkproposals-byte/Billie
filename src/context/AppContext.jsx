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

const DEFAULT_INVOICES = [
  {
    id: 'inv_demo_today',
    invoiceNumber: 'INV-2026-003',
    customerName: 'Amit Sharma',
    customerEmail: 'amit.sharma@gmail.com',
    customerPhone: '+91 98101 23456',
    date: new Date().toLocaleDateString(),
    rawDate: new Date().toISOString().split('T')[0],
    product: 'T-Shirt, Leather Belt',
    quantity: 3,
    price: 1450,
    discount: 0,
    discountType: 'flat',
    subtotal: 1450,
    totalDiscount: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 1450,
    currency: '₹',
    items: [
      {
        name: 'T-Shirt',
        quantity: 2,
        price: 500,
        subtotal: 1000,
        lineDiscount: 0,
        lineTotal: 1000
      },
      {
        name: 'Leather Belt',
        quantity: 1,
        price: 450,
        subtotal: 450,
        lineDiscount: 0,
        lineTotal: 450
      }
    ]
  },
  {
    id: 'inv_demo_yesterday',
    invoiceNumber: 'INV-2026-002',
    customerName: 'Neha Verma',
    customerEmail: 'neha.v@yahoo.com',
    customerPhone: '+91 98991 99887',
    date: new Date(Date.now() - 86400000).toLocaleDateString(),
    rawDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    product: 'Jeans',
    quantity: 2,
    price: 1200,
    discount: 100,
    discountType: 'flat',
    subtotal: 2400,
    totalDiscount: 100,
    taxRate: 5,
    taxAmount: 115,
    total: 2415,
    currency: '₹',
    items: [
      {
        name: 'Jeans',
        quantity: 2,
        price: 1200,
        subtotal: 2400,
        lineDiscount: 100,
        lineTotal: 2300
      }
    ]
  },
  {
    id: 'inv_demo_1',
    invoiceNumber: 'INV-2026-001',
    customerName: 'Rajesh Enterprises',
    customerEmail: 'rajesh@enterprise.in',
    customerPhone: '+91 98711 22334',
    date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
    rawDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    product: 'Formal Shirt',
    quantity: 3,
    price: 900,
    discount: 100,
    discountType: 'flat',
    subtotal: 2700,
    totalDiscount: 100,
    taxRate: 5,
    taxAmount: 130,
    total: 2730,
    currency: '₹',
    items: [
      {
        name: 'Formal Shirt',
        quantity: 3,
        price: 900,
        subtotal: 2700,
        lineDiscount: 100,
        lineTotal: 2600
      }
    ]
  }
];

const DEFAULT_CUSTOMERS = [
  {
    id: 'cust_1',
    name: 'Amit Sharma',
    companyName: 'Sharma Garments',
    phone: '+91 98101 23456',
    email: 'amit.sharma@gmail.com',
    gstNumber: '07AAACS1429B1Z2',
    address: 'Sector 14, Gurugram, Haryana',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust_2',
    name: 'Neha Verma',
    companyName: '',
    phone: '+91 98991 99887',
    email: 'neha.v@yahoo.com',
    gstNumber: '',
    address: 'Lajpat Nagar, New Delhi',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'cust_3',
    name: 'Rajesh Enterprises',
    companyName: 'Rajesh Enterprises Pvt Ltd',
    phone: '+91 98711 22334',
    email: 'rajesh@enterprise.in',
    gstNumber: '07AAAAA0000A1Z5',
    address: 'Chandni Chowk, Delhi - 110006',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
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
      return saved ? JSON.parse(saved) : DEFAULT_INVOICES;
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

  // 7. Customers Database State
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('billie_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean).map((c, i) => ({
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
