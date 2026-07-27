import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'assets', 'logo.png');

/**
 * Cross-platform Tamil & Custom Font Resolver.
 * Resolves font paths across Windows, Linux, Render, Railway, Docker environments.
 */
const resolveCustomFont = () => {
  const possiblePaths = [
    path.join(process.cwd(), 'assets', 'fonts', 'NotoSansTamil-Regular.ttf'),
    path.join(process.cwd(), 'backend', 'assets', 'fonts', 'NotoSansTamil-Regular.ttf'),
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansTamil-Regular.ttf')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  console.warn(`⚠️ [PDFKit Font Warning] Custom font not found in paths: ${possiblePaths.join(', ')}. Falling back to standard Helvetica.`);
  return null;
};

/**
 * Strips characters that PDFKit's built-in Helvetica font cannot render.
 */
const sanitizeForPDF = (text) => {
  if (!text) return '';
  let str = String(text);
  let cleaned = str.replace(/\s*\([^)]*[\u0080-\uFFFF][^)]*\)/g, '');
  cleaned = cleaned.replace(/[^\x00-\x7F]/g, '').trim();
  return cleaned.length > 0 ? cleaned : 'Item';
};

/**
 * Helper to safely set font on PDFDocument instance
 */
const applyFont = (doc, fontPath, isBold = false) => {
  if (fontPath && fs.existsSync(fontPath)) {
    try {
      doc.font(fontPath);
      return;
    } catch (err) {
      console.warn(`⚠️ Error applying font at ${fontPath}: ${err.message}. Falling back to Helvetica.`);
    }
  }
  doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
};

/**
 * Generate a professional invoice PDF
 */
