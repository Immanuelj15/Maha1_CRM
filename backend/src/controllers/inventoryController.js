import { Grocery, Vessel, Rental, Notification } from '../models/schemas.js';

// ==========================================
// GROCERY INVENTORY
// ==========================================

export const getGroceries = async (req, res) => {
  try {
    const groceries = await Grocery.find();
    return res.json({ success: true, data: groceries });
  } catch (error) {
    console.error('Get groceries error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createGrocery = async (req, res) => {
  try {
    const { name, category, stock, unit, unitCost, lowStockThreshold } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and Category are required.' });
    }
    const grocery = await Grocery.create({ name, category, stock: stock || 0, unit: unit || 'kg', unitCost: unitCost || 0, lowStockThreshold: lowStockThreshold || 5 });
    return res.status(201).json({ success: true, data: grocery });
  } catch (error) {
    console.error('Create grocery error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateGrocery = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Grocery.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Grocery item not found.' });
    }

    // Trigger low stock notification
    if (updated.stock <= updated.lowStockThreshold) {
      await Notification.create({
        title: 'Low Stock Alert',
        message: `Inventory item '${updated.name}' is running low (${updated.stock} ${updated.unit} left).`,
        type: 'vessel',
        status: 'unread',
        date: new Date().toISOString().split('T')[0]
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update grocery error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteGrocery = async (req, res) => {
  try {
    const deleted = await Grocery.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Grocery item not found.' });
    }
    return res.json({ success: true, message: 'Grocery item deleted.' });
  } catch (error) {
    console.error('Delete grocery error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==========================================
// VESSEL MANAGEMENT
// ==========================================

export const getVessels = async (req, res) => {
  try {
    const vessels = await Vessel.find();
    return res.json({ success: true, data: vessels });
  } catch (error) {
    console.error('Get vessels error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createVessel = async (req, res) => {
  try {
    const { name, totalQty, size, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Vessel Name is required.' });
    }
    const qty = totalQty || 0;
    const vessel = await Vessel.create({
      name,
      totalQty: qty,
      rentedQty: 0,
      availableQty: qty,
      size: size || 'Medium',
      description: description || ''
    });
    return res.status(201).json({ success: true, data: vessel });
  } catch (error) {
    console.error('Create vessel error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateVessel = async (req, res) => {
  try {
    const { id } = req.params;
    const vessel = await Vessel.findById(id);
    if (!vessel) {
      return res.status(404).json({ success: false, message: 'Vessel not found.' });
    }

    const { name, totalQty, size, description } = req.body;
    const updatedTotal = totalQty !== undefined ? totalQty : vessel.totalQty;
    const updatedRented = vessel.rentedQty;
    const updatedAvailable = Math.max(0, updatedTotal - updatedRented);

    const updated = await Vessel.findByIdAndUpdate(id, {
      name: name || vessel.name,
      totalQty: updatedTotal,
      availableQty: updatedAvailable,
      size: size || vessel.size,
      description: description || vessel.description
    }, { new: true });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update vessel error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteVessel = async (req, res) => {
  try {
    const deleted = await Vessel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Vessel not found.' });
    }
    return res.json({ success: true, message: 'Vessel deleted.' });
  } catch (error) {
    console.error('Delete vessel error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==========================================
// RENTAL TRANSACTIONS
// ==========================================

export const getRentals = async (req, res) => {
  try {
    const rentals = await Rental.find();
    return res.json({ success: true, data: rentals });
  } catch (error) {
    console.error('Get rentals error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createRental = async (req, res) => {
  try {
    const { vesselId, renterName, phone, assignedDate, returnDate, qty, rentAmount, deposit } = req.body;
    if (!vesselId || !renterName || !qty || !assignedDate || !returnDate) {
      return res.status(400).json({ success: false, message: 'Please check required rental fields.' });
    }

    const vessel = await Vessel.findById(vesselId);
    if (!vessel) {
      return res.status(404).json({ success: false, message: 'Vessel not found.' });
    }

    if (vessel.availableQty < qty) {
      return res.status(400).json({ success: false, message: `Insufficient vessels. Only ${vessel.availableQty} available.` });
    }

    // Create rental
    const rental = await Rental.create({
      vesselId,
      vesselName: vessel.name,
      renterName,
      phone,
      assignedDate,
      returnDate,
      qty,
      rentAmount: rentAmount || 0,
      deposit: deposit || 0,
      paidAmount: 0,
      balanceAmount: rentAmount || 0,
      status: 'Rented'
    });

    // Update vessel stock counts
    await Vessel.findByIdAndUpdate(vesselId, {
      $set: {
        rentedQty: vessel.rentedQty + parseInt(qty),
        availableQty: vessel.availableQty - parseInt(qty)
      }
    });

    return res.status(201).json({ success: true, data: rental });
  } catch (error) {
    console.error('Create rental error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const returnRental = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paidAmount, notes } = req.body; // status: 'Returned' | 'Damaged'

    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental transaction not found.' });
    }

    if (rental.status !== 'Rented') {
      return res.status(400).json({ success: false, message: 'This rental has already been resolved.' });
    }

    const finalPaid = paidAmount !== undefined ? parseFloat(paidAmount) : rental.paidAmount;
    const balance = Math.max(0, rental.rentAmount - finalPaid);

    // Update rental status
    const updatedRental = await Rental.findByIdAndUpdate(id, {
      status: status || 'Returned',
      paidAmount: finalPaid,
      balanceAmount: balance,
      notes: notes || rental.notes
    }, { new: true });

    // Return stock back to Vessel inventory
    const vessel = await Vessel.findById(rental.vesselId);
    if (vessel) {
      const returnedCount = parseInt(rental.qty);
      const isDamaged = status === 'Damaged';

      // If damaged, we might permanently reduce total quantity
      const newTotal = isDamaged ? Math.max(0, vessel.totalQty - returnedCount) : vessel.totalQty;
      const newRented = Math.max(0, vessel.rentedQty - returnedCount);
      const newAvailable = Math.max(0, newTotal - newRented);

      await Vessel.findByIdAndUpdate(rental.vesselId, {
        totalQty: newTotal,
        rentedQty: newRented,
        availableQty: newAvailable
      });

      if (isDamaged) {
        await Notification.create({
          title: 'Damaged Vessel Report',
          message: `${returnedCount}x '${vessel.name}' rented to ${rental.renterName} returned DAMAGED.`,
          type: 'vessel',
          status: 'unread',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }

    return res.json({ success: true, data: updatedRental });
  } catch (error) {
    console.error('Return rental error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found.' });
    }

    // Revert vessel stock if still rented
    if (rental.status === 'Rented') {
      const vessel = await Vessel.findById(rental.vesselId);
      if (vessel) {
        await Vessel.findByIdAndUpdate(rental.vesselId, {
          rentedQty: Math.max(0, vessel.rentedQty - rental.qty),
          availableQty: Math.min(vessel.totalQty, vessel.availableQty + rental.qty)
        });
      }
    }

    await Rental.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Rental transaction deleted.' });
  } catch (error) {
    console.error('Delete rental error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
