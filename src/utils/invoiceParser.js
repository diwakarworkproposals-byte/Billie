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

// Hindi Devanagari to ASCII digits mapping
const HINDI_DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

// Word numbers dictionary covering Devanagari, Romanized Hindi (Hinglish), and English
const WORD_NUMBERS = {
  // Devanagari numbers
  'शून्य': 0, 'सिफर': 0,
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'छः': 6, 'छे': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'इक्कीस': 21, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24, 'पच्चीस': 25,
  'तीस': 30, 'चालीस': 40, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
  'सौ': 100, 'हजार': 1000, 'हज़ार': 1000, 'लाख': 100000,

  // Hinglish / Romanized Hindi numbers
  'zero': 0, 'shunya': 0,
  'ek': 1,
  'do': 2,
  'teen': 3, 'tin': 3,
  'char': 4, 'chaar': 4,
  'panch': 5, 'paanch': 5,
  'chhe': 6, 'che': 6, 'chha': 6,
  'saat': 7, 'sat': 7,
  'aath': 8, 'ath': 8,
  'nau': 9, 'no': 9,
  'das': 10, 'dus': 10,
  'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15,
  'solah': 16, 'satrah': 17, 'atharah': 18, 'unnees': 19, 'unnis': 19,
  'bees': 20, 'pachees': 25, 'pachis': 25, 'tees': 30, 'chalis': 40,
  'pachas': 50, 'sau': 100, 'hazar': 1000, 'hazaar': 1000, 'darjan': 12,

  // English word numbers
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'dozen': 12, 'hundred': 100, 'thousand': 1000
};

// Robust function to extract numbers from any spoken or typed text
export function extractNumber(text = '', defaultVal = 1) {
  if (typeof text === 'number') return isNaN(text) ? defaultVal : text;
  if (!text || typeof text !== 'string') return defaultVal;

  // 1. Convert Devanagari numerals to ASCII (e.g. '३' -> '3', '५००' -> '500')
  let normalized = text.replace(/[०-९]/g, (d) => HINDI_DEVANAGARI_DIGITS[d] || d).toLowerCase().trim();

  // 2. Direct regex match for ASCII digits (e.g. '3', '4.5', '5 piece', '₹500')
  const digitMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    const parsed = parseFloat(digitMatch[1]);
    if (!isNaN(parsed)) return parsed;
  }

  // 3. Word token matching for Hindi/English words
  const words = normalized.split(/[\s,.-]+/);
  let total = 0;
  let currentGroup = 0;
  let foundAny = false;

  for (const w of words) {
    if (WORD_NUMBERS[w] !== undefined) {
      foundAny = true;
      const val = WORD_NUMBERS[w];
      if (val === 100 || val === 1000 || val === 100000) {
        currentGroup = (currentGroup === 0 ? 1 : currentGroup) * val;
        total += currentGroup;
        currentGroup = 0;
      } else {
        currentGroup += val;
      }
    }
  }
  total += currentGroup;

  return foundAny ? total : defaultVal;
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
    'teen', 'chaar', 'paanch', 'chhe', 'saat', 'aath', 'nau', 'das',
    'बिल', 'बनाओ', 'क्या', 'नाम', 'कितना', 'कितनी', 'कीमत', 'है', 'और', 'हाँ', 'नहीं', 'तीन', 'चार', 'पांच', 'पाँच'
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

  // 2. Quantity & Product extraction
  const qtyProductMatch = 
    str.match(/(\d+|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|ek|do|teen|char|chaar|panch|paanch|chhe|saat|aath|nau|das)\s*(?:x|\s+units?\s+of|\s+pieces?\s+of|\s+piece|\s+nag|\s+)\s*([A-Za-z0-9\s-]+?)(?:\s+(?:at|@|for|me|mein|costing|price|rate|with|discount|$))/i);

  if (qtyProductMatch) {
    result.quantity = extractNumber(qtyProductMatch[1], 1);
    result.product = qtyProductMatch[2].trim();
  } else {
    const prodMatch = str.match(/product\s+([A-Za-z0-9\s-]+?)(?:,|\s+qty|\s+price|\s+with|$)/i);
    if (prodMatch) result.product = prodMatch[1].trim();
    const qtyMatch = str.match(/(?:quantity|qty|piece)\s+([A-Za-z0-9\s]+)/i);
    if (qtyMatch) result.quantity = extractNumber(qtyMatch[1], 1);
  }

  // 3. Price extraction
  const priceMatch = str.match(/(?:at|@|price|cost|rate|for|me|mein)\s*[$₹€£]?\s*([0-9A-Za-z\s]+?)(?:,|\s+with|\s+discount|$)/i);
  if (priceMatch) {
    result.price = extractNumber(priceMatch[1], 0);
  }

  // 4. Discount extraction
  const discountMatch = str.match(/(?:discount|off|chhut)\s*[$₹€£]?\s*([0-9A-Za-z\s]+?)(%)?/i) ||
                        str.match(/([0-9A-Za-z\s]+?)(%)?\s*(?:discount|off|chhut)/i);
  if (discountMatch) {
    result.discount = extractNumber(discountMatch[1], 0);
    if (discountMatch[2] === '%' || str.includes(`${result.discount}%`)) {
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
    ask_quantity: (product) => `"${product}" kitna piece ya quantity chahiye? (jaise 1, 2, 3, 4, 5...)`,
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
      quantity: "Quantity / piece bataiye (jaise 3, 4, 5, 'teen', 'char')...",
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
