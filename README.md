# 🍽️ CaterMaster CRM - Professional Catering Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.0.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-5.2-purple.svg)](https://vitejs.dev/)

**CaterMaster CRM** is a full-featured, enterprise-grade Catering & Event Management Platform built to streamline catering operations—from customer inquiries and menu planning to staff allocation, inventory tracking, invoicing, and financial analytics.

---

## ✨ Features

- 👥 **Customer Relationship Management (CRM)**: Manage customer records, track lead statuses, communication histories, and special dietary notes.
- 🎉 **Event & Booking Management**: Plan events, track dates, guest counts, venue details, and status updates (Inquiry, Confirmed, Completed, Cancelled).
- 📋 **Menu Planner & Custom Packages**: Create menu items, design custom food combos, and calculate per-head costs dynamically.
- 🧑‍🍳 **Labour & Attendance Management**: Manage staff profiles, assign workers to events, track shift hours, wages, and daily attendance.
- 🍲 **Vessels & Equipment Rental**: Track catering equipment, vessel quantities, rental status, and returns.
- 🛒 **Grocery & Vegetable Inventory**: Inventory management for raw ingredients, stock levels, supplier details, and purchasing costs.
- 🧾 **Invoices & PDF Generation**: Automatic calculation of subtotals, taxes, discounts, down-payments, and automated PDF invoice generation with email sharing capabilities.
- 📊 **Financial Dashboard & Analytics**: Interactive visual analytics for revenue, outstanding payments, expenses, and monthly profits using Recharts.
- ⚡ **Dual Database Engine**: Features seamless fallback to a lightweight Local JSON Database Engine if MongoDB is not running locally.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19 (built with Vite)
- **State Management**: Zustand
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Animations**: Framer Motion & GSAP
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios

### **Backend**
- **Runtime**: Node.js & Express.js (ES Modules)
- **Database**: MongoDB (Mongoose ORM) + Local JSON Engine Fallback
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt password hashing
- **Security**: Helmet, CORS, Express Rate Limiting
- **Documents & Export**: PDFKit, XLSX
- **Mailing**: Nodemailer

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (Optional for cloud/local mode, fallback local storage included)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Immanuelj15/Maha_CRM.git
   cd Maha_CRM
   ```

2. **Install Dependencies**
   Run the all-in-one installation script from the root folder:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables**

   Create a `.env` file inside the `backend` directory ([`backend/.env`](file:///c:/Users/Deeksha/Downloads/CRM/CRM/backend/.env)):
   ```env
   PORT=5000
   JWT_SECRET=catermaster_super_secret_key
   DB_MODE=mongodb
   MONGO_URI=mongodb://localhost:27017/catermaster

   # Optional Mail Server Settings
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   SMTP_SECURE=false
   SMTP_FROM="CaterMaster CRM" <billing@catermaster.com>
   ```

4. **Seed Initial Data (Optional)**
   Populate the database with sample menu items, packages, and demo records:
   ```bash
   npm run seed
   ```

5. **Start Development Servers**
   Run both backend and frontend concurrently:
   ```bash
   npm run dev
   ```
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000

---

## 📁 Project Structure

```text
CRM/
├── backend/
│   ├── data/                 # Local JSON database fallback files
│   ├── src/
│   │   ├── config/           # Database connection & configurations
│   │   ├── controllers/      # Route controllers (Auth, Events, Menu, Labour, etc.)
│   │   ├── database/         # Local DB engine & seed script
│   │   ├── middlewares/      # Auth & error handling middlewares
│   │   ├── models/           # Mongoose schemas & registry
│   │   ├── routes/           # Express API endpoints (/api/v1)
│   │   ├── services/         # PDF, Excel, and Email services
│   │   └── index.js          # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/           # Static images & branding assets
│   │   ├── components/       # Reusable UI components (Sidebar, Navbar, Modals)
│   │   ├── layouts/          # Dashboard layouts
│   │   ├── pages/            # Application views (Customers, Menu, Invoices, etc.)
│   │   ├── store/            # Zustand global state stores
│   │   └── main.jsx          # React app entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
├── package.json              # Root scripts (concurrently runner)
└── README.md
```

---

## 🌐 Deployment

For step-by-step instructions on deploying CaterMaster CRM to production (using MongoDB Atlas, Render, and Vercel), see the deployment guide in the documentation or deployment instructions.

- **Backend**: Hosted on platforms like Render, Railway, or Heroku.
- **Frontend**: Deployed on Vercel, Netlify, or static web hosting.
- **Database**: MongoDB Atlas Cloud Database.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
