export function calculateInvoiceTotals(items, defaultTaxRate = 0) {
  let subtotal = 0;
  let totalDiscount = 0;

  const processedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.price) || 0);
    const lineSubtotal = qty * unitPrice;

    let discountVal = Number(item.discount) || 0;
    let lineDiscount = 0;

    if (item.discountType === 'percent' || item.isPercentDiscount) {
      lineDiscount = (lineSubtotal * Math.min(100, Math.max(0, discountVal))) / 100;
    } else {
      lineDiscount = Math.min(lineSubtotal, Math.max(0, discountVal));
    }

    const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

    subtotal += lineSubtotal;
    totalDiscount += lineDiscount;

    return {
      ...item,
      quantity: qty,
      price: unitPrice,
      subtotal: lineSubtotal,
      lineDiscount,
      lineTotal
    };
  });

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxRate = Number(defaultTaxRate) || 0;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;

  return {
    items: processedItems,
    subtotal,
    totalDiscount,
    taxRate,
    taxAmount,
    grandTotal
  };
}

// Check if string contains invoice trigger intent
export function isInvoiceIntent(text = '') {
  const normalized = text.toLowerCase().trim();
  const triggers = [
    'generate invoice',
    'create invoice',
    'new invoice',
    'make invoice',
    'start invoice',
    'bill',
    'generate bill',
    'create bill',
    'new bill',
    'make bill',
    'invoice customer',
    'bill customer'
  ];

  return triggers.some((t) => normalized.includes(t)) || 
         (normalized.startsWith('invoice') && normalized.length > 7);
}

// Attempt to extract one-shot information from a sentence like:
// "generate invoice for Acme Corp, 2 Laptops at 1200 with 10% discount"
// "invoice John Doe 5 Books at 20"
export function parseOneShotInvoice(text = '') {
  const str = text.trim();
  const result = {
    customerName: '',
    product: '',
    quantity: 1,
    price: 0,
    discount: 0,
    discountType: 'percent',
    hasFullDetails: false
  };

  // 1. Customer extraction ("for [Customer Name], ..." or "to [Customer Name], ...")
  const forMatch = str.match(/(?:for|to|customer)\s+([A-Za-z0-9\s&.'-]+?)(?:,|\s+with|\s+product|\s+\d+\s+|$)/i);
  if (forMatch && forMatch[1]) {
    result.customerName = forMatch[1].trim();
  }

  // 2. Quantity & Product extraction ("2 Laptops" or "qty 2 of Laptops" or "3x items")
  const qtyProductMatch = str.match(/(\d+)\s*(?:x|\s+units?\s+of|\s+pieces?\s+of|\s+)\s*([A-Za-z0-9\s-]+?)(?:\s+(?:at|@|for|costing|price|with|discount|$))/i);
  if (qtyProductMatch) {
    result.quantity = Number(qtyProductMatch[1]) || 1;
    result.product = qtyProductMatch[2].trim();
  } else {
    // Check if product is explicitly labeled
    const prodMatch = str.match(/product\s+([A-Za-z0-9\s-]+?)(?:,|\s+qty|\s+price|\s+with|$)/i);
    if (prodMatch) result.product = prodMatch[1].trim();
    const qtyMatch = str.match(/(?:quantity|qty)\s+(\d+)/i);
    if (qtyMatch) result.quantity = Number(qtyMatch[1]) || 1;
  }

  // 3. Price extraction ("at $1200", "@ 50", "price 100", "costing 99")
  const priceMatch = str.match(/(?:at|@|price|cost|for)\s*[$₹€£]?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    result.price = Number(priceMatch[1]) || 0;
  }

  // 4. Discount extraction ("with 10% discount", "discount 50", "15% off")
  const discountMatch = str.match(/(?:discount|off)\s*[$₹€£]?\s*(\d+(?:\.\d+)?)\s*(%)?/i) ||
                        str.match(/(\d+(?:\.\d+)?)\s*(%)?\s*(?:discount|off)/i);
  if (discountMatch) {
    result.discount = Number(discountMatch[1]) || 0;
    if (discountMatch[2] === '%' || str.includes(`${discountMatch[1]}%`)) {
      result.discountType = 'percent';
    } else {
      result.discountType = 'flat';
    }
  }

  // Check if we extracted enough info to skip or pre-fill
  if (result.customerName && result.product && result.price > 0) {
    result.hasFullDetails = true;
  }

  return result;
}
