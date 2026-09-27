import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Sliders,
  History,
  Download,
  Trash2,
  DollarSign,
  Percent,
  Volume2,
  Sun,
  Moon,
  FileText,
  Hash,
  Languages
} from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' }
];

export default function SettingsModal({ isOpen, onClose }) {
  const { user, settings, updateSettings, invoices, deleteInvoice, setLanguage } = useApp();
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'history'

  if (!isOpen) return null;

  const handleDownloadHistoryPDF = (inv) => {
    generateInvoicePDF(inv, user, settings);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="m3-dialog-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        {/* Dialog Header */}
        <div className="dialog-header">
          <div className="dialog-title-group">
            <h2 id="settings-dialog-title" className="dialog-title">Settings & History</h2>
            <p className="dialog-subtitle">Configure defaults, taxes, currency, and invoice history</p>
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

        {/* Tab Navigation */}
        <div className="m3-tabs-bar">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`m3-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Sliders size={16} />
            <span>Preferences</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`m3-tab-item ${activeTab === 'history' ? 'active' : ''}`}
          >
            <History size={16} />
            <span>Invoice History ({invoices.length})</span>
          </button>
        </div>

        {/* Dialog Content */}
        <div className="dialog-body custom-scrollbar">
          {activeTab === 'settings' ? (
            <div className="settings-preferences-view">
              {/* Currency Selector */}
              <div className="form-group">
                <label className="form-label">Default Currency Symbol</label>
                <div className="currency-grid">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => updateSettings({ currency: c.symbol })}
                      className={`currency-pill ${settings.currency === c.symbol ? 'selected' : ''}`}
                    >
                      <span className="cur-sym">{c.symbol}</span>
                      <span className="cur-code">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax & Discount Defaults */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Default Tax Rate (%)</label>
                  <div className="input-with-icon">
                    <Percent size={16} className="input-icon" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.defaultTaxRate}
                      onChange={(e) => updateSettings({ defaultTaxRate: Number(e.target.value) || 0 })}
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Invoice Number Prefix</label>
                  <div className="input-with-icon">
                    <Hash size={16} className="input-icon" />
                    <input
                      type="text"
                      value={settings.invoicePrefix}
                      onChange={(e) => updateSettings({ invoicePrefix: e.target.value })}
                      placeholder="INV-2026-"
                      className="m3-text-field"
                    />
                  </div>
                </div>
              </div>

              {/* Voice Feedback TTS Toggle */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <div className="toggle-label-row">
                    <Volume2 size={18} className="text-blue-500" />
                    <span className="toggle-title">Billie Voice Speech Response</span>
                  </div>
                  <span className="toggle-desc">
                    Billie speaks back responses using Web Speech Synthesis when you talk to it.
                  </span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.voiceFeedback}
                    onChange={(e) => updateSettings({ voiceFeedback: e.target.checked })}
                  />
                  <span className="slider round" />
                </label>
              </div>

              {/* Light / Dark Mode Toggle */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <div className="toggle-label-row">
                    {settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    <span className="toggle-title">Material Theme</span>
                  </div>
                  <span className="toggle-desc">
                    Switch between Light and Dark Material 3 visual design
                  </span>
                </div>
                <div className="theme-pills">
                  <button
                    type="button"
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`theme-pill ${settings.theme === 'light' ? 'active' : ''}`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`theme-pill ${settings.theme === 'dark' ? 'active' : ''}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Language Selector (Hindi / English) */}
              <div className="settings-toggle-row">
                <div className="toggle-info">
                  <div className="toggle-label-row">
                    <Languages size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="toggle-title">
                      {settings.language === 'hi' ? 'ऐप व आवाज़ की भाषा (Language)' : 'App & Voice Language'}
                    </span>
                  </div>
                  <span className="toggle-desc">
                    {settings.language === 'hi'
                      ? 'Billie ऐप और आवाज़ (Voice) की मुख्य भाषा चुनें'
                      : 'Choose your preferred language for voice and app UI'}
                  </span>
                </div>
                <div className="theme-pills">
                  <button
                    type="button"
                    onClick={() => setLanguage('hi')}
                    className={`theme-pill ${settings.language === 'hi' ? 'active' : ''}`}
                  >
                    🇮🇳 हिंदी (Hindi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`theme-pill ${settings.language === 'en' ? 'active' : ''}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="history-tab-view">
              {invoices.length === 0 ? (
                <div className="empty-history-state">
                  <FileText size={40} className="empty-icon text-slate-400" />
                  <h4>No invoices created yet</h4>
                  <p>Say or type 'generate invoice' on the main screen to create your first bill.</p>
                </div>
              ) : (
                <div className="history-invoices-list">
                  {invoices.map((inv) => (
                    <div key={inv.id || inv.invoiceNumber} className="history-invoice-item">
                      <div className="history-item-left">
                        <div className="history-invoice-num">{inv.invoiceNumber}</div>
                        <div className="history-customer-name">{inv.customerName}</div>
                        <div className="history-meta-sub">
                          {inv.date} • {inv.product || (inv.items && inv.items[0]?.name) || 'Invoice'}
                        </div>
                      </div>

                      <div className="history-item-right">
                        <span className="history-total-price">
                          {inv.currency || settings.currency || '$'}{(Number(inv.total || inv.grandTotal) || 0).toFixed(2)}
                        </span>

                        <div className="history-actions-row">
                          <button
                            type="button"
                            onClick={() => handleDownloadHistoryPDF(inv)}
                            className="history-download-btn m3-ripple"
                            title="Download PDF"
                          >
                            <Download size={15} />
                            <span>PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteInvoice(inv.id)}
                            className="history-delete-btn"
                            title="Delete invoice record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