export const generateInvoicePDF = (invoice, business, res, eventReportData = null, req = null) => {
  const fontPath = resolveCustomFont();
  const doc = new PDFDocument({ margin: 20, size: 'A4' });

  try {
    doc.pipe(res);
    const themeColor = '#5A1827';

    let pdfItems = [];
    let grandTotal = 0;

    if (eventReportData) {
      const { customer } = eventReportData;
      if (customer) {
        const cateringAmount = customer.totalAmount || 0;
        pdfItems.push({
          description: `Catering Service (Catering for ${customer.guestCount || 0} guests)`,
          amount: cateringAmount
        });
        grandTotal += cateringAmount;

        const rented = customer.rentedVessels || [];
        if (rented.length > 0) {
          pdfItems.push({ description: '--- RENTED VESSELS ---', amount: 0, isHeader: true });
          rented.forEach(v => {
            pdfItems.push({
              description: `Vessel Rent: ${sanitizeForPDF(v.vesselName)} (Qty: ${v.qty})`,
              amount: v.rentAmount || 0
            });
            grandTotal += v.rentAmount || 0;
          });
        }
      } else {
        (invoice.items || []).forEach(it => {
          pdfItems.push({ description: sanitizeForPDF(it.description), amount: it.amount || 0 });
          grandTotal += (it.amount || 0);
        });
      }
    } else {
      (invoice.items || []).forEach(it => {
        pdfItems.push({ description: sanitizeForPDF(it.description), amount: it.amount || 0 });
      });
      grandTotal = invoice.total || 0;
    }

    const drawPageBorders = () => {
      doc.save();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FDFBF7');
      doc.restore();
      doc.lineWidth(1.5).strokeColor(themeColor);
      doc.rect(20, 20, 555, 802).stroke();
      doc.lineWidth(0.5);
      doc.rect(23, 23, 549, 796).stroke();
    };

    const drawHeader = () => {
      const logoWidth = 75;
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 45, 32, { width: logoWidth });
        } else {
          throw new Error('Logo file not found');
        }
      } catch (err) {
        doc.lineWidth(1).strokeColor(themeColor);
        doc.circle(82, 65, 30).stroke();
        applyFont(doc, fontPath, false);
        doc.fontSize(7).fillColor(themeColor)
           .text('Maha\'s', 62, 58, { width: 40, align: 'center' })
           .text('Kitchen', 62, 68, { width: 40, align: 'center' });
      }
      
      applyFont(doc, fontPath, false);
      doc.fontSize(8).fillColor(themeColor)
         .text('fssai', 40, 108, { width: 85, align: 'center' })
         .text('12425029000477', 30, 118, { width: 105, align: 'center' });

      applyFont(doc, fontPath, true);
      doc.fontSize(18).fillColor(themeColor)
         .text('MAHALAKSHMI CATERING SERVICE &', 135, 45, { width: 410, align: 'center' })
         .text('MAHA\'S KITCHEN', 135, 70, { width: 410, align: 'center' });

      applyFont(doc, fontPath, false);
      doc.fontSize(10)
         .text('EB Office Opposite, Kovilpatti - 628 501.', 135, 94, { width: 410, align: 'center' })
         .text('Phone : 8682841582, 93608 84102.', 135, 112, { width: 410, align: 'center' });

      doc.lineWidth(1).strokeColor(themeColor).moveTo(30, 142).lineTo(565, 142).stroke();
    };

    const drawBillInfo = () => {
      applyFont(doc, fontPath, false);
      doc.fontSize(11).fillColor(themeColor).text('No.', 40, 155);

      applyFont(doc, fontPath, true);
      doc.fontSize(11).fillColor('#1F2937').text(String(invoice.invoiceNumber || '1'), 70, 155);

      applyFont(doc, fontPath, true);
      doc.fontSize(14).fillColor(themeColor).text('CASH BILL', 250, 152, { width: 100, align: 'center' });
      
      doc.lineWidth(1).strokeColor(themeColor).moveTo(260, 166).lineTo(340, 166).stroke();

      applyFont(doc, fontPath, false);
      doc.fontSize(11).fillColor(themeColor).text('Date:', 425, 155);
      
      applyFont(doc, fontPath, true);
      doc.fontSize(11).fillColor('#1F2937').text(String(invoice.date || ''), 465, 155, { width: 95, align: 'left' });

      doc.lineWidth(0.5).strokeColor(themeColor).moveTo(460, 168).lineTo(560, 168).stroke();

      applyFont(doc, fontPath, false);
      doc.fontSize(11).fillColor(themeColor).text('M/s.', 40, 182);

      applyFont(doc, fontPath, true);
      doc.fontSize(11).fillColor('#1F2937').text(sanitizeForPDF(invoice.customerName) || 'Customer', 70, 182);

      doc.save();
      doc.lineWidth(0.5).strokeColor(themeColor).dash(1, { space: 2 }).moveTo(65, 195).lineTo(560, 195).stroke();
      doc.restore();

      doc.lineWidth(0.5).strokeColor(themeColor).moveTo(30, 202).lineTo(565, 202).stroke();
    };

    const drawTableGrid = () => {
      doc.lineWidth(1).strokeColor(themeColor);
      doc.rect(30, 210, 535, 480).stroke();
      doc.moveTo(30, 235).lineTo(565, 235).stroke();
      doc.moveTo(70, 210).lineTo(70, 690).stroke();
      doc.moveTo(460, 210).lineTo(460, 690).stroke();

      applyFont(doc, fontPath, true);
      doc.fontSize(11).fillColor(themeColor)
         .text('SI', 30, 213, { width: 40, align: 'center' })
         .text('No.', 30, 222, { width: 40, align: 'center' })
         .text('Particulars', 85, 218)
         .text('Amount', 460, 213, { width: 105, align: 'center' })
         .text('Rs.', 460, 222, { width: 105, align: 'center' });
    };

    const drawFooter = () => {
      doc.lineWidth(1).strokeColor(themeColor);
      doc.rect(30, 690, 535, 25).stroke();
      doc.moveTo(460, 690).lineTo(460, 715).stroke();

      applyFont(doc, fontPath, true);
      doc.fontSize(11).fillColor(themeColor)
         .text('TOTAL', 380, 697)
         .text(grandTotal.toFixed(2), 460, 697, { width: 95, align: 'right' });

      doc.fontSize(10).fillColor(themeColor)
         .text('For Mahalakshmi Catering Service & Maha\'s Kitchen', 260, 745, { width: 290, align: 'right' });
    };

    drawPageBorders();
    drawHeader();
    drawBillInfo();
    drawTableGrid();
    drawFooter();

    let currentY = 245;
    const itemsPerPage = 18;
    let itemsCount = 0;

    pdfItems.forEach((item, index) => {
      if (itemsCount >= itemsPerPage) {
        doc.addPage();
        drawPageBorders();
        drawHeader();
        drawTableGrid();
        drawFooter();
        currentY = 245;
        itemsCount = 0;
      }

      if (item.isHeader) {
        applyFont(doc, fontPath, true);
        doc.fontSize(10).fillColor(themeColor).text(item.description, 85, currentY + 3);
      } else {
        applyFont(doc, fontPath, false);
        doc.fontSize(10).fillColor('#1F2937')
           .text((index + 1).toString(), 30, currentY + 3, { width: 40, align: 'center' })
           .text(item.description, 85, currentY + 3, { width: 365 })
           .text(Number(item.amount || 0).toFixed(2), 460, currentY + 3, { width: 95, align: 'right' });
      }

      doc.lineWidth(0.2).strokeColor('#E5E7EB').moveTo(30, currentY + 22).lineTo(565, currentY + 22).stroke();
      currentY += 24;
      itemsCount++;
    });

    doc.end();
  } catch (error) {
    console.error('💥 [PDF Service Error - generateInvoicePDF] Full Stack Trace:', error.stack || error);
    console.error(`📌 Request Info -> URL: ${req?.originalUrl || 'N/A'}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Invoice PDF.' });
    }
  }
};

/**
 * Generate event grocery list PDF
 */
export const generateGroceryPDF = (event, groceries, res, req = null) => {
  const fontPath = resolveCustomFont();
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  try {
    doc.pipe(res);
    const primaryColor = '#7D1525';
    const textDark = '#1F2937';
    const textMuted = '#4B5563';
    const dividerColor = '#E5E7EB';

    applyFont(doc, fontPath, true);
    doc.fontSize(20).fillColor(primaryColor).text('EVENT GROCERY LIST', 50, 50);

    applyFont(doc, fontPath, false);
    doc.fontSize(10).fillColor(textMuted)
       .text(`Generated for Event: ${sanitizeForPDF(event.name)}`, 50, 75)
       .text(`Event Date: ${String(event.date || 'N/A')}`, 50, 90)
       .text(`Guest Count: ${String(event.guestCount || '0')}`, 50, 105);

    doc.moveTo(50, 125).lineTo(550, 125).strokeColor(dividerColor).stroke();

    applyFont(doc, fontPath, true);
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

      applyFont(doc, fontPath, false);
      doc.fontSize(10).fillColor(textDark)
         .text(sanitizeForPDF(item.name), 50, currentY)
         .text(sanitizeForPDF(item.category || 'General'), 220, currentY)
         .text(`${item.quantity || 0} ${sanitizeForPDF(item.unit || 'kg')}`, 370, currentY, { width: 80, align: 'right' })
         .text(`Rs.${itemCost.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });

      currentY += 20;
    });

    doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor(dividerColor).stroke();
    currentY += 15;

    applyFont(doc, fontPath, true);
    doc.fontSize(11).fillColor(primaryColor)
       .text('Total Estimated Material Cost:', 250, currentY)
       .text(`Rs.${totalEstimatedCost.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });

    doc.end();
  } catch (error) {
    console.error('💥 [PDF Service Error - generateGroceryPDF] Full Stack Trace:', error.stack || error);
    console.error(`📌 Request Info -> Event ID: ${event?._id || 'N/A'}, URL: ${req?.originalUrl || 'N/A'}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Grocery PDF.' });
    }
  }
};

