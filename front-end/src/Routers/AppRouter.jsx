import { createBrowserRouter } from "react-router-dom";
import AuthLayout from "../Layouts/AuthLayout";
import DashboardLayout from "../Layouts/DashboardLayout";
import Login from "../Pages/Auth/Login";
import Register from "../Pages/Auth/Registar";
import Credits from "../Pages/Dashboard/Credits";
import Dashboard from "../Pages/Dashboard/Dashboard";
import MyRooms from "../Pages/Dashboard/MyRooms";
import Profile from "../Pages/Dashboard/Profile";
import RoomGeneration from "../Pages/Dashboard/RoomGeneration";
import NotFound from "../Pages/NotFound";
import LandingPage from "../Pages/LandingPage/LandingPage";

const router = createBrowserRouter([
  {
    path: "/landing",
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/room-generation", element: <RoomGeneration /> },
      { path: "/projects", element: <Dashboard /> },
      { path: "/apartments", element: <Dashboard /> },
      { path: "/rooms", element: <MyRooms /> },
      { path: "/credits", element: <Credits /> },
      { path: "/billing", element: <Credits /> },
      { path: "/profile", element: <Profile /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
