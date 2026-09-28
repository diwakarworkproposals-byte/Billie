import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Bot,
  User,
  Check,
  ArrowRight,
  RefreshCw,
  FileText,
  CornerDownLeft,
  PlusCircle,
  Package,
  ShieldCheck,
  BarChart3,
  Users,
  UserPlus,
  Phone,
  Building,
  CheckCircle2,
  Search,
  X,
  CreditCard
} from 'lucide-react';
import InvoiceCard from './InvoiceCard';
import StockReportCard from './StockReportCard';
import ReportingSection from './ReportingSection';
import { useApp } from '../context/AppContext';
import {
  isInvoiceIntent,
  isAddStockIntent,
  isCheckStockIntent,
  isReportingIntent,
  detectReportType,
  extractProductFromStockQuery,
  parseStockUpdateCommand,
  detectLanguage,
  isAffirmative,
  isNegative,
  parseOneShotInvoice,
  calculateInvoiceTotals,
  extractNumber,
  PROMPTS
} from '../utils/invoiceParser';
import { speakText } from '../utils/speechRecognition';

// Conversation step enums
const STEPS = {
  IDLE: 'IDLE',
  // Billing Flow
  SELECT_CUSTOMER_TYPE: 'SELECT_CUSTOMER_TYPE',
  PICK_EXISTING_CUSTOMER: 'PICK_EXISTING_CUSTOMER',
  ASK_CUSTOMER: 'ASK_CUSTOMER',
  ASK_CUSTOMER_PHONE_GST: 'ASK_CUSTOMER_PHONE_GST',
  ASK_PRODUCT: 'ASK_PRODUCT',
  ASK_QUANTITY: 'ASK_QUANTITY',
  ASK_PRICE: 'ASK_PRICE',
  ASK_MORE_ITEMS: 'ASK_MORE_ITEMS',
  ASK_DISCOUNT: 'ASK_DISCOUNT',
  ASK_PAYMENT_MODE: 'ASK_PAYMENT_MODE',
  COMPLETED: 'COMPLETED',

  // Stock Management Flow
  STOCK_ASK_PRODUCT: 'STOCK_ASK_PRODUCT',
  STOCK_ASK_QUANTITY: 'STOCK_ASK_QUANTITY',
  STOCK_ASK_COST_PRICE: 'STOCK_ASK_COST_PRICE',
  STOCK_ASK_PRICE: 'STOCK_ASK_PRICE',
  STOCK_ASK_MORE: 'STOCK_ASK_MORE'
};

