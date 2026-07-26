import { Event, Customer, Grocery, Notification } from '../models/schemas.js';
import { generateGroceryPDF } from '../services/pdfService.js';

// Recipe Ingredient Mapping (per guest)
const RECIPE_INGREDIENTS = {
  'Chicken Biryani': [
    { name: 'Chicken', category: 'Others', unit: 'kg', qtyPerGuest: 0.2, unitCost: 8.0 },
    { name: 'Basmati Rice', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.15, unitCost: 2.5 },
    { name: 'Onions', category: 'Vegetables', unit: 'kg', qtyPerGuest: 0.05, unitCost: 1.0 },
    { name: 'Biryani Spices', category: 'Spices', unit: 'kg', qtyPerGuest: 0.01, unitCost: 15.0 }
  ],
  'Vegetable Biryani': [
    { name: 'Basmati Rice', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.15, unitCost: 2.5 },
    { name: 'Mixed Vegetables', category: 'Vegetables', unit: 'kg', qtyPerGuest: 0.15, unitCost: 1.5 },
    { name: 'Biryani Spices', category: 'Spices', unit: 'kg', qtyPerGuest: 0.01, unitCost: 15.0 }
  ],
  'Paneer Butter Masala': [
    { name: 'Paneer', category: 'Dairy', unit: 'kg', qtyPerGuest: 0.1, unitCost: 6.0 },
    { name: 'Butter', category: 'Dairy', unit: 'kg', qtyPerGuest: 0.02, unitCost: 5.0 },
    { name: 'Tomatoes', category: 'Vegetables', unit: 'kg', qtyPerGuest: 0.08, unitCost: 1.2 },
    { name: 'Cream', category: 'Dairy', unit: 'ltr', qtyPerGuest: 0.02, unitCost: 4.0 }
  ],
  'Dal Makhani': [
    { name: 'Black Lentils', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.08, unitCost: 2.0 },
    { name: 'Butter', category: 'Dairy', unit: 'kg', qtyPerGuest: 0.015, unitCost: 5.0 },
    { name: 'Spices', category: 'Spices', unit: 'kg', qtyPerGuest: 0.005, unitCost: 12.0 }
  ],
  'Butter Naan': [
    { name: 'Maida Flour', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.1, unitCost: 1.2 },
    { name: 'Butter', category: 'Dairy', unit: 'kg', qtyPerGuest: 0.01, unitCost: 5.0 }
  ],
  'Gulab Jamun': [
    { name: 'Mawa', category: 'Dairy', unit: 'kg', qtyPerGuest: 0.04, unitCost: 7.0 },
    { name: 'Sugar', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.06, unitCost: 1.0 }
  ],
  'Scrambled Eggs': [
    { name: 'Eggs', category: 'Dairy', unit: 'pcs', qtyPerGuest: 2.0, unitCost: 0.15 },
    { name: 'Butter', category: 'Dairy', unit: 'kg', qtyPerGuest: 0.005, unitCost: 5.0 }
  ],
  'Fruit Salad': [
    { name: 'Mixed Fruits', category: 'Vegetables', unit: 'kg', qtyPerGuest: 0.15, unitCost: 3.0 },
    { name: 'Honey', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.01, unitCost: 10.0 }
  ],
  'Coffee/Tea': [
    { name: 'Milk', category: 'Dairy', unit: 'ltr', qtyPerGuest: 0.1, unitCost: 1.5 },
    { name: 'Tea/Coffee Powder', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.005, unitCost: 14.0 },
    { name: 'Sugar', category: 'Groceries', unit: 'kg', qtyPerGuest: 0.01, unitCost: 1.0 }
  ]
};

// Generic fallback recipe per guest
const getGenericIngredients = (itemName) => {
  return [
    { name: `${itemName} Mix`, category: 'Groceries', unit: 'kg', qtyPerGuest: 0.1, unitCost: 3.5 },
    { name: 'Assorted Spices', category: 'Spices', unit: 'kg', qtyPerGuest: 0.005, unitCost: 10.0 }
  ];
};

