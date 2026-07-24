import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import {
  User, Customer, Event, Grocery, Expense,
  Labour, Attendance, Vessel, Rental, Invoice,
  Payment, Notification, Settings, MenuItem, Combo
} from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding process...');
    
    // Connect to whatever database mode is active
    await connectDB();

    // 1. CLEAR EXISTING DATA (using deleteMany which is supported in both modes)
    console.log('🧹 Purging existing tables/files...');
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Event.deleteMany({});
    await Grocery.deleteMany({});
    await Expense.deleteMany({});
    await Labour.deleteMany({});
    await Attendance.deleteMany({});
    await Vessel.deleteMany({});
    await Rental.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    await Settings.deleteMany({});
    await MenuItem.deleteMany({});
    await Combo.deleteMany({});

    // 2. SEED DEFAULT USER
    console.log('👤 Seeding default admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const demoUser = await User.create({
      username: 'Chef CaterMaster',
      email: 'admin@catermaster.com',
      password: hashedPassword,
      role: 'admin',
      businessName: 'Gourmet Catering Co.'
    });
    console.log(`✅ Seeded user: ${demoUser.email} / admin123`);

    // 2b. SEED DEFAULT MENU ITEMS
    console.log('🍽️ Seeding default menu items from JSON catalog...');
    const presetDishes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seed', 'menuitems.json'), 'utf-8'));
    for (const item of presetDishes) {
      await MenuItem.create(item);
    }
    console.log(`✅ Seeded ${presetDishes.length} menu items`);

    // 2c. SEED DEFAULT COMBOS
    console.log('🍱 Seeding default combos from JSON catalog...');
    const presetCombos = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seed', 'combos.json'), 'utf-8'));

    for (const combo of presetCombos) {
      await Combo.create(combo);
    }
    console.log(`✅ Seeded ${presetCombos.length} combos`);

    // 3. SEED SETTINGS
    console.log('⚙️ Seeding default settings...');
    await Settings.create({
      businessName: 'Gourmet Catering Co.',
      email: 'contact@gourmetcatering.com',
      phone: '+1 (555) 789-0123',
      address: '456 Culinary Boulevard, Suite 100, Food City',
      gstNumber: 'GST-US-991A8',
      logo: '',
      invoiceNotes: 'We appreciate your business. Thank you for celebrating with us!',
      termsConditions: 'A 50% deposit is required to confirm bookings. Balance is due 7 days prior to the event.',
      currencySymbol: '₹'
    });

    // 4. SEED CUSTOMERS
    console.log('👥 Seeding customer base...');
    const customers = [
      { name: 'John Doe', phone: '+1 (555) 123-4567', email: 'john@example.com', address: '789 Maple St, Suburban Village', eventType: 'Wedding', eventDate: '2026-07-15', guestCount: 150, notes: 'Prefers organic options' },
      { name: 'Jane Smith', phone: '+1 (555) 234-5678', email: 'jane@example.com', address: '101 Pine Ave, Downtown City', eventType: 'Birthday', eventDate: '2026-06-30', guestCount: 45, notes: 'Nut allergy awareness required' },
      { name: 'Michael Jenkins', phone: '+1 (555) 345-6789', email: 'm.jenkins@corp.com', address: '55 Enterprise Way, Tech Hub', eventType: 'Corporate', eventDate: '2026-08-01', guestCount: 200, notes: 'Requires premium visual setup' }
    ];
    const createdCustomers = [];
    for (const c of customers) {
      const cust = await Customer.create(c);
      createdCustomers.push(cust);
    }

    // 5. SEED GROCERY INVENTORY
    console.log('🥦 Seeding grocery stock...');
    const groceries = [
      { name: 'Basmati Rice', category: 'Groceries', stock: 120, unit: 'kg', unitCost: 2.2, lowStockThreshold: 15 },
      { name: 'Paneer', category: 'Dairy', stock: 8, unit: 'kg', unitCost: 6.5, lowStockThreshold: 10 },
      { name: 'Chicken', category: 'Others', stock: 85, unit: 'kg', unitCost: 8.0, lowStockThreshold: 20 },
      { name: 'Mixed Vegetables', category: 'Vegetables', stock: 40, unit: 'kg', unitCost: 1.5, lowStockThreshold: 10 },
      { name: 'Biryani Spices', category: 'Spices', stock: 25, unit: 'kg', unitCost: 14.0, lowStockThreshold: 5 },
      { name: 'Butter', category: 'Dairy', stock: 35, unit: 'kg', unitCost: 5.2, lowStockThreshold: 8 },
      { name: 'Milk', category: 'Dairy', stock: 18, unit: 'ltr', unitCost: 1.2, lowStockThreshold: 10 },
      { name: 'Mixed Fruits', category: 'Vegetables', stock: 3, unit: 'kg', unitCost: 3.5, lowStockThreshold: 15 },
      { name: 'Sugar', category: 'Groceries', stock: 50, unit: 'kg', unitCost: 0.9, lowStockThreshold: 10 },
      { name: 'Beans (பீன்ஸ்)', category: 'Vegetables', stock: 50, unit: 'kg', unitCost: 1.2, lowStockThreshold: 10 },
      { name: 'Carrot (கேரட்)', category: 'Vegetables', stock: 50, unit: 'kg', unitCost: 1.5, lowStockThreshold: 10 },
      { name: 'Avaraikkai (அவரைக்காய்)', category: 'Vegetables', stock: 30, unit: 'kg', unitCost: 1.1, lowStockThreshold: 8 },
      { name: 'Chow Chow (சவ் சவ்)', category: 'Vegetables', stock: 30, unit: 'kg', unitCost: 0.9, lowStockThreshold: 8 },
      { name: 'Kose (கோஸ்)', category: 'Vegetables', stock: 40, unit: 'kg', unitCost: 0.8, lowStockThreshold: 10 },
      { name: 'Murungaikkai (முருங்கைக்காய்)', category: 'Vegetables', stock: 25, unit: 'kg', unitCost: 1.8, lowStockThreshold: 5 },
      { name: 'Mullangi (முள்ளங்கி)', category: 'Vegetables', stock: 30, unit: 'kg', unitCost: 0.9, lowStockThreshold: 8 },
      { name: 'Urulai Kizhangu (உருளை கிழங்கு)', category: 'Vegetables', stock: 100, unit: 'kg', unitCost: 1.0, lowStockThreshold: 20 },
      { name: 'Pudalangkai (புடலங்காய்)', category: 'Vegetables', stock: 30, unit: 'kg', unitCost: 1.0, lowStockThreshold: 8 },
      { name: 'Kathirikkai (கத்தரிக்காய்)', category: 'Vegetables', stock: 45, unit: 'kg', unitCost: 1.2, lowStockThreshold: 10 },
      { name: 'Vendakkaai (வெண்டைக்காய்)', category: 'Vegetables', stock: 40, unit: 'kg', unitCost: 1.3, lowStockThreshold: 10 },
      { name: 'Beetroot (பீட்ரூட்)', category: 'Vegetables', stock: 35, unit: 'kg', unitCost: 1.4, lowStockThreshold: 8 },
      { name: 'Knol Khol / Nookkal (நூக்கல்)', category: 'Vegetables', stock: 20, unit: 'kg', unitCost: 1.2, lowStockThreshold: 5 },
      { name: 'Turnip (டர்னிப்பு)', category: 'Vegetables', stock: 20, unit: 'kg', unitCost: 1.3, lowStockThreshold: 5 },
      { name: 'Kaalaan (காளான்)', category: 'Vegetables', stock: 15, unit: 'kg', unitCost: 3.5, lowStockThreshold: 5 },
      { name: 'Cauliflower (காளி பிளவர்)', category: 'Vegetables', stock: 25, unit: 'pcs', unitCost: 1.5, lowStockThreshold: 5 },
      { name: 'Pachai Pattani (பச்சைப்பட்டாணி)', category: 'Vegetables', stock: 20, unit: 'kg', unitCost: 2.2, lowStockThreshold: 5 },
      { name: 'Butter Beans (பட்டர் பீன்ஸ்)', category: 'Vegetables', stock: 15, unit: 'kg', unitCost: 3.0, lowStockThreshold: 5 },
      { name: 'Inji (இஞ்சி)', category: 'Vegetables', stock: 15, unit: 'kg', unitCost: 4.5, lowStockThreshold: 5 },
      { name: 'Milagai (மிளகாய்)', category: 'Vegetables', stock: 20, unit: 'kg', unitCost: 1.8, lowStockThreshold: 5 },
      { name: 'Kudai Milagai (குடை மிளகாய்)', category: 'Vegetables', stock: 15, unit: 'kg', unitCost: 3.2, lowStockThreshold: 5 },
      { name: 'Senai Kizhangu (சேனைக்கிழங்கு)', category: 'Vegetables', stock: 50, unit: 'kg', unitCost: 1.4, lowStockThreshold: 10 },
      { name: 'Seppan Kizhangu (சேப்பங்கிழங்கு)', category: 'Vegetables', stock: 40, unit: 'kg', unitCost: 1.5, lowStockThreshold: 10 },
      { name: 'Thadiyangkai (தடியங்காய்)', category: 'Vegetables', stock: 30, unit: 'kg', unitCost: 0.8, lowStockThreshold: 8 },
      { name: 'Ulli Vengayam (உள்ளி வெங்காயம்)', category: 'Vegetables', stock: 80, unit: 'kg', unitCost: 2.5, lowStockThreshold: 15 },
      { name: 'Ballari Vengayam (பல்லாரி வெங்காயம்)', category: 'Vegetables', stock: 150, unit: 'kg', unitCost: 1.2, lowStockThreshold: 25 },
      { name: 'Vengayathaal (வெங்காயத்தாள்)', category: 'Vegetables', stock: 15, unit: 'kg', unitCost: 2.0, lowStockThreshold: 5 },
      { name: 'Elumichai (எலுமிச்சை)', category: 'Vegetables', stock: 100, unit: 'pcs', unitCost: 0.1, lowStockThreshold: 20 },
      { name: 'Thakkali (தக்காளி)', category: 'Vegetables', stock: 80, unit: 'kg', unitCost: 1.4, lowStockThreshold: 15 },
      { name: 'Mallithazhai (மல்லித்தழை)', category: 'Vegetables', stock: 10, unit: 'kg', unitCost: 2.5, lowStockThreshold: 3 },
      { name: 'Pudhina (புதினா)', category: 'Vegetables', stock: 15, unit: 'bundle', unitCost: 0.5, lowStockThreshold: 5 },
      { name: 'Karuveppilai (கருவேppிலை)', category: 'Vegetables', stock: 8, unit: 'kg', unitCost: 1.2, lowStockThreshold: 2 },
      { name: 'Ramba Ilai (ரம்பா இலை)', category: 'Vegetables', stock: 10, unit: 'pcs', unitCost: 0.3, lowStockThreshold: 3 },
      { name: 'Maangkai (மாங்காய்)', category: 'Vegetables', stock: 25, unit: 'kg', unitCost: 1.8, lowStockThreshold: 5 },
      { name: 'Vaalaikkai (வாழைக்காய்)', category: 'Vegetables', stock: 50, unit: 'pcs', unitCost: 0.4, lowStockThreshold: 10 },
      { name: 'Paruvattu Thengai (பருவட்டு தேங்காய்)', category: 'Vegetables', stock: 40, unit: 'pcs', unitCost: 0.6, lowStockThreshold: 10 },
      { name: 'Vaazhai Ilaikkattu (வாழை இலைக்கட்டு)', category: 'Vegetables', stock: 10, unit: 'bundle', unitCost: 5.0, lowStockThreshold: 3 },
      { name: 'Moongil Koodai (மூங்கில் கூடை)', category: 'Vegetables', stock: 15, unit: 'pcs', unitCost: 2.0, lowStockThreshold: 5 },
      { name: 'Olaippai (ஓலைப்பாய்)', category: 'Vegetables', stock: 20, unit: 'pcs', unitCost: 3.5, lowStockThreshold: 5 },
      { name: 'Sirattai Agappai (சிரட்டை அகப்பை)', category: 'Vegetables', stock: 30, unit: 'pcs', unitCost: 1.0, lowStockThreshold: 8 },
      { name: 'Moongil Thattu (மூங்கில் தட்டு)', category: 'Vegetables', stock: 25, unit: 'pcs', unitCost: 1.5, lowStockThreshold: 5 },
      { name: 'Vellaripinchu (வெள்ளரிப் பிஞ்சு)', category: 'Vegetables', stock: 30, unit: 'kg', unitCost: 1.0, lowStockThreshold: 8 },
      { name: 'Maadhulai (மாதுளை)', category: 'Vegetables', stock: 20, unit: 'kg', unitCost: 3.5, lowStockThreshold: 5 },
      { name: 'Thiraatchai (திராட்சை)', category: 'Vegetables', stock: 20, unit: 'kg', unitCost: 2.8, lowStockThreshold: 5 },
      { name: 'Pineapple (பைனாப்பிள்)', category: 'Vegetables', stock: 15, unit: 'pcs', unitCost: 2.0, lowStockThreshold: 5 },
      { name: 'Mudhal Naal Paal (முதல் நாள் பால்)', category: 'Vegetables', stock: 30, unit: 'ltr', unitCost: 1.2, lowStockThreshold: 10 },
      { name: 'Mudhal Naal Thayir (முதல் நாள் தயிர்)', category: 'Vegetables', stock: 20, unit: 'ltr', unitCost: 1.4, lowStockThreshold: 5 },
      { name: 'Maru Naal Paal (மறு நாள் பால்)', category: 'Vegetables', stock: 30, unit: 'ltr', unitCost: 1.2, lowStockThreshold: 10 },
      { name: 'Maru Naal Thayir (மறு நாள் தயிர்)', category: 'Vegetables', stock: 20, unit: 'ltr', unitCost: 1.4, lowStockThreshold: 5 },
      { name: 'Pakka Naazhi (பக்கா நாழி)', category: 'Vegetables', stock: 10, unit: 'pcs', unitCost: 1.5, lowStockThreshold: 3 },
      { name: 'Cotton Thonigal (காட்டன் துணிகள்)', category: 'Vegetables', stock: 50, unit: 'pcs', unitCost: 0.5, lowStockThreshold: 10 },
      { name: 'Viragu (விறகு)', category: 'Vegetables', stock: 200, unit: 'kg', unitCost: 0.2, lowStockThreshold: 50 },

      // SPICES
      { name: 'Manjal Thool (மஞ்சள் தூள்)', category: 'Spices', stock: 10, unit: 'kg', unitCost: 3.5, lowStockThreshold: 2 },
      { name: 'Kal Uppu (கல் உப்பு)', category: 'Spices', stock: 25, unit: 'kg', unitCost: 0.5, lowStockThreshold: 5 },
      { name: 'Puli (புளி)', category: 'Spices', stock: 15, unit: 'kg', unitCost: 4.0, lowStockThreshold: 3 },
      { name: 'Vendhayam (வெந்தயம்)', category: 'Spices', stock: 5, unit: 'kg', unitCost: 2.5, lowStockThreshold: 1 },
      { name: 'Kadugu (கடுகு)', category: 'Spices', stock: 8, unit: 'kg', unitCost: 2.2, lowStockThreshold: 2 },
      { name: 'Seeragam (சீரகம்)', category: 'Spices', stock: 6, unit: 'kg', unitCost: 5.5, lowStockThreshold: 1 },
      { name: 'Milagu (மிளகு)', category: 'Spices', stock: 10, unit: 'kg', unitCost: 8.0, lowStockThreshold: 2 },
      { name: 'Vellai Milagu (வெள்ளை மிளகு)', category: 'Spices', stock: 2, unit: 'kg', unitCost: 12.0, lowStockThreshold: 0.5 },
      { name: 'Vaal Milagu (வால் மிளகு)', category: 'Spices', stock: 2, unit: 'kg', unitCost: 14.0, lowStockThreshold: 0.5 },
      { name: 'Naattu Malli (நாட்டு மல்லி)', category: 'Spices', stock: 15, unit: 'kg', unitCost: 3.8, lowStockThreshold: 3 },
      { name: 'Naattu Vathal (நாட்டு வத்தல்)', category: 'Spices', stock: 20, unit: 'kg', unitCost: 4.5, lowStockThreshold: 4 },
      { name: 'Gundu Vathal (குண்டு வத்தல்)', category: 'Spices', stock: 20, unit: 'kg', unitCost: 4.8, lowStockThreshold: 4 },
      { name: 'Vadupodu (வடுபோடு)', category: 'Spices', stock: 5, unit: 'kg', unitCost: 3.0, lowStockThreshold: 1 },
      { name: 'Milagai Thool (மிளகாய் தூள்)', category: 'Spices', stock: 15, unit: 'kg', unitCost: 4.2, lowStockThreshold: 3 },
      { name: 'Malli Thool (மல்லி தூள்)', category: 'Spices', stock: 12, unit: 'kg', unitCost: 3.8, lowStockThreshold: 2 },
      { name: 'Sambar Thool (சாம்பார் தூள்)', category: 'Spices', stock: 15, unit: 'kg', unitCost: 4.5, lowStockThreshold: 3 },
      { name: 'Kari Masal (கறி மசால்)', category: 'Spices', stock: 8, unit: 'kg', unitCost: 5.0, lowStockThreshold: 2 },
      { name: 'Mutton Masal (மட்டன் மசால்)', category: 'Spices', stock: 8, unit: 'kg', unitCost: 5.5, lowStockThreshold: 2 },
      { name: 'Chicken Masal (சிக்கன் மசால்)', category: 'Spices', stock: 10, unit: 'kg', unitCost: 5.2, lowStockThreshold: 2 },
      { name: 'Chicken 65 Masal (சிக்கன் 65 மசால்)', category: 'Spices', stock: 10, unit: 'kg', unitCost: 5.2, lowStockThreshold: 2 },
      { name: 'Chaat Masal (சாட் மசால்)', category: 'Spices', stock: 5, unit: 'kg', unitCost: 6.0, lowStockThreshold: 1 },
      { name: 'Chana Masal (சென்னா மசால்)', category: 'Spices', stock: 5, unit: 'kg', unitCost: 5.8, lowStockThreshold: 1 },
      { name: 'Milagu Thool (மிளகு தூள்)', category: 'Spices', stock: 8, unit: 'kg', unitCost: 8.5, lowStockThreshold: 2 },
      { name: 'Sombu Thool (சோம்பு தூள்)', category: 'Spices', stock: 6, unit: 'kg', unitCost: 5.0, lowStockThreshold: 1 },
      { name: 'Kashmir Milagai Thool (காஷ்மீர் மிளகாய் தூள்)', category: 'Spices', stock: 8, unit: 'kg', unitCost: 6.5, lowStockThreshold: 2 },
      { name: 'Sukku (சுக்கு)', category: 'Spices', stock: 3, unit: 'kg', unitCost: 9.0, lowStockThreshold: 0.5 },
      { name: 'Elakkai (ஏலக்காய்)', category: 'Spices', stock: 2, unit: 'kg', unitCost: 28.0, lowStockThreshold: 0.5 },
      { name: 'Surul Pattai (சுருள் பட்டை)', category: 'Spices', stock: 3, unit: 'kg', unitCost: 11.0, lowStockThreshold: 0.5 },
      { name: 'Kirambu (கிராம்பு)', category: 'Spices', stock: 2, unit: 'kg', unitCost: 15.0, lowStockThreshold: 0.5 },
      { name: 'Annaschi Poo (அன்னாசி பூ)', category: 'Spices', stock: 2, unit: 'kg', unitCost: 12.0, lowStockThreshold: 0.5 },
      { name: 'Birinji Ilai (பிரிஞ்சி இலை)', category: 'Spices', stock: 3, unit: 'kg', unitCost: 6.0, lowStockThreshold: 0.5 },
      { name: 'Jaadhipatthiri (ஜாதிபத்திரி)', category: 'Spices', stock: 1, unit: 'kg', unitCost: 35.0, lowStockThreshold: 0.2 },
      { name: 'Kalpaasi (கல்பასი)', category: 'Spices', stock: 2, unit: 'kg', unitCost: 16.0, lowStockThreshold: 0.5 },
      { name: 'Jaadhikkai (ஜாதிக்காய்)', category: 'Spices', stock: 1, unit: 'kg', unitCost: 22.0, lowStockThreshold: 0.2 },
      { name: 'Aamanakku Vidhai (ஆமணக்கு விதை)', category: 'Spices', stock: 5, unit: 'kg', unitCost: 4.5, lowStockThreshold: 1 },
      { name: 'Sunda Vathal (சுண்ட வத்தல்)', category: 'Spices', stock: 8, unit: 'kg', unitCost: 5.0, lowStockThreshold: 1 },
      { name: 'Kaayathool (காயத்தூள்)', category: 'Spices', stock: 5, unit: 'kg', unitCost: 6.5, lowStockThreshold: 1 },
      { name: 'Paal Kaayam (பால் காயம்)', category: 'Spices', stock: 3, unit: 'kg', unitCost: 12.0, lowStockThreshold: 0.5 },
      { name: 'Thool Uppu (தூள் உப்பு)', category: 'Spices', stock: 20, unit: 'kg', unitCost: 0.4, lowStockThreshold: 5 },
      { name: 'Soda Uppu (சோடா உப்பு)', category: 'Spices', stock: 5, unit: 'kg', unitCost: 1.0, lowStockThreshold: 1 },
      { name: 'Idli Podi (இட்லி பொடி)', category: 'Spices', stock: 8, unit: 'kg', unitCost: 4.0, lowStockThreshold: 2 },
      { name: 'Kasuri Methi Ilai (கசூரி மேத்தி இலை)', category: 'Spices', stock: 3, unit: 'kg', unitCost: 8.0, lowStockThreshold: 0.5 },

      // DAIRY
      { name: 'Ney (நெய்)', category: 'Dairy', stock: 20, unit: 'ltr', unitCost: 9.5, lowStockThreshold: 5 },
      { name: 'Vennai (வெண்ணை)', category: 'Dairy', stock: 15, unit: 'kg', unitCost: 8.0, lowStockThreshold: 3 },
      { name: 'Inippillaa Khova (இனிப்பில்லா கோவா)', category: 'Dairy', stock: 10, unit: 'kg', unitCost: 7.5, lowStockThreshold: 2 },
      { name: 'Amul Paalpodhi (அமுல் பால்பவுடர்)', category: 'Dairy', stock: 15, unit: 'kg', unitCost: 6.2, lowStockThreshold: 3 },
      { name: 'Milkmaid (மில்க் மைடு)', category: 'Dairy', stock: 24, unit: 'pcs', unitCost: 1.8, lowStockThreshold: 6 },
      { name: 'Full Cream (ஃபுல் கிரீம்)', category: 'Dairy', stock: 30, unit: 'ltr', unitCost: 1.6, lowStockThreshold: 10 },
      { name: 'Fresh Cream (பிரஸ் கிரீம்)', category: 'Dairy', stock: 15, unit: 'ltr', unitCost: 3.8, lowStockThreshold: 3 },

      // GROCERIES
      { name: 'Uzhundha Paruppu (உளுந்த பருப்பு)', category: 'Groceries', stock: 50, unit: 'kg', unitCost: 2.2, lowStockThreshold: 10 },
      { name: 'Vettukkal Thu. Paruppu (வெட்டுக்கல் து. பருப்பு)', category: 'Groceries', stock: 60, unit: 'kg', unitCost: 2.4, lowStockThreshold: 10 },
      { name: 'Paasi Paruppu (பாசிப்பருப்பு)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 2.5, lowStockThreshold: 8 },
      { name: 'Kadalai Paruppu (கடலை பருப்பு)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.8, lowStockThreshold: 8 },
      { name: 'Pattani Paruppu (பட்டாணி பருப்பு)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 1.5, lowStockThreshold: 6 },
      { name: 'Tin Pattani (டின் பட்டாணி)', category: 'Groceries', stock: 24, unit: 'pcs', unitCost: 1.2, lowStockThreshold: 6 },
      { name: 'Tholi Paruppu (தொலி பருப்பு)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 2.3, lowStockThreshold: 5 },
      { name: 'Saara Paruppu (சார பருப்பு)', category: 'Groceries', stock: 5, unit: 'kg', unitCost: 16.0, lowStockThreshold: 1 },
      { name: 'Munthiri Paruppu (முந்திரி பருப்பு)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 14.0, lowStockThreshold: 4 },
      { name: 'Badam Paruppu (பாதாம் பருப்பு)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 12.0, lowStockThreshold: 3 },
      { name: 'Pista Paruppu (பிஸ்தா பருப்பு)', category: 'Groceries', stock: 10, unit: 'kg', unitCost: 18.0, lowStockThreshold: 2 },
      { name: 'Kismis (கிஸ்மிஸ்)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 6.0, lowStockThreshold: 3 },
      { name: 'Frutti Fruit / Tutti Frutti (ரூட்டி ப்ரூட்)', category: 'Groceries', stock: 10, unit: 'kg', unitCost: 4.5, lowStockThreshold: 2 },
      { name: 'Cherribazham (செர்ரிப்பழம்)', category: 'Groceries', stock: 10, unit: 'kg', unitCost: 8.0, lowStockThreshold: 2 },
      { name: 'Eecchampazham (ஈச்சம்பழம்)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 5.0, lowStockThreshold: 3 },
      { name: 'Kaanthaat Idiyappam (கான்காட் இடியாப்பம்)', category: 'Groceries', stock: 20, unit: 'packet', unitCost: 2.0, lowStockThreshold: 5 },
      { name: 'Samba Aval (சம்பா அவல்)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 1.6, lowStockThreshold: 5 },
      { name: 'Samba Ravai (சம்பா ரவை)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.4, lowStockThreshold: 8 },
      { name: 'Samba Godhumai (சம்பா கோதுமை)', category: 'Groceries', stock: 45, unit: 'kg', unitCost: 1.3, lowStockThreshold: 8 },
      { name: 'Ragi Semiya (ராகி சேமியா)', category: 'Groceries', stock: 25, unit: 'packet', unitCost: 1.2, lowStockThreshold: 5 },
      { name: 'Base Adai (பீஸ் அடை)', category: 'Groceries', stock: 20, unit: 'packet', unitCost: 1.8, lowStockThreshold: 4 },
      { name: 'Maida Maavu (மைதா மாவு)', category: 'Groceries', stock: 80, unit: 'kg', unitCost: 1.1, lowStockThreshold: 15 },
      { name: 'Kadalai Maavu (கடலை மாவு)', category: 'Groceries', stock: 60, unit: 'kg', unitCost: 1.4, lowStockThreshold: 10 },
      { name: 'Arisi Maavu (அரிசி மாவு)', category: 'Groceries', stock: 100, unit: 'kg', unitCost: 1.0, lowStockThreshold: 20 },
      { name: 'Godhumai Maavu (கோதுமை மாவு)', category: 'Groceries', stock: 80, unit: 'kg', unitCost: 1.2, lowStockThreshold: 15 },
      { name: 'Kizhangu Maavu (கிழங்கு மாவு)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 1.5, lowStockThreshold: 5 },
      { name: 'Bajji Maavu (பஜ்ஜி மாவு)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.6, lowStockThreshold: 8 },
      { name: 'Cornflour Maavu (கான்பிளவர் மாவு)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 1.8, lowStockThreshold: 5 },
      { name: 'Pattani Maavu (பட்டாணி மாவு)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 1.5, lowStockThreshold: 5 },
      { name: 'Seeni (சீனி)', category: 'Groceries', stock: 100, unit: 'kg', unitCost: 1.1, lowStockThreshold: 20 },
      { name: 'Diamond Karkandu (டயமண்ட் கற்கண்டு)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 1.8, lowStockThreshold: 5 },
      { name: 'Naattu Charkkarai (நாட்டுச் சர்க்கரை)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.6, lowStockThreshold: 8 },
      { name: 'Panangkarkandu (பனங்கற்கண்டு)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 3.5, lowStockThreshold: 3 },
      { name: 'Karuppatti (கருப்பட்டி)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 4.5, lowStockThreshold: 4 },
      { name: 'Vellam - Manjal (வெல்லம் - மஞ்சள்)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.5, lowStockThreshold: 8 },
      { name: 'Vellam - Karuppu (வெல்லம் - கருப்பு)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.6, lowStockThreshold: 8 },
      { name: 'Paasipayaru (பாசிppயறு)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 2.2, lowStockThreshold: 6 },
      { name: 'Varutha Verkadalai (வறுத்த வேர்க்கடலை)', category: 'Groceries', stock: 25, unit: 'kg', unitCost: 2.4, lowStockThreshold: 5 },
      { name: 'Uruttu Porigadalai (உருட்டு பொரிகடலை)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 1.8, lowStockThreshold: 6 },
      { name: 'Filter Coffee Thool (பில்டர் காபிதூள்)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 8.0, lowStockThreshold: 3 },
      { name: 'Tea Thool (டீதூள்)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 6.0, lowStockThreshold: 3 },
      { name: 'Coffee Thool (காபி தூள்)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 7.5, lowStockThreshold: 3 },
      { name: 'Sigappu Color Powder (சிகப்பு கலர் பவுடர்)', category: 'Groceries', stock: 10, unit: 'packet', unitCost: 0.5, lowStockThreshold: 2 },
      { name: 'Manjal Color Powder (மஞ்சள் கலர் பவுடர்)', category: 'Groceries', stock: 10, unit: 'packet', unitCost: 0.5, lowStockThreshold: 2 },
      { name: 'Mealmaker (மீல்மேக்கர்)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 2.2, lowStockThreshold: 4 },
      { name: 'Varutha Ravai (வறுத்த ரவை)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.4, lowStockThreshold: 8 },
      { name: 'Semiya (சேமியா)', category: 'Groceries', stock: 40, unit: 'kg', unitCost: 1.3, lowStockThreshold: 8 },
      { name: 'Nylon Javvarisi (நைலான் ஜவ்வரிசி)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 1.8, lowStockThreshold: 4 },
      { name: 'Then (தேன்)', category: 'Groceries', stock: 10, unit: 'ltr', unitCost: 8.5, lowStockThreshold: 2 },
      { name: 'Gulkand (குல்கந்து)', category: 'Groceries', stock: 10, unit: 'kg', unitCost: 6.0, lowStockThreshold: 2 },
      { name: 'Maida Bread (மைதா பிரட்)', category: 'Groceries', stock: 15, unit: 'packet', unitCost: 1.2, lowStockThreshold: 3 },
      { name: 'Appalam (அப்பளம்)', category: 'Groceries', stock: 50, unit: 'packet', unitCost: 0.8, lowStockThreshold: 10 },
      { name: 'Color Appalam (கலர் அப்பளம்)', category: 'Groceries', stock: 30, unit: 'packet', unitCost: 1.0, lowStockThreshold: 5 },
      { name: 'Ponni Arisi Pazhaiyathu (பொன்னி அரிசி பழையது)', category: 'Groceries', stock: 150, unit: 'kg', unitCost: 1.2, lowStockThreshold: 30 },
      { name: 'Seeraga Samba Arisi (சீரகசம்பா அரிசி)', category: 'Groceries', stock: 100, unit: 'kg', unitCost: 2.8, lowStockThreshold: 20 },
      { name: 'Ponni Pacharisi (பொன்னி பச்சரிசி)', category: 'Groceries', stock: 80, unit: 'kg', unitCost: 1.4, lowStockThreshold: 15 },
      { name: 'Basmati Arisi (பாஸ்மதி அரிசி)', category: 'Groceries', stock: 80, unit: 'kg', unitCost: 2.6, lowStockThreshold: 15 },
      { name: 'Karuppu Kavuni Arisi (கருப்பு கவுனி அரிசி)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 3.5, lowStockThreshold: 4 },
      { name: 'Varagu (வரகு)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 1.8, lowStockThreshold: 4 },
      { name: 'Thinai (திணை)', category: 'Groceries', stock: 20, unit: 'kg', unitCost: 1.8, lowStockThreshold: 4 },
      { name: 'Cholam (சோளம்)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 1.4, lowStockThreshold: 5 },
      { name: 'Kaalai Idli Arisi (காலை இட்லி அரிசி)', category: 'Groceries', stock: 80, unit: 'kg', unitCost: 1.2, lowStockThreshold: 15 },
      { name: 'Kaalai Idli Maniparuppu (காலை இட்லி மணிப்பருப்பு)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 2.3, lowStockThreshold: 5 },
      { name: 'Iravu Idli Arisi (இரவு இட்லி அரிசி)', category: 'Groceries', stock: 80, unit: 'kg', unitCost: 1.2, lowStockThreshold: 15 },
      { name: 'Vada Maniparuppu (வடை மணிப்பருப்பு)', category: 'Groceries', stock: 30, unit: 'kg', unitCost: 2.3, lowStockThreshold: 5 },
      { name: 'Nallennai (நல்லெண்ணெய்)', category: 'Groceries', stock: 40, unit: 'ltr', unitCost: 4.8, lowStockThreshold: 8 },
      { name: 'Kadalai Ennai (கடலை எண்ணெய்)', category: 'Groceries', stock: 50, unit: 'ltr', unitCost: 3.5, lowStockThreshold: 10 },
      { name: 'Thengai Ennai (தேங்காய் எண்ணெய்)', category: 'Groceries', stock: 20, unit: 'ltr', unitCost: 5.5, lowStockThreshold: 4 },
      { name: 'Rice Bran Ennai (ரைஸ் பிராண்ட் எண்ணெய்)', category: 'Groceries', stock: 30, unit: 'ltr', unitCost: 3.2, lowStockThreshold: 6 },
      { name: 'Sooriyagaandhi Ennai (சூரியகாந்தி எண்ணெய்)', category: 'Groceries', stock: 50, unit: 'ltr', unitCost: 2.8, lowStockThreshold: 10 },
      { name: 'Tomato Sauce (தக்காளி சாஸ்)', category: 'Groceries', stock: 15, unit: 'bottle', unitCost: 1.8, lowStockThreshold: 3 },
      { name: 'Soya Sauce (சோயா சாஸ்)', category: 'Groceries', stock: 15, unit: 'bottle', unitCost: 2.0, lowStockThreshold: 3 },
      { name: 'Chilli Sauce (சில்லி சாஸ்)', category: 'Groceries', stock: 15, unit: 'bottle', unitCost: 2.0, lowStockThreshold: 3 },
      { name: 'Sigappu Chilli Sauce (சிகப்பு சில்லி சாஸ்)', category: 'Groceries', stock: 15, unit: 'bottle', unitCost: 2.2, lowStockThreshold: 3 },
      { name: 'Mass Badam Powder (மாஸ் பாதாம் பவுடர்)', category: 'Groceries', stock: 15, unit: 'kg', unitCost: 7.5, lowStockThreshold: 3 },

      // OTHERS
      { name: 'Cotton Thundu Vellai (காட்டன் துண்டு வெள்ளை)', category: 'Others', stock: 50, unit: 'pcs', unitCost: 0.8, lowStockThreshold: 10 },
      { name: 'Cotton Thundu Color (காட்டன் துண்டு கலர்)', category: 'Others', stock: 50, unit: 'pcs', unitCost: 0.9, lowStockThreshold: 10 },
      { name: 'Kachai Thuni (கச்சைத்துணி)', category: 'Others', stock: 20, unit: 'pcs', unitCost: 1.2, lowStockThreshold: 5 },
      { name: 'Coffee Cup (காபி கப்)', category: 'Others', stock: 1000, unit: 'pcs', unitCost: 0.05, lowStockThreshold: 200 },
      { name: 'Thanneer Cup (தண்ணீர் கப்)', category: 'Others', stock: 1000, unit: 'pcs', unitCost: 0.05, lowStockThreshold: 200 },
      { name: 'Paper Roll (பேப்பர் ரோல்)', category: 'Others', stock: 50, unit: 'pcs', unitCost: 1.5, lowStockThreshold: 10 },
      { name: 'Gulab Jamun Cup (குளோப் ஜாமுன் கப்)', category: 'Others', stock: 500, unit: 'pcs', unitCost: 0.08, lowStockThreshold: 100 },
      { name: 'Gulab Jamun Spoon (குளோப் ஜாமுன் ஸ்பூன்)', category: 'Others', stock: 500, unit: 'pcs', unitCost: 0.03, lowStockThreshold: 100 },
      { name: 'Tissue Paper (டிஸ்யூ பேப்பர்)', category: 'Others', stock: 50, unit: 'packet', unitCost: 0.6, lowStockThreshold: 10 },
      { name: 'Thonnai (தொன்னை)', category: 'Others', stock: 1000, unit: 'pcs', unitCost: 0.04, lowStockThreshold: 200 },
      { name: 'Sabena Podi (சபினா பொடி)', category: 'Others', stock: 20, unit: 'packet', unitCost: 0.8, lowStockThreshold: 5 },
      { name: 'Sabena Soap (சபினா சோப்)', category: 'Others', stock: 15, unit: 'pcs', unitCost: 0.6, lowStockThreshold: 3 },
      { name: 'Kambi Naar (கம்பி நார்)', category: 'Others', stock: 30, unit: 'pcs', unitCost: 0.4, lowStockThreshold: 5 },
      { name: 'Thoppi (தொப்பி)', category: 'Others', stock: 50, unit: 'pcs', unitCost: 0.5, lowStockThreshold: 10 },
      { name: 'Kai Urai (கை உறை)', category: 'Others', stock: 100, unit: 'pcs', unitCost: 0.1, lowStockThreshold: 20 }
    ];
    for (const g of groceries) {
      await Grocery.create(g);
    }

    // 6. SEED LABOUR WRKERS
    console.log('👨‍🍳 Seeding workforce database...');
    const workers = [
      { name: 'Marcus Aurelius', role: 'Chef', phone: '555-0909', dailyWage: 180, status: 'Active' },
      { name: 'Lucius Verus', role: 'Server', phone: '555-0808', dailyWage: 90, status: 'Active' },
      { name: 'Commodus Rex', role: 'Helper', phone: '555-0707', dailyWage: 75, status: 'Active' }
    ];
    const createdWorkers = [];
    for (const w of workers) {
      const wrk = await Labour.create(w);
      createdWorkers.push(wrk);
    }

    // 7. SEED ATTENDANCE RECORDS (for past dates)
    console.log('📅 Seeding attendance registers skipped to keep initial wages at 0.');
    /*
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateStr = pastDate.toISOString().split('T')[0];

    await Attendance.create({
      date: pastDateStr,
      records: createdWorkers.map(w => ({
        workerId: w._id,
        workerName: w.name,
        status: 'Present',
        wagePaid: w.dailyWage,
        paymentStatus: w.role === 'Chef' ? 'Paid' : 'Pending'
      }))
    });
    */

    // 8. SEED VESSELS
    console.log('🍲 Seeding catering vessel inventory...');
    const vessels = [
      { name: 'Stainless Chafing Dishes', totalQty: 40, rentedQty: 0, availableQty: 40, size: 'Large', description: 'Double food pan chafing dishes' },
      { name: 'Water Dispenser Jugs', totalQty: 15, rentedQty: 5, availableQty: 10, size: 'Large', description: '5 gallon stainless steel body' },
      { name: 'Serving Trays', totalQty: 50, rentedQty: 0, availableQty: 50, size: 'Medium', description: 'Non-slip black plastic trays' },
      { name: '40 Padi Vattam (40 படி வட்டம்)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Large', description: 'Large cooking vattam' },
      { name: '30 Padi Vattam (30 படி வட்டம்)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Large', description: 'Cooking vattam' },
      { name: '25 Padi Vattam (25 படி வட்டம்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Large', description: 'Cooking vattam' },
      { name: '15 Padi Vattam (15 படி வட்டம்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Medium', description: 'Cooking vattam' },
      { name: '10 Padi Vattam (10 படி வட்டம்)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Medium', description: 'Cooking vattam' },
      { name: 'Siriya Vattam (சிறிய வட்டம்)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Small', description: 'Small cooking vattam' },
      { name: 'Moodi (மூடி)', totalQty: 50, rentedQty: 0, availableQty: 50, size: 'Medium', description: 'Lids for vessels' },
      { name: 'Vaali (வாளி)', totalQty: 30, rentedQty: 0, availableQty: 30, size: 'Medium', description: 'Buckets' },
      { name: 'Karandi (கரண்டி)', totalQty: 100, rentedQty: 0, availableQty: 100, size: 'Medium', description: 'Serving spoons/ladles' },
      { name: 'Gundaasatti (குண்டாச்சட்டி)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Medium', description: 'Gunda vessels' },
      { name: 'Plate (பிளேட்)', totalQty: 500, rentedQty: 0, availableQty: 500, size: 'Medium', description: 'Dining plates' },
      { name: 'Anna Kai (அன்ன கை)', totalQty: 25, rentedQty: 0, availableQty: 25, size: 'Medium', description: 'Rice serving spoons' },
      { name: 'Basen (பேசன்)', totalQty: 30, rentedQty: 0, availableQty: 30, size: 'Medium', description: 'Washing basins' },
      { name: 'Kettle (கேத்தல்)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Medium', description: 'Tea kettles' },
      { name: 'Tea Can (டீ கேன்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Large', description: 'Tea dispenser cans' },
      { name: 'Irumbu Satti (இரும்பு சட்டி)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Medium', description: 'Iron pans' },
      { name: 'Saarani (சாரணி)', totalQty: 25, rentedQty: 0, availableQty: 25, size: 'Medium', description: 'Strainer ladles' },
      { name: 'Saucepan (சாஸ்பூன்)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Medium', description: 'Cooking saucepans' },
      { name: 'The. Thiruvi Machine (தே.திருவி மிஷின்)', totalQty: 5, rentedQty: 0, availableQty: 5, size: 'Medium', description: 'Coconut scraper machine' },
      { name: 'Arumanai (அருமனை)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Medium', description: 'Traditional cutter boards' },
      { name: 'Idli Kopparai (இட்லி கொப்பரை)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Large', description: 'Idli steamers' },
      { name: 'Tharpaai (தார்பாய்)', totalQty: 8, rentedQty: 0, availableQty: 8, size: 'Large', description: 'Tarpaulin sheets' },
      { name: 'Kai Kuppu (கை.கப்பு)', totalQty: 50, rentedQty: 0, availableQty: 50, size: 'Small', description: 'Hand cups' },
      { name: 'Gas Aduppu Double (கேஸ் அடுப்பு டபிள்)', totalQty: 8, rentedQty: 0, availableQty: 8, size: 'Large', description: 'Double burner gas stove' },
      { name: 'Gas Aduppu Single (கேஸ் அடுப்பு சிங்கிள்)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Large', description: 'Single burner gas stove' },
      { name: 'Dosaikkal (தோசைக்கல்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Medium', description: 'Dosa tavas' },
      { name: 'Cooker (குக்கர்)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Large', description: 'Pressure cookers' },
      { name: 'Bajji Kattai (பজ্জিত கட்டை)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Medium', description: 'Bajji preparation blocks' },
      { name: 'Poori Kattai (பூரிக்கட்டை)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Medium', description: 'Poori rolling boards' },
      { name: 'Vaarppu Karandi (வார்ப்பு கரண்டி)', totalQty: 30, rentedQty: 0, availableQty: 30, size: 'Medium', description: 'Cast iron ladles' },
      { name: 'Paniyara Satti (பணியார சட்டி)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Medium', description: 'Paniyaram pans' },
      { name: 'Omelette Kal (ஆம்லெட் கல்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Medium', description: 'Omelette pans' },
      { name: 'Silver Drum (சில்வர் டிரம்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Large', description: 'Silver storage drums' },
      { name: 'Kuthu Paani (குத்துப்போனி)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Medium', description: 'Serving pots' },
      { name: 'Table (டேபிள்)', totalQty: 50, rentedQty: 0, availableQty: 50, size: 'Large', description: 'Catering tables' },
      { name: 'Chair (சேர்)', totalQty: 200, rentedQty: 0, availableQty: 200, size: 'Medium', description: 'Guest chairs' },
      { name: 'Plastic Drum (பிளாஸ்டிக் டிரம்)', totalQty: 25, rentedQty: 0, availableQty: 25, size: 'Large', description: 'Water storage drums' },
      { name: 'Irumbu Drum (இரும்பு டிரம்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Large', description: 'Iron storage drums' },
      { name: 'Pakka Naazhi (பக்கா நாழி)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Small', description: 'Measuring cups' },
      { name: 'Silver Thirai (சில்வர் திரை)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Large', description: 'Silver partitions/curtains' },
      { name: 'Cylinder (சிலிண்டர்)', totalQty: 25, rentedQty: 0, availableQty: 25, size: 'Large', description: 'Gas cylinders' },
      { name: 'Mixie 3 Jar (மிக்ஸி 3 ஜார்)', totalQty: 6, rentedQty: 0, availableQty: 6, size: 'Medium', description: 'Mixer grinders with 3 jars' },
      { name: 'Puttu Thattu (புட்டுத்தட்டு)', totalQty: 10, rentedQty: 0, availableQty: 10, size: 'Medium', description: 'Puttu steamers' },
      { name: 'Grinder (கீரைண்டர்)', totalQty: 4, rentedQty: 0, availableQty: 4, size: 'Large', description: 'Wet grinders' },
      { name: 'Aluminium Vattu (அலுமினிய வட்டு)', totalQty: 20, rentedQty: 0, availableQty: 20, size: 'Medium', description: 'Aluminium plates' },
      { name: 'Samakkaalam (சமுக்காளம்)', totalQty: 15, rentedQty: 0, availableQty: 15, size: 'Large', description: 'Large floor mats' }
    ];
    const createdVessels = [];
    for (const v of vessels) {
      const ves = await Vessel.create(v);
      createdVessels.push(ves);
    }

    // 9. SEED RENTALS
    console.log('🤝 Seeding rental agreements...');
    const dispenserVessel = createdVessels.find(v => v.name.includes('Water Dispenser'));
    if (dispenserVessel) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 2); // Overdue rental
      
      await Rental.create({
        vesselId: dispenserVessel._id,
        vesselName: dispenserVessel.name,
        renterName: 'Grand Plaza Hotel',
        phone: '+1 555-9000',
        assignedDate: '2026-06-15',
        returnDate: dueDate.toISOString().split('T')[0],
        qty: 5,
        rentAmount: 150,
        deposit: 100,
        paidAmount: 0,
        balanceAmount: 150,
        status: 'Rented',
        notes: 'Needs cleaning on return'
      });
    }

    // 10. SEED EXPENSES
    console.log('💸 Seeding business expenses...');
    const expenses = [
      { amount: 350, category: 'Transportation', date: '2026-06-10', status: 'Paid', description: 'Fuel and truck rental for Corporate Event' },
      { amount: 180, category: 'Grocery', date: '2026-06-14', status: 'Paid', description: 'Fresh vegetables and local dairy purchase' },
      { amount: 90, category: 'Labour', date: '2026-06-21', status: 'Paid', description: 'Lucius Verus server wage payment' }
    ];
    for (const e of expenses) {
      await Expense.create(e);
    }

    // 11. SEED EVENTS
    console.log('🎉 Seeding events timeline...');
    const event1 = await Event.create({
      name: 'Jane Smith Birthday Bash',
      customerId: createdCustomers[1]._id,
      customerName: createdCustomers[1].name,
      location: '101 Pine Ave, Downtown City',
      date: '2026-06-30',
      guestCount: 45,
      eventType: 'Birthday',
      status: 'Confirmed',
      menuPlan: {
        breakfast: [
          { name: 'Scrambled Eggs', qty: 45, estimatedCost: 45 * 0.4 },
          { name: 'Coffee/Tea', qty: 45, estimatedCost: 45 * 0.3 }
        ],
        lunch: [],
        dinner: [
          { name: 'Paneer Butter Masala', qty: 45, estimatedCost: 45 * 2.0 },
          { name: 'Butter Naan', qty: 90, estimatedCost: 90 * 0.5 },
          { name: 'Gulab Jamun', qty: 45, estimatedCost: 45 * 0.8 }
        ]
      },
      timeline: [
        { time: '11:00 AM', activity: 'Staff arrival and decoration setup' },
        { time: '01:00 PM', activity: 'Breakfast/Tea service starts' },
        { time: '07:30 PM', activity: 'Dinner service starts' }
      ]
    });

    const event2 = await Event.create({
      name: 'Doe Wedding Reception',
      customerId: createdCustomers[0]._id,
      customerName: createdCustomers[0].name,
      location: '789 Maple St, Suburban Village',
      date: '2026-07-15',
      guestCount: 150,
      eventType: 'Wedding',
      status: 'Inquiry',
      menuPlan: {
        breakfast: [],
        lunch: [
          { name: 'Chicken Biryani', qty: 150, estimatedCost: 150 * 3.5 },
          { name: 'Gulab Jamun', qty: 150, estimatedCost: 150 * 0.8 }
        ],
        dinner: []
      },
      timeline: [
        { time: '09:00 AM', activity: 'Raw materials delivery' },
        { time: '01:30 PM', activity: 'Wedding Buffet service' }
      ]
    });

    // 12. SEED INVOICES
    console.log('📄 Seeding customer invoices...');
    const invoice1 = await Invoice.create({
      invoiceNumber: 'INV-2026-101',
      eventId: event1._id,
      customerName: createdCustomers[1].name,
      customerEmail: createdCustomers[1].email,
      date: '2026-06-20',
      items: [
        { description: 'Birthday Buffet Menu (45 Guests)', quantity: 45, rate: 25, amount: 1125 },
        { description: 'Decoration and Server Labour charges', quantity: 1, rate: 200, amount: 200 }
      ],
      subtotal: 1325,
      discount: 100,
      tax: 61.25, // 5% GST
      total: 1286.25,
      status: 'Partial'
    });

    await Invoice.create({
      invoiceNumber: 'INV-2026-102',
      eventId: event2._id,
      customerName: createdCustomers[0].name,
      customerEmail: createdCustomers[0].email,
      date: '2026-06-22',
      items: [
        { description: 'Wedding Lunch Feast (150 Guests)', quantity: 150, rate: 35, amount: 5250 }
      ],
      subtotal: 5250,
      discount: 250,
      tax: 250,
      total: 5250,
      status: 'Unpaid'
    });

    // 13. SEED PAYMENTS
    console.log('💳 Seeding payments log...');
    await Payment.create({
      invoiceNumber: invoice1.invoiceNumber,
      customerName: invoice1.customerName,
      amount: 500,
      method: 'UPI',
      date: '2026-06-21',
      reference: 'UPI992019A8201',
      notes: 'Initial token advance payment'
    });

    // 14. SEED INITIAL NOTIFICATIONS
    console.log('🔔 Seeding notification alerts...');
    await Notification.create({
      title: 'Database Initialised',
      message: 'Demo database seeded successfully with mock client CRM profiles.',
      type: 'event',
      status: 'unread',
      date: new Date().toISOString().split('T')[0]
    });

    console.log('🎉 Seeding successfully completed! CaterMaster is ready to run.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding process crashed:', error);
    process.exit(1);
  }
};

seed();
