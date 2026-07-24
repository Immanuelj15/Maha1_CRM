import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'assets', 'logo.png');

/**
 * Strips characters that PDFKit's built-in Helvetica font cannot render.
 * Helvetica only supports Latin-1 / WinAnsi charset (U+0000–U+00FF).
 * Tamil (U+0B80–U+0BFF), Arabic, Chinese etc. produce garbled bytes if passed directly.
 * Strategy: remove any (...) block that contains non-ASCII chars (Tamil annotations),
 * then strip any remaining non-ASCII characters.
 * e.g.  "Maida Poori (மைதா பூரி)"  →  "Maida Poori"
 */
const sanitizeForPDF = (text) => {
  if (!text) return '';
  // Remove parenthetical Tamil/Unicode annotations
  let cleaned = String(text).replace(/\s*\([^)]*[\u0080-\uFFFF][^)]*\)/g, '');
  // Strip any remaining non-Basic-Latin characters
  cleaned = cleaned.replace(/[^\x00-\x7F]/g, '').trim();
  return cleaned || String(text).replace(/[^\x00-\x7F]/g, '').trim();
};

/**
 * Generate a professional invoice PDF
 * @param {Object} invoice - Invoice details
 * @param {Object} business - Business info (settings)
 * @param {res} res - Express response stream
 */
