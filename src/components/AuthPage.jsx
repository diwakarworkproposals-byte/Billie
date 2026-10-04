import React, { useState } from 'react';
import { useApp, SUBSCRIPTION_PLANS } from '../context/AppContext';
import SixDigitPinInput from './SixDigitPinInput';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  KeyRound,
  Key
} from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const { authenticate, registerUser, settings, setLanguage } = useApp();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [loginMethod, setLoginMethod] = useState('pin'); // 'pin' | 'password'
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [pinMasked, setPinMasked] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupBusiness, setSignupBusiness] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [signupPinMasked, setSignupPinMasked] = useState(true);
  const [signupPlan, setSignupPlan] = useState('free'); // 'free' | 'monthly' | 'six_months'
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const isHindi = settings.language === 'hi';

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginId.trim()) {
      setLoginError(isHindi ? 'कृपया मोबाइल नंबर या यूजरनेम दर्ज करें।' : 'Please enter your mobile number or username.');
      return;
    }

    if (loginMethod === 'pin') {
      if (loginPin.length !== 6) {
        setLoginError(isHindi ? 'कृपया पूरा 6-अंकों का पिन (6-Digit PIN) दर्ज करें।' : 'Please enter full 6-digit PIN.');
        return;
      }
    } else {
      if (!loginPass.trim()) {
        setLoginError(isHindi ? 'कृपया पासवर्ड दर्ज करें।' : 'Please enter password.');
        return;
      }
    }

    setLoginLoading(true);

    setTimeout(() => {
      const secret = loginMethod === 'pin' ? loginPin : loginPass;
      const res = authenticate(loginId, secret);
      setLoginLoading(false);
      if (!res.success) {
        setLoginError(res.error || (isHindi ? 'लॉगिन विफल रहा! कृपया जांचें।' : 'Login failed! Please check credentials.'));
      } else {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      }
    }, 200);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (!signupName.trim()) {
      setSignupError(isHindi ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }

    const cleanPhone = signupPhone.replace(/[\s+-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setSignupError(isHindi ? 'कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!signupPin || signupPin.length !== 6) {
      setSignupError(isHindi ? 'कृपया 6-अंकों का सुरक्षा पिन बनाएं।' : 'Please create a 6-digit security PIN.');
      return;
    }

    if (signupPin !== confirmPin) {
      setSignupError(isHindi ? 'दोनों 6-Digit PIN मेल नहीं खाते! कृपया जांचें।' : 'Both 6-digit PINs do not match! Please check.');
      return;
    }

    setSignupLoading(true);

    setTimeout(() => {
      const res = registerUser({
        name: signupName,
        businessName: signupBusiness,
        email: signupEmail,
        phone: signupPhone,
        pin: signupPin,
        password: signupPin,
        planId: signupPlan
      });
      setSignupLoading(false);

      if (!res.success) {
        setSignupError(res.error || (isHindi ? 'खाता निर्माण विफल रहा!' : 'Account creation failed!'));
      } else {
        setSignupSuccess(
          isHindi
            ? `✓ स्वागत है, ${res.user.name}! 6-Digit PIN के साथ खाता तैयार है।`
            : `✓ Welcome, ${res.user.name}! Account created with 6-digit PIN.`
        );
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          }
        }, 600);
      }
    }, 200);
  };

  return (
    <div className="auth-fullscreen-container animate-fade-in">
      <div className="auth-card-wrapper animate-scale-up">
        {/* Top Header / Language Switcher */}
        <div className="auth-top-bar">
          <div className="auth-brand-group">
            <div className="auth-logo-badge">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="auth-brand-name">Billie</span>
          </div>

          <div className="auth-lang-toggle">
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`lang-pill-btn ${isHindi ? 'active' : ''}`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`lang-pill-btn ${!isHindi ? 'active' : ''}`}
            >
              English
            </button>
          </div>
        </div>

        {/* Tab Switcher: Login vs Sign Up */}
        <div className="auth-tabs-segmented">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setLoginError('');
            }}
            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
          >
            {isHindi ? 'लॉग इन (Sign In)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setSignupError('');
            }}
            className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
          >
            {isHindi ? 'नया खाता (Sign Up)' : 'Sign Up'}
          </button>
        </div>

        {/* ===================== LOGIN FORM ===================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form-content animate-slide-up">
            <div className="auth-headings">
              <h2 className="auth-title">
                {loginMethod === 'pin'
                  ? (isHindi ? '6-Digit PIN से लॉगिन करें' : 'Sign In with 6-Digit PIN')
                  : (isHindi ? 'पासवर्ड से लॉगिन करें' : 'Sign In with Password')}
              </h2>
              <p className="auth-subtitle">
                {loginMethod === 'pin'
                  ? (isHindi ? 'अपने मोबाइल नंबर या यूजरनेम और 6-अंकों के पिन से सुरक्षित प्रवेश करें' : 'Enter your mobile number or username and 6-digit PIN to continue')
                  : (isHindi ? 'अपने पंजीकृत मोबाइल नंबर और पासवर्ड से प्रवेश करें' : 'Enter your credentials to access your store')}
              </p>
            </div>

            {loginError && (
              <div className="auth-alert-box error animate-slide-up">
                <AlertTriangle size={17} className="flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* M3 Segmented Login Method Selector */}
            <div className="m3-login-method-selector">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('pin');
                  setLoginError('');
                }}
                className={`m3-method-tab ${loginMethod === 'pin' ? 'active' : ''}`}
              >
                <KeyRound size={15} />
                <span>{isHindi ? '6-Digit PIN' : '6-Digit PIN'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setLoginError('');
                }}
                className={`m3-method-tab ${loginMethod === 'password' ? 'active' : ''}`}
              >
                <Lock size={15} />
                <span>{isHindi ? 'पासवर्ड (Password)' : 'Password'}</span>
              </button>
            </div>

            {/* Mobile / ID Field */}
            <div className="auth-input-group">
              <label className="auth-label">
                {isHindi ? 'मोबाइल नंबर / यूजरनेम' : 'Mobile Number or Username'}
              </label>
              <div className="auth-field-wrapper">
                <Phone size={17} className="field-icon" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={isHindi ? 'उदा. 9876543210 या यूजरनेम' : 'e.g. 9876543210 or username'}
                  className="auth-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 6-Digit PIN Input Mode */}
            {loginMethod === 'pin' ? (
              <div className="m3-pin-auth-container">
                <div className="m3-pin-auth-header">
                  <div className="m3-pin-auth-label-wrap">
                    <KeyRound size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="m3-pin-auth-label">
                      {isHindi ? '6-अंकों का सुरक्षा पिन' : '6-Digit Security PIN'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPinMasked(!pinMasked)}
                    className="m3-pin-toggle-btn"
                    title={pinMasked ? (isHindi ? 'पिन दिखाएं' : 'Show PIN') : (isHindi ? 'पिन छुपाएं' : 'Hide PIN')}
                  >
                    {pinMasked ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{pinMasked ? (isHindi ? 'पिन दिखाएं' : 'Show PIN') : (isHindi ? 'पिन छुपाएं' : 'Hide PIN')}</span>
                  </button>
                </div>

                <div className="m3-pin-input-wrapper">
                  <SixDigitPinInput
                    value={loginPin}
                    onChange={setLoginPin}
                    masked={pinMasked}
                    error={!!loginError}
                    autoFocus={true}
                  />
                </div>

                <div className="m3-pin-hint-row">
                  <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" />
                  <span>
                    {isHindi ? 'तेज़ और सुरक्षित 1-टैप पिन ऑथेंटिकेशन' : 'Fast and encrypted 1-tap PIN authentication'}
                  </span>
                </div>
              </div>
            ) : (
              /* Password Fallback Mode */
              <div className="auth-input-group animate-fade-in">
                <label className="auth-label">
                  {isHindi ? 'पासवर्ड' : 'Password'}
                </label>
                <div className="auth-field-wrapper">
                  <Lock size={17} className="field-icon" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="field-toggle-btn"
                    title={showLoginPass ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="auth-submit-btn m3-ripple"
            >
              {loginLoading ? (
                <span>{isHindi ? 'सत्यापित हो रहा है...' : 'Verifying credentials...'}</span>
              ) : (
                <>
                  <span>
                    {loginMethod === 'pin'
                      ? (isHindi ? 'सुरक्षित पिन से प्रवेश करें' : 'Sign In with PIN')
                      : (isHindi ? 'लॉग इन करें' : 'Sign In')}
                  </span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="auth-footer-prompt">
              <span>{isHindi ? 'नया खाता चाहिए?' : "Don't have an account?"}</span>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="auth-switch-link"
              >
                {isHindi ? 'यहाँ साइन अप करें' : 'Sign up here'}
              </button>
            </div>
          </form>
        )}

        {/* ===================== SIGN UP FORM ===================== */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="auth-form-content animate-slide-up">
            <div className="auth-headings">
              <h2 className="auth-title">
                {isHindi ? 'नया खाता और 6-Digit PIN बनाएं' : 'Create Account & 6-Digit PIN'}
              </h2>
              <p className="auth-subtitle">
                {isHindi
                  ? 'अपना मोबाइल नंबर दर्ज करें और आसान 6-अंकों का लॉगिन पिन सेट करें'
                  : 'Enter your mobile number and set a 6-digit login PIN'}
              </p>
            </div>

            {signupError && (
              <div className="auth-alert-box error animate-slide-up">
                <AlertTriangle size={17} className="flex-shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            {signupSuccess && (
              <div className="auth-alert-box success animate-slide-up">
                <CheckCircle size={17} className="flex-shrink-0" />
                <span>{signupSuccess}</span>
              </div>
            )}

            <div className="auth-grid-2">
              <div className="auth-input-group">
                <label className="auth-label">
                  {isHindi ? 'पूरा नाम *' : 'Full Name *'}
                </label>
                <div className="auth-field-wrapper">
                  <User size={17} className="field-icon" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  {isHindi ? 'दुकान / बिज़नेस का नाम' : 'Store / Business Name'}
                </label>
                <div className="auth-field-wrapper">
                  <Building size={17} className="field-icon" />
                  <input
                    type="text"
                    value={signupBusiness}
                    onChange={(e) => setSignupBusiness(e.target.value)}
                    placeholder="e.g. Ramesh Textiles"
                    className="auth-input"
                  />
                </div>
              </div>
            </div>

            <div className="auth-grid-2">
              <div className="auth-input-group">
                <label className="auth-label">
                  {isHindi ? 'मोबाइल नंबर (Login ID) *' : 'Mobile Number (Login ID) *'}
                </label>
                <div className="auth-field-wrapper">
                  <Phone size={17} className="field-icon" />
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="9876543210"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  {isHindi ? 'ईमेल आईडी (वैकल्पिक)' : 'Email Address (Optional)'}
                </label>
                <div className="auth-field-wrapper">
                  <Mail size={17} className="field-icon" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="ramesh@textiles.in"
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            {/* 6-Digit PIN Setup */}
            <div className="auth-input-group">
              <div className="flex items-center justify-between mb-1">
                <label className="auth-label m-0">
                  {isHindi ? '6-अंकों का सुरक्षा पिन बनाएं (Create 6-Digit PIN) *' : 'Create 6-Digit PIN *'}
                </label>
                <button
                  type="button"
                  onClick={() => setSignupPinMasked(!signupPinMasked)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium bg-transparent border-0 cursor-pointer"
                >
                  {signupPinMasked ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{signupPinMasked ? (isHindi ? 'पिन दिखाएं' : 'Show') : (isHindi ? 'पिन छुपाएं' : 'Hide')}</span>
                </button>
              </div>
              <SixDigitPinInput
                value={signupPin}
                onChange={setSignupPin}
                masked={signupPinMasked}
                error={!!signupError && signupPin.length < 6}
              />
            </div>

            {/* Confirm 6-Digit PIN */}
            <div className="auth-input-group">
              <label className="auth-label mb-1">
                {isHindi ? 'पिन की पुष्टि करें (Confirm 6-Digit PIN) *' : 'Confirm 6-Digit PIN *'}
              </label>
              <SixDigitPinInput
                value={confirmPin}
                onChange={setConfirmPin}
                masked={signupPinMasked}
                error={!!signupError && confirmPin !== signupPin}
              />
            </div>

            {/* Plan Selector on Sign Up */}
            <div className="auth-input-group">
              <label className="auth-label">
                {isHindi ? 'सब्सक्रिप्शन प्लान चुनें' : 'Choose Subscription Plan'}
              </label>
              <div className="auth-plan-cards-grid">
                {/* 1. Free Trial */}
                <div
                  onClick={() => setSignupPlan('free')}
                  className={`auth-plan-card ${signupPlan === 'free' ? 'selected' : ''}`}
                >
                  <div className="auth-plan-header">
                    <span className="auth-plan-title">
                      <Gift size={14} className="text-emerald-500" />
                      {isHindi ? '14 दिन फ्री' : '14-Day Free'}
                    </span>
                    <span className="auth-plan-price-free">₹0</span>
                  </div>
                  <span className="auth-plan-desc">
                    {isHindi ? '14 दिन ट्रायल, कार्ड नहीं चाहिए' : '14 days trial, no card needed'}
                  </span>
                </div>

                {/* 2. Monthly Pro */}
                <div
                  onClick={() => setSignupPlan('monthly')}
                  className={`auth-plan-card ${signupPlan === 'monthly' ? 'selected' : ''}`}
                >
                  <div className="auth-plan-header">
                    <span className="auth-plan-title">
                      <Zap size={14} className="text-blue-500" />
                      {isHindi ? 'मासिक प्रो' : 'Monthly Pro'}
                    </span>
                    <span className="auth-plan-price">₹999<small>+GST</small></span>
                  </div>
                  <span className="auth-plan-desc">
                    {isHindi ? '30 दिन असीमित बिलिंग' : '30 days pro invoicing'}
                  </span>
                </div>

                {/* 3. 6-Months Super Saver */}
                <div
                  onClick={() => setSignupPlan('six_months')}
                  className={`auth-plan-card ${signupPlan === 'six_months' ? 'selected' : ''}`}
                >
                  <div className="auth-plan-header">
                    <span className="auth-plan-title">
                      <Sparkles size={14} className="text-amber-500" />
                      {isHindi ? '6 महीने सेवर' : '6-Mo Saver'}
                    </span>
                    <span className="auth-plan-price">₹4,999<small>+GST</small></span>
                  </div>
                  <span className="auth-plan-desc">
                    {isHindi ? '180 दिन (₹1,074 की बचत)' : '180 days (Save ₹1,074)'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={signupLoading}
              className="auth-submit-btn m3-ripple"
            >
              {signupLoading ? (
                <span>{isHindi ? 'खाता बन रहा है...' : 'Creating Account...'}</span>
              ) : (
                <>
                  <span>{isHindi ? '6-Digit PIN के साथ खाता बनाएं' : 'Create Account & Set PIN'}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="auth-footer-prompt">
              <span>{isHindi ? 'पहले से खाता है?' : 'Already have an account?'}</span>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="auth-switch-link"
              >
                {isHindi ? 'यहाँ लॉग इन करें' : 'Sign in here'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
