import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice, businessInfo = {}, settings = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currency = invoice.currency || settings.currency || '₹';
  const currencySymbol = (currency === '₹' || currency === 'Rs') ? 'Rs.' : currency;

  // Designer Color Palette matching reference image
  const darkSidebarBg = [30, 36, 44]; // Deep charcoal #1E242C
  const terracottaColor = [217, 119, 54]; // Warm terracotta / burnt orange #D97736
  const darkTextColor = [30, 41, 59]; // Slate 800 #1E293B
  const mutedTextColor = [100, 116, 139]; // Slate 500 #64748B
  const lightGreyBg = [244, 246, 248]; // Soft light background #F4F6F8
  const whiteColor = [255, 255, 255];

  const sidebarWidth = 66; // mm
  const sidebarHeight = 225; // mm (curved at bottom)
  const pageWidth = 210;
  const pageHeight = 297;

  // 1. Overall page soft background
  doc.setFillColor(...lightGreyBg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. LEFT SIDEBAR (Dark Charcoal with curved bottom-left & bottom-right)
  doc.setFillColor(...darkSidebarBg);
  doc.roundedRect(0, 0, sidebarWidth, sidebarHeight, 0, 18, 'F');

  // Sidebar: Brand / Logo Badge
  const brandTitle = (businessInfo.businessName || 'BILLIE STORE').toUpperCase();
  doc.setFillColor(...terracottaColor);
  doc.circle(18, 22, 6, 'F');
  doc.setTextColor(...whiteColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('B', 16.5, 25.5);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...whiteColor);
  const brandLines = doc.splitTextToSize(brandTitle, 38);
  doc.text(brandLines, 28, 22);

  // Sidebar: "Invoice To:"
  let sideY = 48;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 174, 192); // Muted silver
  doc.text('Invoice To:', 14, sideY);

  sideY += 7;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...whiteColor);
  const custName = invoice.customerName || 'Valued Customer';
  const custLines = doc.splitTextToSize(custName, 42);
  doc.text(custLines, 14, sideY);
  sideY += (custLines.length * 6) + 2;

  // Sidebar: Customer Contact Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Light slate text

  if (invoice.customerPhone) {
    doc.text(`P : ${invoice.customerPhone}`, 14, sideY);
    sideY += 5;
  }
  if (invoice.customerEmail) {
    const emailTrunc = doc.splitTextToSize(`M : ${invoice.customerEmail}`, 44);
    doc.text(emailTrunc, 14, sideY);
    sideY += (emailTrunc.length * 4.5);
  }
  if (invoice.customerAddress) {
    const addrTrunc = doc.splitTextToSize(`A : ${invoice.customerAddress}`, 44);
    doc.text(addrTrunc, 14, sideY);
    sideY += (addrTrunc.length * 4.5);
  }
  if (invoice.customerGst) {
    doc.text(`GST : ${invoice.customerGst}`, 14, sideY);
    sideY += 5;
  }

  // Sidebar: Terracotta Divider Line
  sideY += 4;
  doc.setDrawColor(...terracottaColor);
  doc.setLineWidth(1);
  doc.line(14, sideY, 36, sideY);

  // Sidebar: Payment Method Section
  sideY += 12;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...whiteColor);
  doc.text('Payment Method:', 14, sideY);

  sideY += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const accountNo = businessInfo.taxId ? `012 ${businessInfo.taxId.slice(-4)} 6789` : '012 345 6789';
  const accountHolder = businessInfo.businessName || businessInfo.name || 'Billie Store';
  const bankInfo = businessInfo.bankDetails || 'HDFC Bank (UPI Enabled)';
  const payMode = (invoice.paymentMode || invoice.paymentMethod || 'Cash').toUpperCase();

  doc.setTextColor(160, 174, 192);
  doc.text('• Account No :', 14, sideY);
  doc.setTextColor(...whiteColor);
  doc.text(accountNo, 36, sideY);

  sideY += 5;
  doc.setTextColor(160, 174, 192);
  doc.text('• Name :', 14, sideY);
  doc.setTextColor(...whiteColor);
  const nameTrunc = doc.splitTextToSize(accountHolder, 32);
  doc.text(nameTrunc, 27, sideY);

  sideY += (nameTrunc.length * 4) + 1;
  doc.setTextColor(160, 174, 192);
  doc.text('• Bank Details :', 14, sideY);
  sideY += 4;
  doc.setTextColor(...whiteColor);
  const bankTrunc = doc.splitTextToSize(bankInfo, 44);
  doc.text(bankTrunc, 17, sideY);

  sideY += (bankTrunc.length * 4) + 2;
  doc.setTextColor(160, 174, 192);
  doc.text('• Pay Mode :', 14, sideY);
  doc.setTextColor(...terracottaColor);
  doc.setFont('helvetica', 'bold');
  doc.text(payMode, 34, sideY);

  // Sidebar: Decorative 2x6 dot grid
  const dotStartY = 195;
  doc.setFillColor(...terracottaColor);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      doc.circle(16 + (c * 6), dotStartY + (r * 5), 0.7, 'F');
    }
  }

  // ========================================================
  // 3. RIGHT MAIN CONTENT AREA
  // ========================================================
  const rightStartX = 78;

  // Top Right Decorative Arc (Terracotta / Orange)
  doc.setFillColor(...terracottaColor);
  doc.circle(210, 0, 32, 'F');
  doc.setFillColor(...lightGreyBg);
  doc.circle(210, 0, 18, 'F');

  // Decorative Cross (Orange ✕)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...terracottaColor);
  doc.text('✕', 194, 34);

  // Decorative Dot Matrix 3x3
  doc.setFillColor(180, 190, 200);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      doc.circle(188 + (c * 4), 48 + (r * 4), 0.7, 'F');
    }
  }

  // Giant "INVOICE" Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...darkTextColor);
  doc.text('INVOICE', rightStartX, 28);

  // Metadata Line (Invoice No & Date)
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(`Invoice No: ${invoice.invoiceNumber || 'INV-001'}  •  Date: ${invoice.date || new Date().toLocaleDateString()}`, rightStartX, 35);

  // Prominent Total Due Callout Box
  const subtotal = invoice.subtotal !== undefined
    ? Number(invoice.subtotal)
    : (invoice.items || []).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);

  let discountVal = 0;
  if (invoice.discountAmount !== undefined && Number(invoice.discountAmount) > 0) {
    discountVal = Number(invoice.discountAmount);
  } else if (invoice.totalDiscount !== undefined && Number(invoice.totalDiscount) > 0) {
    discountVal = Number(invoice.totalDiscount);
  } else if (Number(invoice.discount) > 0) {
    if (invoice.discountType === 'percent' || invoice.isPercentDiscount) {
      discountVal = (subtotal * Math.min(100, Number(invoice.discount))) / 100;
    } else {
      discountVal = Math.min(subtotal, Number(invoice.discount));
    }
  }

  const taxVal = Number(invoice.taxAmount) || 0;
  let grandTotal = invoice.total !== undefined ? Number(invoice.total) : (subtotal - discountVal + taxVal);
  if (grandTotal === subtotal && discountVal > 0) {
    grandTotal = Math.max(0, subtotal - discountVal + taxVal);
  }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Total Due :', rightStartX, 48);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(`INR : ${currencySymbol} ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightStartX, 56);

  // ========================================================
  // 4. ITEMS TABLE (Terracotta Pill Header)
  // ========================================================
  const tableStartY = 66;
  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{
        name: invoice.product || 'Standard Item / Service',
        quantity: invoice.quantity || 1,
        price: invoice.price || 0,
        discount: invoice.discount || 0
      }];

  const tableRows = items.map((item, index) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineSubtotal = qty * price;
    const discount = Number(item.discount) || (invoice.discountType === 'percent' ? Number(invoice.discount) || 0 : 0);
    const discType = item.discountType || invoice.discountType || 'percent';
    const lineDiscount = discount > 0
      ? (discType === 'percent' ? (lineSubtotal * Math.min(100, discount)) / 100 : Math.min(lineSubtotal, discount))
      : 0;
    const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

    const rowNum = String(index + 1).padStart(2, '0');
    let descText = item.name || 'Product item';
    if (qty > 1 || price > 0) {
      descText += `\n${qty} unit(s) @ ${currencySymbol} ${price.toFixed(2)}`;
    }
    if (discount > 0) {
      descText += ` (${discType === 'percent' ? `${discount}% OFF` : `-${currencySymbol}${discount} OFF`})`;
    }

    return [
      rowNum,
      descText,
      `${currencySymbol} ${lineTotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['Qut', 'Product & Services', 'Amount']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: terracottaColor,
      textColor: whiteColor,
      fontStyle: 'bold',
      fontSize: 9.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14, fontStyle: 'bold', textColor: mutedTextColor },
      1: { halign: 'left', cellWidth: 78 },
      2: { halign: 'right', cellWidth: 30, fontStyle: 'bold', textColor: darkTextColor }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: darkTextColor,
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { left: rightStartX, right: 14 }
  });

  // ========================================================
  // 5. SUMMARY BLOCK & TERRACOTTA GRAND TOTAL PILL
  // ========================================================
  let finalY = doc.lastAutoTable.finalY + 6;
  const summaryLblX = 140;
  const summaryValX = 196;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);

  // Subtotal
  doc.text('Subtotal :', summaryLblX, finalY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(`${currencySymbol} ${subtotal.toFixed(2)}`, summaryValX, finalY, { align: 'right' });
  finalY += 5;

  // Discount (if any)
  if (discountVal > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    const discLabel = invoice.discountType === 'percent' && Number(invoice.discount) > 0
      ? `Discount [${invoice.discount}%] :`
      : 'Discount :';
    doc.text(discLabel, summaryLblX, finalY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`-${currencySymbol} ${discountVal.toFixed(2)}`, summaryValX, finalY, { align: 'right' });
    finalY += 5;
  }

  // Tax (if any)
  if (taxVal > 0 || invoice.taxRate) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(`Tax [${invoice.taxRate || 0}%] :`, summaryLblX, finalY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkTextColor);
    doc.text(`+${currencySymbol} ${taxVal.toFixed(2)}`, summaryValX, finalY, { align: 'right' });
    finalY += 5;
  }

  finalY += 2;

  // Grand Total Terracotta Pill Banner
  const pillWidth = 74;
  const pillHeight = 10;
  doc.setFillColor(...terracottaColor);
  doc.roundedRect(summaryValX - pillWidth, finalY, pillWidth, pillHeight, 3, 3, 'F');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...whiteColor);
  doc.text('Grand Total :', summaryValX - pillWidth + 5, finalY + 6.8);
  doc.text(`${currencySymbol} ${grandTotal.toFixed(2)}`, summaryValX - 4, finalY + 6.8, { align: 'right' });

  // ========================================================
  // 6. DECORATIVE ELEMENTS & TERMS / SIGNATURE FOOTER
  // ========================================================
  finalY += pillHeight + 12;

  // Decorative Horizontal Triple Bar + Cross
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(rightStartX, finalY, rightStartX + 20, finalY);
  doc.line(rightStartX, finalY + 2, rightStartX + 20, finalY + 2);
  doc.line(rightStartX, finalY + 4, rightStartX + 20, finalY + 4);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...terracottaColor);
  doc.text('✕', rightStartX + 28, finalY + 3);

  finalY += 12;

  // Terms & Conditions Block
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('Term & Condition:', rightStartX, finalY);

  finalY += 5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  const termsText = 'Payment is due upon receipt. Goods once sold are covered under standard merchant warranty terms. This is a computer-generated tax invoice verified by Billie.';
  const termsLines = doc.splitTextToSize(termsText, 66);
  doc.text(termsLines, rightStartX, finalY);

  // Decorative Dot Grid under terms
  const termsDotsY = finalY + (termsLines.length * 4) + 2;
  doc.setFillColor(180, 190, 200);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      doc.circle(rightStartX + (c * 4), termsDotsY + (r * 4), 0.6, 'F');
    }
  }

  // Authorized Signature Block (Right Aligned at bottom)
  const sigX = 158;
  const sigY = finalY - 4;

  // Draw artistic signature curve in jsPDF
  doc.setDrawColor(...darkTextColor);
  doc.setLineWidth(0.8);
  // Signature stroke
  doc.line(sigX - 8, sigY + 8, sigX - 2, sigY + 2);
  doc.line(sigX - 2, sigY + 2, sigX + 6, sigY + 9);
  doc.line(sigX + 6, sigY + 9, sigX + 14, sigY + 3);
  doc.line(sigX + 14, sigY + 3, sigX + 22, sigY + 7);
  doc.line(sigX - 10, sigY + 6, sigX + 30, sigY + 6);

  // Signature Underline
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(sigX - 12, sigY + 12, sigX + 32, sigY + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Authorized Signatory', sigX + 10, sigY + 16, { align: 'center' });

  // Save / Return
  const fileName = `Billie-Invoice-${invoice.invoiceNumber || 'INV'}.pdf`;
  doc.save(fileName);
  return doc;
}
