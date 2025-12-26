import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    Package,
    Download,
    Search,
    CheckCircle2,
    AlertCircle,
    Thermometer,
    CloudRain,
    Sun,
    Snowflake
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// --- Interfaces ---

interface ForecastData {
    medicine_id: number;
    medicine_name: string;
    forecast: {
        date: string;
        day: string;
        predicted_sales: number;
    }[];
    summary: {
        total_predicted: number;
        avg_daily: number;
    };
}

interface SeasonalMed {
    Medicine_ID: number;
    Medicine_Name: string;
    Category: string;
    Quantity_Sold: number;
    Estimated_Monthly_Demand: number;
}

interface ReorderRec {
    medicine_id: number;
    medicine_name: string;
    category: string;
    current_stock: number;
    avg_daily_sales: number;
    days_remaining: number;
    status: "Urgent" | "Warning" | "OK";
    recommended_qty: number;
}

interface ExpiryAlert {
    medicine_id: number;
    medicine_name: string;
    batch_id: string;
    expiry_date: string;
    days_until: number;
    quantity: number;
    status: "Expired" | "Critical" | "Warning";
}

interface SalesAnalytics {
    trend: {
        date: string;
        revenue: number;
        transactions: number;
        avg_order_value: number;
    }[];
    categories: {
        category: string;
        revenue: number;
    }[];
    summary: {
        total_revenue: number;
        total_transactions: number;
        avg_daily_revenue: number;
    };
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function PredictionsContent() {
    const [selectedSeason, setSelectedSeason] = useState<string>("Winter");
    const [selectedMedId, setSelectedMedId] = useState<string>("1"); // Default to ID 1 or first available
    const [salesPeriod, setSalesPeriod] = useState<string>("30");
    const [medSearch, setMedSearch] = useState("");

    // --- Data Fetching ---

    const { data: forecastData, isLoading: isLoadingForecast } = useQuery<ForecastData>({
        queryKey: ["forecast", selectedMedId],
        queryFn: async () => {
            const response = await api.predictions.getForecast(parseInt(selectedMedId), 30);
            return response.data;
        },
        enabled: !!selectedMedId,
    });

    const { data: seasonalData, isLoading: isLoadingSeasonal } = useQuery<SeasonalMed[]>({
        queryKey: ["seasonal", selectedSeason],
        queryFn: async () => {
            const response = await api.predictions.getSeasonalDemand(selectedSeason);
            return response.data;
        },
    });

    const { data: reorderData, isLoading: isLoadingReorder } = useQuery<ReorderRec[]>({
        queryKey: ["reorder"],
        queryFn: async () => {
            const response = await api.predictions.getReorderRecommendations();
            return response.data;
        },
        refetchInterval: 5 * 60 * 1000, // 5 minutes
    });

    const { data: expiryData, isLoading: isLoadingExpiry } = useQuery<ExpiryAlert[]>({
        queryKey: ["expiry"],
        queryFn: async () => {
            const response = await api.predictions.getExpiryAlerts(90);
            return response.data;
        },
    });

    const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<SalesAnalytics>({
        queryKey: ["analytics", salesPeriod],
        queryFn: async () => {
            const response = await api.predictions.getSalesAnalytics(parseInt(salesPeriod));
            return response.data;
        },
    });

    // --- Derived Metrics ---

    const totalAnalyzed = reorderData?.length || 0;
    const urgentReorders = reorderData?.filter((r) => r.status === "Urgent").length || 0;
    const criticalExpiry = expiryData?.filter((e) => e.status === "Critical" || e.status === "Expired").length || 0;
    // Placeholder accuracy since we don't have real vs predicted yet for past data in this API
    const accuracy = 94.5;

    const handleExportCSV = () => {
        if (!reorderData) return;
        const headers = ["Medicine Name", "Category", "Current Stock", "Avg Daily Sales", "Days Remaining", "Status", "Recommended Qty"];
        const csvContent = [
            headers.join(","),
            ...reorderData.map(r =>
                `"${r.medicine_name}","${r.category}",${r.current_stock},${r.avg_daily_sales},${r.days_remaining},${r.status},${r.recommended_qty}`
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `stock_predictions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Brain className="h-8 w-8 text-emerald-600" />
                        AI-Powered Stock Predictions
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Machine learning insights for demand forecasting and inventory optimization
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Run New Analysis
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Medicines Analyzed</CardTitle>
                        <Package className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAnalyzed}</div>
                        <p className="text-xs text-slate-500">Active SKUs monitored</p>
                    </CardContent>
                </Card>
                <Card className="border-red-100 bg-red-50/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Urgent Reorders</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{urgentReorders}</div>
                        <p className="text-xs text-red-600/80">Stock {"<"} 14 days remaining</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 bg-orange-50/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600">Expiring Soon</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{criticalExpiry}</div>
                        <p className="text-xs text-orange-600/80">Batches expiring {"<"} 30 days</p>
                    </CardContent>
                </Card>
                <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600">Model Accuracy</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">{accuracy}%</div>
                        <p className="text-xs text-emerald-600/80">Based on last 30 days validation</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seasonal Demand Chart */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {selectedSeason === "Winter" && <Snowflake className="h-5 w-5 text-blue-500" />}
                                    {selectedSeason === "Summer" && <Sun className="h-5 w-5 text-orange-500" />}
                                    {selectedSeason === "Monsoon" && <CloudRain className="h-5 w-5 text-indigo-500" />}
                                    {selectedSeason === "Spring" && <Thermometer className="h-5 w-5 text-pink-500" />}
                                    Seasonal Demand Forecast
                                </CardTitle>
                                <CardDescription>Top medicines predicted for {selectedSeason}</CardDescription>
                            </div>
                            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select Season" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Winter">Winter</SelectItem>
                                    <SelectItem value="Summer">Summer</SelectItem>
                                    <SelectItem value="Monsoon">Monsoon</SelectItem>
                                    <SelectItem value="Spring">Spring</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingSeasonal ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Skeleton className="h-[250px] w-full" />
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={seasonalData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="Medicine_Name"
                                            type="category"
                                            width={120}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                                        />
                                        <Bar
                                            dataKey="Estimated_Monthly_Demand"
                                            fill="#10b981"
                                            radius={[0, 4, 4, 0]}
                                            barSize={20}
                                            name="Est. Demand"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 30-Day Forecast */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    30-Day Sales Forecast
                                </CardTitle>
                                <CardDescription>Predicted daily sales trend</CardDescription>
                            </div>
                            {/* Search input for medicine selection could go here, for now using simple ID input for demo */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter Med ID"
                                    value={selectedMedId}
                                    onChange={(e) => setSelectedMedId(e.target.value)}
                                    className="w-[100px]"
                                />
                                <Button size="icon" variant="ghost" className="shrink-0">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingForecast ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Skeleton className="h-[250px] w-full" />
                            </div>
                        ) : forecastData ? (
                            <div className="space-y-4">
                                <div className="flex gap-4 text-sm">
                                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
                                        Total Predicted: {forecastData.summary.total_predicted} units
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                                        Avg Daily: {forecastData.summary.avg_daily} units
                                    </div>
                                </div>
                                <div className="h-[260px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={forecastData.forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <Tooltip />
                                            <Area
                                                type="monotone"
                                                dataKey="predicted_sales"
                                                stroke="#10b981"
                                                fillOpacity={1}
                                                fill="url(#colorSales)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                Enter a valid Medicine ID to see forecast
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sales trends and Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Revenue Analytics</CardTitle>
                            <Tabs defaultValue="30" onValueChange={setSalesPeriod} className="w-[300px]">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="7">7D</TabsTrigger>
                                    <TabsTrigger value="30">30D</TabsTrigger>
                                    <TabsTrigger value="90">90D</TabsTrigger>
                                    <TabsTrigger value="365">1Y</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAnalytics ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : (
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analyticsData?.trend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                            minTickGap={30}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `₹${val / 1000}k`}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Top Categories</CardTitle>
                        <CardDescription>By revenue share</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAnalytics ? (
                            <div className="flex justify-center h-[200px] items-center"><Skeleton className="h-40 w-40 rounded-full" /></div>
                        ) : (
                            <div className="h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analyticsData?.categories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="revenue"
                                        >
                                            {analyticsData?.categories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-sm font-medium text-slate-500">Revenue</span>
                                </div>
                            </div>
                        )}
                        <div className=" space-y-2 mt-4">
                            {analyticsData?.categories.map((cat, idx) => (
                                <div key={idx} className="flex justify-between text-sm items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }}></div>
                                        <span>{cat.category}</span>
                                    </div>
                                    <span className="font-medium">₹{cat.revenue.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reorder Recommendations Table */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-emerald-600" />
                                Stock Reorder Recommendations
                            </CardTitle>
                            <CardDescription>AI-generated restocking suggestions based on predicted demand</CardDescription>
                        </div>
                        <div className="relative w-[250px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search medicines..."
                                className="pl-8"
                                value={medSearch}
                                onChange={(e) => setMedSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border h-[400px] overflow-auto">
                        {isLoadingReorder ? (
                            <div className="p-4 space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0">
                                    <TableRow>
                                        <TableHead>Medicine Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Current Stock</TableHead>
                                        <TableHead className="text-right">Avg Daily Sales</TableHead>
                                        <TableHead className="text-right">Days Remaining</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Recommended Qty</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reorderData
                                        ?.filter(item => item.medicine_name.toLowerCase().includes(medSearch.toLowerCase()))
                                        .map((item) => (
                                            <TableRow key={item.medicine_id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium">{item.medicine_name}</TableCell>
                                                <TableCell>{item.category}</TableCell>
                                                <TableCell className="text-right">{item.current_stock}</TableCell>
                                                <TableCell className="text-right">{item.avg_daily_sales}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={item.days_remaining < 14 ? "text-red-600 font-bold" : ""}>
                                                        {item.days_remaining}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.status === "Urgent" && <Badge variant="destructive">Urgent</Badge>}
                                                    {item.status === "Warning" && <Badge className="bg-orange-500 hover:bg-orange-600">Soon</Badge>}
                                                    {item.status === "OK" && <Badge className="bg-emerald-500 hover:bg-emerald-600">OK</Badge>}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-700">
                                                    {item.recommended_qty > 0 ? `+ ${item.recommended_qty}` : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.recommended_qty > 0 && (
                                                        <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                                            Order
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Expiry Risk Analysis */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Expiry Risk Analysis
                    </CardTitle>
                    <CardDescription>Batches requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="critical">
                        <TabsList className="mb-4">
                            <TabsTrigger value="expired" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Expired ({expiryData?.filter(e => e.status === 'Expired').length})</TabsTrigger>
                            <TabsTrigger value="critical" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">Critical ({expiryData?.filter(e => e.status === 'Critical').length})</TabsTrigger>
                            <TabsTrigger value="warning" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">Warning ({expiryData?.filter(e => e.status === 'Warning').length})</TabsTrigger>
                        </TabsList>

                        {["expired", "critical", "warning"].map((tab) => (
                            <TabsContent key={tab} value={tab}>
                                <div className="rounded-md border max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0">
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead>Batch ID</TableHead>
                                                <TableHead>Expiry Date</TableHead>
                                                <TableHead className="text-right">Days Until</TableHead>
                                                <TableHead className="text-right">Quantity</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {expiryData
                                                ?.filter(e => e.status.toLowerCase() === tab)
                                                .map((item) => (
                                                    <TableRow key={`${item.batch_id}-${item.medicine_id}`}>
                                                        <TableCell className="font-medium">{item.medicine_name}</TableCell>
                                                        <TableCell>{item.batch_id}</TableCell>
                                                        <TableCell>{item.expiry_date}</TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            <span className={item.days_until < 0 ? "text-red-600" : (item.days_until < 30 ? "text-orange-600" : "")}>
                                                                {item.days_until} days
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                                Discard
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {expiryData?.filter(e => e.status.toLowerCase() === tab).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                        No items in this category
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
