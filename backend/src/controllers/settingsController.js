import { Settings } from '../models/schemas.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        businessName: 'CaterMaster CRM',
        email: 'info@catermaster.com',
        phone: '+1 (555) 019-2834',
        address: '123 Gourmet Way, Culinary City',
        gstNumber: 'GST-992019A',
        logo: '',
        invoiceNotes: 'Thank you for choosing CaterMaster for your event!',
        termsConditions: '50% advance required to confirm booking. Cancellation within 48h incurs 20% charge.',
        currencySymbol: '₹'
      });
    }
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    let updated;

    if (!settings) {
      updated = await Settings.create(req.body);
    } else {
      updated = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
