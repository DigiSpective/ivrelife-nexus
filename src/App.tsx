import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthGuard } from "./components/layout/AuthGuard";
import { AuthProvider } from "./components/auth/AuthProvider";
import Login from "./pages/Login";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import LogoutPage from "./pages/auth/LogoutPage";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Products from "./pages/ProductsEnhanced";
import Shipping from "./pages/Shipping";
import Claims from "./pages/Claims";
import ClaimDetailPage from "./pages/ClaimDetail";
import NewClaim from "./pages/NewClaim";
import Retailers from "./pages/Retailers";
import NewRetailer from "./pages/NewRetailer";
import RetailerDetail from "./pages/RetailerDetail";
import EditRetailer from "./pages/EditRetailer";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Legacy login route - redirects to new auth */}
            <Route path="/login" element={<Login />} />
            
            {/* New auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/logout" element={<LogoutPage />} />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected routes */}
            <Route path="/*" element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<NewOrder />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="claims" element={<Claims />} />
            <Route path="claims/new" element={<NewClaim />} />
            <Route path="claims/:id" element={<ClaimDetailPage />} />
            <Route path="retailers" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <Retailers />
              </AuthGuard>
            } />
            <Route path="retailers/new" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <NewRetailer />
              </AuthGuard>
            } />
            <Route path="retailers/:id" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <RetailerDetail />
              </AuthGuard>
            } />
            <Route path="retailers/:id/edit" element={
              <AuthGuard allowedRoles={['owner', 'backoffice']}>
                <EditRetailer />
              </AuthGuard>
            } />
            <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;