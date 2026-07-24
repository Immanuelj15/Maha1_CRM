import mongoose from 'mongoose';
import { dbMode } from '../config/db.js';
import { LocalDbCollection } from '../database/localDbEngine.js';

export function createModel(modelName, schema) {
  let mongooseModel;
  try {
    mongooseModel = mongoose.model(modelName);
  } catch (e) {
    mongooseModel = mongoose.model(modelName, schema);
  }
  
  // Store the collection name using standard pluralisation
  const collectionName = modelName.toLowerCase() + 's';
  const localCollection = new LocalDbCollection(collectionName);

  // Return a proxy that redirects database calls at runtime depending on the dbMode configuration
  return new Proxy({}, {
    get(target, prop) {
      if (dbMode === 'mongodb') {
        const value = mongooseModel[prop];
        if (typeof value === 'function') {
          // Bind to model context to avoid losing Mongoose scopes
          return value.bind(mongooseModel);
        }
        return value;
      } else {
        const value = localCollection[prop];
        if (typeof value === 'function') {
          return value.bind(localCollection);
        }
        return value;
      }
    }
  });
}
