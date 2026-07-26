import { Customer, Event, Invoice, Notification, Vessel, Rental, Payment, EventLabour } from '../models/schemas.js';
import { generateCustomerListPDF, generateCustomerRequirementsPDF } from '../services/pdfService.js';

const syncRentedVessels = async (customer, incomingVessels) => {
  try {
    const customerName = customer.name;
    const customerPhone = customer.phone;
    const assignedDate = customer.eventDate || new Date().toISOString().split('T')[0];

    // Find existing rentals linked to this customer name and phone
    const oldVessels = customer.rentedVessels || [];
    const newVessels = incomingVessels || [];

    // Keep track of updated rentedVessels array to save back onto customer
    const updatedRentedVessels = [];

    // For any vessel in oldVessels that is NOT in newVessels, delete the rental
    for (const oldV of oldVessels) {
      if (oldV.rentalId) {
        const stillExists = newVessels.some(newV => newV.rentalId === oldV.rentalId);
        if (!stillExists) {
          // Delete rental and return stock
          const rental = await Rental.findById(oldV.rentalId);
          if (rental && rental.status === 'Rented') {
            const vessel = await Vessel.findById(rental.vesselId);
            if (vessel) {
              await Vessel.findByIdAndUpdate(rental.vesselId, {
                rentedQty: Math.max(0, vessel.rentedQty - rental.qty),
                availableQty: Math.min(vessel.totalQty, vessel.availableQty + rental.qty)
              });
            }
            await Rental.findByIdAndDelete(oldV.rentalId);
          }
        }
      }
    }

    // Process new and updated rentals
    for (const newV of newVessels) {
      const qty = parseInt(newV.qty) || 1;
      const unitRent = parseFloat(newV.rentAmount) || 0;
      const unitDeposit = parseFloat(newV.deposit) || 0;
      const totalRent = qty * unitRent;
      const totalDeposit = qty * unitDeposit;
      const retDate = newV.returnDate || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (!newV.rentalId) {
        // Create new rental
        const vessel = await Vessel.findById(newV.vesselId);
        if (vessel) {
          const rental = await Rental.create({
            vesselId: newV.vesselId,
            vesselName: vessel.name,
            renterName: customerName,
            phone: customerPhone,
            assignedDate,
            returnDate: retDate,
            qty,
            rentAmount: totalRent,
            deposit: totalDeposit,
            paidAmount: 0,
            balanceAmount: totalRent,
            status: 'Rented'
          });

          // Update vessel stock
          await Vessel.findByIdAndUpdate(newV.vesselId, {
            rentedQty: vessel.rentedQty + qty,
            availableQty: Math.max(0, vessel.availableQty - qty)
          });

          updatedRentedVessels.push({
            ...newV,
            vesselName: vessel.name,
            rentalId: rental._id.toString()
          });
        }
      } else {
        // Update existing rental
        const rental = await Rental.findById(newV.rentalId);
        if (rental) {
          const diff = qty - rental.qty;
          const vessel = await Vessel.findById(newV.vesselId);
          if (vessel) {
            // Adjust vessel stock based on difference
            await Vessel.findByIdAndUpdate(newV.vesselId, {
              rentedQty: Math.max(0, vessel.rentedQty + diff),
              availableQty: Math.max(0, vessel.availableQty - diff)
            });
          }

          await Rental.findByIdAndUpdate(newV.rentalId, {
            qty,
            rentAmount: totalRent,
            deposit: totalDeposit,
            returnDate: retDate,
            balanceAmount: Math.max(0, totalRent - rental.paidAmount)
          });

          updatedRentedVessels.push(newV);
        } else {
          // If rental was deleted in the background, treat as new
          const vessel = await Vessel.findById(newV.vesselId);
          if (vessel) {
            const rental = await Rental.create({
              vesselId: newV.vesselId,
              vesselName: vessel.name,
              renterName: customerName,
              phone: customerPhone,
              assignedDate,
              returnDate: retDate,
              qty,
              rentAmount: totalRent,
              deposit: totalDeposit,
              paidAmount: 0,
              balanceAmount: totalRent,
              status: 'Rented'
            });

            await Vessel.findByIdAndUpdate(newV.vesselId, {
              rentedQty: vessel.rentedQty + qty,
              availableQty: Math.max(0, vessel.availableQty - qty)
            });

            updatedRentedVessels.push({
              ...newV,
              vesselName: vessel.name,
              rentalId: rental._id.toString()
            });
          }
        }
      }
    }

    return updatedRentedVessels;
  } catch (error) {
    console.error('Error syncing rented vessels:', error);
    return incomingVessels;
  }
};

