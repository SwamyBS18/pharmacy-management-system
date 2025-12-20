import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ExpiredDrug {
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

export default function Expired() {
  const { data: expiredDrugs, isLoading, error, refetch } = useQuery<ExpiredDrug[]>({
    queryKey: ["expired-drugs"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/expired");
      if (!response.ok) throw new Error("Failed to fetch expired drugs");
      return response.json();
    },
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this expired drug from inventory?")) return;
    
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Error deleting expired drug:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Expired Drugs" subtitle="Track expired medicines">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading expired drugs...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Expired Drugs" subtitle="Track expired medicines">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading expired drugs. Please check your database connection.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Expired Drugs" subtitle="Track expired medicines">
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">
              Total Expired Items: {(expiredDrugs || []).length}
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!expiredDrugs || expiredDrugs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No expired drugs found. Great! All medicines are within their expiry dates.
                    </td>
                  </tr>
                ) : (
                  expiredDrugs.map((drug) => (
                    <tr key={drug.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium">{drug.supplier_name || "N/A"}</p>
                          <p className="text-xs text-slate-500">{drug.supplier_email || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {drug.medicine_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {drug.manufacturer || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {drug.quantity || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {drug.batch_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 font-medium">
                        {drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        ₹{Number(drug.price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(drug.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                          title="Remove from inventory"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
