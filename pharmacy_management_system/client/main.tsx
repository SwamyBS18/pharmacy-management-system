import "./global.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompleteProfile from "./pages/CompleteProfile";
import AdminDashboard from "./pages/AdminDashboard";
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
      path: "/complete-profile",
      element: (
        <ProtectedRoute>
          <CompleteProfile />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/medicines",
      element: (
        <ProtectedRoute>
          <Medicines />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/suppliers",
      element: (
        <ProtectedRoute>
          <Suppliers />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/pos",
      element: (
        <ProtectedRoute>
          <POS />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/inventory",
      element: (
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/expired",
      element: (
        <ProtectedRoute>
          <Expired />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/out-of-stock",
      element: (
        <ProtectedRoute>
          <OutOfStock />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/sales-report",
      element: (
        <ProtectedRoute>
          <SalesReport />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/users",
      element: (
        <ProtectedRoute requireAdmin>
          <Users />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/customers",
      element: (
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/settings",
      element: (
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard/barcode-scanner",
      element: (
        <ProtectedRoute>
          <BarcodeScanner />
        </ProtectedRoute>
      ),
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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

createRoot(document.getElementById("root")!).render(<App />);
