import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataSyncProvider } from "@/contexts/DataSyncContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ChatBot } from "@/components/chat/ChatBot";
import LoginPage from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ResourceListPage } from "./pages/resources/ResourceListPage";
import { ResourceDetailPage } from "./pages/resources/ResourceDetailPage";
import { MyResourcesPage } from "./pages/resources/MyResourcesPage";
import { ResourceFormPage } from "./pages/resources/ResourceFormPage";
import { ResourceMediaPage } from "./pages/resources/ResourceMediaPage";
import { ReservationsPage } from "./pages/reservations/ReservationsPage";
import { NewReservationPage } from "./pages/reservations/NewReservationPage";
import { CheckoutReviewPage } from "./pages/reservations/CheckoutReviewPage";
import { CheckoutPage } from "./pages/reservations/CheckoutPage";
import { PaymentSuccessPage } from "./pages/reservations/PaymentSuccessPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { ChangePasswordPage } from "./pages/profile/ChangePasswordPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { AdminReservationsPage } from "./pages/admin/AdminReservationsPage";
import { AdminResourcesPage } from "./pages/admin/AdminResourcesPage";
import { PendingRegistrationsPage } from "./pages/admin/PendingRegistrationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <DataSyncProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ChatBot />
            <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/resources/:type" element={<ProtectedRoute><ResourceListPage /></ProtectedRoute>} />
            <Route path="/resources/:type/:id" element={<ProtectedRoute><ResourceDetailPage /></ProtectedRoute>} />
            <Route path="/resources/my" element={<ProtectedRoute><MyResourcesPage /></ProtectedRoute>} />
            <Route path="/resources/new" element={<ProtectedRoute><ResourceFormPage /></ProtectedRoute>} />
            <Route path="/resources/:id/edit" element={<ProtectedRoute><ResourceFormPage /></ProtectedRoute>} />
            <Route path="/resources/:id/media" element={<ProtectedRoute><ResourceMediaPage /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
            <Route path="/reservations/new" element={<ProtectedRoute><NewReservationPage /></ProtectedRoute>} />
            <Route path="/reservations/review" element={<ProtectedRoute><CheckoutReviewPage /></ProtectedRoute>} />
            <Route path="/reservations/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/reservations/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/reservations" element={<ProtectedRoute requiredRole="admin"><AdminReservationsPage /></ProtectedRoute>} />
            <Route path="/admin/resources" element={<ProtectedRoute requiredRole="admin"><AdminResourcesPage /></ProtectedRoute>} />
            <Route path="/admin/pending-registrations" element={<ProtectedRoute requiredRole="admin"><PendingRegistrationsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </DataSyncProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
