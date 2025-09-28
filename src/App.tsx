import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthGuard } from "./components/layout/AuthGuard";
import { AuthProvider } from "./components/auth/AuthProvider";
import { DataPersistenceProvider } from "./components/providers/DataPersistenceProvider";
import { PersistenceErrorBoundary } from "./components/providers/PersistenceErrorBoundary";
import { CartProvider } from "./components/cart/CartManager";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import LogoutPage from "./pages/auth/LogoutPage";
import AuthDebug from "./pages/AuthDebug";
import AuthTest from "./pages/AuthTest";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
// Import test shipping page to debug
import ShippingTest from "./pages/ShippingTest";
import ShippingDebug from "./pages/ShippingDebug";
import ShippingNewWorking from "./pages/ShippingNewWorking";
// Import simple shipping page that works without heavy dependencies
import ShippingSimple from "./pages/ShippingSimple";
// Lazy load heavy shipping pages 
const ShippingNew = React.lazy(() => import("./pages/ShippingNew"));
const ShippingAdmin = React.lazy(() => import("./pages/admin/ShippingAdmin"));
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import GiftRulesAdmin from "./pages/admin/GiftRulesAdmin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersAdmin from "./pages/admin/UsersAdminSimple";
import OrdersAdmin from "./pages/admin/OrdersAdminSimple";
import CustomersAdmin from "./pages/admin/CustomersAdminSimple";
import AdminTest from "./pages/admin/AdminTest";
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

// Create simple QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <AuthProvider>
    <PersistenceErrorBoundary>
      <DataPersistenceProvider>
        <QueryClientProvider client={queryClient}>
        <CartProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/logout" element={<LogoutPage />} />
            <Route path="/auth/debug" element={<AuthDebug />} />
            <Route path="/auth/test" element={<AuthTest />} />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/orders" element={
              <AuthGuard>
                <DashboardLayout>
                  <Orders />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/orders/new" element={
              <AuthGuard>
                <DashboardLayout>
                  <NewOrder />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/orders/:id" element={
              <AuthGuard>
                <DashboardLayout>
                  <OrderDetail />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/customers" element={
              <AuthGuard>
                <DashboardLayout>
                  <Customers />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/customers/:id" element={
              <AuthGuard>
                <DashboardLayout>
                  <CustomerDetail />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/products" element={
              <AuthGuard>
                <DashboardLayout>
                  <Products />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/products/:id" element={
              <AuthGuard>
                <DashboardLayout>
                  <ProductDetail />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/shipping" element={
              <AuthGuard>
                <DashboardLayout>
                  <ErrorBoundary>
                    <React.Suspense fallback={<div className="p-8"><div className="text-center">Loading Shipping...</div></div>}>
                      <ShippingNew />
                    </React.Suspense>
                  </ErrorBoundary>
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/shipping" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <React.Suspense fallback={<div className="p-8"><div className="text-center">Loading Shipping Admin...</div></div>}>
                    <ShippingAdmin />
                  </React.Suspense>
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/dashboard" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/users" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <UsersAdmin />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/orders" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <OrdersAdmin />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/customers" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <CustomersAdmin />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/products" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <ProductsAdmin />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/gift-rules" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <GiftRulesAdmin />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/admin/test" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <AdminTest />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/claims" element={
              <AuthGuard>
                <DashboardLayout>
                  <Claims />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/claims/new" element={
              <AuthGuard>
                <DashboardLayout>
                  <NewClaim />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/claims/:id" element={
              <AuthGuard>
                <DashboardLayout>
                  <ClaimDetailPage />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/retailers" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <Retailers />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/retailers/new" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <NewRetailer />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/retailers/:id" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <RetailerDetail />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/retailers/:id/edit" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <DashboardLayout>
                  <EditRetailer />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="/settings/subscription" element={
              <AuthGuard>
                <DashboardLayout>
                  <React.Suspense fallback={<div>Loading Subscription...</div>}>
                    {React.createElement(React.lazy(() => import('./pages/settings/SubscriptionSettings')))}
                  </React.Suspense>
                </DashboardLayout>
              </AuthGuard>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </DataPersistenceProvider>
    </PersistenceErrorBoundary>
  </AuthProvider>
);

export default App;