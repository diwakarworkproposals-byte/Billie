import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Bot, User, Check, ArrowRight, RefreshCw, FileText, CornerDownLeft, PlusCircle } from 'lucide-react';
import InvoiceCard from './InvoiceCard';
import { useApp } from '../context/AppContext';
import {
  isInvoiceIntent,
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
  ASK_CUSTOMER: 'ASK_CUSTOMER',
  ASK_PRODUCT: 'ASK_PRODUCT',
  ASK_QUANTITY: 'ASK_QUANTITY',
  ASK_PRICE: 'ASK_PRICE',
  ASK_MORE_ITEMS: 'ASK_MORE_ITEMS',
  ASK_DISCOUNT: 'ASK_DISCOUNT',
  COMPLETED: 'COMPLETED'
};

export default function InvoiceWizard({ externalQuery, onPromptHintChange, onResetExternalQuery }) {
  const { user, settings, addInvoice, getNextInvoiceNumber, setLanguage } = useApp();
  
  // Local active conversation language: default from settings ('hi' or 'en')
  const [lang, setLang] = useState(settings.language || 'hi');
  const [step, setStep] = useState(STEPS.IDLE);
  
  const [messages, setMessages] = useState([
    {
      sender: 'billie',
      text: PROMPTS[settings.language || 'hi'].welcome,
      timestamp: new Date()
    }
  ]);

  // Current drafting state with multi-item support
  const [draftCustomer, setDraftCustomer] = useState('');
  const [draftItems, setDraftItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    quantity: 1,
    price: 0
  });
  const currentItemRef = useRef({ name: '', quantity: 1, price: 0 });

  const [finalInvoice, setFinalInvoice] = useState(null);
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
  }, [messages, step, finalInvoice]);

  // Handle incoming query from the bottom search bar (text or voice)
  useEffect(() => {
    if (!externalQuery) return;
    handleUserMessage(externalQuery);
    if (onResetExternalQuery) onResetExternalQuery();
  }, [externalQuery]);

  // Update prompt hint based on current step and active language
  useEffect(() => {
    const p = PROMPTS[lang] || PROMPTS.hi;
    let hint = p.hints.idle;

    switch (step) {
      case STEPS.ASK_CUSTOMER:
        hint = p.hints.customer;
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
      default:
        hint = p.hints.idle;
    }

    if (onPromptHintChange) {
      onPromptHintChange(hint);
    }
  }, [step, lang, onPromptHintChange]);

  const replyBillie = (text, targetLang = lang) => {
    setMessages((prev) => [
      ...prev,
      { sender: 'billie', text, timestamp: new Date() }
    ]);
    if (settings.voiceFeedback) {
      speakText(text, targetLang);
    }
  };

  // Complete and finalize the invoice
  const finalizeInvoice = (customerName, itemsList, discountVal = 0, discountType = 'percent', chosenLang = lang) => {
    const totals = calculateInvoiceTotals(itemsList, settings.defaultTaxRate || 0);
    const invoiceNum = getNextInvoiceNumber();
    const currency = settings.currency || '₹';

    const completeInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerName: customerName || (chosenLang === 'hi' ? 'सम्मानित ग्राहक' : 'Valued Customer'),
      date: new Date().toLocaleDateString(),
      dueDate: chosenLang === 'hi' ? 'तुरंत देय (Due on Receipt)' : 'Due on Receipt',
      product: itemsList.length > 0 ? itemsList.map((i) => i.name).join(', ') : 'Standard Service',
      quantity: itemsList.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0),
      price: itemsList[0]?.price || 0,
      discount: discountVal,
      discountType: discountType,
      subtotal: totals.subtotal,
      discountAmount: totals.totalDiscount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.grandTotal,
      currency: currency,
      items: totals.items
    };

    setFinalInvoice(completeInvoice);
    addInvoice(completeInvoice);
    setStep(STEPS.COMPLETED);

    const p = PROMPTS[chosenLang] || PROMPTS.hi;
    const msg = p.invoice_ready(
      invoiceNum,
      completeInvoice.customerName,
      totals.subtotal.toFixed(2),
      totals.totalDiscount.toFixed(2),
      totals.grandTotal.toFixed(2),
      currency
    );

    replyBillie(msg, chosenLang);

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
    if (isInvoiceIntent(trimmed)) {
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
    if (['reset', 'cancel', 'band karo', 'radd karo', 'chhodo'].includes(norm)) {
      resetWizard();
      replyBillie(p.cancelled, activeLang);
      return;
    }

    // 1. One-Shot NLP check (e.g. "Ramesh ke liye 2 Laptops 1200 me 10% discount ke sath bill banao")
    const oneShot = parseOneShotInvoice(trimmed);
    if (oneShot.hasFullDetails) {
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
        activeLang
      );
      return;
    }

    // 2. Trigger invoice creation from IDLE, COMPLETED, or explicit intent
    if (step === STEPS.IDLE || step === STEPS.COMPLETED || isInvoiceIntent(trimmed)) {
      if (isInvoiceIntent(trimmed)) {
        setDraftCustomer(oneShot.customerName || '');
        setDraftItems([]);
        setCurrentItem({ name: '', quantity: 1, price: 0 });
        setFinalInvoice(null);

        if (oneShot.customerName) {
          setStep(STEPS.ASK_PRODUCT);
          const reply = activeLang === 'hi' 
            ? `ठीक है, ${oneShot.customerName} के लिए बिल बनाते हैं! ${p.ask_product}`
            : `Got it, invoicing for ${oneShot.customerName}! ${p.ask_product}`;
          replyBillie(reply, activeLang);
        } else {
          setStep(STEPS.ASK_CUSTOMER);
          replyBillie(p.ask_customer, activeLang);
        }
        return;
      }
    }

    // 3. Step-by-Step Interactive Conversational Flow
    switch (step) {
      // Step 1: Customer Name
      case STEPS.ASK_CUSTOMER: {
        const cleanedCustomer = trimmed
          .replace(/^(customer\s*name\s*is|customer\s*is|naam\s*hai|for|kiske\s*liye)\s+/i, '')
          .trim();
        setDraftCustomer(cleanedCustomer);
        setStep(STEPS.ASK_PRODUCT);

        const reply = activeLang === 'hi'
          ? `बढ़िया, ${cleanedCustomer} के लिए बिल बनाते हैं! ${p.ask_product}`
          : `Great, billing ${cleanedCustomer}! ${p.ask_product}`;
        replyBillie(reply, activeLang);
        break;
      }

      // Step 2: Product Name
      case STEPS.ASK_PRODUCT: {
        const prod = trimmed.replace(/^(product\s*is|item\s*is|service\s*is)\s+/i, '').trim();
        currentItemRef.current.name = prod;
        setCurrentItem((prev) => ({ ...prev, name: prod }));
        setStep(STEPS.ASK_QUANTITY);
        replyBillie(p.ask_quantity(prod), activeLang);
        break;
      }

      // Step 3: Quantity
      case STEPS.ASK_QUANTITY: {
        const qty = extractNumber(trimmed, 1);
        currentItemRef.current.quantity = qty;
        setCurrentItem((prev) => ({ ...prev, quantity: qty }));
        setStep(STEPS.ASK_PRICE);
        const prodName = currentItemRef.current.name || currentItem.name || 'item';
        replyBillie(p.ask_price(prodName), activeLang);
        break;
      }

      // Step 4: Unit Price
      case STEPS.ASK_PRICE: {
        const price = extractNumber(trimmed, 0);
        const qty = currentItemRef.current.quantity || currentItem.quantity || 1;
        const prodName = currentItemRef.current.name || currentItem.name || (activeLang === 'hi' ? 'प्रोडक्ट' : 'Product');
        
        // Add this item to draft items list
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

        // Move to Ask More Items step!
        setStep(STEPS.ASK_MORE_ITEMS);

        const confirmationMsg = p.item_added(newItem.name, newItem.quantity, newItem.price, settings.currency || '₹');
        replyBillie(`${confirmationMsg} ${p.ask_more_items}`, activeLang);
        break;
      }

      // Step 5: "Aur kuch add karna hai?"
      case STEPS.ASK_MORE_ITEMS: {
        if (isAffirmative(trimmed)) {
          // User wants to add another item
          setStep(STEPS.ASK_PRODUCT);
          replyBillie(p.ask_next_product, activeLang);
        } else if (isNegative(trimmed)) {
          // User is finished adding items -> proceed to discount
          setStep(STEPS.ASK_DISCOUNT);
          replyBillie(p.ask_discount, activeLang);
        } else {
          // Check if user directly provided another product name e.g. "Mouse"
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

      // Step 6: Discount & Final Calculation
      case STEPS.ASK_DISCOUNT: {
        let discount = 0;
        let discountType = 'percent';

        const normTrim = trimmed.toLowerCase();
        if (isNegative(trimmed) || normTrim === '0' || normTrim === 'zero' || normTrim === 'kuch nahi' || normTrim === 'shunya') {
          discount = 0;
        } else if (trimmed.includes('%') || normTrim.includes('percent') || normTrim.includes('pratishat')) {
          discount = extractNumber(trimmed, 0);
          discountType = 'percent';
        } else {
          discount = extractNumber(trimmed, 0);
          discountType = discount > 0 && discount <= 50 ? 'percent' : 'flat';
        }

        finalizeInvoice(draftCustomer, draftItems, discount, discountType, activeLang);
        break;
      }

      default: {
        replyBillie(
          activeLang === 'hi'
            ? "मैं तैयार हूँ! नया बिल बनाने के लिए 'bill banao' बोलें या लिखें।"
            : "I'm ready! Say or type 'generate invoice' to create a bill.",
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
    setDraftItems([]);
    currentItemRef.current = { name: '', quantity: 1, price: 0 };
    setCurrentItem({ name: '', quantity: 1, price: 0 });
  };

  const triggerChip = (text) => {
    handleUserMessage(text);
  };

  const currentTotal = draftItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="billie-main-container">
      {/* Hero Welcome Card if IDLE */}
      {step === STEPS.IDLE && !finalInvoice && (
        <div className="hero-assistant-card animate-fade-in">
          <div className="hero-avatar">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="hero-title">
            {lang === 'hi' ? 'नमस्ते! किसके नाम बिल बनाना है?' : 'What can I bill for you today?'}
          </h2>
          <p className="hero-subtitle">
            {lang === 'hi' ? (
              <>
                माइक दबाकर बोलें या टाइप करें: <span className="highlight-pill">bill banao</span>. Billie आपसे कस्टमर का नाम, प्रोडक्ट, क्वांटिटी, प्राइस और डिस्काउंट पूछकर तुरंत PDF बिल तैयार कर देगा!
              </>
            ) : (
              <>
                Say or type <span className="highlight-pill">generate invoice</span> or <span className="highlight-pill">bill banao</span>. I'll prompt you step-by-step and produce an instant PDF!
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
              <span>🇮🇳 bill banao (नया बिल)</span>
            </button>

            <button
              type="button"
              onClick={() => triggerChip('generate invoice')}
              className="suggestion-chip m3-ripple"
            >
              <Sparkles size={14} />
              <span>🇬🇧 generate invoice</span>
            </button>

            <button
              type="button"
              onClick={() => triggerChip('Ramesh ke liye 2 Shirt 500 rate me 10% discount ke sath bill banao')}
              className="suggestion-chip m3-ripple"
            >
              <span>⚡ Ramesh (2 Shirt @ ₹500, 10% off)</span>
            </button>

            <button
              type="button"
              onClick={() => triggerChip('generate invoice for Acme Corp, 2 Laptops at 1200 with 10% discount')}
              className="suggestion-chip m3-ripple"
            >
              <span>💼 Acme Corp (2 Laptops @ $1200)</span>
            </button>
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
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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

        {/* Live Drafting Progress Card during active creation */}
        {step !== STEPS.IDLE && step !== STEPS.COMPLETED && (
          <div className="draft-live-progress animate-slide-up">
            <div className="progress-steps-row">
              <span className={`step-badge ${draftCustomer ? 'done' : 'active'}`}>
                1. {lang === 'hi' ? 'ग्राहक' : 'Customer'} {draftCustomer && '✓'}
              </span>
              <span className={`step-badge ${draftItems.length > 0 ? 'done' : step === STEPS.ASK_PRODUCT ? 'active' : ''}`}>
                2. {lang === 'hi' ? 'प्रोडक्ट' : 'Product'} {draftItems.length > 0 && '✓'}
              </span>
              <span className={`step-badge ${step === STEPS.ASK_QUANTITY ? 'active' : draftItems.length > 0 ? 'done' : ''}`}>
                3. {lang === 'hi' ? 'मात्रा' : 'Qty'} {draftItems.length > 0 && '✓'}
              </span>
              <span className={`step-badge ${step === STEPS.ASK_PRICE ? 'active' : draftItems.length > 0 ? 'done' : ''}`}>
                4. {lang === 'hi' ? 'प्राइस' : 'Price'} {draftItems.length > 0 && '✓'}
              </span>
              <span className={`step-badge ${step === STEPS.ASK_MORE_ITEMS ? 'active' : ''}`}>
                5. {lang === 'hi' ? 'और आइटम?' : 'More Items?'}
              </span>
              <span className={`step-badge ${step === STEPS.ASK_DISCOUNT ? 'active' : ''}`}>
                6. {lang === 'hi' ? 'डिस्काउंट' : 'Discount'}
              </span>
            </div>

            {/* Live calculation preview */}
            <div className="live-preview-box">
              <div className="preview-item">
                <span className="label">{lang === 'hi' ? 'ग्राहक (Customer):' : 'Customer:'}</span>
                <span className="val font-semibold">{draftCustomer || (lang === 'hi' ? 'नाम पूछ रहे हैं...' : 'Waiting...')}</span>
              </div>

              {draftItems.length > 0 && (
                <div className="items-list-draft">
                  <span className="label">{lang === 'hi' ? 'आइटम्स लिस्ट (Items Added):' : 'Items Added:'}</span>
                  {draftItems.map((it, idx) => (
                    <div key={idx} className="draft-single-item">
                      <span>• {it.name} ({it.quantity} × {settings.currency || '₹'}{it.price})</span>
                      <span className="font-semibold">{settings.currency || '₹'}{(it.quantity * it.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="draft-subtotal-row">
                    <span>{lang === 'hi' ? 'वर्तमान सबटोटल (Subtotal):' : 'Current Subtotal:'}</span>
                    <span className="val font-bold text-blue-600">
                      {settings.currency || '₹'}{currentTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {currentItem.name && (
                <div className="preview-item mt-1 text-slate-500">
                  <span className="label">{lang === 'hi' ? 'नया आइटम:' : 'Adding:'}</span>
                  <span className="val">{currentItem.name} (Qty: {currentItem.quantity})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finalized Invoice Card with PDF Download */}
        {finalInvoice && (
          <InvoiceCard
            invoice={finalInvoice}
            onReset={resetWizard}
            isDraft={false}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
