// Calculation engine
export function calculateInvoiceTotals(
  items = [],
  defaultTaxRate = 0,
  overallDiscount = 0,
  overallDiscountType = 'percent'
) {
  let subtotal = 0;
  let itemLevelDiscountSum = 0;

  // First pass: Calculate subtotal and any item-level discounts
  items.forEach((item) => {
    const qty = Math.max(0, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.price) || 0);
    const lineSub = qty * unitPrice;
    subtotal += lineSub;

    const discVal = Number(item.discount) || 0;
    if (discVal > 0) {
      if (item.discountType === 'percent' || item.isPercentDiscount) {
        itemLevelDiscountSum += (lineSub * Math.min(100, discVal)) / 100;
      } else {
        itemLevelDiscountSum += Math.min(lineSub, discVal);
      }
    }
  });

  const parsedOverallDisc = Math.max(0, Number(overallDiscount) || 0);
  const hasOverallDiscount = parsedOverallDisc > 0;
  const isPercent = overallDiscountType === 'percent';

  let totalDiscount = 0;
  if (hasOverallDiscount) {
    if (isPercent) {
      totalDiscount = (subtotal * Math.min(100, parsedOverallDisc)) / 100;
    } else {
      totalDiscount = Math.min(subtotal, parsedOverallDisc);
    }
  } else {
    totalDiscount = itemLevelDiscountSum;
  }

  // Second pass: Process each item with correct discount & lineTotal
  const processedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.price) || 0);
    const lineSubtotal = qty * unitPrice;

    let itemDisc = Number(item.discount) || 0;
    let itemDiscType = item.discountType || 'percent';
    let lineDiscount = 0;

    if (hasOverallDiscount) {
      if (isPercent) {
        itemDisc = parsedOverallDisc;
        itemDiscType = 'percent';
        lineDiscount = (lineSubtotal * Math.min(100, itemDisc)) / 100;
      } else {
        lineDiscount = subtotal > 0 ? (lineSubtotal / subtotal) * totalDiscount : 0;
        itemDisc = lineDiscount;
        itemDiscType = 'flat';
      }
    } else if (itemDisc > 0) {
      if (itemDiscType === 'percent' || item.isPercentDiscount) {
        lineDiscount = (lineSubtotal * Math.min(100, itemDisc)) / 100;
      } else {
        lineDiscount = Math.min(lineSubtotal, itemDisc);
      }
    }

    const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

    return {
      ...item,
      quantity: qty,
      price: unitPrice,
      discount: itemDisc,
      discountType: itemDiscType,
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
    discount: parsedOverallDisc,
    discountType: overallDiscountType || 'percent',
    totalDiscount,
    discountAmount: totalDiscount,
    taxRate,
    taxAmount,
    grandTotal
  };
}

// Hindi Devanagari to ASCII digits mapping
export const HINDI_DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

// Common Devanagari Product Name to Standard Product Mapping
export const DEVANAGARI_PRODUCT_MAP = {
  'जींस': 'Jeans', 'जीन्स': 'Jeans',
  'शर्ट': 'Shirt',
  'टीशर्ट': 'T-Shirt', 'टी-शर्ट': 'T-Shirt', 'टी शर्ट': 'T-Shirt',
  'पैंट': 'Pant', 'पेंट': 'Pant', 'पेंट्स': 'Pants', 'ट्राउजर': 'Trouser',
  'कुर्ता': 'Kurta', 'कुर्ती': 'Kurti',
  'साड़ी': 'Saree', 'साड़ी': 'Saree', 'सूट': 'Suit',
  'दुपट्टा': 'Dupatta', 'लहंगा': 'Lehenga', 'जैकेट': 'Jacket',
  'स्वेटर': 'Sweater', 'कोट': 'Coat',
  'जूते': 'Shoes', 'जूता': 'Shoes', 'चप्पल': 'Slippers', 'सैंडल': 'Sandals',
  'मोजे': 'Socks', 'बेल्ट': 'Belt', 'लेदर बेल्ट': 'Leather Belt',
  'टोपी': 'Cap', 'चश्मा': 'Glasses',
  'घड़ी': 'Watch', 'मोबाइल': 'Mobile', 'फोन': 'Phone', 'लैपटॉप': 'Laptop',
  'बैग': 'Bag', 'पर्स': 'Purse',
  'चावल': 'Rice', 'दाल': 'Dal', 'चीनी': 'Sugar', 'चाय': 'Tea',
  'कॉफी': 'Coffee', 'दूध': 'Milk', 'तेल': 'Oil', 'घी': 'Ghee',
  'साबुन': 'Soap', 'सर्फ': 'Detergent'
};

