import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';

// Controller imports
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { getCustomers, createCustomer, getCustomerById, updateCustomer, deleteCustomer, downloadCustomerPDF } from '../controllers/customerController.js';
import { getEvents, createEvent, getEventById, updateEvent, deleteEvent, duplicateEvent, updateMenuPlan, compileEventGroceries } from '../controllers/eventController.js';
import { getGroceries, createGrocery, updateGrocery, deleteGrocery, getVessels, createVessel, updateVessel, deleteVessel, getRentals, createRental, returnRental, deleteRental } from '../controllers/inventoryController.js';
import { getExpenses, createExpense, updateExpense, deleteExpense, getInvoices, createInvoice, getInvoiceById, updateInvoice, deleteInvoice, getPayments, recordPayment, downloadInvoicePDF, shareInvoiceEmail, getDashboardStats, exportFinancialsExcel } from '../controllers/financeController.js';
import { getLabour, createLabour, updateLabour, deleteLabour, getAttendance, recordAttendance, getLabourStats, getEventLabour, recordEventLabour, deleteEventLabour } from '../controllers/labourController.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, getCombos, createCombo, updateCombo, deleteCombo } from '../controllers/menuController.js';

const router = express.Router();

// ==========================================
// AUTHENTICATION
// ==========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', protect, getProfile);
router.put('/auth/profile', protect, updateProfile);

// ==========================================
// CUSTOMERS
// ==========================================
router.route('/customers')
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router.route('/customers/:id')
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

router.get('/customers/:id/pdf', downloadCustomerPDF);

// ==========================================
// EVENTS
// ==========================================
router.route('/events')
  .get(protect, getEvents)
  .post(protect, createEvent);

router.route('/events/:id')
  .get(protect, getEventById)
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

router.post('/events/:id/duplicate', protect, duplicateEvent);
router.put('/events/:id/menu', protect, updateMenuPlan);
router.get('/events/:id/groceries', protect, compileEventGroceries);

// ==========================================
// MENU ITEMS
// ==========================================
router.route('/menu-items')
  .get(protect, getMenuItems)
  .post(protect, createMenuItem);

router.route('/menu-items/:id')
  .put(protect, updateMenuItem)
  .delete(protect, deleteMenuItem);

// ==========================================
// COMBO PLANS
// ==========================================
router.route('/combos')
  .get(protect, getCombos)
  .post(protect, createCombo);

router.route('/combos/:id')
  .put(protect, updateCombo)
  .delete(protect, deleteCombo);

// ==========================================
// GROCERIES (INVENTORY)
// ==========================================
router.route('/groceries')
  .get(protect, getGroceries)
  .post(protect, createGrocery);

router.route('/groceries/:id')
  .put(protect, updateGrocery)
  .delete(protect, deleteGrocery);

// ==========================================
// EXPENSES
// ==========================================
router.route('/expenses')
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.route('/expenses/:id')
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

// ==========================================
// LABOUR & ATTENDANCE
// ==========================================
router.route('/labour')
  .get(protect, getLabour)
  .post(protect, createLabour);

router.route('/labour/:id')
  .put(protect, updateLabour)
  .delete(protect, deleteLabour);

router.get('/labour-stats', protect, getLabourStats);
router.get('/attendance', protect, getAttendance);
router.post('/attendance', protect, recordAttendance);

router.route('/event-labour')
  .get(protect, getEventLabour)
  .post(protect, recordEventLabour);

router.route('/event-labour/:id')
  .delete(protect, deleteEventLabour);

// ==========================================
// VESSELS & RENTALS
// ==========================================
router.route('/vessels')
  .get(protect, getVessels)
  .post(protect, createVessel);

router.route('/vessels/:id')
  .put(protect, updateVessel)
  .delete(protect, deleteVessel);

router.route('/rentals')
  .get(protect, getRentals)
  .post(protect, createRental);

router.route('/rentals/:id/return')
  .put(protect, returnRental);

router.route('/rentals/:id')
  .delete(protect, deleteRental);

// ==========================================
// BILLING & INVOICES
// ==========================================
router.route('/invoices')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/invoices/:id')
  .get(protect, getInvoiceById)
  .put(protect, updateInvoice)
  .delete(protect, deleteInvoice);

router.get('/invoices/:id/download', downloadInvoicePDF); // Public/Unprotected to make standard browser downloads simple
router.post('/invoices/:id/share', protect, shareInvoiceEmail);

// ==========================================
// PAYMENTS
// ==========================================
router.route('/payments')
  .get(protect, getPayments)
  .post(protect, recordPayment);

// ==========================================
// DASHBOARD & REPORTS
// ==========================================
router.get('/dashboard/stats', protect, getDashboardStats);
router.get('/reports/financials/excel', protect, exportFinancialsExcel);

// ==========================================
// SETTINGS
// ==========================================
router.route('/settings')
  .get(protect, getSettings)
  .put(protect, updateSettings);

// ==========================================
// NOTIFICATIONS
// ==========================================
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read/:id', protect, markAsRead);
router.post('/notifications/read-all', protect, markAllAsRead);

export default router;
