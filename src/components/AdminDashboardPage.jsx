import React, { useState } from 'react';
import { useApp, SUBSCRIPTION_PLANS } from '../context/AppContext';
import {
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
  UserCheck,
  ArrowLeft,
  Store,
  LogOut,
  ChevronRight,
  TrendingUp,
  UserPlus,
  X,
  LayoutGrid,
  Table as TableIcon
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
    toggleUserStatus,
    settings
  } = useApp();

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
  const currency = '₹'; // Billie's subscription is in INR
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
    <div className="admin-page-viewport animate-fade-in">
      {/* 1. TOP STANDALONE ADMIN HEADER (100% RESPONSIVE) */}
      <header className="admin-standalone-header">
        <div className="admin-nav-left">
          <button
            type="button"
            onClick={onBackToStore}
            className="admin-back-btn m3-ripple"
            title={isHindi ? 'Billie स्टोर ऐप पर वापस जाएं' : 'Back to Billie Store'}
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">{isHindi ? 'स्टोर ऐप पर वापस' : 'Back to App'}</span>
            <span className="sm:hidden">{isHindi ? 'वापस' : 'Back'}</span>
          </button>

          <div className="admin-brand-cluster">
            <div className="admin-brand-icon">
              <ShieldCheck size={20} className="text-amber-500" />
            </div>
            <div className="admin-brand-info">
              <div className="flex items-center gap-2">
                <h1 className="admin-brand-title">Billie Admin</h1>
                <span className="admin-badge-super">Diwakar Edition</span>
              </div>
              <p className="admin-brand-desc hidden md:block">
                {isHindi
                  ? 'यूजर क्रेडेंशियल्स प्रोविजनिंग एवं ₹999/माह व ₹4,999/6 माह सब्सक्रिप्शन प्रबंधन'
                  : 'User Credentials Provisioning & ₹999/mo or ₹4,999/6mo Subscription Engine'}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-nav-right">
          {isAuthorizedAdmin && (
            <div className="admin-user-pill">
              <div className="admin-avatar-small">
                <span>D</span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Diwakar</span>
                <span className="text-[10px] text-amber-600 font-semibold uppercase">Super Admin</span>
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
            <span className="hidden sm:inline">{isHindi ? 'लॉग आउट' : 'Log Out'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN ADMIN PAGE BODY */}
      <div className="admin-page-scrollable-container custom-scrollbar">
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
                  <AlertTriangle size={16} className="flex-shrink-0" />
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
                  className="m3-button-filled w-full mt-4 flex items-center justify-center gap-2 py-3"
                >
                  <ShieldCheck size={18} />
                  <span>{isHindi ? 'एडमिन पोर्टल अनलॉक करें' : 'Unlock Super Admin Portal'}</span>
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="text-xs text-slate-500 hover:text-blue-600 font-semibold"
                >
                  {isHindi ? '← वापस Billie बिलिंग स्टोर पर लौटें' : '← Return to Billie Billing App'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CASE B: Full Page Unlocked Admin Dashboard */
          <div className="admin-page-main-layout">
            {/* Top Stat Metrics Grid */}
            <div className="admin-metrics-row">
              <div className="admin-metric-card">
                <div className="metric-icon-box bg-blue-100 dark:bg-blue-950/50 text-blue-600">
                  <Users size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'कुल यूजर्स' : 'Total Users'}</span>
                  <span className="metric-number">{totalUsersCount}</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon-box bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                  <CheckCircle size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'सक्रिय प्लान' : 'Active'}</span>
                  <span className="metric-number text-emerald-600">{activeSubsCount}</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon-box bg-rose-100 dark:bg-rose-950/50 text-rose-600">
                  <AlertTriangle size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'समाप्त' : 'Expired'}</span>
                  <span className="metric-number text-rose-600">{expiredSubsCount}</span>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon-box bg-amber-100 dark:bg-amber-950/50 text-amber-600">
                  <DollarSign size={22} />
                </div>
                <div className="metric-text-box">
                  <span className="metric-label">{isHindi ? 'कुल रेवेन्यू' : 'Gross Revenue'}</span>
                  <span className="metric-number text-blue-600">
                    {currency}{totalGrossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Subscription Plans Banner */}
            <div className="admin-plans-horizontal-card">
              <div className="plans-horizontal-header">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {isHindi ? 'आधिकारिक Billie सब्सक्रिप्शन पैकेज (18% GST सहित)' : 'Official Billie Subscription Packages (Inclusive of 18% GST)'}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {isHindi ? 'हर नए यूजर को इन दोनों में से एक प्लान असाइन किया जाता है' : 'Assign either plan to newly provisioned users'}
                </span>
              </div>

              <div className="plans-horizontal-grid">
                <div className="plan-detail-card">
                  <div className="plan-header-row">
                    <span className="plan-title font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      Monthly Pro Plan
                    </span>
                    <span className="plan-duration-badge">30 Days Validity</span>
                  </div>
                  <div className="plan-pricing-line mt-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{currency}999</span>
                    <span className="text-xs text-slate-500 font-semibold"> + 18% GST ({currency}179.82)</span>
                  </div>
                  <div className="plan-total-highlight text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                    = {currency}1,178.82 Total Billed / Month
                  </div>
                </div>

                <div className="plan-detail-card featured-saver">
                  <div className="plan-header-row">
                    <span className="plan-title font-extrabold text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Sparkles size={15} />
                      6-Months Super Saver
                    </span>
                    <span className="plan-duration-badge saver">180 Days Validity</span>
                  </div>
                  <div className="plan-pricing-line mt-1">
                    <span className="text-2xl font-black text-blue-600">{currency}4,999</span>
                    <span className="text-xs text-slate-500 font-semibold"> + 18% GST ({currency}899.82)</span>
                  </div>
                  <div className="plan-total-highlight text-xs font-bold text-blue-800 dark:text-blue-200 mt-1">
                    = {currency}5,898.82 Total Billed / 6 Months
                    <span className="save-pill ml-2">{isHindi ? 'बचत' : 'Save'} {currency}1,074</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PROMINENT & EXPANDED USER LIST MANAGEMENT SECTION */}
            <section className="admin-large-user-list-section">
              {/* Section Header & Search / Add Action Bar */}
              <div className="user-list-header-bar">
                <div className="user-list-heading-group">
                  <div className="flex items-center gap-2.5">
                    <div className="user-icon-badge">
                      <Users size={22} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="user-list-title">
                        {isHindi ? 'यूजर अकाउंट्स एवं सब्सक्रिप्शन लिस्ट' : 'User Accounts & Subscription Registry'}
                      </h2>
                      <p className="user-list-subtitle">
                        {isHindi
                          ? `कुल ${users.length} यूजर्स पंजीकृत हैं। यहाँ से क्रेडेंशियल्स देखें/कॉपी करें और प्लान मैनेज करें।`
                          : `Manage all ${users.length} registered users. View/copy credentials and renew subscriptions.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter and Add Controls Toolbar */}
                <div className="user-list-actions-bar">
                  <div className="user-search-input-box">
                    <Search size={16} className="text-slate-400 flex-shrink-0" />
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
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
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
                      <option value="monthly">Monthly ({currency}999+GST)</option>
                      <option value="six_months">6-Months ({currency}4,999+GST)</option>
                    </select>

                    {/* View Switcher (Cards vs Table on wide screens) */}
                    <div className="hidden md:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        title="Card View"
                      >
                        <LayoutGrid size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
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
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" />
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {isHindi ? 'नया यूजर पंजीकृत करें और आईडी/पासवर्ड बनाएं' : 'Create New User & Provision Credentials'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
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
                      <div className="flex items-center justify-between">
                        <label className="form-label">{isHindi ? 'लॉगिन पासवर्ड *' : 'Login Password *'}</label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-xs text-blue-600 hover:underline font-bold"
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
                        <option value="monthly">
                          Monthly Plan — {currency}999 + 18% GST ({currency}1,178.82) • 30 Days
                        </option>
                        <option value="six_months">
                          6-Months Super Saver — {currency}4,999 + 18% GST ({currency}5,898.82) • 180 Days
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

                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="m3-button-tonal text-xs py-2 px-4"
                    >
                      {isHindi ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="m3-button-filled text-xs py-2 px-5 flex items-center gap-1.5"
                    >
                      <CheckCircle size={16} />
                      <span>{isHindi ? 'यूजर बनाएं और एक्टिवेट करें' : 'Create User & Activate Plan'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* EMPTY STATE */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
                    {isHindi ? 'कोई यूजर नहीं मिला' : 'No matching users found'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {isHindi
                      ? 'नया यूजर जोड़ने के लिए ऊपर दिए गए "नया यूजर जोड़ें" बटन का उपयोग करें।'
                      : 'Click "Add New User" above to create an account.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* VIEW A: MATERIAL 3 CARDS VIEW (DEFAULT ON MOBILE & TABLET, NO HORIZONTAL OVERFLOW!) */}
                  {(viewMode === 'cards' || window.innerWidth < 900) && (
                    <div className="m3-admin-user-cards-grid mt-4">
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
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="admin-user-avatar-m3">
                                  <span>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                                      {u.name}
                                    </h4>
                                    {u.role === 'admin' ? (
                                      <span className="admin-pill-tag">Admin</span>
                                    ) : (
                                      <span className="user-pill-tag">User</span>
                                    )}
                                  </div>
                                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                                    <Building size={12} className="text-amber-500 flex-shrink-0" />
                                    <span>{u.businessName || 'Business Owner'}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="flex-shrink-0">
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
                            <div className="m3-user-contact-strip mt-2.5">
                              {u.phone && (
                                <a href={`tel:${u.phone}`} className="contact-item">
                                  <Phone size={12} className="text-blue-500" />
                                  <span>{u.phone}</span>
                                </a>
                              )}
                              <span className="contact-item">
                                <Mail size={12} className="text-slate-400" />
                                <span className="truncate">{u.email}</span>
                              </span>
                              {u.address && (
                                <span className="contact-item text-slate-500 truncate" title={u.address}>
                                  <Store size={12} className="text-indigo-400 flex-shrink-0" />
                                  <span className="truncate">{u.address}</span>
                                </span>
                              )}
                            </div>

                            {/* Login Credentials Box (Outlined Material Container) */}
                            <div className="m3-credentials-box-modern mt-3">
                              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
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
                                      <span className="text-emerald-600 font-bold">{isHindi ? 'कॉपी हो गया!' : 'Copied!'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>{isHindi ? 'क्रेडेंशियल्स कॉपी' : 'Copy'}</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-400 font-medium">ID:</span>
                                  <code className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate ml-2">
                                    {u.email}
                                  </code>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-400 font-medium">PASS:</span>
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                      {isVisible ? u.password : '••••••••'}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => togglePassVisibility(u.id)}
                                      className="text-slate-400 hover:text-blue-500"
                                      title={isVisible ? 'Hide Password' : 'Show Password'}
                                    >
                                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Subscription Plan & Validity Details */}
                            <div className="m3-subscription-box-modern mt-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`m3-plan-chip ${u.subscription?.planId === 'six_months' ? 'six-months' : 'monthly'}`}>
                                    {u.subscription?.planId === 'six_months' ? '⭐ 6-Months Saver' : 'Monthly Pro'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {currency}{u.subscription?.basePrice || (u.subscription?.planId === 'six_months' ? 4999 : 999)}
                                    <span className="text-[10px] text-slate-400 font-normal"> + 18% GST</span>
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className={`text-xs font-bold ${diffDays <= 5 ? (diffDays <= 0 ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}`}>
                                    {diffDays > 0
                                      ? `⏱️ ${diffDays} ${isHindi ? 'दिन बाकी' : 'days left'}`
                                      : `⚠️ ${Math.abs(diffDays)} ${isHindi ? 'दिन पहले समाप्त' : 'days expired'}`}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {isHindi ? 'वैधता:' : 'Expires:'} {expiryDate.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="m3-card-footer-action-row mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Renew 1 Month */}
                                <button
                                  type="button"
                                  onClick={() => renewSubscription(u.id, 'monthly')}
                                  className="m3-btn-sub-renew"
                                  title={`Renew +1 Month (${currency}999 + 18% GST)`}
                                >
                                  <RefreshCw size={12} />
                                  <span>+1 Mo</span>
                                </button>

                                {/* Renew 6 Months */}
                                <button
                                  type="button"
                                  onClick={() => renewSubscription(u.id, 'six_months')}
                                  className="m3-btn-sub-renew featured"
                                  title={`Renew +6 Months (${currency}4,999 + 18% GST)`}
                                >
                                  <Sparkles size={12} />
                                  <span>+6 Mo</span>
                                </button>

                                {/* Suspend / Activate */}
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

                              <div className="flex items-center gap-2">
                                {/* Edit User & Subscription */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="m3-btn-edit-user"
                                  title={isHindi ? 'यूजर व सब्सक्रिप्शन विवरण एडिट करें' : 'Edit User & Subscription'}
                                >
                                  <Edit3 size={13} />
                                  <span>{isHindi ? 'एडिट' : 'Edit'}</span>
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

                  {/* VIEW B: WIDE TABLE VIEW (AVAILABLE ON LARGE SCREENS WHEN VIEW MODE IS TABLE) */}
                  {viewMode === 'table' && (
                    <div className="large-table-container mt-4 hidden md:block">
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
                                      <div className="flex items-center gap-1.5">
                                        <span className="user-primary-name">{u.name}</span>
                                        {u.role === 'admin' ? (
                                          <span className="admin-pill-tag">Admin</span>
                                        ) : (
                                          <span className="user-pill-tag">User</span>
                                        )}
                                      </div>
                                      <span className="user-firm-name flex items-center gap-1">
                                        <Building size={13} className="text-slate-400" />
                                        {u.businessName || 'Business Owner'}
                                      </span>
                                      {u.phone && (
                                        <span className="user-phone-tag flex items-center gap-1">
                                          <Phone size={12} className="text-slate-400" />
                                          {u.phone}
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
                                    <div className="cred-line mt-1.5">
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
                                    <div className="sub-pricing-line mt-1.5">
                                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                        {currency}{u.subscription?.basePrice || (u.subscription?.planId === 'six_months' ? 4999 : 999)}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-normal"> + 18% GST</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
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
                                  <div className="actions-cluster-spacious justify-end">
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
                    <div className="flex items-center gap-3">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
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
                          <div className="flex items-center justify-between">
                            <label className="m3-field-label">{isHindi ? 'लॉगिन पासवर्ड *' : 'Login Password *'}</label>
                            <button
                              type="button"
                              onClick={generateRandomPasswordForEdit}
                              className="text-xs text-blue-600 hover:underline font-bold"
                            >
                              {isHindi ? '🎲 ऑटो-जनरेट' : 'Auto-Generate'}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={editShowPass ? 'text' : 'password'}
                              required
                              value={editingUser.password}
                              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                              className="m3-enhanced-input text-field-only font-mono pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setEditShowPass(!editShowPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                        {isHindi ? '3. सब्सक्रिप्शन व वैधता नियंत्रण (Subscription Control)' : '3. Subscription & Validity Control'}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
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
                            <option value="monthly">Monthly ({currency}999+GST)</option>
                            <option value="six_months">6-Months ({currency}4,999+GST)</option>
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
                          <label className="m3-field-label">{isHindi ? 'एक्सपायरी डेट (Validity)' : 'Expiry Date'}</label>
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
          </div>
        )}
      </div>
    </div>
  );
}
