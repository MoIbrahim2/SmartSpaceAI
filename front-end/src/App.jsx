import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import AuthLayout from "./Layouts/AuthLayout";
import DashboardLayout from "./Layouts/DashboardLayout";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Registar";
import Credits from "./Pages/Dashboard/Credits";
import Dashboard from "./Pages/Dashboard/Dashboard";
import ApartmentRooms from "./Pages/Dashboard/ApartmentRooms";
import RoomDetail from "./Pages/Dashboard/RoomDetail";
import MyRooms from "./Pages/Dashboard/MyRooms";
import Profile from "./Pages/Dashboard/Profile";
import RoomGeneration from "./Pages/Dashboard/RoomGeneration";
import NotFound from "./Pages/NotFound";
import LandingPage from "./Pages/LandingPage/LandingPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
