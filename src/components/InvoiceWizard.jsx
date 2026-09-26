import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Bot, User, Check, ArrowRight, RefreshCw, FileText, CornerDownLeft } from 'lucide-react';
import InvoiceCard from './InvoiceCard';
import { useApp } from '../context/AppContext';
import { isInvoiceIntent, parseOneShotInvoice, calculateInvoiceTotals } from '../utils/invoiceParser';
import { speakText } from '../utils/speechRecognition';

// Conversation step enums
const STEPS = {
  IDLE: 'IDLE',
  ASK_CUSTOMER: 'ASK_CUSTOMER',
  ASK_PRODUCT: 'ASK_PRODUCT',
  ASK_QUANTITY: 'ASK_QUANTITY',
  ASK_PRICE: 'ASK_PRICE',
  ASK_DISCOUNT: 'ASK_DISCOUNT',
  COMPLETED: 'COMPLETED'
};

export default function InvoiceWizard({ externalQuery, onPromptHintChange, onResetExternalQuery }) {
  const { user, settings, addInvoice, getNextInvoiceNumber } = useApp();
  const [step, setStep] = useState(STEPS.IDLE);
  const [messages, setMessages] = useState([
    {
      sender: 'billie',
      text: "Hello! I'm Billie, your voice & text invoice assistant. Say or type 'generate invoice' to create a bill.",
      timestamp: new Date()
    }
  ]);

  // Current drafting state
  const [draftInvoice, setDraftInvoice] = useState({
    customerName: '',
    product: '',
    quantity: 1,
    price: 0,
    discount: 0,
    discountType: 'percent',
    taxRate: settings.defaultTaxRate || 0
  });

  const [finalInvoice, setFinalInvoice] = useState(null);
  const messagesEndRef = useRef(null);

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

  // Update prompt hint based on current step
  useEffect(() => {
    let hint = '';
    switch (step) {
      case STEPS.ASK_CUSTOMER:
        hint = "Say or type Customer Name (e.g., 'Acme Corp')...";
        break;
      case STEPS.ASK_PRODUCT:
        hint = "Say or type Product/Service (e.g., 'Website Design')...";
        break;
      case STEPS.ASK_QUANTITY:
        hint = "Say or type Quantity (e.g., '2' or '5')...";
        break;
      case STEPS.ASK_PRICE:
        hint = `Say or type Price per unit (e.g., '${settings.currency || '$'}500')...`;
        break;
      case STEPS.ASK_DISCOUNT:
        hint = "Say or type Discount (e.g., '10%' or '0')...";
        break;
      default:
        hint = "Ask Billie or type 'generate invoice'...";
    }
    if (onPromptHintChange) {
      onPromptHintChange(hint);
    }
  }, [step, settings.currency, onPromptHintChange]);

  // Complete and finalize the invoice
  const finalizeInvoice = (dataToFinalize) => {
    const rawItems = [
      {
        name: dataToFinalize.product || 'Standard Service',
        quantity: Math.max(1, Number(dataToFinalize.quantity) || 1),
        price: Math.max(0, Number(dataToFinalize.price) || 0),
        discount: Number(dataToFinalize.discount) || 0,
        discountType: dataToFinalize.discountType || 'percent'
      }
    ];

    const totals = calculateInvoiceTotals(rawItems, settings.defaultTaxRate || 0);
    const invoiceNum = getNextInvoiceNumber();

    const completeInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerName: dataToFinalize.customerName || 'Valued Customer',
      date: new Date().toLocaleDateString(),
      dueDate: 'Due on Receipt',
      product: rawItems[0].name,
      quantity: rawItems[0].quantity,
      price: rawItems[0].price,
      discount: rawItems[0].discount,
      discountType: rawItems[0].discountType,
      subtotal: totals.subtotal,
      discountAmount: totals.totalDiscount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.grandTotal,
      currency: settings.currency || '$',
      items: totals.items
    };

    setFinalInvoice(completeInvoice);
    addInvoice(completeInvoice);
    setStep(STEPS.COMPLETED);

    // Add assistant celebration message
    const msg = `✨ Invoice ${invoiceNum} generated for ${completeInvoice.customerName}! Subtotal: ${settings.currency}${totals.subtotal.toFixed(2)}, Discount: -${settings.currency}${totals.totalDiscount.toFixed(2)}, Total: ${settings.currency}${totals.grandTotal.toFixed(2)}.`;
    setMessages((prev) => [
      ...prev,
      { sender: 'billie', text: msg, timestamp: new Date() }
    ]);

    if (settings.voiceFeedback) {
      speakText(`Invoice generated for ${completeInvoice.customerName}. Total is ${totals.grandTotal.toFixed(2)}.`);
    }

    // Trigger joyful celebration confetti
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.75 }
      });
    } catch (e) {
      // Ignore confetti error if any
    }
  };

  const handleUserMessage = (userText) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    // Append user message
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: trimmed, timestamp: new Date() }
    ]);

    // Check if user is asking for a brand new invoice or reset
    if (trimmed.toLowerCase() === 'reset' || trimmed.toLowerCase() === 'cancel') {
      resetWizard();
      setMessages((prev) => [
        ...prev,
        { sender: 'billie', text: "Cancelled. Say or type 'generate invoice' whenever you're ready!", timestamp: new Date() }
      ]);
      return;
    }

    // 1. One-Shot Intent Check (e.g. "generate invoice for Acme Corp, 2 Laptops at 1200 with 10% discount")
    const oneShot = parseOneShotInvoice(trimmed);
    if (oneShot.hasFullDetails) {
      finalizeInvoice(oneShot);
      return;
    }

    // 2. Trigger "generate invoice" keyword from IDLE or COMPLETED
    if (step === STEPS.IDLE || step === STEPS.COMPLETED || isInvoiceIntent(trimmed)) {
      if (isInvoiceIntent(trimmed)) {
        // If customer was partially mentioned:
        if (oneShot.customerName) {
          setDraftInvoice((prev) => ({ ...prev, customerName: oneShot.customerName }));
          setStep(STEPS.ASK_PRODUCT);
          const reply = `Got it, invoicing for ${oneShot.customerName}! What is the product or service name?`;
          setMessages((prev) => [...prev, { sender: 'billie', text: reply, timestamp: new Date() }]);
          if (settings.voiceFeedback) speakText(reply);
          return;
        }

        // Start step 1: ask Customer Name
        setDraftInvoice({
          customerName: '',
          product: '',
          quantity: 1,
          price: 0,
          discount: 0,
          discountType: 'percent',
          taxRate: settings.defaultTaxRate || 0
        });
        setFinalInvoice(null);
        setStep(STEPS.ASK_CUSTOMER);
        const reply = "Let's create a new invoice! Who is the customer? (Please state or type customer name)";
        setMessages((prev) => [...prev, { sender: 'billie', text: reply, timestamp: new Date() }]);
        if (settings.voiceFeedback) speakText(reply);
        return;
      }
    }

    // 3. Step-by-Step Flow:
    switch (step) {
      case STEPS.ASK_CUSTOMER: {
        const customer = trimmed.replace(/^(customer\s*name\s*is|customer\s*is|for)\s+/i, '').trim();
        setDraftInvoice((prev) => ({ ...prev, customerName: customer }));
        setStep(STEPS.ASK_PRODUCT);
        const reply = `Great, billing ${customer}! What product or service are you charging for?`;
        setMessages((prev) => [...prev, { sender: 'billie', text: reply, timestamp: new Date() }]);
        if (settings.voiceFeedback) speakText(reply);
        break;
      }

      case STEPS.ASK_PRODUCT: {
        const prod = trimmed.replace(/^(product\s*is|item\s*is|service\s*is)\s+/i, '').trim();
        setDraftInvoice((prev) => ({ ...prev, product: prod }));
        setStep(STEPS.ASK_QUANTITY);
        const reply = `Got it: "${prod}". How many units or hours? (e.g., 1, 2, 5)`;
        setMessages((prev) => [...prev, { sender: 'billie', text: reply, timestamp: new Date() }]);
        if (settings.voiceFeedback) speakText(reply);
        break;
      }

      case STEPS.ASK_QUANTITY: {
        const numMatch = trimmed.match(/\d+/);
        const qty = numMatch ? parseInt(numMatch[0], 10) : 1;
        setDraftInvoice((prev) => ({ ...prev, quantity: qty }));
        setStep(STEPS.ASK_PRICE);
        const reply = `Quantity set to ${qty}. What is the price per unit in ${settings.currency || '$'}?`;
        setMessages((prev) => [...prev, { sender: 'billie', text: reply, timestamp: new Date() }]);
        if (settings.voiceFeedback) speakText(reply);
        break;
      }

      case STEPS.ASK_PRICE: {
        const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
        const price = numMatch ? parseFloat(numMatch[1]) : 0;
        setDraftInvoice((prev) => ({ ...prev, price }));
        setStep(STEPS.ASK_DISCOUNT);
        const reply = `Unit price: ${settings.currency || '$'}${price}. Any discount? (Type/say '10%' or flat amount, or '0' for none)`;
        setMessages((prev) => [...prev, { sender: 'billie', text: reply, timestamp: new Date() }]);
        if (settings.voiceFeedback) speakText(reply);
        break;
      }

      case STEPS.ASK_DISCOUNT: {
        let discount = 0;
        let discountType = 'percent';

        if (trimmed.includes('%')) {
          const num = trimmed.match(/(\d+(?:\.\d+)?)/);
          discount = num ? parseFloat(num[1]) : 0;
          discountType = 'percent';
        } else {
          const num = trimmed.match(/(\d+(?:\.\d+)?)/);
          discount = num ? parseFloat(num[1]) : 0;
          discountType = discount > 0 && discount <= 50 ? 'percent' : 'flat';
        }

        const completedData = {
          ...draftInvoice,
          discount,
          discountType
        };

        finalizeInvoice(completedData);
        break;
      }

      default: {
        // Unknown or idle input
        const reply = "I'm ready! Say or type 'generate invoice' to create a bill, or try an example below.";
        setMessages((prev) => [...prev, { sender: 'billie', text: reply, timestamp: new Date() }]);
        if (settings.voiceFeedback) speakText(reply);
        break;
      }
    }
  };

  const resetWizard = () => {
    setStep(STEPS.IDLE);
    setFinalInvoice(null);
    setDraftInvoice({
      customerName: '',
      product: '',
      quantity: 1,
      price: 0,
      discount: 0,
      discountType: 'percent',
      taxRate: settings.defaultTaxRate || 0
    });
  };

  const triggerChip = (text) => {
    handleUserMessage(text);
  };

  return (
    <div className="billie-main-container">
      {/* Hero Welcome if IDLE with few messages */}
      {step === STEPS.IDLE && !finalInvoice && (
        <div className="hero-assistant-card animate-fade-in">
          <div className="hero-avatar">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="hero-title">What can I bill for you?</h2>
          <p className="hero-subtitle">
            Say or type <span className="highlight-pill">generate invoice</span> to start. I'll prompt you for customer name, product, quantity, price, and discount to calculate your subtotal and produce an instant PDF!
          </p>

          {/* Quick preset suggestions */}
          <div className="suggestion-chips-container">
            <button
              type="button"
              onClick={() => triggerChip('generate invoice')}
              className="suggestion-chip active-sparkle m3-ripple"
            >
              <Sparkles size={14} />
              <span>generate invoice</span>
            </button>

            <button
              type="button"
              onClick={() => triggerChip('generate invoice for Acme Corp, 2 Laptops at 1200 with 10% discount')}
              className="suggestion-chip m3-ripple"
            >
              <span>⚡ Acme Corp (2 Laptops @ $1200, 10% off)</span>
            </button>

            <button
              type="button"
              onClick={() => triggerChip('generate invoice for Sarah Miller, 5 Hours Consulting at 80 with 0 discount')}
              className="suggestion-chip m3-ripple"
            >
              <span>💼 Sarah Miller (5h Consulting @ $80)</span>
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

        {/* Live Drafting Preview Card during interactive flow */}
        {step !== STEPS.IDLE && step !== STEPS.COMPLETED && (
          <div className="draft-live-progress animate-slide-up">
            <div className="progress-steps-row">
              <span className={`step-badge ${draftInvoice.customerName ? 'done' : 'active'}`}>
                1. Customer {draftInvoice.customerName && '✓'}
              </span>
              <span className={`step-badge ${draftInvoice.product ? 'done' : step === STEPS.ASK_PRODUCT ? 'active' : ''}`}>
                2. Product {draftInvoice.product && '✓'}
              </span>
              <span className={`step-badge ${draftInvoice.quantity ? 'done' : step === STEPS.ASK_QUANTITY ? 'active' : ''}`}>
                3. Qty {draftInvoice.quantity > 0 && step !== STEPS.ASK_QUANTITY && '✓'}
              </span>
              <span className={`step-badge ${draftInvoice.price > 0 ? 'done' : step === STEPS.ASK_PRICE ? 'active' : ''}`}>
                4. Price {draftInvoice.price > 0 && '✓'}
              </span>
              <span className={`step-badge ${step === STEPS.ASK_DISCOUNT ? 'active' : ''}`}>
                5. Discount
              </span>
            </div>

            {/* Live calculation preview */}
            <div className="live-preview-box">
              <div className="preview-item">
                <span className="label">Customer:</span>
                <span className="val">{draftInvoice.customerName || 'Waiting...'}</span>
              </div>
              <div className="preview-item">
                <span className="label">Product:</span>
                <span className="val">{draftInvoice.product || 'Waiting...'}</span>
              </div>
              <div className="preview-item">
                <span className="label">Calculation:</span>
                <span className="val font-semibold">
                  {draftInvoice.quantity} × {settings.currency || '$'}{draftInvoice.price} = {settings.currency || '$'}{(draftInvoice.quantity * draftInvoice.price).toFixed(2)}
                </span>
              </div>
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
