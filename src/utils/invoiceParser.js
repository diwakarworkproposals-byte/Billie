// Calculation engine
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

// Hindi & English Trigger Detection
export function isInvoiceIntent(text = '') {
  const normalized = text.toLowerCase().trim();

  const hindiTriggers = [
    'bill banao',
    'bill bana do',
    'bill bana',
    'bill banaye',
    'bill banana hai',
    'naya bill',
    'naya bill banao',
    'naya bill banana',
    'invoice banao',
    'invoice banaye',
    'invoice banado',
    'invoice banana hai',
    'parchi banao',
    'parcha banao',
    'rasid banao',
    'khata banao',
    'hisab banao',
    'bill generate karo',
    'बिल बनाओ',
    'नया बिल',
    'इन्वॉइस बनाओ',
    'पर्ची बनाओ',
    'रसीद बनाओ'
  ];

  const englishTriggers = [
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

  const allTriggers = [...hindiTriggers, ...englishTriggers];

  return allTriggers.some((t) => normalized.includes(t)) || 
         (normalized.startsWith('invoice') && normalized.length > 7);
}

// Detect if query was initiated in Hindi
export function detectLanguage(text = '') {
  const normalized = text.toLowerCase().trim();
  const hindiIndicators = [
    'banao', 'banaye', 'chahiye', 'kya', 'naam', 'kitna', 'kitni', 'keemat', 'hai', 'aur', 'ha', 'haan', 'nahi', 'karo', 'parcha', 'parchi', 'rasid', 'rupaye', 'ka', 'ki', 'ke',
    'बिल', 'बनाओ', 'क्या', 'नाम', 'कितना', 'कितनी', 'कीमत', 'है', 'और', 'हाँ', 'नहीं'
  ];

  const isHindi = hindiIndicators.some((word) => normalized.includes(word));
  return isHindi ? 'hi' : 'en';
}

// Affirmative detection ("haan", "yes", "aur add karo", etc.)
export function isAffirmative(text = '') {
  const norm = text.toLowerCase().trim();
  const affirmativeWords = [
    'haan', 'ha', 'haa', 'yes', 'yup', 'yeah', 'sure', 'aur', 'aur add karo', 'aur jodo', 'aur hai', 'ek aur', 'ek aur item', 'aur item', 'add karo', 'add another', 'more',
    'हाँ', 'हां', 'और', 'और जोड़ो', 'एक और'
  ];

  return affirmativeWords.some((w) => norm === w || norm.startsWith(w));
}

// Negative / Done detection ("nahi", "no", "bas", "khatam", etc.)
export function isNegative(text = '') {
  const norm = text.toLowerCase().trim();
  const negativeWords = [
    'nahi', 'na', 'nahin', 'no', 'nope', 'nah', 'bas', 'done', 'ho gaya', 'khatam', 'aur nahi', 'nahi chahiye', 'bas itna hi', 'stop', 'finish',
    'नहीं', 'बस', 'हो गया', 'खत्म'
  ];

  return negativeWords.some((w) => norm === w || norm.startsWith(w));
}

// Natural Language One-Shot Extractor (Hindi & English)
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

  // 1. Customer extraction ("for [Name]", "to [Name]", "[Name] ke liye", "customer [Name]")
  const custMatch = 
    str.match(/(?:for|to|customer)\s+([A-Za-z0-9\s&.'-]+?)(?:,|\s+with|\s+product|\s+ke\s+liye|\s+\d+\s+|$)/i) ||
    str.match(/([A-Za-z0-9\s&.'-]+?)\s+(?:ke\s+liye|ka\s+bill)/i);

  if (custMatch && custMatch[1]) {
    result.customerName = custMatch[1].trim();
  }

  // 2. Quantity & Product extraction ("2 Laptops", "5 books", "2 piece shirt")
  const qtyProductMatch = 
    str.match(/(\d+)\s*(?:x|\s+units?\s+of|\s+pieces?\s+of|\s+piece|\s+nag|\s+)\s*([A-Za-z0-9\s-]+?)(?:\s+(?:at|@|for|me|mein|costing|price|rate|with|discount|$))/i);

  if (qtyProductMatch) {
    result.quantity = Number(qtyProductMatch[1]) || 1;
    result.product = qtyProductMatch[2].trim();
  } else {
    const prodMatch = str.match(/product\s+([A-Za-z0-9\s-]+?)(?:,|\s+qty|\s+price|\s+with|$)/i);
    if (prodMatch) result.product = prodMatch[1].trim();
    const qtyMatch = str.match(/(?:quantity|qty|piece)\s+(\d+)/i);
    if (qtyMatch) result.quantity = Number(qtyMatch[1]) || 1;
  }

  // 3. Price extraction ("at 1200", "@ 500", "price 100", "1200 me", "rate 50")
  const priceMatch = str.match(/(?:at|@|price|cost|rate|for|me|mein)\s*[$₹€£]?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    result.price = Number(priceMatch[1]) || 0;
  }

  // 4. Discount extraction ("with 10% discount", "discount 50", "15% off", "10% chhut")
  const discountMatch = str.match(/(?:discount|off|chhut)\s*[$₹€£]?\s*(\d+(?:\.\d+)?)\s*(%)?/i) ||
                        str.match(/(\d+(?:\.\d+)?)\s*(%)?\s*(?:discount|off|chhut)/i);
  if (discountMatch) {
    result.discount = Number(discountMatch[1]) || 0;
    if (discountMatch[2] === '%' || str.includes(`${discountMatch[1]}%`)) {
      result.discountType = 'percent';
    } else {
      result.discountType = 'flat';
    }
  }

  if (result.customerName && result.product && result.price > 0) {
    result.hasFullDetails = true;
  }

  return result;
}

// Multilingual Prompt Templates
export const PROMPTS = {
  hi: {
    welcome: "नमस्ते! मैं Billie हूँ, आपका वॉइस और टेक्स्ट इनवॉइस असिस्टेंट। बिल बनाने के लिए बोलें या लिखें: 'bill banao'.",
    ask_customer: "Customer ka naam batao (kiske naam pe bill banana hai)?",
    ask_product: "Kya product hai?",
    ask_quantity: (product) => `"${product}" kitna piece ya quantity chahiye? (jaise 1, 2, 5)`,
    ask_price: (product) => `"${product}" ka per piece price / keemat kitni hai?`,
    ask_more_items: "Aur kuch add karna hai? ('haan' ya 'nahi' bolein)",
    ask_next_product: "Agla product kya hai?",
    ask_discount: "Koi discount dena hai? (jaise '10%' ya flat amount, ya '0' bolein)",
    item_added: (name, qty, price, currency) => `✓ ${qty}x ${name} (${currency}${price}) add ho gaya.`,
    invoice_ready: (invoiceNum, cust, subtotal, discount, total, currency) => 
      `✨ ${cust} ka bill taiyar hai! Subtotal: ${currency}${subtotal}, Discount: -${currency}${discount}, Total: ${currency}${total}. Ab aap PDF download kar sakte hain.`,
    cancelled: "Bill cancel ho gaya hai. Dobara 'bill banao' bolein jab bhi zaroorat ho.",
    hints: {
      idle: "Billie se bolein: 'bill banao' ya mic dabayein...",
      customer: "Customer ka naam bataiye (jaise 'Ramesh Kumar')...",
      product: "Product ka naam bataiye (jaise 'Shirt' ya 'Laptop')...",
      quantity: "Quantity / piece bataiye (jaise 2, 5)...",
      price: "Price / rate bataiye (jaise 500, 1200)...",
      more_items: "'haan' ya 'nahi' bolein...",
      discount: "Discount bataiye (jaise 10% ya 0)..."
    }
  },
  en: {
    welcome: "Hello! I'm Billie, your voice & text invoice assistant. Say or type 'generate invoice' to create a bill.",
    ask_customer: "Who is the customer? (Please state or type customer name)",
    ask_product: "What product or service is this for?",
    ask_quantity: (product) => `How many units or pieces of "${product}"? (e.g. 1, 2, 5)`,
    ask_price: (product) => `What is the price per unit for "${product}"?`,
    ask_more_items: "Would you like to add another item? (say 'yes' or 'no')",
    ask_next_product: "What is the next product or service?",
    ask_discount: "Any discount to apply? (e.g. '10%' or flat amount, or say '0' for none)",
    item_added: (name, qty, price, currency) => `✓ Added ${qty}x ${name} (${currency}${price}).`,
    invoice_ready: (invoiceNum, cust, subtotal, discount, total, currency) => 
      `✨ Invoice ${invoiceNum} generated for ${cust}! Subtotal: ${currency}${subtotal}, Discount: -${currency}${discount}, Total: ${currency}${total}. You can now download the PDF.`,
    cancelled: "Cancelled. Say or type 'generate invoice' whenever you're ready!",
    hints: {
      idle: "Ask Billie or type 'generate invoice' / 'bill banao'...",
      customer: "Say or type Customer Name (e.g. 'Acme Corp')...",
      product: "Say or type Product name (e.g. 'Website Design')...",
      quantity: "Say or type Quantity (e.g. '2' or '5')...",
      price: "Say or type Unit Price (e.g. '500')...",
      more_items: "Say 'yes' to add more or 'no' to finish...",
      discount: "Say or type Discount (e.g. '10%' or '0')..."
    }
  }
};
