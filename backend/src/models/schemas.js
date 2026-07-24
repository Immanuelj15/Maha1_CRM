import mongoose from 'mongoose';
import { createModel } from './modelRegistry.js';

const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }, // admin, manager, staff
  avatar: { type: String, default: '' },
  businessName: { type: String, default: 'CaterMaster Business' }
}, { timestamps: true });

// Customer Schema
const CustomerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, default: '' },
  eventType: { type: String, default: '' },
  eventDate: { type: String, default: '' },
  guestCount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  eventName: { type: String, default: '' },
  menuItems: { type: Array, default: [] },
  vegetables: { type: Array, default: [] },
  groceries: { type: Array, default: [] },
  totalAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'Pending' }, // Paid, Pending
  serviceType: { type: String, default: 'Catering' }, // Catering, Vessel Only
  rentedVessels: { type: Array, default: [] } // [{ vesselId, vesselName, qty, rentAmount, deposit, returnDate, rentalId }]
}, { timestamps: true });

// Event Schema
const EventSchema = new Schema({
  name: { type: String, required: true },
  customerId: { type: String, default: '' },
  customerName: { type: String, default: '' },
  location: { type: String, default: '' },
  date: { type: String, required: true },
  guestCount: { type: Number, default: 0 },
  eventType: { type: String, default: '' }, // Wedding, Birthday, Corporate, Anniversary, etc.
  status: { type: String, default: 'Inquiry' }, // Inquiry, Confirmed, Ongoing, Completed, Cancelled
  menuPlan: {
    breakfast: { type: Array, default: [] }, // [{ name, qty, estimatedCost }]
    lunch: { type: Array, default: [] },
    dinner: { type: Array, default: [] }
  },
  timeline: { type: Array, default: [] } // [{ time, activity }]
}, { timestamps: true });

// Grocery (Inventory) Schema
const GrocerySchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // Vegetables, Groceries, Dairy, Spices, Others
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' }, // kg, ltr, packet, pcs
  unitCost: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 }
}, { timestamps: true });

// Expense Schema
const ExpenseSchema = new Schema({
  amount: { type: Number, required: true },
  category: { type: String, required: true }, // Grocery, Vegetable, Labour, Transportation, Fuel, Maintenance, Miscellaneous
  date: { type: String, required: true },
  status: { type: String, default: 'Paid' }, // Paid, Pending
  description: { type: String, default: '' },
  eventId: { type: String, default: '' },
  eventName: { type: String, default: '' }
}, { timestamps: true });

// Labour Schema
const LabourSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'Server' }, // Chef, Server, Cleaner, Helper
  phone: { type: String, default: '' },
  dailyWage: { type: Number, default: 0 },
  status: { type: String, default: 'Active' } // Active, Inactive
}, { timestamps: true });

// Attendance Schema
const AttendanceSchema = new Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  records: [{
    workerId: { type: String, required: true },
    workerName: { type: String, required: true },
    status: { type: String, default: 'Present' }, // Present, Absent
    wagePaid: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'Pending' } // Paid, Pending, Partial
  }]
}, { timestamps: true });

// Vessel Schema
const VesselSchema = new Schema({
  name: { type: String, required: true },
  totalQty: { type: Number, default: 0 },
  rentedQty: { type: Number, default: 0 },
  availableQty: { type: Number, default: 0 },
  size: { type: String, default: '' }, // Small, Medium, Large
  description: { type: String, default: '' }
}, { timestamps: true });

// Rental (Vessel Renting) Schema
const RentalSchema = new Schema({
  vesselId: { type: String, required: true },
  vesselName: { type: String, required: true },
  renterName: { type: String, required: true },
  phone: { type: String, default: '' },
  assignedDate: { type: String, required: true },
  returnDate: { type: String, required: true },
  qty: { type: Number, default: 0 },
  rentAmount: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  status: { type: String, default: 'Rented' }, // Rented, Returned, Damaged
  notes: { type: String, default: '' }
}, { timestamps: true });

// Invoice Schema
const InvoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true },
  eventId: { type: String, default: '' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  date: { type: String, required: true },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, default: 'Unpaid' }, // Paid, Unpaid, Partial
  pdfUrl: { type: String, default: '' }
}, { timestamps: true });

// Payment Schema
const PaymentSchema = new Schema({
  invoiceNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, default: 'Cash' }, // Cash, UPI, Bank, Cheque
  date: { type: String, required: true },
  reference: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Notification Schema
const NotificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'event' }, // event, payment, vessel, labour
  status: { type: String, default: 'unread' }, // read, unread
  date: { type: String, required: true }
}, { timestamps: true });

// Settings Schema
const SettingsSchema = new Schema({
  businessName: { type: String, default: 'CaterMaster' },
  email: { type: String, default: 'contact@catermaster.com' },
  phone: { type: String, default: '+1 (555) 019-2834' },
  address: { type: String, default: '123 Gourmet Way, Culinary City' },
  gstNumber: { type: String, default: '' },
  logo: { type: String, default: '' },
  invoiceNotes: { type: String, default: 'Thank you for your business!' },
  termsConditions: { type: String, default: '50% advance payment required to confirm event booking.' },
  currencySymbol: { type: String, default: '₹' }
}, { timestamps: true });

// Export Compiled Models via proxy registry
export const User = createModel('User', UserSchema);
export const Customer = createModel('Customer', CustomerSchema);
export const Event = createModel('Event', EventSchema);
export const Grocery = createModel('Grocery', GrocerySchema);
export const Expense = createModel('Expense', ExpenseSchema);
export const Labour = createModel('Labour', LabourSchema);
export const Attendance = createModel('Attendance', AttendanceSchema);
export const Vessel = createModel('Vessel', VesselSchema);
export const Rental = createModel('Rental', RentalSchema);
export const Invoice = createModel('Invoice', InvoiceSchema);
export const Payment = createModel('Payment', PaymentSchema);
export const Notification = createModel('Notification', NotificationSchema);

export const Settings = createModel('Settings', SettingsSchema);

// MenuItem Schema
const MenuItemSchema = new Schema({
  name: { type: String, required: true },
  unitCost: { type: Number, required: true },
  course: { type: String, required: true }, // breakfast, lunch, dinner
  category: { type: String, default: 'Others' }
}, { timestamps: true });

export const MenuItem = createModel('MenuItem', MenuItemSchema);

// Combo Schema
const ComboSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  items: [{ type: String }], // Array of dish names
  course: { type: String, default: 'dinner' }, // breakfast, lunch, dinner
  category: { type: String, default: 'Combo' } // e.g. Traditional Lunch, Night Tiffin
}, { timestamps: true });

export const Combo = createModel('Combo', ComboSchema);

// EventLabour Schema
const EventLabourSchema = new Schema({
  eventId: { type: String, required: true },
  eventName: { type: String, required: true },
  eventDate: { type: String, required: true },
  customerName: { type: String, default: '' },
  address: { type: String, default: '' },
  workers: [{
    workerId: { type: String, default: '' },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    dailyWage: { type: Number, default: 0 },
    daysWorked: { type: Number, default: 1 },
    totalSalary: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: { type: String, default: 'Pending' } // Paid, Pending
  }]
}, { timestamps: true });

export const EventLabour = createModel('EventLabour', EventLabourSchema);

