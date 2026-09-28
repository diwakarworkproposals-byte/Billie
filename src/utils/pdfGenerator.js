import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice, businessInfo = {}, settings = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currency = invoice.currency || settings.currency || '$';
  const primaryColor = [26, 115, 232]; // #1A73E8 Material Blue
  const darkTextColor = [30, 41, 59]; // #1E293B
  const mutedTextColor = [100, 116, 139]; // #64748B
  const lightBg = [248, 250, 252]; // #F8FAFC

  // 1. Top Decorative Banner Accent
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 8, 'F');

  // 2. Header: Brand / Business Name & Invoice Label
  const startY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  
  const companyTitle = businessInfo.businessName || 'Billie Billing';
  doc.text(companyTitle, 14, startY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  
  let currentY = startY + 6;
  if (businessInfo.ownerName) {
    doc.text(`Proprietor: ${businessInfo.ownerName}`, 14, currentY);
    currentY += 5;
  }
  if (businessInfo.address) {
    doc.text(businessInfo.address, 14, currentY);
    currentY += 5;
  }
  if (businessInfo.email || businessInfo.phone) {
    const contact = [businessInfo.email, businessInfo.phone].filter(Boolean).join(' | ');
    doc.text(contact, 14, currentY);
    currentY += 5;
  }
  if (businessInfo.taxId) {
    doc.text(`Tax ID / VAT: ${businessInfo.taxId}`, 14, currentY);
    currentY += 5;
  }

  // Right Side: INVOICE title and metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...darkTextColor);
  doc.text('INVOICE', 196, startY, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(`Invoice No:`, 150, startY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(invoice.invoiceNumber || 'INV-001', 196, startY + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(`Date:`, 150, startY + 14);
  doc.setTextColor(...darkTextColor);
  doc.text(invoice.date || new Date().toLocaleDateString(), 196, startY + 14, { align: 'right' });

  doc.setTextColor(...mutedTextColor);
  doc.text(`Due Date:`, 150, startY + 20);
  doc.setTextColor(...darkTextColor);
  doc.text(invoice.dueDate || 'Upon Receipt', 196, startY + 20, { align: 'right' });

  doc.setTextColor(...mutedTextColor);
  doc.text(`Payment Mode:`, 150, startY + 26);
  doc.setTextColor(...darkTextColor);
  const payModeText = (invoice.paymentMode || invoice.paymentMethod || 'Cash').toUpperCase();
  doc.text(payModeText, 196, startY + 26, { align: 'right' });

  // 3. Bill To Box
  const hasExtraDetails = invoice.customerCompany || invoice.customerGst || invoice.customerAddress;
  const billToHeight = hasExtraDetails ? 32 : 24;
  const billToY = Math.max(currentY + 6, startY + 33);
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, billToY, 182, billToHeight, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, billToY, 182, billToHeight, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('BILLED TO:', 20, billToY + 6);

  doc.setFontSize(12);
  doc.setTextColor(...darkTextColor);
  let nameText = invoice.customerName || 'Valued Customer';
  if (invoice.customerCompany && invoice.customerName !== invoice.customerCompany) {
    nameText += ` (${invoice.customerCompany})`;
  }
  doc.text(nameText, 20, billToY + 12.5);

  let custLineY = billToY + 18;
  const metaParts = [];
  if (invoice.customerPhone) metaParts.push(`Phone: ${invoice.customerPhone}`);
  if (invoice.customerGst) metaParts.push(`GSTIN: ${invoice.customerGst}`);
  if (invoice.customerEmail) metaParts.push(invoice.customerEmail);

  if (metaParts.length > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(metaParts.join('  |  '), 20, custLineY);
    custLineY += 5;
  }

  if (invoice.customerAddress) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(`Address: ${invoice.customerAddress}`, 20, custLineY);
  }

  // 4. Items Table
  const tableStartY = billToY + billToHeight + 6;
  const items = invoice.items && invoice.items.length > 0 
    ? invoice.items 
    : [{
        name: invoice.product || 'Standard Product / Service',
        quantity: invoice.quantity || 1,
        price: invoice.price || 0,
        discount: invoice.discount || 0
      }];

  const tableRows = items.map((item, index) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    const lineSubtotal = qty * price;
    const lineDiscount = discount > 0 
      ? (discount <= 100 && item.discountType === 'percent' ? (lineSubtotal * discount) / 100 : discount)
      : 0;
    const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

    return [
      index + 1,
      item.name || 'Item',
      qty.toString(),
      `${currency} ${price.toFixed(2)}`,
      discount > 0 ? (item.discountType === 'percent' ? `${discount}%` : `${currency} ${discount.toFixed(2)}`) : '-',
      `${currency} ${lineTotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Item & Description', 'Qty', 'Unit Price', 'Discount', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 32 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 35 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: {
      textColor: darkTextColor,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    margin: { left: 14, right: 14 }
  });

  // 5. Summary / Calculation Block
  const finalY = doc.lastAutoTable.finalY + 8;
  const summaryX = 120;
  const valueX = 196;

  const subtotal = invoice.subtotal !== undefined 
    ? Number(invoice.subtotal) 
    : items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);

  const discountVal = invoice.discountAmount !== undefined 
    ? Number(invoice.discountAmount) 
    : (Number(invoice.discount) || 0);

  const taxVal = Number(invoice.taxAmount) || 0;
  const grandTotal = invoice.total !== undefined ? Number(invoice.total) : (subtotal - discountVal + taxVal);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);

  let currentSumY = finalY;

  // Subtotal line
  doc.text('Subtotal:', summaryX, currentSumY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(`${currency} ${subtotal.toFixed(2)}`, valueX, currentSumY, { align: 'right' });
  currentSumY += 6;

  // Discount line
  if (discountVal > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text('Discount:', summaryX, currentSumY);
    doc.setTextColor(220, 38, 38); // Red
    doc.setFont('helvetica', 'bold');
    doc.text(`-${currency} ${discountVal.toFixed(2)}`, valueX, currentSumY, { align: 'right' });
    currentSumY += 6;
  }

  // Tax line
  if (taxVal > 0 || invoice.taxRate) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(`Tax (${invoice.taxRate || 0}%):`, summaryX, currentSumY);
    doc.setTextColor(...darkTextColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${currency} ${taxVal.toFixed(2)}`, valueX, currentSumY, { align: 'right' });
    currentSumY += 6;
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, currentSumY - 1, valueX, currentSumY - 1);
  currentSumY += 3;

  // Grand Total Highlight Box
  doc.setFillColor(238, 242, 255); // Soft indigo-blue fill
  doc.roundedRect(summaryX - 4, currentSumY - 2, (valueX - summaryX) + 8, 12, 2, 2, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', summaryX, currentSumY + 6);
  doc.text(`${currency} ${grandTotal.toFixed(2)}`, valueX, currentSumY + 6, { align: 'right' });

  // 6. Notes & Footer
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 6, 196, footerY - 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Terms & Conditions: Payment is due within standard agreed terms. Thank you for your business!', 14, footerY);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Created with Billie - Offline Voice & Text PWA', 196, footerY, { align: 'right' });

  // Save / Return
  const fileName = `Billie-Invoice-${invoice.invoiceNumber || 'INV'}.pdf`;
  doc.save(fileName);
  return doc;
}
