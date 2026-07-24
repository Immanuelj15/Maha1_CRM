import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class LocalDbCollection {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error(`Error reading ${this.filePath}:`, e);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing ${this.filePath}:`, e);
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async find(query = {}) {
    const items = this._read();
    return items.filter(item => {
      for (const key in query) {
        // Simple nested query or direct check
        if (query[key] !== undefined && item[key] !== query[key]) {
          // If query key is regex or object search, handle simple regex
          if (query[key] instanceof RegExp && !query[key].test(item[key])) {
            return false;
          }
          if (typeof query[key] === 'object' && query[key] !== null) {
            // E.g. { $ne: ... }
            if (query[key].$ne !== undefined && item[key] === query[key].$ne) return false;
            if (query[key].$in !== undefined && !query[key].$in.includes(item[key])) return false;
          } else if (item[key] !== query[key]) {
            return false;
          }
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items.length > 0 ? items[0] : null;
  }

  async findById(id) {
    const items = this._read();
    return items.find(item => item._id === id || item.id === id) || null;
  }

  async create(data) {
    const items = this._read();
    const newItem = {
      _id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    this._write(items);
    return newItem;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const items = this._read();
    const idx = items.findIndex(item => item._id === id || item.id === id);
    if (idx === -1) return null;

    // Handle Mongoose-style $set or direct update properties
    const currentItem = items[idx];
    let updateFields = update;
    if (update.$set) {
      updateFields = { ...updateFields, ...update.$set };
      delete updateFields.$set;
    }

    const updatedItem = {
      ...currentItem,
      ...updateFields,
      updatedAt: new Date().toISOString()
    };

    items[idx] = updatedItem;
    this._write(items);
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    const items = this._read();
    const idx = items.findIndex(item => item._id === id || item.id === id);
    if (idx === -1) return null;

    const removedItem = items[idx];
    items.splice(idx, 1);
    this._write(items);
    return removedItem;
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }

  async insertMany(arr) {
    const items = this._read();
    const newItems = arr.map(data => ({
      _id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    items.push(...newItems);
    this._write(items);
    return newItems;
  }

  async deleteMany(query = {}) {
    const items = this._read();
    const keepItems = [];
    const deletedItems = [];

    for (const item of items) {
      let matches = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        deletedItems.push(item);
      } else {
        keepItems.push(item);
      }
    }
    this._write(keepItems);
    return { deletedCount: deletedItems.length };
  }
}