export default function InvoiceWizard({
  externalQuery,
  onPromptHintChange,
  onResetExternalQuery,
  onOpenInventory,
  onOpenAdmin,
  onOpenReporting,
  onOpenCustomers,
  activeCustomerForBill
}) {
  const {
    user,
    settings,
    inventory,
    customers = [],
    addInvoice,
    getNextInvoiceNumber,
    setLanguage,
    isVoiceSessionActive,
    setIsVoiceSessionActive,
    addOrUpdateStock,
    updateProduct
  } = useApp();

  // Active language
  const [lang, setLang] = useState(settings.language || 'hi');
  const [step, setStep] = useState(STEPS.IDLE);

  const [messages, setMessages] = useState([
    {
      sender: 'billie',
      text: PROMPTS[settings.language || 'hi'].welcome,
      timestamp: new Date()
    }
  ]);

  // Invoice drafting state
  const [draftCustomer, setDraftCustomer] = useState('');
  const [draftCustomerDetails, setDraftCustomerDetails] = useState({
    name: '',
    companyName: '',
    phone: '',
    gstNumber: '',
    address: ''
  });
  const draftCustomerDetailsRef = useRef({
    name: '',
    companyName: '',
    phone: '',
    gstNumber: '',
    address: ''
  });

  const [draftItems, setDraftItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    quantity: 1,
    price: 0
  });
  const currentItemRef = useRef({
    name: '',
    quantity: 1,
    price: 0
  });
  const [finalInvoice, setFinalInvoice] = useState(null);
  const draftDiscountRef = useRef({ discount: 0, discountType: 'percent' });
  const draftPaymentModeRef = useRef('cash');

  // Search query for picking existing customer during billing
  const [existingCustSearch, setExistingCustSearch] = useState('');

  const filteredExistingCustomers = useMemo(() => {
    if (!existingCustSearch.trim()) return customers;
    const q = existingCustSearch.toLowerCase().trim();
    return customers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const company = (c.companyName || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const gst = (c.gstNumber || '').toLowerCase();
      return name.includes(q) || company.includes(q) || phone.includes(q) || gst.includes(q);
    });
  }, [customers, existingCustSearch]);

  // Stock drafting state
  const [draftStockItem, setDraftStockItem] = useState({
    name: '',
    quantity: 1,
    price: 0
  });
  const draftStockRef = useRef({ name: '', quantity: 1, price: 0 });

  // Home page active stock report card
  const [activeStockReport, setActiveStockReport] = useState(null);

  // Home page active reporting & accounting section
  const [activeReporting, setActiveReporting] = useState(null); // { mode: 'sales' | 'purchase' }

  const messagesEndRef = useRef(null);

  // Sync lang with settings
  useEffect(() => {
    if (settings.language) {
      setLang(settings.language);
    }
  }, [settings.language]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, finalInvoice, activeStockReport, activeReporting]);

  // Handle incoming query from the bottom search bar (text or voice)
  useEffect(() => {
    if (!externalQuery) return;
    handleUserMessage(externalQuery);
    if (onResetExternalQuery) onResetExternalQuery();
  }, [externalQuery]);

  // Handle incoming selected customer from Customers Directory
  useEffect(() => {
    if (!activeCustomerForBill) return;
    const cust = activeCustomerForBill;
    draftCustomerDetailsRef.current = {
      name: cust.name,
      companyName: cust.companyName || '',
      phone: cust.phone || '',
      gstNumber: cust.gstNumber || '',
      address: cust.address || ''
    };
    setDraftCustomerDetails(draftCustomerDetailsRef.current);
    setDraftCustomer(cust.name);
    setDraftItems([]);
    currentItemRef.current = { name: '', quantity: 1, price: 0 };
    setCurrentItem({ name: '', quantity: 1, price: 0 });
    setFinalInvoice(null);
    setActiveStockReport(null);
    setActiveReporting(null);
    setStep(STEPS.ASK_PRODUCT);
    setIsVoiceSessionActive(true);
    const p = PROMPTS[lang] || PROMPTS.hi;
    const reply =
      lang === 'hi'
        ? `बढ़िया, ${cust.name} के लिए बिल बनाते हैं! ${p.ask_product}`
        : `Great, billing for ${cust.name}! ${p.ask_product}`;
    replyBillie(reply, lang);
  }, [activeCustomerForBill]);

  // Update prompt hint based on current step and active language
  useEffect(() => {
    const p = PROMPTS[lang] || PROMPTS.hi;
    let hint = p.hints.idle;

    switch (step) {
      case STEPS.SELECT_CUSTOMER_TYPE:
        hint = p.hints.customer_type;
        break;
      case STEPS.PICK_EXISTING_CUSTOMER:
        hint = p.hints.existing_customer;
        break;
      case STEPS.ASK_CUSTOMER:
        hint = p.hints.customer;
        break;
      case STEPS.ASK_CUSTOMER_PHONE_GST:
        hint = p.hints.customer_phone_gst;
        break;
      case STEPS.ASK_PRODUCT:
        hint = p.hints.product;
        break;
      case STEPS.ASK_QUANTITY:
        hint = p.hints.quantity;
        break;
      case STEPS.ASK_PRICE:
        hint = p.hints.price;
        break;
      case STEPS.ASK_MORE_ITEMS:
        hint = p.hints.more_items;
        break;
      case STEPS.ASK_DISCOUNT:
        hint = p.hints.discount;
        break;
      case STEPS.ASK_PAYMENT_MODE:
        hint = p.hints.payment_mode;
        break;
      case STEPS.STOCK_ASK_PRODUCT:
        hint = p.hints.stock_product;
        break;
      case STEPS.STOCK_ASK_QUANTITY:
        hint = p.hints.stock_qty;
        break;
      case STEPS.STOCK_ASK_COST_PRICE:
        hint = p.hints.stock_cost;
        break;
      case STEPS.STOCK_ASK_PRICE:
        hint = p.hints.stock_price;
        break;
      case STEPS.STOCK_ASK_MORE:
        hint = p.hints.more_items;
        break;
      default:
        hint = p.hints.idle;
    }

    if (onPromptHintChange) {
      onPromptHintChange(hint);
    }
  }, [step, lang, onPromptHintChange]);

  const replyBillie = (text, targetLang = lang, onEndCallback = null) => {
    setMessages((prev) => [
      ...prev,
      { sender: 'billie', text, timestamp: new Date() }
    ]);
    if (settings.voiceFeedback) {
      speakText(text, targetLang, onEndCallback);
    } else {
      if (onEndCallback) onEndCallback();
      // Even if TTS audio is muted, signal speech end so hands-free mic opens automatically
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('billie-tts-end'));
      }, 250);
    }
  };

  // Complete and finalize the invoice
  const finalizeInvoice = (
    customerName,
    itemsList,
    discountVal = 0,
    discountType = 'percent',
    chosenLang = lang,
    chosenPaymentMode = 'cash'
  ) => {
    const totals = calculateInvoiceTotals(
      itemsList,
      settings.defaultTaxRate || 0,
      discountVal,
      discountType
    );
    const invoiceNum = getNextInvoiceNumber();
    const currency = settings.currency || '₹';

    const custName = customerName || draftCustomerDetailsRef.current.name || (chosenLang === 'hi' ? 'सम्मानित ग्राहक' : 'Valued Customer');
    const custCompany = draftCustomerDetailsRef.current.companyName || '';
    const custPhone = draftCustomerDetailsRef.current.phone || '';
    const custGst = draftCustomerDetailsRef.current.gstNumber || '';
    const custAddress = draftCustomerDetailsRef.current.address || '';

    const completeInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerName: custName,
      customerCompany: custCompany,
      customerPhone: custPhone,
      customerGst: custGst,
      customerAddress: custAddress,
      paymentMode: chosenPaymentMode || 'cash',
      paymentMethod: chosenPaymentMode || 'cash',
      rawDate: new Date().toISOString(),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dueDate: chosenLang === 'hi' ? 'तुरंत देय (Due on Receipt)' : 'Due on Receipt',
      product: itemsList.length > 0 ? itemsList.map((i) => i.name).join(', ') : 'Standard Service',
      quantity: itemsList.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0),
      price: itemsList[0]?.price || 0,
      discount: totals.discount,
      discountType: totals.discountType,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalDiscount: totals.totalDiscount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.grandTotal,
      grandTotal: totals.grandTotal,
      currency: currency,
      items: totals.items
    };

    setFinalInvoice(completeInvoice);
    addInvoice(completeInvoice);
    setStep(STEPS.COMPLETED);

    const p = PROMPTS[chosenLang] || PROMPTS.hi;
    const discLabel = totals.discountType === 'percent' && totals.discount > 0 ? `${totals.discount}%` : '';
    const msg = p.invoice_ready(
      invoiceNum,
      completeInvoice.customerName,
      totals.subtotal.toFixed(2),
      totals.totalDiscount.toFixed(2),
      totals.grandTotal.toFixed(2),
      currency,
      discLabel
    );

    // Final message spoken -> task is finished, turn off hands-free voice!
    replyBillie(msg, chosenLang, () => {
      setIsVoiceSessionActive(false);
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.75 }
      });
    } catch {
      // safe fallback
    }
  };

  const handleUserMessage = (userText) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    // Detect if this message was in Hindi or English
    const detected = detectLanguage(trimmed);
    let activeLang = lang;
    if (isInvoiceIntent(trimmed) || isAddStockIntent(trimmed) || isCheckStockIntent(trimmed)) {
      activeLang = detected;
      setLang(detected);
      setLanguage(detected);
    }

    const p = PROMPTS[activeLang] || PROMPTS.hi;

    // Append user message
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: trimmed, timestamp: new Date() }
    ]);

    // Check reset / cancel
    const norm = trimmed.toLowerCase();
    if (['reset', 'cancel', 'band karo', 'radd karo', 'chhodo', 'stop', 'chup', 'bas karo'].includes(norm)) {
      resetWizard();
      setIsVoiceSessionActive(false);
      replyBillie(p.cancelled, activeLang);
      return;
    }

    // Check admin portal trigger (voice or text)
    if (
      ['admin', 'admin portal', 'admin dashboard', 'open admin', 'admin panel', 'एडमिन', 'एडमिन पोर्टल', 'एडमिन डैशबोर्ड', 'subscription', 'manage subscription'].some(
        (k) => norm === k || norm.includes(k)
      )
    ) {
      if (onOpenAdmin) onOpenAdmin();
      replyBillie(
        activeLang === 'hi'
          ? 'एडमिन डैशबोर्ड खोल दिया गया है। यहाँ से आप नए यूजर क्रेडेंशियल्स (आईडी, पासवर्ड) बना सकते हैं और ₹999/माह या ₹4,999/6 माह सब्सक्रिप्शन मैनेज कर सकते हैं।'
          : 'Opening Admin Dashboard. You can provision users, create ID/passwords, and manage ₹999/mo or ₹4,999/6mo subscriptions here.',
        activeLang,
        () => setIsVoiceSessionActive(false)
      );
      return;
    }

    // -------------------------------------------------------------
    // FLOW 3: "check stock" or "stock dikhao" -> Show Card & Report
    // -------------------------------------------------------------
    if (isCheckStockIntent(trimmed)) {
      const prodName = extractProductFromStockQuery(trimmed);
      let replyText = '';

      if (prodName) {
        const found = inventory.find((i) =>
          i.name.toLowerCase().includes(prodName.toLowerCase())
        );
        if (found) {
          replyText = p.stock_report_single(found.name, found.quantity);
          setActiveStockReport({ filteredProduct: found.name });
        } else {
          replyText =
            activeLang === 'hi'
              ? `"${prodName}" का स्टॉक इन्वेंटरी में नहीं मिला। आप 'stock add karo' बोलकर नया स्टॉक जोड़ सकते हैं।`
              : `"${prodName}" was not found in inventory. You can say 'add stock' to add it.`;
          setActiveStockReport({ filteredProduct: '' });
        }
      } else {
        replyText = p.stock_report_all(inventory.length);
        setActiveStockReport({ filteredProduct: '' });
      }

      setStep(STEPS.IDLE);
      // Hands-free continuous listening: Keep mic open so user can ask next query!
      setIsVoiceSessionActive(true);
      replyBillie(replyText, activeLang);
      return;
    }

    // -------------------------------------------------------------
    // DIRECT STOCK EDIT BY VOICE: e.g. "Jeans ka stock 20 kar do"
    // -------------------------------------------------------------
    const stockUpdateCmd = parseStockUpdateCommand(trimmed, inventory);
    if (stockUpdateCmd) {
      const { product, quantity, isAddition } = stockUpdateCmd;
      const newQty = isAddition ? (product.quantity + quantity) : quantity;
      updateProduct(product.id, { quantity: newQty });
      setActiveStockReport({ filteredProduct: product.name });
      setStep(STEPS.IDLE);
      setIsVoiceSessionActive(true);
      const msg = p.stock_updated(product.name, newQty);
      replyBillie(msg, activeLang);
      return;
    }

    // -------------------------------------------------------------
    // FLOW: "report", "sales report", "purchase report", "accounting"
    // -------------------------------------------------------------
    if (isReportingIntent(trimmed) && (step === STEPS.IDLE || step === STEPS.COMPLETED)) {
      const mode = detectReportType(trimmed); // 'sales' or 'purchase'
      setActiveReporting({ mode });
      setActiveStockReport(null);
      setFinalInvoice(null);
      setStep(STEPS.IDLE);

      const replyText =
        activeLang === 'hi'
          ? (mode === 'purchase'
              ? 'यहाँ आपकी सप्लायर खरीददारी व अकाउंटिंग (Purchase Ledger) की रिपोर्ट है। आप ऊपर दिए गए बटनों से आसानी से Sales और Purchase स्विच कर सकते हैं।'
              : 'यहाँ आपकी दैनिक बिक्री व मुनाफ़ा (Sales & Profit) की रिपोर्ट है। आप ऊपर दिए गए बटनों से आसानी से Sales और Purchase स्विच कर सकते हैं।')
          : (mode === 'purchase'
              ? 'Here is your Supplier Purchase & Accounting Ledger report. You can switch between Sales and Purchase using the tabs above.'
              : 'Here is your Daily Sales & Net Profit report. You can switch between Sales and Purchase using the tabs above.');

      setIsVoiceSessionActive(false);
      replyBillie(replyText, activeLang);
      return;
    }

    // -------------------------------------------------------------
    // FLOW 1: "stock add karo" or "add stock" -> Conversational Add
    // -------------------------------------------------------------
    if (isAddStockIntent(trimmed) && (step === STEPS.IDLE || step === STEPS.COMPLETED)) {
      setFinalInvoice(null);
      setActiveReporting(null);
      draftStockRef.current = { name: '', quantity: 1, price: 0 };
      setDraftStockItem({ name: '', quantity: 1, price: 0 });
      setStep(STEPS.STOCK_ASK_PRODUCT);
      setIsVoiceSessionActive(true);
      replyBillie(p.stock_ask_product, activeLang);
      return;
    }

    // -------------------------------------------------------------
    // BILLING: One-Shot Invoice Check
    // -------------------------------------------------------------
    const oneShot = parseOneShotInvoice(trimmed);
    if (oneShot.hasFullDetails) {
      if (oneShot.customerName) {
        const matched = customers.find(
          (c) =>
            c.name.toLowerCase() === oneShot.customerName.toLowerCase() ||
            (c.companyName && c.companyName.toLowerCase() === oneShot.customerName.toLowerCase())
        );
        if (matched) {
          draftCustomerDetailsRef.current = {
            name: matched.name,
            companyName: matched.companyName || '',
            phone: matched.phone || '',
            gstNumber: matched.gstNumber || '',
            address: matched.address || ''
          };
          setDraftCustomerDetails(draftCustomerDetailsRef.current);
        } else {
          draftCustomerDetailsRef.current = {
            name: oneShot.customerName,
            companyName: '',
            phone: '',
            gstNumber: '',
            address: ''
          };
          setDraftCustomerDetails(draftCustomerDetailsRef.current);
        }
      }

      finalizeInvoice(
        oneShot.customerName,
        [
          {
            name: oneShot.product,
            quantity: oneShot.quantity,
            price: oneShot.price,
            discount: oneShot.discount,
            discountType: oneShot.discountType
          }
        ],
        oneShot.discount,
        oneShot.discountType,
        activeLang,
        oneShot.paymentMode || 'cash'
      );
      return;
    }

    // -------------------------------------------------------------
    // BILLING: Start Invoice from IDLE or explicit intent
    // -------------------------------------------------------------
    const isExplicitRestart =
      norm.includes('naya bill') ||
      norm.includes('new bill') ||
      norm.includes('start again') ||
      norm.includes('naya bill banao') ||
      norm.includes('restart');

    if (step === STEPS.IDLE || step === STEPS.COMPLETED || isExplicitRestart) {
      if (isInvoiceIntent(trimmed) || isExplicitRestart) {
        setDraftCustomer(oneShot.customerName || '');
        setDraftCustomerDetails({
          name: oneShot.customerName || '',
          companyName: '',
          phone: '',
          gstNumber: '',
          address: ''
        });
        draftCustomerDetailsRef.current = {
          name: oneShot.customerName || '',
          companyName: '',
          phone: '',
          gstNumber: '',
          address: ''
        };
        setDraftItems([]);
        currentItemRef.current = { name: '', quantity: 1, price: 0 };
        setCurrentItem({ name: '', quantity: 1, price: 0 });
        setFinalInvoice(null);
        setActiveStockReport(null);
        setIsVoiceSessionActive(true);

        if (oneShot.customerName) {
          const matched = customers.find(
            (c) =>
              c.name.toLowerCase() === oneShot.customerName.toLowerCase() ||
              (c.companyName && c.companyName.toLowerCase() === oneShot.customerName.toLowerCase())
          );
          if (matched) {
            draftCustomerDetailsRef.current = {
              name: matched.name,
              companyName: matched.companyName || '',
              phone: matched.phone || '',
              gstNumber: matched.gstNumber || '',
              address: matched.address || ''
            };
            setDraftCustomerDetails(draftCustomerDetailsRef.current);
          }
          setStep(STEPS.ASK_PRODUCT);
          const reply =
            activeLang === 'hi'
              ? `ठीक है, ${oneShot.customerName} के लिए बिल बनाते हैं! ${p.ask_product}`
              : `Got it, invoicing for ${oneShot.customerName}! ${p.ask_product}`;
          replyBillie(reply, activeLang);
        } else {
          // Present 2 choices: New Customer or Existing Customer
          setStep(STEPS.SELECT_CUSTOMER_TYPE);
          replyBillie(p.ask_customer_type, activeLang);
        }
        return;
      }
    }

    // -------------------------------------------------------------
    // ACTIVE STEP-BY-STEP CONVERSATIONAL ROUTER
    // -------------------------------------------------------------
    switch (step) {
      // ----------------- BILLING STEPS -----------------
      case STEPS.SELECT_CUSTOMER_TYPE: {
        const norm = trimmed.toLowerCase();
        if (
          norm.includes('purana') ||
          norm.includes('existing') ||
          norm.includes('old') ||
          norm.includes('maujuda') ||
          norm.includes('पुराना') ||
          norm.includes('मौजूदा')
        ) {
          setExistingCustSearch('');
          setStep(STEPS.PICK_EXISTING_CUSTOMER);
          replyBillie(p.ask_existing_customer, activeLang);
        } else if (norm.includes('naya') || norm.includes('new') || norm.includes('नया')) {
          setStep(STEPS.ASK_CUSTOMER);
          replyBillie(p.ask_customer, activeLang);
        } else {
          // Check if user directly said an existing customer name or phone
          const cleanNum = trimmed.replace(/\D/g, '');
          const matched = customers.find((c) => {
            if (cleanNum && cleanNum.length >= 6 && c.phone && c.phone.replace(/\D/g, '').includes(cleanNum)) {
              return true;
            }
            return (
              c.name.toLowerCase() === trimmed.toLowerCase() ||
              (c.companyName && c.companyName.toLowerCase() === trimmed.toLowerCase())
            );
          });

          if (matched) {
            setDraftCustomer(matched.name);
            draftCustomerDetailsRef.current = {
              name: matched.name,
              companyName: matched.companyName || '',
              phone: matched.phone || '',
              gstNumber: matched.gstNumber || '',
              address: matched.address || ''
            };
            setDraftCustomerDetails(draftCustomerDetailsRef.current);
            setStep(STEPS.ASK_PRODUCT);
            replyBillie(
              activeLang === 'hi'
                ? `✓ ग्राहक "${matched.name}" की डिटेल्स लोड हो गई हैं! ${p.ask_product}`
                : `✓ Customer "${matched.name}" details loaded! ${p.ask_product}`,
              activeLang
            );
          } else {
            // Treat as new customer name
            const cleanedCustomer = trimmed
              .replace(/^(customer\s*name\s*is|customer\s*is|naam\s*hai|for|kiske\s*liye)\s+/i, '')
              .trim();
            setDraftCustomer(cleanedCustomer);
            draftCustomerDetailsRef.current = {
              name: cleanedCustomer,
              companyName: '',
              phone: '',
              gstNumber: '',
              address: ''
            };
            setDraftCustomerDetails(draftCustomerDetailsRef.current);
            setStep(STEPS.ASK_CUSTOMER_PHONE_GST);
            replyBillie(p.ask_customer_phone_gst, activeLang);
          }
        }
        break;
      }

      case STEPS.PICK_EXISTING_CUSTOMER: {
        const cleanNum = trimmed.replace(/\D/g, '');
        const matched = customers.find((c) => {
          if (cleanNum && cleanNum.length >= 6 && c.phone && c.phone.replace(/\D/g, '').includes(cleanNum)) {
            return true;
          }
          return (
            c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            (c.companyName && c.companyName.toLowerCase().includes(trimmed.toLowerCase()))
          );
        });

        if (matched) {
          setDraftCustomer(matched.name);
          draftCustomerDetailsRef.current = {
            name: matched.name,
            companyName: matched.companyName || '',
            phone: matched.phone || '',
            gstNumber: matched.gstNumber || '',
            address: matched.address || ''
          };
          setDraftCustomerDetails(draftCustomerDetailsRef.current);
          setExistingCustSearch('');
          setStep(STEPS.ASK_PRODUCT);
          replyBillie(
            activeLang === 'hi'
              ? `✓ ग्राहक "${matched.name}" की डिटेल्स लोड हो गई हैं! ${p.ask_product}`
              : `✓ Customer "${matched.name}" details loaded! ${p.ask_product}`,
            activeLang
          );
        } else {
          replyBillie(
            activeLang === 'hi'
              ? `माफ़ कीजिये, "${trimmed}" नाम या नंबर का कोई पुराना ग्राहक नहीं मिला। कृपया नीचे दी गई सूची से ग्राहक चुनें या 'नया ग्राहक' बोलें:`
              : `Sorry, no customer found matching "${trimmed}". Please select from the list below or say 'new customer':`,
            activeLang
          );
        }
        break;
      }

      case STEPS.ASK_CUSTOMER: {
        const cleanedCustomer = trimmed
          .replace(/^(customer\s*name\s*is|customer\s*is|naam\s*hai|for|kiske\s*liye)\s+/i, '')
          .trim();
        setDraftCustomer(cleanedCustomer);
        draftCustomerDetailsRef.current = {
          name: cleanedCustomer,
          companyName: '',
          phone: '',
          gstNumber: '',
          address: ''
        };
        setDraftCustomerDetails(draftCustomerDetailsRef.current);
        setStep(STEPS.ASK_CUSTOMER_PHONE_GST);
        replyBillie(p.ask_customer_phone_gst, activeLang);
        break;
      }

      case STEPS.ASK_CUSTOMER_PHONE_GST: {
        const norm = trimmed.toLowerCase();
        if (
          ['skip', 'chhod do', 'chhodo', 'nahi', 'no', 'aage', 'next', 'aage badho', 'skip karo', 'na', 'kuch nahi'].includes(norm)
        ) {
          setStep(STEPS.ASK_PRODUCT);
          replyBillie(
            activeLang === 'hi'
              ? `ठीक है! ${p.ask_product}`
              : `Got it! ${p.ask_product}`,
            activeLang
          );
        } else {
          const phoneMatch = trimmed.match(/(?:\+91|0)?[6-9]\d{9}/);
          if (phoneMatch) {
            draftCustomerDetailsRef.current.phone = phoneMatch[0];
          }
          const gstMatch = trimmed.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/i);
          if (gstMatch) {
            draftCustomerDetailsRef.current.gstNumber = gstMatch[0].toUpperCase();
          } else if (!phoneMatch && trimmed.length >= 8 && /\d/.test(trimmed)) {
            const digits = trimmed.replace(/\D/g, '');
            if (digits.length >= 8) {
              draftCustomerDetailsRef.current.phone = digits;
            }
          }
          setDraftCustomerDetails({ ...draftCustomerDetailsRef.current });
          setStep(STEPS.ASK_PRODUCT);
          replyBillie(
            activeLang === 'hi'
              ? `✓ ग्राहक विवरण नोट हो गया! ${p.ask_product}`
              : `✓ Customer details recorded! ${p.ask_product}`,
            activeLang
          );
        }
        break;
      }

      case STEPS.ASK_PRODUCT: {
        const prod = trimmed.replace(/^(product\s*is|item\s*is|service\s*is)\s+/i, '').trim();
        const leadingQtyMatch = prod.match(/^(\d+|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|ek|do|teen|char|chaar|panch|paanch|chhe|saat|aath|nau|das)\s*(?:x|units?|pieces?|pcs?|nag|piece)?\s+([A-Za-z\u0900-\u097F\s-]+)$/i);

        if (leadingQtyMatch) {
          const qty = extractNumber(leadingQtyMatch[1], 1);
          const cleanProdName = leadingQtyMatch[2].trim();
          currentItemRef.current = { name: cleanProdName, quantity: qty, price: 0 };
          setCurrentItem({ name: cleanProdName, quantity: qty, price: 0 });
          setStep(STEPS.ASK_PRICE);
          replyBillie(p.ask_price(cleanProdName), activeLang);
          break;
        }

        currentItemRef.current = { name: prod, quantity: 1, price: 0 };
        setCurrentItem((prev) => ({ ...prev, name: prod }));
        setStep(STEPS.ASK_QUANTITY);
        replyBillie(p.ask_quantity(prod), activeLang);
        break;
      }

      case STEPS.ASK_QUANTITY: {
        const qty = extractNumber(trimmed, 1);
        currentItemRef.current.quantity = qty;
        setCurrentItem((prev) => ({ ...prev, quantity: qty }));
        setStep(STEPS.ASK_PRICE);
        const prodName = currentItemRef.current.name || currentItem.name || 'item';
        replyBillie(p.ask_price(prodName), activeLang);
        break;
      }

      case STEPS.ASK_PRICE: {
        const price = extractNumber(trimmed, 0);
        const qty = currentItemRef.current.quantity || currentItem.quantity || 1;
        const prodName =
          currentItemRef.current.name ||
          currentItem.name ||
          (activeLang === 'hi' ? 'प्रोडक्ट' : 'Product');

        const newItem = {
          name: prodName,
          quantity: qty,
          price: price,
          discount: 0
        };

        const updatedItems = [...draftItems, newItem];
        setDraftItems(updatedItems);
        currentItemRef.current = { name: '', quantity: 1, price: 0 };
        setCurrentItem({ name: '', quantity: 1, price: 0 });

        setStep(STEPS.ASK_MORE_ITEMS);
        const confirmationMsg = p.item_added(
          newItem.name,
          newItem.quantity,
          newItem.price,
          settings.currency || '₹'
        );
        replyBillie(`${confirmationMsg} ${p.ask_more_items}`, activeLang);
        break;
      }

      case STEPS.ASK_MORE_ITEMS: {
        if (isAffirmative(trimmed)) {
          setStep(STEPS.ASK_PRODUCT);
          replyBillie(p.ask_next_product, activeLang);
        } else if (isNegative(trimmed)) {
          setStep(STEPS.ASK_DISCOUNT);
          replyBillie(p.ask_discount, activeLang);
        } else {
          if (trimmed.length > 1) {
            currentItemRef.current.name = trimmed;
            setCurrentItem((prev) => ({ ...prev, name: trimmed }));
            setStep(STEPS.ASK_QUANTITY);
            replyBillie(p.ask_quantity(trimmed), activeLang);
          } else {
            replyBillie(p.ask_more_items, activeLang);
          }
        }
        break;
      }

      case STEPS.ASK_DISCOUNT: {
        let discount = 0;
        let discountType = 'percent';

        const normTrim = trimmed.toLowerCase();
        if (
          isNegative(trimmed) ||
          normTrim === '0' ||
          normTrim === 'zero' ||
          normTrim === 'kuch nahi' ||
          normTrim === 'shunya' ||
          normTrim === 'koi nahi' ||
          normTrim === 'no' ||
          normTrim === 'nahi' ||
          normTrim === 'none'
        ) {
          discount = 0;
          discountType = 'percent';
        } else if (
          trimmed.includes('%') ||
          normTrim.includes('percent') ||
          normTrim.includes('pratishat') ||
          normTrim.includes('pratishath') ||
          normTrim.includes('pc') ||
          normTrim.includes('pct')
        ) {
          discount = extractNumber(trimmed, 0);
          discountType = 'percent';
        } else if (
          normTrim.includes('rs') ||
          normTrim.includes('rupaye') ||
          normTrim.includes('rupees') ||
          normTrim.includes('₹') ||
          normTrim.includes('flat')
        ) {
          discount = extractNumber(trimmed, 0);
          discountType = 'flat';
        } else {
          discount = extractNumber(trimmed, 0);
          discountType = discount > 0 && discount <= 50 ? 'percent' : 'flat';
        }

        draftDiscountRef.current = { discount, discountType };
        setStep(STEPS.ASK_PAYMENT_MODE);
        replyBillie(p.ask_payment_mode, activeLang);
        break;
      }

      case STEPS.ASK_PAYMENT_MODE: {
        const normTrim = trimmed.toLowerCase();
        let selectedMode = 'cash';
        if (
          normTrim.includes('upi') ||
          normTrim.includes('gpay') ||
          normTrim.includes('phonepe') ||
          normTrim.includes('paytm') ||
          normTrim.includes('online') ||
          normTrim.includes('qr')
        ) {
          selectedMode = 'upi';
        } else if (
          normTrim.includes('card') ||
          normTrim.includes('debit') ||
          normTrim.includes('credit')
        ) {
          selectedMode = 'card';
        } else if (normTrim.includes('cheque') || normTrim.includes('check')) {
          selectedMode = 'cheque';
        } else {
          selectedMode = 'cash';
        }

        draftPaymentModeRef.current = selectedMode;
        finalizeInvoice(
          draftCustomer,
          draftItems,
          draftDiscountRef.current.discount,
          draftDiscountRef.current.discountType,
          activeLang,
          selectedMode
        );
        break;
      }

      // ----------------- STOCK MANAGEMENT STEPS -----------------
      case STEPS.STOCK_ASK_PRODUCT: {
        const prod = trimmed
          .replace(/^(product\s*is|maal\s*hai|item\s*hai|naam\s*hai)\s+/i, '')
          .trim();
        draftStockRef.current.name = prod;
        setDraftStockItem((prev) => ({ ...prev, name: prod }));
        setStep(STEPS.STOCK_ASK_QUANTITY);
        replyBillie(p.stock_ask_quantity(prod), activeLang);
        break;
      }

      case STEPS.STOCK_ASK_QUANTITY: {
        const qty = extractNumber(trimmed, 1);
        draftStockRef.current.quantity = qty;
        setDraftStockItem((prev) => ({ ...prev, quantity: qty }));
        setStep(STEPS.STOCK_ASK_COST_PRICE);
        const prodName =
          draftStockRef.current.name || (activeLang === 'hi' ? 'प्रोडक्ट' : 'Product');
        replyBillie(p.stock_ask_cost(prodName), activeLang);
        break;
      }

      case STEPS.STOCK_ASK_COST_PRICE: {
        const costPrice = extractNumber(trimmed, 0);
        if (costPrice <= 0) {
          replyBillie(
            activeLang === 'hi'
              ? 'खरीद लागत (Cost Price) दर्ज करना अनिवार्य है, कृपया लागत मूल्य बताएं:'
              : 'Cost price is mandatory, please specify the unit cost price:',
            activeLang
          );
          return;
        }
        draftStockRef.current.costPrice = costPrice;
        setStep(STEPS.STOCK_ASK_PRICE);
        const prodName =
          draftStockRef.current.name || (activeLang === 'hi' ? 'प्रोडक्ट' : 'Product');
        replyBillie(p.stock_ask_price(prodName), activeLang);
        break;
      }

      case STEPS.STOCK_ASK_PRICE: {
        let price = 0;
        const normTrim = trimmed.toLowerCase();
        if (!['purana rate', 'same', 'same rate', 'purana', 'purani'].includes(normTrim)) {
          price = extractNumber(trimmed, 0);
        }
        draftStockRef.current.price = price;
        const finalProdName = draftStockRef.current.name || 'Product';
        const finalQty = draftStockRef.current.quantity || 1;
        const finalCost = draftStockRef.current.costPrice || 0;

        // Add or update stock in context with mandatory cost price
        addOrUpdateStock(finalProdName, finalQty, price, finalCost);

        // Find updated total
        const existingItem = inventory.find(
          (i) => i.name.toLowerCase() === finalProdName.toLowerCase()
        );
        const newTotal = (existingItem?.quantity || 0) + finalQty;

        // Show live card for immediate visual confirmation
        setActiveStockReport({ filteredProduct: finalProdName });

        setStep(STEPS.STOCK_ASK_MORE);
        const addedMsg = p.stock_added(finalProdName, finalQty, newTotal);
        replyBillie(`${addedMsg} ${p.stock_ask_more}`, activeLang);
        break;
      }

      case STEPS.STOCK_ASK_MORE: {
        if (isInvoiceIntent(trimmed)) {
          resetWizard();
          setStep(STEPS.ASK_CUSTOMER);
          setIsVoiceSessionActive(true);
          replyBillie(p.ask_customer, activeLang);
          break;
        }
        if (isCheckStockIntent(trimmed)) {
          setStep(STEPS.IDLE);
          setIsVoiceSessionActive(true);
          setActiveStockReport({ filteredProduct: '' });
          replyBillie(p.stock_report_all(inventory.length), activeLang);
          break;
        }
        if (isAffirmative(trimmed)) {
          // Add another stock item
          draftStockRef.current = { name: '', quantity: 1, price: 0 };
          setDraftStockItem({ name: '', quantity: 1, price: 0 });
          setStep(STEPS.STOCK_ASK_PRODUCT);
          setIsVoiceSessionActive(true);
          replyBillie(p.stock_ask_product, activeLang);
        } else if (isNegative(trimmed)) {
          // Finished adding stock
          setStep(STEPS.IDLE);
          const finishMsg =
            activeLang === 'hi'
              ? 'बहुत बढ़िया! स्टॉक सफलतापूर्वक अपडेट हो गया है। आप नीचे कार्ड में स्टॉक देख और बदल सकते हैं।'
              : 'Great! Stock has been successfully updated. You can view and edit it in the report card.';
          replyBillie(finishMsg, activeLang, () => {
            setIsVoiceSessionActive(false);
          });
        } else {
          if (trimmed.length > 1) {
            draftStockRef.current = { name: trimmed, quantity: 1, price: 0 };
            setDraftStockItem({ name: trimmed, quantity: 1, price: 0 });
            setStep(STEPS.STOCK_ASK_QUANTITY);
            setIsVoiceSessionActive(true);
            replyBillie(p.stock_ask_quantity(trimmed), activeLang);
          } else {
            setIsVoiceSessionActive(true);
            replyBillie(p.stock_ask_more, activeLang);
          }
        }
        break;
      }

      default: {
        replyBillie(
          activeLang === 'hi'
            ? "मैं तैयार हूँ! बिल बनाने के लिए 'bill banao' बोलें, या स्टॉक के लिए 'stock check karo' या 'stock add karo' बोलें।"
            : "I'm ready! Say 'generate invoice' to bill, or 'check stock' / 'add stock' for inventory.",
          activeLang
        );
        break;
      }
    }
  };

  const resetWizard = () => {
    setStep(STEPS.IDLE);
    setFinalInvoice(null);
    setDraftCustomer('');
    setDraftCustomerDetails({
      name: '',
      companyName: '',
      phone: '',
      gstNumber: '',
      address: ''
    });
    draftCustomerDetailsRef.current = {
      name: '',
      companyName: '',
      phone: '',
      gstNumber: '',
      address: ''
    };
    setDraftItems([]);
    currentItemRef.current = { name: '', quantity: 1, price: 0 };
    setCurrentItem({ name: '', quantity: 1, price: 0 });
    draftStockRef.current = { name: '', quantity: 1, price: 0 };
    setDraftStockItem({ name: '', quantity: 1, price: 0 });
  };

  const triggerChip = (text) => {
    setIsVoiceSessionActive(true);
    handleUserMessage(text);
  };

  const currentTotal = draftItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="billie-main-container">
      {/* Hero Welcome Card if IDLE and no active card */}
      {step === STEPS.IDLE && !finalInvoice && !activeStockReport && (
        <div className="hero-assistant-card animate-fade-in">
          <div className="hero-avatar">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="hero-title">
            {lang === 'hi'
              ? 'नमस्ते! बिलिंग और इन्वेंटरी में क्या मदद करूँ?'
              : 'What can I bill or manage for you today?'}
          </h2>
          <p className="hero-subtitle">
            {lang === 'hi' ? (
              <>
                माइक दबाकर बोलें या लिखें:{' '}
                <span className="highlight-pill">bill banao</span>,{' '}
                <span className="highlight-pill">stock check karo</span>, या{' '}
                <span className="highlight-pill">stock add karo</span>. Billie तुरंत जवाब देगा!
              </>
            ) : (
              <>
                Say or type <span className="highlight-pill">generate invoice</span>,{' '}
                <span className="highlight-pill">check stock</span>, or{' '}
                <span className="highlight-pill">add stock</span>. Hands-free voice enabled!
              </>
            )}
          </p>

          {/* Quick Preset Suggestion Chips */}
          <div className="suggestion-chips-container">
            <button
              type="button"
              onClick={() => triggerChip('bill banao')}
              className="suggestion-chip active-sparkle m3-ripple"
            >
              <Sparkles size={14} />
              <span>🇮🇳 bill banao (बिल)</span>
            </button>

            <button
              type="button"
              onClick={() => triggerChip('stock add karo')}
              className="suggestion-chip m3-ripple"
            >
              <PlusCircle size={14} className="text-emerald-500" />
              <span>➕ stock add karo</span>
            </button>

            <button
              type="button"
              onClick={() => triggerChip('generate invoice')}
              className="suggestion-chip m3-ripple"
            >
              <Sparkles size={14} />
              <span>🇬🇧 generate invoice</span>
            </button>

            {onOpenInventory && (
              <button
                type="button"
                onClick={onOpenInventory}
                className="suggestion-chip m3-ripple"
              >
                <Package size={14} />
                <span>📋 {lang === 'hi' ? 'इन्वेंटरी' : 'Inventory'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsVoiceSessionActive(false);
                handleUserMessage('sales report');
              }}
              className="suggestion-chip active-report-chip m3-ripple"
            >
              <BarChart3 size={14} className="text-indigo-500" />
              <span>📊 {lang === 'hi' ? 'रिपोर्टिंग (बिक्री व खरीद)' : 'Reporting & Accounts'}</span>
            </button>

            {onOpenCustomers && (
              <button
                type="button"
                onClick={onOpenCustomers}
                className="suggestion-chip m3-ripple"
              >
                <Users size={14} className="text-blue-500" />
                <span>👥 {lang === 'hi' ? 'ग्राहक सूची' : 'Customers'}</span>
              </button>
            )}

            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="suggestion-chip m3-ripple"
              >
                <ShieldCheck size={14} className="text-amber-500" />
                <span>🛡️ {lang === 'hi' ? 'एडमिन पोर्टल' : 'Admin Portal'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conversational Stream */}
      <div className="conversation-stream">
        {messages.map((msg, index) => {
          const isBillie = msg.sender === 'billie';
          return (
            <div
              key={index}
              className={`message-bubble-row ${isBillie ? 'assistant-row' : 'user-row'} animate-fade-in`}
            >
              {isBillie && (
                <div className="avatar-mini assistant">
                  <Bot size={15} />
                </div>
              )}

              <div className={`message-bubble ${isBillie ? 'assistant-bubble' : 'user-bubble'}`}>
                <p className="message-content">{msg.text}</p>
                <span className="bubble-time">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''}
                </span>
              </div>

              {!isBillie && (
                <div className="avatar-mini user">
                  <User size={15} />
                </div>
              )}
            </div>
          );
        })}

        {/* INTERACTIVE CONTROLS 1: NEW VS EXISTING CUSTOMER CHOICE */}
        {step === STEPS.SELECT_CUSTOMER_TYPE && (
          <div className="m3-customer-choice-container animate-slide-up">
            <button
              type="button"
              onClick={() => {
                setStep(STEPS.ASK_CUSTOMER);
                const p = PROMPTS[lang] || PROMPTS.hi;
                replyBillie(p.ask_customer, lang);
              }}
              className="m3-cust-choice-card new-cust m3-ripple"
            >
              <div className="choice-icon-wrap emerald">
                <UserPlus size={22} />
              </div>
              <div className="choice-text-wrap">
                <span className="choice-title">
                  {lang === 'hi' ? '1. नया ग्राहक (New Customer)' : '1. New Customer'}
                </span>
                <span className="choice-desc">
                  {lang === 'hi' ? 'नया नाम, मोबाइल व GST विवरण दर्ज करें' : 'Enter new customer / company details'}
                </span>
              </div>
              <ArrowRight size={18} className="choice-arrow" />
            </button>

            <button
              type="button"
              onClick={() => {
                setExistingCustSearch('');
                setStep(STEPS.PICK_EXISTING_CUSTOMER);
                const p = PROMPTS[lang] || PROMPTS.hi;
                replyBillie(p.ask_existing_customer, lang);
              }}
              className="m3-cust-choice-card existing-cust m3-ripple"
            >
              <div className="choice-icon-wrap blue">
                <Users size={22} />
              </div>
              <div className="choice-text-wrap">
                <span className="choice-title">
                  {lang === 'hi' ? '2. पुराना ग्राहक (Existing Customer)' : '2. Existing Customer'}
                  <span className="choice-count-badge">{customers.length}</span>
                </span>
                <span className="choice-desc">
                  {lang === 'hi' ? 'डायरेक्टरी से ग्राहक चुनें या सर्च करें' : 'Pick existing customer from directory'}
                </span>
              </div>
              <ArrowRight size={18} className="choice-arrow" />
            </button>
          </div>
        )}

        {/* INTERACTIVE CONTROLS 2: PICK EXISTING CUSTOMER */}
        {step === STEPS.PICK_EXISTING_CUSTOMER && (
          <div className="m3-existing-customer-picker animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="picker-header-title">
                <Users size={15} className="text-blue-500" />
                <span>{lang === 'hi' ? 'मौजूदा ग्राहक चुनें (Tap to Select):' : 'Select Existing Customer:'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {filteredExistingCustomers.length} / {customers.length} {lang === 'hi' ? 'ग्राहक' : 'customers'}
              </span>
            </div>

            <div className="existing-chips-scroll custom-scrollbar">
              {filteredExistingCustomers.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  {lang === 'hi'
                    ? `"${existingCustSearch}" से कोई ग्राहक नहीं मिला`
                    : `No customers found matching "${existingCustSearch}"`}
                </div>
              ) : (
                filteredExistingCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setExistingCustSearch('');
                      setDraftCustomer(cust.name);
                      draftCustomerDetailsRef.current = {
                        name: cust.name,
                        companyName: cust.companyName || '',
                        phone: cust.phone || '',
                        gstNumber: cust.gstNumber || '',
                        address: cust.address || ''
                      };
                      setDraftCustomerDetails(draftCustomerDetailsRef.current);
                      setStep(STEPS.ASK_PRODUCT);
                      const p = PROMPTS[lang] || PROMPTS.hi;
                      replyBillie(
                        lang === 'hi'
                          ? `✓ ग्राहक "${cust.name}" की डिटेल्स लोड हो गई हैं! ${p.ask_product}`
                          : `✓ Customer "${cust.name}" loaded! ${p.ask_product}`,
                        lang
                      );
                    }}
                    className="m3-existing-cust-chip m3-ripple"
                  >
                    <div className="chip-avatar">
                      {(cust.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="chip-info">
                      <span className="chip-name">{cust.name}</span>
                      {cust.companyName && <span className="chip-company">({cust.companyName})</span>}
                      {cust.phone && <span className="chip-phone">📞 {cust.phone}</span>}
                      {cust.gstNumber && <span className="chip-gst">GST: {cust.gstNumber}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Bottom Search Bar for Existing Customers - Increased Length / Full Width */}
            <div className="m3-existing-cust-search-bottom mt-3">
              <div className="m3-existing-search-input-wrap">
                <Search size={16} className="search-icon text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={existingCustSearch}
                  onChange={(e) => setExistingCustSearch(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? 'यहाँ नाम, कंपनी या फोन नंबर से सर्च करें...'
                      : 'Search by name, company, phone or GSTIN...'
                  }
                  className="m3-existing-search-input"
                />
                {existingCustSearch && (
                  <button
                    type="button"
                    onClick={() => setExistingCustSearch('')}
                    className="search-clear-btn"
                    title="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setExistingCustSearch('');
                setStep(STEPS.ASK_CUSTOMER);
                const p = PROMPTS[lang] || PROMPTS.hi;
                replyBillie(p.ask_customer, lang);
              }}
              className="picker-switch-new-btn mt-2"
            >
              {lang === 'hi' ? '+ नया ग्राहक बनाना है?' : '+ Create New Customer Instead'}
            </button>
          </div>
        )}

        {/* INTERACTIVE CONTROLS 3: OPTIONAL PHONE & GST FORM */}
        {step === STEPS.ASK_CUSTOMER_PHONE_GST && (
          <div className="m3-phone-gst-optional-box animate-slide-up">
            <div className="box-header">
              <span className="box-title">
                📱 {lang === 'hi' ? 'मोबाइल नंबर व GST नंबर (वैकल्पिक)' : 'Mobile & GST Number (Optional)'}
              </span>
              <span className="optional-tag">{lang === 'hi' ? 'अनिवार्य नहीं है (Optional)' : 'Optional'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div>
                <label className="m3-mini-label">{lang === 'hi' ? 'मोबाइल नंबर' : 'Phone / Mobile'}</label>
                <input
                  type="tel"
                  placeholder="+91 98XXX XXXXX"
                  value={draftCustomerDetails.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    draftCustomerDetailsRef.current.phone = val;
                    setDraftCustomerDetails((prev) => ({ ...prev, phone: val }));
                  }}
                  className="m3-enhanced-input text-field-only compact"
                />
              </div>
              <div>
                <label className="m3-mini-label">{lang === 'hi' ? 'GSTIN नंबर' : 'GST Number'}</label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="07AAAAA0000A1Z5"
                  value={draftCustomerDetails.gstNumber}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    draftCustomerDetailsRef.current.gstNumber = val;
                    setDraftCustomerDetails((prev) => ({ ...prev, gstNumber: val }));
                  }}
                  className="m3-enhanced-input text-field-only compact uppercase font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  setStep(STEPS.ASK_PRODUCT);
                  const p = PROMPTS[lang] || PROMPTS.hi;
                  replyBillie(p.ask_product, lang);
                }}
                className="m3-skip-btn"
              >
                {lang === 'hi' ? 'छोड़ें (Skip)' : 'Skip'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(STEPS.ASK_PRODUCT);
                  const p = PROMPTS[lang] || PROMPTS.hi;
                  replyBillie(
                    lang === 'hi'
                      ? `✓ ग्राहक विवरण नोट हो गया! ${p.ask_product}`
                      : `✓ Customer details recorded! ${p.ask_product}`,
                    lang
                  );
                }}
                className="m3-continue-btn"
              >
                <span>{lang === 'hi' ? 'आगे बढ़ें (Continue)' : 'Continue'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE CONTROLS 4: PAYMENT MODE SELECTION */}
        {step === STEPS.ASK_PAYMENT_MODE && (
          <div className="m3-paymode-picker animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="picker-header-title">
                <CreditCard size={15} className="text-blue-500" />
                <span>{lang === 'hi' ? 'पेमेंट का माध्यम चुनें (Payment Mode):' : 'Select Payment Mode:'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === 'hi' ? 'टैप करें या बोलें' : 'Tap or speak'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  finalizeInvoice(
                    draftCustomer,
                    draftItems,
                    draftDiscountRef.current.discount,
                    draftDiscountRef.current.discountType,
                    lang,
                    'cash'
                  );
                }}
                className="m3-paymode-choice-btn cash m3-ripple"
              >
                <div className="paymode-choice-icon">💵</div>
                <div className="paymode-choice-text">
                  <span className="paymode-choice-name">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</span>
                  <span className="paymode-choice-desc">{lang === 'hi' ? 'कैश भुगतान' : 'Cash in hand'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  finalizeInvoice(
                    draftCustomer,
                    draftItems,
                    draftDiscountRef.current.discount,
                    draftDiscountRef.current.discountType,
                    lang,
                    'upi'
                  );
                }}
                className="m3-paymode-choice-btn upi m3-ripple"
              >
                <div className="paymode-choice-icon">⚡</div>
                <div className="paymode-choice-text">
                  <span className="paymode-choice-name">UPI / QR</span>
                  <span className="paymode-choice-desc">GPay, PhonePe, Paytm</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  finalizeInvoice(
                    draftCustomer,
                    draftItems,
                    draftDiscountRef.current.discount,
                    draftDiscountRef.current.discountType,
                    lang,
                    'card'
                  );
                }}
                className="m3-paymode-choice-btn card m3-ripple"
              >
                <div className="paymode-choice-icon">💳</div>
                <div className="paymode-choice-text">
                  <span className="paymode-choice-name">{lang === 'hi' ? 'कार्ड (Card)' : 'Card'}</span>
                  <span className="paymode-choice-desc">Debit / Credit Card</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  finalizeInvoice(
                    draftCustomer,
                    draftItems,
                    draftDiscountRef.current.discount,
                    draftDiscountRef.current.discountType,
                    lang,
                    'cheque'
                  );
                }}
                className="m3-paymode-choice-btn cheque m3-ripple"
              >
                <div className="paymode-choice-icon">📝</div>
                <div className="paymode-choice-text">
                  <span className="paymode-choice-name">{lang === 'hi' ? 'चेक (Cheque)' : 'Cheque'}</span>
                  <span className="paymode-choice-desc">Bank Cheque / DD</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Live Drafting Progress Card during active invoice creation */}
        {step !== STEPS.IDLE &&
          step !== STEPS.COMPLETED &&
          !step.startsWith('STOCK_') && (
            <div className="draft-live-progress animate-slide-up">
              <div className="progress-steps-row">
                <span className={`step-badge ${draftCustomer ? 'done' : 'active'}`}>
                  1. {lang === 'hi' ? 'ग्राहक' : 'Customer'} {draftCustomer && '✓'}
                </span>
                <span
                  className={`step-badge ${draftItems.length > 0 ? 'done' : step === STEPS.ASK_PRODUCT ? 'active' : ''}`}
                >
                  2. {lang === 'hi' ? 'प्रोडक्ट' : 'Product'} {draftItems.length > 0 && '✓'}
                </span>
                <span
                  className={`step-badge ${step === STEPS.ASK_QUANTITY ? 'active' : draftItems.length > 0 ? 'done' : ''}`}
                >
                  3. {lang === 'hi' ? 'मात्रा' : 'Qty'} {draftItems.length > 0 && '✓'}
                </span>
                <span
                  className={`step-badge ${step === STEPS.ASK_PRICE ? 'active' : draftItems.length > 0 ? 'done' : ''}`}
                >
                  4. {lang === 'hi' ? 'प्राइस' : 'Price'} {draftItems.length > 0 && '✓'}
                </span>
                <span className={`step-badge ${step === STEPS.ASK_MORE_ITEMS ? 'active' : ''}`}>
                  5. {lang === 'hi' ? 'और आइटम?' : 'More Items?'}
                </span>
                <span className={`step-badge ${step === STEPS.ASK_DISCOUNT ? 'active' : ''}`}>
                  6. {lang === 'hi' ? 'डिस्काउंट' : 'Discount'}
                </span>
                <span className={`step-badge ${step === STEPS.ASK_PAYMENT_MODE ? 'active' : ''}`}>
                  7. {lang === 'hi' ? 'पेमेंट' : 'Payment'}
                </span>
              </div>

              <div className="live-preview-box">
                <div className="preview-item">
                  <span className="label">
                    {lang === 'hi' ? 'ग्राहक (Customer):' : 'Customer:'}
                  </span>
                  <div className="flex flex-col">
                    <span className="val font-semibold">
                      {draftCustomer || (lang === 'hi' ? 'नाम पूछ रहे हैं...' : 'Waiting...')}
                    </span>
                    {(draftCustomerDetails.phone || draftCustomerDetails.gstNumber) && (
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        {draftCustomerDetails.phone && `📞 ${draftCustomerDetails.phone} `}
                        {draftCustomerDetails.gstNumber && `🏢 GST: ${draftCustomerDetails.gstNumber}`}
                      </span>
                    )}
                  </div>
                </div>

                {draftItems.length > 0 && (
                  <div className="items-list-draft">
                    <span className="label">
                      {lang === 'hi' ? 'आइटम्स लिस्ट (Items Added):' : 'Items Added:'}
                    </span>
                    {draftItems.map((it, idx) => (
                      <div key={idx} className="draft-single-item">
                        <span>
                          • {it.name} ({it.quantity} × {settings.currency || '₹'}
                          {it.price})
                        </span>
                        <span className="font-semibold">
                          {settings.currency || '₹'}
                          {(it.quantity * it.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="draft-subtotal-row">
                      <span>
                        {lang === 'hi' ? 'वर्तमान सबटोटल (Subtotal):' : 'Current Subtotal:'}
                      </span>
                      <span className="val font-bold text-blue-600">
                        {settings.currency || '₹'}
                        {currentTotal.toFixed(2)}
                      </span>
                    </div>
                    {draftDiscountRef.current && draftDiscountRef.current.discount > 0 && (
                      <div className="draft-subtotal-row text-rose-500 font-medium">
                        <span>
                          {lang === 'hi' ? 'छूट (Discount):' : 'Discount:'}
                          {draftDiscountRef.current.discountType === 'percent' ? ` (${draftDiscountRef.current.discount}%)` : ''}
                        </span>
                        <span className="val font-semibold">
                          -{settings.currency || '₹'}
                          {(draftDiscountRef.current.discountType === 'percent'
                            ? (currentTotal * Math.min(100, draftDiscountRef.current.discount)) / 100
                            : Math.min(currentTotal, draftDiscountRef.current.discount)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {draftDiscountRef.current && draftDiscountRef.current.discount > 0 && (
                      <div className="draft-subtotal-row font-bold text-emerald-600 border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                        <span>
                          {lang === 'hi' ? 'कुल देय (Net Total):' : 'Net Total:'}
                        </span>
                        <span className="val">
                          {settings.currency || '₹'}
                          {Math.max(
                            0,
                            currentTotal - (draftDiscountRef.current.discountType === 'percent'
                              ? (currentTotal * Math.min(100, draftDiscountRef.current.discount)) / 100
                              : Math.min(currentTotal, draftDiscountRef.current.discount))
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {currentItem.name && (
                  <div className="preview-item mt-1 text-slate-500">
                    <span className="label">{lang === 'hi' ? 'नया आइटम:' : 'Adding:'}</span>
                    <span className="val">
                      {currentItem.name} (Qty: {currentItem.quantity})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Live Drafting Progress Card during active Stock addition */}
        {step.startsWith('STOCK_') && (
          <div className="draft-live-progress animate-slide-up">
            <div className="progress-steps-row">
              <span className={`step-badge ${draftStockItem.name ? 'done' : 'active'}`}>
                1. {lang === 'hi' ? 'प्रोडक्ट' : 'Product'} {draftStockItem.name && '✓'}
              </span>
              <span
                className={`step-badge ${step === STEPS.STOCK_ASK_QUANTITY ? 'active' : draftStockItem.quantity > 0 && step !== STEPS.STOCK_ASK_PRODUCT ? 'done' : ''}`}
              >
                2. {lang === 'hi' ? 'स्टॉक मात्रा' : 'Qty to Add'} {draftStockItem.quantity > 0 && step !== STEPS.STOCK_ASK_QUANTITY && '✓'}
              </span>
              <span
                className={`step-badge ${step === STEPS.STOCK_ASK_PRICE ? 'active' : step === STEPS.STOCK_ASK_MORE ? 'done' : ''}`}
              >
                3. {lang === 'hi' ? 'सेलिंग प्राइस' : 'Price'}
              </span>
              <span className={`step-badge ${step === STEPS.STOCK_ASK_MORE ? 'active' : ''}`}>
                4. {lang === 'hi' ? 'और स्टॉक जोड़ें?' : 'More?'}
              </span>
            </div>

            <div className="live-preview-box">
              <div className="preview-item">
                <span className="label">
                  {lang === 'hi' ? 'स्टॉक प्रोडक्ट:' : 'Restock Product:'}
                </span>
                <span className="val font-semibold">
                  {draftStockItem.name || (lang === 'hi' ? 'नाम पूछ रहे हैं...' : 'Waiting for name...')}
                </span>
              </div>
              {draftStockItem.quantity > 0 && (
                <div className="preview-item mt-1">
                  <span className="label">
                    {lang === 'hi' ? 'जोड़ने वाली मात्रा:' : 'Adding Quantity:'}
                  </span>
                  <span className="val font-bold text-blue-600">
                    +{draftStockItem.quantity} pcs
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Stock Report Card on Home Screen */}
        {activeStockReport && (
          <div className="my-3">
            <StockReportCard
              filteredProduct={activeStockReport.filteredProduct}
              onClose={() => setActiveStockReport(null)}
              onAddStockClick={() => {
                setIsVoiceSessionActive(true);
                handleUserMessage('stock add karo');
              }}
            />
          </div>
        )}

        {/* Live Reporting & Accounting Section on Home Screen */}
        {activeReporting && (
          <div className="my-3">
            <ReportingSection
              initialMode={activeReporting.mode || 'sales'}
              onClose={() => setActiveReporting(null)}
            />
          </div>
        )}

        {/* Finalized Invoice Card with PDF Download */}
        {finalInvoice && (
          <InvoiceCard invoice={finalInvoice} onReset={resetWizard} isDraft={false} />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
