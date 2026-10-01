import React, { useState } from 'react';
import { useApp, SUBSCRIPTION_PLANS } from '../context/AppContext';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
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
  Lock,
  UserCheck,
  ArrowLeft,
  Store,
  LogOut,
  TrendingUp,
  UserPlus,
  X,
  LayoutGrid,
  Table as TableIcon,
  Gift,
  Zap,
  Plus
} from 'lucide-react';

export default function AdminDashboardPage({ onBackToStore }) {
  const {
    user,
    authenticate,
    logout,
    users,
    addUser,
    updateUser,
    deleteUser,
    renewSubscription,
    extendUserValidity,
    changeUserPlan,
    toggleUserStatus,
    settings
  } = useApp();

  const [userCategoryTab, setUserCategoryTab] = useState('all'); // 'all' | 'free' | 'paid' | 'expired'
  const [extendingUser, setExtendingUser] = useState(null);
  const [customExtendDate, setCustomExtendDate] = useState('');
  const [changingPlanUser, setChangingPlanUser] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('monthly');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expired' | 'suspended'
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'monthly' | 'six_months'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Admin Gate login state (when not authenticated as admin)
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
  const [editShowPass, setEditShowPass] = useState(false);

  const isHindi = settings.language === 'hi';
  const currency = '₹';
  const isAuthorizedAdmin = user.isLoggedIn && user.role === 'admin';

  const handleAdminGateLogin = (e) => {
    e.preventDefault();
    setAdminAuthError('');
    const res = authenticate(adminUsername, adminPassword);
    if (!res.success || !res.isAdmin) {
      setAdminAuthError(
        isHindi
          ? 'गलत एडमिन क्रेडेंशियल्स! केवल अधिकृत एडमिन (Diwakar / Diwakar@123) ही एक्सेस कर सकते हैं।'
          : 'Invalid credentials! Only authorized admin (Diwakar / Diwakar@123) can access.'
      );
    }
  };

  const togglePassVisibility = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyCredentials = (userObj) => {
    const text = `Billie Login Details:\nLogin ID: ${userObj.email}\nPassword: ${userObj.password}\nPlan: ${userObj.subscription?.planName || 'Pro'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(userObj.id);
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

  const generateRandomPasswordForEdit = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (editingUser) {
      setEditingUser({ ...editingUser, password: pass });
    }
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

  const handleOpenEditUser = (u) => {
    setEditingUser({
      id: u.id,
      name: u.name,
      businessName: u.businessName || '',
      phone: u.phone || '',
      address: u.address || '',
      email: u.email,
      password: u.password,
      role: u.role || 'user',
      subscription: {
        planId: u.subscription?.planId || 'monthly',
        status: u.subscription?.status || 'active',
        expiryDate: u.subscription?.expiryDate
          ? new Date(u.subscription.expiryDate).toISOString().split('T')[0]
          : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        totalPaid: u.subscription?.totalPaid || 1178.82,
        basePrice: u.subscription?.basePrice || 999
      }
    });
    setEditShowPass(false);
  };

  const handleSaveEditUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const plan = SUBSCRIPTION_PLANS[editingUser.subscription?.planId] || SUBSCRIPTION_PLANS.monthly;
    const expiryIso = new Date(editingUser.subscription?.expiryDate || Date.now()).toISOString();

    const updatedUserObj = {
      ...editingUser,
      name: editingUser.name.trim(),
      email: editingUser.email.trim(),
      password: editingUser.password.trim(),
      businessName: editingUser.businessName.trim(),
      phone: editingUser.phone.trim(),
      address: editingUser.address.trim(),
      subscription: {
        ...editingUser.subscription,
        planName: `${plan.name} (₹${plan.basePrice} + ${plan.gstRate}% GST)`,
        basePrice: plan.basePrice,
        gstRate: plan.gstRate,
        gstAmount: plan.gstAmount,
        expiryDate: expiryIso,
        status: editingUser.subscription.status
      }
    };

    updateUser(editingUser.id, updatedUserObj);
    setEditingUser(null);
  };

  // Helper categorization functions for All, Free, Paid, Expired users
  const isUserExpired = (u) => {
    if (u.role === 'admin') return false;
    return (
      u.subscription?.status === 'expired' ||
      (u.subscription?.expiryDate && new Date(u.subscription.expiryDate) < new Date())
    );
  };

  const isUserFree = (u) => {
    if (u.role === 'admin') return false;
    return (
      u.subscription?.planId === 'free' ||
      Number(u.subscription?.basePrice || 0) === 0
    );
  };

  const isUserPaid = (u) => {
    if (u.role === 'admin') return false;
    return (
      !isUserFree(u) &&
      !isUserExpired(u) &&
      u.subscription?.status !== 'suspended'
    );
  };

  // Metrics for report
  const allCount = users.length;
  const freeCount = users.filter(isUserFree).length;
  const paidCount = users.filter(isUserPaid).length;
  const expiredCount = users.filter(isUserExpired).length;
  const totalGrossRevenue = users.reduce((sum, u) => sum + (Number(u.subscription?.totalPaid) || 0), 0);

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.businessName && u.businessName.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));

    // Category filter: all | free | paid | expired
    let matchesCategory = true;
    if (userCategoryTab === 'free') {
      matchesCategory = isUserFree(u);
    } else if (userCategoryTab === 'paid') {
      matchesCategory = isUserPaid(u);
    } else if (userCategoryTab === 'expired') {
      matchesCategory = isUserExpired(u);
    }

    const isExpired = isUserExpired(u);
    const effectiveStatus = u.subscription?.status === 'suspended' ? 'suspended' : isExpired ? 'expired' : 'active';

    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    const matchesPlan = planFilter === 'all' || u.subscription?.planId === planFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPlan;
  });

  return (
    <div className="admin-page-viewport animate-fade-in bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100">
      {/* 1. TOP STANDALONE ADMIN HEADER (100% RESPONSIVE) */}
      <header className="admin-standalone-header">
        <div className="admin-nav-left">
          <button
            type="button"
            onClick={onBackToStore}
            className="admin-back-btn m3-ripple"
            title={isHindi ? 'Billie स्टोर ऐप पर वापस जाएं' : 'Back to Billie Store'}
          >
            <ArrowLeft size={16} />
            <span className="back-btn-text">{isHindi ? 'वापस' : 'Back'}</span>
          </button>

          <div className="admin-brand-cluster">
            <div className="admin-brand-icon">
              <ShieldCheck size={20} className="text-amber-500" />
            </div>
            <div className="admin-brand-info">
              <div className="admin-brand-title-wrap">
                <span className="admin-brand-title">Billie Admin</span>
                <span className="admin-badge-super">Diwakar Edition</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-nav-right">
          {isAuthorizedAdmin && (
            <div className="admin-user-pill">
              <div className="admin-avatar-small">
                <span>D</span>
              </div>
              <div className="admin-user-info-text">
                <span className="admin-user-name">Diwakar</span>
                <span className="admin-user-role">Super Admin</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              if (onBackToStore) onBackToStore();
            }}
            className="admin-logout-btn m3-ripple"
            title="Log Out"
          >
            <LogOut size={15} />
            <span className="logout-btn-text">{isHindi ? 'लॉग आउट' : 'Log Out'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN ADMIN PAGE BODY */}
      <div className="admin-page-scrollable-container custom-scrollbar bg-slate-50 dark:bg-[#0b0f19]">
        {/* CASE A: If user is not authenticated as Diwakar, show dedicated full-page Login Gate */}
        {!isAuthorizedAdmin ? (
          <div className="admin-fullpage-gate-wrapper">
            <div className="admin-gate-box animate-scale-up">
              <div className="admin-gate-icon">
                <Lock size={36} className="text-amber-500" />
              </div>
              <h2 className="admin-gate-heading">
                {isHindi ? 'सुपर एडमिन प्रमाणीकरण' : 'Super Admin Authentication'}
              </h2>
              <p className="admin-gate-subheading">
                {isHindi
                  ? 'यह पेज केवल अधिकृत सुपर एडमिन के लिए सुरक्षित है। कृपया अपने निर्धारित यूजर नेम और पासवर्ड से लॉगिन करें।'
                  : 'This portal is restricted to authorized super admin. Please enter your credentials to manage users and subscriptions.'}
              </p>

              {adminAuthError && (
                <div className="form-error-alert mb-4 w-full animate-slide-up">
                  <AlertTriangle size={16} />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <form onSubmit={handleAdminGateLogin} className="material-form w-full text-left">
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'यूजर नेम (User Name)' : 'User Name'}</label>
                  <div className="input-with-icon">
                    <UserCheck size={18} className="input-icon" />
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

                <div className="form-group mt-3">
                  <label className="form-label">{isHindi ? 'पासवर्ड (Password)' : 'Password'}</label>
                  <div className="input-with-icon">
                    <Key size={18} className="input-icon" />
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
                  className="m3-button-filled w-full mt-4"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                >
                  <ShieldCheck size={18} />
                  <span>{isHindi ? 'एडमिन पोर्टल अनलॉक करें' : 'Unlock Super Admin Portal'}</span>
                </button>
              </form>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--md-outline-variant)' }}>
                <button
                  type="button"
                  onClick={onBackToStore}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isHindi ? '← वापस Billie स्टोर पर लौटें' : '← Return to Billie Billing App'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CASE B: Full Page Unlocked Admin Dashboard */
          <div className="admin-page-main-layout">
            {/* Top Stat Metrics Grid */}
            <div className="admin-metrics-row">
              <div
                className={`admin-metric-card clickable ${userCategoryTab === 'all' ? 'active-border' : ''}`}
                onClick={() => setUserCategoryTab('all')}
                title={isHindi ? 'सभी यूजर्स देखें' : 'View All Users'}
              >
                <div className="metric-icon-box users">
                  <Users size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'कुल यूजर्स' : 'Total Users'}</span>
                  <span className="metric-number">{allCount}</span>
                </div>
              </div>

              <div
                className={`admin-metric-card clickable ${userCategoryTab === 'free' ? 'active-border' : ''}`}
                onClick={() => setUserCategoryTab('free')}
                title={isHindi ? 'फ्री ट्रायल यूजर्स देखें' : 'View Free Users'}
              >
                <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                  <Gift size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'फ्री यूजर्स' : 'Free Users'}</span>
                  <span className="metric-number text-blue">{freeCount}</span>
                </div>
              </div>

              <div
                className={`admin-metric-card clickable ${userCategoryTab === 'paid' ? 'active-border' : ''}`}
                onClick={() => setUserCategoryTab('paid')}
                title={isHindi ? 'पेड यूजर्स देखें' : 'View Paid Users'}
              >
                <div className="metric-icon-box active">
                  <CheckCircle size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'पेड यूजर्स' : 'Paid Users'}</span>
                  <span className="metric-number text-emerald">{paidCount}</span>
                </div>
              </div>

              <div
                className={`admin-metric-card clickable ${userCategoryTab === 'expired' ? 'active-border' : ''}`}
                onClick={() => setUserCategoryTab('expired')}
                title={isHindi ? 'समाप्त वैधता यूजर्स देखें' : 'View Expired Users'}
              >
                <div className="metric-icon-box expired">
                  <AlertTriangle size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'समाप्त यूजर्स' : 'Expired Users'}</span>
                  <span className="metric-number text-rose">{expiredCount}</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon-box revenue">
                  <TrendingUp size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'कुल रेवेन्यू' : 'Gross Revenue'}</span>
                  <span className="metric-number text-blue">
                    {currency}{totalGrossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Subscription Plans Banner (Material 3 Cards) */}
            <div className="admin-plans-horizontal-card">
              <div className="plans-horizontal-header">
                <div className="plans-header-left">
                  <CreditCard size={18} className="text-blue-500" />
                  <h3 className="plans-title-text">
                    {isHindi ? 'आधिकारिक Billie सब्सक्रिप्शन पैकेज (18% GST सहित)' : 'Official Billie Subscription Packages (Inclusive of 18% GST)'}
                  </h3>
                </div>
                <span className="plans-subtitle-text">
                  {isHindi ? 'हर नए यूजर को इन दोनों में से एक प्लान असाइन किया जाता है' : 'Assign either plan to newly provisioned users'}
                </span>
              </div>

              <div className="plans-horizontal-grid">
                <div className="plan-detail-card">
                  <div className="plan-header-row">
                    <span className="plan-title">Monthly Pro Plan</span>
                    <span className="plan-duration-badge">30 {isHindi ? 'दिन वैधता' : 'Days'}</span>
                  </div>
                  <div className="plan-pricing-line">
                    <span className="plan-main-price">{currency}999</span>
                    <span className="plan-gst-text"> + 18% GST ({currency}179.82)</span>
                  </div>
                  <div className="plan-total-highlight">
                    = {currency}1,178.82 {isHindi ? 'कुल देय / माह' : 'Total Billed / Month'}
                  </div>
                </div>

                <div className="plan-detail-card featured-saver">
                  <div className="plan-header-row">
                    <span className="plan-title flex-title">
                      <Sparkles size={14} />
                      <span>6-Months Super Saver</span>
                    </span>
                    <div className="badges-group">
                      <span className="save-pill">{isHindi ? 'बचत' : 'Save'} {currency}1,074</span>
                      <span className="plan-duration-badge saver">180 {isHindi ? 'दिन वैधता' : 'Days'}</span>
                    </div>
                  </div>
                  <div className="plan-pricing-line">
                    <span className="plan-main-price text-blue">{currency}4,999</span>
                    <span className="plan-gst-text"> + 18% GST ({currency}899.82)</span>
                  </div>
                  <div className="plan-total-highlight text-blue">
                    = {currency}5,898.82 {isHindi ? 'कुल देय / 6 माह' : 'Total Billed / 6 Months'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PROMINENT & EXPANDED USER LIST MANAGEMENT SECTION */}
            <section className="admin-large-user-list-section">
              {/* Category Reports Tab Pills Bar (Requirement 4) */}
              <div className="admin-report-tabs-bar">
                <button
                  type="button"
                  onClick={() => setUserCategoryTab('all')}
                  className={`admin-report-tab-pill ${userCategoryTab === 'all' ? 'active' : ''}`}
                >
                  <Users size={14} />
                  <span>{isHindi ? 'सभी यूजर्स' : 'All Users'}</span>
                  <span className="admin-tab-count-badge">{allCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserCategoryTab('free')}
                  className={`admin-report-tab-pill ${userCategoryTab === 'free' ? 'active' : ''}`}
                >
                  <Gift size={14} />
                  <span>{isHindi ? 'फ्री ट्रायल यूजर्स' : 'Free Users'}</span>
                  <span className="admin-tab-count-badge">{freeCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserCategoryTab('paid')}
                  className={`admin-report-tab-pill ${userCategoryTab === 'paid' ? 'active' : ''}`}
                >
                  <Zap size={14} />
                  <span>{isHindi ? 'पेड यूजर्स' : 'Paid Users'}</span>
                  <span className="admin-tab-count-badge">{paidCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserCategoryTab('expired')}
                  className={`admin-report-tab-pill ${userCategoryTab === 'expired' ? 'active' : ''}`}
                >
                  <AlertTriangle size={14} />
                  <span>{isHindi ? 'समाप्त वैधता' : 'Expired Users'}</span>
                  <span className="admin-tab-count-badge">{expiredCount}</span>
                </button>
              </div>

              {/* Section Header & Search / Add Action Bar */}
              <div className="user-list-header-bar">
                <div className="user-list-heading-group">
                  <div className="user-icon-badge">
                    <Users size={22} />
                  </div>
                  <div>
                    <h2 className="user-list-title">
                      {isHindi ? 'यूजर अकाउंट्स एवं सब्सक्रिप्शन लिस्ट' : 'User Accounts & Subscription Registry'}
                    </h2>
                    <p className="user-list-subtitle">
                      {isHindi
                        ? `कुल ${users.length} यूजर्स पंजीकृत हैं। यहाँ से क्रेडेंशियल्स देखें/कॉपी करें और प्लान मैनेज करें।`
                        : `Manage all ${users.length} registered users. View/copy credentials, extend validity and assign plans.`}
                    </p>
                  </div>
                </div>

                {/* Filter and Add Controls Toolbar */}
                <div className="user-list-actions-bar">
                  <div className="user-search-input-box">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder={isHindi ? 'नाम, ईमेल, दुकान या फोन से खोजें...' : 'Search by name, email, store or phone...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="large-search-field"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="search-clear-btn"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="admin-filters-row">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="admin-select-filter"
                    >
                      <option value="all">{isHindi ? 'सभी स्थिति (All Status)' : 'All Status'}</option>
                      <option value="active">{isHindi ? 'सक्रिय (Active)' : 'Active'}</option>
                      <option value="expired">{isHindi ? 'समाप्त (Expired)' : 'Expired'}</option>
                      <option value="suspended">{isHindi ? 'सस्पेंडेड (Suspended)' : 'Suspended'}</option>
                    </select>

                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      className="admin-select-filter"
                    >
                      <option value="all">{isHindi ? 'सभी प्लान्स (All Plans)' : 'All Plans'}</option>
                      <option value="free">{isHindi ? 'फ्री ट्रायल (14 Days)' : 'Free Trial'}</option>
                      <option value="monthly">Monthly ({currency}999+GST)</option>
                      <option value="six_months">6-Months ({currency}4,999+GST)</option>
                      <option value="annual">Annual ({currency}8,999+GST)</option>
                    </select>

                    {/* View Switcher (Cards vs Table on wide screens) */}
                    <div className="admin-view-toggle">
                      <button
                        type="button"
                        onClick={() => setViewMode('cards')}
                        className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                        title="Card View"
                      >
                        <LayoutGrid size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                        title="Table View"
                      >
                        <TableIcon size={15} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                      className="add-new-user-button m3-ripple"
                    >
                      <UserPlus size={16} />
                      <span>{isHindi ? 'नया यूजर जोड़ें' : 'Add New User'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Add New User Collapsible Drawer */}
              {isAddFormOpen && (
                <form onSubmit={handleCreateUser} className="admin-add-user-full-card animate-slide-up">
                  <div className="form-card-header">
                    <div className="form-card-title-group">
                      <Sparkles size={18} className="text-amber-500" />
                      <h4 className="form-card-title">
                        {isHindi ? 'नया यूजर पंजीकृत करें और आईडी/पासवर्ड बनाएं' : 'Create New User & Provision Credentials'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="dialog-close-btn"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {formError && (
                    <div className="form-error-alert mb-4">
                      <AlertTriangle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="form-success-alert mb-4">
                      <Check size={16} />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'यूजर का नाम *' : 'Full Name *'}</label>
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
                      <label className="form-label">{isHindi ? 'दुकान / फर्म का नाम' : 'Business / Store Name'}</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Textiles"
                        value={newBusinessName}
                        onChange={(e) => setNewBusinessName(e.target.value)}
                        className="m3-text-field"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'फोन नंबर (वैकल्पिक)' : 'Phone Number'}</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="m3-text-field"
                      />
                    </div>
                  </div>

                  <div className="form-grid-3 mt-3">
                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'लॉगिन आईडी (Email) *' : 'Login ID (Email Address) *'}</label>
                      <div className="input-with-icon">
                        <Mail size={16} className="input-icon" />
                        <input
                          type="email"
                          required
                          placeholder="ramesh@textiles.in"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="m3-text-field"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="form-label-row">
                        <label className="form-label">{isHindi ? 'लॉगिन पासवर्ड *' : 'Login Password *'}</label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-action-link"
                        >
                          {isHindi ? '🎲 ऑटो-जनरेट' : 'Auto-Generate'}
                        </button>
                      </div>
                      <div className="input-with-icon">
                        <Key size={16} className="input-icon" />
                        <input
                          type="text"
                          required
                          placeholder="SecretPassword123"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="m3-text-field font-mono"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{isHindi ? 'सब्सक्रिप्शन प्लान असाइन करें *' : 'Assign Subscription Plan *'}</label>
                      <select
                        value={newPlanId}
                        onChange={(e) => setNewPlanId(e.target.value)}
                        className="m3-text-field"
                      >
                        <option value="free">
                          {isHindi ? '14-दिन फ्री ट्रायल — ₹0 • 14 Days' : '14-Days Free Trial — ₹0 • 14 Days'}
                        </option>
                        <option value="monthly">
                          Monthly Plan — {currency}999 + 18% GST ({currency}1,178.82) • 30 Days
                        </option>
                        <option value="six_months">
                          6-Months Super Saver — {currency}4,999 + 18% GST ({currency}5,898.82) • 180 Days
                        </option>
                        <option value="annual">
                          Annual Pro — {currency}8,999 + 18% GST ({currency}10,618.82) • 365 Days
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <label className="form-label">{isHindi ? 'दुकान / बिलिंग पता (वैकल्पिक)' : 'Store Address (Optional)'}</label>
                    <input
                      type="text"
                      placeholder="e.g. Shop #12, Cloth Market, Gandhinagar, Delhi"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="m3-text-field"
                    />
                  </div>

                  <div className="form-actions-footer">
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="m3-button-tonal"
                    >
                      {isHindi ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="m3-button-filled"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle size={16} />
                      <span>{isHindi ? 'यूजर बनाएं और एक्टिवेट करें' : 'Create User & Activate Plan'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* EMPTY STATE */}
              {filteredUsers.length === 0 ? (
                <div className="admin-empty-state">
                  <Users size={48} className="empty-icon" />
                  <h4 className="empty-title">
                    {isHindi ? 'कोई यूजर नहीं मिला' : 'No matching users found'}
                  </h4>
                  <p className="empty-desc">
                    {isHindi
                      ? 'नया यूजर जोड़ने के लिए ऊपर दिए गए "नया यूजर जोड़ें" बटन का उपयोग करें।'
                      : 'Click "Add New User" above to create an account.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* VIEW A: MATERIAL 3 USER CARDS (100% RESPONSIVE ON ALL MOBILES & TABLETS) */}
                  {viewMode === 'cards' && (
                    <div className="m3-admin-user-cards-grid">
                      {filteredUsers.map((u) => {
                        const isVisible = visiblePasswords[u.id];
                        const isExpired =
                          u.subscription?.status === 'expired' ||
                          new Date(u.subscription?.expiryDate) < new Date();
                        const isSuspended = u.subscription?.status === 'suspended';

                        const expiryDate = new Date(u.subscription?.expiryDate);
                        const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

                        return (
                          <div
                            key={u.id}
                            className={`m3-admin-user-card ${isExpired ? 'expired-border' : isSuspended ? 'suspended-border' : 'active-border'}`}
                          >
                            {/* Card Header: Avatar, Name, Firm, Role & Status Badge */}
                            <div className="card-top-row">
                              <div className="user-profile-summary">
                                <div className="admin-user-avatar-m3">
                                  <span>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</span>
                                </div>
                                <div className="user-names-box">
                                  <div className="name-badge-row">
                                    <h4 className="user-title-name">{u.name}</h4>
                                    {u.role === 'admin' ? (
                                      <span className="admin-pill-tag">Admin</span>
                                    ) : (
                                      <span className="user-pill-tag">User</span>
                                    )}
                                  </div>
                                  <p className="store-name-text">
                                    <Building size={12} className="text-amber-500" />
                                    <span>{u.businessName || 'Business Owner'}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="status-badge-wrap">
                                {isSuspended ? (
                                  <span className="m3-badge-status-admin suspended">
                                    <span className="status-dot amber" />
                                    {isHindi ? 'सस्पेंडेड' : 'Suspended'}
                                  </span>
                                ) : isExpired ? (
                                  <span className="m3-badge-status-admin expired">
                                    <span className="status-dot red" />
                                    {isHindi ? 'समाप्त' : 'Expired'}
                                  </span>
                                ) : (
                                  <span className="m3-badge-status-admin active">
                                    <span className="status-dot green" />
                                    {isHindi ? 'सक्रिय' : 'Active'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Contact & Registration Strip */}
                            <div className="m3-user-contact-strip">
                              {u.phone && (
                                <a href={`tel:${u.phone}`} className="contact-item">
                                  <Phone size={12} className="text-blue-500" />
                                  <span>{u.phone}</span>
                                </a>
                              )}
                              <span className="contact-item">
                                <Mail size={12} className="text-slate-400" />
                                <span className="truncate-text">{u.email}</span>
                              </span>
                              {u.address && (
                                <span className="contact-item store-address" title={u.address}>
                                  <Store size={12} className="text-indigo-400" />
                                  <span className="truncate-text">{u.address}</span>
                                </span>
                              )}
                            </div>

                            {/* Login Credentials Box (Material Outlined Container) */}
                            <div className="m3-credentials-box-modern">
                              <div className="creds-box-header">
                                <span className="creds-title">
                                  <Key size={12} className="text-amber-500" />
                                  {isHindi ? 'लॉगिन क्रेडेंशियल्स' : 'Login Credentials'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyCredentials(u)}
                                  className="m3-copy-creds-btn"
                                  title="Copy Login ID & Password"
                                >
                                  {copiedId === u.id ? (
                                    <>
                                      <Check size={12} className="text-emerald-500" />
                                      <span className="text-emerald-600">{isHindi ? 'कॉपी हो गया!' : 'Copied!'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>{isHindi ? 'क्रेडेंशियल्स कॉपी' : 'Copy'}</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="creds-grid">
                                <div className="cred-tile">
                                  <span className="cred-lbl">ID:</span>
                                  <code className="cred-val font-mono">{u.email}</code>
                                </div>
                                <div className="cred-tile">
                                  <span className="cred-lbl">PASS:</span>
                                  <div className="cred-pass-group">
                                    <code className="cred-val font-mono font-bold">
                                      {isVisible ? u.password : '••••••••'}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => togglePassVisibility(u.id)}
                                      className="eye-icon-btn"
                                      title={isVisible ? 'Hide Password' : 'Show Password'}
                                    >
                                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Subscription Plan & Validity Details */}
                            <div className="m3-subscription-box-modern">
                              <div className="sub-box-content">
                                <div className="sub-plan-info">
                                  <span className={`m3-plan-chip ${u.subscription?.planId === 'six_months' ? 'six-months' : 'monthly'}`}>
                                    {u.subscription?.planId === 'six_months' ? '⭐ 6-Months Saver' : 'Monthly Pro'}
                                  </span>
                                  <span className="sub-pricing-text">
                                    ₹{u.subscription?.basePrice || (u.subscription?.planId === 'six_months' ? 4999 : 999)}
                                    <span className="sub-gst-note"> + 18% GST</span>
                                  </span>
                                </div>

                                <div className="sub-validity-info">
                                  <span className={`days-countdown-pill ${diffDays <= 5 ? (diffDays <= 0 ? 'expired' : 'soon') : 'valid'}`}>
                                    {diffDays > 0
                                      ? `⏱️ ${diffDays} ${isHindi ? 'दिन बाकी' : 'days left'}`
                                      : `⚠️ ${Math.abs(diffDays)} ${isHindi ? 'दिन पहले समाप्त' : 'days expired'}`}
                                  </span>
                                  <span className="expiry-date-text">
                                    {isHindi ? 'वैधता:' : 'Expires:'} {expiryDate.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="m3-card-footer-action-row">
                              <div className="actions-left-group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExtendingUser(u);
                                    setCustomExtendDate('');
                                  }}
                                  className="m3-btn-sub-renew"
                                  style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', fontWeight: 700 }}
                                  title={isHindi ? 'वैधता बढ़ाएं' : 'Extend Subscription Validity'}
                                >
                                  <Clock size={12} />
                                  <span>{isHindi ? 'वैधता' : 'Extend'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setChangingPlanUser(u);
                                    setSelectedPlanId(u.subscription?.planId || 'monthly');
                                  }}
                                  className="m3-btn-sub-renew"
                                  style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: 700 }}
                                  title={isHindi ? 'प्लान बदलें / जोड़ें' : 'Change or Assign Plan'}
                                >
                                  <Zap size={12} />
                                  <span>{isHindi ? 'प्लान' : 'Plan'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => renewSubscription(u.id, 'monthly')}
                                  className="m3-btn-sub-renew"
                                  title={`Renew +1 Month (${currency}999 + 18% GST)`}
                                >
                                  <RefreshCw size={12} />
                                  <span>+1 Mo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => renewSubscription(u.id, 'six_months')}
                                  className="m3-btn-sub-renew featured"
                                  title={`Renew +6 Months (${currency}4,999 + 18% GST)`}
                                >
                                  <Sparkles size={12} />
                                  <span>+6 Mo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleUserStatus(
                                      u.id,
                                      isSuspended ? 'active' : 'suspended'
                                    )
                                  }
                                  className={`m3-btn-status-toggle ${isSuspended ? 'activate' : 'suspend'}`}
                                >
                                  {isSuspended ? (isHindi ? 'एक्टिव' : 'Activate') : (isHindi ? 'रोकें' : 'Suspend')}
                                </button>
                              </div>

                              <div className="actions-right-group">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="m3-btn-edit-user"
                                  title={isHindi ? 'यूजर व सब्सक्रिप्शन विवरण एडिट करें' : 'Edit User & Subscription'}
                                >
                                  <Edit3 size={13} />
                                  <span>{isHindi ? 'एडिट' : 'Edit'}</span>
                                </button>

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
                                  className="m3-del-icon-btn"
                                  title="Delete User"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VIEW B: WIDE TABLE VIEW (AVAILABLE ON LARGE SCREENS) */}
                  {viewMode === 'table' && (
                    <div className="large-table-container">
                      <table className="spacious-admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: '25%' }}>{isHindi ? 'यूजर एवं दुकान' : 'User / Store'}</th>
                            <th style={{ width: '22%' }}>{isHindi ? 'लॉगिन क्रेडेंशियल्स' : 'Login Credentials'}</th>
                            <th style={{ width: '18%' }}>{isHindi ? 'सब्सक्रिप्शन प्लान' : 'Subscription'}</th>
                            <th className="text-center" style={{ width: '10%' }}>{isHindi ? 'स्थिति' : 'Status'}</th>
                            <th style={{ width: '13%' }}>{isHindi ? 'वैधता (Validity)' : 'Validity'}</th>
                            <th className="text-right" style={{ width: '12%' }}>{isHindi ? 'एक्शन' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => {
                            const isVisible = visiblePasswords[u.id];
                            const isExpired =
                              u.subscription?.status === 'expired' ||
                              new Date(u.subscription?.expiryDate) < new Date();
                            const isSuspended = u.subscription?.status === 'suspended';

                            const expiryDate = new Date(u.subscription?.expiryDate);
                            const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

                            return (
                              <tr key={u.id} className={`user-row-spacious ${isExpired ? 'row-expired' : ''}`}>
                                <td>
                                  <div className="user-cell-content">
                                    <div className="user-avatar-circle">
                                      <span>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</span>
                                    </div>
                                    <div className="user-text-details">
                                      <div className="name-badge-row">
                                        <span className="user-primary-name">{u.name}</span>
                                        {u.role === 'admin' ? (
                                          <span className="admin-pill-tag">Admin</span>
                                        ) : (
                                          <span className="user-pill-tag">User</span>
                                        )}
                                      </div>
                                      <span className="user-firm-name">
                                        <Building size={13} className="text-slate-400" />
                                        <span>{u.businessName || 'Business Owner'}</span>
                                      </span>
                                      {u.phone && (
                                        <span className="user-phone-tag">
                                          <Phone size={12} className="text-slate-400" />
                                          <span>{u.phone}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <div className="credentials-spacious-box">
                                    <div className="cred-line">
                                      <span className="cred-tag-id">ID</span>
                                      <code className="cred-code">{u.email}</code>
                                    </div>
                                    <div className="cred-line mt-1">
                                      <span className="cred-tag-pass">PASS</span>
                                      <code className="cred-code font-bold">
                                        {isVisible ? u.password : '••••••••'}
                                      </code>
                                      <button
                                        type="button"
                                        onClick={() => togglePassVisibility(u.id)}
                                        className="cred-action-icon"
                                        title={isVisible ? 'Hide Password' : 'Show Password'}
                                      >
                                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyCredentials(u)}
                                        className="cred-action-icon copy"
                                        title="Copy Login ID & Password"
                                      >
                                        {copiedId === u.id ? (
                                          <Check size={14} className="text-emerald-500 font-bold" />
                                        ) : (
                                          <Copy size={14} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <div className="sub-cell-info">
                                    <span className={`plan-pill-large ${u.subscription?.planId === 'six_months' ? 'six-months' : 'monthly'}`}>
                                      {u.subscription?.planId === 'six_months' ? '6-Months Saver' : 'Monthly Pro'}
                                    </span>
                                    <div className="sub-pricing-line">
                                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                        {currency}{u.subscription?.basePrice || (u.subscription?.planId === 'six_months' ? 4999 : 999)}
                                      </span>
                                      <span className="sub-gst-note"> + 18% GST</span>
                                    </div>
                                    <span className="sub-total-paid-note">
                                      Total: {currency}{u.subscription?.totalPaid ? Number(u.subscription?.totalPaid).toFixed(0) : '—'}
                                    </span>
                                  </div>
                                </td>

                                <td className="text-center">
                                  {isSuspended ? (
                                    <span className="status-badge-spacious suspended">
                                      <span className="status-dot amber" />
                                      {isHindi ? 'सस्पेंडेड' : 'Suspended'}
                                    </span>
                                  ) : isExpired ? (
                                    <span className="status-badge-spacious expired">
                                      <span className="status-dot red" />
                                      {isHindi ? 'समाप्त' : 'Expired'}
                                    </span>
                                  ) : (
                                    <span className="status-badge-spacious active">
                                      <span className="status-dot green" />
                                      {isHindi ? 'सक्रिय' : 'Active'}
                                    </span>
                                  )}
                                </td>

                                <td>
                                  <div className="validity-spacious-box">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {expiryDate.toLocaleDateString()}
                                    </span>
                                    <span className={`days-countdown-large ${diffDays <= 5 ? (diffDays <= 0 ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}`}>
                                      {diffDays > 0
                                        ? `⏱️ ${diffDays} ${isHindi ? 'दिन बाकी' : 'days left'}`
                                        : `⚠️ ${Math.abs(diffDays)} ${isHindi ? 'दिन पहले समाप्त' : 'days expired'}`}
                                    </span>
                                  </div>
                                </td>

                                <td className="text-right">
                                  <div className="actions-cluster-spacious">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExtendingUser(u);
                                        setCustomExtendDate('');
                                      }}
                                      className="action-renew-btn"
                                      style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', fontWeight: 700 }}
                                      title={isHindi ? 'वैधता बढ़ाएं' : 'Extend Subscription Validity'}
                                    >
                                      <Clock size={12} />
                                      <span>{isHindi ? 'वैधता' : 'Extend'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setChangingPlanUser(u);
                                        setSelectedPlanId(u.subscription?.planId || 'monthly');
                                      }}
                                      className="action-renew-btn"
                                      style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: 700 }}
                                      title={isHindi ? 'प्लान बदलें / जोड़ें' : 'Change or Assign Plan'}
                                    >
                                      <Zap size={12} />
                                      <span>{isHindi ? 'प्लान' : 'Plan'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => renewSubscription(u.id, 'monthly')}
                                      className="action-renew-btn"
                                      title={`Renew 1 Month (${currency}999 + 18% GST)`}
                                    >
                                      <RefreshCw size={12} />
                                      <span>+1 Mo</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => renewSubscription(u.id, 'six_months')}
                                      className="action-renew-btn featured"
                                      title={`Renew 6 Months (${currency}4,999 + 18% GST)`}
                                    >
                                      <Sparkles size={12} />
                                      <span>+6 Mo</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleUserStatus(
                                          u.id,
                                          isSuspended ? 'active' : 'suspended'
                                        )
                                      }
                                      className={`action-status-toggle ${isSuspended ? 'activate' : 'suspend'}`}
                                    >
                                      {isSuspended ? (isHindi ? 'एक्टिव' : 'Activate') : (isHindi ? 'रोकें' : 'Suspend')}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(u)}
                                      className="action-icon-square"
                                      title="Edit User"
                                    >
                                      <Edit3 size={15} />
                                    </button>

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
                                      className="action-icon-square delete"
                                      title="Delete User"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* 4. UPGRADED MATERIAL 3 EDIT USER & SUBSCRIPTION MODAL */}
            {editingUser && (
              <div className="subdialog-backdrop animate-fade-in" onClick={() => setEditingUser(null)}>
                <div
                  className="m3-modal-sheet-dialog animate-scale-up"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '620px' }}
                >
                  {/* Dialog Header */}
                  <div className="m3-dialog-header-enhanced">
                    <div className="m3-dialog-header-left">
                      <div className="m3-dialog-icon-pill blue">
                        <Edit3 size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="m3-dialog-title">
                          {isHindi ? 'यूजर व सब्सक्रिप्शन एडिट करें' : 'Edit User & Subscription'}
                        </h3>
                        <p className="m3-dialog-subtitle">
                          {isHindi ? 'यूजर विवरण, पासवर्ड, प्लान व एक्सपायरी बदलें' : 'Update credentials, store details & validity'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="m3-dialog-close-circle"
                      title={isHindi ? 'बंद करें' : 'Close'}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditUser} className="m3-dialog-body-scroll">
                    {/* Section 1: Personal & Store Details */}
                    <div className="m3-form-card-section">
                      <span className="m3-section-title">
                        <Building size={14} className="text-blue-500" />
                        {isHindi ? '1. व्यक्तिगत व दुकान विवरण' : '1. Store & Personal Info'}
                      </span>

                      <div className="form-grid-2 mt-2">
                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'यूजर का नाम *' : 'Full Name *'}</label>
                          <input
                            type="text"
                            required
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            className="m3-enhanced-input text-field-only"
                          />
                        </div>

                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'दुकान / बिज़नेस का नाम' : 'Business Name'}</label>
                          <input
                            type="text"
                            value={editingUser.businessName}
                            onChange={(e) => setEditingUser({ ...editingUser, businessName: e.target.value })}
                            className="m3-enhanced-input text-field-only"
                          />
                        </div>

                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'मोबाइल नंबर' : 'Phone Number'}</label>
                          <input
                            type="text"
                            value={editingUser.phone}
                            onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                            placeholder="+91 98XXX XXXXX"
                            className="m3-enhanced-input text-field-only"
                          />
                        </div>

                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'दुकान का पता' : 'Store Address'}</label>
                          <input
                            type="text"
                            value={editingUser.address}
                            onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                            placeholder="Market, City"
                            className="m3-enhanced-input text-field-only"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Login Credentials */}
                    <div className="m3-form-card-section">
                      <span className="m3-section-title">
                        <Key size={14} className="text-amber-500" />
                        {isHindi ? '2. लॉगिन क्रेडेंशियल्स' : '2. Login Credentials'}
                      </span>

                      <div className="form-grid-2 mt-2">
                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'लॉगिन आईडी (Email) *' : 'Login ID (Email) *'}</label>
                          <input
                            type="email"
                            required
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            className="m3-enhanced-input text-field-only font-mono"
                          />
                        </div>

                        <div className="m3-form-field-group">
                          <div className="form-label-row">
                            <label className="m3-field-label">{isHindi ? 'लॉगिन पासवर्ड *' : 'Login Password *'}</label>
                            <button
                              type="button"
                              onClick={generateRandomPasswordForEdit}
                              className="text-action-link"
                            >
                              {isHindi ? '🎲 ऑटो-जनरेट' : 'Auto-Generate'}
                            </button>
                          </div>
                          <div className="relative-input-wrap">
                            <input
                              type={editShowPass ? 'text' : 'password'}
                              required
                              value={editingUser.password}
                              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                              className="m3-enhanced-input text-field-only font-mono pr-pass"
                            />
                            <button
                              type="button"
                              onClick={() => setEditShowPass(!editShowPass)}
                              className="input-eye-btn"
                            >
                              {editShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Subscription Plan & Validity Control */}
                    <div className="m3-form-card-section">
                      <span className="m3-section-title">
                        <CreditCard size={14} className="text-emerald-500" />
                        {isHindi ? '3. सब्सक्रिप्शन व वैधता नियंत्रण' : '3. Subscription & Validity Control'}
                      </span>

                      <div className="form-grid-3 mt-2">
                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'सब्सक्रिप्शन प्लान' : 'Assigned Plan'}</label>
                          <select
                            value={editingUser.subscription?.planId || 'monthly'}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                subscription: {
                                  ...editingUser.subscription,
                                  planId: e.target.value
                                }
                              })
                            }
                            className="m3-enhanced-input text-field-only"
                          >
                            <option value="free">14-Days Free Trial (₹0)</option>
                            <option value="monthly">Monthly ({currency}999+GST)</option>
                            <option value="six_months">6-Months ({currency}4,999+GST)</option>
                            <option value="annual">Annual Pro ({currency}8,999+GST)</option>
                          </select>
                        </div>

                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'अकाउंट स्थिति' : 'Account Status'}</label>
                          <select
                            value={editingUser.subscription?.status || 'active'}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                subscription: {
                                  ...editingUser.subscription,
                                  status: e.target.value
                                }
                              })
                            }
                            className="m3-enhanced-input text-field-only"
                          >
                            <option value="active">{isHindi ? 'सक्रिय (Active)' : 'Active'}</option>
                            <option value="suspended">{isHindi ? 'सस्पेंडेड (Suspended)' : 'Suspended'}</option>
                            <option value="expired">{isHindi ? 'समाप्त (Expired)' : 'Expired'}</option>
                          </select>
                        </div>

                        <div className="m3-form-field-group">
                          <label className="m3-field-label">{isHindi ? 'एक्सपायरी डेट' : 'Expiry Date'}</label>
                          <input
                            type="date"
                            required
                            value={editingUser.subscription?.expiryDate || ''}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                subscription: {
                                  ...editingUser.subscription,
                                  expiryDate: e.target.value
                                }
                              })
                            }
                            className="m3-enhanced-input text-field-only"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="m3-dialog-actions-row">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="m3-btn-secondary"
                      >
                        {isHindi ? 'रद्द करें' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="m3-btn-primary blue"
                      >
                        <Check size={16} />
                        <span>{isHindi ? 'बदलाव सुरक्षित करें' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 5. QUICK EXTEND VALIDITY MODAL DIALOG (Requirement 4) */}
            {extendingUser && (
              <div className="subdialog-backdrop animate-fade-in" onClick={() => setExtendingUser(null)}>
                <div
                  className="m3-modal-sheet-dialog animate-scale-up"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '480px' }}
                >
                  <div className="m3-dialog-header-enhanced">
                    <div className="m3-dialog-header-left">
                      <div className="m3-dialog-icon-pill" style={{ background: '#10b981' }}>
                        <Clock size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="m3-dialog-title">
                          {isHindi ? 'सब्सक्रिप्शन वैधता बढ़ाएं' : 'Extend Validity'}
                        </h3>
                        <p className="m3-dialog-subtitle">
                          {extendingUser.name} ({extendingUser.email})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExtendingUser(null)}
                      className="dialog-close-btn"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ padding: '16px 20px' }}>
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl mb-4 text-slate-800 dark:text-slate-200">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span className="text-slate-500 dark:text-slate-400">{isHindi ? 'वर्तमान प्लान:' : 'Current Plan:'}</span>
                        <span style={{ fontWeight: 700 }}>{extendingUser.subscription?.planName || extendingUser.subscription?.planId}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span className="text-slate-500 dark:text-slate-400">{isHindi ? 'वर्तमान एक्सपायरी:' : 'Current Expiry:'}</span>
                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                          {new Date(extendingUser.subscription?.expiryDate || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                      {isHindi ? '⚡ त्वरित वैधता जोड़ें (Quick Extension)' : '⚡ Quick Days Extension'}
                    </label>

                    <div className="admin-modal-quick-grid">
                      {[
                        { label: '+7 Days', days: 7 },
                        { label: '+14 Days', days: 14 },
                        { label: '+30 Days (1 Mo)', days: 30 },
                        { label: '+90 Days (3 Mo)', days: 90 },
                        { label: '+180 Days (6 Mo)', days: 180 },
                        { label: '+365 Days (1 Yr)', days: 365 }
                      ].map((item) => (
                        <button
                          key={item.days}
                          type="button"
                          className="admin-quick-extend-btn"
                          onClick={() => {
                            extendUserValidity(extendingUser.id, item.days);
                            setExtendingUser(null);
                          }}
                        >
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#16a34a' }}>{item.label}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{isHindi ? 'वैधता जोड़ें' : 'Add Days'}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700/80 pt-3.5 my-4">
                      <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                        {isHindi ? 'या विशिष्ट एक्सपायरी तारीख चुनें' : 'Or Pick a Specific Expiry Date'}
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="date"
                          value={customExtendDate}
                          onChange={(e) => setCustomExtendDate(e.target.value)}
                          className="m3-enhanced-input text-field-only"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          disabled={!customExtendDate}
                          onClick={() => {
                            if (customExtendDate) {
                              extendUserValidity(extendingUser.id, customExtendDate);
                              setExtendingUser(null);
                            }
                          }}
                          className="m3-button-filled"
                          style={{ opacity: customExtendDate ? 1 : 0.6 }}
                        >
                          {isHindi ? 'तारीख सेट करें' : 'Set Date'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="m3-dialog-actions-row">
                    <button
                      type="button"
                      onClick={() => setExtendingUser(null)}
                      className="m3-btn-secondary"
                    >
                      {isHindi ? 'बंद करें' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CHANGE / ADD PLAN MODAL DIALOG (Requirement 4) */}
            {changingPlanUser && (
              <div className="subdialog-backdrop animate-fade-in" onClick={() => setChangingPlanUser(null)}>
                <div
                  className="m3-modal-sheet-dialog animate-scale-up"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '540px' }}
                >
                  <div className="m3-dialog-header-enhanced">
                    <div className="m3-dialog-header-left">
                      <div className="m3-dialog-icon-pill" style={{ background: '#2563eb' }}>
                        <Zap size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="m3-dialog-title">
                          {isHindi ? 'प्लान असाइन / बदलें' : 'Assign or Change Plan'}
                        </h3>
                        <p className="m3-dialog-subtitle">
                          {changingPlanUser.name} ({changingPlanUser.email})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChangingPlanUser(null)}
                      className="dialog-close-btn"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ padding: '16px 20px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                      {isHindi ? 'नया प्लान चुनें:' : 'Select Plan to Assign:'}
                    </label>

                    <div className="admin-plan-picker-grid">
                      {Object.values(SUBSCRIPTION_PLANS).map((p) => {
                        const isSelected = selectedPlanId === p.id;
                        return (
                          <div
                            key={p.id}
                            className={`admin-plan-option-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedPlanId(p.id)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{p.name}</span>
                              {isSelected && <Check size={16} className="text-blue-600" />}
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563eb' }}>
                              {p.basePrice === 0 ? '₹0 Free' : `₹${p.basePrice}`}
                              {p.gstAmount > 0 && <span style={{ fontSize: '0.72rem', color: '#64748b' }}> + 18% GST</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              ⏱️ {p.durationDays} {isHindi ? 'दिन की वैधता' : 'Days Validity'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-xl mt-3 text-xs text-blue-800 dark:text-blue-300">
                      💡 {isHindi
                        ? 'प्लान बदलने पर यूजर की वैधता चुने हुए पैकेज के अनुसार तुरंत अपडेट हो जाएगी और अकाउंट एक्टिवेट हो जाएगा।'
                        : 'Changing the plan will immediately update the user subscription validity and activate their account.'}
                    </div>
                  </div>

                  <div className="m3-dialog-actions-row">
                    <button
                      type="button"
                      onClick={() => setChangingPlanUser(null)}
                      className="m3-btn-secondary"
                    >
                      {isHindi ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        changeUserPlan(changingPlanUser.id, selectedPlanId);
                        setChangingPlanUser(null);
                      }}
                      className="m3-btn-primary blue"
                    >
                      <Check size={16} />
                      <span>{isHindi ? 'प्लान लागू करें' : 'Apply & Activate Plan'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
