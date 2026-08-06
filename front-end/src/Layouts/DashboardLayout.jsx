import { Outlet } from "react-router-dom";
import StudioHeader from "../Components/StudioHeader";
import StudioFooter from "../Components/StudioFooter";
import CartDrawer from "../Components/CartDrawer";

const DashboardLayout = () => {
  return (
    <>
      <StudioHeader />
      <Outlet />
      <CartDrawer />
      <StudioFooter />
    </>
  );
};

export default DashboardLayout;
