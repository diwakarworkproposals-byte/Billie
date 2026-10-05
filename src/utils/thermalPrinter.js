/**
 * ESC/POS Bluetooth Thermal Printer Utility for 58mm and 80mm receipts
 */

// Common standard Bluetooth Serial Port & Printer Service UUIDs
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb'  // HM-10 / CC2541 BLE UART
];

let connectedDevice = null;
let printerCharacteristic = null;

export const isBluetoothAvailable = () => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

/**
 * Connect to a nearby Bluetooth Thermal Printer
 */
export async function connectBluetoothPrinter() {
  if (!isBluetoothAvailable()) {
    throw new Error('Web Bluetooth is not supported on this device/browser.');
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: PRINTER_SERVICES },
        { namePrefix: 'POS' },
        { namePrefix: 'MPT' },
        { namePrefix: 'RP' },
        { namePrefix: 'InnerPrinter' },
        { namePrefix: 'BlueTooth' },
        { namePrefix: 'Printer' }
      ],
      optionalServices: PRINTER_SERVICES
    });

    const server = await device.gatt.connect();
    
    // Find writable characteristic
    let characteristic = null;
    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            characteristic = c;
            break;
          }
        }
        if (characteristic) break;
      } catch (e) {
        // Continue searching other services
      }
    }

    if (!characteristic) {
      throw new Error('Could not find writable printer service on selected device.');
    }

    connectedDevice = device;
    printerCharacteristic = characteristic;

    return {
      name: device.name || 'Bluetooth Thermal Printer',
      id: device.id,
      connected: true
    };
  } catch (err) {
    console.error('[Bluetooth Printer] Connection failed:', err);
    throw err;
  }
}

export function disconnectBluetoothPrinter() {
  if (connectedDevice && connectedDevice.gatt.connected) {
    connectedDevice.gatt.disconnect();
  }
  connectedDevice = null;
  printerCharacteristic = null;
}

export function getPrinterStatus() {
  return {
    isAvailable: isBluetoothAvailable(),
    isConnected: !!(connectedDevice && connectedDevice.gatt?.connected),
    deviceName: connectedDevice?.name || null
  };
}

/**
 * Helper to encode text to CP437 or ASCII byte array
 */
function textToBytes(text) {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text));
}

/**
 * Format string row with column padding (e.g. "Item      2x  500")
 */
function formatRow(left, right, width = 32) {
  const maxLeft = width - right.length - 1;
  const truncatedLeft = left.length > maxLeft ? left.substring(0, maxLeft) : left;
  const spaces = Math.max(1, width - truncatedLeft.length - right.length);
  return truncatedLeft + ' '.repeat(spaces) + right + '\n';
}

/**
 * Build ESC/POS Byte Buffer for 58mm (32 chars) or 80mm (48 chars)
 */
