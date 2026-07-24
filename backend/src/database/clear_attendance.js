import { connectDB } from '../config/db.js';
import { Attendance, EventLabour } from '../models/schemas.js';

const clear = async () => {
  try {
    await connectDB();
    // Delete all attendance records
    await Attendance.deleteMany({});
    // Delete all event labour records
    await EventLabour.deleteMany({});
    console.log('✅ Cleared all attendance and event labour records from database.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear database:', error);
    process.exit(1);
  }
};

clear();
