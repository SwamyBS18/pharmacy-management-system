import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Download, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SalesReport() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0], // First day of current month
    end: new Date().toISOString().split("T")[0], // Today
  });

  const { data: salesData, isLoading } = useQuery<{
    data: any[];
    pagination: { total: number };
  }>({
    queryKey: ["sales-report", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      params.append("limit", "1000");
      
      const response = await fetch(`/api/sales?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sales");
      return response.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["sales-stats", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      
      const response = await fetch(`/api/sales/stats/summary?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const sales = salesData?.data || [];
  const stats = statsData || { summary: {}, dailySales: [], topMedicines: [] };

  // Calculate sales statistics
  const totalSales = Number(stats.summary?.total_sales || 0);
  const totalOrders = Number(stats.summary?.total_transactions || 0);
  const avgOrderValue = Number(stats.summary?.avg_sale || 0);

  // Daily sales data
  const dailySales = stats.dailySales || [];
  const topMedicines = stats.topMedicines || [];

  // Group sales by month for monthly view
  const monthlySales = sales.reduce((acc: any, sale: any) => {
    if (!sale.created_at) return acc;
    const date = new Date(sale.created_at);
    const monthKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[monthKey]) {
      acc[monthKey] = { sales: 0, orders: 0 };
    }
    acc[monthKey].sales += Number(sale.final_amount || 0);
    acc[monthKey].orders += 1;
    return acc;
  }, {});

  const monthlyData = Object.entries(monthlySales)
    .map(([month, data]: [string, any]) => ({
      month,
      sales: data.sales,
      orders: data.orders,
      avgOrder: data.orders > 0 ? data.sales / data.orders : 0,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-6); // Last 6 months

  const handleExport = () => {
    // Simple CSV export
    const csv = [
      ["Date", "Invoice", "Customer", "Amount", "Payment Method"].join(","),
      ...sales.map((sale: any) => [
        new Date(sale.created_at).toLocaleDateString(),
        sale.invoice_number,
        sale.customer_name || "Walk-in",
        sale.final_amount,
        sale.payment_method,
      ].join(",")),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Sales Report" subtitle="View sales analytics and trends">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading sales data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Sales Report" subtitle="View sales analytics and trends">
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
          <Calendar className="h-5 w-5 text-slate-500" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-48"
          />
          <span className="text-slate-500">to</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-48"
          />
          <Button onClick={handleExport} variant="outline" className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600">Total Sales</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              ₹{totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {totalOrders.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600">Average Order Value</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              ₹{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Month */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Monthly Sales
            </h3>
            {monthlyData.length === 0 ? (
              <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                No sales data available yet
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                📊 Sales chart visualization
                <br />
                <span className="text-xs mt-2">
                  {monthlyData.length} months of data available
                </span>
              </div>
            )}
          </div>

          {/* Top Selling Medicines */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Top Selling Medicines
            </h3>
            {topMedicines.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No sales data available
              </div>
            ) : (
              <div className="space-y-4">
                {topMedicines.map((medicine: any, idx: number) => (
                  <div
                    key={idx}
                    className="pb-4 border-b border-slate-200 last:border-0"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-slate-900">{medicine.medicine_name}</p>
                      <p className="text-emerald-600 font-bold">
                        {medicine.total_quantity} units
                      </p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (medicine.total_quantity / (topMedicines[0]?.total_quantity || 1)) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Revenue: ₹{Number(medicine.total_revenue || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Daily Sales Trend</h3>
            {dailySales.length === 0 ? (
              <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                No daily sales data available
              </div>
            ) : (
              <div className="space-y-2">
                {dailySales.slice(0, 30).map((day: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-slate-600">{day.date}</div>
                    <div className="flex-1 bg-slate-200 rounded-full h-6 relative">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${
                            (Number(day.sales || 0) / Math.max(...dailySales.map((d: any) => Number(d.sales || 0)))) * 100
                          }%`,
                        }}
                      >
                        <span className="text-xs text-white font-medium">
                          ₹{Number(day.sales || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-slate-600 text-right">
                      {day.transactions} orders
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sales Summary Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Monthly Sales Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                      Avg Order Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No sales data available. Orders will appear here once they are created.
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {row.month}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                          ₹{row.sales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {row.orders}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          ₹{row.avgOrder.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