// Word numbers dictionary covering Devanagari, Romanized Hindi (Hinglish), and English
const WORD_NUMBERS = {
  // Devanagari numbers
  'शून्य': 0, 'सिफर': 0,
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'छः': 6, 'छे': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'पन्द्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'इक्कीस': 21, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24, 'पच्चीस': 25,
  'छब्बीस': 26, 'सत्ताईस': 27, 'अट्ठाईस': 28, 'उनतीस': 29,
  'तीस': 30, 'इकतीस': 31, 'बत्तीस': 32, 'पैंतीस': 35,
  'चालीस': 40, 'पैंतालीस': 45, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
  'सौ': 100, 'हजार': 1000, 'हज़ार': 1000, 'लाख': 100000, 'करोड़': 10000000,
  'दर्जन': 12,

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

// Converts spoken Hindi/English/Hinglish numbers into numeric digits
export function convertSpokenNumbersToDigits(text = '') {
  if (!text || typeof text !== 'string') return text;
  let str = text;

  // 1. Devanagari digits to ASCII digits (०-९ -> 0-9)
  str = str.replace(/[०-९]/g, (d) => HINDI_DEVANAGARI_DIGITS[d] || d);

  // 2. Protect Hindi verb phrases ending in "दो" / "do" so they are never parsed as number 2
  str = str.replace(/(?<![\p{L}\p{N}])(?:बना|कर|दे|काट|जोड़|भेज|दिखा|लगा)\s+दो(?![\p{L}\p{N}])/gu, (m) => m.replace(/\s+दो/, '_VDO_TOKEN'));
  str = str.replace(/(?<![\p{L}\p{N}])(?:bana|kar|de|kaat|jod|bhej|dikha|laga)\s+do(?![\p{L}\p{N}])/gui, (m) => m.replace(/\s+do/i, '_VDO_TOKEN'));

  // 3. Spoken fractions & special Hindi compound scales (e.g. "डेढ़ हजार" -> 1500, "ढाई सौ" -> 250)
  const FRACTIONS = [
    [/(?<![\p{L}\p{N}])(?:डेढ़|देढ़)\s*(?:हजार|हज़ार|hazar|k)(?![\p{L}\p{N}])/gui, ' 1500 '],
    [/(?<![\p{L}\p{N}])(?:ढाई|धाई)\s*(?:हजार|हज़ार|hazar|k)(?![\p{L}\p{N}])/gui, ' 2500 '],
    [/(?<![\p{L}\p{N}])साढ़े\s*तीन\s*(?:हजार|हज़ार|hazar|k)(?![\p{L}\p{N}])/gui, ' 3500 '],
    [/(?<![\p{L}\p{N}])साढ़े\s*चार\s*(?:हजार|हज़ार|hazar|k)(?![\p{L}\p{N}])/gui, ' 4500 '],
    [/(?<![\p{L}\p{N}])साढ़े\s*पांच\s*(?:हजार|हज़ार|hazar|k)(?![\p{L}\p{N}])/gui, ' 5500 '],
    [/(?<![\p{L}\p{N}])साढ़े\s*पाँच\s*(?:हजार|हज़ार|hazar|k)(?![\p{L}\p{N}])/gui, ' 5500 '],
    [/(?<![\p{L}\p{N}])dedh\s*(?:hazar|k)(?![\p{L}\p{N}])/gui, ' 1500 '],
    [/(?<![\p{L}\p{N}])dhai\s*(?:hazar|k)(?![\p{L}\p{N}])/gui, ' 2500 '],
    [/(?<![\p{L}\p{N}])(?:डेढ़|देढ़)\s*(?:सौ|sau)(?![\p{L}\p{N}])/gui, ' 150 '],
    [/(?<![\p{L}\p{N}])(?:ढाई|धाई)\s*(?:सौ|sau)(?![\p{L}\p{N}])/gui, ' 250 '],
    [/(?<![\p{L}\p{N}])साढ़े\s*तीन\s*(?:सौ|sau)(?![\p{L}\p{N}])/gui, ' 350 '],
    [/(?<![\p{L}\p{N}])साढ़े\s*चार\s*(?:सौ|sau)(?![\p{L}\p{N}])/gui, ' 450 '],
    [/(?<![\p{L}\p{N}])साढ़े\s*पांच\s*(?:सौ|sau)(?![\p{L}\p{N}])/gui, ' 550 '],
    [/(?<![\p{L}\p{N}])dedh\s*sau(?![\p{L}\p{N}])/gui, ' 150 '],
    [/(?<![\p{L}\p{N}])dhai\s*sau(?![\p{L}\p{N}])/gui, ' 250 '],
    [/(?<![\p{L}\p{N}])(?:डेढ़|देढ़)\s*(?:लाख|lakh)(?![\p{L}\p{N}])/gui, ' 150000 '],
    [/(?<![\p{L}\p{N}])(?:ढाई|धाई)\s*(?:लाख|lakh)(?![\p{L}\p{N}])/gui, ' 250000 ']
  ];
  FRACTIONS.forEach(([pat, rep]) => {
    str = str.replace(pat, rep);
  });

  // 4. Standalone Multipliers: "हजार", "सौ", "लाख" when spoken without preceding number (e.g. "प्राइस हजार रुपए")
  str = str.replace(/(?<![\p{L}\p{N}])(?:हजार|हज़ार)(?![\p{L}\p{N}])/gui, (m, offset, full) => {
    const before = full.slice(0, offset).trim();
    if (/(?:\d+|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|ग्यारह|बारह|बीस|पचास|ek|do|teen|char|panch)$/i.test(before)) {
      return m;
    }
    return ' 1000 ';
  });

  str = str.replace(/(?<![\p{L}\p{N}])(?:सौ)(?![\p{L}\p{N}])/gui, (m, offset, full) => {
    const before = full.slice(0, offset).trim();
    if (/(?:\d+|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|ek|do|teen|char|panch)$/i.test(before)) {
      return m;
    }
    return ' 100 ';
  });

  str = str.replace(/(?<![\p{L}\p{N}])(?:लाख)(?![\p{L}\p{N}])/gui, (m, offset, full) => {
    const before = full.slice(0, offset).trim();
    if (/(?:\d+|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|ek|do|teen|char|panch)$/i.test(before)) {
      return m;
    }
    return ' 100000 ';
  });

  // 5. Digit + Multiplier: "2 हजार" -> "2000", "5 सौ" -> "500", "10 hazar" -> "10000"
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:हजार|हज़ार|hazar|hazaar|thousand|k)(?![\p{L}\p{N}])/gui, (_, n) => ` ${parseFloat(n) * 1000} `);
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:सौ|sau|hundred)(?![\p{L}\p{N}])/gui, (_, n) => ` ${parseFloat(n) * 100} `);
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:लाख|lakh|lac)(?![\p{L}\p{N}])/gui, (_, n) => ` ${parseFloat(n) * 100000} `);
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:करोड़|crore)(?![\p{L}\p{N}])/gui, (_, n) => ` ${parseFloat(n) * 10000000} `);

  // 6. Direct word replacement using Unicode boundary
  const keys = Object.keys(WORD_NUMBERS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const reg = new RegExp(`(?<![\\p{L}\\p{N}])${k}(?![\\p{L}\\p{N}])`, 'gui');
    str = str.replace(reg, ` ${WORD_NUMBERS[k]} `);
  }

  // 7. Restore protected verb phrases
  str = str.replace(/_VDO_TOKEN/g, ' do');

  return str.replace(/\s+/g, ' ').trim();
}

