import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthGuardBypass } from "./components/auth/AuthGuardBypass";
import { AuthProviderBypass } from "./components/auth/AuthProviderBypass";
import { CartProvider } from "./components/cart/CartManager";

// Import all the REAL comprehensive components
import Login from "./pages/Login";
import LoginPageFixed from "./pages/auth/LoginPageFixed";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import LogoutPage from "./pages/auth/LogoutPage";
import AuthDebug from "./pages/AuthDebug";
import AuthTest from "./pages/AuthTest";

// REAL COMPREHENSIVE DASHBOARD COMPONENTS
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";

// REAL COMPREHENSIVE ADMIN COMPONENTS
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersAdmin from "./pages/admin/UsersAdminSimple";
import OrdersAdmin from "./pages/admin/OrdersAdminSimple";
import CustomersAdmin from "./pages/admin/CustomersAdminSimple";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import GiftRulesAdmin from "./pages/admin/GiftRulesAdmin";
import AdminTest from "./pages/admin/AdminTest";

// REAL COMPREHENSIVE BUSINESS MODULES
import Claims from "./pages/Claims";
import ClaimDetailPage from "./pages/ClaimDetail";
import NewClaim from "./pages/NewClaim";
import Retailers from "./pages/Retailers";
import NewRetailer from "./pages/NewRetailer";
import RetailerDetail from "./pages/RetailerDetail";
import EditRetailer from "./pages/EditRetailer";
import Settings from "./pages/Settings";
import OrderDetail from "./pages/OrderDetail";
import NotFound from "./pages/NotFound";

// Lazy load shipping pages to prevent heavy ShipStation API imports during app initialization
const Shipping = React.lazy(() => import("./pages/ShippingNew"));
const ShippingAdmin = React.lazy(() => import("./pages/admin/ShippingAdmin"));

const AppEmergency = () => (
  <AuthProviderBypass>
    {/* Simplified without DataPersistenceProvider to eliminate complexity */}
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/login" element={<LoginPageFixed />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/logout" element={<LogoutPage />} />
            <Route path="/auth/debug" element={<AuthDebug />} />
            <Route path="/auth/test" element={<AuthTest />} />
            
            {/* Root redirect to REAL DASHBOARD */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* REAL COMPREHENSIVE DASHBOARD ROUTE */}
            <Route path="/dashboard" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE BUSINESS MODULE ROUTES */}
            <Route path="/orders" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <Orders />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/orders/new" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <NewOrder />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/orders/:id" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <OrderDetail />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE CUSTOMER ROUTES */}
            <Route path="/customers" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <Customers />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/customers/:id" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <CustomerDetail />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE PRODUCT ROUTES */}
            <Route path="/products" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <Products />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/products/:id" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <ProductDetail />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE SHIPPING ROUTES */}
            <Route path="/shipping" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <React.Suspense fallback={<div>Loading Shipping...</div>}>
                    <Shipping />
                  </React.Suspense>
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE CLAIMS ROUTES */}
            <Route path="/claims" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <Claims />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/claims/new" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <NewClaim />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/claims/:id" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <ClaimDetailPage />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE ADMIN ROUTES */}
            <Route path="/admin" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/admin/dashboard" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE ADMIN MODULE ROUTES */}
            <Route path="/admin/users" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <UsersAdmin />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/admin/orders" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <OrdersAdmin />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/admin/customers" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <CustomersAdmin />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/admin/products" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <ProductsAdmin />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/admin/shipping" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <React.Suspense fallback={<div>Loading Shipping Admin...</div>}>
                    <ShippingAdmin />
                  </React.Suspense>
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/admin/gift-rules" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <GiftRulesAdmin />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/admin/test" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <AdminTest />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL COMPREHENSIVE RETAILER ROUTES */}
            <Route path="/retailers" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <Retailers />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/retailers/new" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <NewRetailer />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/retailers/:id" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <RetailerDetail />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/retailers/:id/edit" element={
              <AuthGuardBypass allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <EditRetailer />
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            {/* REAL SETTINGS ROUTE */}
            <Route path="/settings" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </AuthGuardBypass>
            } />
            <Route path="/settings/subscription" element={
              <AuthGuardBypass>
                <DashboardLayout>
                  <React.Suspense fallback={<div>Loading Subscription...</div>}>
                    {React.createElement(React.lazy(() => import('./pages/settings/SubscriptionSettings')))}
                  </React.Suspense>
                </DashboardLayout>
              </AuthGuardBypass>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </AuthProviderBypass>
);

export default AppEmergency;