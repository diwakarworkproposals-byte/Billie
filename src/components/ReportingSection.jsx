import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Minus,
  ChevronDown,
  ShoppingBag,
  Phone,
  ArrowUpRight,
  X,
  Check,
  Receipt,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  User,
  Building,
  FileText,
  Download,
  Package
} from 'lucide-react';

export default function ReportingSection({
  initialMode = 'sales',
  onClose,
  isStandalone = false
}) {
  const {
    user,
    invoices,
    inventory,
    purchases,
    addPurchase,
    recordPurchasePayment,
    deletePurchase,
    settings
  } = useApp();

  const isHindi = settings.language === 'hi';
  const currency = settings.currency || '₹';

  // Active Report View Mode: 'sales' (बिक्री रिपोर्ट) or 'purchase' (खरीददारी व सप्लायर खाता)
  const [reportMode, setReportMode] = useState(initialMode);

  // Time filter for Sales: 'today' (Daily) | 'week' (Weekly) | 'month' (Monthly) | 'all' (All Time)
  const [salesTimeFilter, setSalesTimeFilter] = useState('today');

  // Purchase filters
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('all'); // 'all' | 'pending' | 'due' | 'paid'
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');

  // Modals for Purchase Accounting
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [activePaymentPurchase, setActivePaymentPurchase] = useState(null);

  // Record Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Add Purchase Bill Form State (Supports multiple products per bill)
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { name: '', quantity: 1, unitCost: '' }
  ]);
  const [newPaidNow, setNewPaidNow] = useState('0');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 15);
    return d.toISOString().split('T')[0];
  });
  const [newNotes, setNewNotes] = useState('');
  const [newAddToStock, setNewAddToStock] = useState(true);
  const [addBillError, setAddBillError] = useState('');
  const [addBillSuccess, setAddBillSuccess] = useState('');

  const handleAddItem = () => {
    setPurchaseItems((prev) => [...prev, { name: '', quantity: 1, unitCost: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (purchaseItems.length <= 1) return;
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setPurchaseItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateTotalBill = () => {
    return purchaseItems.reduce((sum, item) => {
      const q = Math.max(1, Number(item.quantity) || 1);
      const c = Math.max(0, Number(item.unitCost) || 0);
      return sum + q * c;
    }, 0);
  };

  // Cost map from inventory for calculating profit
  const productCostMap = useMemo(() => {
    const map = {};
    inventory.forEach((item) => {
      if (item.name) {
        map[item.name.toLowerCase().trim()] = Number(item.costPrice) || 0;
      }
    });
    return map;
  }, [inventory]);

  // Helper to parse dates safely
  const parseDateSafe = (dateStr, rawDate) => {
    if (rawDate) return new Date(rawDate);
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // -------------------------------------------------------------
  // 1. SALES REPORT CALCULATIONS
  // -------------------------------------------------------------
  const processedInvoices = useMemo(() => {
    return invoices.map((inv) => {
      const invDate = parseDateSafe(inv.date, inv.rawDate);
      let invCost = 0;

      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((it) => {
          const normName = (it.name || '').toLowerCase().trim();
          const knownCost = productCostMap[normName];
          const unitCost = knownCost !== undefined && knownCost > 0 ? knownCost : (Number(it.price) || 0) * 0.65;
          const qty = Number(it.quantity) || 1;
          invCost += qty * unitCost;
        });
      } else {
        invCost = (Number(inv.total) || 0) * 0.65;
      }

      const invRevenue = Number(inv.total) || 0;
      const invProfit = Math.max(0, invRevenue - invCost);
      const invMargin = invRevenue > 0 ? (invProfit / invRevenue) * 100 : 0;

      return {
        ...inv,
        parsedDate: invDate,
        totalCost: invCost,
        netProfit: invProfit,
        marginPercent: invMargin
      };
    });
  }, [invoices, productCostMap]);

  // Today's Date String in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered Invoices according to selected time range (Daily, Weekly, Monthly, All)
  const filteredSalesInvoices = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = todayStart - 86400000 * 7;
    const monthAgo = todayStart - 86400000 * 30;

    return processedInvoices.filter((inv) => {
      const t = inv.parsedDate.getTime();
      if (salesTimeFilter === 'today') {
        const invDay = inv.parsedDate.toISOString().split('T')[0];
        return invDay === todayStr || t >= todayStart;
      }
      if (salesTimeFilter === 'week') {
        return t >= weekAgo;
      }
      if (salesTimeFilter === 'month') {
        return t >= monthAgo;
      }
      return true;
    });
  }, [processedInvoices, salesTimeFilter, todayStr]);

  // Aggregate Sales KPIs
  const salesKPIs = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    filteredSalesInvoices.forEach((inv) => {
      totalRevenue += inv.total || 0;
      totalCost += inv.totalCost || 0;
      totalProfit += inv.netProfit || 0;
    });

    const invoiceCount = filteredSalesInvoices.length;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      invoiceCount
    };
  }, [filteredSalesInvoices]);

  // -------------------------------------------------------------
  // 2. PURCHASE ACCOUNTING CALCULATIONS
  // -------------------------------------------------------------
  const processedPurchases = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return purchases.map((pur) => {
      const dueDateObj = pur.dueDate ? new Date(pur.dueDate) : null;
      let daysRemaining = null;
      let isOverdue = false;
      let isDueSoon = false;

      if (dueDateObj && !isNaN(dueDateObj.getTime())) {
        dueDateObj.setHours(0, 0, 0, 0);
        const diffTime = dueDateObj.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (pur.pendingAmount > 0) {
          if (daysRemaining < 0) isOverdue = true;
          else if (daysRemaining <= 5) isDueSoon = true;
        }
      }

      return {
        ...pur,
        daysRemaining,
        isOverdue,
        isDueSoon
      };
    });
  }, [purchases]);

  // Purchase KPIs
  const purchaseKPIs = useMemo(() => {
    let totalPurchased = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let overdueCount = 0;
    let pendingCount = 0;

    processedPurchases.forEach((p) => {
      totalPurchased += Number(p.totalAmount) || 0;
      totalPaid += Number(p.paidAmount) || 0;
      totalPending += Number(p.pendingAmount) || 0;
      if (p.pendingAmount > 0) {
        pendingCount += 1;
        if (p.isOverdue) overdueCount += 1;
      }
    });

    return {
      totalPurchased,
      totalPaid,
      totalPending,
      overdueCount,
      pendingCount
    };
  }, [processedPurchases]);

  // Filtered Purchases list
  const filteredPurchases = useMemo(() => {
    return processedPurchases.filter((p) => {
      // Status filter
      if (purchaseStatusFilter === 'pending' && p.pendingAmount <= 0) return false;
      if (purchaseStatusFilter === 'paid' && p.pendingAmount > 0) return false;
      if (purchaseStatusFilter === 'due' && !p.isOverdue && !p.isDueSoon) return false;

      // Search query
      if (purchaseSearchQuery.trim()) {
        const q = purchaseSearchQuery.toLowerCase().trim();
        const supMatch = p.supplierName?.toLowerCase().includes(q);
        const prodMatch = p.product?.toLowerCase().includes(q) ||
          p.items?.some((it) => it.name?.toLowerCase().includes(q));
        const numMatch = p.purchaseNumber?.toLowerCase().includes(q);
        if (!supMatch && !prodMatch && !numMatch) return false;
      }

      return true;
    });
  }, [processedPurchases, purchaseStatusFilter, purchaseSearchQuery]);

  // -------------------------------------------------------------
  // PAYMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenPaymentModal = (purchase) => {
    setActivePaymentPurchase(purchase);
    setPayAmount(String(purchase.pendingAmount || ''));
    setPayMethod('UPI');
    setPayNotes('');
    setPaymentSuccessMsg('');
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!activePaymentPurchase) return;

    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(isHindi ? 'कृपया सही राशि दर्ज करें!' : 'Please enter a valid amount!');
      return;
    }

    const success = recordPurchasePayment(
      activePaymentPurchase.id,
      amount,
      payMethod,
      payNotes || `Paid to ${activePaymentPurchase.supplierName}`
    );

    if (success) {
      setPaymentSuccessMsg(
        isHindi
          ? `✓ ${currency}${amount.toLocaleString()} का भुगतान दर्ज हो गया!`
          : `✓ Payment of ${currency}${amount.toLocaleString()} recorded!`
      );
      setTimeout(() => {
        setActivePaymentPurchase(null);
        setPaymentSuccessMsg('');
      }, 1000);
    }
  };

  // -------------------------------------------------------------
  // ADD PURCHASE BILL HANDLERS
  // -------------------------------------------------------------
  const handleAddPurchaseSubmit = (e) => {
    e.preventDefault();
    setAddBillError('');
    setAddBillSuccess('');

    if (!newSupplierName.trim()) {
      setAddBillError(isHindi ? 'सप्लायर का नाम आवश्यक है!' : 'Supplier name is required!');
      return;
    }

    if (!purchaseItems || purchaseItems.length === 0) {
      setAddBillError(isHindi ? 'कम से कम 1 प्रोडक्ट जोड़ना आवश्यक है!' : 'At least 1 product is required!');
      return;
    }

    const cleanedItems = [];
    for (let i = 0; i < purchaseItems.length; i++) {
      const it = purchaseItems[i];
      const name = (it.name || '').trim();
      const qty = Math.max(1, Number(it.quantity) || 1);
      const cost = Number(it.unitCost);

      if (!name) {
        setAddBillError(
          isHindi
            ? `आइटम #${i + 1} का नाम लिखना आवश्यक है!`
            : `Item #${i + 1} product name is required!`
        );
        return;
      }

      if (isNaN(cost) || cost <= 0) {
        setAddBillError(
          isHindi
            ? `"${name}" की खरीद लागत (Cost Price) दर्ज करना अनिवार्य है!`
            : `Cost price for "${name}" is mandatory!`
        );
        return;
      }

      cleanedItems.push({
        name,
        quantity: qty,
        unitCost: cost,
        totalCost: qty * cost
      });
    }

    const total = cleanedItems.reduce((acc, it) => acc + it.totalCost, 0);
    const paid = Math.max(0, Math.min(total, Number(newPaidNow) || 0));

    addPurchase({
      supplierName: newSupplierName.trim(),
      supplierContact: newSupplierContact.trim(),
      product:
        cleanedItems.length === 1
          ? cleanedItems[0].name
          : `${cleanedItems[0].name} + ${cleanedItems.length - 1} अन्य`,
      quantity: cleanedItems.reduce((acc, it) => acc + it.quantity, 0),
      unitCost: cleanedItems[0]?.unitCost || 0,
      totalAmount: total,
      paidAmount: paid,
      dueDate: newDueDate,
      notes: newNotes,
      addToStock: newAddToStock,
      items: cleanedItems
    });

    setAddBillSuccess(
      isHindi
        ? `✓ ${cleanedItems.length} प्रोडक्ट्स का खरीद बिल जुड़ गया! कुल: ${currency}${total.toLocaleString()}`
        : `✓ Purchase bill added with ${cleanedItems.length} items! Total: ${currency}${total.toLocaleString()}`
    );

    setTimeout(() => {
      setIsAddPurchaseOpen(false);
      setAddBillSuccess('');
      setNewSupplierName('');
      setNewSupplierContact('');
      setPurchaseItems([{ name: '', quantity: 1, unitCost: '' }]);
      setNewPaidNow('0');
      setNewNotes('');
    }, 1200);
  };

  return (
    <div className={`m3-report-card-container animate-fade-in ${isStandalone ? 'standalone-viewport' : ''}`}>
      {/* 1. M3 HEADER WITH CLEAN DROPDOWN SELECTOR */}
      <div className="m3-report-top-bar">
        <div className="flex items-center gap-2.5">
          <div className="m3-report-icon-box">
            {reportMode === 'sales' ? <TrendingUp size={20} /> : <ShoppingBag size={20} />}
          </div>
          <div>
            <h3 className="m3-report-heading">
              {isHindi ? 'हिसाब-किताब व रिपोर्ट' : 'Business Reports'}
            </h3>
            <p className="m3-report-subheading">
              {isHindi ? 'बिक्री, मुनाफ़ा व सप्लायर उधारी' : 'Sales, Profit & Supplier Dues'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="m3-circle-close-btn"
              title={isHindi ? 'बंद करें' : 'Close'}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. M3 SEGMENTED VIEW SWITCHER (Big Tap Targets for Phone) */}
      <div className="m3-segmented-control-row">
        <button
          type="button"
          onClick={() => setReportMode('sales')}
          className={`m3-segment-btn ${reportMode === 'sales' ? 'active-sales' : ''}`}
        >
          <TrendingUp size={15} />
          <span>{isHindi ? 'बिक्री व मुनाफ़ा (Sales)' : 'Sales & Profit'}</span>
        </button>

        <button
          type="button"
          onClick={() => setReportMode('purchase')}
          className={`m3-segment-btn ${reportMode === 'purchase' ? 'active-purchase' : ''}`}
        >
          <ShoppingBag size={15} />
          <span>{isHindi ? 'सप्लायर खाता (Purchase)' : 'Supplier Ledger'}</span>
          {purchaseKPIs.pendingCount > 0 && (
            <span className="m3-alert-badge">{purchaseKPIs.pendingCount}</span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: SALES REPORT (DAILY / WEEKLY / MONTHLY)           */}
      {/* ========================================================= */}
      {reportMode === 'sales' && (
        <div className="m3-sales-section-body animate-fade-in">
          {/* Time Filter Chips: Daily, Weekly, Monthly, All */}
          <div className="m3-filter-chips-scroll custom-scrollbar">
            <button
              type="button"
              onClick={() => setSalesTimeFilter('today')}
              className={`m3-chip ${salesTimeFilter === 'today' ? 'active' : ''}`}
            >
              <Sparkles size={13} />
              <span>{isHindi ? 'आज (Daily)' : 'Today (Daily)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSalesTimeFilter('week')}
              className={`m3-chip ${salesTimeFilter === 'week' ? 'active' : ''}`}
            >
              <Calendar size={13} />
              <span>{isHindi ? 'इस सप्ताह (Weekly)' : 'This Week'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSalesTimeFilter('month')}
              className={`m3-chip ${salesTimeFilter === 'month' ? 'active' : ''}`}
            >
              <Calendar size={13} />
              <span>{isHindi ? 'इस महीने (Monthly)' : 'This Month'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSalesTimeFilter('all')}
              className={`m3-chip ${salesTimeFilter === 'all' ? 'active' : ''}`}
            >
              <Layers size={13} />
              <span>{isHindi ? 'कुल (All Time)' : 'All Time'}</span>
            </button>
          </div>

          {/* Simple, High-Visibility M3 KPI Cards (100% Mobile Responsive) */}
          <div className="m3-mobile-kpi-container">
            {/* Total Sales Card */}
            <div className="m3-kpi-card-simple sales">
              <span className="m3-kpi-tag">
                {salesTimeFilter === 'today'
                  ? (isHindi ? 'आज की कुल बिक्री (Daily Sales)' : "Today's Total Sales")
                  : salesTimeFilter === 'week'
                  ? (isHindi ? 'इस सप्ताह की बिक्री (Weekly)' : "This Week's Sales")
                  : salesTimeFilter === 'month'
                  ? (isHindi ? 'इस महीने की बिक्री (Monthly)' : "This Month's Sales")
                  : (isHindi ? 'कुल बिक्री (All Sales)' : 'Total Sales')}
              </span>
              <div className="m3-kpi-big-number text-blue-600 dark:text-blue-400">
                {currency}{salesKPIs.totalRevenue.toLocaleString()}
              </div>
              <span className="m3-kpi-subtext">
                {salesKPIs.invoiceCount} {isHindi ? 'बिल कटे हैं' : 'bills created'}
              </span>
            </div>

            {/* Total Profit Card */}
            <div className="m3-kpi-card-simple profit">
              <span className="m3-kpi-tag">
                {salesTimeFilter === 'today'
                  ? (isHindi ? 'आज का शुद्ध मुनाफ़ा (Daily Profit)' : "Today's Net Profit")
                  : (isHindi ? 'शुद्ध मुनाफ़ा (Net Profit)' : 'Net Profit Earned')}
              </span>
              <div className="m3-kpi-big-number text-emerald-600 dark:text-emerald-400">
                +{currency}{salesKPIs.totalProfit.toLocaleString()}
              </div>
              <span className="m3-kpi-subtext text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                <ArrowUpRight size={13} />
                <span>{salesKPIs.profitMargin.toFixed(1)}% {isHindi ? 'मुनाफ़ा मार्जिन' : 'profit margin'}</span>
              </span>
            </div>
          </div>

          {/* Mobile-First Invoice List (Cards, NOT a breaking table!) */}
          <div className="m3-list-section mt-4">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isHindi ? 'कटे हुए बिलों का ब्यौरा' : 'Bills Generated'} ({filteredSalesInvoices.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                {salesTimeFilter === 'today' ? (isHindi ? 'आज के बिल' : 'Today') : ''}
              </span>
            </div>

            {filteredSalesInvoices.length === 0 ? (
              <div className="m3-empty-state-box">
                <Receipt size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {isHindi ? 'इस अवधि में कोई बिल नहीं कटा है।' : 'No bills found for this period.'}
                </p>
              </div>
            ) : (
              <div className="m3-sales-cards-container">
                {filteredSalesInvoices.map((inv) => (
                  <div key={inv.id} className="m3-sales-card">
                    {/* Top Row: Customer Name, Phone, Invoice No & Payment Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {inv.customerName || (isHindi ? 'कैश ग्राहक' : 'Cash Customer')}
                          </h4>
                          <span className="m3-badge-inv-num">{inv.invoiceNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                          {inv.customerPhone && (
                            <span className="flex items-center gap-1 font-medium">
                              <Phone size={11} className="text-blue-500" />
                              {inv.customerPhone}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar size={11} />
                            {inv.date} {inv.time ? `• ${inv.time}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Payment Mode / Status Badge */}
                      <div>
                        <span className="m3-badge-status paid">
                          {inv.paymentMethod?.toLowerCase() === 'upi'
                            ? '⚡ UPI'
                            : inv.paymentMethod?.toLowerCase() === 'card'
                            ? '💳 Card'
                            : '💵 ' + (isHindi ? 'नकद (Cash)' : 'Cash')}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Items Purchased Strip */}
                    <div className="m3-purchased-items-strip mt-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        🛍️ {inv.items && inv.items.length > 0
                          ? inv.items.map((it) => `${it.name} (${it.quantity} pcs @ ${currency}${it.price})`).join(', ')
                          : (inv.product || 'Items')}
                      </span>
                    </div>

                    {/* Financial Amount Grid: Items Count, Net Profit, Total Bill */}
                    <div className="m3-ledger-amount-grid mt-2.5">
                      <div className="ledger-amt-col">
                        <span className="label">{isHindi ? 'कुल आइटम' : 'Items Qty'}</span>
                        <span className="val font-semibold">
                          {inv.items?.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0) || 1} pcs
                        </span>
                      </div>
                      <div className="ledger-amt-col">
                        <span className="label">{isHindi ? 'शुद्ध मुनाफ़ा' : 'Net Profit'}</span>
                        <span className="val font-bold text-emerald-600 dark:text-emerald-400">
                          +{currency}{Number(inv.netProfit || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="ledger-amt-col balance" style={{ background: '#eff6ff', borderColor: '#dbeafe' }}>
                        <span className="label text-blue-700 dark:text-blue-300 font-bold">{isHindi ? 'कुल बिल' : 'Total Bill'}</span>
                        <span className="val font-black text-blue-700 dark:text-blue-300">
                          {currency}{Number(inv.total).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Tax Invoice Generated & PDF View/Download Button */}
                    <div className="m3-card-footer-action-row mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Receipt size={13} className="text-indigo-500" />
                        <span>{isHindi ? 'पक्का बिल जनरेटेड' : 'Tax Invoice'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => generateInvoicePDF(inv, user, settings)}
                        className="m3-view-pdf-btn m3-ripple"
                        title={isHindi ? 'इस बिल का PDF देखें व डाउनलोड करें' : 'View & Download Invoice PDF'}
                      >
                        <FileText size={13} />
                        <span>{isHindi ? 'बिल PDF देखें' : 'View PDF'}</span>
                        <Download size={12} className="opacity-70" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: PURCHASE REPORT / SUPPLIER ACCOUNTING LEDGER      */}
      {/* ========================================================= */}
      {reportMode === 'purchase' && (
        <div className="m3-purchase-section-body animate-fade-in">
          {/* Summary KPI Cards (100% Mobile Responsive) */}
          <div className="m3-purchase-summary-row">
            <div className="m3-p-kpi-box">
              <span className="p-kpi-label">{isHindi ? 'कुल खरीद (Purchase)' : 'Total Purchases'}</span>
              <span className="p-kpi-val text-blue-700 dark:text-blue-300">
                {currency}{purchaseKPIs.totalPurchased.toLocaleString()}
              </span>
            </div>

            <div className="m3-p-kpi-box">
              <span className="p-kpi-label">{isHindi ? 'चुकाया (Paid)' : 'Total Paid'}</span>
              <span className="p-kpi-val text-emerald-600 dark:text-emerald-400">
                {currency}{purchaseKPIs.totalPaid.toLocaleString()}
              </span>
            </div>

            <div className="m3-p-kpi-box highlighted">
              <span className="p-kpi-label">{isHindi ? 'बकाया बाकी (Balance Due)' : 'Balance Due'}</span>
              <span className="p-kpi-val text-amber-600 dark:text-amber-400">
                {currency}{purchaseKPIs.totalPending.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Search, Filter & Add Button Strip */}
          <div className="m3-purchase-toolbar mt-3">
            <div className="m3-search-bar-wrap">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder={isHindi ? 'सप्लायर या सामान खोजें...' : 'Search supplier or item...'}
                value={purchaseSearchQuery}
                onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                className="m3-search-input-field"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddPurchaseOpen(true)}
              className="m3-add-purchase-btn"
            >
              <Plus size={15} />
              <span>{isHindi ? 'नया बिल जोड़ें' : 'Add Bill'}</span>
            </button>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="m3-status-filter-pills-row mt-2.5">
            <button
              type="button"
              onClick={() => setPurchaseStatusFilter('all')}
              className={`m3-status-chip ${purchaseStatusFilter === 'all' ? 'active' : ''}`}
            >
              {isHindi ? 'सभी बिल (All)' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setPurchaseStatusFilter('pending')}
              className={`m3-status-chip ${purchaseStatusFilter === 'pending' ? 'active' : ''}`}
            >
              {isHindi ? 'बकाया (Pending Due)' : 'Pending'}
            </button>
            <button
              type="button"
              onClick={() => setPurchaseStatusFilter('due')}
              className={`m3-status-chip ${purchaseStatusFilter === 'due' ? 'active' : ''}`}
            >
              {isHindi ? 'तारीख आ गई (Due Soon)' : 'Due Soon'}
            </button>
            <button
              type="button"
              onClick={() => setPurchaseStatusFilter('paid')}
              className={`m3-status-chip ${purchaseStatusFilter === 'paid' ? 'active' : ''}`}
            >
              {isHindi ? 'पूर्ण चुकता (Paid)' : 'Paid'}
            </button>
          </div>

          {/* Mobile-First Supplier Ledger Cards (NO HORIZONTAL OVERFLOW!) */}
          <div className="m3-supplier-cards-container mt-3.5">
            {filteredPurchases.length === 0 ? (
              <div className="m3-empty-state-box">
                <ShoppingBag size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {isHindi ? 'कोई खरीद बिल नहीं मिला।' : 'No purchase records found.'}
                </p>
              </div>
            ) : (
              filteredPurchases.map((pur) => {
                const isFullyPaid = pur.pendingAmount <= 0;
                return (
                  <div
                    key={pur.id}
                    className={`m3-supplier-card ${pur.isOverdue ? 'overdue' : isFullyPaid ? 'paid' : 'pending'}`}
                  >
                    {/* Top Row: Supplier Name, Phone & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {pur.supplierName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                          {pur.supplierContact && (
                            <span className="flex items-center gap-1 font-medium">
                              <Phone size={11} className="text-blue-500" />
                              {pur.supplierContact}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-slate-400">
                            {pur.purchaseNumber}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isFullyPaid ? (
                          <span className="m3-badge-status paid">
                            {isHindi ? '✓ पूर्ण चुकता' : 'Paid'}
                          </span>
                        ) : pur.paidAmount > 0 ? (
                          <span className="m3-badge-status partial">
                            {isHindi ? 'आंशिक बकाया' : 'Partial'}
                          </span>
                        ) : (
                          <span className="m3-badge-status unpaid">
                            {isHindi ? 'पूरा बाकी' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Products Purchased List */}
                    <div className="m3-purchased-items-strip mt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Package size={13} className="text-blue-500" />
                          <span>{isHindi ? 'सामान:' : 'Items:'}</span>
                        </span>
                        {pur.items && pur.items.length > 0 ? (
                          pur.items.map((it, idx) => (
                            <span key={idx} className="m3-purchase-item-chip">
                              <strong className="font-bold">{it.name}</strong>
                              <span className="text-slate-500 font-medium">({it.quantity} pcs × {currency}{it.unitCost})</span>
                            </span>
                          ))
                        ) : (
                          <span className="m3-purchase-item-chip">
                            <strong className="font-bold">{pur.product}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary: Total, Paid, Pending */}
                    <div className="m3-ledger-amount-grid mt-2.5">
                      <div className="ledger-amt-col">
                        <span className="label">{isHindi ? 'कुल बिल' : 'Total'}</span>
                        <span className="val font-semibold">{currency}{Number(pur.totalAmount).toLocaleString()}</span>
                      </div>
                      <div className="ledger-amt-col">
                        <span className="label">{isHindi ? 'दिया गया' : 'Paid'}</span>
                        <span className="val font-semibold text-emerald-600">{currency}{Number(pur.paidAmount).toLocaleString()}</span>
                      </div>
                      <div className="ledger-amt-col balance">
                        <span className="label">{isHindi ? 'बाकी (Pending)' : 'Balance Due'}</span>
                        <span className="val font-bold text-amber-600">
                          {pur.pendingAmount > 0 ? `${currency}${Number(pur.pendingAmount).toLocaleString()}` : `${currency}0`}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Due Date Alert & Pay Action */}
                    <div className="m3-card-footer-action-row mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="due-date-info">
                        {isFullyPaid ? (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>{isHindi ? 'भुगतान पूर्ण' : 'Fully Paid'}</span>
                          </span>
                        ) : pur.isOverdue ? (
                          <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                            <AlertTriangle size={13} />
                            <span>
                              {isHindi ? 'तारीख निकल गई!' : 'Overdue!'} ({pur.dueDate})
                            </span>
                          </span>
                        ) : pur.daysRemaining === 0 ? (
                          <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                            <Clock size={13} />
                            <span>{isHindi ? 'आज ही देना है!' : 'Due Today!'}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                            <Clock size={13} className="text-blue-500" />
                            <span>
                              {pur.daysRemaining} {isHindi ? 'दिन बाकी' : 'days left'} ({pur.dueDate})
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isFullyPaid && (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(pur)}
                            className="m3-pay-now-btn"
                          >
                            <CreditCard size={13} />
                            <span>{isHindi ? 'पेमेंट करें' : 'Pay'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(isHindi ? 'क्या आप इस खरीद बिल को हटाना चाहते हैं?' : 'Delete this purchase record?')) {
                              deletePurchase(pur.id);
                            }
                          }}
                          className="m3-del-icon-btn"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: RECORD PURCHASE PAYMENT DIALOG (MATERIAL DESIGN 3) */}
      {/* ========================================================= */}
      {activePaymentPurchase && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setActivePaymentPurchase(null)}>
          <div
            className="m3-modal-sheet-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="m3-dialog-header-enhanced">
              <div className="flex items-center gap-3">
                <div className="m3-dialog-icon-pill emerald">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="m3-dialog-title">
                    {isHindi ? 'सप्लायर भुगतान दर्ज करें' : 'Record Supplier Payment'}
                  </h3>
                  <p className="m3-dialog-subtitle">
                    {isHindi ? 'सप्लायर उधारी खाते में पेमेंट' : 'Settle pending dues in ledger'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentPurchase(null)}
                className="m3-dialog-close-circle"
                title={isHindi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="m3-dialog-body-scroll">
              {paymentSuccessMsg && (
                <div className="m3-alert-banner success animate-fade-in">
                  <CheckCircle2 size={16} />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              {/* Supplier & Due Balance Spotlight Card */}
              <div className="m3-modal-ledger-summary-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="m3-modal-sup-tag">{isHindi ? 'सप्लायर खाता' : 'Supplier Account'}</span>
                    <h4 className="m3-modal-sup-name">{activePaymentPurchase.supplierName}</h4>
                    {activePaymentPurchase.supplierContact && (
                      <span className="m3-modal-sup-phone">
                        <Phone size={11} /> {activePaymentPurchase.supplierContact}
                      </span>
                    )}
                  </div>
                  <span className="m3-modal-bill-badge">
                    {activePaymentPurchase.purchaseNumber}
                  </span>
                </div>

                <div className="m3-modal-ledger-grid mt-3">
                  <div className="m3-modal-stat-box">
                    <span className="lbl">{isHindi ? 'कुल बिल' : 'Total Bill'}</span>
                    <span className="val">{currency}{Number(activePaymentPurchase.totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="m3-modal-stat-box">
                    <span className="lbl">{isHindi ? 'चुकाया' : 'Paid'}</span>
                    <span className="val text-emerald-600">{currency}{Number(activePaymentPurchase.paidAmount).toLocaleString()}</span>
                  </div>
                  <div className="m3-modal-stat-box due">
                    <span className="lbl">{isHindi ? 'कुल बाकी' : 'Balance Due'}</span>
                    <span className="val text-amber-600 font-extrabold">{currency}{Number(activePaymentPurchase.pendingAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="m3-form-field-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="m3-field-label">
                    {isHindi ? 'भुगतान राशि (Payment Amount) *' : 'Payment Amount *'}
                  </label>
                  <span className="text-[11px] font-bold text-amber-600">
                    {isHindi ? 'बाकी:' : 'Max Due:'} {currency}{Number(activePaymentPurchase.pendingAmount).toLocaleString()}
                  </span>
                </div>

                <div className="m3-outlined-input-wrap">
                  <span className="m3-input-prefix">{currency}</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={activePaymentPurchase.pendingAmount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0"
                    className="m3-enhanced-input"
                  />
                </div>

                {/* Quick Fill Amount Chips */}
                <div className="m3-quick-pills-row mt-2">
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(activePaymentPurchase.pendingAmount))}
                    className="m3-quick-fill-chip active"
                  >
                    ✓ {isHindi ? 'पूरा भरें' : 'Pay Full'} ({currency}{Number(activePaymentPurchase.pendingAmount).toLocaleString()})
                  </button>
                  {activePaymentPurchase.pendingAmount > 100 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(Math.round(activePaymentPurchase.pendingAmount / 2)))}
                      className="m3-quick-fill-chip"
                    >
                      {isHindi ? '50% (आधा)' : '50% (Half)'} ({currency}{Math.round(activePaymentPurchase.pendingAmount / 2).toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="m3-form-field-group">
                <label className="m3-field-label">
                  {isHindi ? 'भुगतान का माध्यम (Payment Mode)' : 'Payment Mode'}
                </label>
                <div className="m3-mode-chips-grid">
                  {[
                    { mode: 'UPI', label: 'UPI (GPay/PhonePe)', icon: '⚡' },
                    { mode: 'Cash', label: isHindi ? 'नकद (Cash)' : 'Cash', icon: '💵' },
                    { mode: 'NEFT', label: isHindi ? 'बैंक / NEFT' : 'NEFT / Bank', icon: '🏦' },
                    { mode: 'Cheque', label: isHindi ? 'चेक (Cheque)' : 'Cheque', icon: '📄' }
                  ].map(({ mode, label, icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMethod(mode)}
                      className={`m3-mode-chip ${payMethod === mode ? 'selected' : ''}`}
                    >
                      <span className="icon">{icon}</span>
                      <span className="text">{label}</span>
                      {payMethod === mode && <Check size={13} className="check-icon" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / UTR Ref Input */}
              <div className="m3-form-field-group">
                <label className="m3-field-label">
                  {isHindi ? 'नोट्स / UTR नंबर (वैकल्पिक)' : 'Notes / UTR Reference ID (Optional)'}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder={isHindi ? 'जैसे: GPay से भुगतान किया / UTR: 384920' : 'e.g. Paid via GPay / UTR: 384920'}
                  className="m3-enhanced-input text-field-only"
                />
              </div>

              {/* Action Buttons */}
              <div className="m3-dialog-actions-row">
                <button
                  type="button"
                  onClick={() => setActivePaymentPurchase(null)}
                  className="m3-btn-secondary"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="m3-btn-primary emerald"
                >
                  <Check size={16} />
                  <span>{isHindi ? 'भुगतान सुरक्षित करें' : 'Confirm Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD NEW PURCHASE BILL DIALOG (MATERIAL DESIGN 3) */}
      {/* ========================================================= */}
      {isAddPurchaseOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsAddPurchaseOpen(false)}>
          <div
            className="m3-modal-sheet-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="m3-dialog-header-enhanced">
              <div className="flex items-center gap-3">
                <div className="m3-dialog-icon-pill blue">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="m3-dialog-title">
                    {isHindi ? 'नया सप्लायर खरीद बिल' : 'Add Purchase Bill'}
                  </h3>
                  <p className="m3-dialog-subtitle">
                    {isHindi ? 'सप्लायर से माल खरीददारी व खाता दर्ज करें' : 'Record purchase & supplier ledger'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPurchaseOpen(false)}
                className="m3-dialog-close-circle"
                title={isHindi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPurchaseSubmit} className="m3-dialog-body-scroll">
              {addBillError && (
                <div className="m3-alert-banner error animate-fade-in">
                  <AlertTriangle size={15} />
                  <span>{addBillError}</span>
                </div>
              )}
              {addBillSuccess && (
                <div className="m3-alert-banner success animate-fade-in">
                  <CheckCircle2 size={15} />
                  <span>{addBillSuccess}</span>
                </div>
              )}

              {/* Section 1: Supplier Info */}
              <div className="m3-form-card-section">
                <span className="m3-section-title">
                  <Building size={14} className="text-blue-500" />
                  {isHindi ? '1. सप्लायर विवरण (Supplier Details)' : '1. Supplier Details'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                  <div className="m3-form-field-group">
                    <label className="m3-field-label">
                      {isHindi ? 'सप्लायर / फर्म का नाम *' : 'Supplier / Firm Name *'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        placeholder={isHindi ? 'जैसे: वर्धमान टेक्सटाइल्स' : 'e.g. Vardhman Textiles'}
                        className="m3-enhanced-input text-field-only"
                      />
                    </div>
                  </div>

                  <div className="m3-form-field-group">
                    <label className="m3-field-label">
                      {isHindi ? 'मोबाइल / फोन नंबर' : 'Phone / Contact'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newSupplierContact}
                        onChange={(e) => setNewSupplierContact(e.target.value)}
                        placeholder="+91 98XXX XXXXX"
                        className="m3-enhanced-input text-field-only"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Products & Cost List (Multi-Product Bill Support) */}
              <div className="m3-form-card-section">
                <div className="flex items-center justify-between">
                  <span className="m3-section-title">
                    <ShoppingBag size={14} className="text-emerald-500" />
                    {isHindi ? '2. सामान व खरीद लागत सूची' : '2. Products & Purchase Cost'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {purchaseItems.length} {isHindi ? 'प्रोडक्ट्स' : 'Items'}
                  </span>
                </div>

                {/* Datalist for fast inventory autocomplete */}
                <datalist id="inventory-item-suggestions">
                  {inventory.map((invItem) => (
                    <option key={invItem.id} value={invItem.name}>
                      {invItem.costPrice > 0 ? `Cost: ${currency}${invItem.costPrice}` : ''}
                    </option>
                  ))}
                </datalist>

                <div className="m3-purchase-items-list mt-2">
                  {purchaseItems.map((item, index) => {
                    const itemQty = Math.max(1, Number(item.quantity) || 1);
                    const itemCost = Math.max(0, Number(item.unitCost) || 0);
                    const itemSubtotal = itemQty * itemCost;

                    return (
                      <div key={index} className="m3-purchase-item-row animate-fade-in">
                        <div className="item-row-top">
                          <span className="item-number-badge">#{index + 1}</span>
                          <div className="item-name-input-wrap">
                            <input
                              type="text"
                              required
                              list="inventory-item-suggestions"
                              value={item.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleItemChange(index, 'name', val);
                                // Auto-fill cost price if existing product selected and cost is empty
                                const matched = inventory.find(
                                  (p) => p.name.toLowerCase() === val.toLowerCase().trim()
                                );
                                if (matched && matched.costPrice > 0 && !item.unitCost) {
                                  handleItemChange(index, 'unitCost', String(matched.costPrice));
                                }
                              }}
                              placeholder={isHindi ? 'प्रोडक्ट का नाम * (जैसे: Cotton Shirt)' : 'Product Name * (e.g. Cotton Shirt)'}
                              className="m3-enhanced-input text-field-only"
                            />
                          </div>
                          {purchaseItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="item-delete-btn"
                              title={isHindi ? 'हटाएं' : 'Remove item'}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div className="item-row-bottom">
                          {/* Quantity Stepper */}
                          <div className="item-qty-col">
                            <label className="m3-mini-label">{isHindi ? 'मात्रा (Qty) *' : 'Quantity *'}</label>
                            <div className="m3-stepper-wrap compact">
                              <button
                                type="button"
                                onClick={() => handleItemChange(index, 'quantity', Math.max(1, (Number(item.quantity) || 1) - 1))}
                                className="m3-stepper-btn"
                                title="Decrease"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                className="m3-stepper-input"
                              />
                              <button
                                type="button"
                                onClick={() => handleItemChange(index, 'quantity', (Number(item.quantity) || 1) + 1)}
                                className="m3-stepper-btn"
                                title="Increase"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Unit Cost */}
                          <div className="item-cost-col">
                            <label className="m3-mini-label">{isHindi ? 'लागत मूल्य *' : 'Cost Price *'}</label>
                            <div className="m3-outlined-input-wrap compact">
                              <span className="m3-input-prefix">{currency}</span>
                              <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                value={item.unitCost}
                                onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                placeholder="350"
                                className="m3-enhanced-input"
                              />
                            </div>
                          </div>

                          {/* Item Subtotal */}
                          <div className="item-subtotal-col">
                            <label className="m3-mini-label">{isHindi ? 'कुल' : 'Total'}</label>
                            <div className="item-subtotal-badge">
                              {currency}{itemSubtotal.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Button to Add More Products */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="m3-add-more-item-btn mt-2.5"
                >
                  <Plus size={15} />
                  <span>{isHindi ? '+ और प्रोडक्ट जोड़ें (Add More Products)' : '+ Add Another Product'}</span>
                </button>

                {/* Live Total Calculation Banner */}
                <div className="m3-calculated-bill-banner mt-3">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-blue-600 dark:text-blue-400" />
                    <div>
                      <span className="banner-label">{isHindi ? 'कुल खरीद बिल (Total Bill):' : 'Total Bill Amount:'}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {purchaseItems.length} {isHindi ? 'प्रोडक्ट्स शामिल' : 'items included'}
                      </span>
                    </div>
                  </div>
                  <span className="banner-value">
                    {currency}{calculateTotalBill().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Section 3: Payment & Due Date */}
              <div className="m3-form-card-section">
                <span className="m3-section-title">
                  <Clock size={14} className="text-amber-500" />
                  {isHindi ? '3. भुगतान व ड्यू डेट (Payment & Dues)' : '3. Payment & Due Date'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                  {/* Paid Now */}
                  <div className="m3-form-field-group">
                    <label className="m3-field-label">
                      {isHindi ? 'अभी कितना भुगतान किया (Paid Now)' : 'Amount Paid Now'}
                    </label>
                    <div className="m3-outlined-input-wrap">
                      <span className="m3-input-prefix">{currency}</span>
                      <input
                        type="number"
                        min="0"
                        value={newPaidNow}
                        onChange={(e) => setNewPaidNow(e.target.value)}
                        placeholder="0"
                        className="m3-enhanced-input"
                      />
                    </div>

                    {/* Quick Paid Chips */}
                    <div className="m3-quick-pills-row mt-1.5">
                      <button
                        type="button"
                        onClick={() => setNewPaidNow('0')}
                        className="m3-quick-fill-chip"
                      >
                        {isHindi ? 'उधार (₹0)' : 'Unpaid (₹0)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPaidNow(String(calculateTotalBill()));
                        }}
                        className="m3-quick-fill-chip active"
                      >
                        {isHindi ? 'पूर्ण चुकाया' : 'Fully Paid'}
                      </button>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="m3-form-field-group">
                    <label className="m3-field-label">
                      {isHindi ? 'पेमेंट ड्यू डेट (Due Date) *' : 'Payment Due Date *'}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="m3-enhanced-input text-field-only"
                      />
                    </div>

                    {/* Quick Date Chips */}
                    <div className="m3-quick-pills-row mt-1.5">
                      {[7, 15, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 86400000 * days);
                            setNewDueDate(d.toISOString().split('T')[0]);
                          }}
                          className="m3-quick-fill-chip"
                        >
                          +{days} {isHindi ? 'दिन' : 'days'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Restock Switch Card */}
              <div className="m3-switch-card">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddToStock}
                    onChange={(e) => setNewAddToStock(e.target.checked)}
                    className="m3-checkbox-input"
                  />
                  <div>
                    <span className="m3-switch-title">
                      📦 {isHindi ? 'इन्वेंटरी स्टॉक में भी जोड़ें (Auto Restock)' : 'Add to Inventory Stock'}
                    </span>
                    <p className="m3-switch-desc">
                      {isHindi
                        ? 'यह माल और मात्रा आपकी इन्वेंटरी में अपने आप जुड़ जाएगी'
                        : 'Automatically increment your store stock count with this purchase'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Notes (Optional) */}
              <div className="m3-form-field-group">
                <label className="m3-field-label">
                  {isHindi ? 'बिल नंबर / नोट्स (वैकल्पिक)' : 'Bill Number / Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder={isHindi ? 'जैसे: बिल नंबर #7890 या माल की स्थिति' : 'e.g. Bill #7890 or material grade'}
                  className="m3-enhanced-input text-field-only"
                />
              </div>

              {/* Action Buttons */}
              <div className="m3-dialog-actions-row">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="m3-btn-secondary"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="m3-btn-primary blue"
                >
                  <Plus size={16} />
                  <span>{isHindi ? 'खरीद बिल सेव करें' : 'Save Purchase Bill'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
