import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, FileText, Search, Eye, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

interface Invoice {
    id: number;
    invoice_number: string;
    customer_name: string | null;
    customer_phone: string | null;
    total_amount: number;
    tax_amount: number;
    discount_amount: number;
    final_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    has_pdf: boolean;
    download_url: string;
}

interface InvoicePreview {
    id: number;
    invoice_number: string;
    customer_name: string | null;
    customer_phone: string | null;
    total_amount: number;
    tax_amount: number;
    discount_amount: number;
    final_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
    items: Array<{
        id: number;
        medicine_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
    }>;
}

export default function Billing() {
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

    const { data: invoicesData, isLoading } = useQuery<{
        data: Invoice[];
        pagination: any;
    }>({
        queryKey: ["invoices", searchTerm, startDate, endDate],
        queryFn: async () => {
            let url = "/api/billing/invoices?limit=100";
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch invoices");
            return response.json();
        },
    });

    const { data: previewData } = useQuery<InvoicePreview>({
        queryKey: ["invoice-preview", selectedInvoiceId],
        queryFn: async () => {
            const response = await fetch(`/api/billing/invoice/${selectedInvoiceId}/preview`);
            if (!response.ok) throw new Error("Failed to fetch invoice preview");
            return response.json();
        },
        enabled: !!selectedInvoiceId && previewOpen,
    });

    const invoices = invoicesData?.data || [];

    const handleDownload = (invoiceId: number, invoiceNumber: string) => {
        const url = `/api/billing/invoice/${invoiceId}`;
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice_${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = (invoiceId: number) => {
        setSelectedInvoiceId(invoiceId);
        setPreviewOpen(true);
    };

    const handlePrint = (invoiceId: number) => {
        const url = `/api/billing/invoice/${invoiceId}`;
        window.open(url, "_blank");
    };

    return (
        <DashboardLayout title="Billing" subtitle="Manage invoices and billing">
            <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Invoice number or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                                        Invoice Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                                        Payment
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
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            Loading invoices...
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            No invoices found. Complete a sale to generate an invoice.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {invoice.invoice_number}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div>
                                                    <div className="font-medium">
                                                        {invoice.customer_name || "Walk-in Customer"}
                                                    </div>
                                                    {invoice.customer_phone && (
                                                        <div className="text-xs text-slate-500">
                                                            {invoice.customer_phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {new Date(invoice.created_at).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                                ₹{Number(invoice.final_amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="capitalize">{invoice.payment_method}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.payment_status === "paid"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                >
                                                    {invoice.payment_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handlePreview(invoice.id)}
                                                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownload(invoice.id, invoice.invoice_number)}
                                                        className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                    >
                                                        <Download className="h-4 w-4 mr-1" />
                                                        Download
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handlePrint(invoice.id)}
                                                        className="text-purple-600 border-purple-300 hover:bg-purple-50"
                                                    >
                                                        <Printer className="h-4 w-4" />
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

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Invoice Preview</DialogTitle>
                        <DialogDescription>
                            Review invoice details before downloading
                        </DialogDescription>
                    </DialogHeader>

                    {previewData && (
                        <div className="space-y-6">
                            {/* Invoice Header */}
                            <div className="border-b pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-bold text-emerald-600">
                                            INVOICE
                                        </h3>
                                        <p className="text-sm text-slate-600 mt-1">
                                            PharmaAI Management System
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {previewData.invoice_number}
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            {new Date(previewData.created_at).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">
                                        Customer Details
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        {previewData.customer_name || "Walk-in Customer"}
                                    </p>
                                    {previewData.customer_phone && (
                                        <p className="text-sm text-slate-600">
                                            {previewData.customer_phone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">
                                        Payment Details
                                    </h4>
                                    <p className="text-sm text-slate-600 capitalize">
                                        Method: {previewData.payment_method}
                                    </p>
                                    <p className="text-sm text-slate-600 capitalize">
                                        Status: {previewData.payment_status}
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Items</h4>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold">#</th>
                                            <th className="px-3 py-2 text-left font-semibold">Medicine</th>
                                            <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold">Price</th>
                                            <th className="px-3 py-2 text-right font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {previewData.items.map((item, idx) => (
                                            <tr key={item.id}>
                                                <td className="px-3 py-2">{idx + 1}</td>
                                                <td className="px-3 py-2">{item.medicine_name}</td>
                                                <td className="px-3 py-2 text-right">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right">
                                                    ₹{Number(item.unit_price).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    ₹{Number(item.total_price).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-4">
                                <div className="space-y-2 max-w-xs ml-auto">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Subtotal:</span>
                                        <span className="font-medium">
                                            ₹{Number(previewData.total_amount).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Tax (10%):</span>
                                        <span className="font-medium">
                                            ₹{Number(previewData.tax_amount).toFixed(2)}
                                        </span>
                                    </div>
                                    {previewData.discount_amount > 0 && (
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>Discount:</span>
                                            <span className="font-medium">
                                                -₹{Number(previewData.discount_amount).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total:</span>
                                        <span className="text-emerald-600">
                                            ₹{Number(previewData.final_amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t">
                                <Button
                                    onClick={() => handleDownload(previewData.id, previewData.invoice_number)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </Button>
                                <Button
                                    onClick={() => handlePrint(previewData.id)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
