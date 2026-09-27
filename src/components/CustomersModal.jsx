import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  X,
  Phone,
  Building,
  FileText,
  Download,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Receipt,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export default function CustomersModal({ isOpen, onClose, onSelectCustomerForBill }) {
  const {
    customers = [],
    addOrUpdateCustomer,
    updateCustomer,
    deleteCustomer,
    invoices = [],
    settings = {},
    user = {}
  } = useApp();

  const isHindi = settings.language === 'hi';
  const currency = settings.currency || '₹';

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedCustId, setExpandedCustId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Compute map of customer ID/name to invoices and spend stats
  const customerStats = useMemo(() => {
    const statsMap = {};

    (customers || []).forEach((cust) => {
      if (!cust) return;
      const custId = cust.id || `temp_${Math.random()}`;
      const custNameNorm = (cust.name || cust.companyName || '').toLowerCase().trim();
      const compNameNorm = (cust.companyName || '').toLowerCase().trim();
      const cleanPhone = (cust.phone || '').toString().replace(/\D/g, '');

      const matchedInvoices = (invoices || []).filter((inv) => {
        if (!inv) return false;
        const invCustName = (inv.customerName || '').toLowerCase().trim();
        const invPhone = (inv.customerPhone || '').toString().replace(/\D/g, '');

        if (cleanPhone && invPhone && cleanPhone === invPhone) return true;
        if (custNameNorm && invCustName === custNameNorm) return true;
        if (compNameNorm && invCustName === compNameNorm) return true;
        return false;
      });

      const totalSpent = matchedInvoices.reduce(
        (sum, inv) => sum + (Number(inv?.total || inv?.grandTotal) || 0),
        0
      );

      statsMap[custId] = {
        invoices: matchedInvoices,
        invoiceCount: matchedInvoices.length,
        totalSpent: totalSpent,
        lastBillDate: matchedInvoices[0]?.date || null
      };
    });

    return statsMap;
  }, [customers, invoices]);

  // Total summary across all customers
  const overallKPIs = useMemo(() => {
    const totalCusts = (customers || []).length;
    let totalRevenue = 0;
    let totalInvoices = 0;

    Object.values(customerStats || {}).forEach((stat) => {
      if (stat) {
        totalRevenue += Number(stat.totalSpent) || 0;
        totalInvoices += Number(stat.invoiceCount) || 0;
      }
    });

    return { totalCusts, totalRevenue, totalInvoices };
  }, [customers, customerStats]);

  // Filtered customer list by search query
  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();

    return customers.filter((cust) => {
      if (!cust) return false;
      const name = (cust.name || '').toLowerCase();
      const comp = (cust.companyName || '').toLowerCase();
      const phone = (cust.phone || '').toString().toLowerCase();
      const gst = (cust.gstNumber || '').toLowerCase();
      const email = (cust.email || '').toLowerCase();
      const addr = (cust.address || '').toLowerCase();
      return (
        name.includes(q) ||
        comp.includes(q) ||
        phone.includes(q) ||
        gst.includes(q) ||
        email.includes(q) ||
        addr.includes(q)
      );
    });
  }, [customers, searchQuery]);

  const resetForm = () => {
    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setGstNumber('');
    setAddress('');
    setFormError('');
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleStartEdit = (cust) => {
    setEditingId(cust.id);
    setName(cust.name || '');
    setCompanyName(cust.companyName || '');
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setGstNumber(cust.gstNumber || '');
    setAddress(cust.address || '');
    setFormError('');
    setIsAddingNew(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() && !companyName.trim()) {
      setFormError(
        isHindi
          ? 'ग्राहक का नाम या कंपनी का नाम लिखना अनिवार्य है!'
          : 'Customer Name or Company Name is required!'
      );
      return;
    }

    if (editingId) {
      updateCustomer(editingId, {
        name: name.trim() || companyName.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        address: address.trim()
      });
      setSuccessMsg(isHindi ? '✓ ग्राहक विवरण अपडेट हो गया!' : '✓ Customer updated successfully!');
    } else {
      addOrUpdateCustomer({
        name: name.trim() || companyName.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        address: address.trim()
      });
      setSuccessMsg(isHindi ? '✓ नया ग्राहक जुड़ गया!' : '✓ New customer added successfully!');
    }

    resetForm();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteCustomer = (id, custName) => {
    const confirmMsg = isHindi
      ? `क्या आप ग्राहक "${custName}" को सूची से हटाना चाहते हैं?`
      : `Are you sure you want to delete customer "${custName}"?`;
    if (window.confirm(confirmMsg)) {
      deleteCustomer(id);
    }
  };

  const handleDownloadInvoice = (inv) => {
    generateInvoicePDF(inv, user, settings);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="m3-customers-modal-sheet animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="m3-dialog-header-enhanced">
          <div className="flex items-center gap-3">
            <div className="m3-dialog-icon-pill indigo">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <h3 className="m3-dialog-title">
                {isHindi ? 'ग्राहक डायरेक्टरी व बिल इतिहास' : 'Customer Directory & Invoices'}
              </h3>
              <p className="m3-dialog-subtitle">
                {isHindi
                  ? 'ग्राहकों की सूची, संपर्क, GSTIN और पिछले सभी बिल'
                  : 'Customer profiles, GSTIN, and complete billing history'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="m3-dialog-close-circle"
            title={isHindi ? 'बंद करें' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="m3-dialog-body-scroll custom-scrollbar">
          {/* Success Banner */}
          {successMsg && (
            <div className="m3-alert-banner success animate-fade-in mb-3">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Summary KPI Cards */}
          <div className="m3-customers-kpi-row">
            <div className="cust-kpi-box">
              <span className="cust-kpi-label">{isHindi ? 'कुल ग्राहक' : 'Total Customers'}</span>
              <span className="cust-kpi-num text-blue-600 dark:text-blue-400">
                {overallKPIs.totalCusts}
              </span>
            </div>
            <div className="cust-kpi-box">
              <span className="cust-kpi-label">{isHindi ? 'कुल बिक्री (व्यापार)' : 'Total Revenue'}</span>
              <span className="cust-kpi-num text-emerald-600 dark:text-emerald-400">
                {currency}{overallKPIs.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="cust-kpi-box">
              <span className="cust-kpi-label">{isHindi ? 'कुल बिल' : 'Invoices Created'}</span>
              <span className="cust-kpi-num text-indigo-600 dark:text-indigo-400">
                {overallKPIs.totalInvoices}
              </span>
            </div>
          </div>

          {/* Search Bar & Add Customer Button */}
          <div className="m3-customers-action-bar mt-3.5">
            <div className="m3-customers-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHindi
                    ? 'ग्राहक का नाम, कंपनी, मोबाइल नंबर या GST सर्च करें...'
                    : 'Search customer name, company, phone or GSTIN...'
                }
                className="m3-customers-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-btn"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (isAddingNew && !editingId) {
                  setIsAddingNew(false);
                } else {
                  resetForm();
                  setIsAddingNew(true);
                }
              }}
              className="m3-add-customer-btn m3-ripple"
            >
              {isAddingNew && !editingId ? <X size={16} /> : <Plus size={16} />}
              <span>
                {isAddingNew && !editingId
                  ? (isHindi ? 'फॉर्म बंद करें' : 'Close Form')
                  : (isHindi ? '+ नया ग्राहक जोड़ें' : '+ Add Customer')}
              </span>
            </button>
          </div>

          {/* Add / Edit Customer Form Card (Expands when button clicked) */}
          {isAddingNew && (
            <form onSubmit={handleFormSubmit} className="m3-customer-form-card animate-slide-up mt-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Users size={16} className="text-blue-500" />
                  <span>
                    {editingId
                      ? (isHindi ? 'ग्राहक विवरण संपादित करें' : 'Edit Customer Profile')
                      : (isHindi ? 'नया ग्राहक विवरण जोड़ें' : 'Add New Customer Profile')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {formError && (
                <div className="form-error-alert mb-3 animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.8rem', fontWeight: 600 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, color: '#dc2626' }} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Contact Name */}
                <div className="m3-form-field-group">
                  <label className="m3-field-label">
                    {isHindi ? 'ग्राहक / व्यक्ति का नाम *' : 'Customer / Contact Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isHindi ? 'जैसे: अमित शर्मा' : 'e.g. Amit Sharma'}
                    className="m3-enhanced-input text-field-only"
                  />
                </div>

                {/* Company Name */}
                <div className="m3-form-field-group">
                  <label className="m3-field-label">
                    {isHindi ? 'कंपनी / फर्म का नाम (वैकल्पिक)' : 'Company / Business Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={isHindi ? 'जैसे: शर्मा गारमेंट्स प्राइवेट लिमिटेड' : 'e.g. Sharma Garments Pvt Ltd'}
                    className="m3-enhanced-input text-field-only"
                  />
                </div>

                {/* Mobile / Phone */}
                <div className="m3-form-field-group">
                  <label className="m3-field-label">
                    {isHindi ? 'मोबाइल नंबर (Mobile Phone)' : 'Mobile Phone'}
                  </label>
                  <div className="m3-outlined-input-wrap">
                    <span className="m3-input-prefix">📞</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98101 23456"
                      className="m3-enhanced-input"
                    />
                  </div>
                </div>

                {/* GST Number */}
                <div className="m3-form-field-group">
                  <label className="m3-field-label">
                    {isHindi ? 'GSTIN नंबर (GST Number - वैकल्पिक)' : 'GST Number (Optional)'}
                  </label>
                  <div className="m3-outlined-input-wrap">
                    <span className="m3-input-prefix">🏢</span>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="07AAAAA0000A1Z5"
                      className="m3-enhanced-input uppercase font-mono"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="m3-form-field-group">
                  <label className="m3-field-label">
                    {isHindi ? 'ईमेल पता (Email - वैकल्पिक)' : 'Email Address (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="m3-enhanced-input text-field-only"
                  />
                </div>

                {/* Address */}
                <div className="m3-form-field-group">
                  <label className="m3-field-label">
                    {isHindi ? 'पता / शहर (Address - वैकल्पिक)' : 'Address / City (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isHindi ? 'जैसे: सेक्टर 14, गुरुग्राम' : 'e.g. Sector 14, Gurugram'}
                    className="m3-enhanced-input text-field-only"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="m3-btn-secondary"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="m3-btn-primary"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {editingId
                      ? (isHindi ? 'बदलाव सुरक्षित करें' : 'Update Customer')
                      : (isHindi ? 'ग्राहक जोड़ें' : 'Save Customer')}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Vertical Customer Cards List */}
          <div className="m3-customer-cards-list mt-3.5">
            {filteredCustomers.length === 0 ? (
              <div className="m3-empty-state-box">
                <Users size={36} className="text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {searchQuery
                    ? (isHindi ? 'कोई ग्राहक नहीं मिला' : 'No matching customers found')
                    : (isHindi ? 'कोई ग्राहक उपलब्ध नहीं है' : 'No customers in directory yet')}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? (isHindi ? 'सर्च शब्द बदलें या नया ग्राहक जोड़ें।' : 'Try different keywords or add a new customer.')
                    : (isHindi ? 'जब भी आप किसी के नाम पर बिल बनाएंगे, वह ग्राहक अपने आप यहाँ जुड़ जाएगा।' : 'Whenever you bill someone, they are automatically saved here.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAddingNew(true);
                  }}
                  className="m3-btn-primary mt-3 text-xs"
                >
                  <Plus size={14} />
                  <span>{isHindi ? 'नया ग्राहक जोड़ें' : 'Add First Customer'}</span>
                </button>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const stats = customerStats[cust.id] || {
                  invoices: [],
                  invoiceCount: 0,
                  totalSpent: 0,
                  lastBillDate: null
                };
                const isExpanded = expandedCustId === cust.id;
                const custDisplayName = cust?.name || cust?.companyName || (isHindi ? 'अनाम ग्राहक' : 'Customer');
                const initials = (custDisplayName + '')
                  .trim()
                  .split(/\s+/)
                  .map((w) => (w ? w[0] : ''))
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'C';

                return (
                  <div key={cust.id || `cust_${Math.random()}`} className="m3-customer-vertical-card animate-fade-in">
                    {/* Card Top Row: Avatar, Names, GST Badge & Edit/Delete actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="cust-avatar-pill">
                          <span>{initials}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="cust-primary-name truncate font-bold text-base text-slate-900 dark:text-slate-100">
                              {custDisplayName}
                            </h4>
                            {cust.companyName && cust.companyName !== cust.name && (
                              <span className="m3-badge-company-tag">
                                <Building size={11} />
                                <span className="truncate max-w-[140px]">{cust.companyName}</span>
                              </span>
                            )}
                          </div>

                          {/* Contact Details row */}
                          <div className="flex items-center flex-wrap gap-2.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {cust.phone ? (
                              <a
                                href={`tel:${cust.phone}`}
                                className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Phone size={12} />
                                <span>{cust.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">
                                {isHindi ? 'फ़ोन नंबर नहीं है' : 'No phone'}
                              </span>
                            )}

                            {cust.gstNumber && (
                              <span className="m3-badge-gst-tag font-mono">
                                GSTIN: {cust.gstNumber}
                              </span>
                            )}

                            {cust.address && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{cust.address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Top Right Action Icons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cust)}
                          className="cust-icon-btn edit"
                          title={isHindi ? 'संपादित करें' : 'Edit customer'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                          className="cust-icon-btn delete"
                          title={isHindi ? 'हटाएं' : 'Delete customer'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Financial Stats Bar */}
                    <div className="cust-card-stats-bar mt-3">
                      <div className="cust-stat-item">
                        <span className="stat-label">{isHindi ? 'कुल बिल कटे' : 'Total Bills'}</span>
                        <span className="stat-val font-bold text-slate-900 dark:text-slate-100">
                          {stats.invoiceCount} {isHindi ? 'बिल' : 'bills'}
                        </span>
                      </div>
                      <div className="cust-stat-item">
                        <span className="stat-label">{isHindi ? 'कुल खरीदारी' : 'Total Spent'}</span>
                        <span className="stat-val font-extrabold text-emerald-600 dark:text-emerald-400">
                          {currency}{stats.totalSpent.toLocaleString()}
                        </span>
                      </div>
                      <div className="cust-stat-item">
                        <span className="stat-label">{isHindi ? 'अंतिम बिल' : 'Last Billed'}</span>
                        <span className="stat-val text-slate-600 dark:text-slate-400 font-medium">
                          {stats.lastBillDate || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Row: View Invoices button & Bill Now button */}
                    <div className="cust-card-footer-row mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setExpandedCustId(isExpanded ? null : cust.id)}
                        className={`m3-expand-history-btn ${isExpanded ? 'active' : ''}`}
                      >
                        <Receipt size={14} />
                        <span>
                          {isHindi ? 'बिल इतिहास (Invoices)' : 'Invoice History'} ({stats.invoiceCount})
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {onSelectCustomerForBill && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCustomerForBill(cust);
                            onClose();
                          }}
                          className="m3-bill-now-btn"
                          title={isHindi ? 'इस ग्राहक के लिए बिल बनाएं' : 'Generate invoice for this customer'}
                        >
                          <Sparkles size={13} />
                          <span>{isHindi ? 'बिल बनाएं' : 'Bill Customer'}</span>
                        </button>
                      )}
                    </div>

                    {/* Complete Invoice History Accordion (Expands upon click) */}
                    {isExpanded && (
                      <div className="cust-invoices-accordion animate-slide-up mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {isHindi ? `कटे हुए बिलों की सूची (${stats.invoiceCount})` : `Invoices Generated (${stats.invoiceCount})`}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {isHindi ? 'नया से पुराना' : 'Latest to oldest'}
                          </span>
                        </div>

                        {stats.invoices.length === 0 ? (
                          <div className="text-center py-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-400">
                            {isHindi ? 'इस ग्राहक का अभी तक कोई बिल नहीं कटा है।' : 'No invoices generated yet for this customer.'}
                          </div>
                        ) : (
                          <div className="cust-invoices-sublist">
                            {stats.invoices.map((inv) => (
                              <div key={inv.id} className="cust-sub-invoice-row">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inv-num-pill">{inv.invoiceNumber}</span>
                                    <span className="text-[11px] text-slate-400">{inv.date}</span>
                                    <span className="m3-badge-status paid text-[10px] py-0 px-1.5">
                                      {inv.paymentMethod || (isHindi ? 'चुकता' : 'Paid')}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                                    🛍️ {inv.items && inv.items.length > 0
                                      ? inv.items.map((it) => `${it.name} (${it.quantity} pcs)`).join(', ')
                                      : (inv.product || 'Items')}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                  <div className="text-right">
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                                      {currency}{Number(inv.total || inv.grandTotal || 0).toLocaleString()}
                                    </span>
                                    {Number(inv.discountAmount || inv.discount) > 0 && (
                                      <span className="text-[10px] text-emerald-600 font-semibold block">
                                        -{currency}{Number(inv.discountAmount || inv.discount)} {isHindi ? 'छूट' : 'off'}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(inv)}
                                    className="cust-inv-download-btn"
                                    title={isHindi ? 'PDF डाउनलोड करें' : 'Download Invoice PDF'}
                                  >
                                    <Download size={13} />
                                    <span className="hidden sm:inline">PDF</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