export const createEvent = async (req, res) => {
  try {
    const { name, customerId, location, date, guestCount, eventType } = req.body;
    if (!name || !date) {
      return res.status(400).json({ success: false, message: 'Event Name and Date are required.' });
    }

    let customerName = '';
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) customerName = customer.name;
    }

    const event = await Event.create({
      name,
      customerId,
      customerName,
      location,
      date,
      guestCount: guestCount || 0,
      eventType: eventType || 'General',
      status: 'Inquiry',
      menuPlan: { breakfast: [], lunch: [], dinner: [] },
      timeline: [
        { time: '08:00 AM', activity: 'Kitchen setup and staff arrival' },
        { time: '12:00 PM', activity: 'Food prep starts at venue' }
      ]
    });

    // Create a notification
    await Notification.create({
      title: 'New Event Inquiry',
      message: `Event inquiry '${name}' created for ${date}`,
      type: 'event',
      status: 'unread',
      date: new Date().toISOString().split('T')[0]
    });

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error('Get event error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if status changed to Confirmed, add notification
    const existing = await Event.findById(id);
    const updated = await Event.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (existing && existing.status !== updated.status && updated.status === 'Confirmed') {
      await Notification.create({
        title: 'Event Confirmed',
        message: `Event '${updated.name}' has been Confirmed for ${updated.date}!`,
        type: 'event',
        status: 'unread',
        date: new Date().toISOString().split('T')[0]
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const duplicateEvent = async (req, res) => {
  try {
    const original = await Event.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const { name, date } = req.body;

    const duplicated = await Event.create({
      name: name || `${original.name} (Copy)`,
      customerId: original.customerId,
      customerName: original.customerName,
      location: original.location,
      date: date || original.date,
      guestCount: original.guestCount,
      eventType: original.eventType,
      status: 'Inquiry',
      menuPlan: original.menuPlan,
      timeline: original.timeline
    });

    return res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    console.error('Duplicate event error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateMenuPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { menuPlan } = req.body; // { breakfast: [], lunch: [], dinner: [] }

    const updated = await Event.findByIdAndUpdate(id, { $set: { menuPlan } }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Menu update error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Automatic Event-wise Grocery Sheet Compiler
export const compileEventGroceries = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const guests = event.guestCount || 1;
    const ingredientsMap = {};

    // Helper to merge recipes
    const addIngredients = (menuItemName) => {
      const recipes = RECIPE_INGREDIENTS[menuItemName] || getGenericIngredients(menuItemName);
      
      recipes.forEach(ing => {
        const key = ing.name.toLowerCase();
        const requiredQty = parseFloat((ing.qtyPerGuest * guests).toFixed(2));
        
        if (ingredientsMap[key]) {
          ingredientsMap[key].quantity += requiredQty;
        } else {
          ingredientsMap[key] = {
            name: ing.name,
            category: ing.category,
            unit: ing.unit,
            quantity: requiredQty,
            unitCost: ing.unitCost
          };
        }
      });
    };

    // Scan through all menu courses
    const allMenuCourses = [
      ...(event.menuPlan?.breakfast || []),
      ...(event.menuPlan?.lunch || []),
      ...(event.menuPlan?.dinner || [])
    ];

    allMenuCourses.forEach(item => {
      // Find item name
      const name = typeof item === 'string' ? item : item.name;
      addIngredients(name);
    });

    const compiledList = Object.values(ingredientsMap);

    if (req.query.download === 'true') {
      const safeEventName = (event.name || 'Event').replace(/[^a-zA-Z0-9_\-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="GroceryList-${safeEventName}.pdf"`);
      return generateGroceryPDF(event, compiledList, res);
    }

    return res.json({
      success: true,
      data: {
        event: {
          name: event.name,
          date: event.date,
          guestCount: guests
        },
        groceries: compiledList
      }
    });
  } catch (error) {
    console.error('Compile groceries error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
