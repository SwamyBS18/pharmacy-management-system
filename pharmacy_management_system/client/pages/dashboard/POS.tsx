import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Search, Plus, Trash2, Pill, User, CreditCard, Receipt, Download, Printer } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Medicine {
  id: number;
  medicine_name: string;
  price: number;
  stock: number;
  image_url?: string;
  barcode?: string;
}

interface CartItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  price: number;
  quantity: number;
  unit_price: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [lastSale, setLastSale] = useState<any>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: medicinesData, isLoading } = useQuery<{
    data: Medicine[];
    pagination: any;
  }>({
    queryKey: ["medicines", searchTerm],
    queryFn: async () => {
      const url = searchTerm
        ? `/api/medicines?search=${encodeURIComponent(searchTerm)}&limit=100`
        : "/api/medicines?limit=100";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch medicines");
      return response.json();
    },
  });

  const { data: customersData } = useQuery<{
    data: any[];
    pagination: any;
  }>({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers?limit=100");
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const medicines = medicinesData?.data || [];
  const customers = customersData?.data || [];

  const addToCart = (medicine: Medicine) => {
    if (medicine.stock <= 0) {
      alert("This medicine is out of stock!");
      return;
    }

    const existingItem = cart.find((item) => item.id === medicine.id);
    if (existingItem) {
      if (existingItem.quantity >= medicine.stock) {
        alert("Not enough stock available!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: medicine.id,
          medicine_id: medicine.id,
          medicine_name: medicine.medicine_name,
          price: Number(medicine.price || 0),
          unit_price: Number(medicine.price || 0),
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const medicine = medicines.find((m) => m.id === id);
    if (medicine && quantity > medicine.stock) {
      alert("Not enough stock available!");
      return;
    }
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const tax = total * 0.1;
  const finalTotal = total + tax - discount;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const items = cart.map((item) => ({
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      let finalCustomerId = customerId === "walk_in" ? "" : customerId;

      // Create customer if new customer info provided
      if ((!customerId || customerId === "walk_in") && customerName) {
        const customerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customerName,
            phone: customerPhone || null,
          }),
        });
        if (customerResponse.ok) {
          const newCustomer = await customerResponse.json();
          finalCustomerId = newCustomer.id;
        }
      }

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: finalCustomerId || null,
          items,
          payment_method: paymentMethod,
          payment_status: "paid",
          discount_amount: discount,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process sale");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setLastSale(data);
      toast.success(`Sale completed! Invoice: ${data.invoice_number}`);
      setCart([]);
      setCheckoutOpen(false);
      setCustomerId("");
      setCustomerName("");
      setCustomerPhone("");
      setDiscount(0);
      setNotes("");
      setInvoiceDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process sale");
    },
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }
    setCheckoutOpen(true);
  };

  const handleConfirmCheckout = () => {
    checkoutMutation.mutate();
  };

  return (
    <DashboardLayout title="POS" subtitle="Manage sales and checkout">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search and Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicines by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-600">Loading medicines...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {medicines.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-500">
                  No medicines found. {searchTerm && "Try a different search term."}
                </div>
              ) : (
                medicines.map((medicine) => (
                  <button
                    key={medicine.id}
                    onClick={() => addToCart(medicine)}
                    disabled={medicine.stock <= 0}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg h-32 flex items-center justify-center mb-3 overflow-hidden">
                      {medicine.image_url ? (
                        <img
                          src={medicine.image_url}
                          alt={medicine.medicine_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <Pill className={`h-12 w-12 text-emerald-600 ${medicine.image_url ? "hidden" : ""}`} />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1">
                      {medicine.medicine_name}
                    </h3>
                    <p className="text-emerald-600 font-bold text-sm mb-2">
                      ₹{Number(medicine.price || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      Stock: {medicine.stock || 0} units
                    </p>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2"
                      disabled={medicine.stock <= 0}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24">
          <h3 className="font-semibold text-slate-900 mb-4">
            Shopping Cart ({cart.length})
          </h3>

          {/* Cart Items */}
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Cart is empty. Add medicines to get started.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center pb-3 border-b border-slate-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {item.medicine_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center text-xs hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="text-xs text-slate-600 w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center text-xs hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      ₹{item.unit_price.toFixed(2)} x {item.quantity} = ₹
                      {(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:bg-red-100 p-1 rounded ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <>
              <div className="space-y-2 border-t border-slate-200 pt-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium text-slate-900">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax (10%):</span>
                  <span className="font-medium text-slate-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-emerald-600">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Checkout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Checkout</DialogTitle>
            <DialogDescription>
              Review order details and select payment method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or add customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk_in">Walk-in Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!customerId || customerId === "walk_in") && (
                <div className="space-y-2">
                  <Input
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label>Discount (₹)</Label>
              <Input
                type="number"
                min="0"
                max={total}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-emerald-600">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              disabled={checkoutMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {checkoutMutation.isPending ? "Processing..." : "Confirm Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Success Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>✅ Sale Completed Successfully!</DialogTitle>
            <DialogDescription>
              Your invoice has been generated and is ready to download
            </DialogDescription>
          </DialogHeader>

          {lastSale && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Invoice Number:</span>
                    <span className="font-semibold text-slate-900">{lastSale.invoice_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Amount:</span>
                    <span className="font-semibold text-emerald-600">₹{Number(lastSale.final_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Payment Method:</span>
                    <span className="font-medium text-slate-900 capitalize">{lastSale.payment_method}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const url = `/api/billing/invoice/${lastSale.id}`;
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `invoice_${lastSale.invoice_number}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                <Button
                  onClick={() => {
                    window.open(`/api/billing/invoice/${lastSale.id}`, "_blank");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>

              <Button
                onClick={() => setInvoiceDialogOpen(false)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