// Robust function to extract numbers from any spoken or typed text
export function extractNumber(text = '', defaultVal = 1) {
  if (typeof text === 'number') return isNaN(text) ? defaultVal : text;
  if (!text || typeof text !== 'string') return defaultVal;

  let normalized = convertSpokenNumbersToDigits(text).toLowerCase().trim();

  const digitMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    const parsed = parseFloat(digitMatch[1]);
    if (!isNaN(parsed)) return parsed;
  }

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

// Hindi & English Trigger Detection for Billing
export function isInvoiceIntent(text = '') {
  const normalized = text.toLowerCase().trim();

  const hindiTriggers = [
    'bill bana',
    'bill banao',
    'bill bana do',
    'bill banaye',
    'bill banana hai',
    'naya bill',
    'naya bill bana',
    'naya bill banao',
    'naya bill banana',
    'invoice bana',
    'invoice banao',
    'invoice banaye',
    'invoice banado',
    'invoice banana hai',
    'parchi bana',
    'parchi banao',
    'parcha banao',
    'rasid banao',
    'khata banao',
    'hisab banao',
    'bill generate karo',
    'बिल बना',
    'बिल बनाओ',
    'बिल बना दो',
    'बिल काट दो',
    'बिल काटो',
    'बिल बनाना है',
    'नया बिल',
    'इन्वॉइस बनाओ',
    'इन्वॉइस बना',
    'पर्ची बनाओ',
    'रसीद बनाओ'
  ];

  const englishTriggers = [
    'generate invoice',
    'create invoice',
    'new invoice',
    'make invoice',
    'start invoice',
    'generate bill',
    'create bill',
    'new bill',
    'make bill',
    'start bill',
    'invoice customer',
    'bill customer'
  ];

  const allTriggers = [...hindiTriggers, ...englishTriggers];

  return (
    allTriggers.some((t) => normalized.includes(t)) ||
    normalized === 'bill' ||
    normalized === 'billing' ||
    (normalized.startsWith('invoice') && normalized.length > 7)
  );
}

// Add Stock Intent Detection
export function isAddStockIntent(text = '') {
  const norm = text.toLowerCase().trim();
  const hindiAddStock = [
    'stock add karo', 'stock add', 'stock dalo', 'stock jodo', 'maal add karo',
    'inventory add karo', 'naya stock', 'stock badhao', 'stock chadhao', 'maal dalo',
    'स्टॉक जोड़ो', 'स्टॉक ऐड करो', 'स्टॉक डालो', 'माल जोड़ो', 'स्टॉक बढ़ाओ'
  ];
  const englishAddStock = [
    'add stock', 'restock', 'add inventory', 'new stock', 'increase stock', 'stock in', 'add product stock'
  ];

  return [...hindiAddStock, ...englishAddStock].some((t) => norm.includes(t));
}

// Check Stock Intent Detection
export function isCheckStockIntent(text = '') {
  const norm = text.toLowerCase().trim();
  const hindiCheckStock = [
    'check stock', 'stock check karo', 'stock dikhao', 'maal kitna hai', 'stock batao',
    'inventory dikhao', 'kitna maal bacha hai', 'stock kitna hai', 'maal check karo',
    'stock report', 'inventory check karo', 'kitna stock hai', 'stock dekhna hai',
    'स्टॉक दिखाओ', 'स्टॉक चेक करो', 'स्टॉक बताओ', 'स्टॉक कितना है', 'माल कितना है', 'स्टॉक रिपोर्ट'
  ];
  const englishCheckStock = [
    'check stock', 'view stock', 'show stock', 'inventory report', 'check inventory',
    'stock report', 'stock status', 'how much stock', 'view inventory'
  ];

  return [...hindiCheckStock, ...englishCheckStock].some((t) => norm.includes(t));
}

// Reporting & Accounting Intent Detection (Sales vs Purchase)
export function isReportingIntent(text = '') {
  const norm = text.toLowerCase().trim();
  const reportTriggers = [
    'report', 'reporting', 'reports', 'sales report', 'purchase report',
    'sale report', 'bikri report', 'kharid report', 'khareed report', 'hisaab', 'hisab', 'accounting',
    'profit', 'munafa', 'daily sales', 'check sales', 'sales check karo',
    'report dikhao', 'report check karo', 'purchase check karo', 'supplier hisab',
    'payment pending', 'due payment', 'due date', 'kab payment due', 'kiski payment',
    'sales due', 'udhar', 'udhari', 'bakaya', 'बकाया', 'उधारी',
    'दैनिक बिक्री', 'बिक्री रिपोर्ट', 'खरीद रिपोर्ट', 'मुनाफा', 'हिसाब', 'अकाउंटिंग', 'रिपोर्ट'
  ];
  return reportTriggers.some((t) => norm.includes(t));
}

export function detectReportType(text = '') {
  const norm = text.toLowerCase().trim();
  const dueKeywords = ['sales due', 'udhar', 'udhari', 'bakaya', 'बकाया', 'उधारी', 'customer due'];
  if (dueKeywords.some((k) => norm.includes(k))) {
    return 'sales_due';
  }
  const purchaseKeywords = [
    'purchase', 'kharid', 'khareed', 'supplier', 'vendor', 'pending payment',
    'due payment', 'kab payment', 'kis se kitna', 'acccunting', 'accounting',
    'खरीद', 'खरीददारी', 'सप्लायर', 'वेंडर'
  ];
  if (purchaseKeywords.some((k) => norm.includes(k))) {
    return 'purchase';
  }
  return 'sales';
}

