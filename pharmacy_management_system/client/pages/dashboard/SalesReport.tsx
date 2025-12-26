import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Download, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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

      const response = await api.sales.getAll(params);
      return response.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["sales-stats", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const response = await api.sales.getStatsSummary(params);
      return response.data;
    },
  });

  const sales = salesData?.data || [];
  const stats = statsData || { summary: {}, dailySales: [], topMedicines: [] };

  // Debug logging
  console.log('Sales Report Data:', {
    salesCount: sales.length,
    statsData,
    dailySalesCount: stats.dailySales?.length || 0,
    topMedicinesCount: stats.topMedicines?.length || 0
  });

  // Calculate sales statistics
  const totalSales = Number(stats.summary?.total_sales || 0);

  // Extract data exactly like AdminDashboard does
  const dailySales = stats?.dailySales || [];
  const topMeds = stats?.topMedicines || [];

  console.log('Extracted data:', {
    dailySalesLength: dailySales.length,
    topMedsLength: topMeds.length,
    dailySalesSample: dailySales[0],
    topMedsSample: topMeds[0]
  });

  // Get today's sales (most recent day in dailySales array)
  // dailySales is ordered by date DESC, so [0] is the most recent day
  const todaySales = dailySales.length > 0 ? Number(dailySales[0]?.sales || 0) : 0;
  const todayDate = dailySales.length > 0 ? dailySales[0]?.date : null;

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

  // Calculate monthly average sales
  const totalMonthlySales = monthlyData.reduce((sum: number, month: any) => sum + Number(month.sales || 0), 0);
  const avgMonthlySales = monthlyData.length > 0 ? totalMonthlySales / monthlyData.length : 0;

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
            <p className="text-xs text-slate-500 mt-1">For selected period</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600">Daily Sales</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ₹{todaySales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {todayDate ? new Date(todayDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No data'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600">Monthly Sales</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              ₹{avgMonthlySales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">Average per month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Month - Line Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Monthly Sales Trend
            </h3>
            {monthlyData.length === 0 ? (
              <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                No sales data available yet
              </div>
            ) : (
              <div className="h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 60}
                      x2="600"
                      y2={i * 60}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Area fill */}
                  <defs>
                    <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const maxSales = Math.max(...monthlyData.map((d: any) => Number(d.sales || 0)));
                    const points = monthlyData.map((data: any, idx: number) => {
                      const x = (idx / (monthlyData.length - 1)) * 600;
                      const y = 240 - ((Number(data.sales) / maxSales) * 220);
                      return { x, y, data };
                    });

                    const pathD = points.map((p, i) =>
                      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                    ).join(' ');

                    const areaD = `${pathD} L 600 240 L 0 240 Z`;

                    return (
                      <>
                        {/* Area */}
                        <path d={areaD} fill="url(#salesGradient)" />

                        {/* Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points */}
                        {points.map((point, idx) => (
                          <g key={idx}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="5"
                              fill="white"
                              stroke="#10b981"
                              strokeWidth="3"
                              className="hover:r-7 transition-all cursor-pointer"
                            />
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="20"
                              fill="transparent"
                              className="cursor-pointer"
                            >
                              <title>
                                {point.data.month}
                                {'\n'}₹{Number(point.data.sales).toLocaleString()}
                                {'\n'}{point.data.orders} orders
                              </title>
                            </circle>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 px-1">
                  {monthlyData.map((data: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-500 text-center font-medium">
                      {data.month.split(" ")[0].substring(0, 3)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Selling Medicines */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Top Selling Medicines
            </h3>
            {topMeds.length === 0 ? (
              <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                No sales data available
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {topMeds.map((medicine: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{medicine.medicine_name}</span>
                      <span className="text-slate-500">{medicine.total_quantity} units</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(medicine.total_quantity / (topMeds[0]?.total_quantity || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      ₹{Number(medicine.total_revenue).toFixed(2)}
                    </div>
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
                {dailySales.slice(0, 30).map((day: any, idx: number) => {
                  const formattedDate = day.date ? new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : day.date;
                  const maxSales = Math.max(...dailySales.map((d: any) => Number(d.sales || 0)));
                  const salesValue = Number(day.sales || 0);
                  const widthPercent = maxSales > 0 ? (salesValue / maxSales) * 100 : 0;
                  // Ensure minimum 5% width if there's any sales
                  const displayWidth = salesValue > 0 ? Math.max(widthPercent, 5) : 0;

                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-600 font-medium">{formattedDate}</div>
                      <div className="flex-1 bg-slate-200 rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-300"
                          style={{
                            width: `${displayWidth}%`,
                            minWidth: salesValue > 0 ? '40px' : '0'
                          }}
                        >
                          <span className="text-xs text-white font-medium">
                            ₹{salesValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-20 text-sm text-slate-600 text-right font-medium">
                        {day.transactions} orders
                      </div>
                    </div>
                  );
                })}
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
    </DashboardLayout >
  );
}
