import React, { useState, useEffect } from 'react';
import { useApp, SUBSCRIPTION_PLANS } from '../context/AppContext';
import SixDigitPinInput from './SixDigitPinInput';
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  Download,
  LogOut,
  LogIn,
  CheckCircle,
  Wifi,
  Sparkles,
  Smartphone,
  Package,
  ShieldCheck,
  Key,
  KeyRound,
  AlertTriangle,
  CreditCard,
  Calendar,
  Check,
  BarChart3
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onOpenInventory, onOpenAdmin, onOpenReporting }) {
  const {
    user,
    authenticate,
    logout,
    updateProfile,
    updatePin,
    isInstallable,
    isInstalled,
    installPWA,
    isOffline,
    inventory,
    settings
  } = useApp();

  const isHindi = settings.language === 'hi';
  const currency = settings.currency || '₹';

  const [formData, setFormData] = useState({
    name: user.name || '',
    businessName: user.businessName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    taxId: user.taxId || ''
  });

  // Sync formData with user changes
  useEffect(() => {
    setFormData({
      name: user.name || '',
      businessName: user.businessName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      taxId: user.taxId || ''
    });
  }, [user]);

  // Login form state
  const [loginMethod, setLoginMethod] = useState('pin'); // 'pin' | 'password'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [authWarning, setAuthWarning] = useState('');

  // 6-Digit PIN Update State for logged-in user
  const [showPinEdit, setShowPinEdit] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(formData);
    alert(isHindi ? '✓ प्रोफाइल डिटेल्स सेव हो गई हैं!' : '✓ Profile details saved!');
  };

  const handleUpdatePin = (e) => {
    if (e) e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!newPin || newPin.length !== 6) {
      setPinError(isHindi ? 'कृपया पूरा 6-अंकों का पिन दर्ज करें।' : 'Please enter full 6-digit PIN.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinError(isHindi ? 'दोनों 6-Digit PIN मेल नहीं खाते! कृपया जांचें।' : 'Both 6-digit PINs do not match! Please check.');
      return;
    }

    const res = updatePin ? updatePin(newPin) : { success: false, error: 'Function not found' };
    if (!res.success) {
      setPinError(res.error || (isHindi ? 'पिन अपडेट नहीं हो सका।' : 'Could not update PIN.'));
    } else {
      setPinSuccess(isHindi ? '✓ 6-Digit PIN सफलतापूर्वक अपडेट हो गया!' : '✓ 6-Digit PIN updated successfully!');
      setTimeout(() => {
        setNewPin('');
        setConfirmNewPin('');
        setShowPinEdit(false);
        setPinSuccess('');
      }, 1500);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthWarning('');

    const secret = loginMethod === 'pin' ? loginPin : loginPass;
    if (loginMethod === 'pin' && (!loginPin || loginPin.length !== 6)) {
      setAuthError(isHindi ? 'कृपया पूरा 6-अंकों का पिन दर्ज करें।' : 'Please enter 6-digit PIN.');
      return;
    }

    const res = authenticate(loginEmail, secret);
    if (!res.success) {
      setAuthError(res.error);
      return;
    }

    if (res.isAdmin) {
      onClose();
      if (onOpenAdmin) onOpenAdmin();
      return;
    }

    if (res.isExpired) {
      setAuthWarning(
        isHindi
          ? 'चेतावनी: आपका सब्सक्रिप्शन समाप्त हो चुका है! बिलिंग और सेवा जारी रखने के लिए एडमिन से संपर्क करके ₹999/माह या ₹4,999/6 माह प्लान रिन्यू करवाएं।'
          : 'Warning: Your subscription has expired! Please contact your administrator to renew your plan (₹999/mo or ₹4,999/6mo + 18% GST).'
      );
    }
  };


  const handleInstallClick = async () => {
    if (isInstallable) {
      await installPWA();
    } else {
      alert("To install Billie:\n• Chrome/Edge: Look for the install icon (⊕) in the browser address bar.\n• iOS Safari: Tap Share -> 'Add to Home Screen'.");
    }
  };

  // Subscription calculation
  const sub = user.subscription;
  const isSubExpired = sub?.status === 'expired' || (sub?.expiryDate && new Date(sub.expiryDate) < new Date());
  const expiryDateObj = sub?.expiryDate ? new Date(sub.expiryDate) : null;
  const daysRemaining = expiryDateObj ? Math.ceil((expiryDateObj - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="m3-dialog-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
      >
        {/* Dialog Header */}
        <div className="dialog-header">
          <div className="dialog-title-group">
            <h2 id="profile-dialog-title" className="dialog-title">
              {user.isLoggedIn ? (user.role === 'admin' ? '🛡️ Billie Admin Profile' : 'Business Profile') : 'Sign In to Billie'}
            </h2>
            <p className="dialog-subtitle">
              {user.isLoggedIn
                ? (user.role === 'admin' ? 'Super Admin Mode • Full Subscription Control' : 'Manage your business details, subscription & offline PWA')
                : 'Enter your credentials created by the administrator'}
            </p>
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
        <div className="dialog-body custom-scrollbar">
          {/* CASE 1: Logged Out -> Login Page with Credential Authentication */}
          {!user.isLoggedIn ? (
            <div className="login-form-container">
              <div className="login-hero-badge">
                <Sparkles size={28} className="text-blue-500" />
              </div>
              <h3 className="login-heading">
                {isHindi ? 'Billie में साइन इन करें' : 'Sign In to Billie'}
              </h3>
              <p className="login-description">
                {loginMethod === 'pin'
                  ? (isHindi ? 'अपने मोबाइल नंबर / यूजरनेम और 6-Digit PIN से लॉगिन करें।' : 'Login with your Mobile Number or Username and 6-Digit PIN.')
                  : (isHindi ? 'अपने मोबाइल / यूजरनेम और पासवर्ड से लॉगिन करें।' : 'Enter your credentials and password to login.')}
              </p>

              {authError && (
                <div className="form-error-alert mb-3 animate-slide-up">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authWarning && (
                <div className="form-warning-alert mb-3 animate-slide-up">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{authWarning}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="material-form">
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'मोबाइल नंबर / यूजरनेम' : 'Mobile Number / Username'}</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={isHindi ? 'उदा. 9876543210 या यूजरनेम' : 'e.g. 9876543210 or username'}
                      className="m3-text-field"
                    />
                  </div>
                </div>

                {loginMethod === 'pin' ? (
                  <div className="form-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label m-0">{isHindi ? '6-अंकों का सुरक्षा पिन (6-Digit PIN)' : '6-Digit Security PIN'}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('password');
                          setAuthError('');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        {isHindi ? 'पासवर्ड उपयोग करें' : 'Use Password'}
                      </button>
                    </div>
                    <SixDigitPinInput
                      value={loginPin}
                      onChange={setLoginPin}
                      masked={true}
                      error={!!authError}
                      autoFocus={true}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label m-0">{isHindi ? 'पासवर्ड' : 'Password'}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('pin');
                          setAuthError('');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        {isHindi ? '6-Digit PIN उपयोग करें' : 'Use 6-Digit PIN'}
                      </button>
                    </div>
                    <div className="input-with-icon">
                      <Key size={18} className="input-icon" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        className="m3-text-field"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="m3-button-filled w-full m3-ripple mt-2"
                >
                  <LogIn size={18} />
                  <span>{loginMethod === 'pin' ? (isHindi ? 'पिन से साइन इन करें' : 'Sign In with PIN') : (isHindi ? 'साइन इन करें' : 'Sign In')}</span>
                </button>
              </form>
            </div>
          ) : (
            /* CASE 2: Logged In -> Profile Settings, Subscription & Inventory */
            <div className="profile-details-view">
              {/* Profile Avatar Card */}
              <div className="profile-identity-card">
                <div className="profile-avatar-large">
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : 'B'}</span>
                </div>
                <div className="profile-identity-text">
                  <div className="flex items-center gap-2">
                    <h3 className="profile-user-name">{user.name}</h3>
                    {user.role === 'admin' ? (
                      <span className="admin-status-badge">Super Admin</span>
                    ) : (
                      <span className={`sub-status-pill ${isSubExpired ? 'expired' : 'active'}`}>
                        {isSubExpired ? (isHindi ? 'सब्सक्रिप्शन समाप्त' : 'Expired') : (isHindi ? 'सक्रिय प्लान' : 'Active Plan')}
                      </span>
                    )}
                  </div>
                  <span className="profile-business-tag">{user.businessName || 'Business Owner'}</span>
                  <span className="profile-email-sub">{user.email}</span>
                </div>
              </div>

              {/* ADMIN SHORTCUT: Open Admin Dashboard */}
              {user.role === 'admin' && (
                <div className="admin-quick-portal-banner mt-4">
                  <div className="flex items-center gap-3">
                    <div className="admin-icon-pill">
                      <ShieldCheck size={22} className="text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {isHindi ? 'Billie एडमिन डैशबोर्ड' : 'Billie Super Admin Portal'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {isHindi
                          ? 'यूजर आईडी/पासवर्ड बनाएं और ₹999/माह व ₹4,999/6 माह सब्सक्रिप्शन मैनेज करें'
                          : 'Manage users, credentials and subscriptions'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenAdmin) onOpenAdmin();
                    }}
                    className="m3-button-filled text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <ShieldCheck size={15} />
                    <span>{isHindi ? 'एडमिन पोर्टल खोलें' : 'Open Admin Portal'}</span>
                  </button>
                </div>
              )}

              {/* USER SUBSCRIPTION DETAILS CARD (Requirement 3 & 4) */}
              {user.role !== 'admin' && (
                <div className={`user-subscription-card mt-4 ${isSubExpired ? 'expired' : 'active'}`}>
                  <div className="sub-card-header">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className={isSubExpired ? 'text-rose-500' : 'text-blue-500'} />
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {isHindi ? 'मेरा सब्सक्रिप्शन प्लान' : 'My Subscription Plan'}
                      </span>
                    </div>
                    <span className={`sub-status-pill ${isSubExpired ? 'expired' : 'active'}`}>
                      {isSubExpired ? (isHindi ? 'समाप्त (Expired)' : 'Expired') : (isHindi ? 'सक्रिय (Active)' : 'Active')}
                    </span>
                  </div>

                  <div className="sub-card-content mt-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {sub?.planName || 'Monthly Pro'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {expiryDateObj ? `${isHindi ? 'समाप्ति: ' : 'Expires: '}${expiryDateObj.toLocaleDateString()}` : ''}
                      </span>
                    </div>

                    <div className="sub-pricing-row mt-1 text-xs text-slate-500">
                      <span>{currency}{sub?.basePrice || 999} + 18% GST ({currency}{sub?.gstAmount || 179.82})</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Total Paid: {currency}{sub?.totalPaid ? Number(sub.totalPaid).toFixed(0) : '1,179'}
                      </span>
                    </div>

                    <div className="sub-countdown-bar mt-2">
                      <span className={`text-xs font-bold ${daysRemaining <= 5 ? (daysRemaining <= 0 ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}`}>
                        {daysRemaining > 0
                          ? `⏱️ ${daysRemaining} ${isHindi ? 'दिन बाकी हैं' : 'days remaining'}`
                          : `⚠️ ${isHindi ? 'सब्सक्रिप्शन समाप्त हो चुका है' : 'Subscription has expired'}`}
                      </span>
                    </div>

                    {isSubExpired && (
                      <div className="sub-expired-notice mt-2">
                        <span>
                          {isHindi
                            ? 'रिन्यू करने के लिए एडमिन से संपर्क करें: ₹999 + GST (1 माह) या ₹4,999 + GST (6 माह)।'
                            : 'To renew, contact your admin: ₹999+GST (1 mo) or ₹4,999+GST (6 mo).'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inventory Management Card */}
              <div className="profile-inventory-card mt-4">
                <div className="profile-inventory-header">
                  <div className="profile-inventory-icon-box">
                    <Package size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="profile-inventory-title">
                      {isHindi ? '📦 इन्वेंटरी एवं स्टॉक प्रबंधन' : '📦 Inventory & Stock'}
                    </h4>
                    <p className="profile-inventory-desc">
                      {isHindi
                        ? `${inventory.length} प्रोडक्ट्स उपलब्ध • स्टॉक जांचें और एडिट करें`
                        : `${inventory.length} products listed • View, restock & edit prices`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenInventory) onOpenInventory();
                    }}
                    className="m3-button-tonal text-xs py-2 px-3.5 flex items-center gap-1.5"
                  >
                    <Package size={15} />
                    <span>{isHindi ? 'इन्वेंटरी' : 'Inventory'}</span>
                  </button>
                </div>
              </div>

              {/* Reporting & Supplier Accounting Card */}
              <div className="profile-inventory-card mt-3">
                <div className="profile-inventory-header">
                  <div className="profile-inventory-icon-box bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                    <BarChart3 size={22} />
                  </div>
                  <div className="flex-1">
                    <h4 className="profile-inventory-title">
                      {isHindi ? '📊 बिजनेस रिपोर्टिंग व अकाउंटिंग' : '📊 Business Reports & Accounting'}
                    </h4>
                    <p className="profile-inventory-desc">
                      {isHindi
                        ? 'दैनिक बिक्री, शुद्ध मुनाफ़ा (Profit) व सप्लायर ड्यू डेट चेक करें'
                        : 'Track daily sales, net profit and supplier payment dues'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenReporting) onOpenReporting();
                    }}
                    className="m3-button-tonal text-xs py-2 px-3.5 flex items-center gap-1.5"
                  >
                    <BarChart3 size={15} />
                    <span>{isHindi ? 'रिपोर्ट्स' : 'Reports'}</span>
                  </button>
                </div>
              </div>

              {/* Business Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="material-form mt-4">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">{isHindi ? 'पूरा नाम' : 'Full Name'}</label>
                    <div className="input-with-icon">
                      <User size={16} className="input-icon" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="m3-text-field"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{isHindi ? 'बिज़नेस / दुकान का नाम' : 'Business / Company Name'}</label>
                    <div className="input-with-icon">
                      <Building size={16} className="input-icon" />
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="m3-text-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">{isHindi ? 'ईमेल आईडी' : 'Business Email'}</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="m3-text-field"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{isHindi ? 'फोन नंबर' : 'Business Phone'}</label>
                    <div className="input-with-icon">
                      <Phone size={16} className="input-icon" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="m3-text-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{isHindi ? 'बिज़नेस का पता (बिल पर दिखेगा)' : 'Business Address (Shown on Invoice)'}</label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="input-icon" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Shop 12, Main Market, Delhi"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{isHindi ? 'GSTIN / VAT / टैक्स आईडी' : 'Tax ID / GSTIN Number'}</label>
                  <div className="input-with-icon">
                    <FileCheck size={16} className="input-icon" />
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="m3-button-filled w-full m3-ripple"
                >
                  <span>{isHindi ? 'प्रोफाइल विवरण सेव करें' : 'Save Profile Details'}</span>
                </button>
              </form>

              {/* Material Design 3 Security PIN Management Card */}
              <div className="m3-security-pin-card">
                <div className="m3-pin-card-header">
                  <div className="m3-pin-card-leading">
                    <div className="m3-pin-avatar-badge">
                      <KeyRound size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="m3-pin-info-texts">
                      <div className="flex items-center gap-2">
                        <h4 className="m3-pin-title">
                          {isHindi ? '6-अंकों का सुरक्षा पिन' : '6-Digit Security PIN'}
                        </h4>
                        <span className="m3-pin-status-pill">
                          <span className="m3-status-dot"></span>
                          {isHindi ? 'सक्रिय' : 'Active'}
                        </span>
                      </div>
                      <p className="m3-pin-subtitle">
                        {isHindi ? 'त्वरित मोबाइल लॉगिन और सुरक्षा के लिए' : 'Fast mobile authentication & store protection'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPinEdit(!showPinEdit);
                      setPinError('');
                      setPinSuccess('');
                    }}
                    className={`m3-btn-tonal-pin ${showPinEdit ? 'cancel' : ''}`}
                    title={showPinEdit ? (isHindi ? 'रद्द करें' : 'Cancel') : (isHindi ? 'पिन बदलें' : 'Change PIN')}
                  >
                    {showPinEdit ? <X size={15} /> : <KeyRound size={15} />}
                    <span>{showPinEdit ? (isHindi ? 'रद्द करें' : 'Cancel') : (isHindi ? 'पिन बदलें' : 'Change PIN')}</span>
                  </button>
                </div>

                {!showPinEdit ? (
                  <div className="m3-pin-preview-strip">
                    <div className="m3-pin-preview-dots">
                      <span className="pin-dot"></span>
                      <span className="pin-dot"></span>
                      <span className="pin-dot"></span>
                      <span className="pin-dot"></span>
                      <span className="pin-dot"></span>
                      <span className="pin-dot"></span>
                    </div>
                    <span className="m3-pin-preview-caption">
                      {isHindi ? 'पिन सुरक्षित रूप से एनक्रिप्टेड है' : 'Encrypted with device security'}
                    </span>
                  </div>
                ) : (
                  <div className="m3-pin-edit-expanded animate-slide-up">
                    <div className="m3-pin-field-block">
                      <label className="m3-field-label">
                        {isHindi ? 'नया 6-अंकों का पिन दर्ज करें:' : 'Enter New 6-Digit PIN:'}
                      </label>
                      <SixDigitPinInput
                        value={newPin}
                        onChange={setNewPin}
                        masked={true}
                        error={!!pinError}
                      />
                    </div>

                    <div className="m3-pin-field-block">
                      <label className="m3-field-label">
                        {isHindi ? 'नया पिन दोबारा दर्ज करें (Confirm):' : 'Confirm New 6-Digit PIN:'}
                      </label>
                      <SixDigitPinInput
                        value={confirmNewPin}
                        onChange={setConfirmNewPin}
                        masked={true}
                        error={!!pinError}
                      />
                    </div>

                    {pinError && (
                      <div className="m3-form-alert error animate-slide-up">
                        <AlertTriangle size={15} />
                        <span>{pinError}</span>
                      </div>
                    )}

                    {pinSuccess && (
                      <div className="m3-form-alert success animate-slide-up">
                        <CheckCircle size={15} />
                        <span>{pinSuccess}</span>
                      </div>
                    )}

                    <div className="m3-pin-actions-row">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPinEdit(false);
                          setPinError('');
                          setPinSuccess('');
                        }}
                        className="m3-btn-outlined-cancel"
                      >
                        <span>{isHindi ? 'रद्द करें' : 'Cancel'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdatePin}
                        className="m3-btn-filled-save m3-ripple"
                      >
                        <Check size={16} />
                        <span>{isHindi ? 'नया पिन सेव करें' : 'Save New PIN'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* PWA Download / Offline Mode Card */}
              <div className="pwa-download-card mt-4">
                <div className="pwa-card-header">
                  <div className="pwa-icon-box">
                    <Smartphone size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="pwa-card-title">Run Billie Offline</h4>
                    <p className="pwa-card-desc">
                      Install Billie as a standalone Progressive Web App. Works completely offline with instant PDF generation.
                    </p>
                  </div>
                </div>

                <div className="pwa-card-status">
                  <div className="status-item">
                    <CheckCircle size={15} className="text-emerald-500" />
                    <span>Service Worker Cached</span>
                  </div>
                  <div className="status-item">
                    <Wifi size={15} className={isOffline ? 'text-amber-500' : 'text-blue-500'} />
                    <span>{isOffline ? 'Offline Mode Active' : 'Online & Sync Ready'}</span>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="pwa-installed-pill">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Billie PWA is already installed on your device</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="pwa-install-button m3-ripple"
                  >
                    <Download size={18} />
                    <span>Download PWA (Install Offline App)</span>
                  </button>
                )}
              </div>

              {/* Admin Portal link - Strictly visible ONLY to Super Admin */}
              {user.role === 'admin' && onOpenAdmin && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="m3-button-tonal text-xs py-2 px-4 inline-flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <ShieldCheck size={16} className="text-amber-500" />
                    <span>{isHindi ? 'सुपर एडमिन पोर्टल खोलें' : 'Open Super Admin Portal'}</span>
                  </button>
                </div>
              )}

              {/* Logout Button */}
              <div className="logout-section mt-5">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="logout-button m3-ripple"
                >
                  <LogOut size={17} />
                  <span>{isHindi ? 'लॉग आउट (Log Out)' : 'Log Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
