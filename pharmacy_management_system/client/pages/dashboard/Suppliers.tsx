import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Supplier {
  id: number;
  name: string;
  email: string;
  contact: string;
  address: string;
  created_at: string;
}

export default function Suppliers() {
  const { data: suppliers, isLoading, error, refetch } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Suppliers" subtitle="Manage supplier information">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading suppliers...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Suppliers" subtitle="Manage supplier information">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading suppliers. Please check your database connection.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Suppliers" subtitle="Manage supplier information">
      <div className="space-y-6">
        {/* Header with Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              All Suppliers ({(suppliers || []).length})
            </h2>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!suppliers || suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No suppliers found. Add your first supplier to get started.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {supplier.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {supplier.email || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {supplier.contact || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {supplier.address || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
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
