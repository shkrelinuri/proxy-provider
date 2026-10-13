import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PublicNav from './components/PublicNav';
import Footer from './components/Footer';
import AppLayout from './components/AppLayout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AcceptableUsePolicy from './pages/AcceptableUsePolicy';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import ApiKeys from './pages/ApiKeys';
import AdminLayout from './pages/admin/AdminLayout';

const APP_ROUTE_PREFIXES = ['/dashboard', '/billing', '/api-keys', '/admin'];

export default function App() {
  const location = useLocation();
  const isAppRoute = APP_ROUTE_PREFIXES.some((p) => location.pathname.startsWith(p));

  if (isAppRoute) {
    return (
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Billing />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/api-keys"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ApiKeys />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminLayout />
              </AppLayout>
            </AdminRoute>
          }
        />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/aup" element={<AcceptableUsePolicy />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

