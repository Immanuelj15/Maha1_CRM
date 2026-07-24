import { Labour, Attendance, Notification, EventLabour } from '../models/schemas.js';

export const getLabour = async (req, res) => {
  try {
    const workers = await Labour.find();
    return res.json({ success: true, data: workers });
  } catch (error) {
    console.error('Get labour error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createLabour = async (req, res) => {
  try {
    const { name, role, phone, dailyWage } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Worker Name and Role are required.' });
    }
    const worker = await Labour.create({ name, role, phone: phone || '', dailyWage: dailyWage || 0, status: 'Active' });
    return res.status(201).json({ success: true, data: worker });
  } catch (error) {
    console.error('Create labour error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateLabour = async (req, res) => {
  try {
    const updated = await Labour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update labour error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteLabour = async (req, res) => {
  try {
    const deleted = await Labour.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Worker not found.' });
    return res.json({ success: true, message: 'Labour deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ATTENDANCE & PAYMENTS
// ==========================================

export const getAttendance = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const targetDate = date || new Date().toISOString().split('T')[0];

    const records = await Attendance.find({ date: targetDate });
    return res.json({ success: true, data: records.length > 0 ? records[0] : null });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const recordAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ workerId, workerName, status, wagePaid, paymentStatus }]
    if (!date || !records || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Date and Attendance records are required.' });
    }

    const existing = await Attendance.find({ date });
    let result;

    if (existing.length > 0) {
      result = await Attendance.findByIdAndUpdate(existing[0]._id, { records }, { new: true });
    } else {
      result = await Attendance.create({ date, records });
    }

    // Trigger low attendance or labor payment alerts if needed
    const pendingWorkers = records.filter(r => r.paymentStatus === 'Pending').length;
    if (pendingWorkers > 0) {
      await Notification.create({
        title: 'Pending Wages Alert',
        message: `Wages are pending for ${pendingWorkers} workers on attendance date ${date}.`,
        type: 'labour',
        status: 'unread',
        date: new Date().toISOString().split('T')[0]
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Record attendance error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getLabourStats = async (req, res) => {
  try {
    const workers = await Labour.find({ status: 'Active' });
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.find({ date: today });
    
    let presentCount = 0;
    if (todayAttendance.length > 0) {
      presentCount = todayAttendance[0].records.filter(r => r.status === 'Present').length;
    }

    // Sum all pending/paid labor payments across all attendance sheets
    const allAttendance = await Attendance.find();
    let pendingWagesTotal = 0;
    let paidWagesTotal = 0;
    
    allAttendance.forEach(att => {
      att.records.forEach(rec => {
        if (rec.status === 'Present') {
          if (rec.paymentStatus === 'Paid') {
            paidWagesTotal += rec.wagePaid || 0;
          } else {
            pendingWagesTotal += rec.wagePaid || 0;
          }
        }
      });
    });

    // Also sum outstanding balances and paid amounts from event labour allocations
    const eventLabours = await EventLabour.find();
    eventLabours.forEach(el => {
      (el.workers || []).forEach(w => {
        pendingWagesTotal += (w.balance || 0);
        paidWagesTotal += (w.paidAmount || 0);
      });
    });

    return res.json({
      success: true,
      data: {
        totalWorkers: workers.length,
        todayAttendance: presentCount,
        pendingLabourPayments: pendingWagesTotal,
        paidLabourPayments: paidWagesTotal
      }
    });
  } catch (error) {
    console.error('Get labour stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getEventLabour = async (req, res) => {
  try {
    const { eventId, date } = req.query;
    const filter = {};
    if (eventId) filter.eventId = eventId;
    if (date) filter.eventDate = date;

    const records = await EventLabour.find(filter);
    return res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get event labour error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const recordEventLabour = async (req, res) => {
  try {
    const { eventId, eventName, eventDate, customerName, address, workers } = req.body;
    if (!eventId || !eventName || !eventDate) {
      return res.status(400).json({ success: false, message: 'eventId, eventName, and eventDate are required.' });
    }

    const existing = await EventLabour.findOne({ eventId });
    let result;
    if (existing) {
      result = await EventLabour.findByIdAndUpdate(existing._id, {
        eventName,
        eventDate,
        customerName: customerName || '',
        address: address || '',
        workers: workers || []
      }, { new: true });
    } else {
      result = await EventLabour.create({
        eventId,
        eventName,
        eventDate,
        customerName: customerName || '',
        address: address || '',
        workers: workers || []
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Record event labour error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteEventLabour = async (req, res) => {
  try {
    const deleted = await EventLabour.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Event labour record not found.' });
    return res.json({ success: true, message: 'Event labour allocation deleted.' });
  } catch (error) {
    console.error('Delete event labour error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