export const generateInvoicePDF = (invoice, business, res, eventReportData = null) => {
  const doc = new PDFDocument({ margin: 20, size: 'A4' });
  doc.pipe(res);

  // Register Latha Font (Tamil support)
  let useTamil = false;
  try {
    doc.registerFont('Tamil', 'C:\\Windows\\Fonts\\latha.ttf');
    doc.registerFont('Tamil-Bold', 'C:\\Windows\\Fonts\\lathab.ttf');
    useTamil = true;
  } catch (err) {
    console.error('Error loading Tamil fonts, falling back to Helvetica:', err);
  }

  const fontRegular = useTamil ? 'Tamil' : 'Helvetica';
  const fontBold = useTamil ? 'Tamil-Bold' : 'Helvetica-Bold';
  const themeColor = '#5A1827'; // Dark maroon/brown from template

  // ── DYNAMIC ITEM COMPOSITION ──
  let pdfItems = [];
  let grandTotal = 0;

  if (eventReportData) {
    const { customer, eventLabour, expenses, roleMap } = eventReportData;

    // 1. Catering Service Cost (from customer details)
    if (customer) {
      const cateringAmount = customer.totalAmount || 0;
      pdfItems.push({
        description: `Catering Service (Catering for ${customer.guestCount || 0} guests)`,
        amount: cateringAmount
      });
      grandTotal += cateringAmount;

      // 2. Vessel Bill (from customer rentedVessels)
      const rented = customer.rentedVessels || [];
      if (rented.length > 0) {
        pdfItems.push({
          description: '--- RENTED VESSELS ---',
          amount: 0,
          isHeader: true
        });
        rented.forEach(v => {
          pdfItems.push({
            description: `Vessel Rent: ${v.vesselName} (Qty: ${v.qty})`,
            amount: v.rentAmount || 0
          });
          grandTotal += v.rentAmount || 0;
        });
      }
    } else {
      // Fallback to invoice items if customer is not found
      invoice.items.forEach(it => {
        pdfItems.push({
          description: it.description,
          amount: it.amount
        });
        grandTotal += it.amount;
      });
    }

    // 3. Labours who worked
    if (eventLabour && eventLabour.workers && eventLabour.workers.length > 0) {
      pdfItems.push({
        description: '--- LABOUR CHARGES ---',
        amount: 0,
        isHeader: true
      });

      let roleCounts = {};
      eventLabour.workers.forEach(w => {
        const role = roleMap[w.workerId] || 'Server';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        
        pdfItems.push({
          description: `Labour Charge: ${w.name} (${role} - ${w.daysWorked} days worked)`,
          amount: w.totalSalary
        });
        grandTotal += w.totalSalary;
      });

      // Role breakdown
      const breakdownStr = Object.entries(roleCounts)
        .map(([role, count]) => `${count} ${role}${count > 1 ? 's' : ''}`)
        .join(', ');
      
      pdfItems.push({
        description: `Staff Summary: ${breakdownStr}`,
        amount: 0,
        isSummaryLine: true
      });
    }

    // 4. Logged Event Expenses
    if (expenses && expenses.length > 0) {
      pdfItems.push({
        description: '--- EVENT EXPENSES ---',
        amount: 0,
        isHeader: true
      });

      expenses.forEach(exp => {
        const desc = exp.description ? ` (${exp.description})` : '';
        pdfItems.push({
          description: `Event Expense: ${exp.category}${desc}`,
          amount: exp.amount
        });
        grandTotal += exp.amount;
      });
    }
  } else {
    // Standard invoice items if not linked to an event
    invoice.items.forEach(it => {
      pdfItems.push({
        description: it.description,
        amount: it.amount
      });
    });
    grandTotal = invoice.total;
  }

  const drawPageBorders = () => {
    // Fill page background with warm cream color to match the printed bill paper
    doc.save();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FDFBF7');
    doc.restore();

    // Double Border
    doc.lineWidth(1.5).strokeColor(themeColor);
    doc.rect(20, 20, 555, 802).stroke();
    doc.lineWidth(0.5);
    doc.rect(23, 23, 549, 796).stroke();
  };

  const drawHeader = () => {
    // Draw actual brand logo image from frontend assets
    const logoWidth = 75;
    try {
      doc.image(logoPath, 45, 32, { width: logoWidth });
    } catch (err) {
      console.error('Error drawing logo image:', err);
      // Fallback: draw circular vector logo if file not found
      doc.lineWidth(1).strokeColor(themeColor);
      doc.circle(82, 65, 30).stroke();
      doc.font(fontRegular).fontSize(7).fillColor(themeColor)
         .text('மகா\'ஸ்', 62, 58, { width: 40, align: 'center' })
         .text('கிச்சன்', 62, 68, { width: 40, align: 'center' });
    }
    
    // FSSAI below circle logo
    doc.font(fontRegular).fontSize(8).fillColor(themeColor)
       .text('fssai', 40, 108, { width: 85, align: 'center' })
       .text('12425029000477', 30, 118, { width: 105, align: 'center' });

    // Main brand title text in Tamil
    doc.font(fontBold).fontSize(20).fillColor(themeColor)
       .text('மகாலட்சுமி கேட்டரிங் சர்வீஸ் &', 135, 45, { width: 410, align: 'center' });
    
    doc.font(fontBold).fontSize(18)
       .text('மகா\'ஸ் கிச்சன்', 135, 70, { width: 410, align: 'center' });

    // Address & phone cell (updated with phone cell 8682841582)
    doc.font(fontRegular).fontSize(11)
       .text('EB ஆபீஸ் எதிரில் கோவில்பட்டி - 628 501.', 135, 96, { width: 410, align: 'center' })
       .text('செல் : 8682841582, 93608 84102.', 135, 114, { width: 410, align: 'center' });

    // Horizontal line below header
    doc.lineWidth(1).strokeColor(themeColor).moveTo(30, 142).lineTo(565, 142).stroke();
  };

  const drawBillInfo = () => {
    // Bill number, title and Date
    doc.font(fontRegular).fontSize(11).fillColor(themeColor);
    
    // Bill No
    doc.text('No.', 40, 155);
    doc.font(fontBold).fontSize(11).fillColor('#1F2937')
       .text(invoice.invoiceNumber || '74', 70, 155);

    // CASH BILL (centered)
    doc.font(fontBold).fontSize(14).fillColor(themeColor)
       .text('CASH BILL', 250, 152, { width: 100, align: 'center' });
    
    // Underline CASH BILL
    doc.lineWidth(1).strokeColor(themeColor)
       .moveTo(260, 166).lineTo(340, 166).stroke();

    // Date
    doc.font(fontRegular).fontSize(11).fillColor(themeColor)
       .text('தேதி:', 430, 155);
    
    const dateStr = invoice.date ? invoice.date : '';
    doc.font(fontBold).fontSize(11).fillColor('#1F2937')
       .text(dateStr, 470, 155, { width: 90, align: 'left' });

    // Underline date
    doc.lineWidth(0.5).strokeColor(themeColor)
       .moveTo(465, 168).lineTo(560, 168).stroke();

    // Customer Name M/s line
    doc.font(fontRegular).fontSize(11).fillColor(themeColor)
       .text('M/s.', 40, 182);

    // Draw the customer's name on top of the line
    doc.font(fontBold).fontSize(11).fillColor('#1F2937')
       .text(invoice.customerName || '', 70, 182);

    // Dotted/Dashed underline for M/s to match the printed layout
    doc.save();
    doc.lineWidth(0.5).strokeColor(themeColor)
       .dash(1, { space: 2 })
       .moveTo(65, 195).lineTo(560, 195).stroke();
    doc.restore();

    // Line below M/s
    doc.lineWidth(0.5).strokeColor(themeColor).moveTo(30, 202).lineTo(565, 202).stroke();
  };

  const drawTableGrid = () => {
    doc.lineWidth(1).strokeColor(themeColor);
    // Draw outer box: y=210 to y=690
    doc.rect(30, 210, 535, 480).stroke();

    // Table Header horizontal line: y=235
    doc.moveTo(30, 235).lineTo(565, 235).stroke();

    // Columns vertical dividers
    doc.moveTo(70, 210).lineTo(70, 690).stroke(); // SI No divider
    doc.moveTo(460, 210).lineTo(460, 690).stroke(); // Particulars divider

    // Column text headers
    doc.font(fontBold).fontSize(11).fillColor(themeColor)
       .text('SI', 30, 213, { width: 40, align: 'center' })
       .text('No.', 30, 222, { width: 40, align: 'center' })
       .text('Particulars', 85, 218)
       .text('Amount', 460, 213, { width: 105, align: 'center' })
       .text('Rs.', 460, 222, { width: 105, align: 'center' });
  };

  const drawFooter = () => {
    doc.lineWidth(1).strokeColor(themeColor);
    // Standard single row
    doc.rect(30, 690, 535, 25).stroke();
    doc.moveTo(460, 690).lineTo(460, 715).stroke();

    doc.font(fontBold).fontSize(11).fillColor(themeColor)
       .text('TOTAL', 380, 697)
       .text(grandTotal.toFixed(2), 460, 697, { width: 95, align: 'right' });

    // Footer bottom signature
    doc.font(fontBold).fontSize(10).fillColor(themeColor)
       .text('For மகாலட்சுமி கேட்டரிங் சர்வீஸ் & மகா\'ஸ் கிச்சன்', 300, 745, { width: 250, align: 'right' });
  };

  // Build the page structure
  drawPageBorders();
  drawHeader();
  drawBillInfo();
  drawTableGrid();
  drawFooter();

  // Print items inside the table grid
  let currentY = 245;
  const itemsPerPage = 18;
  let itemsCount = 0;

  pdfItems.forEach((item, index) => {
    if (itemsCount >= itemsPerPage) {
      doc.addPage();
      drawPageBorders();
      drawHeader();
      drawBillInfo();
      drawTableGrid();
      drawFooter();
      currentY = 245;
      itemsCount = 0;
    }

    // Clean names to prevent font characters layout issue
    const cleanDesc = sanitizeForPDF(item.description);

    if (item.isHeader) {
      doc.font(fontBold).fontSize(9).fillColor(themeColor)
         .text(cleanDesc, 85, currentY, { width: 365 });
    } else if (item.isSummaryLine) {
      doc.font(fontRegular).fontSize(8.5).fillColor('#4B5563')
         .text(cleanDesc, 85, currentY, { width: 365 });
    } else {
      doc.font(fontRegular).fontSize(10).fillColor('#1F2937')
         .text((index + 1).toString(), 30, currentY, { width: 40, align: 'center' })
         .text(cleanDesc, 85, currentY, { width: 365 });

      const amtVal = item.amount || 0;
      const amtStr = amtVal.toFixed(2);

      doc.font(fontRegular).fontSize(10).fillColor('#1F2937')
         .text(amtStr, 460, currentY, { width: 95, align: 'right' });
    }

    currentY += 24;
    itemsCount++;
  });

  doc.end();
};

