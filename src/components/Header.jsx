import React from 'react';
import { useApp } from '../context/AppContext';
import { Settings, User, Sparkles, ShieldCheck, BarChart3 } from 'lucide-react';

export default function Header({ onOpenProfile, onOpenSettings, onOpenAdmin, onOpenReporting }) {
  const { user, settings, setIsVoiceSessionActive } = useApp();
  const isHindi = settings.language === 'hi';

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
      </div>

      <div className="header-right">
        {/* Reporting Button */}
        {onOpenReporting && (
          <button
            type="button"
            onClick={() => {
              if (setIsVoiceSessionActive) setIsVoiceSessionActive(false);
              onOpenReporting();
            }}
            className="header-report-btn m3-ripple"
            title={isHindi ? 'बिजनेस रिपोर्टिंग: बिक्री, मुनाफ़ा व खरीद खाता' : 'Reports: Sales, Profit & Purchases'}
          >
            <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="header-btn-text">{isHindi ? 'रिपोर्ट्स' : 'Reports'}</span>
          </button>
        )}

        {/* Admin Portal Button */}
        <button
          type="button"
          onClick={onOpenAdmin}
          className={`header-admin-btn m3-ripple ${user.role === 'admin' ? 'active-admin' : ''}`}
          title={isHindi ? 'एडमिन पोर्टल: यूजर और सब्सक्रिप्शन' : 'Admin Portal: Users & Subscriptions'}
        >
          <ShieldCheck size={16} className="text-amber-500" />
          <span className="header-btn-text">{isHindi ? 'एडमिन' : 'Admin'}</span>
          {user.role === 'admin' && <span className="admin-dot-indicator" />}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="icon-button m3-ripple"
          title={isHindi ? 'सेटिंग्स व भाषा' : 'Settings & Language'}
          aria-label="Settings"
        >
          <Settings size={19} />
        </button>

        {/* User Profile Logo Avatar Button */}
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
