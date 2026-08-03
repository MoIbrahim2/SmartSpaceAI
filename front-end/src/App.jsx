import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import AuthLayout from "./Layouts/AuthLayout";
import DashboardLayout from "./Layouts/DashboardLayout";
import AdminLayout from "./Layouts/AdminLayout";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Registar";
import Credits from "./Pages/Dashboard/Credits";
import Dashboard from "./Pages/Dashboard/Dashboard";
import ApartmentRooms from "./Pages/Dashboard/ApartmentRooms";
import RoomDetail from "./Pages/Dashboard/RoomDetail";
import MyRooms from "./Pages/Dashboard/MyRooms";
import Profile from "./Pages/Dashboard/Profile";
import RoomGeneration from "./Pages/Dashboard/RoomGeneration";
import PaymentSuccess from "./Pages/Dashboard/PaymentSuccess";
import NotFound from "./Pages/NotFound";
import LandingPage from "./Pages/LandingPage/LandingPage";
import ContactUs from "./Pages/ContactUs/contactUs";

import AdminDashboard from "./Pages/Admin/AdminDashboard";
import SellerManagement from "./Pages/Admin/SellerManagement";
import CommissionReports from "./Pages/Admin/CommissionReports";
import ModerationQueue from "./Pages/Admin/ModerationQueue";
import Orders from "./Pages/Admin/Orders";
import Settings from "./Pages/Admin/Settings";

import SellerLayout from "./Layouts/SellerLayout";
import SellerDashboard from "./Pages/Seller/SellerDashboard";
import SellerProducts from "./Pages/Seller/SellerProducts";
import SellerProductForm from "./Pages/Seller/SellerProductForm";
import SellerOrders from "./Pages/Seller/SellerOrders";
import SellerEarnings from "./Pages/Seller/SellerEarnings";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Dashboard />} />
            <Route path="/apartments/:apartmentId" element={<ApartmentRooms />} />
            <Route path="/apartments/:apartmentId/rooms/:roomId" element={<RoomDetail />} />
            <Route path="/room-generation" element={<RoomGeneration />} />
            <Route path="/projects" element={<Dashboard />} />
            <Route path="/apartments" element={<Dashboard />} />
            <Route path="/rooms" element={<MyRooms />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/billing" element={<Credits />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="sellers" element={<SellerManagement />} />
            <Route path="commissions" element={<CommissionReports />} />
            <Route path="moderation" element={<ModerationQueue />} />
            <Route path="orders" element={<Orders />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route
            path="/seller"
            element={
              <ProtectedRoute roles={["seller", "admin"]}>
                <SellerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SellerDashboard />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/create" element={<SellerProductForm />} />
            <Route path="products/:id/edit" element={<SellerProductForm />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="earnings" element={<SellerEarnings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

