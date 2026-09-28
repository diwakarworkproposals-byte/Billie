import React from 'react';
import { Download, Printer, Plus, Trash2, Edit3, CheckCircle2, FileText, Sparkles } from 'lucide-react';
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

  const items = invoice.items || [
    {
      name: invoice.product || 'Product/Service',
      quantity: invoice.quantity || 1,
      price: invoice.price || 0,
      discount: invoice.discount || 0,
      lineTotal: invoice.subtotal || 0
    }
  ];

  return (
    <div className="invoice-material-card animate-slide-up">
      {/* Top Banner Status */}
      <div className="card-top-status">
        <div className="status-badge-ready">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>
            {isDraft
              ? (isHindi ? 'ड्राफ्ट बिल गणना' : 'Draft Invoice Calculation')
              : (isHindi ? 'बिल तैयार है (PDF डाउनलोड के लिए तैयार)' : 'Invoice Ready for PDF Download')}
          </span>
        </div>
        <span className="invoice-id-tag">{invoice.invoiceNumber || 'INV-001'}</span>
      </div>

      {/* Invoice Meta Grid */}
      <div className="invoice-meta-grid">
        <div className="meta-col">
          <span className="meta-label">{isHindi ? 'ग्राहक (Billed To)' : 'Billed To'}</span>
          <h3 className="customer-display-name">{invoice.customerName || (isHindi ? 'सम्मानित ग्राहक' : 'Valued Customer')}</h3>
          {invoice.customerCompany && (
            <span className="meta-company font-semibold text-slate-700 dark:text-slate-300 block text-xs mt-0.5">
              🏢 {invoice.customerCompany}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            {invoice.customerPhone && (
              <span className="font-medium text-slate-700 dark:text-slate-300">
                📞 {invoice.customerPhone}
              </span>
            )}
            {invoice.customerGst && (
              <span className="m3-badge-gst font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[11px] border border-blue-200 dark:border-blue-800">
                GSTIN: {invoice.customerGst}
              </span>
            )}
          </div>
          {invoice.customerAddress && (
            <span className="meta-sub block text-[11px] text-slate-400 mt-0.5">
              📍 {invoice.customerAddress}
            </span>
          )}
          {invoice.customerEmail && <span className="meta-sub">{invoice.customerEmail}</span>}
        </div>
        <div className="meta-col text-right">
          <span className="meta-label">{isHindi ? 'दिनांक (Date)' : 'Issue Date'}</span>
          <span className="meta-val">{invoice.date || new Date().toLocaleDateString()}</span>
          <span className="meta-sub">{invoice.dueDate || (isHindi ? 'तुरंत देय' : 'Due on Receipt')}</span>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {invoice.paymentMode ? `💳 ${invoice.paymentMode.toUpperCase()}` : '💵 CASH'}
          </span>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="items-table-wrapper">
        <table className="material-table">
          <thead>
            <tr>
              <th>{isHindi ? 'विवरण (Item)' : 'Item / Service'}</th>
              <th className="text-center">{isHindi ? 'मात्रा' : 'Qty'}</th>
              <th className="text-right">{isHindi ? 'दर (Price)' : 'Price'}</th>
              <th className="text-right">{isHindi ? 'छूट' : 'Discount'}</th>
              <th className="text-right">{isHindi ? 'कुल' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;
              const disc = Number(item.discount) || 0;
              const sub = qty * price;
              const discAmount = item.discountType === 'percent'
                ? (sub * disc) / 100
                : disc;
              const lineTot = Math.max(0, sub - discAmount);

              return (
                <tr key={idx}>
                  <td>
                    <div className="item-name-cell">
                      <span className="item-title">{item.name || 'Service item'}</span>
                    </div>
                  </td>
                  <td className="text-center font-medium">{qty}</td>
                  <td className="text-right">{currency} {price.toFixed(2)}</td>
                  <td className="text-right text-amber-600">
                    {disc > 0 ? (item.discountType === 'percent' ? `${disc}%` : `${currency} ${disc}`) : '-'}
                  </td>
                  <td className="text-right font-semibold">{currency} {lineTot.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Calculation Summary Block */}
      <div className="calculation-summary-container">
        <div className="calc-row">
          <span className="calc-label">{isHindi ? 'सबटोटल (Subtotal)' : 'Subtotal'}</span>
          <span className="calc-value">{currency} {(Number(invoice.subtotal) || 0).toFixed(2)}</span>
        </div>

        {(Number(invoice.discountAmount) > 0 || Number(invoice.discount) > 0) && (
          <div className="calc-row text-rose-500">
            <span className="calc-label">{isHindi ? 'कुल छूट (Discount)' : 'Total Discount'}</span>
            <span className="calc-value">
              -{currency} {(Number(invoice.discountAmount || invoice.discount) || 0).toFixed(2)}
            </span>
          </div>
        )}

        {Number(invoice.taxAmount) > 0 && (
          <div className="calc-row">
            <span className="calc-label">{isHindi ? `टैक्स / GST (${invoice.taxRate || 0}%)` : `Tax (${invoice.taxRate || 0}%)`}</span>
            <span className="calc-value">+{currency} {(Number(invoice.taxAmount) || 0).toFixed(2)}</span>
          </div>
        )}

        <div className="calc-divider" />

        <div className="calc-row grand-total-row">
          <span className="total-label">{isHindi ? 'कुल योग (Grand Total)' : 'Grand Total'}</span>
          <span className="total-amount">
            {currency} {(Number(invoice.total || invoice.grandTotal) || 0).toFixed(2)}
          </span>
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
          <span>{isHindi ? 'प्रिंट' : 'Print'}</span>
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
