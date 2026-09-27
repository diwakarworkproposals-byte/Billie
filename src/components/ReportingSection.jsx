import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
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
  Sparkles
} from 'lucide-react';

export default function ReportingSection({
  initialMode = 'sales',
  onClose,
  isStandalone = false
}) {
  const {
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

  // Add Purchase Bill Form State
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newUnitCost, setNewUnitCost] = useState('');
  const [newPaidNow, setNewPaidNow] = useState('0');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 15);
    return d.toISOString().split('T')[0];
  });
  const [newNotes, setNewNotes] = useState('');
  const [newAddToStock, setNewAddToStock] = useState(true);
  const [addBillError, setAddBillError] = useState('');
  const [addBillSuccess, setAddBillSuccess] = useState('');

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

    if (!newProduct.trim()) {
      setAddBillError(isHindi ? 'प्रोडक्ट का नाम आवश्यक है!' : 'Product name is required!');
      return;
    }

    const qty = Math.max(1, Number(newQuantity) || 1);
    const unitCost = Math.max(0, Number(newUnitCost) || 0);
    if (unitCost <= 0) {
      setAddBillError(isHindi ? 'कृपया खरीद लागत (Cost Price) दर्ज करें!' : 'Please enter unit cost price!');
      return;
    }

    const total = qty * unitCost;
    const paid = Math.max(0, Math.min(total, Number(newPaidNow) || 0));

    addPurchase({
      supplierName: newSupplierName,
      supplierContact: newSupplierContact,
      product: newProduct,
      quantity: qty,
      unitCost,
      totalAmount: total,
      paidAmount: paid,
      dueDate: newDueDate,
      notes: newNotes,
      addToStock: newAddToStock,
      items: [
        {
          name: newProduct,
          quantity: qty,
          unitCost,
          totalCost: total
        }
      ]
    });

    setAddBillSuccess(
      isHindi
        ? `✓ बिल जुड़ गया! कुल: ${currency}${total.toLocaleString()}`
        : `✓ Bill added! Total: ${currency}${total.toLocaleString()}`
    );

    setTimeout(() => {
      setIsAddPurchaseOpen(false);
      setAddBillSuccess('');
      setNewSupplierName('');
      setNewSupplierContact('');
      setNewProduct('');
      setNewQuantity('1');
      setNewUnitCost('');
      setNewPaidNow('0');
      setNewNotes('');
    }, 1000);
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
          {/* REQUIREMENT: Clean Dropdown for Sales vs Purchase */}
          <div className="m3-dropdown-pill-wrap">
            <select
              value={reportMode}
              onChange={(e) => setReportMode(e.target.value)}
              className="m3-report-select-element"
            >
              <option value="sales">
                {isHindi ? '📈 बिक्री रिपोर्ट (Sales)' : '📈 Sales Report'}
              </option>
              <option value="purchase">
                {isHindi ? '📦 खरीद रिपोर्ट (Purchase)' : '📦 Purchase Report'}
              </option>
            </select>
            <ChevronDown size={14} className="m3-dropdown-arrow" />
          </div>

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
              <div className="m3-mobile-cards-stack">
                {filteredSalesInvoices.map((inv) => (
                  <div key={inv.id} className="m3-invoice-row-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {inv.customerName || (isHindi ? 'कैश ग्राहक' : 'Cash Customer')}
                          </span>
                          <span className="m3-mini-pill-inv">{inv.invoiceNumber}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {inv.items?.map((it) => `${it.name} (${it.quantity})`).join(', ') || inv.product}
                        </p>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          📅 {inv.date}
                        </span>
                      </div>

                      <div className="text-right flex flex-col items-end flex-shrink-0">
                        <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {currency}{Number(inv.total).toLocaleString()}
                        </span>
                        <span className="m3-profit-badge mt-1">
                          +{currency}{Number(inv.netProfit).toFixed(0)} {isHindi ? 'लाभ' : 'profit'}
                        </span>
                      </div>
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

                    {/* Middle: Product & Quantity Purchased */}
                    <div className="m3-purchased-items-strip mt-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        📦 {pur.items && pur.items.length > 0
                          ? pur.items.map((it) => `${it.name} (${it.quantity} pcs @ ${currency}${it.unitCost})`).join(', ')
                          : pur.product}
                      </span>
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
      {/* MODAL 1: RECORD PURCHASE PAYMENT DIALOG                  */}
      {/* ========================================================= */}
      {activePaymentPurchase && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setActivePaymentPurchase(null)}>
          <div
            className="m3-mobile-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header-clean">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {isHindi ? 'सप्लायर भुगतान दर्ज करें' : 'Record Supplier Payment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentPurchase(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-3.5 space-y-3">
              {paymentSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              {/* Bill Details Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activePaymentPurchase.supplierName}
                  </span>
                  <span className="font-bold text-amber-600">
                    {isHindi ? 'बकाया:' : 'Due:'} {currency}{Number(activePaymentPurchase.pendingAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="form-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isHindi ? 'भुगतान राशि (Amount)' : 'Payment Amount'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(activePaymentPurchase.pendingAmount))}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {isHindi ? 'पूरा भरें' : 'Pay Full'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-bold text-slate-400">{currency}</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={activePaymentPurchase.pendingAmount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="form-group">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  {isHindi ? 'माध्यम (Payment Mode)' : 'Payment Mode'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['UPI', 'Cash', 'NEFT', 'Cheque'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMethod(mode)}
                      className={`py-1.5 text-xs font-bold rounded border text-center transition-all ${
                        payMethod === mode
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  {isHindi ? 'नोट्स / UTR नंबर (वैकल्पिक)' : 'Notes / Ref ID (Optional)'}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder={isHindi ? 'जैसे: GPay से भुगतान' : 'e.g. Paid via GPay'}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActivePaymentPurchase(null)}
                  className="flex-1 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{isHindi ? 'कन्फर्म करें' : 'Confirm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD NEW PURCHASE BILL DIALOG                    */}
      {/* ========================================================= */}
      {isAddPurchaseOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsAddPurchaseOpen(false)}>
          <div
            className="m3-mobile-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header-clean">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {isHindi ? 'नया सप्लायर खरीद बिल' : 'Add Purchase Bill'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPurchaseOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPurchaseSubmit} className="p-3.5 space-y-3">
              {addBillError && (
                <div className="p-2 bg-rose-50 text-rose-800 rounded text-xs flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>{addBillError}</span>
                </div>
              )}
              {addBillSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>{addBillSuccess}</span>
                </div>
              )}

              {/* Supplier & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isHindi ? 'सप्लायर का नाम *' : 'Supplier Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="e.g. Vardhman"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isHindi ? 'फोन नंबर' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={newSupplierContact}
                    onChange={(e) => setNewSupplierContact(e.target.value)}
                    placeholder="+91 98XXX"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Product */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isHindi ? 'सामान / प्रोडक्ट का नाम *' : 'Product / Material *'}
                </label>
                <input
                  type="text"
                  required
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="e.g. T-Shirt Fabric, Jeans"
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isHindi ? 'मात्रा (Qty) *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isHindi ? 'प्रति पीस लागत *' : 'Unit Cost *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(e.target.value)}
                    placeholder="320"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950/40 rounded text-xs text-blue-900 dark:text-blue-200 font-bold">
                <span>{isHindi ? 'कुल खरीद बिल:' : 'Total Bill:'}</span>
                <span className="text-sm">
                  {currency}{(Math.max(1, Number(newQuantity) || 1) * Math.max(0, Number(newUnitCost) || 0)).toLocaleString()}
                </span>
              </div>

              {/* Paid Now & Due Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isHindi ? 'अभी कितना दिया' : 'Paid Now'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPaidNow}
                    onChange={(e) => setNewPaidNow(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isHindi ? 'पेमेंट ड्यू डेट *' : 'Due Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Restock Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="add-stock-cb"
                  checked={newAddToStock}
                  onChange={(e) => setNewAddToStock(e.target.checked)}
                  className="rounded text-blue-600 h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="add-stock-cb" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isHindi ? 'इन्वेंटरी स्टॉक में भी जोड़ें' : 'Also add to inventory stock'}
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="flex-1 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isHindi ? 'बिल सेव करें' : 'Save Bill'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
