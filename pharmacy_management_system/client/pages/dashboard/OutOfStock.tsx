import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface OutOfStockItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  manufacturer: string;
  supplier_name: string;
  supplier_email: string;
  batch_id: string;
  quantity: number;
  expiry_date: string;
  price: number;
}

export default function OutOfStock() {
  const { data: outOfStock, isLoading, error, refetch } = useQuery<OutOfStockItem[]>({
    queryKey: ["out-of-stock"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/out-of-stock");
      if (!response.ok) throw new Error("Failed to fetch out of stock items");
      return response.json();
    },
  });

  const handleRequest = async (item: OutOfStockItem) => {
    // TODO: Implement request functionality
    alert(`Request stock for ${item.medicine_name} from ${item.supplier_name || item.supplier_email}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Out of Stock" subtitle="Track out of stock medicines">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading out of stock items...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Out of Stock" subtitle="Track out of stock medicines">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading out of stock items. Please check your database connection.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Out of Stock" subtitle="Track out of stock medicines">
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">
              Total Out of Stock Items: {(outOfStock || []).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Drug Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Batch ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!outOfStock || outOfStock.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No out of stock items found. All medicines are in stock!
                    </td>
                  </tr>
                ) : (
                  outOfStock.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium">{item.supplier_name || "N/A"}</p>
                          <p className="text-xs text-slate-500">{item.supplier_email || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.medicine_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.manufacturer || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <AlertCircle className="h-3 w-3" />
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.batch_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        ₹{Number(item.price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          onClick={() => handleRequest(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1"
                        >
                          Request
                        </Button>
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
