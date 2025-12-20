import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, User, Phone, Mail, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  loyalty_points?: number;
  total_purchases?: number;
  last_purchase_date?: string;
}

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{
    data: Customer[];
    pagination: any;
  }>({
    queryKey: ["customers", searchTerm],
    queryFn: async () => {
      const url = searchTerm
        ? `/api/customers?search=${encodeURIComponent(searchTerm)}`
        : "/api/customers";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const customers = data?.data || [];

  const createMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create customer");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Customer created successfully");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update customer");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Customer updated successfully");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete customer");
      }
    },
    onSuccess: () => {
      toast.success("Customer deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      date_of_birth: "",
      gender: "",
    });
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        date_of_birth: customer.date_of_birth || "",
        gender: customer.gender || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Customer name is required");
      return;
    }

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Customers" subtitle="Manage customer database">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading customers...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Customers" subtitle="Manage customer database">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading customers</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Customers" subtitle="Manage customer database">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{customer.name}</h3>
                    {customer.phone && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(customer)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this customer?")) {
                        deleteMutation.mutate(customer.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Purchases:</span>
                  <span className="font-semibold text-emerald-600">
                    ₹{Number(customer.total_purchases || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Loyalty Points:</span>
                  <span className="font-semibold">{customer.loyalty_points || 0}</span>
                </div>
                {customer.last_purchase_date && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShoppingBag className="h-3 w-3" />
                    Last purchase: {new Date(customer.last_purchase_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No customers found. {searchTerm && "Try a different search term."}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Update customer information"
                  : "Enter customer details to add them to the database"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editingCustomer ? "Update" : "Create"} Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

