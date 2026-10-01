import React, { useState } from 'react';
import { useApp, SUBSCRIPTION_PLANS } from '../context/AppContext';
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
  Gift
} from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const { authenticate, registerUser, settings, setLanguage } = useApp();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupBusiness, setSignupBusiness] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupPlan, setSignupPlan] = useState('free'); // 'free' | 'monthly' | 'six_months'
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const isHindi = settings.language === 'hi';

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    setTimeout(() => {
      const res = authenticate(loginId, loginPass);
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
    setSignupLoading(true);

    setTimeout(() => {
      const res = registerUser({
        name: signupName,
        businessName: signupBusiness,
        email: signupEmail,
        phone: signupPhone,
        password: signupPass,
        planId: signupPlan
      });
      setSignupLoading(false);

      if (!res.success) {
        setSignupError(res.error || (isHindi ? 'खाता निर्माण विफल रहा!' : 'Account creation failed!'));
      } else {
        setSignupSuccess(
          isHindi
            ? `✓ स्वागत है, ${res.user.name}! आपका खाता तैयार है।`
            : `✓ Welcome, ${res.user.name}! Your account has been created.`
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
                {isHindi ? 'Billie में लॉग इन करें' : 'Sign in to Billie'}
              </h2>
              <p className="auth-subtitle">
                {isHindi
                  ? 'अपने ईमेल या यूजरनेम और पासवर्ड से प्रवेश करें'
                  : 'Enter your credentials to access your store'}
              </p>
            </div>

            {loginError && (
              <div className="auth-alert-box error animate-slide-up">
                <AlertTriangle size={17} className="flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-label">
                {isHindi ? 'ईमेल या यूजरनेम (Login ID)' : 'Email or Username'}
              </label>
              <div className="auth-field-wrapper">
                <Mail size={17} className="field-icon" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={isHindi ? 'उदा. your@store.com या Diwakar' : 'e.g. your@store.com or Diwakar'}
                  className="auth-input"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="auth-input-group">
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

            <button
              type="submit"
              disabled={loginLoading}
              className="auth-submit-btn m3-ripple"
            >
              {loginLoading ? (
                <span>{isHindi ? 'लॉग इन हो रहा है...' : 'Signing in...'}</span>
              ) : (
                <>
                  <span>{isHindi ? 'लॉग इन करें' : 'Sign In'}</span>
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
                {isHindi ? 'नया खाता बनाएं' : 'Create an Account'}
              </h2>
              <p className="auth-subtitle">
                {isHindi
                  ? 'तुरंत 14-दिन का निःशुल्क ट्रायल शुरू करें'
                  : 'Start your 14-day free trial or choose a plan'}
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
                  {isHindi ? 'ईमेल आईडी *' : 'Email Address *'}
                </label>
                <div className="auth-field-wrapper">
                  <Mail size={17} className="field-icon" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="ramesh@textiles.in"
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  {isHindi ? 'मोबाइल नंबर *' : 'Phone Number *'}
                </label>
                <div className="auth-field-wrapper">
                  <Phone size={17} className="field-icon" />
                  <input
                    type="tel"
                    required
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="auth-input"
                  />
                </div>
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">
                {isHindi ? 'पासवर्ड (कम से कम 4 अक्षर) *' : 'Password (min 4 chars) *'}
              </label>
              <div className="auth-field-wrapper">
                <Lock size={17} className="field-icon" />
                <input
                  type={showSignupPass ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={signupPass}
                  onChange={(e) => setSignupPass(e.target.value)}
                  placeholder="Create secure password"
                  className="auth-input pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPass(!showSignupPass)}
                  className="field-toggle-btn"
                  title={showSignupPass ? 'Hide password' : 'Show password'}
                >
                  {showSignupPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                      {isHindi ? '14 दिन फ्री ट्रायल' : '14-Day Free'}
                    </span>
                    <span className="auth-plan-price-free">₹0</span>
                  </div>
                  <span className="auth-plan-desc">
                    {isHindi ? 'बिना क्रेडिट कार्ड के 14 दिन मुफ्त' : '14 days free trial, no card needed'}
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
                  <span>{isHindi ? 'खाता बनाएं और शुरू करें' : 'Create Account & Start'}</span>
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
