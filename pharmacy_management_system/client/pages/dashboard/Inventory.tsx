import DashboardLayout from "@/components/DashboardLayout";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface InventoryItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  manufacturer: string;
  category: string;
  batch_id: string;
  quantity: number;
  expiry_date: string;
  price: number;
  status: "normal" | "low" | "out_of_stock" | "expired";
}

export default function Inventory() {
  const { data: inventory, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Inventory" subtitle="Monitor stock levels">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading inventory...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Inventory" subtitle="Monitor stock levels">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading inventory. Please check your database connection.</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate reorder level (50 units as default)
  const getReorderLevel = (status: string) => {
    return 50; // Default reorder level
  };

  return (
    <DashboardLayout title="Inventory" subtitle="Monitor stock levels">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Medicine Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Batch ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Reorder Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!inventory || inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No inventory items found. Inventory items are created when medicines are added to stock.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.medicine_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.manufacturer || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.batch_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.quantity || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getReorderLevel(item.status)} units
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === "normal"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "low"
                                ? "bg-yellow-100 text-yellow-700"
                                : item.status === "expired"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-red-100 text-red-700"
                          }`}
                        >
                          {(item.status === "expired" || item.status === "out_of_stock") && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {item.status === "normal"
                            ? "Normal"
                            : item.status === "low"
                              ? "Low Stock"
                              : item.status === "expired"
                                ? "Expired"
                                : "Out of Stock"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
