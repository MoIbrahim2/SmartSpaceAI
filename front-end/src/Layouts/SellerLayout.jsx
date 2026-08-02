import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Seller/Sidebar";
import Header from "../Components/Seller/Header";
import { ToastProvider } from "../Components/Admin/Shared/ToastContext";

export default function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-on-surface flex font-headline">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

          <main className="flex-1 px-6 pb-12 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
