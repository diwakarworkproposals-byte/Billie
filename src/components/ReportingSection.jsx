import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Plus,
  ChevronDown,
  Package,
  User,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  X,
  FileText,
  Check,
  Receipt,
  ShoppingBag,
  RefreshCw,
  Trash2
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

  // Active Report View Mode: 'sales' (बिक्री रिपोर्ट) or 'purchase' (खरीददारी व अकाउंटिंग)
  const [reportMode, setReportMode] = useState(initialMode);

  // Time filter for Sales: 'today' | 'week' | 'month' | 'all'
  const [salesTimeFilter, setSalesTimeFilter] = useState('all');

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

  // Filtered Invoices according to selected time range
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
    const avgOrderValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Today's specific metrics
    const todayInvoices = processedInvoices.filter((inv) => {
      const invDay = inv.parsedDate.toISOString().split('T')[0];
      return invDay === todayStr;
    });
    const todayRevenue = todayInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const todayProfit = todayInvoices.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      invoiceCount,
      avgOrderValue,
      todayRevenue,
      todayProfit,
      todayInvoicesCount: todayInvoices.length
    };
  }, [filteredSalesInvoices, processedInvoices, todayStr]);

  // Product-wise Performance Breakdown
  const productPerformance = useMemo(() => {
    const breakdown = {};

    filteredSalesInvoices.forEach((inv) => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((it) => {
          const name = it.name || 'Miscellaneous';
          const normName = name.toLowerCase().trim();
          const qty = Number(it.quantity) || 1;
          const rev = Number(it.lineTotal) || (qty * (Number(it.price) || 0));
          const unitCost = productCostMap[normName] || ((Number(it.price) || 0) * 0.65);
          const cost = qty * unitCost;
          const profit = Math.max(0, rev - cost);

          if (!breakdown[normName]) {
            breakdown[normName] = {
              displayName: name,
              totalQuantity: 0,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
              avgPrice: Number(it.price) || 0,
              unitCost
            };
          }

          breakdown[normName].totalQuantity += qty;
          breakdown[normName].totalRevenue += rev;
          breakdown[normName].totalCost += cost;
          breakdown[normName].totalProfit += profit;
        });
      }
    });

    return Object.values(breakdown).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredSalesInvoices, productCostMap]);

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
    let overdueAmount = 0;
    let pendingCount = 0;

    processedPurchases.forEach((p) => {
      totalPurchased += Number(p.totalAmount) || 0;
      totalPaid += Number(p.paidAmount) || 0;
      totalPending += Number(p.pendingAmount) || 0;
      if (p.pendingAmount > 0) {
        pendingCount += 1;
        if (p.isOverdue) {
          overdueCount += 1;
          overdueAmount += p.pendingAmount;
        }
      }
    });

    return {
      totalPurchased,
      totalPaid,
      totalPending,
      overdueCount,
      overdueAmount,
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
      alert(isHindi ? 'कृपया वैध भुगतान राशि दर्ज करें!' : 'Please enter a valid payment amount!');
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
          ? `सफलतापूर्वक ${currency}${amount.toLocaleString()} का भुगतान दर्ज कर लिया गया!`
          : `Payment of ${currency}${amount.toLocaleString()} recorded successfully!`
      );
      setTimeout(() => {
        setActivePaymentPurchase(null);
        setPaymentSuccessMsg('');
      }, 1200);
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
      setAddBillError(isHindi ? 'कृपया खरीद मूल्य (Cost Price) दर्ज करें!' : 'Please enter unit cost price!');
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
        ? `खरीद बिल सफलतापूर्वक दर्ज हो गया! (कुल: ${currency}${total.toLocaleString()})`
        : `Purchase bill recorded! (Total: ${currency}${total.toLocaleString()})`
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
    }, 1200);
  };

  return (
    <div className={`reporting-card-container animate-fade-in ${isStandalone ? 'standalone-viewport' : ''}`}>
      {/* Top Header with Prominent Dropdown Switcher */}
      <div className="reporting-top-header">
        <div className="reporting-title-area">
          <div className="reporting-icon-badge">
            <BarChart3 size={22} className="text-white" />
          </div>
          <div>
            <h3 className="reporting-main-title">
              {isHindi ? '📊 बिजनेस रिपोर्टिंग व अकाउंटिंग' : '📊 Business Reports & Accounting'}
            </h3>
            <p className="reporting-subtitle">
              {isHindi
                ? 'दैनिक बिक्री, मुनाफ़ा (Profit) और सप्लायर खरीददारी का संपूर्ण हिसाब-किताब'
                : 'Track daily sales, net profit, supplier purchases and pending dues'}
            </p>
          </div>
        </div>

        <div className="reporting-controls-row">
          {/* REQUIREMENT: Dropdown Selector for Sales Report vs Purchase Report */}
          <div className="report-dropdown-wrapper">
            <label htmlFor="report-mode-select" className="report-dropdown-label">
              {isHindi ? 'रिपोर्ट का प्रकार चुनें:' : 'Select Report:'}
            </label>
            <div className="custom-select-container">
              <select
                id="report-mode-select"
                value={reportMode}
                onChange={(e) => setReportMode(e.target.value)}
                className="report-mode-select-input"
              >
                <option value="sales">
                  📈 {isHindi ? 'बिक्री व मुनाफ़ा रिपोर्ट (Sales & Profit)' : 'Sales & Profit Report'}
                </option>
                <option value="purchase">
                  📦 {isHindi ? 'खरीददारी व अकाउंटिंग रिपोर्ट (Purchase & Accounting)' : 'Purchase & Accounting Report'}
                </option>
              </select>
              <ChevronDown size={16} className="select-chevron-icon" />
            </div>
          </div>

          {/* Close button if provided */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="report-close-btn m3-ripple"
              title={isHindi ? 'बंद करें' : 'Close'}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Visual Tab Quick Switchers */}
      <div className="report-mode-tabs-bar">
        <button
          type="button"
          onClick={() => setReportMode('sales')}
          className={`report-tab-btn ${reportMode === 'sales' ? 'active-sales' : ''}`}
        >
          <TrendingUp size={16} />
          <span>{isHindi ? 'बिक्री व मुनाफ़ा (Sales & Profit)' : 'Sales & Profit Report'}</span>
          <span className="tab-count-badge">{invoices.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setReportMode('purchase')}
          className={`report-tab-btn ${reportMode === 'purchase' ? 'active-purchase' : ''}`}
        >
          <ShoppingBag size={16} />
          <span>{isHindi ? 'खरीददारी व अकाउंटिंग (Purchase & Accounting)' : 'Purchase & Accounting'}</span>
          {purchaseKPIs.pendingCount > 0 && (
            <span className="tab-warning-badge">{purchaseKPIs.pendingCount} Due</span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: SALES & PROFIT REPORT (दैनिक बिक्री व लाभ)     */}
      {/* ========================================================= */}
      {reportMode === 'sales' && (
        <div className="sales-report-view animate-fade-in">
          {/* Daily Sales Spotlight Banner */}
          <div className="daily-sales-spotlight-card">
            <div className="spotlight-left">
              <span className="spotlight-tag">
                <Sparkles size={14} />
                <span>{isHindi ? 'दैनिक बिक्री (Today\'s Sales)' : 'Today\'s Performance'}</span>
              </span>
              <div className="spotlight-metric-row">
                <span className="spotlight-amount">
                  {currency}{salesKPIs.todayRevenue.toLocaleString()}
                </span>
                <span className="spotlight-invoices">
                  {salesKPIs.todayInvoicesCount} {isHindi ? 'बिल कटे' : 'invoices'}
                </span>
              </div>
            </div>

            <div className="spotlight-right">
              <div className="spotlight-profit-box">
                <span className="spotlight-profit-label">
                  {isHindi ? 'आज का शुद्ध मुनाफ़ा (Net Profit):' : 'Today\'s Net Profit:'}
                </span>
                <span className="spotlight-profit-val text-emerald-600 dark:text-emerald-400">
                  +{currency}{salesKPIs.todayProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Time Filter Tabs */}
          <div className="sales-filter-bar">
            <span className="filter-label">
              <Filter size={14} />
              <span>{isHindi ? 'अवधि:' : 'Period:'}</span>
            </span>
            <div className="filter-pills-row">
              <button
                type="button"
                onClick={() => setSalesTimeFilter('today')}
                className={`sales-filter-pill ${salesTimeFilter === 'today' ? 'active' : ''}`}
              >
                {isHindi ? 'आज (Today)' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setSalesTimeFilter('week')}
                className={`sales-filter-pill ${salesTimeFilter === 'week' ? 'active' : ''}`}
              >
                {isHindi ? 'इस सप्ताह (7 Days)' : 'This Week'}
              </button>
              <button
                type="button"
                onClick={() => setSalesTimeFilter('month')}
                className={`sales-filter-pill ${salesTimeFilter === 'month' ? 'active' : ''}`}
              >
                {isHindi ? 'इस महीने (30 Days)' : 'This Month'}
              </button>
              <button
                type="button"
                onClick={() => setSalesTimeFilter('all')}
                className={`sales-filter-pill ${salesTimeFilter === 'all' ? 'active' : ''}`}
              >
                {isHindi ? 'कुल (All Time)' : 'All Time'}
              </button>
            </div>
          </div>

          {/* Sales KPIs Grid */}
          <div className="sales-kpi-grid">
            <div className="kpi-metric-card revenue">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'कुल बिक्री (Sales Revenue)' : 'Total Revenue'}</span>
                <div className="kpi-icon-wrap bg-blue-100 dark:bg-blue-900/40 text-blue-600">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-value text-blue-700 dark:text-blue-300">
                {currency}{salesKPIs.totalRevenue.toLocaleString()}
              </div>
              <div className="kpi-footer">
                <span>{salesKPIs.invoiceCount} {isHindi ? 'इनवॉइस जनरेट हुए' : 'invoices generated'}</span>
              </div>
            </div>

            <div className="kpi-metric-card profit">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'कुल मुनाफ़ा (Net Profit)' : 'Net Profit'}</span>
                <div className="kpi-icon-wrap bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value text-emerald-700 dark:text-emerald-300">
                +{currency}{salesKPIs.totalProfit.toLocaleString()}
              </div>
              <div className="kpi-footer text-emerald-600 font-semibold">
                <ArrowUpRight size={14} />
                <span>{salesKPIs.profitMargin.toFixed(1)}% {isHindi ? 'ग्रॉस मार्जिन' : 'gross margin'}</span>
              </div>
            </div>

            <div className="kpi-metric-card cost">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'सामान की लागत (COGS Cost)' : 'Cost of Goods'}</span>
                <div className="kpi-icon-wrap bg-slate-100 dark:bg-slate-800 text-slate-600">
                  <Package size={18} />
                </div>
              </div>
              <div className="kpi-value text-slate-700 dark:text-slate-300">
                {currency}{salesKPIs.totalCost.toLocaleString()}
              </div>
              <div className="kpi-footer text-slate-500">
                <span>{isHindi ? 'खरीद व स्टॉक लागत' : 'Inventory purchase cost'}</span>
              </div>
            </div>

            <div className="kpi-metric-card aov">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'औसत बिल साइज़ (Avg Bill)' : 'Avg Order Value'}</span>
                <div className="kpi-icon-wrap bg-purple-100 dark:bg-purple-900/40 text-purple-600">
                  <Receipt size={18} />
                </div>
              </div>
              <div className="kpi-value text-purple-700 dark:text-purple-300">
                {currency}{salesKPIs.avgOrderValue.toFixed(0)}
              </div>
              <div className="kpi-footer text-slate-500">
                <span>{isHindi ? 'प्रति ग्राहक बिक्री' : 'Per transaction'}</span>
              </div>
            </div>
          </div>

          {/* Product-wise Sales & Profit Contribution */}
          <div className="report-content-panel mt-6">
            <div className="panel-header-row">
              <h4 className="panel-title">
                {isHindi ? '📦 प्रोडक्ट वार बिक्री व मुनाफ़ा (Product Profitability)' : 'Product Sales & Margin'}
              </h4>
              <span className="panel-tag">
                {productPerformance.length} {isHindi ? 'प्रोडक्ट्स बिके' : 'products sold'}
              </span>
            </div>

            <div className="table-responsive-wrapper">
              <table className="reporting-data-table">
                <thead>
                  <tr>
                    <th>{isHindi ? 'प्रोडक्ट का नाम' : 'Product'}</th>
                    <th className="text-center">{isHindi ? 'बिक्री मात्रा' : 'Qty Sold'}</th>
                    <th className="text-right">{isHindi ? 'औसत बिक्री मूल्य' : 'Avg Sell Price'}</th>
                    <th className="text-right">{isHindi ? 'खरीद लागत' : 'Cost Price'}</th>
                    <th className="text-right">{isHindi ? 'कुल बिक्री' : 'Revenue'}</th>
                    <th className="text-right">{isHindi ? 'शुद्ध मुनाफ़ा' : 'Profit'}</th>
                    <th className="text-right">{isHindi ? 'मार्जिन' : 'Margin %'}</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-slate-400">
                        {isHindi ? 'इस अवधि में कोई बिक्री रिकॉर्ड नहीं है।' : 'No sales recorded for this period.'}
                      </td>
                    </tr>
                  ) : (
                    productPerformance.map((p, idx) => {
                      const margin = p.totalRevenue > 0 ? (p.totalProfit / p.totalRevenue) * 100 : 0;
                      return (
                        <tr key={idx}>
                          <td className="font-semibold text-slate-900 dark:text-slate-100">
                            {p.displayName}
                          </td>
                          <td className="text-center font-bold">
                            <span className="qty-sold-badge">{p.totalQuantity} pcs</span>
                          </td>
                          <td className="text-right">{currency}{p.avgPrice.toFixed(0)}</td>
                          <td className="text-right text-slate-500">{currency}{p.unitCost.toFixed(0)}</td>
                          <td className="text-right font-bold text-slate-800 dark:text-slate-200">
                            {currency}{p.totalRevenue.toLocaleString()}
                          </td>
                          <td className="text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            +{currency}{p.totalProfit.toLocaleString()}
                          </td>
                          <td className="text-right">
                            <span className="profit-margin-pill">
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoices List Breakdown */}
          <div className="report-content-panel mt-6">
            <div className="panel-header-row">
              <h4 className="panel-title">
                {isHindi ? '🧾 हाल ही में कटे बिल (Invoice Ledger)' : 'Recent Invoices'}
              </h4>
              <span className="panel-tag">
                {filteredSalesInvoices.length} {isHindi ? 'बिल' : 'records'}
              </span>
            </div>

            <div className="table-responsive-wrapper">
              <table className="reporting-data-table">
                <thead>
                  <tr>
                    <th>{isHindi ? 'इनवॉइस #' : 'Invoice #'}</th>
                    <th>{isHindi ? 'तारीख' : 'Date'}</th>
                    <th>{isHindi ? 'ग्राहक का नाम' : 'Customer'}</th>
                    <th>{isHindi ? 'आइटम्स' : 'Items'}</th>
                    <th className="text-right">{isHindi ? 'कुल बिल राशि' : 'Amount'}</th>
                    <th className="text-right">{isHindi ? 'मुनाफ़ा' : 'Profit'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="text-xs text-slate-500">{inv.date}</td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">
                        {inv.customerName || (isHindi ? 'कैश ग्राहक' : 'Walk-in Customer')}
                      </td>
                      <td className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {inv.items?.map((it) => `${it.name} (${it.quantity})`).join(', ') || inv.product}
                      </td>
                      <td className="text-right font-bold text-slate-900 dark:text-slate-100">
                        {currency}{Number(inv.total).toLocaleString()}
                      </td>
                      <td className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{currency}{Number(inv.netProfit).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: PURCHASE REPORT & ACCOUNTING (खरीददारी व खाता) */}
      {/* ========================================================= */}
      {reportMode === 'purchase' && (
        <div className="purchase-report-view animate-fade-in">
          {/* Purchase Accounting KPIs */}
          <div className="sales-kpi-grid">
            <div className="kpi-metric-card revenue">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'कुल खरीददारी (Total Purchases)' : 'Total Purchases'}</span>
                <div className="kpi-icon-wrap bg-blue-100 dark:bg-blue-900/40 text-blue-600">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className="kpi-value text-blue-700 dark:text-blue-300">
                {currency}{purchaseKPIs.totalPurchased.toLocaleString()}
              </div>
              <div className="kpi-footer">
                <span>{purchases.length} {isHindi ? 'खरीद बिल दर्ज' : 'purchase bills'}</span>
              </div>
            </div>

            <div className="kpi-metric-card profit">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'चुकाई गई रकम (Amount Paid)' : 'Total Paid'}</span>
                <div className="kpi-icon-wrap bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-value text-emerald-700 dark:text-emerald-300">
                {currency}{purchaseKPIs.totalPaid.toLocaleString()}
              </div>
              <div className="kpi-footer text-emerald-600 font-semibold">
                <span>
                  {purchaseKPIs.totalPurchased > 0
                    ? `${((purchaseKPIs.totalPaid / purchaseKPIs.totalPurchased) * 100).toFixed(0)}% `
                    : '100% '}
                  {isHindi ? 'भुगतान चुकता' : 'settled'}
                </span>
              </div>
            </div>

            <div className="kpi-metric-card cost">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'बकाया पेमेंट (Pending Balance)' : 'Total Balance Due'}</span>
                <div className="kpi-icon-wrap bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                  <CreditCard size={18} />
                </div>
              </div>
              <div className="kpi-value text-amber-600 dark:text-amber-400">
                {currency}{purchaseKPIs.totalPending.toLocaleString()}
              </div>
              <div className="kpi-footer text-amber-700 dark:text-amber-300 font-semibold">
                <span>{purchaseKPIs.pendingCount} {isHindi ? 'बिलों का भुगतान बाकी' : 'pending bills'}</span>
              </div>
            </div>

            <div className="kpi-metric-card aov">
              <div className="kpi-header">
                <span className="kpi-title">{isHindi ? 'अतिदेय राशि (Overdue Amount)' : 'Overdue Balance'}</span>
                <div className="kpi-icon-wrap bg-rose-100 dark:bg-rose-900/40 text-rose-600">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value text-rose-600 dark:text-rose-400">
                {currency}{purchaseKPIs.overdueAmount.toLocaleString()}
              </div>
              <div className="kpi-footer text-rose-600 font-semibold">
                <span>{purchaseKPIs.overdueCount} {isHindi ? 'बिल्स की तारीख निकल गई!' : 'bills overdue!'}</span>
              </div>
            </div>
          </div>

          {/* Action Bar & Filter Strip */}
          <div className="purchase-action-strip mt-6">
            <div className="search-filter-left">
              <div className="search-input-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder={isHindi ? 'सप्लायर या प्रोडक्ट खोजें...' : 'Search supplier or product...'}
                  value={purchaseSearchQuery}
                  onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                  className="search-field-input"
                />
              </div>

              <div className="purchase-filter-tabs">
                <button
                  type="button"
                  onClick={() => setPurchaseStatusFilter('all')}
                  className={`p-filter-pill ${purchaseStatusFilter === 'all' ? 'active' : ''}`}
                >
                  {isHindi ? 'सभी (All)' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseStatusFilter('pending')}
                  className={`p-filter-pill ${purchaseStatusFilter === 'pending' ? 'active' : ''}`}
                >
                  {isHindi ? 'बकाया (Pending)' : 'Pending'}
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseStatusFilter('due')}
                  className={`p-filter-pill ${purchaseStatusFilter === 'due' ? 'active' : ''}`}
                >
                  {isHindi ? 'ड्यू / अतिदेय (Due Soon)' : 'Due Soon'}
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseStatusFilter('paid')}
                  className={`p-filter-pill ${purchaseStatusFilter === 'paid' ? 'active' : ''}`}
                >
                  {isHindi ? 'पूर्ण चुकता (Paid)' : 'Paid'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddPurchaseOpen(true)}
              className="add-purchase-btn m3-ripple"
            >
              <Plus size={16} />
              <span>{isHindi ? '+ नया खरीद बिल जोड़ें' : '+ Add Purchase Bill'}</span>
            </button>
          </div>

          {/* Purchase Accounting Ledger Table */}
          <div className="report-content-panel mt-4">
            <div className="panel-header-row">
              <h4 className="panel-title">
                {isHindi ? '📖 सप्लायर खरीददारी व भुगतान खाता (Supplier Ledger)' : 'Supplier Purchase Ledger'}
              </h4>
              <span className="panel-tag">
                {filteredPurchases.length} {isHindi ? 'रिकॉर्ड्स' : 'records'}
              </span>
            </div>

            <div className="table-responsive-wrapper">
              <table className="reporting-data-table purchase-table">
                <thead>
                  <tr>
                    <th>{isHindi ? 'सप्लायर (किससे खरीदा)' : 'Supplier / Vendor'}</th>
                    <th>{isHindi ? 'खरीदा गया सामान व मात्रा' : 'Items & Quantity'}</th>
                    <th className="text-right">{isHindi ? 'कुल बिल राशि' : 'Total Bill'}</th>
                    <th className="text-right">{isHindi ? 'कितनी पेमेंट कर दी' : 'Paid Amount'}</th>
                    <th className="text-right">{isHindi ? 'पेंडिंग पेमेंट (बाकी)' : 'Pending Balance'}</th>
                    <th className="text-center">{isHindi ? 'कब पेमेंट ड्यू है' : 'Due Date'}</th>
                    <th className="text-center">{isHindi ? 'स्टेटस' : 'Status'}</th>
                    <th className="text-center">{isHindi ? 'एक्शन' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        {isHindi ? 'कोई खरीददारी रिकॉर्ड नहीं मिला।' : 'No purchase records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((pur) => {
                      const isFullyPaid = pur.pendingAmount <= 0;
                      return (
                        <tr key={pur.id} className={pur.isOverdue ? 'overdue-row' : ''}>
                          {/* 1. Supplier Name & Contact */}
                          <td>
                            <div className="supplier-cell-content">
                              <span className="supplier-name-text">{pur.supplierName}</span>
                              {pur.supplierContact && (
                                <span className="supplier-phone-subtext">
                                  <Phone size={11} className="inline mr-1" />
                                  {pur.supplierContact}
                                </span>
                              )}
                              <span className="supplier-bill-no">{pur.purchaseNumber} • {pur.date}</span>
                            </div>
                          </td>

                          {/* 2. Items & Quantity */}
                          <td>
                            <div className="purchase-items-cell">
                              {pur.items && pur.items.length > 0 ? (
                                pur.items.map((it, idx) => (
                                  <div key={idx} className="purchased-item-chip">
                                    <span className="item-name font-semibold">{it.name}</span>
                                    <span className="item-qty">
                                      {it.quantity} pcs @ {currency}{it.unitCost}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                                  {pur.product}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Total Bill Amount */}
                          <td className="text-right font-bold text-slate-900 dark:text-slate-100">
                            {currency}{Number(pur.totalAmount).toLocaleString()}
                          </td>

                          {/* 4. Amount Paid */}
                          <td className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {currency}{Number(pur.paidAmount).toLocaleString()}
                          </td>

                          {/* 5. Pending Balance */}
                          <td className="text-right">
                            {pur.pendingAmount > 0 ? (
                              <span className="pending-balance-badge">
                                {currency}{Number(pur.pendingAmount).toLocaleString()}
                              </span>
                            ) : (
                              <span className="paid-zero-badge">
                                {currency}0
                              </span>
                            )}
                          </td>

                          {/* 6. Payment Due Date & Countdown */}
                          <td className="text-center">
                            {isFullyPaid ? (
                              <span className="due-status-pill fully-paid">
                                <Check size={12} />
                                <span>{isHindi ? 'पूर्ण चुकता' : 'Paid in Full'}</span>
                              </span>
                            ) : pur.isOverdue ? (
                              <span className="due-status-pill overdue" title={`Due: ${pur.dueDate}`}>
                                <AlertTriangle size={12} />
                                <span>
                                  {isHindi ? 'तारीख निकल गई!' : 'Overdue!'} ({Math.abs(pur.daysRemaining)} {isHindi ? 'दिन' : 'd'})
                                </span>
                              </span>
                            ) : pur.daysRemaining === 0 ? (
                              <span className="due-status-pill due-today" title={`Due: ${pur.dueDate}`}>
                                <Clock size={12} />
                                <span>{isHindi ? 'आज ड्यू है!' : 'Due Today!'}</span>
                              </span>
                            ) : (
                              <span className="due-status-pill upcoming" title={`Due: ${pur.dueDate}`}>
                                <Clock size={12} />
                                <span>
                                  {pur.daysRemaining} {isHindi ? 'दिन बाकी' : 'days left'} ({pur.dueDate})
                                </span>
                              </span>
                            )}
                          </td>

                          {/* 7. Status Badge */}
                          <td className="text-center">
                            {isFullyPaid ? (
                              <span className="purchase-status-badge status-paid">
                                {isHindi ? '🟢 पूर्ण चुकता' : '🟢 Paid'}
                              </span>
                            ) : pur.paidAmount > 0 ? (
                              <span className="purchase-status-badge status-partial">
                                {isHindi ? '🟡 आंशिक बकाया' : '🟡 Partial'}
                              </span>
                            ) : (
                              <span className="purchase-status-badge status-unpaid">
                                {isHindi ? '🔴 पूरी बाकी' : '🔴 Unpaid'}
                              </span>
                            )}
                          </td>

                          {/* 8. Action Buttons */}
                          <td className="text-center">
                            <div className="purchase-row-actions">
                              {!isFullyPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(pur)}
                                  className="record-payment-btn m3-ripple"
                                  title={isHindi ? 'भुगतान दर्ज करें' : 'Record Payment'}
                                >
                                  <CreditCard size={13} />
                                  <span>{isHindi ? 'पेमेंट करें' : 'Pay'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(isHindi ? 'क्या आप इस खरीद रिकॉर्ड को हटाना चाहते हैं?' : 'Delete this purchase record?')) {
                                    deletePurchase(pur.id);
                                  }
                                }}
                                className="delete-row-icon-btn m3-ripple"
                                title={isHindi ? 'डिलीट करें' : 'Delete'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: RECORD PURCHASE PAYMENT DIALOG                  */}
      {/* ========================================================= */}
      {activePaymentPurchase && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setActivePaymentPurchase(null)}>
          <div
            className="m3-dialog-container payment-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-600" />
                <h3 className="dialog-title">
                  {isHindi ? 'सप्लायर को पेमेंट दर्ज करें' : 'Record Supplier Payment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentPurchase(null)}
                className="icon-button"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-4 space-y-4">
              {paymentSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              {/* Bill Details Summary */}
              <div className="supplier-bill-summary-box">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                      {isHindi ? 'सप्लायर' : 'Supplier'}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {activePaymentPurchase.supplierName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {activePaymentPurchase.product} • {activePaymentPurchase.purchaseNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                      {isHindi ? 'बकाया राशि' : 'Balance Due'}
                    </span>
                    <div className="text-lg font-extrabold text-amber-600">
                      {currency}{Number(activePaymentPurchase.pendingAmount).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-500">{isHindi ? 'कुल बिल:' : 'Total Bill:'}</span>{' '}
                    <span className="font-semibold">{currency}{activePaymentPurchase.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{isHindi ? 'पहले से दिया:' : 'Already Paid:'}</span>{' '}
                    <span className="font-semibold text-emerald-600">{currency}{activePaymentPurchase.paidAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label className="form-label">{isHindi ? 'भुगतान राशि (Amount to Pay)' : 'Payment Amount'}</label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(activePaymentPurchase.pendingAmount))}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {isHindi ? 'पूरा बकाया भरें' : 'Pay Full Balance'}
                  </button>
                </div>
                <div className="input-with-icon">
                  <span className="currency-prefix">{currency}</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={activePaymentPurchase.pendingAmount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="m3-text-field"
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="form-group">
                <label className="form-label">{isHindi ? 'भुगतान का माध्यम (Payment Method)' : 'Payment Mode'}</label>
                <div className="grid grid-cols-4 gap-2">
                  {['UPI', 'Cash', 'NEFT / Bank', 'Cheque'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMethod(mode)}
                      className={`payment-mode-btn ${payMethod === mode ? 'active' : ''}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes or Ref ID */}
              <div className="form-group">
                <label className="form-label">{isHindi ? 'रिफरेंस / नोट (वैकल्पिक)' : 'Notes / Reference (Optional)'}</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder={isHindi ? 'जैसे: UTR नंबर, चेक नंबर या कैश रसीद' : 'e.g. UTR / Transaction ID'}
                  className="m3-text-field"
                />
              </div>

              <div className="dialog-actions-row">
                <button
                  type="button"
                  onClick={() => setActivePaymentPurchase(null)}
                  className="m3-button-tonal"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="m3-button-filled bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check size={16} />
                  <span>{isHindi ? 'भुगतान कन्फर्म करें' : 'Confirm Payment'}</span>
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
            className="m3-dialog-container add-purchase-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-600" />
                <h3 className="dialog-title">
                  {isHindi ? '📦 नया सप्लायर खरीद बिल जोड़ें' : 'Add New Purchase Bill'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPurchaseOpen(false)}
                className="icon-button"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPurchaseSubmit} className="p-4 space-y-3.5">
              {addBillError && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{addBillError}</span>
                </div>
              )}
              {addBillSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{addBillSuccess}</span>
                </div>
              )}

              {/* Row 1: Supplier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'सप्लायर / वेंडर का नाम *' : 'Supplier Name *'}</label>
                  <input
                    type="text"
                    required
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="e.g. Vardhman Textiles"
                    className="m3-text-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'सप्लायर फोन नंबर' : 'Contact Phone'}</label>
                  <input
                    type="text"
                    value={newSupplierContact}
                    onChange={(e) => setNewSupplierContact(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="m3-text-field"
                  />
                </div>
              </div>

              {/* Row 2: Product Name & Restock option */}
              <div className="form-group">
                <label className="form-label">{isHindi ? 'खरीदा गया प्रोडक्ट / माल *' : 'Product / Material *'}</label>
                <input
                  type="text"
                  required
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="e.g. T-Shirt Fabric, Formal Shirt"
                  className="m3-text-field"
                />
              </div>

              {/* Row 3: Quantity & Unit Cost Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'खरीद मात्रा (Quantity) *' : 'Quantity *'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="m3-text-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isHindi ? 'प्रति पीस खरीद लागत (Unit Cost) *' : 'Unit Cost Price *'}</label>
                  <div className="input-with-icon">
                    <span className="currency-prefix">{currency}</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newUnitCost}
                      onChange={(e) => setNewUnitCost(e.target.value)}
                      placeholder="e.g. 320"
                      className="m3-text-field"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Total Bar */}
              <div className="calculated-total-bar">
                <span>{isHindi ? 'कुल खरीद बिल राशि (Total Bill):' : 'Total Purchase Bill:'}</span>
                <span className="total-val">
                  {currency}{(Math.max(1, Number(newQuantity) || 1) * Math.max(0, Number(newUnitCost) || 0)).toLocaleString()}
                </span>
              </div>

              {/* Row 4: Paid Amount Now & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'अभी कितना भुगतान किया (Paid Now)' : 'Amount Paid Now'}</label>
                  <div className="input-with-icon">
                    <span className="currency-prefix">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      value={newPaidNow}
                      onChange={(e) => setNewPaidNow(e.target.value)}
                      placeholder="0"
                      className="m3-text-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{isHindi ? 'पेमेंट ड्यू डेट (कब चुकानी है) *' : 'Payment Due Date *'}</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="m3-text-field"
                  />
                </div>
              </div>

              {/* Auto Add to Inventory Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="add-to-stock-cb"
                  checked={newAddToStock}
                  onChange={(e) => setNewAddToStock(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="add-to-stock-cb" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isHindi
                    ? '📦 इन्वेंटरी स्टॉक में भी जोड़ें (साथ ही कॉस्ट प्राइस अपडेट करें)'
                    : '📦 Also update product stock quantity and cost price in Inventory'}
                </label>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">{isHindi ? 'बिल नोट्स / क्रेडिट शर्तें' : 'Notes / Terms'}</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder={isHindi ? 'जैसे: 15 दिन की उधारी, डिलीवरी के बाद बकाया' : 'e.g. 15 days credit terms'}
                  className="m3-text-field"
                />
              </div>

              <div className="dialog-actions-row">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="m3-button-tonal"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="m3-button-filled"
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
