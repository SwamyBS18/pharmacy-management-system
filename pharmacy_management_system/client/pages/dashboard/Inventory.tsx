import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface InventoryItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  manufacturer: string;
  category: string;
  batch_id: string;
  quantity: number;
  expiry_date: string;
  manufacturing_date?: string;
  price: number;
  status: "normal" | "low" | "out_of_stock" | "expired";
}

interface AddStockFormData {
  medicine_id: string;
  batch_id: string;
  quantity: string;
  price: string;
  manufacturing_date: string;
  expiry_date: string;
  supplier_id: string;
}

interface MedicineOption {
  id: number;
  medicine_name: string;
}

interface SupplierOption {
  id: number;
  name: string;
}

export default function Inventory() {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<AddStockFormData>({
    medicine_id: "",
    batch_id: "",
    quantity: "",
    price: "",
    manufacturing_date: "",
    expiry_date: "",
    supplier_id: "",
  });

  const { data: inventory, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  const { data: medicines } = useQuery<MedicineOption[]>({
    queryKey: ["medicines-list"],
    queryFn: async () => {
      const response = await fetch("/api/medicines?limit=1000"); // Fetch all for dropdown
      if (!response.ok) throw new Error("Failed to fetch medicines");
      const data = await response.json();
      return data.data;
    },
  });

  const { data: suppliers } = useQuery<SupplierOption[]>({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  const addStockMutation = useMutation({
    mutationFn: async (data: AddStockFormData) => {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add stock");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setIsAddStockOpen(false);
      setFormData({
        medicine_id: "",
        batch_id: "",
        quantity: "",
        price: "",
        manufacturing_date: "",
        expiry_date: "",
        supplier_id: "1",
      });
      toast({
        title: "Success",
        description: "Stock added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stock",
        variant: "destructive",
      });
    },
  });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    addStockMutation.mutate(formData);
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Inventory Items</h2>
          </div>
          <Button
            onClick={() => setIsAddStockOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Stock
          </Button>
        </div>

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
                    Mfg Date
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
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.manufacturing_date ? new Date(item.manufacturing_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${item.status === "normal"
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
      {/* Add Stock Dialog */}
      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Stock</DialogTitle>
            <DialogDescription>
              Add new batch of medicines to inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="space-y-2">
              <Label>Medicine</Label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.medicine_id}
                onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
                required
              >
                <option value="">Select Medicine</option>
                {medicines?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.medicine_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Batch ID</Label>
              <Input
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                placeholder="e.g. BATCH001"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Price (Per Unit)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mfg Date</Label>
                <Input
                  type="date"
                  value={formData.manufacturing_date}
                  onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={addStockMutation.isPending}
            >
              {addStockMutation.isPending ? "Adding..." : "Add Stock"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
