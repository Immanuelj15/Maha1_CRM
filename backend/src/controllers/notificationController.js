import { Notification, Event, Invoice, Rental } from '../models/schemas.js';

// Auto scan and generate alerts before returning
const autoScanAlerts = async () => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Scan events in the next 3 days
    const events = await Event.find({ status: 'Confirmed' });
    for (const event of events) {
      const eventDate = new Date(event.date);
      const diffTime = eventDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 3) {
        const title = 'Upcoming Event Reminder';
        const message = `Event '${event.name}' is scheduled in ${diffDays} day(s) on ${event.date}`;
        
        // Avoid duplicate alerts
        const exists = await Notification.findOne({ title, message });
        if (!exists) {
          await Notification.create({
            title,
            message,
            type: 'event',
            status: 'unread',
            date: todayStr
          });
        }
      }
    }

    // 2. Scan outstanding vessel rentals
    const rentals = await Rental.find({ status: 'Rented' });
    for (const rental of rentals) {
      const returnDate = new Date(rental.returnDate);
      if (returnDate < today) {
        const title = 'Overdue Vessel Return';
        const message = `Vessel '${rental.vesselName}' rented by ${rental.renterName} was due on ${rental.returnDate}`;
        
        const exists = await Notification.findOne({ title, message });
        if (!exists) {
          await Notification.create({
            title,
            message,
            type: 'vessel',
            status: 'unread',
            date: todayStr
          });
        }
      }
    }

    // 3. Scan pending payments for completed events
    const invoices = await Invoice.find({ status: { $ne: 'Paid' } });
    for (const invoice of invoices) {
      // If invoice date is older than 7 days and unpaid, flag it
      const invDate = new Date(invoice.date);
      const diffTime = today - invDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        const title = 'Outstanding Payment Alert';
        const message = `Invoice '${invoice.invoiceNumber}' for ${invoice.customerName} remains unpaid after ${diffDays} days.`;
        
        const exists = await Notification.findOne({ title, message });
        if (!exists) {
          await Notification.create({
            title,
            message,
            type: 'payment',
            status: 'unread',
            date: todayStr
          });
        }
      }
    }
  } catch (error) {
    console.error('Auto scan notifications error:', error.message);
  }
};

export const getNotifications = async (req, res) => {
  try {
    await autoScanAlerts(); // scan and generate alerts
    const notifications = await Notification.find();
    
    // Sort notifications by date descending
    const sorted = notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Notification.findByIdAndUpdate(id, { status: 'read' }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const list = await Notification.find({ status: 'unread' });
    for (const item of list) {
      await Notification.findByIdAndUpdate(item._id, { status: 'read' });
    }
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