export function buildEscPosBuffer(invoice, store, width = 58) {
  const colWidth = width === 80 ? 48 : 32;
  const divider = '-'.repeat(colWidth) + '\n';
  const doubleDivider = '='.repeat(colWidth) + '\n';

  const commands = [];

  // ESC @ - Initialize printer
  commands.push(0x1B, 0x40);

  // Center alignment for Header
  commands.push(0x1B, 0x61, 0x01);

  // Double size for Store Name
  commands.push(0x1D, 0x21, 0x11);
  commands.push(...textToBytes((store?.storeName || store?.name || 'BILLIE STORE') + '\n'));

  // Normal text size
  commands.push(0x1D, 0x21, 0x00);
  if (store?.address) commands.push(...textToBytes(store.address + '\n'));
  if (store?.phone) commands.push(...textToBytes(`Phone: ${store.phone}\n`));
  if (store?.gstin) commands.push(...textToBytes(`GSTIN: ${store.gstin}\n`));

  // Divider
  commands.push(...textToBytes(divider));

  // Invoice Meta (Left aligned)
  commands.push(0x1B, 0x61, 0x00);
  const invNumber = invoice.invoiceNumber || invoice.id || 'INV';
  const invDate = invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const invTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  commands.push(...textToBytes(formatRow(`Invoice: #${invNumber}`, invDate, colWidth)));
  if (invoice.customer?.name) {
    commands.push(...textToBytes(`Customer: ${invoice.customer.name}\n`));
  }
  if (invoice.customer?.phone) {
    commands.push(...textToBytes(`Mobile: ${invoice.customer.phone}\n`));
  }

  // Divider
  commands.push(...textToBytes(divider));

  // Table Header
  commands.push(0x1B, 0x45, 0x01); // Bold on
  commands.push(...textToBytes(formatRow('ITEM', 'QTY  AMOUNT', colWidth)));
  commands.push(0x1B, 0x45, 0x00); // Bold off
  commands.push(...textToBytes(divider));

  // Items
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      name: invoice.product || 'Product',
      quantity: invoice.quantity || 1,
      price: invoice.price || 0,
      lineTotal: invoice.subtotal || invoice.total || 0
    }
  ];

  items.forEach((item) => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const lineTotal = item.lineTotal || (qty * price);
    const rightCol = `${qty} x ${price} = ${lineTotal}`;
    commands.push(...textToBytes(formatRow(item.name || 'Item', rightCol, colWidth)));
  });

  // Divider
  commands.push(...textToBytes(divider));

  // Totals (Right Aligned or Column Formatted)
  const currency = invoice.currency || 'INR ';
  const subtotal = invoice.subtotal || invoice.total;
  commands.push(...textToBytes(formatRow('Sub Total:', `${currency}${subtotal}`, colWidth)));

  if (invoice.discount && invoice.discount > 0) {
    commands.push(...textToBytes(formatRow('Discount:', `-${currency}${invoice.discount}`, colWidth)));
  }

  if (invoice.tax && invoice.tax > 0) {
    commands.push(...textToBytes(formatRow('GST/Tax:', `+${currency}${invoice.tax}`, colWidth)));
  }

  commands.push(...textToBytes(doubleDivider));

  // Grand Total in Bold & Double Height
  commands.push(0x1B, 0x45, 0x01); // Bold on
  commands.push(...textToBytes(formatRow('GRAND TOTAL:', `${currency}${invoice.total}`, colWidth)));
  commands.push(0x1B, 0x45, 0x00); // Bold off

  // Paid and Due amounts
  const grandTot = Number(invoice.total || invoice.grandTotal || 0);
  const paid = invoice.paidAmount !== undefined && invoice.paidAmount !== null
    ? Number(invoice.paidAmount)
    : (invoice.dueAmount !== undefined ? Math.max(0, grandTot - Number(invoice.dueAmount)) : grandTot);
  const due = invoice.dueAmount !== undefined && invoice.dueAmount !== null
    ? Number(invoice.dueAmount)
    : Math.max(0, grandTot - paid);

  commands.push(...textToBytes(formatRow('Paid Amount:', `${currency}${paid}`, colWidth)));
  if (due > 0) {
    commands.push(...textToBytes(formatRow('Due Balance:', `${currency}${due} [PENDING]`, colWidth)));
  } else {
    commands.push(...textToBytes(formatRow('Due Balance:', `${currency}0.00 [CLEARED]`, colWidth)));
  }

  commands.push(...textToBytes(doubleDivider));

  // Payment Details
  if (invoice.paymentMode) {
    commands.push(...textToBytes(`Payment: ${invoice.paymentMode.toUpperCase()}\n`));
  }

  // Center alignment for Footer
  commands.push(0x1B, 0x61, 0x01);
  commands.push(...textToBytes('\nThank you for shopping!\n'));
  commands.push(...textToBytes('Powered by Billie POS\n'));

  // Feed and Cut (Feed 4 lines, then partial cut)
  commands.push(0x1B, 0x64, 0x04); // Feed 4 lines
  commands.push(0x1D, 0x56, 0x41, 0x10); // Cut paper

  return new Uint8Array(commands);
}

/**
 * Send byte buffer in chunks to Bluetooth printer
 */
export async function printToBluetooth(buffer) {
  if (!printerCharacteristic) {
    throw new Error('Printer not connected. Please connect Bluetooth printer first.');
  }

  const CHUNK_SIZE = 100; // Safe chunk size for BLE MTU
  for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
    const chunk = buffer.slice(i, i + CHUNK_SIZE);
    if (printerCharacteristic.writeValueWithResponse) {
      await printerCharacteristic.writeValueWithResponse(chunk);
    } else {
      await printerCharacteristic.writeValueWithoutResponse(chunk);
    }
    // Small pause to prevent buffer overflow on thermal printer
    await new Promise((r) => setTimeout(r, 20));
  }

  return true;
}

