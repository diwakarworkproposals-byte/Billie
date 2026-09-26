import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import BottomSearchBar from './components/BottomSearchBar';
import InvoiceWizard from './components/InvoiceWizard';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';

function BillieApp() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [promptHint, setPromptHint] = useState('');

  const handleQuerySubmit = (query) => {
    setSubmittedQuery(query);
  };

  return (
    <div className="billie-app-viewport">
      {/* Top Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="billie-content-area custom-scrollbar">
        <InvoiceWizard
          externalQuery={submittedQuery}
          onPromptHintChange={setPromptHint}
          onResetExternalQuery={() => setSubmittedQuery('')}
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
