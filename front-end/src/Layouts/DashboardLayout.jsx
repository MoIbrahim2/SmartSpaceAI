import { Outlet } from "react-router-dom";
import StudioHeader from "../Components/StudioHeader";
import StudioFooter from "../Components/StudioFooter";

const DashboardLayout = () => {

  return <>
  <StudioHeader/>
  <Outlet />
  <StudioFooter/>
  </>;
};

export default DashboardLayout;
