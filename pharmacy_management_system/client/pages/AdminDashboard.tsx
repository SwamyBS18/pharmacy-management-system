import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
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

export default function AdminDashboard() {
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
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  // Fetch real stats
  const { data: medicinesData } = useQuery<{ data: any[]; pagination: { total: number } }>({
    queryKey: ["medicines-stats"],
    queryFn: async () => {
      const response = await fetch("/api/medicines?limit=1");
      if (!response.ok) throw new Error("Failed to fetch medicines");
      return response.json();
    },
  });

  const { data: ordersData } = useQuery<{ data: any[]; pagination: { total: number } }>({
    queryKey: ["orders-stats"],
    queryFn: async () => {
      const response = await fetch("/api/orders?limit=1");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const { data: expiredDrugs } = useQuery<any[]>({
    queryKey: ["expired-stats"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/expired");
      if (!response.ok) throw new Error("Failed to fetch expired drugs");
      return response.json();
    },
  });

  const { data: outOfStock } = useQuery<any[]>({
    queryKey: ["out-of-stock-stats"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/out-of-stock");
      if (!response.ok) throw new Error("Failed to fetch out of stock");
      return response.json();
    },
  });

  const { data: suppliers } = useQuery<any[]>({
    queryKey: ["suppliers-stats"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  const totalMedicines = medicinesData?.pagination?.total || 0;
  const totalOrders = ordersData?.pagination?.total || 0;
  const totalExpired = expiredDrugs?.length || 0;
  const totalOutOfStock = outOfStock?.length || 0;
  const totalSuppliers = suppliers?.length || 0;

  // Calculate monthly sales (placeholder - would need sales table)
  const monthlySales = totalOrders * 1000; // Estimate

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
                {(totalExpired > 0 || totalOutOfStock > 0) && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
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
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back to PharmaCare</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Medicines"
              value={totalMedicines.toLocaleString()}
              icon="Pill"
              color="blue"
            />
            <StatCard
              label="Total Suppliers"
              value={totalSuppliers.toString()}
              icon="Users"
              color="emerald"
            />
            <StatCard
              label="Total Orders"
              value={totalOrders.toLocaleString()}
              icon="ShoppingCart"
              color="purple"
            />
            <StatCard
              label="Monthly Sales"
              value={`₹${(monthlySales / 1000).toFixed(1)}K`}
              icon="BarChart3"
              color="orange"
            />
          </div>

          {/* Alert Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Expired Drugs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">
                  Expire Date Notification
                </h3>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {totalExpired === 0 ? (
                  <p className="text-sm text-slate-500">No expired drugs. All medicines are within expiry dates.</p>
                ) : (
                  expiredDrugs?.slice(0, 5).map((drug: any) => (
                    <div key={drug.id} className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">
                        {drug.medicine_name || "Unknown"}
                      </p>
                      <p className="text-xs">
                        Batch: {drug.batch_id || "N/A"} | Expired: {drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <Link to="/dashboard/expired">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  View All ({totalExpired})
                </Button>
              </Link>
            </div>

            {/* Stock Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">
                  Out of Stock Notification
                </h3>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {totalOutOfStock === 0 ? (
                  <p className="text-sm text-slate-500">No out of stock items. All medicines are available.</p>
                ) : (
                  outOfStock?.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">
                        {item.medicine_name || "Unknown"}
                      </p>
                      <p className="text-xs">
                        Batch: {item.batch_id || "N/A"} | Stock: {item.quantity || 0}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <Link to="/dashboard/out-of-stock">
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                  View All ({totalOutOfStock})
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Quick Stats</h3>
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="text-sm text-slate-600">Total Medicines</span>
                  <span className="font-semibold text-slate-900">{totalMedicines.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="text-sm text-slate-600">Low Stock Items</span>
                  <span className="font-semibold text-slate-900">{totalOutOfStock}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Pending Orders</span>
                  <span className="font-semibold text-slate-900">
                    {ordersData?.data?.filter((o: any) => o.status === "pending").length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Sales Overview</h3>
              <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                📊 Sales chart will be rendered here
              </div>
            </div>

            {/* Top Medicines Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Top Selling Medicines
              </h3>
              <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                📊 Top medicines chart will be rendered here
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "blue" | "emerald" | "purple" | "orange";
}) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  const colorClasses = colorStyles[color];

  return (
    <div className={`rounded-xl border ${colorClasses} p-6 bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div
          className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses}`}
        >
          {icon === "Pill" && <Pill className="h-6 w-6" />}
          {icon === "Users" && <Users className="h-6 w-6" />}
          {icon === "ShoppingCart" && <ShoppingCart className="h-6 w-6" />}
          {icon === "BarChart3" && <BarChart3 className="h-6 w-6" />}
        </div>
      </div>
    </div>
  );
}