const createOrUpdateCustomerInvoice = async (customer, eventId) => {
  try {
    const serviceType = customer.serviceType || 'Catering';
    const guestCount = customer.guestCount || 50;
    const invoiceItems = [];

    // 1. Catering Service Cost (single line package)
    if (serviceType === 'Catering' || serviceType === 'Both') {
      invoiceItems.push({
        description: `${customer.eventType || 'General'} Catering Service Package (${guestCount} Guests)`,
        quantity: 1,
        rate: customer.totalAmount || 0,
        amount: customer.totalAmount || 0
      });
    }

    // 2. Rented vessels cost
    if (serviceType === 'Vessel Only' || serviceType === 'Both') {
      if (Array.isArray(customer.rentedVessels) && customer.rentedVessels.length > 0) {
        customer.rentedVessels.forEach(v => {
          const qty = parseInt(v.qty) || 1;
          const unitRent = parseFloat(v.rentAmount) || 0;
          invoiceItems.push({
            description: `Vessel Rental: ${v.vesselName}`,
            quantity: qty,
            rate: unitRent,
            amount: qty * unitRent
          });
        });
      }
    }

    // 3. Labour charges (if event labour records exist)
    const eventLabour = await EventLabour.findOne({ eventId });
    if (eventLabour && Array.isArray(eventLabour.workers) && eventLabour.workers.length > 0) {
      eventLabour.workers.forEach(w => {
        const salary = parseFloat(w.totalSalary) || 0;
        invoiceItems.push({
          description: `Labour Charge: ${w.name} (${w.daysWorked} days worked)`,
          quantity: 1,
          rate: salary,
          amount: salary
        });
      });
    }

    // Fallback if empty
    if (invoiceItems.length === 0) {
      const desc = serviceType === 'Vessel Only' ? 'Vessel Rental Base Service' : `${customer.eventType || 'General'} Catering Service Package`;
      invoiceItems.push({
        description: desc,
        quantity: 1,
        rate: customer.totalAmount || 5000,
        amount: customer.totalAmount || 5000
      });
    }

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    const discount = customer.discount || 0;
    const total = Math.max(0, subtotal - discount);
    const status = customer.paymentStatus === 'Paid' ? 'Paid' : (customer.paidAmount > 0 ? 'Partial' : 'Unpaid');

    // Check if invoice exists for this event
    let invoice = await Invoice.findOne({ eventId });
    if (invoice) {
      // Update existing invoice
      invoice.customerName = customer.name;
      invoice.customerEmail = customer.email || '';
      invoice.date = customer.eventDate || invoice.date;
      invoice.items = invoiceItems;
      invoice.subtotal = subtotal;
      invoice.discount = discount;
      invoice.total = total;
      invoice.status = status;
      await invoice.save();
    } else {
      const count = await Invoice.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 101).toString()}`;
      await Invoice.create({
        invoiceNumber,
        eventId,
        customerName: customer.name,
        customerEmail: customer.email || '',
        date: customer.eventDate || new Date().toISOString().split('T')[0],
        items: invoiceItems,
        subtotal,
        discount,
        tax: 0,
        total,
        status
      });

      // Log initial payment if customer paid amount is registered
      if (customer.paidAmount > 0) {
        await Payment.create({
          invoiceNumber,
          customerName: customer.name,
          amount: customer.paidAmount,
          method: 'Cash',
          date: customer.eventDate || new Date().toISOString().split('T')[0],
          notes: 'Initial advance payment registered during signup.'
        });
      }

      await Notification.create({
        title: 'Auto-Booked Event & Invoice',
        message: `Registered customer ${customer.name} and automatically created Event and Invoice ${invoiceNumber}.`,
        type: 'event',
        date: new Date().toISOString().split('T')[0]
      });
    }
  } catch (error) {
    console.error('Error creating/updating customer invoice:', error);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { 
      name, phone, email, address, eventType, eventDate, guestCount, notes, 
      menuItems, vegetables, groceries, totalAmount, discount, paidAmount, paymentStatus,
      serviceType, rentedVessels, eventName
    } = req.body;
    if (!name || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Name, phone, and email are required.' });
    }

    const totalAmt = parseFloat(totalAmount) || 0;
    const disc = parseFloat(discount) || 0;
    let paidAmt = parseFloat(paidAmount) || 0;
    let bal = totalAmt - disc - paidAmt;
    let payStatus = paymentStatus || (bal <= 0 ? 'Paid' : 'Pending');
    if (payStatus === 'Paid') {
      bal = 0;
      paidAmt = totalAmt - disc;
    } else {
      if (bal <= 0) {
        bal = 0;
        payStatus = 'Paid';
      }
    }

    const customer = await Customer.create({ 
      name, phone, email, address, eventType, eventDate, guestCount, notes,
      menuItems: menuItems || [],
      vegetables: vegetables || [],
      groceries: groceries || [],
      totalAmount: totalAmt,
      discount: disc,
      paidAmount: paidAmt,
      balance: bal,
      paymentStatus: payStatus,
      serviceType: serviceType || 'Catering',
      rentedVessels: [],
      eventName: eventName || ''
    });

    // Sync rented vessels to populate rentalIds
    const finalRented = await syncRentedVessels(customer, rentedVessels || []);
    customer.rentedVessels = finalRented;
    await customer.save();

    // Automatically book Event and generate Invoice if date and type are present
    if (eventDate && eventType) {
      const eventNameStr = eventName || `${name}'s ${eventType}`;
      const event = await Event.create({
        name: eventNameStr,
        customerId: customer._id.toString(),
        customerName: name,
        location: address || 'To be confirmed',
        date: eventDate,
        guestCount: guestCount || 50,
        eventType: eventType || 'General',
        status: 'Confirmed',
        menuPlan: {
          breakfast: [],
          lunch: menuItems || [],
          dinner: []
        },
        timeline: [
          { time: '08:00 AM', activity: 'Kitchen setup and staff arrival' },
          { time: '12:00 PM', activity: 'Food preparation and setup' },
          { time: '02:00 PM', activity: 'Catering service starts' }
        ]
      });

      await createOrUpdateCustomerInvoice(customer, event._id.toString());
    }

    return res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const { search, eventType } = req.query;
    let query = {};

    if (search) {
      // Regex lookup for MongoDB compatibility & fallback logic
      const searchRegex = new RegExp(search, 'i');
      query = {
        ...query,
        $or: [
          { name: searchRegex },
          { phone: searchRegex },
          { email: searchRegex }
        ]
      };
      
      // If dbMode is local, the simple RegExp match in localDbEngine takes care of it,
      // but we will do manual filtering for localDB if we use $or queries since localDbEngine is simple.
      // Let's make localDbEngine query parsing robust or handle it here!
      // To ensure local mode handles $or seamlessly:
    }

    let customers = await Customer.find(query);

    // Manual filtering fallback for local $or queries
    if (search && Array.isArray(customers) && customers.length > 0 && !customers[0]._id.match) {
      // In local mode, let's filter manually just in case
      const s = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.phone.toLowerCase().includes(s) || 
        c.email.toLowerCase().includes(s)
      );
    }

    if (eventType) {
      customers = customers.filter(c => c.eventType === eventType);
    }

    return res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Get customers error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Retrieve stats for Customer Profile page
    // 1. Total events booked by this customer — customerId stored as string in Event schema
    const events = await Event.find({ customerId: String(id) });
    // 2. Revenue generated by this customer
    const invoices = await Invoice.find({ customerName: customer.name });
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.status === 'Paid' ? inv.total : 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.status !== 'Paid' ? inv.total : 0), 0);

    return res.json({
      success: true,
      data: {
        customer,
        stats: {
          totalEvents: events.length,
          totalRevenue,
          totalOutstanding,
          history: events.map(ev => ({
            _id: ev._id,
            name: ev.name,
            date: ev.date,
            status: ev.status,
            guestCount: ev.guestCount
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get customer profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    let updates = { ...req.body };
    const current = await Customer.findById(id);
    if (current) {
      if (updates.rentedVessels !== undefined) {
        updates.rentedVessels = await syncRentedVessels(current, updates.rentedVessels);
      }

      if (updates.totalAmount !== undefined || updates.discount !== undefined || updates.paidAmount !== undefined || updates.paymentStatus !== undefined) {
        const totalAmt = parseFloat(updates.totalAmount !== undefined ? updates.totalAmount : current.totalAmount) || 0;
        const disc = parseFloat(updates.discount !== undefined ? updates.discount : current.discount) || 0;
        const paidAmt = parseFloat(updates.paidAmount !== undefined ? updates.paidAmount : current.paidAmount) || 0;
        const status = updates.paymentStatus !== undefined ? updates.paymentStatus : current.paymentStatus;

        if (status === 'Paid') {
          updates.balance = 0;
          updates.paidAmount = totalAmt - disc;
          updates.paymentStatus = 'Paid';
        } else {
          updates.balance = totalAmt - disc - paidAmt;
          updates.paidAmount = paidAmt;
          if (updates.balance <= 0) {
            updates.balance = 0;
            updates.paymentStatus = 'Paid';
          } else {
            updates.paymentStatus = 'Pending';
          }
        }
      }
    }

    const updated = await Customer.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (updates.paidAmount !== undefined) {
      const paidAmt = parseFloat(updates.paidAmount) || 0;
      const currentPaid = current.paidAmount || 0;
      const diff = paidAmt - currentPaid;
      if (Math.abs(diff) > 0.01) {
        // Find event/invoice to sync
        const event = await Event.findOne({ customerId: id });
        if (event) {
          const invoice = await Invoice.findOne({ eventId: event._id.toString() });
          if (invoice) {
            await Payment.create({
              invoiceNumber: invoice.invoiceNumber,
              customerName: updated.name,
              amount: diff,
              method: 'Adjustment',
              date: new Date().toISOString().split('T')[0],
              notes: 'Updated via Customer Payment Ledger.'
            });

            // Update invoice status
            const allPayments = await Payment.find({ invoiceNumber: invoice.invoiceNumber });
            const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
            invoice.status = totalPaid >= invoice.total ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
            await invoice.save();
          }
        }
      }
    }

    // Auto-create/Update Event and Invoice on update if event details are present
    if (updated.eventDate && updated.eventType) {
      let event = await Event.findOne({ customerId: id });
      if (!event) {
        const eventNameStr = updated.eventName || `${updated.name}'s ${updated.eventType}`;
        event = await Event.create({
          name: eventNameStr,
          customerId: id,
          customerName: updated.name,
          location: updated.address || 'To be confirmed',
          date: updated.eventDate,
          guestCount: updated.guestCount || 50,
          eventType: updated.eventType || 'General',
          status: 'Confirmed',
          menuPlan: {
            breakfast: [],
            lunch: updated.menuItems || [],
            dinner: []
          },
          timeline: [
            { time: '08:00 AM', activity: 'Kitchen setup and staff arrival' },
            { time: '12:00 PM', activity: 'Food preparation and setup' },
            { time: '02:00 PM', activity: 'Catering service starts' }
          ]
        });
      } else {
        // Sync event attributes if event date, location, or menuItems changed
        event.customerName = updated.name;
        event.date = updated.eventDate;
        event.location = updated.address || event.location;
        event.guestCount = updated.guestCount || event.guestCount;
        event.menuPlan.lunch = updated.menuItems || event.menuPlan.lunch;
        await event.save();
      }
      
      // Create or update customer invoice
      await createOrUpdateCustomerInvoice(updated, event._id.toString());
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (customer && customer.rentedVessels) {
      for (const rv of customer.rentedVessels) {
        if (rv.rentalId) {
          const rental = await Rental.findById(rv.rentalId);
          if (rental && rental.status === 'Rented') {
            const vessel = await Vessel.findById(rental.vesselId);
            if (vessel) {
              await Vessel.findByIdAndUpdate(rental.vesselId, {
                rentedQty: Math.max(0, vessel.rentedQty - rental.qty),
                availableQty: Math.min(vessel.totalQty, vessel.availableQty + rental.qty)
              });
            }
            await Rental.findByIdAndDelete(rv.rentalId);
          }
        }
      }
    }

    const deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    return res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (error) {
    console.error('Delete customer error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const downloadCustomerPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'menu', 'vegetables', 'groceries', or 'all' / undefined

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const safeName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9_\-]/g, '_');

    if (!type || type === 'all') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Requirements-${safeName}.pdf"`);
      return generateCustomerRequirementsPDF(customer, res);
    }

    if (!['menu', 'vegetables', 'groceries'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid PDF type. Must be menu, vegetables, groceries, or all.' });
    }

    let items = [];
    let label = 'Menu';
    if (type === 'menu') {
      items = customer.menuItems || [];
      label = 'Menu';
    } else if (type === 'vegetables') {
      items = customer.vegetables || [];
      label = 'Vegetables';
    } else if (type === 'groceries') {
      items = customer.groceries || [];
      label = 'Groceries';
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${safeName}.pdf"`);

    return generateCustomerListPDF(customer, label, items, res);
  } catch (error) {
    console.error('Download customer PDF error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
