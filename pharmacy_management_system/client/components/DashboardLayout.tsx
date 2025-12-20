import { useState } from "react";
import { Link } from "react-router-dom";
import { ReactNode } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  AlertCircle,
  Clock,
  Settings,
  Search,
  Bell,
  User,
  Package,
  ScanLine,
} from "lucide-react";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function DashboardLayout({
  title,
  subtitle,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: ShoppingCart, label: "Doctor Orders", href: "/dashboard/orders" },
    { icon: Pill, label: "Medicines", href: "/dashboard/medicines" },
    { icon: ScanLine, label: "Barcode Scanner", href: "/dashboard/barcode-scanner" },
    { icon: Truck, label: "Suppliers", href: "/dashboard/suppliers" },
    { icon: Package, label: "POS", href: "/dashboard/pos" },
    { icon: Package, label: "Inventory", href: "/dashboard/inventory" },
    { icon: AlertCircle, label: "Expired Drugs", href: "/dashboard/expired" },
    { icon: Clock, label: "Out of Stock", href: "/dashboard/out-of-stock" },
    { icon: BarChart3, label: "Sales Report", href: "/dashboard/sales-report" },
    { icon: Users, label: "Users", href: "/dashboard/users" },
    { icon: User, label: "Customers", href: "/dashboard/customers" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 fixed h-screen overflow-y-auto z-40`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div
            className={`flex items-center gap-2 ${!sidebarOpen && "flex-col"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600">
              <Pill className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && <span className="font-bold">PharmaCare</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 transition-all duration-300`}
      >
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition">
                <Bell className="h-6 w-6 text-slate-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition">
                <User className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-900">
                  Admin
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
          </div>

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
