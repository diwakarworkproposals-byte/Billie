import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Package
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onOpenInventory }) {
  const {
    user,
    login,
    logout,
    updateProfile,
    isInstallable,
    isInstalled,
    installPWA,
    isOffline,
    inventory,
    settings
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    businessName: user.businessName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    taxId: user.taxId || ''
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginEmail) {
      login(loginEmail, 'Alex Morgan', 'Apex Studio');
    }
  };

  const handleDemoLogin = () => {
    login('alex@apexstudio.io', 'Alex Morgan', 'Apex Studio & Commerce');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await installPWA();
    } else {
      alert("To install Billie:\n• Chrome/Edge: Look for the install icon (⊕) in the browser address bar.\n• iOS Safari: Tap Share -> 'Add to Home Screen'.");
    }
  };

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
              {user.isLoggedIn ? 'Business Profile' : 'Sign In to Billie'}
            </h2>
            <p className="dialog-subtitle">
              {user.isLoggedIn
                ? 'Manage your invoice branding and offline PWA settings'
                : 'Log in to save invoices and sync business details'}
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
          {/* CASE 1: Logged Out -> Login Page */}
          {!user.isLoggedIn ? (
            <div className="login-form-container">
              <div className="login-hero-badge">
                <Sparkles size={28} className="text-blue-500" />
              </div>
              <h3 className="login-heading">Welcome Back to Billie</h3>
              <p className="login-description">
                Sign in to manage your company details, default currency, and past invoices.
              </p>

              <form onSubmit={handleLoginSubmit} className="material-form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="merchant@business.com"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="m3-text-field"
                  />
                </div>

                <button
                  type="submit"
                  className="m3-button-filled w-full m3-ripple"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </button>

                <div className="demo-login-divider">
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="m3-button-tonal w-full m3-ripple"
                >
                  <Sparkles size={18} />
                  <span>Quick Demo Sign In (1-Tap)</span>
                </button>
              </form>
            </div>
          ) : (
            /* CASE 2: Logged In -> Profile Settings & PWA Download */
            <div className="profile-details-view">
              {/* Profile Avatar Card */}
              <div className="profile-identity-card">
                <div className="profile-avatar-large">
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : 'B'}</span>
                </div>
                <div className="profile-identity-text">
                  <h3 className="profile-user-name">{user.name}</h3>
                  <span className="profile-business-tag">{user.businessName || 'Business Owner'}</span>
                  <span className="profile-email-sub">{user.email}</span>
                </div>
              </div>

              {/* Form / Details */}
              <form onSubmit={handleSaveProfile} className="material-form mt-4">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
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
                    <label className="form-label">Business / Company Name</label>
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
                    <label className="form-label">Business Email</label>
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
                    <label className="form-label">Business Phone</label>
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
                  <label className="form-label">Business Address (Shown on Invoice)</label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="input-icon" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street, City, State, ZIP"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tax ID / GSTIN / VAT Number</label>
                  <div className="input-with-icon">
                    <FileCheck size={16} className="input-icon" />
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="e.g. VAT-12345678"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="m3-button-filled w-full m3-ripple"
                >
                  <span>Save Profile Details</span>
                </button>
              </form>

              {/* Inventory Management Card */}
              <div className="profile-inventory-card mt-5">
                <div className="profile-inventory-header">
                  <div className="profile-inventory-icon-box">
                    <Package size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="profile-inventory-title">
                      {settings.language === 'hi' ? '📦 इन्वेंटरी एवं स्टॉक प्रबंधन' : '📦 Inventory & Stock'}
                    </h4>
                    <p className="profile-inventory-desc">
                      {settings.language === 'hi'
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
                    <span>{settings.language === 'hi' ? 'इन्वेंटरी' : 'Inventory'}</span>
                  </button>
                </div>
              </div>

              {/* PWA Download / Offline Mode Card */}
              <div className="pwa-download-card">
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

              {/* Logout Button */}
              <div className="logout-section mt-6">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="logout-button m3-ripple"
                >
                  <LogOut size={17} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
