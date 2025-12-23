import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Medicine {
  id: number;
  medicine_name: string;
  manufacturer: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  composition?: string;
  uses?: string;
  side_effects?: string;
  image_url?: string;
}

interface MedicineFormData {
  medicine_name: string;
  manufacturer: string;
  price: string;
  stock: string;
  category: string;
  composition: string;
  uses: string;
  side_effects: string;
  image_url: string;
}

// Barcode Image Component
function BarcodeImage({ barcode }: { barcode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && barcode) {
      try {
        JsBarcode(canvasRef.current, barcode, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          margin: 5,
          fontSize: 12,
          background: "#ffffff",
          lineColor: "#000000",
          valid: function (valid) {
            if (!valid) {
              console.warn("Invalid barcode:", barcode);
            }
          }
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [barcode]);

  return (
    <div className="inline-block bg-white p-2 rounded border border-slate-200">
      <canvas
        ref={canvasRef}
        style={{
          imageRendering: "crisp-edges",
          maxWidth: "100%",
          height: "auto",
          minWidth: "150px"
        }}
      />
    </div>
  );
}

export default function Medicines() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState<MedicineFormData>({
    medicine_name: "",
    manufacturer: "",
    price: "",
    stock: "",
    category: "",
    composition: "",
    uses: "",
    side_effects: "",
    image_url: "",
  });

  const queryClient = useQueryClient();

  // Fetch manufacturers list
  const { data: manufacturersData } = useQuery<string[]>({
    queryKey: ["manufacturers"],
    queryFn: async () => {
      const response = await fetch("/api/medicines/manufacturers/list");
      if (!response.ok) throw new Error("Failed to fetch manufacturers");
      return response.json();
    },
  });

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append("search", searchTerm);
  if (selectedManufacturer) queryParams.append("manufacturer", selectedManufacturer);
  queryParams.append("page", currentPage.toString());
  queryParams.append("limit", itemsPerPage.toString());

  const { data, isLoading, error, refetch } = useQuery<{
    data: Medicine[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["medicines", searchTerm, selectedManufacturer, currentPage, itemsPerPage],
    queryFn: async () => {
      const url = `/api/medicines?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch medicines");
      return response.json();
    },
  });

  const medicines = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 100, total: 0, totalPages: 1 };

  // Create medicine mutation
  const createMutation = useMutation({
    mutationFn: async (newMedicine: Partial<Medicine>) => {
      const response = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMedicine),
      });
      if (!response.ok) throw new Error("Failed to create medicine");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update medicine mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Medicine> }) => {
      const response = await fetch(`/api/medicines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update medicine");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setIsDialogOpen(false);
      setEditingMedicine(null);
      resetForm();
    },
  });

  // Delete medicine mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/medicines/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete medicine");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;
    deleteMutation.mutate(id);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (manufacturer: string) => {
    setSelectedManufacturer(manufacturer);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      medicine_name: "",
      manufacturer: "",
      price: "",
      stock: "",
      category: "",
      composition: "",
      uses: "",
      side_effects: "",
      image_url: "",
    });
    setEditingMedicine(null);
  };

  const handleOpenDialog = (medicine?: Medicine) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        medicine_name: medicine.medicine_name,
        manufacturer: medicine.manufacturer || "",
        price: medicine.price?.toString() || "",
        stock: medicine.stock?.toString() || "",
        category: medicine.category || "",
        composition: medicine.composition || "",
        uses: medicine.uses || "",
        side_effects: medicine.side_effects || "",
        image_url: medicine.image_url || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const medicineData = {
      medicine_name: formData.medicine_name,
      manufacturer: formData.manufacturer,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      composition: formData.composition,
      uses: formData.uses,
      side_effects: formData.side_effects,
      image_url: formData.image_url,
    };

    if (editingMedicine) {
      updateMutation.mutate({ id: editingMedicine.id, data: medicineData });
    } else {
      createMutation.mutate(medicineData);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Medicines" subtitle="Manage medicines inventory">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading medicines...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Medicines" subtitle="Manage medicines inventory">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading medicines. Please check your database connection.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Medicines" subtitle="Manage medicines inventory">
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                All Medicines ({pagination.total.toLocaleString()})
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Showing {medicines.length} of {pagination.total.toLocaleString()} medicines
                {selectedManufacturer && ` from ${selectedManufacturer}`}
              </p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 min-w-[200px]"
            />
            <select
              value={selectedManufacturer}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-[250px]"
            >
              <option value="">All Manufacturers</option>
              {manufacturersData?.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
              <option value={500}>500 per page</option>
            </select>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden py-3">
          <div className="overflow-x-auto p-3">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {medicines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No medicines found. {searchTerm && "Try a different search term."}
                      {selectedManufacturer && !searchTerm && "Try selecting a different manufacturer."}
                    </td>
                  </tr>
                ) : (
                  medicines.map((medicine) => (
                    <tr key={medicine.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        {medicine.image_url ? (
                          <img
                            src={medicine.image_url}
                            alt={medicine.medicine_name}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='10' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                            <span className="text-xs text-slate-400">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {medicine.medicine_name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {medicine.barcode ? (
                          <div className="flex flex-col items-start gap-1">
                            <BarcodeImage barcode={medicine.barcode} />
                            <span className="font-mono text-xs text-slate-500 mt-1">
                              {medicine.barcode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">No barcode</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {medicine.manufacturer || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        ₹{Number(medicine.price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-5 py-1 rounded-full text-xs font-semibold ${medicine.stock > 100
                              ? "bg-emerald-100 text-emerald-700"
                              : medicine.stock > 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                        >
                          {medicine.stock || 0} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {medicine.category || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => handleOpenDialog(medicine)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(medicine.id)}
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

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
            <div className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={currentPage === pageNum ? "bg-emerald-600 text-white" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
            </DialogTitle>
            <DialogDescription>
              {editingMedicine
                ? "Update the medicine information below."
                : "Fill in the details to add a new medicine to the inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="medicine_name">Medicine Name *</Label>
                <Input
                  id="medicine_name"
                  value={formData.medicine_name}
                  onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock (units)</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="composition">Composition</Label>
                <Textarea
                  id="composition"
                  value={formData.composition}
                  onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="uses">Uses</Label>
                <Textarea
                  id="uses"
                  value={formData.uses}
                  onChange={(e) => setFormData({ ...formData, uses: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="side_effects">Side Effects</Label>
                <Textarea
                  id="side_effects"
                  value={formData.side_effects}
                  onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingMedicine ? "Update Medicine" : "Add Medicine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
