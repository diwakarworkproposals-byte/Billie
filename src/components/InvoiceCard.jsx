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
  const currency = invoice.currency || settings.currency || '$';

  const handleDownloadPDF = () => {
    // Save to history if not yet saved
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
          <span>{isDraft ? 'Draft Invoice Calculation' : 'Invoice Ready for PDF Download'}</span>
        </div>
        <span className="invoice-id-tag">{invoice.invoiceNumber || 'INV-001'}</span>
      </div>

      {/* Invoice Meta Grid */}
      <div className="invoice-meta-grid">
        <div className="meta-col">
          <span className="meta-label">Billed To</span>
          <h3 className="customer-display-name">{invoice.customerName || 'Valued Customer'}</h3>
          {invoice.customerEmail && <span className="meta-sub">{invoice.customerEmail}</span>}
        </div>
        <div className="meta-col text-right">
          <span className="meta-label">Issue Date</span>
          <span className="meta-val">{invoice.date || new Date().toLocaleDateString()}</span>
          <span className="meta-sub">Terms: {invoice.dueDate || 'Due on Receipt'}</span>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="items-table-wrapper">
        <table className="material-table">
          <thead>
            <tr>
              <th>Item / Service</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Discount</th>
              <th className="text-right">Total</th>
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
                  <td className="text-center">{qty}</td>
                  <td className="text-right">{currency} {price.toFixed(2)}</td>
                  <td className="text-right text-amber-600">
                    {disc > 0 ? (item.discountType === 'percent' ? `${disc}%` : `${currency} ${disc}`) : '-'}
                  </td>
                  <td className="text-right font-medium">{currency} {lineTot.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Calculation Summary Block */}
      <div className="calculation-summary-container">
        <div className="calc-row">
          <span className="calc-label">Subtotal</span>
          <span className="calc-value">{currency} {(Number(invoice.subtotal) || 0).toFixed(2)}</span>
        </div>

        {(Number(invoice.discountAmount) > 0 || Number(invoice.discount) > 0) && (
          <div className="calc-row text-rose-500">
            <span className="calc-label">Total Discount</span>
            <span className="calc-value">
              -{currency} {(Number(invoice.discountAmount || invoice.discount) || 0).toFixed(2)}
            </span>
          </div>
        )}

        {Number(invoice.taxAmount) > 0 && (
          <div className="calc-row">
            <span className="calc-label">Tax ({invoice.taxRate || 0}%)</span>
            <span className="calc-value">+{currency} {(Number(invoice.taxAmount) || 0).toFixed(2)}</span>
          </div>
        )}

        <div className="calc-divider" />

        <div className="calc-row grand-total-row">
          <span className="total-label">Grand Total</span>
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
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="m3-button-tonal m3-ripple"
          title="Print or Save via Browser"
        >
          <Printer size={17} />
          <span>Print</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="m3-button-text m3-ripple ml-auto"
        >
          <Sparkles size={16} />
          <span>Create Another</span>
        </button>
      </div>
    </div>
  );
}
