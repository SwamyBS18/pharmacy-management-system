import "./global.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import Orders from "./pages/dashboard/Orders";
import Medicines from "./pages/dashboard/Medicines";
import Suppliers from "./pages/dashboard/Suppliers";
import POS from "./pages/dashboard/POS";
import Inventory from "./pages/dashboard/Inventory";
import Expired from "./pages/dashboard/Expired";
import OutOfStock from "./pages/dashboard/OutOfStock";
import SalesReport from "./pages/dashboard/SalesReport";
import Users from "./pages/dashboard/Users";
import Settings from "./pages/dashboard/Settings";
import BarcodeScanner from "./pages/dashboard/BarcodeScanner";
import Customers from "./pages/dashboard/Customers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Index />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/dashboard",
      element: <AdminDashboard />,
    },
    {
      path: "/dashboard/orders",
      element: <Orders />,
    },
    {
      path: "/dashboard/medicines",
      element: <Medicines />,
    },
    {
      path: "/dashboard/suppliers",
      element: <Suppliers />,
    },
    {
      path: "/dashboard/pos",
      element: <POS />,
    },
    {
      path: "/dashboard/inventory",
      element: <Inventory />,
    },
    {
      path: "/dashboard/expired",
      element: <Expired />,
    },
    {
      path: "/dashboard/out-of-stock",
      element: <OutOfStock />,
    },
    {
      path: "/dashboard/sales-report",
      element: <SalesReport />,
    },
    {
      path: "/dashboard/users",
      element: <Users />,
    },
    {
      path: "/dashboard/customers",
      element: <Customers />,
    },
    {
      path: "/dashboard/settings",
      element: <Settings />,
    },
    {
      path: "/dashboard/barcode-scanner",
      element: <BarcodeScanner />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

createRoot(document.getElementById("root")!).render(<App />);
