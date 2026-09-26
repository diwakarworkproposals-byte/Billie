import React from 'react';
import { useApp } from '../context/AppContext';
import { Settings, User, Wifi, WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Header({ onOpenProfile, onOpenSettings }) {
  const { user, isOffline, isInstalled } = useApp();

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
            <p className="brand-subtitle">Smart Invoice Assistant</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`status-pill ${isOffline ? 'offline' : 'online'}`}>
          {isOffline ? (
            <>
              <WifiOff size={13} />
              <span>Offline Mode</span>
            </>
          ) : (
            <>
              <Wifi size={13} />
              <span>{isInstalled ? 'Installed App' : 'Offline Ready'}</span>
            </>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="icon-button m3-ripple"
          title="App Settings & History"
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
            {user.isLoggedIn ? user.name.split(' ')[0] : 'Sign In'}
          </span>
        </button>
      </div>
    </header>
  );
}
