import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Edit, Printer, Trash2 } from "lucide-react";
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
import Barcode from "react-barcode";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [printBarcodeOpen, setPrintBarcodeOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
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

  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null);

  // Filter medicines based on search term
  const filteredMedicines = medicines?.filter((m) =>
    m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get selected medicine for display
  const selectedMedicine = medicines?.find((m) => m.id.toString() === formData.medicine_id);

  // Calculate barcode preview
  const barcodePreview = selectedMedicine && formData.batch_id && formData.expiry_date
    ? `${selectedMedicine.barcode}-BATCH${formData.batch_id}-EXP${formData.expiry_date.replace(/-/g, '')}`
    : null;

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setIsAddStockOpen(false);
      setGeneratedBarcode(data.batch_barcode || null);

      // Open print dialog
      setPrintBarcodeOpen(true);

      setFormData({
        medicine_id: "",
        batch_id: "",
        quantity: "",
        price: "",
        manufacturing_date: "",
        expiry_date: "",
        supplier_id: "1",
      });
      setSearchTerm("");
      toast({
        title: "Success",
        description: `Stock added successfully! Batch barcode: ${data.batch_barcode || 'N/A'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stock",
        variant: "destructive",
      });

      const updateInventoryMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<AddStockFormData> }) => {
          const response = await fetch(`/api/inventory/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error("Failed to update inventory");
          return response.json();
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          queryClient.invalidateQueries({ queryKey: ["medicines"] });
          setIsEditMode(false);
          setEditingItem(null);
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
            description: "Inventory updated successfully",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update inventory",
            variant: "destructive",
          });
        },
      });
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete inventory");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete inventory",
        variant: "destructive",
      });
    },
  });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && editingItem) {
      updateInventoryMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      addStockMutation.mutate(formData);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({
      medicine_id: item.medicine_id.toString(),
      batch_id: item.batch_id,
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      manufacturing_date: item.manufacturing_date || "",
      expiry_date: item.expiry_date,
      supplier_id: "1",
    });
    setIsAddStockOpen(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteInventoryMutation.mutate(itemToDelete.id);
    }
  };

  const handlePrintBarcode = () => {
    if (!generatedBarcode) return;

    // Get the barcode SVG element
    const barcodeElement = document.getElementById('barcode-to-print');
    if (!barcodeElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Label</title>
          <style>
            @page {
              size: 4in 2in;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 10px;
            }
            .barcode-label {
              border: 2px solid #000;
              padding: 15px;
              text-align: center;
              background: white;
              max-width: 4in;
            }
            .label-title {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .barcode-container {
              margin: 10px 0;
            }
            .barcode-text {
              font-family: 'Courier New', monospace;
              font-size: 9px;
              margin-top: 5px;
              word-break: break-all;
            }
            .instructions {
              font-size: 8px;
              color: #666;
              margin-top: 8px;
            }
            @media print {
              body { 
                margin: 0;
                padding: 0;
              }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-label">
            <div class="label-title">Pharmacy Batch Label</div>
            <div class="barcode-container">
              ${barcodeElement.innerHTML}
            </div>
            <div class="barcode-text">${generatedBarcode}</div>
            <div class="instructions">Scan for inventory tracking</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Actions
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
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(item)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
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
            <DialogTitle>{isEditMode ? "Edit Inventory" : "Add New Stock"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update inventory batch details." : "Add new batch of medicines to inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="space-y-2">
              <Label>Medicine</Label>
              <div className="relative">
                <Input
                  value={selectedMedicine ? selectedMedicine.medicine_name : searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFormData({ ...formData, medicine_id: "" });
                    setShowMedicineDropdown(true);
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
                  placeholder="Search by name, barcode, or manufacturer..."
                  required={!formData.medicine_id}
                />
                {showMedicineDropdown && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredMedicines.length > 0 ? (
                      filteredMedicines.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                          onClick={() => {
                            setFormData({ ...formData, medicine_id: m.id.toString() });
                            setSearchTerm("");
                            setShowMedicineDropdown(false);
                          }}
                        >
                          <div className="font-medium text-slate-900">{m.medicine_name}</div>
                          <div className="text-xs text-slate-500">
                            {m.manufacturer} | Barcode: {m.barcode || 'N/A'}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-slate-500">No medicines found</div>
                    )}
                  </div>
                )}
              </div>
              {selectedMedicine && (
                <div className="text-sm text-emerald-600">
                  ✓ Selected: {selectedMedicine.medicine_name}
                </div>
              )}
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

            {/* Barcode Preview */}
            {barcodePreview && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-900 mb-1">Batch Barcode Preview:</div>
                <div className="font-mono text-xs text-blue-700 break-all">{barcodePreview}</div>
              </div>
            )}

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

      {/* Print Barcode Dialog */}
      <Dialog open={printBarcodeOpen} onOpenChange={setPrintBarcodeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Barcode Generated Successfully</DialogTitle>
            <DialogDescription>
              Your batch barcode has been generated. You can print it to paste on medicine packages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-sm font-medium text-slate-700 mb-3 text-center">Generated Barcode:</div>
              <div className="flex justify-center bg-white p-4 rounded border border-slate-300">
                {generatedBarcode && (
                  <div id="barcode-to-print" className="max-w-full overflow-hidden">
                    <Barcode
                      value={generatedBarcode}
                      width={1.1}
                      height={50}
                      fontSize={10}
                      margin={2}
                      displayValue={false}
                    />
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-2 text-center font-mono break-all">
                {generatedBarcode}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrintBarcode}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Barcode
              </Button>
              <Button
                onClick={() => setPrintBarcodeOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this inventory item?
            </DialogDescription>
          </DialogHeader>
          {itemToDelete && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-sm">
                <p className="font-medium text-slate-900">{itemToDelete.medicine_name}</p>
                <p className="text-slate-600">Batch: {itemToDelete.batch_id}</p>
                <p className="text-slate-600">Quantity: {itemToDelete.quantity} units</p>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteInventoryMutation.isPending}
            >
              {deleteInventoryMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button
              onClick={() => setDeleteConfirmOpen(false)}
              variant="outline"
              className="flex-1"
              disabled={deleteInventoryMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