/**
 * Generate customer specific list PDF (menu, vegetables, or groceries)
 */
export const generateCustomerListPDF = (customer, type, items, res, req = null) => {
  const fontPath = resolveCustomFont();
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  try {
    doc.pipe(res);
    const primaryColor = '#7D1525';
    const textDark = '#1F2937';
    const textMuted = '#4B5563';
    const dividerColor = '#E5E7EB';

    applyFont(doc, fontPath, true);
    doc.fontSize(20).fillColor(primaryColor)
       .text(`CUSTOMER ${type.toUpperCase()} REQUIREMENTS`, 50, 50);

    applyFont(doc, fontPath, false);
    doc.fontSize(10).fillColor(textMuted)
       .text(`Customer Name: ${sanitizeForPDF(customer.name)}`, 50, 78)
       .text(`Phone: ${String(customer.phone || '-')}`, 50, 93)
       .text(`Email: ${String(customer.email || '-')}`, 50, 108)
       .text(`Event Date: ${String(customer.eventDate || 'N/A')}`, 50, 123)
       .text(`Event Type: ${String(customer.eventType || 'N/A')}`, 50, 138);

    doc.moveTo(50, 155).lineTo(550, 155).strokeColor(dividerColor).stroke();

    applyFont(doc, fontPath, true);
    doc.fontSize(11).fillColor(primaryColor)
       .text('S.No', 50, 175)
       .text('Item / Ingredient Name', 100, 175)
       .text('Qty', 380, 175, { width: 80, align: 'right' })
       .text('Unit Type', 470, 175, { width: 80, align: 'right' });

    doc.moveTo(50, 190).lineTo(550, 190).strokeColor(dividerColor).stroke();

    let currentY = 205;
    items.forEach((item, index) => {
      if (currentY > 720) { doc.addPage(); currentY = 50; }

      const rawName = typeof item === 'string' ? item : (item.name || '');
      const itemName = sanitizeForPDF(rawName);
      const itemUnit = typeof item === 'string' ? 'Standard' : (item.unit || 'Standard');
      const itemQty = typeof item === 'string' ? '-' : (item.qty !== undefined ? String(item.qty) : '-');

      applyFont(doc, fontPath, false);
      doc.fontSize(10).fillColor(textDark)
         .text((index + 1).toString(), 50, currentY)
         .text(itemName, 100, currentY, { width: 270 })
         .text(itemQty, 380, currentY, { width: 80, align: 'right' })
         .text(sanitizeForPDF(itemUnit), 470, currentY, { width: 80, align: 'right' });

      currentY += 22;
    });

    doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor(dividerColor).stroke();
    doc.end();
  } catch (error) {
    console.error('💥 [PDF Service Error - generateCustomerListPDF] Full Stack Trace:', error.stack || error);
    console.error(`📌 Request Info -> Customer ID: ${customer?._id || 'N/A'}, URL: ${req?.originalUrl || 'N/A'}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Customer List PDF.' });
    }
  }
};

/**
 * Generate unified requirements list PDF (menu, vegetables, and groceries)
 */
export const generateCustomerRequirementsPDF = (customer, res, req = null) => {
  const fontPath = resolveCustomFont();
  const doc = new PDFDocument({ margin: 20, size: 'A4' });

  try {
    doc.pipe(res);
    const themeColor = '#5A1827';

    const drawPageBorders = () => {
      doc.save();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FDFBF7');
      doc.restore();

      doc.lineWidth(1.5).strokeColor(themeColor);
      doc.rect(20, 20, 555, 802).stroke();
      doc.lineWidth(0.5);
      doc.rect(23, 23, 549, 796).stroke();
    };

    const drawMainHeader = () => {
      const logoWidth = 75;
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 45, 32, { width: logoWidth });
        } else {
          throw new Error('Logo file not found');
        }
      } catch (err) {
        doc.lineWidth(1).strokeColor(themeColor);
        doc.circle(82, 65, 30).stroke();
        applyFont(doc, fontPath, false);
        doc.fontSize(7).fillColor(themeColor)
           .text('Maha\'s', 62, 58, { width: 40, align: 'center' })
           .text('Kitchen', 62, 68, { width: 40, align: 'center' });
      }

      applyFont(doc, fontPath, true);
      doc.fontSize(16).fillColor(themeColor)
         .text('MAHALAKSHMI CATERING SERVICE &', 135, 42, { width: 410, align: 'center' });
      doc.fontSize(14)
         .text('MAHA\'S KITCHEN', 135, 62, { width: 410, align: 'center' });

      applyFont(doc, fontPath, false);
      doc.fontSize(10)
         .text('EB Office Opposite, Kovilpatti - 628 501.', 135, 84, { width: 410, align: 'center' })
         .text('Phone : 8682841582.', 135, 100, { width: 410, align: 'center' });

      doc.lineWidth(1).strokeColor(themeColor).moveTo(30, 125).lineTo(565, 125).stroke();
    };

    const drawClientInfo = () => {
      applyFont(doc, fontPath, true);
      doc.fontSize(11).fillColor(themeColor)
         .text('CUSTOMER REQUIREMENTS SHEET', 30, 135, { width: 535, align: 'center' });

      doc.lineWidth(0.5).strokeColor(themeColor).moveTo(30, 150).lineTo(565, 150).stroke();

      applyFont(doc, fontPath, true);
      doc.fontSize(9).fillColor(themeColor);
      doc.text('Client Name:', 40, 160);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(sanitizeForPDF(customer.name) || '-', 110, 160);

      applyFont(doc, fontPath, true);
      doc.text('Phone Number:', 40, 175);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(customer.phone ? String(customer.phone) : '-', 110, 175);

      applyFont(doc, fontPath, true);
      doc.text('Email Address:', 40, 190);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(customer.email ? String(customer.email) : '-', 110, 190);

      applyFont(doc, fontPath, true);
      doc.text('Venue/Address:', 40, 205);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(sanitizeForPDF(customer.address) || '-', 110, 205, { width: 180 });

      applyFont(doc, fontPath, true);
      doc.text('Event Date:', 310, 160);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(customer.eventDate ? String(customer.eventDate) : '-', 380, 160);

      applyFont(doc, fontPath, true);
      doc.text('Event Type:', 310, 175);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(customer.eventType ? String(customer.eventType) : '-', 380, 175);

      applyFont(doc, fontPath, true);
      doc.text('Guests Count:', 310, 190);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(customer.guestCount ? String(customer.guestCount) : '-', 380, 190);

      applyFont(doc, fontPath, true);
      doc.text('Service Type:', 310, 205);

      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#1F2937').text(customer.serviceType ? String(customer.serviceType) : 'Catering', 380, 205);

      doc.lineWidth(1).strokeColor(themeColor).moveTo(30, 230).lineTo(565, 230).stroke();
    };

    const drawSubsequentPageHeader = (pageNum) => {
      applyFont(doc, fontPath, true);
      doc.fontSize(9).fillColor(themeColor)
         .text('MAHALAKSHMI CATERING SERVICE & MAHA\'S KITCHEN - CUSTOMER REQUIREMENTS', 30, 32);
      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor(themeColor)
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
    applyFont(doc, fontPath, true);
    doc.fontSize(10).fillColor(themeColor).text('I. Food Menu Order / Dishes', 35, currentY);
    currentY += 18;

    if (menuItems.length === 0) {
      ensureSpace(18);
      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#6B7280').text('No menu items selected.', 45, currentY);
      currentY += 18;
    } else {
      ensureSpace(20);
      doc.lineWidth(0.5).strokeColor(themeColor);
      doc.moveTo(35, currentY).lineTo(560, currentY).stroke();
      applyFont(doc, fontPath, true);
      doc.fontSize(9).fillColor(themeColor)
         .text('S.No', 40, currentY + 3)
         .text('Item Name', 85, currentY + 3)
         .text('Course', 380, currentY + 3, { width: 80, align: 'left' })
         .text('Category', 470, currentY + 3, { width: 90, align: 'left' });
      doc.moveTo(35, currentY + 15).lineTo(560, currentY + 15).stroke();
      currentY += 15;

      menuItems.forEach((item, index) => {
        ensureSpace(20);
        const itemName = sanitizeForPDF(typeof item === 'string' ? item : (item.name || ''));
        const itemCourse = typeof item === 'string' ? '-' : (item.course || '-');
        const itemCategory = typeof item === 'string' ? '-' : (item.category || '-');

        applyFont(doc, fontPath, false);
        doc.fontSize(9).fillColor('#1F2937')
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
    applyFont(doc, fontPath, true);
    doc.fontSize(10).fillColor(themeColor).text('II. Vegetables Requirement', 35, currentY);
    currentY += 18;

    const vegItems = customer.vegetables || [];
    if (vegItems.length === 0) {
      ensureSpace(18);
      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#6B7280').text('No vegetables selected.', 45, currentY);
      currentY += 18;
    } else {
      ensureSpace(20);
      doc.lineWidth(0.5).strokeColor(themeColor);
      doc.moveTo(35, currentY).lineTo(560, currentY).stroke();
      applyFont(doc, fontPath, true);
      doc.fontSize(9).fillColor(themeColor)
         .text('S.No', 40, currentY + 3)
         .text('Vegetable Name', 85, currentY + 3)
         .text('Quantity Required', 400, currentY + 3, { width: 150, align: 'right' });
      doc.moveTo(35, currentY + 15).lineTo(560, currentY + 15).stroke();
      currentY += 15;

      vegItems.forEach((item, index) => {
        ensureSpace(20);
        const name = sanitizeForPDF(item.name || '');
        const qty = item.qty !== undefined ? String(item.qty) : '-';
        const unit = sanitizeForPDF(item.unit || '');

        applyFont(doc, fontPath, false);
        doc.fontSize(9).fillColor('#1F2937')
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
    applyFont(doc, fontPath, true);
    doc.fontSize(10).fillColor(themeColor).text('III. Groceries & Spices Requirement', 35, currentY);
    currentY += 18;

    const grocItems = customer.groceries || [];
    if (grocItems.length === 0) {
      ensureSpace(18);
      applyFont(doc, fontPath, false);
      doc.fontSize(9).fillColor('#6B7280').text('No groceries selected.', 45, currentY);
      currentY += 18;
    } else {
      ensureSpace(20);
      doc.lineWidth(0.5).strokeColor(themeColor);
      doc.moveTo(35, currentY).lineTo(560, currentY).stroke();
      applyFont(doc, fontPath, true);
      doc.fontSize(9).fillColor(themeColor)
         .text('S.No', 40, currentY + 3)
         .text('Grocery / Spice Item Name', 85, currentY + 3)
         .text('Quantity Required', 400, currentY + 3, { width: 150, align: 'right' });
      doc.moveTo(35, currentY + 15).lineTo(560, currentY + 15).stroke();
      currentY += 15;

      grocItems.forEach((item, index) => {
        ensureSpace(20);
        const name = sanitizeForPDF(item.name || '');
        const qty = item.qty !== undefined ? String(item.qty) : '-';
        const unit = sanitizeForPDF(item.unit || '');

        applyFont(doc, fontPath, false);
        doc.fontSize(9).fillColor('#1F2937')
           .text((index + 1).toString(), 40, currentY + 4)
           .text(name, 85, currentY + 4, { width: 300 })
           .text(`${qty} ${unit}`, 400, currentY + 4, { width: 150, align: 'right' });

        doc.lineWidth(0.2).strokeColor('#E5E7EB').moveTo(35, currentY + 16).lineTo(560, currentY + 16).stroke();
        currentY += 16;
      });
    }

    doc.end();
  } catch (error) {
    console.error('💥 [PDF Service Error - generateCustomerRequirementsPDF] Full Stack Trace:', error.stack || error);
    console.error(`📌 Request Info -> Customer ID: ${customer?._id || 'N/A'}, URL: ${req?.originalUrl || 'N/A'}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Customer Requirements PDF.' });
    }
  }
};
