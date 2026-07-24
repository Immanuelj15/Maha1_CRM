import { MenuItem, Combo } from '../models/schemas.js';

// Get all menu items
export const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find();
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get menu items error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const { name, unitCost, course, category } = req.body;
    if (!name || unitCost === undefined || !course) {
      return res.status(400).json({ success: false, message: 'Name, Unit Cost, and Course are required.' });
    }
    const menuItem = await MenuItem.create({
      name,
      unitCost: parseFloat(unitCost) || 0,
      course,
      category: category || 'Others'
    });
    return res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Create menu item error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update an existing menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update menu item error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }
    return res.json({ success: true, message: 'Menu item deleted.' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get all combos
export const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find();
    return res.json({ success: true, data: combos });
  } catch (error) {
    console.error('Get combos error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Create a new combo
export const createCombo = async (req, res) => {
  try {
    const { name, description, items, course, category } = req.body;
    if (!name || !items) {
      return res.status(400).json({ success: false, message: 'Name and items are required.' });
    }
    const combo = await Combo.create({
      name,
      description: description || '',
      items,
      course: course || 'dinner',
      category: category || 'General Combo'
    });
    return res.status(201).json({ success: true, data: combo });
  } catch (error) {
    console.error('Create combo error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update an existing combo
export const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Combo.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Combo not found.' });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update combo error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Delete a combo
export const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Combo.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Combo not found.' });
    }
    return res.json({ success: true, message: 'Combo deleted.' });
  } catch (error) {
    console.error('Delete combo error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

