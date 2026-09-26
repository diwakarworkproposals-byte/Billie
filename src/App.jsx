import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import BottomSearchBar from './components/BottomSearchBar';
import InvoiceWizard from './components/InvoiceWizard';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import InventoryModal from './components/InventoryModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import { useApp } from './context/AppContext';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

function BillieApp() {
  const { user, settings } = useApp();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [promptHint, setPromptHint] = useState('');

  const isHindi = settings.language === 'hi';
  const isSubExpired = user.isLoggedIn && user.role !== 'admin' && (
    user.subscription?.status === 'expired' ||
    (user.subscription?.expiryDate && new Date(user.subscription.expiryDate) < new Date())
  );

  const handleQuerySubmit = (query) => {
    setSubmittedQuery(query);
  };

  return (
    <div className="billie-app-viewport">
      {/* Top Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Subscription Expired Alert Banner */}
      {isSubExpired && (
        <div className="subscription-warning-strip animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              {isHindi
                ? 'चेतावनी: आपका Billie सब्सक्रिप्शन समाप्त हो गया है! कृपया जारी रखने के लिए एडमिन से रिन्यू करवाएं (₹999/माह या ₹4,999/6 माह + 18% GST)।'
                : 'Notice: Your Billie subscription has expired! Please renew to keep all pro features (₹999/mo or ₹4,999/6mo + 18% GST).'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="sub-renew-strip-btn"
          >
            {isHindi ? 'एडमिन पोर्टल' : 'Admin Portal'}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="billie-content-area custom-scrollbar">
        <InvoiceWizard
          externalQuery={submittedQuery}
          onPromptHintChange={setPromptHint}
          onResetExternalQuery={() => setSubmittedQuery('')}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      </main>

      {/* Floating Center-Bottom Search & Voice Bar */}
      <BottomSearchBar
        onQuerySubmit={handleQuerySubmit}
        activePromptHint={promptHint}
      />

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BillieApp />
    </AppProvider>
  );
}
