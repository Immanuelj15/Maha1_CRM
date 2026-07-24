import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import NewCustomer from './pages/NewCustomer';
import Events from './pages/Events';
import Groceries from './pages/Groceries';
import Expenses from './pages/Expenses';
import Labour from './pages/Labour';
import Vessels from './pages/Vessels';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Menu from './pages/Menu';
import Vegetables from './pages/Vegetables';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Toast Alert overlay */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1f2937',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
            border: '1px solid #f3f4f6'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard shell */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/new-customer" element={<NewCustomer />} />
          <Route path="/events" element={<Events />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/vegetables" element={<Vegetables />} />
          <Route path="/groceries" element={<Groceries />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/labour" element={<Labour />} />
          <Route path="/vessels" element={<Vessels />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
