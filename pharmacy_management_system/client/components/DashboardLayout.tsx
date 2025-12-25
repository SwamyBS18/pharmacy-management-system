import { useState } from "react";
import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  // Fetch alerts data
  const { data: expiredDrugs } = useQuery<any[]>({
    queryKey: ["expired-alerts"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/expired");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: outOfStock } = useQuery<any[]>({
    queryKey: ["out-of-stock-alerts"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/out-of-stock");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const totalExpired = expiredDrugs?.length || 0;
  const totalOutOfStock = outOfStock?.length || 0;

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
    { icon: Users, label: "Users", href: "/dashboard/users" },
    { icon: User, label: "Customers", href: "/dashboard/customers" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

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

        {/* Logout */}

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
              <button
                onClick={() => setAlertDialogOpen(true)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition"
              >
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
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
          </div>

          {/* Page Content */}
          {children}
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
                  {expiredDrugs?.slice(0, 5).map((drug: any) => (
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
                          onClick={() => setAlertDialogOpen(false)}
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/expired" className="block mt-2">
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => setAlertDialogOpen(false)}
                  >
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
                  {outOfStock?.slice(0, 5).map((item: any) => (
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
                          onClick={() => setAlertDialogOpen(false)}
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/out-of-stock" className="block mt-2">
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => setAlertDialogOpen(false)}
                  >
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
