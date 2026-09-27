import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import BottomSearchBar from './components/BottomSearchBar';
import InvoiceWizard from './components/InvoiceWizard';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import InventoryModal from './components/InventoryModal';
import ReportingSection from './components/ReportingSection';
import AdminDashboardPage from './components/AdminDashboardPage';
import CustomersModal from './components/CustomersModal';
import { AlertTriangle } from 'lucide-react';

function BillieApp() {
  const { user, settings, setIsVoiceSessionActive } = useApp();
  const [currentView, setCurrentView] = useState(() => {
    return window.location.hash === '#/admin' || window.location.hash === '#admin'
      ? 'admin'
      : 'app';
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isReportingOpen, setIsReportingOpen] = useState(false);
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [activeCustomerForBill, setActiveCustomerForBill] = useState(null);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [promptHint, setPromptHint] = useState('');

  const isHindi = settings.language === 'hi';
  const isSubExpired =
    user.isLoggedIn &&
    user.role !== 'admin' &&
    (user.subscription?.status === 'expired' ||
      (user.subscription?.expiryDate && new Date(user.subscription.expiryDate) < new Date()));

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/admin' || window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('app');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openAdminPage = () => {
    window.location.hash = '#/admin';
    setCurrentView('admin');
  };

  const backToStore = () => {
    window.location.hash = '#/';
    setCurrentView('app');
  };

  const handleQuerySubmit = (query) => {
    setSubmittedQuery(query);
  };

  // FULL PAGE VIEW 1: SUPER ADMIN DASHBOARD PAGE
  if (currentView === 'admin') {
    return <AdminDashboardPage onBackToStore={backToStore} />;
  }

  // FULL PAGE VIEW 2: BILLIE BILLING STORE APP
  return (
    <div className="billie-app-viewport">
      {/* Top Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={openAdminPage}
        onOpenReporting={() => {
          if (setIsVoiceSessionActive) setIsVoiceSessionActive(false);
          setIsReportingOpen(true);
        }}
        onOpenCustomers={() => {
          if (setIsVoiceSessionActive) setIsVoiceSessionActive(false);
          setIsCustomersOpen(true);
        }}
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
            onClick={openAdminPage}
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
          onOpenAdmin={openAdminPage}
          onOpenReporting={() => {
            if (setIsVoiceSessionActive) setIsVoiceSessionActive(false);
            setIsReportingOpen(true);
          }}
          onOpenCustomers={() => {
            if (setIsVoiceSessionActive) setIsVoiceSessionActive(false);
            setIsCustomersOpen(true);
          }}
          activeCustomerForBill={activeCustomerForBill}
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
        onOpenAdmin={openAdminPage}
        onOpenReporting={() => {
          if (setIsVoiceSessionActive) setIsVoiceSessionActive(false);
          setIsReportingOpen(true);
        }}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />

      {/* Customers Directory & Invoices Modal */}
      <CustomersModal
        isOpen={isCustomersOpen}
        onClose={() => setIsCustomersOpen(false)}
        onSelectCustomerForBill={(cust) => {
          setActiveCustomerForBill(cust);
          setIsCustomersOpen(false);
        }}
      />

      {/* Reporting & Accounting Modal Dialog */}
      {isReportingOpen && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setIsReportingOpen(false)}
        >
          <div
            className="reporting-dialog-viewport animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <ReportingSection
              initialMode="sales"
              onClose={() => setIsReportingOpen(false)}
              isStandalone={false}
            />
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Billie Caught App Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ maxWidth: '440px', width: '100%', background: '#fff', borderRadius: '16px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '26px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>कुछ गड़बड़ हुई / Something went wrong</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              एप्लिकेशन को पुनः लोड करें। आपका बिल व डेटा पूरी तरह सुरक्षित है।
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              style={{ padding: '10px 24px', borderRadius: '10px', background: '#2563eb', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              रीफ्रेश करें (Reload App)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BillieApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
