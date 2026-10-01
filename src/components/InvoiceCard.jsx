import React from 'react';
import { Download, Printer, CheckCircle2, Sparkles, Building, Phone, Mail, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { useApp } from '../context/AppContext';

export default function InvoiceCard({
  invoice,
  onReset,
  onAddItem,
  onUpdateInvoice,
  isDraft = false
}) {
  const { user, settings, addInvoice } = useApp();
  const currency = invoice.currency || settings.currency || '₹';
  const isHindi = settings.language === 'hi';

  const handleDownloadPDF = () => {
    if (invoice.id) {
      addInvoice(invoice);
    }
    generateInvoicePDF(invoice, user, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      name: invoice.product || 'Product/Service',
      quantity: invoice.quantity || 1,
      price: invoice.price || 0,
      discount: invoice.discount || 0,
      lineTotal: invoice.subtotal || 0
    }
  ];

  // Calculation figures
  const subtotalNum = Number(invoice.subtotal) || items.reduce((sum, it) => sum + (Number(it.quantity || 1) * Number(it.price || 0)), 0);

  let finalDiscAmount = 0;
  if (invoice.discountAmount !== undefined && Number(invoice.discountAmount) > 0) {
    finalDiscAmount = Number(invoice.discountAmount);
  } else if (invoice.totalDiscount !== undefined && Number(invoice.totalDiscount) > 0) {
    finalDiscAmount = Number(invoice.totalDiscount);
  } else if (Number(invoice.discount) > 0) {
    if (invoice.discountType === 'percent' || invoice.isPercentDiscount) {
      finalDiscAmount = (subtotalNum * Math.min(100, Number(invoice.discount))) / 100;
    } else {
      finalDiscAmount = Math.min(subtotalNum, Number(invoice.discount));
    }
  }

  const taxRateNum = Number(invoice.taxRate) || 0;
  const taxAmountNum = Number(invoice.taxAmount) || ((Math.max(0, subtotalNum - finalDiscAmount) * taxRateNum) / 100);
  let grandTotalNum = invoice.total !== undefined ? Number(invoice.total) : (subtotalNum - finalDiscAmount + taxAmountNum);
  if (grandTotalNum === subtotalNum && finalDiscAmount > 0) {
    grandTotalNum = Math.max(0, subtotalNum - finalDiscAmount + taxAmountNum);
  }

  const customerName = invoice.customerName || (isHindi ? 'सम्मानित ग्राहक' : 'Valued Customer');
  const companyTitle = user?.businessName || 'BILLIE STORE';
  const invoiceNumber = invoice.invoiceNumber || 'INV-001';
  const invoiceDate = invoice.date || new Date().toLocaleDateString();
  const paymentMode = (invoice.paymentMode || invoice.paymentMethod || 'Cash').toUpperCase();

  return (
    <div className="invoice-designer-wrapper animate-slide-up">
      {/* Top Status Notification Bar */}
      <div className="invoice-ready-strip">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            {isDraft
              ? (isHindi ? 'ड्राफ्ट बिल तैयार है' : 'Draft Invoice Preview')
              : (isHindi ? 'बिल सफलतापूर्वक तैयार हो गया है' : 'Invoice Generated Successfully')}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/60">
          {invoiceNumber}
        </span>
      </div>

      {/* Modern Split-Screen Invoice Frame (Matching Reference Image) */}
      <div className="invoice-designer-frame" id="printable-invoice">
        {/* ========================================================
            LEFT SIDEBAR: DARK CHARCOAL WITH CURVED BOTTOM
            ======================================================== */}
        <div className="invoice-designer-sidebar">
          {/* Brand & Logo Cluster */}
          <div className="sidebar-brand-group">
            <div className="sidebar-brand-badge">
              <span>B</span>
            </div>
            <div>
              <h2 className="sidebar-brand-title">{companyTitle}</h2>
              {user?.name && <p className="sidebar-brand-owner">By {user.name}</p>}
            </div>
          </div>

          {/* Invoice To: Customer Information */}
          <div className="sidebar-invoice-to">
            <span className="sidebar-to-label">Invoice To:</span>
            <h3 className="sidebar-customer-name">{customerName}</h3>

            <div className="sidebar-contact-list">
              {invoice.customerPhone && (
                <div className="sidebar-contact-item">
                  <span className="contact-bullet">P :</span>
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.customerEmail && (
                <div className="sidebar-contact-item">
                  <span className="contact-bullet">M :</span>
                  <span className="truncate">{invoice.customerEmail}</span>
                </div>
              )}
              {invoice.customerAddress && (
                <div className="sidebar-contact-item">
                  <span className="contact-bullet">A :</span>
                  <span>{invoice.customerAddress}</span>
                </div>
              )}
              {invoice.customerGst && (
                <div className="sidebar-contact-item">
                  <span className="contact-bullet">GST:</span>
                  <span className="font-mono">{invoice.customerGst}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terracotta Accent Line */}
          <div className="sidebar-terracotta-divider" />

          {/* Payment Method Section */}
          <div className="sidebar-payment-section">
            <h4 className="sidebar-payment-title">Payment Method:</h4>
            <ul className="sidebar-payment-list">
              <li>
                <span className="pay-bullet">•</span>
                <span className="pay-label">Account No :</span>
                <span className="pay-val">{user?.taxId ? `012 ${user.taxId.slice(-4)} 6789` : '012 345 6789'}</span>
              </li>
              <li>
                <span className="pay-bullet">•</span>
                <span className="pay-label">Account Name :</span>
                <span className="pay-val truncate">{companyTitle}</span>
              </li>
              <li>
                <span className="pay-bullet">•</span>
                <span className="pay-label">Bank Details :</span>
                <span className="pay-val">{user?.bankDetails || 'HDFC Bank • UPI Enabled'}</span>
              </li>
              <li>
                <span className="pay-bullet">•</span>
                <span className="pay-label">Pay Mode :</span>
                <span className="pay-badge-mode">{paymentMode}</span>
              </li>
            </ul>
          </div>

          {/* Decorative Dot Matrix on Sidebar */}
          <div className="sidebar-dot-matrix">
            {[...Array(12)].map((_, i) => (
              <span key={i} className="dot-circle" />
            ))}
          </div>
        </div>

        {/* ========================================================
            RIGHT MAIN PANEL: MODERN CLEAN DISPLAY
            ======================================================== */}
        <div className="invoice-designer-main">
          {/* Top Right Decorative Arc & Geometric Icons */}
          <div className="designer-top-arc-graphic" />
          <div className="designer-cross-accent">✕</div>
          <div className="designer-dot-grid-top">
            {[...Array(9)].map((_, i) => (
              <span key={i} className="grid-dot" />
            ))}
          </div>

          {/* Main Header Typography */}
          <div className="designer-header-row">
            <div>
              <h1 className="designer-invoice-title">INVOICE</h1>
              <div className="designer-invoice-meta">
                <span>{isHindi ? 'इनवॉइस संख्या' : 'Invoice No'}: <strong>{invoiceNumber}</strong></span>
                <span>•</span>
                <span>{isHindi ? 'दिनांक' : 'Date'}: <strong>{invoiceDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Total Due Callout Box */}
          <div className="designer-total-due-box">
            <span className="total-due-label">Total Due :</span>
            <div className="total-due-amount">
              INR : {currency} {grandTotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Items Table: Terracotta Pill Header */}
          <div className="designer-table-container">
            <table className="designer-table">
              <thead>
                <tr>
                  <th className="th-qty">{isHindi ? 'मात्रा' : 'Qut'}</th>
                  <th className="th-desc">{isHindi ? 'सामग्री एवं सेवाएं' : 'Product & Services'}</th>
                  <th className="th-amount">{isHindi ? 'रकम' : 'Amout'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = Number(item.quantity) || 1;
                  const price = Number(item.price) || 0;
                  const lineSub = qty * price;
                  const itemDisc = Number(item.discount) || (invoice.discountType === 'percent' ? Number(invoice.discount) || 0 : 0);
                  const discType = item.discountType || invoice.discountType || 'percent';
                  const discAmt = discType === 'percent' ? (lineSub * Math.min(100, itemDisc)) / 100 : itemDisc;
                  const lineTot = Math.max(0, lineSub - discAmt);
                  const rowNum = String(idx + 1).padStart(2, '0');

                  return (
                    <tr key={idx}>
                      <td className="td-qty">
                        <span className="row-num-badge">{rowNum}</span>
                      </td>
                      <td className="td-desc">
                        <div className="item-title-text">{item.name || 'Product Item'}</div>
                        <div className="item-sub-details">
                          {qty} {qty > 1 ? 'units' : 'unit'} @ {currency}{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          {itemDisc > 0 && (
                            <span className="text-amber-600 font-semibold ml-2">
                              ({discType === 'percent' ? `${itemDisc}% OFF` : `-${currency}${itemDisc} OFF`})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="td-amount">
                        {currency} {lineTot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Calculation Summary */}
          <div className="designer-summary-section">
            <div className="summary-lines-group">
              <div className="summary-line">
                <span className="lbl">{isHindi ? 'सबटोटल' : 'Subtotal'} :</span>
                <span className="val">{currency} {subtotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {finalDiscAmount > 0 && (
                <div className="summary-line text-rose-600">
                  <span className="lbl">{isHindi ? 'छूट (Discount)' : 'Discount'} :</span>
                  <span className="val">-{currency} {finalDiscAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {taxAmountNum > 0 && (
                <div className="summary-line">
                  <span className="lbl">Tax [{taxRateNum}%] :</span>
                  <span className="val">+{currency} {taxAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Signature Terracotta Grand Total Pill */}
            <div className="designer-grand-total-pill">
              <span className="gt-label">{isHindi ? 'कुल योग' : 'Grand Total'} :</span>
              <span className="gt-val">{currency} {grandTotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Decorative Divider & Cross */}
          <div className="designer-mid-decor-row">
            <div className="horizontal-decor-bars">
              <span className="decor-bar" />
              <span className="decor-bar" />
              <span className="decor-bar" />
            </div>
            <div className="decor-cross-orange">✕</div>
          </div>

          {/* Footer: Terms & Condition + Authorized Signature */}
          <div className="designer-footer-row">
            <div className="designer-terms-box">
              <h5 className="terms-heading">Term & Condition:</h5>
              <p className="terms-body">
                Payment is due upon receipt. Goods once sold are covered under standard merchant warranty terms. This is a computer-generated tax invoice verified by Billie.
              </p>
              <div className="terms-dot-grid">
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="tiny-dot" />
                ))}
              </div>
            </div>

            {/* Authorized Signature Box */}
            <div className="designer-signature-box">
              <div className="signature-artistic-svg">
                <svg viewBox="0 0 140 45" className="w-28 h-10" fill="none" stroke="currentColor">
                  <path
                    d="M10 32 C 30 10, 45 42, 65 18 C 75 8, 90 28, 105 15 C 115 10, 130 25, 135 12"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-800 dark:text-slate-200"
                  />
                  <path
                    d="M20 22 C 35 35, 70 38, 125 35"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-slate-600 dark:text-slate-400"
                  />
                </svg>
              </div>
              <div className="signature-underline" />
              <span className="signature-label">{isHindi ? 'अधिकृत हस्ताक्षर' : 'Authorized Signatory'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="invoice-actions-bar">
        <button
          type="button"
          onClick={handleDownloadPDF}
          className="m3-button-filled download-pdf-btn m3-ripple"
        >
          <Download size={18} />
          <span>{isHindi ? 'PDF डाउनलोड करें' : 'Download PDF'}</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="m3-button-tonal m3-ripple"
          title="Print or Save via Browser"
        >
          <Printer size={17} />
          <span>{isHindi ? 'प्रिंट करें' : 'Print Invoice'}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="m3-button-text m3-ripple ml-auto"
        >
          <Sparkles size={16} />
          <span>{isHindi ? 'नया बिल बनाएँ' : 'Create Another'}</span>
        </button>
      </div>
    </div>
  );
}