// Extract product from "Shirt ka stock dikhao" or "check stock of Jeans"
export function extractProductFromStockQuery(text = '') {
  const str = text.trim();
  const match = 
    str.match(/(?:check stock of|stock of|stock for)\s+([A-Za-z0-9\u0900-\u097F\s-]+)/i) ||
    str.match(/([A-Za-z0-9\u0900-\u097F\s-]+?)\s+(?:ka stock|ka maal|stock kitna|kitna bacha|का\s+स्टॉक)/i);

  if (match && match[1]) {
    let cleaned = match[1].replace(/^(check|view|show|dikhao|batao|दिखाओ|बताओ)\s+/i, '').trim();
    if (cleaned && !['all', 'total', 'sab', 'pura', 'sabka', 'सब', 'पूरा'].includes(cleaned.toLowerCase())) {
      if (DEVANAGARI_PRODUCT_MAP[cleaned]) {
        return DEVANAGARI_PRODUCT_MAP[cleaned];
      }
      return cleaned;
    }
  }
  return '';
}

// Detect if query was initiated in Hindi
export function detectLanguage(text = '') {
  const normalized = text.toLowerCase().trim();
  const hindiIndicators = [
    'banao', 'banaye', 'chahiye', 'kya', 'naam', 'kitna', 'kitni', 'keemat', 'hai', 'aur', 'ha', 'haan', 'nahi', 'karo', 'parcha', 'parchi', 'rasid', 'rupaye', 'ka', 'ki', 'ke',
    'teen', 'chaar', 'paanch', 'chhe', 'saat', 'aath', 'nau', 'das', 'dalo', 'jodo', 'dikhao', 'batao', 'maal',
    'बिल', 'बनाओ', 'क्या', 'नाम', 'कितना', 'कितनी', 'कीमत', 'है', 'और', 'हाँ', 'नहीं', 'तीन', 'चार', 'पांच', 'पाँच', 'स्टॉक'
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

// Natural Language One-Shot Extractor for Invoice
// Helper to repeatedly clean Hindi postpositions, bill commands, and filler words from product names
export function cleanProductName(rawProd, customerName = '', inventory = []) {
  if (!rawProd) return '';
  let p = rawProd.trim();
  p = p.replace(/^(?:x|units?\s+of|pieces?\s+of|piece\s+of|nag|piece|items?|aur|and)\s+/i, '');
  if (customerName) {
    const custRegex = new RegExp(`(?:for\\s+)?${customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gui');
    p = p.replace(custRegex, ' ');
  }
  // Repeatedly strip trailing Hindi postpositions and bill filler words
  let prev = '';
  while (prev !== p) {
    prev = p;
    p = p.replace(/\s+(?:ke\s+liye|ke\s+kiye|ka\s+bill\s+banao|ka\s+bill\s+bana|ka\s+bill|bill\s+banao|bill\s+bana|bill|invoice|bana\s+do|banao|bana|kar\s+do|de\s+do|generate\s+karo|ka|ki|ke|ko|me|mein|se|pe|par|at|@|for|rate|price|cost|hai|h|jiski|jiska|per\s+unit|unit\s+price|aur|and|है|ह|का|की|के|को|में|से|पर|प्राइस|प्राइज|रेट|कीमत|दर|भाव|लागत)$/gui, '').trim();
  }
  p = p.replace(/\s+/g, ' ').trim();
  if (!p) return '';

  // Check inventory or Devanagari dictionary
  const lowerP = p.toLowerCase();
  if (DEVANAGARI_PRODUCT_MAP[p]) {
    p = DEVANAGARI_PRODUCT_MAP[p];
  } else if (DEVANAGARI_PRODUCT_MAP[lowerP]) {
    p = DEVANAGARI_PRODUCT_MAP[lowerP];
  }

  // Match against known inventory items
  if (inventory && inventory.length > 0) {
    const matched = inventory.find(
      (inv) => inv.name && inv.name.toLowerCase().trim() === p.toLowerCase().trim()
    );
    if (matched) return matched.name;
  }

  if (/[a-zA-Z]/.test(p)) {
    return p.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return p;
}

// Natural Language One-Shot Extractor for Invoice (Supports Single & Multi-Product Billing)
export function parseOneShotInvoice(rawText = '', inventory = []) {
  let text = (rawText || '').trim();
  if (!text) {
    return {
      customerName: '',
      product: '',
      quantity: 1,
      price: 0,
      items: [],
      discount: 0,
      discountType: 'percent',
      paymentMode: 'cash',
      paidAmount: null,
      hasFullDetails: false
    };
  }

  // 1. Convert spoken numbers (Hindi words, fractions, etc.) to Arabic numeric digits
  text = convertSpokenNumbersToDigits(text);
  text = text.replace(/\b(\d+),(\d{3})\b/g, '$1$2');

  // 2. Normalize speech mistranscriptions and Devanagari helpers
  text = text.replace(/\bke\s+(?:kiye|lie|waste|vaaste|waaste)\b/gi, 'ke liye');
  text = text.replace(/\s*(?:के\s+लिए|के\s+लिये|के\s+वास्ते)\s*/gi, ' ke liye ');
  text = text.replace(/\s*(?:और|तथा|एवं)\s*/gi, ' aur ');
  text = text.replace(/\s*&\s*/g, ' aur ');
  text = text.replace(/\s*(?:का\s+बिल\s+बना(?:ओ|एं|दो)?|बिल\s+बना(?:ओ|एं|दो)?|बिल\s+काटो)\s*/gi, ' ka bill bana ');
  text = text.replace(/\s*(?:जिसकी\s+(?:प्रति\s+इकाई\s+)?(?:कीमत|दर|भाव|लागत)|प्रति\s+इकाई\s+(?:कीमत|दर|भाव)|कीमत|दर|भाव)\s*/gi, ' jiski cost ');
  text = text.replace(/\s*(?:है|ह)\s*$/gi, ' hai');

  // 3. Payment Mode Extraction
  let paymentMode = 'cash';
  const normRaw = text.toLowerCase();
  if (/upi|gpay|google\s*pay|phonepe|paytm|online|qr/.test(normRaw)) {
    paymentMode = 'upi';
  } else if (/card|debit|credit/.test(normRaw)) {
    paymentMode = 'card';
  } else if (/cheque|check/.test(normRaw)) {
    paymentMode = 'cheque';
  }

  // 4. Paid / Due Extraction if explicitly spoken (e.g. "500 paid baki udhar" or "1000 advance")
  let paidAmount = null;
  const paidMatch =
    text.match(/(?:paid|advance|jama|जमा)\s*[$₹€£]?\s*(\d+(?:\.\d+)?)/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*[$₹€£]?\s*(?:rupaye|rupees|rs|रुपये)?\s*(?:paid|advance|jama|जमा)/i);
  if (paidMatch) {
    paidAmount = parseFloat(paidMatch[1]);
    text = text.replace(paidMatch[0], ' ');
  } else if (normRaw.includes('full paid') || normRaw.includes('pura paid') || normRaw.includes('पूरा भुगतान')) {
    paidAmount = 'full';
  }

  // 5. Discount Extraction (percentage or flat)
  let discount = 0;
  let discountType = 'percent';
  const discMatch =
    text.match(/(?:discount|off|chhut|chhoot|छूट)\s*[$₹€£]?\s*(\d+(?:\.\d+)?)\s*(%|percent|pratishat|प्रतिशत)?/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*(%|percent|pratishat|प्रतिशत)\s*(?:discount|off|chhut|chhoot|छूट)?/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*[$₹€£]?\s*(?:rupaye|rupees|rs|inr|रुपये)?\s*(?:discount|off|chhut|chhoot|छूट)/i) ||
    text.match(/(?:flat\s+)?(\d+(?:\.\d+)?)\s*(%)/i);

  if (discMatch) {
    discount = parseFloat(discMatch[1]) || 0;
    const indicator = (discMatch[2] || '').toLowerCase();
    const matchedSegment = discMatch[0].toLowerCase();
    if (
      indicator === '%' ||
      indicator === 'percent' ||
      indicator === 'pratishat' ||
      indicator === 'प्रतिशत' ||
      matchedSegment.includes('%') ||
      matchedSegment.includes('percent') ||
      (discount > 0 && discount <= 50 && !matchedSegment.includes('rs') && !matchedSegment.includes('rupaye') && !matchedSegment.includes('₹') && !matchedSegment.includes('रुपये'))
    ) {
      discountType = 'percent';
    } else {
      discountType = 'flat';
    }
    text = text.replace(discMatch[0], ' ');
  }

  // 6. Customer Name Extraction
  let customerName = '';
  let matchedCustStr = '';
  const custPatterns = [
    // "Ankur ke liye" / "Rahul Sharma ke liye" / "Ankur ke naam pe"
    /([A-Za-z\u0900-\u097F\s&.'-]+?)\s+(?:ke\s+liye|ke\s+naam\s*(?:pe|par|se|ka)?|ko\s+(?=\d+|becho|de\s+do|bech))\b/i,
    // "bill for/to Rahul Sharma at..."
    /(?:bill\s+for|invoice\s+for|bill\s+to|invoice\s+to|for|to|customer|client)\s+([A-Za-z\u0900-\u097F\s&.'-]+?)(?=\s+(?:via|by|ke\s+liye|unit\s+price|per\s+unit|cost|price|rate|at|@|\d+|with|for|ka|ki|ke|product)|$)/i,
    // Name at start before quantity
    /^([A-Za-z\u0900-\u097F\s&.'-]+?)(?=\s+\d+\s+)/i
  ];

  for (const cPat of custPatterns) {
    const cMatch = text.match(cPat);
    if (cMatch && cMatch[1]) {
      let cand = cMatch[1].trim();
      cand = cand.replace(/^(?:generate\s+bill\s+for|create\s+bill\s+for|bill\s+for|invoice\s+for|make\s+bill\s+for|generate\s+invoice\s+for|naya\s+bill\s+bana|naya\s+bill\s+banao|naya\s+bill|bill\s+bana|bill\s+banao|bill\s+generate\s+karo|customer|client|shri|mr|mrs|shriman|kripya|please)\s+/i, '');
      // Strip payment words if leaked into customer name
      cand = cand.replace(/\s+(?:via|by|through|with)?\s*(?:upi|gpay|google\s*pay|phonepe|paytm|card|cash|cheque|online|qr)$/i, '');
      // Strip trailing postpositions
      cand = cand.replace(/\s+(?:ke\s+liye|ke\s+naam\s*(?:pe|par|se|ka)?|ke\s+naam|ko|ka|ki|ke|for)$/i, '');
      cand = cand.trim();
      if (cand.length > 1 && !['bill', 'invoice', 'stock', 'parchi'].includes(cand.toLowerCase())) {
        customerName = /[a-zA-Z]/.test(cand)
          ? cand.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          : cand;
        matchedCustStr = cMatch[0];
        break;
      }
    }
  }

  let remainingText = text;
  if (matchedCustStr) {
    remainingText = remainingText.replace(matchedCustStr, ' ');
  }

  // 7. Trailing Collective Prices Check
  // Supports Devanagari price keywords & trailing unit expressions (per unit, per piece, etc.)
  let trailingPrices = [];
  const trailingPricePat = /(?:jiski|jiska|jinke|jinka|unki|unka|in|with)?\s*(?:per\s+unit\s+price|per\s+unit\s+cost|per\s+unit\s+rate|unit\s+price|unit\s+cost|per\s+piece\s+price|per\s+piece|rate|price|cost|keemat|lagat|bhav|प्राइस|प्राइज|रेट|कीमत|लागत|भाव|दर)\s*(?:is|hai|h|of|:)?\s*([0-9\s,&aurand]+)(?:hai|h|rs|rupaye|rupees|₹|है|ह|रुपये|rupay)?\s*(?:per\s+unit|per\s+piece|each|पर\s+यूनिट|प्रति\s+यूनिट|प्रति\s+इकाई|प्रति\s+पीस)?$/i;
  const tpMatch = remainingText.match(trailingPricePat);
  if (tpMatch && tpMatch[1]) {
    const rawNumStr = tpMatch[1];
    const extractedNums = rawNumStr.match(/\b\d+(?:\.\d+)?\b/g);
    if (extractedNums && extractedNums.length > 0) {
      trailingPrices = extractedNums.map((n) => parseFloat(n));
      remainingText = remainingText.replace(tpMatch[0], ' ');
    }
  }

  // Clean bill action words and payment words from remaining
  let cleanRemaining = remainingText
    .replace(/(?:ka\s+bill\s+generate\s+karo|ka\s+bill\s+banao|ka\s+bill\s+bana\s+do|ka\s+bill\s+bana|bill\s+generate\s+karo|bill\s+banao|bill\s+banado|bill\s+bana\s+do|bill\s+bana|bana\s+do|banao|bana|kar\s+do|de\s+do|invoice\s+banao|invoice\s+bana|bill\s+काटो|generate\s+bill|create\s+bill|make\s+bill|ka\s+bill|ka\s+invoice|bill|invoice)/gi, ' ')
    .replace(/(?:jiski|jiska|jinke|jinka|hai|h|becho|bech\s+do|de\s+do|rupaye|rupees|rs|inr|each|via\s+\w+|by\s+\w+|per\s+unit|per\s+piece|पर\s+यूनिट|प्रति\s+यूनिट|प्रति\s+इकाई)/gi, ' ')
    .replace(/(?:cash|card|upi|cheque|check|online|qr|gpay|paytm|phonepe|रोकड़ा|नकद|चेक)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let items = [];

  // CASE A: Trailing collective prices found -> split items and map prices consecutively
  if (trailingPrices.length > 0) {
    let listStr = cleanRemaining.replace(/\s+(?:aur|and|तथा|एवं)\s+/gi, ', ').replace(/\s*&\s*/g, ', ');
    listStr = listStr.replace(/\s+(?=\d+\s+[A-Za-z\u0900-\u097F])/gi, ', ');
    const parts = listStr.split(',').map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      const match = part.match(/^(\d+)\s*(?:x|units?|pieces?|pcs?|nag|piece)?\s+(.+)$/i);
      if (match) {
        const q = parseFloat(match[1]) || 1;
        const prodName = cleanProductName(match[2], customerName, inventory);
        if (prodName) {
          items.push({ name: prodName, quantity: q, price: 0, discount: 0, discountType: 'percent' });
        }
      }
    }

    if (items.length > 0) {
      if (trailingPrices.length === items.length) {
        items.forEach((it, idx) => {
          it.price = trailingPrices[idx];
        });
      } else if (trailingPrices.length === 1) {
        items.forEach((it) => {
          it.price = trailingPrices[0];
        });
      } else {
        items.forEach((it, idx) => {
          it.price = trailingPrices[idx] !== undefined ? trailingPrices[idx] : trailingPrices[trailingPrices.length - 1];
        });
      }
    }
  }

  // CASE B: Inline product-price pairs (e.g. "2 table 3000 aur 4 chair 500" or "3 saree 1500 aur 2 suit 2500")
  if (items.length === 0) {
    const segments = cleanRemaining.split(/[,&]|\s+aur\s+|\s+and\s+/i);
    for (const seg of segments) {
      const s = seg.trim();
      if (!s) continue;
      const matchInline =
        s.match(/^(\d+)\s*(?:x|units?|pieces?|pcs?|nag)?\s+([A-Za-z\u0900-\u097F\s-]+?)\s+(?:at|@|rate|price|keemat|cost|bhav|me|mein|₹|प्राइस|प्राइज|रेट|कीमत|दर|भाव|लागत)\s*(\d+(?:\.\d+)?)/i) ||
        s.match(/^(\d+)\s*(?:x|units?|pieces?|pcs?|nag)?\s+([A-Za-z\u0900-\u097F\s-]+?)\s*(\d+(?:\.\d+)?)\s*(?:at|@|rate|price|keemat|cost|bhav|rupaye|rupees|rs|inr|me|mein|प्राइस|रेट|कीमत|रुपये)?$/i);

      if (matchInline) {
        const q = parseFloat(matchInline[1]) || 1;
        const prodName = cleanProductName(matchInline[2], customerName, inventory);
        const pr = parseFloat(matchInline[3]) || 0;
        if (prodName && pr > 0) {
          items.push({ name: prodName, quantity: q, price: pr, discount: 0, discountType: 'percent' });
        }
      }
    }
  }

  // CASE C: Fallback single product extraction
  if (items.length === 0) {
    const singleQtyMatch = cleanRemaining.match(/(\d+)\s*(?:x|units?|pieces?|pcs?|nag)?\s+([A-Za-z\u0900-\u097F\s-]+)/i);
    let singlePrice = trailingPrices[0] || 0;
    if (!singlePrice) {
      const pMatch =
        text.match(/(?:unit\s+price|price|rate|cost|keemat|at|@|प्राइस|प्राइज|रेट|कीमत|दर|भाव|लागत)\s*(?:is|hai|h|of|:)?\s*[$₹€£]?\s*(\d+(?:\.\d+)?)/i) ||
        text.match(/(\d+(?:\.\d+)?)\s*(?:rupaye|rupees|rs|inr|₹|रुपये)/i);
      if (pMatch) singlePrice = parseFloat(pMatch[1]) || 0;
    }
    if (singleQtyMatch) {
      const q = parseFloat(singleQtyMatch[1]) || 1;
      const prodName = cleanProductName(singleQtyMatch[2], customerName, inventory);
      if (prodName && singlePrice > 0) {
        items.push({ name: prodName, quantity: q, price: singlePrice, discount: 0, discountType: 'percent' });
      }
    }
  }

  // If customerName was not found yet, check if there is a name prefix
  if (!customerName) {
    const forMatch = text.match(/(?:for|to|naam|customer)\s+([A-Za-z\u0900-\u097F\s]+?)(?=\s+(?:unit\s+price|at|@|price|rate|\d+)|$)/i);
    if (forMatch) customerName = forMatch[1].trim();
  }

  if (customerName && /[a-zA-Z]/.test(customerName)) {
    customerName = customerName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  const primaryProduct = items.length > 0 ? items.map((i) => i.name).join(', ') : '';
  const totalQuantity = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
  const primaryPrice = items[0]?.price || 0;
  const hasFullDetails = Boolean(customerName && items.length > 0 && items.every((i) => i.price > 0));

  return {
    customerName,
    product: primaryProduct,
    quantity: totalQuantity,
    price: primaryPrice,
    items,
    discount,
    discountType,
    paymentMode,
    paidAmount,
    hasFullDetails
  };
}

// Direct voice command to edit or adjust stock:
// e.g. "T-shirt ka stock 20 kar do", "Jeans me 5 add karo", "Shirt 15 piece kar do", "set Jeans to 30"
export function parseStockUpdateCommand(text = '', inventory = []) {
  if (!text || !inventory || inventory.length === 0) return null;
  const norm = text.toLowerCase().trim();

  // Check if text has editing indicators
  const hasEditVerb = [
    'kar do', 'kardo', 'kar de', 'set karo', 'bana do', 'update karo',
    'badha do', 'add karo', 'jod do', 'plus karo', 'badhao', 'set stock', 'update stock', 'change to'
  ].some((v) => norm.includes(v));

  if (!hasEditVerb) return null;

  const isAddition = ['add', 'jod', 'plus', 'badha'].some((v) => norm.includes(v));

  // Extract quantity from text
  const qty = extractNumber(norm, null);
  if (qty === null || qty <= 0) return null;

  // Match against known inventory items
  let matchedItem = null;
  for (const item of inventory) {
    const itemName = item.name.toLowerCase();
    const itemWords = itemName.split(/\s+/);
    if (norm.includes(itemName) || itemWords.some((w) => w.length > 3 && norm.includes(w))) {
      matchedItem = item;
      break;
    }
  }

  if (matchedItem) {
    return {
      product: matchedItem,
      quantity: qty,
      isAddition
    };
  }

  return null;
}

// Multilingual Prompt Templates
export const PROMPTS = {
  hi: {
    welcome: "नमस्ते! मैं Billie हूँ, आपका वॉइस और टेक्स्ट असिस्टेंट। बिल बनाने के लिए 'bill bana' बोलें, या स्टॉक देखने/जोड़ने के लिए 'stock check karo' या 'stock add karo' बोलें।",
    ask_customer_type: "नया ग्राहक है या पुराना ग्राहक? (नीचे विकल्प चुनें या 'नया' / 'पुराना' बोलें)",
    ask_existing_customer: "मौजूदा ग्राहक का नाम या मोबाइल नंबर बताएं या नीचे सूची से चुनें:",
    ask_customer_phone_gst: "क्या आप ग्राहक का मोबाइल नंबर या GST नंबर जोड़ना चाहते हैं? (यह वैकल्पिक है, आप 'Skip' भी कर सकते हैं)",
    ask_customer: "Customer ka naam ya company ka naam batao?",
    ask_product: "Kya product hai?",
    ask_quantity: (product) => `"${product}" kitna piece ya quantity chahiye? (jaise 1, 2, 3, 4, 5...)`,
    ask_price: (product) => `"${product}" ka per piece price / keemat kitni hai?`,
    ask_more_items: "Aur kuch add karna hai? ('haan' ya 'nahi' bolein)",
    ask_next_product: "Agla product kya hai?",
    ask_discount: "Koi discount dena hai? (jaise '10%' ya flat amount, ya '0' bolein)",
    ask_payment_mode: "Payment किस मोड में मिला है? नीचे से चुनें या बोलें (Cash, UPI, Card, ya Cheque):",
    item_added: (name, qty, price, currency) => `✓ ${qty}x ${name} (${currency}${price}) add ho gaya.`,
    invoice_ready: (invoiceNum, cust, subtotal, discount, total, currency, discLabel = '') => 
      `✨ ${cust} ka bill taiyar hai! Subtotal: ${currency}${subtotal}${Number(discount) > 0 ? `, Discount: -${currency}${discount}${discLabel ? ` (${discLabel})` : ''}` : ''}, Total: ${currency}${total}. Ab aap PDF download kar sakte hain.`,
    cancelled: "Cancel ho gaya hai. Dobara bolne ke liye ready hoon.",
    
    // Stock flow prompts
    stock_ask_product: "Kya product ka stock add karna hai?",
    stock_ask_quantity: (product) => `"${product}" ka kitna piece ya quantity add karna hai?`,
    stock_ask_cost: (product) => `"${product}" ka khareed lagat (Cost Price) kitna hai? (Yeh anivarya hai)`,
    stock_ask_price: (product) => `"${product}" ka selling price / rate kitna rakhna hai? (ya purana rate continue karein)`,
    stock_ask_more: "Aur kisi product ka stock add karna hai? ('haan' ya 'nahi' bolein)",
    stock_added: (product, qty, total) => `✓ ${product} ka ${qty} piece stock add ho gaya! Ab total stock: ${total} piece hai.`,
    stock_updated: (product, newQty) => `✓ ${product} का स्टॉक अब ${newQty} पीस अपडेट हो गया है!`,
    stock_report_all: (count) => `Ye raha aapka stock report! Total ${count} products inventory me hain. Kisi product ka naam bolkar stock dekh sakte hain ya stock badha sakte hain.`,
    stock_report_single: (product, qty) => `"${product}" ka stock abhi ${qty} piece available hai. Stock badhane ke liye 'stock add karo' ya quantity bol sakte hain.`,

    hints: {
      idle: "Bolein: 'bill bana', 'stock check karo', ya 'stock add karo'...",
      customer_type: "'नया ग्राहक' या 'पुराना ग्राहक' चुनें...",
      existing_customer: "पुराने ग्राहक का नाम या मोबाइल नंबर बताएं...",
      customer_phone_gst: "मोबाइल नंबर या GST नंबर डालें या 'Skip' दबाएं...",
      customer: "Customer ka naam bataiye (jaise 'Ramesh Kumar')...",
      product: "Product ka naam bataiye (jaise 'Shirt' ya 'Laptop')...",
      quantity: "Quantity / piece bataiye (jaise 3, 4, 5, 'teen', 'char')...",
      price: "Price / rate bataiye (jaise 500, 1200)...",
      more_items: "'haan' ya 'nahi' bolein...",
      discount: "Discount bataiye (jaise 10% ya 0)...",
      payment_mode: "Payment mode चुनें (Cash, UPI, Card, Cheque)...",
      stock_product: "Stock ke product ka naam bataiye...",
      stock_qty: "Kitna stock add karna hai (jaise 10, 20)...",
      stock_cost: "Khareed lagat (Cost Price) bataiye...",
      stock_price: "Selling price / rate bataiye..."
    }
  },
  en: {
    welcome: "Hello! I'm Billie, your voice & text assistant. Say 'generate invoice' to bill, or 'check stock' / 'add stock' to manage inventory.",
    ask_customer_type: "Is this a New Customer or Existing Customer? (Choose below or say 'new' / 'existing')",
    ask_existing_customer: "Please state existing customer name, phone number or choose from below:",
    ask_customer_phone_gst: "Would you like to add Mobile Number or GST Number? (Optional, you can click or say 'Skip')",
    ask_customer: "What is the Customer or Company Name?",
    ask_product: "What product or service is this for?",
    ask_quantity: (product) => `How many units or pieces of "${product}"? (e.g. 1, 2, 5)`,
    ask_price: (product) => `What is the price per unit for "${product}"?`,
    ask_more_items: "Would you like to add another item? (say 'yes' or 'no')",
    ask_next_product: "What is the next product or service?",
    ask_discount: "Any discount to apply? (e.g. '10%' or flat amount, or say '0' for none)",
    ask_payment_mode: "How was payment received? Select below or say (Cash, UPI, Card, or Cheque):",
    item_added: (name, qty, price, currency) => `✓ Added ${qty}x ${name} (${currency}${price}).`,
    invoice_ready: (invoiceNum, cust, subtotal, discount, total, currency, discLabel = '') => 
      `✨ Invoice ${invoiceNum} generated for ${cust}! Subtotal: ${currency}${subtotal}${Number(discount) > 0 ? `, Discount: -${currency}${discount}${discLabel ? ` (${discLabel})` : ''}` : ''}, Total: ${currency}${total}. You can now download the PDF.`,
    cancelled: "Cancelled. I'm ready whenever you need me!",

    // Stock flow prompts
    stock_ask_product: "Which product do you want to add stock for?",
    stock_ask_quantity: (product) => `How many units of "${product}" to add to stock?`,
    stock_ask_cost: (product) => `What is the cost price per unit for "${product}"? (Mandatory)`,
    stock_ask_price: (product) => `What is the selling price per unit for "${product}"?`,
    stock_ask_more: "Would you like to restock another product? (say 'yes' or 'no')",
    stock_added: (product, qty, total) => `✓ Added ${qty} units of ${product}. Total stock is now ${total}.`,
    stock_updated: (product, newQty) => `✓ Updated stock of ${product} to ${newQty} units!`,
    stock_report_all: (count) => `Here is your stock report! You have ${count} products in inventory. You can say any product name to view or update stock.`,
    stock_report_single: (product, qty) => `"${product}" currently has ${qty} units in stock. Say 'add stock' or a quantity to update.`,

    hints: {
      idle: "Ask Billie: 'generate invoice', 'check stock', or 'add stock'...",
      customer_type: "Choose 'New Customer' or 'Existing Customer'...",
      existing_customer: "Say or type existing customer name or phone...",
      customer_phone_gst: "Enter Phone or GSTIN, or say 'Skip' to continue...",
      customer: "Say or type Customer or Company Name (e.g. 'Acme Corp')...",
      product: "Say or type Product name (e.g. 'Website Design')...",
      quantity: "Say or type Quantity (e.g. '2' or '5')...",
      price: "Say or type Unit Price (e.g. '500')...",
      more_items: "Say 'yes' to add more or 'no' to finish...",
      discount: "Say or type Discount (e.g. '10%' or '0')...",
      payment_mode: "Select payment mode (Cash, UPI, Card, Cheque)...",
      stock_product: "Say or type product to restock...",
      stock_qty: "Say or type quantity to add...",
      stock_cost: "Say or type unit cost price...",
      stock_price: "Say or type selling price..."
    }
  }
};