/**
 * Generate a grocery requirement sheet for an event
 * @param {Object} event - Event details
 * @param {Array} groceries - Aggregated grocery list
 * @param {res} res - Express response stream
 */
export const generateGroceryPDF = (event, groceries, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  const primaryColor = '#06B6D4';
  const textDark = '#1F2937';
  const textMuted = '#4B5563';
  const dividerColor = '#E5E7EB';

  doc.fillColor(primaryColor)
     .fontSize(20).text('EVENT GROCERY LIST', 50, 50)
     .fontSize(10).fillColor(textMuted)
     .text(`Generated for Event: ${event.name}`, 50, 75)
     .text(`Event Date: ${event.date}`, 50, 90)
     .text(`Guest Count: ${event.guestCount}`, 50, 105);

  doc.moveTo(50, 125).lineTo(550, 125).strokeColor(dividerColor).stroke();

  doc.fontSize(11).fillColor(primaryColor)
     .text('Ingredient Name', 50, 145)
     .text('Category', 220, 145)
     .text('Qty Required', 370, 145, { width: 80, align: 'right' })
     .text('Est. Cost', 470, 145, { width: 80, align: 'right' });

  doc.moveTo(50, 160).lineTo(550, 160).strokeColor(dividerColor).stroke();

  let currentY = 170;
  let totalEstimatedCost = 0;

  groceries.forEach(item => {
    if (currentY > 700) { doc.addPage(); currentY = 50; }
    const itemCost = (item.quantity || 0) * (item.unitCost || 0);
    totalEstimatedCost += itemCost;
    doc.fontSize(10).fillColor(textDark)
       .text(sanitizeForPDF(item.name), 50, currentY)
       .text(item.category || 'General', 220, currentY)
       .text(`${item.quantity} ${item.unit || 'kg'}`, 370, currentY, { width: 80, align: 'right' })
       .text(`Rs.${itemCost.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
    currentY += 20;
  });

  doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor(dividerColor).stroke();
  currentY += 15;

  doc.fontSize(11).fillColor(primaryColor)
     .text('Total Estimated Material Cost:', 250, currentY)
     .text(`Rs.${totalEstimatedCost.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });

  doc.end();
};

/**
 * Generate a professional customer-specific list PDF (menu, vegetables, or groceries)
 * @param {Object} customer - Customer details
 * @param {string} type - 'menu', 'vegetables', or 'groceries'
 * @param {Array} items - List of items
 * @param {res} res - Express response stream
 */
export const generateCustomerListPDF = (customer, type, items, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  const colors = {
    'menu': '#4F46E5',
    'vegetables': '#10B981',
    'groceries': '#F59E0B'
  };
  const primaryColor = colors[type.toLowerCase()] || '#4F46E5';
  const textDark = '#1F2937';
  const textMuted = '#4B5563';
  const dividerColor = '#E5E7EB';

  doc.fillColor(primaryColor)
     .fontSize(20)
     .text(`CUSTOMER ${type.toUpperCase()} REQUIREMENTS`, 50, 50)
     .fontSize(10).fillColor(textMuted)
     .text(`Customer Name: ${sanitizeForPDF(customer.name)}`, 50, 78)
     .text(`Phone: ${customer.phone}`, 50, 93)
     .text(`Email: ${customer.email}`, 50, 108)
     .text(`Event Date: ${customer.eventDate || 'N/A'}`, 50, 123)
     .text(`Event Type: ${customer.eventType || 'N/A'}`, 50, 138);

  doc.moveTo(50, 155).lineTo(550, 155).strokeColor(dividerColor).stroke();

  doc.fontSize(11).fillColor(primaryColor)
     .text('S.No', 50, 175)
     .text('Item / Ingredient Name', 100, 175)
     .text('Qty', 380, 175, { width: 80, align: 'right' })
     .text('Unit Type', 470, 175, { width: 80, align: 'right' });

  doc.moveTo(50, 190).lineTo(550, 190).strokeColor(dividerColor).stroke();

  let currentY = 205;
  items.forEach((item, index) => {
    if (currentY > 720) { doc.addPage(); currentY = 50; }

    // Strip Tamil annotations — PDFKit Helvetica cannot render Unicode Tamil script
    const rawName = typeof item === 'string' ? item : (item.name || '');
    const itemName = sanitizeForPDF(rawName);
    const itemUnit = typeof item === 'string' ? 'Standard' : (item.unit || 'Standard');
    const itemQty = typeof item === 'string' ? '-' : (item.qty !== undefined ? item.qty.toString() : '-');

    doc.fontSize(10).fillColor(textDark)
       .text((index + 1).toString(), 50, currentY)
       .text(itemName, 100, currentY, { width: 270 })
       .text(itemQty, 380, currentY, { width: 80, align: 'right' })
       .text(sanitizeForPDF(itemUnit), 470, currentY, { width: 80, align: 'right' });

    currentY += 22;
  });

  doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor(dividerColor).stroke();
  doc.end();
};

/**
 * Generate a unified requirements list PDF (menu, vegetables, and groceries)
 * @param {Object} customer - Customer details
 * @param {res} res - Express response stream
 */
export const generateCustomerRequirementsPDF = (customer, res) => {
  const doc = new PDFDocument({ margin: 20, size: 'A4' });
  doc.pipe(res);

  // Register Latha Font (Tamil support)
  let useTamil = false;
  try {
    doc.registerFont('Tamil', 'C:\\Windows\\Fonts\\latha.ttf');
    doc.registerFont('Tamil-Bold', 'C:\\Windows\\Fonts\\lathab.ttf');
    useTamil = true;
  } catch (err) {
    console.error('Error loading Tamil fonts, falling back to Helvetica:', err);
  }

  const fontRegular = useTamil ? 'Tamil' : 'Helvetica';
  const fontBold = useTamil ? 'Tamil-Bold' : 'Helvetica-Bold';
  const themeColor = '#5A1827'; // Dark maroon/brown from template

  const drawPageBorders = () => {
    // Fill page background with warm cream color
    doc.save();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FDFBF7');
    doc.restore();

    // Double Border
    doc.lineWidth(1.5).strokeColor(themeColor);
    doc.rect(20, 20, 555, 802).stroke();
    doc.lineWidth(0.5);
    doc.rect(23, 23, 549, 796).stroke();
  };

  const drawMainHeader = () => {
    // Draw actual brand logo image from frontend assets
    const logoWidth = 75;
    try {
      doc.image(logoPath, 45, 32, { width: logoWidth });
    } catch (err) {
      // Fallback circular vector logo
      doc.lineWidth(1).strokeColor(themeColor);
      doc.circle(82, 65, 30).stroke();
      doc.font(fontRegular).fontSize(7).fillColor(themeColor)
         .text('மகா\'ஸ்', 62, 58, { width: 40, align: 'center' })
         .text('கிச்சன்', 62, 68, { width: 40, align: 'center' });
    }

    doc.font(fontBold).fontSize(16).fillColor(themeColor)
       .text('MAHALAKSHMI CATERING SERVICE &', 135, 42, { width: 410, align: 'center' });
    doc.font(fontBold).fontSize(14)
       .text('MAHA\'S KITCHEN', 135, 62, { width: 410, align: 'center' });

    doc.font(fontRegular).fontSize(10)
       .text('EB Bus opposite Kovilpatti - 628 501.', 135, 84, { width: 410, align: 'center' })
       .text('Phone : 8682841582.', 135, 100, { width: 410, align: 'center' });

    doc.lineWidth(1).strokeColor(themeColor).moveTo(30, 125).lineTo(565, 125).stroke();
  };

  const drawClientInfo = () => {
    doc.font(fontBold).fontSize(11).fillColor(themeColor)
       .text('CUSTOMER REQUIREMENTS SHEET', 30, 135, { width: 535, align: 'center' });

    doc.lineWidth(0.5).strokeColor(themeColor).moveTo(30, 150).lineTo(565, 150).stroke();

    doc.font(fontBold).fontSize(9).fillColor(themeColor);
    doc.text('Client Name:', 40, 160);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(sanitizeForPDF(customer.name), 110, 160);

    doc.font(fontBold).fontSize(9).fillColor(themeColor).text('Phone Number:', 40, 175);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(customer.phone, 110, 175);

    doc.font(fontBold).fontSize(9).fillColor(themeColor).text('Email Address:', 40, 190);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(customer.email || '—', 110, 190);

    doc.font(fontBold).fontSize(9).fillColor(themeColor).text('Venue/Address:', 40, 205);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(sanitizeForPDF(customer.address) || '—', 110, 205, { width: 180 });

    doc.font(fontBold).fontSize(9).fillColor(themeColor).text('Event Date:', 310, 160);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(customer.eventDate || '—', 380, 160);

    doc.font(fontBold).fontSize(9).fillColor(themeColor).text('Event Type:', 310, 175);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(customer.eventType || '—', 380, 175);

    doc.font(fontBold).fontSize(9).fillColor(themeColor).text('Guests Count:', 310, 190);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(customer.guestCount ? String(customer.guestCount) : '—', 380, 190);

    doc.font(fontBold).fontSize(9).fillColor(themeColor).text('Service Type:', 310, 205);
    doc.font(fontRegular).fontSize(9).fillColor('#1F2937').text(customer.serviceType || 'Catering', 380, 205);

    doc.lineWidth(1).strokeColor(themeColor).moveTo(30, 230).lineTo(565, 230).stroke();
  };

  const drawSubsequentPageHeader = (pageNum) => {
    doc.font(fontBold).fontSize(9).fillColor(themeColor)
       .text('MAHALAKSHMI CATERING SERVICE & MAHA\'S KITCHEN - CUSTOMER REQUIREMENTS', 30, 32);
    doc.font(fontRegular).fontSize(9).fillColor(themeColor)
       .text(`Page ${pageNum}`, 500, 32, { width: 65, align: 'right' });
    doc.lineWidth(0.5).strokeColor(themeColor).moveTo(30, 48).lineTo(565, 48).stroke();
  };

  let pageNum = 1;
  drawPageBorders();
  drawMainHeader();
  drawClientInfo();
  let currentY = 245;

  const ensureSpace = (neededHeight) => {
    if (currentY + neededHeight > 785) {
      doc.addPage();
      pageNum++;
      drawPageBorders();
      drawSubsequentPageHeader(pageNum);
      currentY = 60;
    }
  };

  // 1. Food Menu Order / Dishes Section
  const menuItems = customer.menuItems || [];
  ensureSpace(35);
  doc.font(fontBold).fontSize(10).fillColor(themeColor).text('I. Food Menu Order / Dishes', 35, currentY);
  currentY += 18;

  if (menuItems.length === 0) {
    ensureSpace(18);
    doc.font(fontRegular).fontSize(9).fillColor('#6B7280').text('No menu items selected.', 45, currentY);
    currentY += 18;
  } else {
    ensureSpace(20);
    doc.lineWidth(0.5).strokeColor(themeColor);
    doc.moveTo(35, currentY).lineTo(560, currentY).stroke();
    doc.font(fontBold).fontSize(9).fillColor(themeColor)
       .text('S.No', 40, currentY + 3)
       .text('Item Name', 85, currentY + 3)
       .text('Course', 380, currentY + 3, { width: 80, align: 'left' })
       .text('Category', 470, currentY + 3, { width: 90, align: 'left' });
    doc.moveTo(35, currentY + 15).lineTo(560, currentY + 15).stroke();
    currentY += 15;

    menuItems.forEach((item, index) => {
      ensureSpace(20);
      const itemName = sanitizeForPDF(typeof item === 'string' ? item : (item.name || ''));
      const itemCourse = typeof item === 'string' ? '—' : (item.course || '—');
      const itemCategory = typeof item === 'string' ? '—' : (item.category || '—');

      doc.font(fontRegular).fontSize(9).fillColor('#1F2937')
         .text((index + 1).toString(), 40, currentY + 4)
         .text(itemName, 85, currentY + 4, { width: 285 })
         .text(itemCourse, 380, currentY + 4)
         .text(itemCategory, 470, currentY + 4);
      
      doc.lineWidth(0.2).strokeColor('#E5E7EB').moveTo(35, currentY + 16).lineTo(560, currentY + 16).stroke();
      currentY += 16;
    });
  }
  currentY += 10;

  // 2. Vegetables Requirement Section
  ensureSpace(35);
  doc.font(fontBold).fontSize(10).fillColor(themeColor).text('II. Vegetables Requirement', 35, currentY);
  currentY += 18;

  const vegItems = customer.vegetables || [];
  if (vegItems.length === 0) {
    ensureSpace(18);
    doc.font(fontRegular).fontSize(9).fillColor('#6B7280').text('No vegetables selected.', 45, currentY);
    currentY += 18;
  } else {
    ensureSpace(20);
    doc.lineWidth(0.5).strokeColor(themeColor);
    doc.moveTo(35, currentY).lineTo(560, currentY).stroke();
    doc.font(fontBold).fontSize(9).fillColor(themeColor)
       .text('S.No', 40, currentY + 3)
       .text('Vegetable Name', 85, currentY + 3)
       .text('Quantity Required', 400, currentY + 3, { width: 150, align: 'right' });
    doc.moveTo(35, currentY + 15).lineTo(560, currentY + 15).stroke();
    currentY += 15;

    vegItems.forEach((item, index) => {
      ensureSpace(20);
      const name = sanitizeForPDF(item.name || '');
      const qty = item.qty !== undefined ? item.qty.toString() : '—';
      const unit = sanitizeForPDF(item.unit || '');

      doc.font(fontRegular).fontSize(9).fillColor('#1F2937')
         .text((index + 1).toString(), 40, currentY + 4)
         .text(name, 85, currentY + 4, { width: 300 })
         .text(`${qty} ${unit}`, 400, currentY + 4, { width: 150, align: 'right' });

      doc.lineWidth(0.2).strokeColor('#E5E7EB').moveTo(35, currentY + 16).lineTo(560, currentY + 16).stroke();
      currentY += 16;
    });
  }
  currentY += 10;

  // 3. Groceries Section
  ensureSpace(35);
  doc.font(fontBold).fontSize(10).fillColor(themeColor).text('III. Groceries & Spices Requirement', 35, currentY);
  currentY += 18;

  const grocItems = customer.groceries || [];
  if (grocItems.length === 0) {
    ensureSpace(18);
    doc.font(fontRegular).fontSize(9).fillColor('#6B7280').text('No groceries selected.', 45, currentY);
    currentY += 18;
  } else {
    ensureSpace(20);
    doc.lineWidth(0.5).strokeColor(themeColor);
    doc.moveTo(35, currentY).lineTo(560, currentY).stroke();
    doc.font(fontBold).fontSize(9).fillColor(themeColor)
       .text('S.No', 40, currentY + 3)
       .text('Grocery / Spice Item Name', 85, currentY + 3)
       .text('Quantity Required', 400, currentY + 3, { width: 150, align: 'right' });
    doc.moveTo(35, currentY + 15).lineTo(560, currentY + 15).stroke();
    currentY += 15;

    grocItems.forEach((item, index) => {
      ensureSpace(20);
      const name = sanitizeForPDF(item.name || '');
      const qty = item.qty !== undefined ? item.qty.toString() : '—';
      const unit = sanitizeForPDF(item.unit || '');

      doc.font(fontRegular).fontSize(9).fillColor('#1F2937')
         .text((index + 1).toString(), 40, currentY + 4)
         .text(name, 85, currentY + 4, { width: 300 })
         .text(`${qty} ${unit}`, 400, currentY + 4, { width: 150, align: 'right' });

      doc.lineWidth(0.2).strokeColor('#E5E7EB').moveTo(35, currentY + 16).lineTo(560, currentY + 16).stroke();
      currentY += 16;
    });
  }

  doc.end();
};
