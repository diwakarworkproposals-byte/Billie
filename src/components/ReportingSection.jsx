import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { shareToWhatsAppDirectly } from '../utils/mobileNative';
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
  Package,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

const formatPayModeBadge = (mode, isHindi) => {
  const m = String(mode || 'cash').toLowerCase().trim();
  if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm') || m.includes('online') || m.includes('qr')) {
    return '⚡ UPI';
  }
  if (m.includes('card') || m.includes('debit') || m.includes('credit')) {
    return '💳 ' + (isHindi ? 'कार्ड' : 'Card');
  }
  if (m.includes('cheque') || m.includes('check')) {
    return '📝 ' + (isHindi ? 'चेक' : 'Cheque');
  }
  return '💵 ' + (isHindi ? 'नकद' : 'Cash');
};

const getPayModeClass = (mode) => {
  const m = String(mode || 'cash').toLowerCase().trim();
  if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm')) return 'mode-upi';
  if (m.includes('card') || m.includes('debit') || m.includes('credit')) return 'mode-card';
  if (m.includes('cheque') || m.includes('check')) return 'mode-cheque';
  return 'mode-cash';
};

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
    recordInvoicePayment,
    settings
  } = useApp();

  const isHindi = settings.language === 'hi';
  const currency = settings.currency || '₹';

  // Active Report View Mode: 'sales' (बिक्री रिपोर्ट) | 'purchase' (सप्लायर खाता) | 'sales_due' (ग्राहक उधारी व बकाया)
  const [reportMode, setReportMode] = useState(initialMode);

  // Time filter for Sales: 'today' (Daily) | 'week' (Weekly) | 'month' (Monthly) | 'all' (All Time)
  // Initially null so total bills are not dumped until a period filter is clicked
  const [salesTimeFilter, setSalesTimeFilter] = useState(null);

  // Purchase filters
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('all'); // 'all' | 'pending' | 'due' | 'paid'
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');

  // Sales Due (ग्राहक उधारी) filters & payment modal state
  const [salesDueFilter, setSalesDueFilter] = useState('all'); // 'all' | 'overdue' | 'today'
  const [salesDueSearchQuery, setSalesDueSearchQuery] = useState('');
  const [activeCustomerPaymentInvoice, setActiveCustomerPaymentInvoice] = useState(null);
  const [customerPayAmount, setCustomerPayAmount] = useState('');
  const [customerPayMethod, setCustomerPayMethod] = useState('cash');
  const [customerPayNotes, setCustomerPayNotes] = useState('');
  const [customerPaySuccessMsg, setCustomerPaySuccessMsg] = useState('');

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

  // Helper to parse dates safely with fallback
  const parseDateSafe = (dateStr, rawDate, timestamp, id) => {
    if (timestamp && typeof timestamp === 'number' && !isNaN(timestamp)) {
      return new Date(timestamp);
    }
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof id === 'string' && id.startsWith('inv_')) {
      const idTime = parseInt(id.replace('inv_', ''), 10);
      if (idTime > 1500000000000 && idTime < 3000000000000) {
        const d = new Date(idTime);
        if (!isNaN(d.getTime())) return d;
      }
    }
    if (!dateStr) return new Date(0);
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const parts = String(dateStr).split(/[/.-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d2 = new Date(year, month, day);
        if (!isNaN(d2.getTime())) return d2;
      } else if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d2 = new Date(year, month, day);
        if (!isNaN(d2.getTime())) return d2;
      }
    }
    return new Date(0);
  };

  // -------------------------------------------------------------
  // 1. SALES REPORT CALCULATIONS
  // -------------------------------------------------------------
  const processedInvoices = useMemo(() => {
    return invoices.map((inv) => {
      const invDate = parseDateSafe(inv.date, inv.rawDate, inv.timestamp, inv.id);
      let invCost = 0;

      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((it) => {
          const normName = (it.name || '').toLowerCase().trim();
          const knownCost = it.costPrice > 0 ? it.costPrice : productCostMap[normName];
          const unitCost = knownCost !== undefined && knownCost > 0 ? knownCost : 0;
          const qty = Number(it.quantity) || 1;
          invCost += qty * unitCost;
        });
      } else {
        invCost = 0;
      }

      const invRevenue = Number(inv.total) || 0;
      const invProfit = invRevenue - invCost;
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
    if (!salesTimeFilter) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const weekAgo = todayStart - 86400000 * 7;
    const monthAgo = todayStart - 86400000 * 30;

    return processedInvoices.filter((inv) => {
      const t = inv.parsedDate.getTime();
      if (t <= 0) return false;
      if (salesTimeFilter === 'today') {
        return t >= todayStart && t <= todayEnd;
      }
      if (salesTimeFilter === 'week') {
        return t >= weekAgo && t <= todayEnd;
      }
      if (salesTimeFilter === 'month') {
        return t >= monthAgo && t <= todayEnd;
      }
      if (salesTimeFilter === 'all') {
        return true;
      }
      return false;
    });
  }, [processedInvoices, salesTimeFilter]);

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

  // Payment Mode Breakdown for currently active time filter
  const paymentModeBreakdown = useMemo(() => {
    const stats = {
      cash: { count: 0, amount: 0 },
      upi: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      cheque: { count: 0, amount: 0 }
    };

    filteredSalesInvoices.forEach((inv) => {
      const mode = (inv.paymentMode || inv.paymentMethod || 'cash').toLowerCase().trim();
      const amt = Number(inv.total) || 0;
      if (
        mode.includes('upi') ||
        mode.includes('gpay') ||
        mode.includes('phonepe') ||
        mode.includes('paytm') ||
        mode.includes('online') ||
        mode.includes('qr')
      ) {
        stats.upi.count += 1;
        stats.upi.amount += amt;
      } else if (
        mode.includes('card') ||
        mode.includes('debit') ||
        mode.includes('credit')
      ) {
        stats.card.count += 1;
        stats.card.amount += amt;
      } else if (mode.includes('cheque') || mode.includes('check')) {
        stats.cheque.count += 1;
        stats.cheque.amount += amt;
      } else {
        stats.cash.count += 1;
        stats.cash.amount += amt;
      }
    });

    return stats;
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
  // 3. SALES DUE (ग्राहक उधारी व बकाया) CALCULATIONS & HANDLERS
  // -------------------------------------------------------------
  const processedDueInvoices = useMemo(() => {
    return (invoices || [])
      .map((inv) => {
        const grandTotal = Number(inv.grandTotal !== undefined ? inv.grandTotal : (inv.total || 0));
        const paidAmount = Number(inv.paidAmount !== undefined ? inv.paidAmount : (inv.dueAmount !== undefined ? grandTotal - inv.dueAmount : grandTotal));
        const dueAmount = inv.dueAmount !== undefined ? Number(inv.dueAmount) : Math.max(0, grandTotal - paidAmount);

        const invTime = inv.timestamp || (inv.rawDate ? new Date(inv.rawDate).getTime() : parseDateSafe(inv.date, null, null, inv.id).getTime());
        const ageDays = invTime > 0 ? Math.floor((Date.now() - invTime) / (1000 * 60 * 60 * 24)) : 0;

        return {
          ...inv,
          grandTotal,
          paidAmount,
          dueAmount,
          ageDays,
          isOverdue7Days: ageDays > 7
        };
      })
      .filter((inv) => inv.dueAmount > 0)
      .sort((a, b) => b.ageDays - a.ageDays);
  }, [invoices]);

  const salesDueKPIs = useMemo(() => {
    const totalDue = processedDueInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    const totalBilled = processedDueInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = processedDueInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const overdue7DaysCount = processedDueInvoices.filter((inv) => inv.ageDays > 7).length;
    const uniqueCustomers = new Set(processedDueInvoices.map((i) => (i.customerName || i.customerPhone || i.id).trim().toLowerCase())).size;

    return {
      totalDue,
      totalBilled,
      totalPaid,
      overdue7DaysCount,
      customerCount: uniqueCustomers,
      totalInvoicesCount: processedDueInvoices.length
    };
  }, [processedDueInvoices]);

  const filteredDueInvoices = useMemo(() => {
    return processedDueInvoices.filter((inv) => {
      if (salesDueFilter === 'overdue' && inv.ageDays <= 7) return false;
      if (salesDueFilter === 'today' && inv.ageDays !== 0) return false;

      if (salesDueSearchQuery.trim()) {
        const q = salesDueSearchQuery.toLowerCase().trim();
        const matchName = (inv.customerName || '').toLowerCase().includes(q);
        const matchPhone = (inv.customerPhone || '').toLowerCase().includes(q);
        const matchNum = String(inv.invoiceNumber || inv.id || '').toLowerCase().includes(q);
        return matchName || matchPhone || matchNum;
      }
      return true;
    });
  }, [processedDueInvoices, salesDueFilter, salesDueSearchQuery]);

  const handleSendWhatsAppDueReminder = (inv) => {
    const cleanPhone = (inv.customerPhone || '').replace(/[^0-9]/g, '');
    const storeName = user?.storeName || user?.businessName || settings?.storeName || 'Billie Store';
    const custName = inv.customerName || (isHindi ? 'ग्राहक' : 'Customer');
    const invNum = inv.invoiceNumber || inv.id || 'INV';
    const message = isHindi
      ? `नमस्ते ${custName} जी 🙏\n\n` +
        `यह *${storeName}* से आपके बिल #${invNum} का पेमेंट रिमाइंडर है।\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `• कुल बिल राशि: ${currency}${Number(inv.grandTotal).toLocaleString()}\n` +
        `• प्राप्त भुगतान: ${currency}${Number(inv.paidAmount).toLocaleString()}\n` +
        `• कुल बकाया बाकी (Due): *${currency}${Number(inv.dueAmount).toLocaleString()}*\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `कृपया बकाया राशि का भुगतान शीघ्र करने का कष्ट करें।\n` +
        `धन्यवाद! 🙏`
      : `Hello ${custName} 🙏\n\n` +
        `This is a friendly payment reminder from *${storeName}* for Invoice #${invNum}.\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `• Total Bill: ${currency}${Number(inv.grandTotal).toLocaleString()}\n` +
        `• Received: ${currency}${Number(inv.paidAmount).toLocaleString()}\n` +
        `• Balance Due: *${currency}${Number(inv.dueAmount).toLocaleString()}*\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `Kindly clear the pending dues at your earliest convenience.\n` +
        `Thank you!`;

    shareToWhatsAppDirectly({ phone: cleanPhone, text: message });
  };

  const handleOpenCustomerPaymentModal = (inv) => {
    setActiveCustomerPaymentInvoice(inv);
    setCustomerPayAmount(String(inv.dueAmount));
    setCustomerPayMethod('cash');
    setCustomerPayNotes('');
    setCustomerPaySuccessMsg('');
  };

  const handleConfirmCustomerPayment = (e) => {
    e.preventDefault();
    if (!activeCustomerPaymentInvoice) return;

    const amount = Number(customerPayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(isHindi ? 'कृपया मान्य राशि दर्ज करें!' : 'Please enter a valid amount!');
      return;
    }

    if (amount > activeCustomerPaymentInvoice.dueAmount) {
      alert(
        isHindi
          ? `भुगतान राशि बकाया राशि (${currency}${activeCustomerPaymentInvoice.dueAmount.toLocaleString()}) से अधिक नहीं हो सकती!`
          : `Amount cannot exceed balance due (${currency}${activeCustomerPaymentInvoice.dueAmount.toLocaleString()})!`
      );
      return;
    }

    const res = recordInvoicePayment(
      activeCustomerPaymentInvoice.id,
      amount,
      customerPayMethod,
      customerPayNotes || (isHindi ? 'ग्राहक से बकाया भुगतान प्राप्त' : 'Customer due payment received')
    );

    if (res && res.success !== false) {
      setCustomerPaySuccessMsg(
        isHindi
          ? `✓ ${currency}${amount.toLocaleString()} का भुगतान सफलतापूर्वक दर्ज हो गया!`
          : `✓ Payment of ${currency}${amount.toLocaleString()} recorded successfully!`
      );
      setTimeout(() => {
        setActiveCustomerPaymentInvoice(null);
        setCustomerPaySuccessMsg('');
        setCustomerPayAmount('');
        setCustomerPayNotes('');
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
            {reportMode === 'sales' ? (
              <TrendingUp size={20} />
            ) : reportMode === 'sales_due' ? (
              <Receipt size={20} />
            ) : (
              <ShoppingBag size={20} />
            )}
          </div>
          <div>
            <h3 className="m3-report-heading">
              {isHindi ? 'हिसाब-किताब व रिपोर्ट' : 'Business Reports'}
            </h3>
            <p className="m3-report-subheading">
              {isHindi ? 'बिक्री, मुनाफ़ा, सप्लायर व ग्राहक उधारी' : 'Sales, Profit, Suppliers & Customer Dues'}
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
          <span>{isHindi ? 'बिक्री (Sales)' : 'Sales'}</span>
        </button>

        <button
          type="button"
          onClick={() => setReportMode('purchase')}
          className={`m3-segment-btn ${reportMode === 'purchase' ? 'active-purchase' : ''}`}
        >
          <ShoppingBag size={15} />
          <span>{isHindi ? 'सप्लायर खाता' : 'Suppliers'}</span>
          {purchaseKPIs.pendingCount > 0 && (
            <span className="m3-alert-badge">{purchaseKPIs.pendingCount}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setReportMode('sales_due')}
          className={`m3-segment-btn ${reportMode === 'sales_due' ? 'active-sales-due' : ''}`}
        >
          <Receipt size={15} />
          <span>{isHindi ? 'ग्राहक उधारी' : 'Sales Due'}</span>
          {salesDueKPIs.totalInvoicesCount > 0 && (
            <span className="m3-alert-badge due-badge">{salesDueKPIs.totalInvoicesCount}</span>
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

          {/* Prompt card when no filter is clicked yet */}
          {salesTimeFilter === null ? (
            <div className="m3-report-prompt-box animate-slide-up mt-3">
              <div className="prompt-icon-bubble">
                <Calendar size={28} className="text-blue-600" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mt-2">
                {isHindi ? 'बिक्री रिपोर्ट देखने के लिए अवधि चुनें' : 'Select Time Period to View Sales Report'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isHindi
                  ? 'ऊपर दिए गए बटनों (आज, इस सप्ताह, इस महीने, या कुल) में से चुनें ताकि आपको उस अवधि की कुल बिक्री, मुनाफ़ा, पेमेंट माध्यम और कटे हुए बिल दिखाई दें।'
                  : 'Choose a filter above (Today, This Week, This Month, or All Time) to view sales, net profit, payment collections and bills for that period.'}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSalesTimeFilter('today')}
                  className="m3-quick-filter-cta today m3-ripple"
                >
                  <Sparkles size={14} />
                  <span>{isHindi ? 'आज के बिल देखें (Today)' : "View Today's Bills"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSalesTimeFilter('all')}
                  className="m3-quick-filter-cta all m3-ripple"
                >
                  <Layers size={14} />
                  <span>{isHindi ? 'सभी बिल देखें (All Time)' : 'View All Bills'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  <div className="m3-kpi-big-number" style={{ color: salesKPIs.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                    {salesKPIs.totalProfit >= 0 ? '+' : '-'}{currency}{Math.abs(salesKPIs.totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="m3-kpi-subtext text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                    <ArrowUpRight size={13} />
                    <span>{salesKPIs.profitMargin.toFixed(1)}% {isHindi ? 'मुनाफ़ा मार्जिन' : 'profit margin'}</span>
                  </span>
                </div>
              </div>

              {/* Payment Mode Collection Breakdown for the active time period */}
              <div className="m3-paymode-breakdown-card mt-3 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="paymode-card-title flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <CreditCard size={14} className="text-indigo-500" />
                    <span>
                      {salesTimeFilter === 'today'
                        ? (isHindi ? 'आज का भुगतान माध्यम संग्रह (Daily Collection by Mode)' : "Today's Collection by Mode")
                        : salesTimeFilter === 'week'
                        ? (isHindi ? 'इस सप्ताह का भुगतान संग्रह' : "This Week's Collection by Mode")
                        : salesTimeFilter === 'month'
                        ? (isHindi ? 'इस महीने का भुगतान संग्रह' : "This Month's Collection by Mode")
                        : (isHindi ? 'कुल भुगतान संग्रह (All Time Collection)' : "All-Time Collection by Mode")}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {salesKPIs.invoiceCount} {isHindi ? 'बिलों से' : 'bills'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Cash */}
                  <div className="m3-paymode-stat-box cash">
                    <div className="flex items-center justify-between">
                      <span className="stat-label">💵 {isHindi ? 'नकद (Cash)' : 'Cash'}</span>
                      <span className="stat-count">{paymentModeBreakdown.cash.count} {isHindi ? 'बिल' : 'bills'}</span>
                    </div>
                    <div className="stat-amt">
                      {currency}{paymentModeBreakdown.cash.amount.toLocaleString()}
                    </div>
                  </div>

                  {/* UPI */}
                  <div className="m3-paymode-stat-box upi">
                    <div className="flex items-center justify-between">
                      <span className="stat-label">⚡ UPI / QR</span>
                      <span className="stat-count">{paymentModeBreakdown.upi.count} {isHindi ? 'बिल' : 'bills'}</span>
                    </div>
                    <div className="stat-amt">
                      {currency}{paymentModeBreakdown.upi.amount.toLocaleString()}
                    </div>
                  </div>

                  {/* Card */}
                  <div className="m3-paymode-stat-box card">
                    <div className="flex items-center justify-between">
                      <span className="stat-label">💳 {isHindi ? 'कार्ड (Card)' : 'Card'}</span>
                      <span className="stat-count">{paymentModeBreakdown.card.count} {isHindi ? 'बिल' : 'bills'}</span>
                    </div>
                    <div className="stat-amt">
                      {currency}{paymentModeBreakdown.card.amount.toLocaleString()}
                    </div>
                  </div>

                  {/* Cheque */}
                  <div className="m3-paymode-stat-box cheque">
                    <div className="flex items-center justify-between">
                      <span className="stat-label">📝 {isHindi ? 'चेक (Cheque)' : 'Cheque'}</span>
                      <span className="stat-count">{paymentModeBreakdown.cheque.count} {isHindi ? 'बिल' : 'bills'}</span>
                    </div>
                    <div className="stat-amt">
                      {currency}{paymentModeBreakdown.cheque.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile-First Invoice List (Cards, NOT a breaking table!) */}
              <div className="m3-list-section mt-4">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isHindi ? 'कटे हुए बिलों का ब्यौरा' : 'Bills Generated'} ({filteredSalesInvoices.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {salesTimeFilter === 'today'
                      ? (isHindi ? 'आज के बिल' : 'Today')
                      : salesTimeFilter === 'week'
                      ? (isHindi ? 'इस सप्ताह के बिल' : 'This Week')
                      : salesTimeFilter === 'month'
                      ? (isHindi ? 'इस महीने के बिल' : 'This Month')
                      : (isHindi ? 'सभी बिल' : 'All Time')}
                  </span>
                </div>

                {filteredSalesInvoices.length === 0 ? (
                  <div className="m3-empty-state-box">
                    <Receipt size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      {salesTimeFilter === 'today'
                        ? (isHindi ? 'आज कोई बिल नहीं कटा है।' : 'No bills generated today.')
                        : (isHindi ? 'इस अवधि में कोई बिल नहीं कटा है।' : 'No bills found for this period.')}
                    </p>
                  </div>
                ) : (
                  <div className="m3-sales-cards-container">
                    {filteredSalesInvoices.map((inv) => (
                      <div key={inv.id} className="m3-sales-card">
                        {/* Row 1: Customer Name & Phone */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {inv.customerName || (isHindi ? 'कैश ग्राहक' : 'Cash Customer')}
                            </h4>
                            {inv.customerCompany && (
                              <span className="text-[11px] text-slate-400 font-medium">({inv.customerCompany})</span>
                            )}
                          </div>
                          {inv.customerPhone && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <Phone size={10} />
                              {inv.customerPhone}
                            </span>
                          )}
                        </div>

                        {/* Row 2: Invoice Number, Date, and Payment Mode ALL ON THE SAME LINE */}
                        <div className="m3-inv-same-line-strip flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="m3-badge-inv-num">
                            <Receipt size={12} className="inline mr-1 text-blue-600" />
                            {inv.invoiceNumber}
                          </span>
                          <span className="m3-badge-date-pill flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar size={11} className="text-slate-400" />
                            {inv.date} {inv.time ? `• ${inv.time}` : ''}
                          </span>
                          <span className={`m3-badge-paymode-pill ${getPayModeClass(inv.paymentMode || inv.paymentMethod)}`}>
                            {formatPayModeBadge(inv.paymentMode || inv.paymentMethod, isHindi)}
                          </span>
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
                            <span
                              className="val font-bold"
                              style={{ color: (inv.netProfit || 0) >= 0 ? '#16a34a' : '#dc2626' }}
                            >
                              {(inv.netProfit || 0) >= 0 ? '+' : '-'}{currency}{Math.abs(Number(inv.netProfit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            </>
          )}
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
      {/* VIEW 3: SALES DUE (उधारी व बकाया) SECTION                 */}
      {/* ========================================================= */}
      {reportMode === 'sales_due' && (
        <div className="m3-sales-due-section-body animate-fade-in">
          {/* Summary KPI Cards (100% Mobile Responsive) */}
          <div className="m3-purchase-summary-row">
            <div className="m3-p-kpi-box highlighted-rose">
              <span className="p-kpi-label">{isHindi ? 'कुल उधारी (Total Due)' : 'Total Balance Due'}</span>
              <span className="p-kpi-val text-rose-600 dark:text-rose-400">
                {currency}{salesDueKPIs.totalDue.toLocaleString()}
              </span>
            </div>

            <div className="m3-p-kpi-box">
              <span className="p-kpi-label">{isHindi ? 'कुल बिल (Billed)' : 'Total Billed'}</span>
              <span className="p-kpi-val text-blue-700 dark:text-blue-300">
                {currency}{salesDueKPIs.totalBilled.toLocaleString()}
              </span>
            </div>

            <div className="m3-p-kpi-box">
              <span className="p-kpi-label">{isHindi ? 'प्राप्त (Paid)' : 'Already Paid'}</span>
              <span className="p-kpi-val text-emerald-600 dark:text-emerald-400">
                {currency}{salesDueKPIs.totalPaid.toLocaleString()}
              </span>
            </div>

            <div className="m3-p-kpi-box">
              <span className="p-kpi-label">{isHindi ? 'ग्राहक संख्या' : 'Due Customers'}</span>
              <span className="p-kpi-val text-indigo-600 dark:text-indigo-400">
                {salesDueKPIs.customerCount}
              </span>
            </div>
          </div>

          {/* Overdue > 7 Days Warning Banner if any */}
          {salesDueKPIs.overdue7DaysCount > 0 && (
            <div className="m3-alert-banner warning mt-3 animate-fade-in flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {isHindi
                    ? `⚠️ ${salesDueKPIs.overdue7DaysCount} ग्राहकों की उधारी 7 दिन से ज्यादा पुरानी हो चुकी है!`
                    : `⚠️ ${salesDueKPIs.overdue7DaysCount} customer accounts are overdue by more than 7 days!`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSalesDueFilter(salesDueFilter === 'overdue' ? 'all' : 'overdue')}
                className="text-xs font-extrabold text-amber-800 dark:text-amber-300 underline bg-transparent border-0 cursor-pointer"
              >
                {salesDueFilter === 'overdue' ? (isHindi ? 'सभी देखें' : 'Show All') : (isHindi ? 'फ़िल्टर करें' : 'Filter Overdue')}
              </button>
            </div>
          )}

          {/* Search Bar & Filter Chips */}
          <div className="m3-purchase-toolbar mt-3">
            <div className="m3-search-bar-wrap w-full">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder={isHindi ? 'ग्राहक का नाम, फ़ोन या बिल नंबर खोजें...' : 'Search customer name, phone or invoice #...'}
                value={salesDueSearchQuery}
                onChange={(e) => setSalesDueSearchQuery(e.target.value)}
                className="m3-search-input-field"
              />
              {salesDueSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSalesDueSearchQuery('')}
                  className="bg-transparent border-0 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="m3-status-filter-pills-row mt-2.5">
            <button
              type="button"
              onClick={() => setSalesDueFilter('all')}
              className={`m3-status-chip ${salesDueFilter === 'all' ? 'active' : ''}`}
            >
              {isHindi ? 'सभी उधारी (All)' : 'All Dues'} ({salesDueKPIs.totalInvoicesCount})
            </button>

            <button
              type="button"
              onClick={() => setSalesDueFilter('overdue')}
              className={`m3-status-chip ${salesDueFilter === 'overdue' ? 'active alert-chip' : ''}`}
            >
              {isHindi ? '⚠️ 7+ दिन पुरानी' : '⚠️ >7 Days Overdue'} ({salesDueKPIs.overdue7DaysCount})
            </button>

            <button
              type="button"
              onClick={() => setSalesDueFilter('today')}
              className={`m3-status-chip ${salesDueFilter === 'today' ? 'active' : ''}`}
            >
              {isHindi ? 'आज की उधारी' : "Today's Dues"}
            </button>
          </div>

          {/* Customer Due List Cards */}
          <div className="m3-purchase-list-scroll mt-3 custom-scrollbar">
            {filteredDueInvoices.length === 0 ? (
              <div className="m3-empty-ledger-box">
                <Receipt size={36} className="text-emerald-500 opacity-60 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {salesDueSearchQuery
                    ? (isHindi ? 'कोई मेल खाता उधारी बिल नहीं मिला' : 'No matching due invoice found')
                    : (isHindi ? 'शाबाश! कोई ग्राहक उधारी बकाया नहीं है' : 'All Clear! No customer balance dues pending')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {salesDueSearchQuery
                    ? (isHindi ? 'कृपया दूसरा नाम या नंबर सर्च करें' : 'Try searching another name or phone')
                    : (isHindi ? 'सभी ग्राहकों का पूरा भुगतान प्राप्त हो चुका है।' : 'All sales invoices are fully paid.')}
                </p>
              </div>
            ) : (
              filteredDueInvoices.map((inv) => {
                const customerPhone = (inv.customerPhone || '').trim();
                const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
                const hasValidPhone = cleanPhone.length >= 10;
                const itemsSummary = Array.isArray(inv.items) && inv.items.length > 0
                  ? inv.items.map((it) => `${it.name} (${it.quantity || 1})`).join(', ')
                  : (inv.product ? `${inv.product} (${inv.quantity || 1})` : '');

                return (
                  <div
                    key={inv.id}
                    className={`m3-purchase-item-card ${inv.isOverdue7Days ? 'overdue-border' : ''} animate-fade-in`}
                  >
                    {/* Top Row: Customer info & Bill identifier */}
                    <div className="m3-p-card-top">
                      <div className="flex items-start gap-2.5">
                        <div className="m3-sup-avatar-circle" style={{ background: inv.isOverdue7Days ? '#fee2e2' : '#e0e7ff', color: inv.isOverdue7Days ? '#b91c1c' : '#4338ca' }}>
                          <User size={15} />
                        </div>
                        <div>
                          <h4 className="m3-p-sup-name font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {inv.customerName || (isHindi ? 'ग्राहक (अज्ञात)' : 'Customer')}
                            {inv.isOverdue7Days && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold border border-rose-300">
                                {isHindi ? '7+ दिन बकाया' : '>7 Days Overdue'}
                              </span>
                            )}
                          </h4>
                          {hasValidPhone ? (
                            <span className="m3-p-sup-contact text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone size={11} className="text-slate-400" /> {customerPhone}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {isHindi ? 'फ़ोन नंबर उपलब्ध नहीं' : 'No phone number'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="m3-p-bill-num">
                          #{inv.invoiceNumber || inv.id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {inv.date || 'हालिया'} • {inv.ageDays === 0 ? (isHindi ? 'आज' : 'Today') : `${inv.ageDays} ${isHindi ? 'दिन पुराना' : 'd ago'}`}
                        </span>
                      </div>
                    </div>

                    {/* Product Summary Row if available */}
                    {itemsSummary && (
                      <div className="m3-p-product-info-bar mt-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                          🛒 <strong className="text-slate-700 dark:text-slate-300">{isHindi ? 'सामान: ' : 'Items: '}</strong>
                          {itemsSummary}
                        </span>
                      </div>
                    )}

                    {/* Financial Numbers Bar (Total Bill, Paid, Due Amount) */}
                    <div className="m3-p-finances-grid mt-2.5">
                      <div className="m3-fin-col">
                        <span className="lbl">{isHindi ? 'कुल बिल (Total)' : 'Total Bill'}</span>
                        <span className="val text-slate-800 dark:text-slate-200">
                          {currency}{Number(inv.grandTotal).toLocaleString()}
                        </span>
                      </div>

                      <div className="m3-fin-col">
                        <span className="lbl">{isHindi ? 'प्राप्त (Paid)' : 'Paid'}</span>
                        <span className="val text-emerald-600 dark:text-emerald-400">
                          {currency}{Number(inv.paidAmount).toLocaleString()}
                        </span>
                      </div>

                      <div className="m3-fin-col highlighted">
                        <span className="lbl">{isHindi ? 'कुल बकाया (Due)' : 'Balance Due'}</span>
                        <span className="val text-rose-600 dark:text-rose-400 font-black">
                          {currency}{Number(inv.dueAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons: Call, WhatsApp, Receive Payment & PDF */}
                    <div className="m3-p-card-bottom mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Direct Call Button (User Request) */}
                        {hasValidPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="m3-contact-btn call m3-ripple"
                            title={isHindi ? 'ग्राहक को कॉल करें' : 'Call Customer'}
                          >
                            <Phone size={13} />
                            <span>{isHindi ? 'कॉल करें' : 'Call'}</span>
                          </a>
                        )}

                        {/* Direct WhatsApp Reminder Button (User Request) */}
                        {hasValidPhone && (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppDueReminder(inv)}
                            className="m3-contact-btn whatsapp m3-ripple"
                            title={isHindi ? 'व्हाट्सएप पर तगादा / रिमाइंडर भेजें' : 'Send WhatsApp Reminder'}
                          >
                            <MessageSquare size={13} />
                            <span>{isHindi ? 'व्हाट्सएप तगादा' : 'WhatsApp'}</span>
                          </button>
                        )}

                        {!hasValidPhone && (
                          <span className="text-[11px] text-slate-400 italic">
                            {isHindi ? 'तगादा के लिए फ़ोन नंबर दर्ज नहीं है' : 'No phone to call/WhatsApp'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Receive Payment Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenCustomerPaymentModal(inv)}
                          className="m3-pay-now-btn due-collect-btn m3-ripple"
                        >
                          <CheckCircle2 size={13} />
                          <span>{isHindi ? 'भुगतान दर्ज करें' : 'Receive Pay'}</span>
                        </button>

                        {/* PDF Receipt Button */}
                        <button
                          type="button"
                          onClick={() => generateInvoicePDF(inv, user)}
                          className="m3-del-icon-btn pdf-btn"
                          title={isHindi ? 'बिल PDF डाउनलोड करें' : 'Download Invoice PDF'}
                        >
                          <Download size={13} />
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

      {/* ========================================================= */}
      {/* MODAL 3: RECORD CUSTOMER DUE PAYMENT DIALOG               */}
      {/* ========================================================= */}
      {activeCustomerPaymentInvoice && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setActiveCustomerPaymentInvoice(null)}>
          <div
            className="m3-modal-sheet-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="m3-dialog-header-enhanced">
              <div className="flex items-center gap-3">
                <div className="m3-dialog-icon-pill emerald">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="m3-dialog-title">
                    {isHindi ? 'ग्राहक से बकाया भुगतान प्राप्त करें' : 'Receive Customer Due Payment'}
                  </h3>
                  <p className="m3-dialog-subtitle">
                    {isHindi ? 'उधारी खाते में भुगतान जमा करें' : 'Settle customer balance dues'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomerPaymentInvoice(null)}
                className="m3-dialog-close-circle"
                title={isHindi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCustomerPayment} className="m3-dialog-body-scroll">
              {customerPaySuccessMsg && (
                <div className="m3-alert-banner success animate-fade-in">
                  <CheckCircle2 size={16} />
                  <span>{customerPaySuccessMsg}</span>
                </div>
              )}

              {/* Customer & Due Spotlight Card */}
              <div className="m3-modal-ledger-summary-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="m3-modal-sup-tag">{isHindi ? 'ग्राहक खाता' : 'Customer Account'}</span>
                    <h4 className="m3-modal-sup-name">{activeCustomerPaymentInvoice.customerName || (isHindi ? 'ग्राहक' : 'Customer')}</h4>
                    {activeCustomerPaymentInvoice.customerPhone && (
                      <span className="m3-modal-sup-phone">
                        <Phone size={11} /> {activeCustomerPaymentInvoice.customerPhone}
                      </span>
                    )}
                  </div>
                  <span className="m3-modal-bill-badge">
                    #{activeCustomerPaymentInvoice.invoiceNumber || activeCustomerPaymentInvoice.id}
                  </span>
                </div>

                <div className="m3-modal-ledger-grid mt-3">
                  <div className="m3-modal-stat-box">
                    <span className="lbl">{isHindi ? 'कुल बिल' : 'Total Bill'}</span>
                    <span className="val">{currency}{Number(activeCustomerPaymentInvoice.grandTotal).toLocaleString()}</span>
                  </div>
                  <div className="m3-modal-stat-box">
                    <span className="lbl">{isHindi ? 'प्राप्त' : 'Already Paid'}</span>
                    <span className="val text-emerald-600">{currency}{Number(activeCustomerPaymentInvoice.paidAmount).toLocaleString()}</span>
                  </div>
                  <div className="m3-modal-stat-box due">
                    <span className="lbl">{isHindi ? 'कुल बाकी' : 'Balance Due'}</span>
                    <span className="val text-rose-600 font-extrabold">{currency}{Number(activeCustomerPaymentInvoice.dueAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="m3-form-field-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="m3-field-label m-0">
                    {isHindi ? 'प्राप्त की जा रही राशि (Received Amount) *' : 'Received Amount *'}
                  </label>
                  <span className="text-xs text-rose-600 font-bold">
                    {isHindi ? 'बाकी बकाया: ' : 'Due: '}{currency}{Number(activeCustomerPaymentInvoice.dueAmount).toLocaleString()}
                  </span>
                </div>
                <div className="m3-amount-input-box">
                  <span className="m3-input-prefix">{currency}</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={activeCustomerPaymentInvoice.dueAmount}
                    value={customerPayAmount}
                    onChange={(e) => setCustomerPayAmount(e.target.value)}
                    placeholder="0"
                    className="m3-enhanced-input"
                  />
                </div>

                {/* Quick Fill Chips */}
                <div className="m3-quick-pills-row mt-2">
                  <button
                    type="button"
                    onClick={() => setCustomerPayAmount(String(activeCustomerPaymentInvoice.dueAmount))}
                    className="m3-quick-fill-chip active"
                  >
                    ✓ {isHindi ? 'पूरा भरें' : 'Pay Full'} ({currency}{Number(activeCustomerPaymentInvoice.dueAmount).toLocaleString()})
                  </button>
                  {activeCustomerPaymentInvoice.dueAmount > 100 && (
                    <button
                      type="button"
                      onClick={() => setCustomerPayAmount(String(Math.round(activeCustomerPaymentInvoice.dueAmount / 2)))}
                      className="m3-quick-fill-chip"
                    >
                      {isHindi ? '50% (आधा)' : '50% (Half)'} ({currency}{Math.round(activeCustomerPaymentInvoice.dueAmount / 2).toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Mode (Cash, UPI, Card, Cheque) */}
              <div className="m3-form-field-group">
                <label className="m3-field-label">
                  {isHindi ? 'भुगतान माध्यम (Payment Method)' : 'Payment Method'}
                </label>
                <div className="m3-mode-selection-grid">
                  {['cash', 'upi', 'card', 'cheque'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCustomerPayMethod(mode)}
                      className={`m3-mode-select-btn ${customerPayMethod === mode ? 'selected' : ''}`}
                    >
                      <span>{formatPayModeBadge(mode, isHindi)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="m3-form-field-group">
                <label className="m3-field-label">
                  {isHindi ? 'नोट्स / टिप्पणी (वैकल्पिक)' : 'Notes / Remarks (Optional)'}
                </label>
                <input
                  type="text"
                  value={customerPayNotes}
                  onChange={(e) => setCustomerPayNotes(e.target.value)}
                  placeholder={isHindi ? 'जैसे: नकद दिया या ऑनलाइन ट्रांसफर' : 'e.g. Paid in cash or online'}
                  className="m3-enhanced-input text-field-only"
                />
              </div>

              {/* Action Buttons */}
              <div className="m3-dialog-actions-row">
                <button
                  type="button"
                  onClick={() => setActiveCustomerPaymentInvoice(null)}
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
    </div>
  );
}
