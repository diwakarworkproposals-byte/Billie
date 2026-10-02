import React, { useState } from 'react';
import { useApp, SUBSCRIPTION_PLANS } from '../context/AppContext';
import {
  X,
  ShieldCheck,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Key,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2,
  Edit3,
  Phone,
  Building,
  Mail,
  Sparkles,
  Check,
  Clock,
  DollarSign,
  Lock,
  UserCheck
} from 'lucide-react';

export default function AdminDashboardModal({ isOpen, onClose }) {
  const {
    user,
    authenticate,
    users,
    addUser,
    updateUser,
    deleteUser,
    renewSubscription,
    toggleUserStatus,
    settings
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expired' | 'suspended'
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'monthly' | 'six_months'
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Admin Gate login state (when opened by a non-admin)
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPlanId, setNewPlanId] = useState('monthly');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit user state
  const [editingUser, setEditingUser] = useState(null);

  if (!isOpen) return null;

  const isHindi = settings.language === 'hi';
  const currency = settings.currency || '₹';
  const isAuthorizedAdmin = user.isLoggedIn && user.role === 'admin';

  const handleAdminGateLogin = (e) => {
    e.preventDefault();
    setAdminAuthError('');
    const res = authenticate(adminUsername, adminPassword);
    if (!res.success || !res.isAdmin) {
      setAdminAuthError(
        isHindi
          ? 'गलत एडमिन क्रेडेंशियल्स! केवल अधिकृत एडमिन ही एक्सेस कर सकते हैं।'
          : 'Invalid Admin Credentials! Only authorized admin can log in.'
      );
    }
  };

  // Toggle password visibility
  const togglePassVisibility = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyCredentials = (user) => {
    const secret = user.pin || user.password;
    const text = `Billie Login Details:\nLogin ID: ${user.phone || user.email}\n${user.pin ? '6-Digit PIN' : 'Password'}: ${secret}\nPlan: ${user.subscription?.planName || 'Pro'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setFormError(isHindi ? 'नाम, ईमेल और पासवर्ड लिखना ज़रूरी है!' : 'Name, Email, and Password are required!');
      return;
    }

    const res = addUser({
      name: newName,
      email: newEmail,
      password: newPassword,
      businessName: newBusinessName,
      phone: newPhone,
      address: newAddress,
      planId: newPlanId
    });

    if (!res.success) {
      setFormError(res.error);
    } else {
      setFormSuccess(
        isHindi
          ? `✓ यूजर "${res.user.name}" सफलतापूर्वक बन गया! आईडी: ${res.user.email}, पासवर्ड: ${res.user.password}`
          : `✓ User "${res.user.name}" created! ID: ${res.user.email}, Pass: ${res.user.password}`
      );
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewBusinessName('');
      setNewPhone('');
      setNewAddress('');
      setTimeout(() => {
        setIsAddFormOpen(false);
        setFormSuccess('');
      }, 2500);
    }
  };

  const handleSaveEditUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser.id, editingUser);
    setEditingUser(null);
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.businessName && u.businessName.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));

    const isExpired =
      u.subscription?.status === 'expired' ||
      new Date(u.subscription?.expiryDate) < new Date();
    const effectiveStatus = u.subscription?.status === 'suspended' ? 'suspended' : isExpired ? 'expired' : 'active';

    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    const matchesPlan = planFilter === 'all' || u.subscription?.planId === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Analytics Metrics
  const totalUsersCount = users.length;
  const activeSubsCount = users.filter((u) => {
    const isExp =
      u.subscription?.status === 'expired' ||
      new Date(u.subscription?.expiryDate) < new Date();
    return u.subscription?.status !== 'suspended' && !isExp;
  }).length;
  const expiredSubsCount = totalUsersCount - activeSubsCount;
  const totalGrossRevenue = users.reduce((sum, u) => sum + (Number(u.subscription?.totalPaid) || 0), 0);

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="m3-dialog-container admin-dialog animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        {/* Header */}
        <div className="dialog-header admin-dialog-header">
          <div className="dialog-title-group">
            <div className="flex items-center gap-2.5">
              <div className="admin-icon-pill">
                <ShieldCheck size={22} className="text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="admin-dialog-title" className="dialog-title">
                    {isHindi ? 'Billie एडमिन एवं सब्सक्रिप्शन पोर्टल' : 'Billie Admin & Subscription Portal'}
                  </h2>
                  <span className="admin-status-badge">
                    {isAuthorizedAdmin ? 'Super Admin: Diwakar' : 'Admin Login Required'}
                  </span>
                </div>
                <p className="dialog-subtitle">
                  {isHindi
                    ? 'यूजर आईडी/पासवर्ड बनाएं, क्रेडेंशियल्स मैनेज करें और ₹999/माह या ₹4,999/6 माह सब्सक्रिप्शन नियंत्रित करें'
                    : 'Manage user credentials, provisioning, and ₹999/mo or ₹4,999/6mo subscriptions'}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dialog-close-btn"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="dialog-body custom-scrollbar admin-body">
          {/* CASE A: Admin Gate - If current user is not logged in as Admin */}
          {!isAuthorizedAdmin ? (
            <div className="admin-auth-gate-container py-8 px-4 text-center flex flex-col items-center justify-center animate-fade-in">
              <div className="admin-icon-pill mb-3">
                <Lock size={30} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {isHindi ? 'एडमिन प्रमाणीकरण आवश्यक है' : 'Admin Authentication Required'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
                {isHindi
                  ? 'Billie एडमिन पोर्टल केवल अधिकृत एडमिन के लिए सुरक्षित है। कृपया अपने निर्धारित एडमिन क्रेडेंशियल्स दर्ज करें।'
                  : 'Billie Admin Portal is protected. Please enter the designated admin credentials to unlock.'}
              </p>

              {adminAuthError && (
                <div className="form-error-alert mb-4 max-w-sm w-full animate-slide-up">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <form onSubmit={handleAdminGateLogin} className="material-form max-w-sm w-full text-left">
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'यूजर नेम (User Name)' : 'User Name'}</label>
                  <div className="input-with-icon">
                    <UserCheck size={16} className="input-icon" />
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. Diwakar"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <div className="form-group mt-2">
                  <label className="form-label">{isHindi ? 'पासवर्ड (Password)' : 'Password'}</label>
                  <div className="input-with-icon">
                    <Key size={16} className="input-icon" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="m3-button-filled w-full mt-3 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={17} />
                  <span>{isHindi ? 'एडमिन पोर्टल अनलॉक करें' : 'Unlock Admin Portal'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* CASE B: Full Authorized Admin Dashboard */
            <>
              {/* 1. Stat Summary Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-card-icon bg-blue-100 dark:bg-blue-900/40 text-blue-600">
                    <Users size={20} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">{isHindi ? 'कुल रजिस्टर्ड यूजर्स' : 'Total Registered Users'}</span>
                    <span className="stat-card-val">{totalUsersCount}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-icon bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                    <CheckCircle size={20} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">{isHindi ? 'सक्रिय सब्सक्रिप्शन' : 'Active Subscriptions'}</span>
                    <span className="stat-card-val text-emerald-600">{activeSubsCount}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-icon bg-rose-100 dark:bg-rose-900/40 text-rose-600">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">{isHindi ? 'समाप्त / सस्पेंडेड' : 'Expired / Suspended'}</span>
                    <span className="stat-card-val text-rose-600">{expiredSubsCount}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-card-icon bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                    <DollarSign size={20} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">{isHindi ? 'कुल रेवेन्यू (GST सहित)' : 'Gross Revenue (+GST)'}</span>
                    <span className="stat-card-val text-blue-600">{currency}{totalGrossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* 2. Official Subscription Plans Banner */}
              <div className="admin-plans-banner">
                <div className="plans-banner-header">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    {isHindi ? 'आधिकारिक सब्सक्रिप्शन प्लान्स' : 'Standard Subscription Packages'}
                  </span>
                </div>
                <div className="plans-cards-row">
                  {/* Plan 1: Monthly */}
                  <div className="plan-summary-pill">
                    <div className="plan-badge-tag">Monthly Plan</div>
                    <div className="plan-pill-price">
                      <span className="text-xl font-extrabold">{currency}999</span>
                      <span className="text-xs text-slate-500"> + 18% GST ({currency}179.82)</span>
                    </div>
                    <span className="plan-total-billed font-bold text-slate-800 dark:text-slate-200">
                      = {currency}1,178.82 / mo (30 Days)
                    </span>
                  </div>

                  {/* Plan 2: 6 Months */}
                  <div className="plan-summary-pill featured">
                    <div className="plan-badge-tag popular">6-Months Super Saver</div>
                    <div className="plan-pill-price">
                      <span className="text-xl font-extrabold text-blue-600">{currency}4,999</span>
                      <span className="text-xs text-slate-500"> + 18% GST ({currency}899.82)</span>
                    </div>
                    <span className="plan-total-billed font-bold text-blue-700 dark:text-blue-300">
                      = {currency}5,898.82 / 6 Months (180 Days)
                    </span>
                    <span className="plan-saving-chip">Save {currency}1,074</span>
                  </div>
                </div>
              </div>

              {/* 3. Toolbar (Search, Filter, Add User toggle) */}
              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <Search size={16} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={isHindi ? 'यूजर नाम, ईमेल, बिज़नेस या फोन सर्च करें...' : 'Search by name, email, business, phone...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="admin-search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="admin-filter-group">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="all">{isHindi ? 'सभी स्थितियाँ (All)' : 'All Status'}</option>
                    <option value="active">{isHindi ? 'सक्रिय (Active)' : 'Active'}</option>
                    <option value="expired">{isHindi ? 'समाप्त (Expired)' : 'Expired'}</option>
                    <option value="suspended">{isHindi ? 'सस्पेंडेड (Suspended)' : 'Suspended'}</option>
                  </select>

                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="all">{isHindi ? 'सभी प्लान्स (All Plans)' : 'All Plans'}</option>
                    <option value="monthly">Monthly ({currency}999+GST)</option>
                    <option value="six_months">6-Months ({currency}4,999+GST)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                    className="m3-button-filled flex items-center gap-1.5 text-xs py-2 px-3.5"
                  >
                    <Plus size={16} />
                    <span>{isHindi ? 'नया यूजर जोड़ें' : 'Add User'}</span>
                  </button>
                </div>
              </div>

              {/* 4. Add New User Form Drawer */}
              {isAddFormOpen && (
                <form onSubmit={handleCreateUser} className="admin-add-user-drawer animate-slide-up">
                  <div className="drawer-header">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {isHindi ? 'नया यूजर और लॉगिन क्रेडेंशियल्स बनाएं' : 'Create New User & Assign Subscription'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {formError && (
                    <div className="form-error-alert mb-3">
                      <AlertTriangle size={15} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="form-success-alert mb-3">
                      <Check size={15} />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'यूजर का पूरा नाम *' : 'Full Name *'}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="m3-text-field"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'दुकान / बिज़नेस का नाम' : 'Business / Store Name'}</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh General Store"
                        value={newBusinessName}
                        onChange={(e) => setNewBusinessName(e.target.value)}
                        className="m3-text-field"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2 mt-2">
                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'लॉगिन आईडी (Email) *' : 'Login ID (Email Address) *'}</label>
                      <div className="input-with-icon">
                        <Mail size={16} className="input-icon" />
                        <input
                          type="email"
                          required
                          placeholder="merchant@store.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="m3-text-field"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="flex items-center justify-between">
                        <label className="form-label">{isHindi ? 'लॉगिन पासवर्ड *' : 'Login Password *'}</label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          {isHindi ? 'पासवर्ड ऑटो-जनरेट करें' : 'Auto-Generate'}
                        </button>
                      </div>
                      <div className="input-with-icon">
                        <Key size={16} className="input-icon" />
                        <input
                          type="text"
                          required
                          placeholder="SecretPass123"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="m3-text-field"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-2 mt-2">
                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'फोन नंबर (वैकल्पिक)' : 'Phone Number (Optional)'}</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="m3-text-field"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'सब्सक्रिप्शन प्लान असाइन करें *' : 'Assign Subscription Plan *'}</label>
                      <select
                        value={newPlanId}
                        onChange={(e) => setNewPlanId(e.target.value)}
                        className="m3-text-field"
                      >
                        <option value="monthly">
                          Monthly Plan — {currency}999 + 18% GST ({currency}1,178.82) • 30 Days
                        </option>
                        <option value="six_months">
                          6-Months Super Saver — {currency}4,999 + 18% GST ({currency}5,898.82) • 180 Days
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="m3-button-tonal text-xs py-2 px-3"
                    >
                      {isHindi ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="m3-button-filled text-xs py-2 px-4"
                    >
                      <CheckCircle size={15} />
                      <span>{isHindi ? 'यूजर बनाएं और एक्टिवेट करें' : 'Create User & Activate Plan'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 5. Users and Subscriptions List Table */}
              <div className="admin-table-wrapper">
                <table className="material-table admin-table">
                  <thead>
                    <tr>
                      <th>{isHindi ? 'यूजर / बिज़नेस' : 'User / Store'}</th>
                      <th>{isHindi ? 'लॉगिन क्रेडेंशियल्स' : 'Login Credentials'}</th>
                      <th>{isHindi ? 'सब्सक्रिप्शन प्लान' : 'Subscription'}</th>
                      <th className="text-center">{isHindi ? 'स्थिति' : 'Status'}</th>
                      <th>{isHindi ? 'वैधता (Validity)' : 'Validity & Expiry'}</th>
                      <th className="text-right">{isHindi ? 'सब्सक्रिप्शन एक्शन' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-slate-500">
                          <Users size={36} className="mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold">
                            {isHindi ? 'कोई यूजर नहीं मिला' : 'No users match your search criteria'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isVisible = visiblePasswords[u.id];
                        const isExpired =
                          u.subscription?.status === 'expired' ||
                          new Date(u.subscription?.expiryDate) < new Date();
                        const isSuspended = u.subscription?.status === 'suspended';

                        const expiryDate = new Date(u.subscription?.expiryDate);
                        const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

                        return (
                          <tr key={u.id} className={isExpired ? 'user-expired-row' : ''}>
                            {/* User & Business */}
                            <td>
                              <div className="user-info-box">
                                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  {u.name}
                                  {u.role === 'admin' && (
                                    <span className="admin-pill-tag">Admin</span>
                                  )}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Building size={12} />
                                  {u.businessName || 'Business Owner'}
                                </span>
                                {u.phone && (
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Phone size={11} />
                                    {u.phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Login Credentials */}
                            <td>
                              <div className="credentials-box">
                                <div className="flex items-center gap-1.5">
                                  <span className="cred-label">ID:</span>
                                  <code className="cred-val font-semibold">{u.phone || u.email}</code>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="cred-label">{u.pin ? 'PIN:' : 'Pass:'}</span>
                                  <code className="cred-val">
                                    {isVisible ? (u.pin || u.password) : '••••••'}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => togglePassVisibility(u.id)}
                                    className="cred-eye-btn"
                                    title={isVisible ? 'Hide PIN/Password' : 'Show PIN/Password'}
                                  >
                                    {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyCredentials(u)}
                                    className="cred-copy-btn"
                                    title="Copy ID & PIN to share with user"
                                  >
                                    {copiedId === u.id ? (
                                      <Check size={13} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Subscription Plan & GST */}
                            <td>
                              <div className="sub-plan-info">
                                <span className={`plan-badge ${u.subscription?.planId === 'six_months' ? 'six-months' : 'monthly'}`}>
                                  {u.subscription?.planId === 'six_months' ? '6-Months' : 'Monthly'}
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-300 font-bold mt-1">
                                  {currency}{u.subscription?.basePrice || (u.subscription?.planId === 'six_months' ? 4999 : 999)}
                                  <span className="font-normal text-slate-400"> + 18% GST</span>
                                </span>
                                <span className="text-xs text-slate-400">
                                  Total Paid: {currency}{u.subscription?.totalPaid ? Number(u.subscription?.totalPaid).toFixed(0) : '—'}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="text-center">
                              {isSuspended ? (
                                <span className="sub-status-pill suspended">
                                  {isHindi ? 'सस्पेंडेड' : 'Suspended'}
                                </span>
                              ) : isExpired ? (
                                <span className="sub-status-pill expired">
                                  {isHindi ? 'समाप्त' : 'Expired'}
                                </span>
                              ) : (
                                <span className="sub-status-pill active">
                                  {isHindi ? 'सक्रिय' : 'Active'}
                                </span>
                              )}
                            </td>

                            {/* Validity & Expiry */}
                            <td>
                              <div className="validity-box">
                                <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
                                  {expiryDate.toLocaleDateString()}
                                </span>
                                <span className={`days-countdown-tag ${diffDays <= 5 ? (diffDays <= 0 ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}`}>
                                  {diffDays > 0
                                    ? `${diffDays} ${isHindi ? 'दिन बाकी' : 'days left'}`
                                    : `${Math.abs(diffDays)} ${isHindi ? 'दिन पहले समाप्त' : 'days expired'}`}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="text-right">
                              <div className="admin-actions-cell justify-end">
                                {/* Renew Monthly (+1 mo) */}
                                <button
                                  type="button"
                                  onClick={() => renewSubscription(u.id, 'monthly')}
                                  className="renew-pill-btn"
                                  title={`Renew 1 Month (${currency}999 + 18% GST)`}
                                >
                                  <RefreshCw size={12} />
                                  <span>+1 Mo</span>
                                </button>

                                {/* Renew 6 Months (+6 mo) */}
                                <button
                                  type="button"
                                  onClick={() => renewSubscription(u.id, 'six_months')}
                                  className="renew-pill-btn featured"
                                  title={`Renew 6 Months (${currency}4,999 + 18% GST)`}
                                >
                                  <Sparkles size={12} />
                                  <span>+6 Mo</span>
                                </button>

                                {/* Status Toggle */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleUserStatus(
                                      u.id,
                                      isSuspended ? 'active' : 'suspended'
                                    )
                                  }
                                  className={`status-toggle-btn ${isSuspended ? 'btn-activate' : 'btn-suspend'}`}
                                  title={isSuspended ? 'Activate User' : 'Suspend User'}
                                >
                                  {isSuspended ? (isHindi ? 'एक्टिव करें' : 'Activate') : (isHindi ? 'रोकें' : 'Suspend')}
                                </button>

                                {/* Edit User Modal Trigger */}
                                <button
                                  type="button"
                                  onClick={() => setEditingUser(u)}
                                  className="admin-edit-btn"
                                  title="Edit user details"
                                >
                                  <Edit3 size={15} />
                                </button>

                                {/* Delete User */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const confirmMsg = isHindi
                                      ? `क्या आप सच में "${u.name}" को हटाना चाहते हैं?`
                                      : `Delete user "${u.name}"?`;
                                    if (window.confirm(confirmMsg)) {
                                      deleteUser(u.id);
                                    }
                                  }}
                                  className="admin-delete-btn"
                                  title="Delete user"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 6. Edit User Modal Subdialog */}
              {editingUser && (
                <div className="subdialog-backdrop">
                  <div className="subdialog-card animate-scale-up">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {isHindi ? 'यूजर विवरण एडिट करें' : 'Edit User & Credentials'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditUser} className="material-form">
                      <div className="form-group">
                        <label className="form-label">{isHindi ? 'नाम' : 'Full Name'}</label>
                        <input
                          type="text"
                          required
                          value={editingUser.name}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, name: e.target.value })
                          }
                          className="m3-text-field"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">{isHindi ? 'लॉगिन आईडी (Email)' : 'Login ID (Email)'}</label>
                        <input
                          type="email"
                          required
                          value={editingUser.email}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, email: e.target.value })
                          }
                          className="m3-text-field"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">{isHindi ? 'लॉगिन पासवर्ड' : 'Password'}</label>
                        <input
                          type="text"
                          required
                          value={editingUser.password}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, password: e.target.value })
                          }
                          className="m3-text-field"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">{isHindi ? 'दुकान / बिज़नेस का नाम' : 'Business Name'}</label>
                        <input
                          type="text"
                          value={editingUser.businessName || ''}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, businessName: e.target.value })
                          }
                          className="m3-text-field"
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="m3-button-tonal text-xs py-2 px-3"
                        >
                          {isHindi ? 'रद्द करें' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="m3-button-filled text-xs py-2 px-4"
                        >
                          <Check size={15} />
                          <span>{isHindi ? 'सेव करें' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="dialog-footer admin-dialog-footer">
          <div className="admin-footer-notes">
            <span>
              {isAuthorizedAdmin
                ? (isHindi
                    ? 'एडमिन सेशन सक्रिय है (Diwakar)। किसी भी यूजर के "Copy" बटन पर क्लिक करके उनके लॉगिन आईडी और पासवर्ड ग्राहक को शेयर करें।'
                    : 'Admin session active (Diwakar). Click "Copy" on any user to copy their credentials for customer dispatch.')
                : (isHindi
                    ? 'कृपया एडमिन क्रेडेंशियल्स (यूजर नेम: Diwakar / पासवर्ड: Diwakar@123) से अनलॉक करें।'
                    : 'Please authenticate with User Name: Diwakar & Password to unlock.')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="m3-button-filled"
          >
            <span>{isHindi ? 'पूर्ण (Done)' : 'Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
