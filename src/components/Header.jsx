import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, User, Sparkles, ShieldCheck, Users, Wifi, WifiOff, Bell, BellRing } from 'lucide-react';
import { isAppOnline, getPendingSyncCount, initOfflineSync } from '../utils/offlineSync';
import { requestNotificationPermission } from '../utils/notificationService';

export default function Header({ onOpenProfile, onOpenSettings, onOpenAdmin, onOpenReporting, onOpenCustomers }) {
  const { user, settings, setIsVoiceSessionActive } = useApp();
  const isHindi = settings.language === 'hi';
  const [online, setOnline] = useState(isAppOnline());
  const [pendingCount, setPendingCount] = useState(getPendingSyncCount());
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }

    const handleSyncStatus = (e) => {
      if (e.detail) {
        setOnline(e.detail.isOnline);
        setPendingCount(e.detail.pendingCount);
      }
    };

    window.addEventListener('billie-sync-status', handleSyncStatus);
    initOfflineSync(() => {
      setOnline(true);
      setPendingCount(getPendingSyncCount());
    });

    return () => {
      window.removeEventListener('billie-sync-status', handleSyncStatus);
    };
  }, []);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    if (granted) {
      alert(isHindi ? 'सूचनाएं (Notifications) चालू कर दी गई हैं!' : 'Notifications enabled successfully!');
    }
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
      </div>

      <div className="header-right">
        {/* Offline Sync Status Indicator */}
        <div
          className={`network-status-pill ${online ? 'online' : 'offline'}`}
          title={online ? 'Online - All data synced' : `${pendingCount} actions queued for offline sync`}
        >
          {online ? <Wifi size={13} /> : <WifiOff size={13} className="animate-pulse" />}
          <span className="network-status-text">
            {online ? 'Online' : (isHindi ? `ऑफलाइन (${pendingCount})` : `Offline (${pendingCount})`)}
          </span>
        </div>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={handleToggleNotifications}
          className={`icon-button m3-ripple ${notifEnabled ? 'notif-active' : ''}`}
          title={notifEnabled ? (isHindi ? 'सूचनाएं चालू हैं' : 'Notifications Active') : (isHindi ? 'सूचनाएं चालू करें' : 'Enable Notifications')}
          aria-label="Toggle Notifications"
        >
          {notifEnabled ? <BellRing size={18} className="text-amber-500" /> : <Bell size={18} />}
        </button>
        {/* Customers Tab Button */}
        {onOpenCustomers && (
          <button
            type="button"
            onClick={() => {
              if (setIsVoiceSessionActive) setIsVoiceSessionActive(false);
              onOpenCustomers();
            }}
            className="header-report-btn customers-btn m3-ripple"
            title={isHindi ? 'ग्राहक डायरेक्टरी व बिल इतिहास' : 'Customers Directory & Invoices'}
          >
            <Users size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="header-btn-text">{isHindi ? 'ग्राहक' : 'Customers'}</span>
          </button>
        )}

        {/* Admin Portal Button - Strictly visible ONLY to Super Admin */}
        {user?.role === 'admin' && onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="header-admin-btn active-admin m3-ripple"
            title={isHindi ? 'एडमिन पोर्टल: यूजर और सब्सक्रिप्शन' : 'Admin Portal: Users & Subscriptions'}
          >
            <ShieldCheck size={16} className="text-amber-500" />
            <span className="header-btn-text">{isHindi ? 'एडमिन' : 'Admin'}</span>
            <span className="admin-dot-indicator" />
          </button>
        )}

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
