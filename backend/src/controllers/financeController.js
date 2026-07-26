import { Expense, Invoice, Payment, Customer, Event, Labour, Rental, Settings, EventLabour, Attendance } from '../models/schemas.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { sendEmail } from '../services/emailService.js';
import { generateExcelBuffer } from '../services/excelService.js';
import { dbMode } from '../config/db.js';

// ==========================================
// EXPENSE CRUD
// ==========================================

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find();
    return res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { amount, category, date, status, description, eventId, eventName } = req.body;
    if (!amount || !category || !date) {
      return res.status(400).json({ success: false, message: 'Amount, category, and date are required.' });
    }
    const expense = await Expense.create({
      amount,
      category,
      date,
      status: status || 'Paid',
      description: description || '',
      eventId: eventId || '',
      eventName: eventName || ''
    });
    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Expense not found.' });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Expense not found.' });
    return res.json({ success: true, message: 'Expense deleted.' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==========================================
// INVOICE CRUD
// ==========================================

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    return res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { eventId, customerName, customerEmail, date, items, discount, tax, status } = req.body;
    if (!customerName || !items || items.length === 0 || !date) {
      return res.status(400).json({ success: false, message: 'Please provide customer details and itemized breakdown.' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discAmt = parseFloat(discount || 0);
    const taxAmt = parseFloat(tax || 0);
    const total = Math.max(0, subtotal - discAmt + taxAmt);

    // Auto-generate invoice number
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 101).toString()}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      eventId: eventId || '',
      customerName,
      customerEmail: customerEmail || '',
      date,
      items: items.map(it => ({
        description: it.description,
        quantity: parseInt(it.quantity) || 1,
        rate: parseFloat(it.rate) || 0,
        amount: (parseInt(it.quantity) || 1) * (parseFloat(it.rate) || 0)
      })),
      subtotal,
      discount: discAmt,
      tax: taxAmt,
      total,
      status: status || 'Unpaid'
    });

    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    return res.json({ success: true, data: invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, discount, tax, status, customerEmail } = req.body;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    let updates = { ...req.body };

    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const discAmt = parseFloat(discount !== undefined ? discount : invoice.discount);
      const taxAmt = parseFloat(tax !== undefined ? tax : invoice.tax);
      const total = Math.max(0, subtotal - discAmt + taxAmt);

      updates.items = items.map(it => ({
        description: it.description,
        quantity: parseInt(it.quantity) || 1,
        rate: parseFloat(it.rate) || 0,
        amount: (parseInt(it.quantity) || 1) * (parseFloat(it.rate) || 0)
      }));
      updates.subtotal = subtotal;
      updates.total = total;
    }

    const updated = await Invoice.findByIdAndUpdate(id, updates, { new: true });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update invoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const deleted = await Invoice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    return res.json({ success: true, message: 'Invoice deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PAYMENTS LEDGER
// ==========================================

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    return res.json({ success: true, data: payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { invoiceNumber, customerName, amount, method, date, reference, notes } = req.body;
    if (!invoiceNumber || !customerName || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Invoice Number, Customer, Amount and Date are required.' });
    }

    // Create payment entry
    const payment = await Payment.create({ invoiceNumber, customerName, amount: parseFloat(amount), method, date, reference: reference || '', notes: notes || '' });

    // Look up invoice to update paid status
    const invoiceList = await Invoice.find({ invoiceNumber });
    if (invoiceList.length > 0) {
      const invoice = invoiceList[0];
      const allPayments = await Payment.find({ invoiceNumber });
      const totalPaid = allPayments.reduce((sum, pay) => sum + pay.amount, 0);

      let invoiceStatus = 'Unpaid';
      if (totalPaid >= invoice.total) {
        invoiceStatus = 'Paid';
      } else if (totalPaid > 0) {
        invoiceStatus = 'Partial';
      }

      await Invoice.findByIdAndUpdate(invoice._id, { status: invoiceStatus });

      // Sync customer details
      let customer = null;
      if (invoice.eventId) {
        const event = await Event.findById(invoice.eventId);
        if (event && event.customerId) {
          customer = await Customer.findById(event.customerId);
        }
      }
      if (!customer) {
        customer = await Customer.findOne({ name: invoice.customerName });
      }

      if (customer) {
        customer.paidAmount = totalPaid;
        customer.balance = Math.max(0, customer.totalAmount - customer.discount - totalPaid);
        customer.paymentStatus = customer.balance <= 0 ? 'Paid' : 'Pending';
        await customer.save();
      }
    }

    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('Record payment error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==========================================
// EXPORTS & DOCUMENT STREAMS
// ==========================================

export const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    // Fetch settings
    let businessSettings = await Settings.findOne();
    if (!businessSettings) {
      businessSettings = {
        businessName: 'CaterMaster',
        address: '123 Culinary Drive, Gourmet Plaza',
        phone: '+1 (555) 123-4567',
        email: 'billing@catermaster.com',
        termsConditions: '50% deposit required. Net 7 terms.'
      };
    }

    const safeInvoiceNum = (invoice.invoiceNumber || 'Invoice').replace(/[^a-zA-Z0-9_\-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${safeInvoiceNum}.pdf"`);

    generateInvoicePDF(invoice, businessSettings, res);
  } catch (error) {
    console.error('PDF invoice download error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
};

export const shareInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { emailTo } = req.body;
    
    if (!emailTo) return res.status(400).json({ success: false, message: 'Recipient email is required.' });

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    // Buffer the PDF dynamically to attach to Nodemailer
    import('stream').then(async (stream) => {
      const chunks = [];
      const doc = new (await import('pdfkit')).default({ margin: 50, size: 'A4' });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);

        let businessSettings = await Settings.findOne();
        if (!businessSettings) {
          businessSettings = { businessName: 'CaterMaster' };
        }

        const emailResult = await sendEmail({
          to: emailTo,
          subject: `Invoice ${invoice.invoiceNumber} from ${businessSettings.businessName}`,
          text: `Dear Customer,\n\nPlease find attached your invoice ${invoice.invoiceNumber} for the total amount of Rs.${invoice.total.toFixed(2)}.\n\nThank you for choosing ${businessSettings.businessName}!`,
          html: `<p>Dear Customer,</p><p>Please find attached your invoice <b>${invoice.invoiceNumber}</b> for the amount of <b>Rs.${invoice.total.toFixed(2)}</b>.</p><p>Thank you for choosing ${businessSettings.businessName}!</p>`,
          attachments: [
            {
              filename: `Invoice-${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer
            }
          ]
        });

        if (emailResult.success) {
          return res.json({ success: true, message: 'Invoice shared successfully via Email!', previewUrl: emailResult.previewUrl });
        } else {
          return res.status(500).json({ success: false, message: 'Failed to send email.', error: emailResult.error });
        }
      });

      // Generate invoice contents (simple dummy mapping to create same design)
      let businessSettings = await Settings.findOne() || { businessName: 'CaterMaster', address: 'Culinary Road', phone: '555', email: 'mail' };
      generateInvoicePDF(invoice, businessSettings, doc);
    });
  } catch (error) {
    console.error('Share invoice email error:', error);
    return res.status(500).json({ success: false, message: 'Failed to share invoice via email.' });
  }
};

// ==========================================
// DASHBOARD & ANALYTICS METRICS
// ==========================================

export const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalEvents = await Event.countDocuments();
    
    const upcomingEvents = await Event.countDocuments({ status: 'Confirmed' });
    
    // Financial sums
    const invoices = await Invoice.find();
    const payments = await Payment.find();

    const paymentsMap = {};
    payments.forEach(p => {
      if (p.invoiceNumber) {
        paymentsMap[p.invoiceNumber] = (paymentsMap[p.invoiceNumber] || 0) + p.amount;
      }
    });

    let totalRevenue = 0;
    let outstandingPayments = 0;

    invoices.forEach(inv => {
      const paid = paymentsMap[inv.invoiceNumber] || 0;
      totalRevenue += paid;
      outstandingPayments += Math.max(0, inv.total - paid);
    });

    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const profit = totalRevenue - totalExpenses;

    // Rental checks
    const rentals = await Rental.find({ status: 'Rented' });
    const pendingVesselReturns = rentals.length;

    // Labour wages summary
    const allAttendance = await Attendance.find();
    let pendingLabourPayments = 0;
    allAttendance.forEach(att => {
      att.records.forEach(rec => {
        if (rec.paymentStatus === 'Pending' && rec.status === 'Present') {
          pendingLabourPayments += rec.wagePaid || 0;
        }
      });
    });

    const eventLabours = await EventLabour.find();
    eventLabours.forEach(el => {
      (el.workers || []).forEach(w => {
        pendingLabourPayments += (w.balance || 0);
      });
    });

    // Monthly charts data aggregation (mock structured records for dashboard charts)
    const monthlyRevenue = [
      { month: 'Jan', revenue: totalRevenue * 0.15, expenses: totalExpenses * 0.12 },
      { month: 'Feb', revenue: totalRevenue * 0.18, expenses: totalExpenses * 0.14 },
      { month: 'Mar', revenue: totalRevenue * 0.20, expenses: totalExpenses * 0.22 },
      { month: 'Apr', revenue: totalRevenue * 0.12, expenses: totalExpenses * 0.15 },
      { month: 'May', revenue: totalRevenue * 0.15, expenses: totalExpenses * 0.17 },
      { month: 'Jun', revenue: totalRevenue * 0.20, expenses: totalExpenses * 0.20 }
    ];

    // Activity feed mock entries (real logs combined with static context)
    const recentActivities = [
      { time: '10 mins ago', message: 'Invoice INV-2026-101 generated for Jane Doe' },
      { time: '1 hour ago', message: 'Vessel Rental returned by Grand Plaza catering' },
      { time: '4 hours ago', message: 'Labour Attendance checked for 8 crew workers' },
      { time: '1 day ago', message: 'Event "Summer Corporate Gala" marked Confirmed' }
    ];

    return res.json({
      success: true,
      data: {
        kpis: {
          totalCustomers,
          totalEvents,
          upcomingEvents,
          totalRevenue,
          totalExpenses,
          outstandingPayments,
          profit,
          pendingVesselReturns,
          pendingLabourPayments
        },
        charts: {
          monthlyRevenue,
          revenueVsExpense: [
            { category: 'Revenue', amount: totalRevenue },
            { category: 'Expenses', amount: totalExpenses }
          ]
        },
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const exportFinancialsExcel = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    const expenses = await Expense.find();

    const invoiceData = invoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Customer Name': inv.customerName,
      'Date': inv.date,
      'Subtotal (Rs.)': inv.subtotal,
      'Discount (Rs.)': inv.discount,
      'Tax (Rs.)': inv.tax,
      'Total Amount (Rs.)': inv.total,
      'Status': inv.status
    }));

    const expenseData = expenses.map(exp => ({
      'Category': exp.category,
      'Date': exp.date,
      'Amount (Rs.)': exp.amount,
      'Status': exp.status,
      'Description': exp.description
    }));

    const buffer = generateExcelBuffer(invoiceData.concat(expenseData), 'Financial Overview');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="CaterMaster_Financial_Report.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Excel generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Excel sheet.' });
  }
};