/**
 * Universal Print function:
 * If Bluetooth printer is connected, prints via Bluetooth.
 * Otherwise, opens browser thermal receipt print preview (58mm/80mm).
 */
export async function printThermalReceipt(invoice, store, width = 58) {
  if (printerCharacteristic && connectedDevice?.gatt?.connected) {
    const buffer = buildEscPosBuffer(invoice, store, width);
    await printToBluetooth(buffer);
    return { type: 'bluetooth', success: true };
  }

  // Fallback: Virtual thermal popup window for thermal printers
  openBrowserThermalReceipt(invoice, store, width);
  return { type: 'browser', success: true };
}

/**
 * Browser thermal receipt layout for direct USB/WiFi/Network thermal printing
 */
export function openBrowserThermalReceipt(invoice, store, width = 58) {
  const printWindow = window.open('', '_blank', `width=${width === 80 ? '420' : '340'},height=600`);
  if (!printWindow) {
    window.print();
    return;
  }

  const currency = invoice.currency || '₹';
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      name: invoice.product || 'Product',
      quantity: invoice.quantity || 1,
      price: invoice.price || 0,
      lineTotal: invoice.subtotal || invoice.total || 0
    }
  ];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt #${invoice.invoiceNumber || invoice.id || ''}</title>
      <style>
        @page {
          margin: 0;
          size: ${width === 80 ? '80mm' : '58mm'} auto;
        }
        body {
          font-family: 'Courier New', Courier, monospace, monospace;
          margin: 0;
          padding: 10px 8px;
          color: #000;
          background: #fff;
          font-size: ${width === 80 ? '13px' : '11px'};
          line-height: 1.3;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .store-name { font-size: ${width === 80 ? '16px' : '14px'}; font-weight: 900; margin-bottom: 2px; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .double-divider { border-top: 2px solid #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; margin: 4px 0; }
        th { border-bottom: 1px dashed #000; text-align: left; padding: 3px 0; font-size: 10px; }
        td { padding: 3px 0; vertical-align: top; }
        .total-row { font-size: ${width === 80 ? '14px' : '12px'}; font-weight: 900; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="store-name">${store?.storeName || store?.name || 'BILLIE STORE'}</div>
        <div>${store?.address || ''}</div>
        <div>${store?.phone ? 'Ph: ' + store.phone : ''}</div>
        <div>${store?.gstin ? 'GSTIN: ' + store.gstin : ''}</div>
      </div>

      <div class="divider"></div>

      <div>Invoice: <b>#${invoice.invoiceNumber || invoice.id || 'INV'}</b></div>
      <div>Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
      ${invoice.customer?.name ? `<div>Customer: ${invoice.customer.name}</div>` : ''}
      ${invoice.customer?.phone ? `<div>Mobile: ${invoice.customer.phone}</div>` : ''}

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th>ITEM</th>
            <th class="center">QTY</th>
            <th class="right">PRICE</th>
            <th class="right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td>${it.name || 'Item'}</td>
              <td class="center">${it.quantity || 1}</td>
              <td class="right">${currency}${it.price || 0}</td>
              <td class="right">${currency}${it.lineTotal || (it.quantity * it.price) || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <table>
        <tr>
          <td>Subtotal:</td>
          <td class="right">${currency}${invoice.subtotal || invoice.total}</td>
        </tr>
        ${invoice.discount ? `
        <tr>
          <td>Discount:</td>
          <td class="right">-${currency}${invoice.discount}</td>
        </tr>` : ''}
        ${invoice.tax ? `
        <tr>
          <td>GST/Tax:</td>
          <td class="right">+${currency}${invoice.tax}</td>
        </tr>` : ''}
      </table>

      <div class="double-divider"></div>

      <table>
        <tr class="total-row">
          <td>GRAND TOTAL:</td>
          <td class="right">${currency}${invoice.total}</td>
        </tr>
      </table>

      <div class="double-divider"></div>

      <div class="center" style="margin-top: 8px;">
        <div>*** THANK YOU! VISIT AGAIN ***</div>
        <div style="font-size: 9px; color: #555; margin-top: 4px;">Billie Smart POS</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
