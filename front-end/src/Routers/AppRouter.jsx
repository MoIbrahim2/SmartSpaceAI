import { createBrowserRouter } from "react-router-dom";
import AuthLayout from "../Layouts/AuthLayout";
import DashboardLayout from "../Layouts/DashboardLayout";
import AdminLayout from "../Layouts/AdminLayout";
import SellerLayout from "../Layouts/SellerLayout";
import Login from "../Pages/Auth/Login";
import Register from "../Pages/Auth/Registar";
import Credits from "../Pages/Dashboard/Credits";
import Dashboard from "../Pages/Dashboard/Dashboard";
import ApartmentRooms from "../Pages/Dashboard/ApartmentRooms";
import RoomDetail from "../Pages/Dashboard/RoomDetail";
import MyRooms from "../Pages/Dashboard/MyRooms";
import Profile from "../Pages/Dashboard/Profile";
import RoomGeneration from "../Pages/Dashboard/RoomGeneration";
import PaymentSuccess from "../Pages/Dashboard/PaymentSuccess";
import NotFound from "../Pages/NotFound";
import LandingPage from "../Pages/LandingPage/LandingPage";
import ContactUs from "../Pages/ContactUs/contactUs";
import ProtectedRoute from "../Components/ProtectedRoute";

import AdminDashboard from "../Pages/Admin/AdminDashboard";
import SellerManagement from "../Pages/Admin/SellerManagement";
import CommissionReports from "../Pages/Admin/CommissionReports";
import ModerationQueue from "../Pages/Admin/ModerationQueue";
import Orders from "../Pages/Admin/Orders";
import Settings from "../Pages/Admin/Settings";

import SellerDashboard from "../Pages/Seller/SellerDashboard";
import SellerProducts from "../Pages/Seller/SellerProducts";
import SellerProductForm from "../Pages/Seller/SellerProductForm";
import SellerOrders from "../Pages/Seller/SellerOrders";
import SellerEarnings from "../Pages/Seller/SellerEarnings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/contact",
    element: <ContactUs />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/home", element: <Dashboard /> },
      { path: "/apartments/:apartmentId", element: <ApartmentRooms /> },
      { path: "/apartments/:apartmentId/rooms/:roomId", element: <RoomDetail /> },
      { path: "/room-generation", element: <RoomGeneration /> },
      { path: "/projects", element: <Dashboard /> },
      { path: "/apartments", element: <Dashboard /> },
      { path: "/rooms", element: <MyRooms /> },
      { path: "/credits", element: <Credits /> },
      { path: "/billing", element: <Credits /> },
      { path: "/profile", element: <Profile /> },
      { path: "/payment-success", element: <PaymentSuccess /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "sellers", element: <SellerManagement /> },
      { path: "commissions", element: <CommissionReports /> },
      { path: "moderation", element: <ModerationQueue /> },
      { path: "orders", element: <Orders /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "/seller",
    element: (
      <ProtectedRoute roles={["seller", "admin"]}>
        <SellerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <SellerDashboard /> },
      { path: "dashboard", element: <SellerDashboard /> },
      { path: "products", element: <SellerProducts /> },
      { path: "products/create", element: <SellerProductForm /> },
      { path: "products/:id/edit", element: <SellerProductForm /> },
      { path: "orders", element: <SellerOrders /> },
      { path: "earnings", element: <SellerEarnings /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;

