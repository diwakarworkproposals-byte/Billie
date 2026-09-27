import React from 'react';
import { useApp } from '../context/AppContext';
import { Settings, User, Wifi, WifiOff, Sparkles, CheckCircle2, Languages, ShieldCheck, BarChart3 } from 'lucide-react';

export default function Header({ onOpenProfile, onOpenSettings, onOpenAdmin, onOpenReporting }) {
  const { user, isOffline, isInstalled, settings, setLanguage } = useApp();
  const isHindi = settings.language === 'hi';

  const toggleLanguage = () => {
    setLanguage(isHindi ? 'en' : 'hi');
  };

  return (
    <header className="billie-header">
      <div className="header-left">
        <div className="logo-group">
          <div className="logo-icon-container">
            <Sparkles className="logo-sparkle" size={20} />
          </div>
          <div className="brand-info">
            <div className="brand-title-row">
              <h1 className="brand-name">Billie</h1>
              <span className="pwa-badge">PWA</span>
            </div>
            <p className="brand-subtitle">{isHindi ? 'स्मार्ट इनवॉइस असिस्टेंट' : 'Smart Invoice Assistant'}</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`status-pill ${isOffline ? 'offline' : 'online'}`}>
          {isOffline ? (
            <>
              <WifiOff size={13} />
              <span>{isHindi ? 'ऑफ़लाइन' : 'Offline'}</span>
            </>
          ) : (
            <>
              <Wifi size={13} />
              <span>{isInstalled ? (isHindi ? 'इंस्टॉल्ड' : 'Installed') : (isHindi ? 'ऑफ़लाइन रेडी' : 'Offline Ready')}</span>
            </>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Reporting Button */}
        {onOpenReporting && (
          <button
            type="button"
            onClick={onOpenReporting}
            className="header-report-btn m3-ripple"
            title={isHindi ? 'बिजनेस रिपोर्टिंग: बिक्री, मुनाफ़ा व खरीद खाता' : 'Reports: Sales, Profit & Purchases'}
          >
            <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>{isHindi ? 'रिपोर्ट्स' : 'Reports'}</span>
          </button>
        )}

        {/* Admin Portal Button */}
        <button
          type="button"
          onClick={onOpenAdmin}
          className={`header-admin-btn m3-ripple ${user.role === 'admin' ? 'active-admin' : ''}`}
          title={isHindi ? 'एडमिन पोर्टल: यूजर और ₹999/माह या ₹4,999/6 माह सब्सक्रिप्शन' : 'Admin Portal: Users & Subscriptions'}
        >
          <ShieldCheck size={16} className="text-amber-500" />
          <span>{isHindi ? 'एडमिन' : 'Admin'}</span>
          {user.role === 'admin' && <span className="admin-dot-indicator" />}
        </button>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="header-lang-btn m3-ripple"
          title={`Switch language / भाषा बदलें (${isHindi ? 'हिंदी' : 'English'})`}
        >
          <Languages size={16} />
          <span>{isHindi ? 'हिंदी' : 'English'}</span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="icon-button m3-ripple"
          title={isHindi ? 'सेटिंग्स और हिस्ट्री' : 'Settings & History'}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>

        {/* Profile Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="profile-button m3-ripple"
          title={user.isLoggedIn ? `${user.name} (${user.businessName || 'Profile'})` : 'Sign In / Profile'}
          aria-label="User Profile"
        >
          {user.isLoggedIn ? (
            <div className="avatar-circle">
              <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              <span className="active-dot" />
            </div>
          ) : (
            <div className="avatar-circle guest">
              <User size={18} />
            </div>
          )}
          <span className="profile-name-text">
            {user.isLoggedIn ? user.name.split(' ')[0] : (isHindi ? 'लॉग इन' : 'Sign In')}
          </span>
        </button>
      </div>
    </header>
  );
}
