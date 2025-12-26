import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfileDropdown from "@/components/ProfileDropdown";
import { api } from "@/lib/api";
import {
  Menu,
  X,
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
  Brain,
} from "lucide-react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  const navigationItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Pill, label: "Medicines", href: "/dashboard/medicines" },
    { icon: ScanLine, label: "Barcode Scanner", href: "/dashboard/barcode-scanner" },
    { icon: Truck, label: "Suppliers", href: "/dashboard/suppliers" },
    { icon: Package, label: "POS", href: "/dashboard/pos" },
    { icon: Package, label: "Inventory", href: "/dashboard/inventory" },
    { icon: AlertCircle, label: "Expired Drugs", href: "/dashboard/expired" },
    { icon: Clock, label: "Out of Stock", href: "/dashboard/out-of-stock" },
    { icon: BarChart3, label: "Sales Report", href: "/dashboard/sales-report" },
    { icon: Brain, label: "Predictions", href: "/dashboard/predictions" },
    { icon: Users, label: "Users", href: "/dashboard/users" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  // Fetch dashboard stats
  const { data: stats } = useQuery<{
    medicines: { total: number; lowStock: number; outOfStock: number };
    suppliers: { total: number };
    sales: {
      today: { amount: number; count: number };
      thisMonth: { amount: number; count: number };
    };
    orders: { pending: number };
    inventory: { expired: number; lowStock: number; outOfStock: number };
  }>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.dashboard.getStats();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: expiredDrugs } = useQuery<any[]>({
    queryKey: ["expired-stats"],
    queryFn: async () => {
      const response = await api.inventory.getExpired();
      return response.data;
    },
  });

  const { data: outOfStock } = useQuery<any[]>({
    queryKey: ["out-of-stock-stats"],
    queryFn: async () => {
      const response = await api.inventory.getOutOfStock();
      return response.data;
    },
  });

  const totalMedicines = stats?.medicines?.total || 0;
  const totalExpired = stats?.inventory?.expired || 0;
  const totalOutOfStock = stats?.inventory?.outOfStock || 0;
  const totalSuppliers = stats?.suppliers?.total || 0;
  const monthlySales = stats?.sales?.thisMonth?.amount || 0;

  // Fetch sales stats for charts
  const { data: salesStats } = useQuery({
    queryKey: ["sales-stats-dashboard"],
    queryFn: async () => {
      const response = await api.sales.getStatsSummary();
      return response.data;
    },
  });

  const dailyData = salesStats?.dailySales || [];
  const topMeds = salesStats?.topMedicines?.slice(0, 5) || [];

  // Get today's sales (most recent day in dailyData)
  const todaySales = dailyData.length > 0 ? Number(dailyData[0]?.sales || 0) : 0;


  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"
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
      </aside>

      {/* Main Content */}
      <main
        className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 transition-all duration-300`}
      >
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
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

              {/* Pharmacy Name and User Role */}
              <PharmacyHeader />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAlertDialogOpen(true)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <Bell className="h-6 w-6 text-slate-600" />
                {(totalExpired > 0 || totalOutOfStock > 0) && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              <ProfileDropdown />
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
              label="Daily Selling"
              value={todaySales > 1000 ? `₹${(todaySales / 1000).toFixed(1)}K` : `₹${todaySales.toLocaleString()}`}
              icon="ShoppingCart"
              color="purple"
            />
            <StatCard
              label="Monthly Sales"
              value={monthlySales > 1000 ? `₹${(monthlySales / 1000).toFixed(1)}K` : `₹${monthlySales.toLocaleString()}`}
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

            {/* AI Predictions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  AI Stock Predictions
                </h3>
                <Brain className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Leverage machine learning for:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    30-Day Demand Forecasting
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    Seasonal Trend Analysis
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                    Smart Reorder Recommendations
                  </li>
                </ul>
                <Link to="/dashboard/predictions">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white mt-2">
                    View AI Insights
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>System Alerts & Notifications</DialogTitle>
            <DialogDescription>
              {totalExpired + totalOutOfStock === 0
                ? "No alerts at this time. All systems normal."
                : `You have ${totalExpired + totalOutOfStock} alert(s) requiring attention.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Expired Drugs Section */}
            {totalExpired > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-slate-900">
                    Expired Drugs ({totalExpired})
                  </h3>
                </div>
                <div className="space-y-2 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  {expiredDrugs?.map((drug: any) => (
                    <div
                      key={drug.id}
                      className="flex justify-between items-start p-3 bg-white rounded border border-orange-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {drug.medicine_name || "Unknown Medicine"}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Batch: {drug.batch_id || "N/A"} |
                          Quantity: {drug.quantity || 0} units
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          Expired: {drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <Link to="/dashboard/expired">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/expired" className="block mt-2">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    View All Expired Drugs
                  </Button>
                </Link>
              </div>
            )}

            {/* Out of Stock Section */}
            {totalOutOfStock > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-slate-900">
                    Out of Stock ({totalOutOfStock})
                  </h3>
                </div>
                <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-4">
                  {outOfStock?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start p-3 bg-white rounded border border-red-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {item.medicine_name || "Unknown Medicine"}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Batch: {item.batch_id || "N/A"} |
                          Stock: {item.quantity || 0} units
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Requires immediate restocking
                        </p>
                      </div>
                      <Link to="/dashboard/out-of-stock">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/out-of-stock" className="block mt-2">
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                    View All Out of Stock Items
                  </Button>
                </Link>
              </div>
            )}

            {/* No Alerts Message */}
            {totalExpired === 0 && totalOutOfStock === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                  <Bell className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">All Clear!</h3>
                <p className="text-slate-600">
                  No alerts at this time. Your inventory is in good shape.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PharmacyHeader() {
  const [pharmacyData, setPharmacyData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Get user data from localStorage
    const user = localStorage.getItem("user");
    if (user) {
      setUserData(JSON.parse(user));
    }

    // Fetch pharmacy profile
    api.pharmacy.getProfile()
      .then((response) => {
        setPharmacyData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching pharmacy profile:", error);
      });
  }, []);

  if (!pharmacyData || !userData) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Welcome to {pharmacyData.pharmacy_name}
      </h2>
      <p className="text-sm text-slate-600">
        {userData.role === "ADMIN" ? "Administrator" : "Employee"}
      </p>
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
