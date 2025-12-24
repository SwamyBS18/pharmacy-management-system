// import DashboardLayout from "@/components/DashboardLayout";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";
// import { useState } from "react";

// interface Order {
//   id: number;
//   doctor_name: string;
//   doctor_id: string;
//   contact: string;
//   email: string;
//   drugs: string;
//   quantity: number;
//   total: number;
//   status: string;
//   order_date: string;
//   created_at: string;
// }

// export default function Orders() {
//   const [statusFilter, setStatusFilter] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 50;

//   const queryParams = new URLSearchParams();
//   if (statusFilter) queryParams.append("status", statusFilter);
//   queryParams.append("page", currentPage.toString());
//   queryParams.append("limit", itemsPerPage.toString());

//   const { data, isLoading, error, refetch } = useQuery<{
//     data: Order[];
//     pagination: {
//       page: number;
//       limit: number;
//       total: number;
//       totalPages: number;
//     };
//   }>({
//     queryKey: ["orders", statusFilter, currentPage],
//     queryFn: async () => {
//       const url = `/api/orders?${queryParams.toString()}`;
//       const response = await fetch(url);
//       if (!response.ok) throw new Error("Failed to fetch orders");
//       return response.json();
//     },
//   });

//   const orders = data?.data || [];
//   const pagination = data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

//   const handleStatusChange = async (orderId: number, newStatus: string) => {
//     try {
//       const response = await fetch(`/api/orders/${orderId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: newStatus }),
//       });
//       if (response.ok) {
//         refetch();
//       }
//     } catch (error) {
//       console.error("Error updating order status:", error);
//     }
//   };

//   if (isLoading) {
//     return (
//       <DashboardLayout title="Doctor Orders" subtitle="Manage all doctor orders">
//         <div className="flex items-center justify-center h-64">
//           <div className="text-slate-600">Loading orders...</div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (error) {
//     return (
//       <DashboardLayout title="Doctor Orders" subtitle="Manage all doctor orders">
//         <div className="flex items-center justify-center h-64">
//           <div className="text-red-600">Error loading orders. Please check your database connection.</div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout title="Doctor Orders" subtitle="Manage all doctor orders">
//       <div className="space-y-6">
//         {/* Header with Filters */}
//         <div className="flex justify-between items-center flex-wrap gap-4">
//           <div>
//             <h2 className="text-xl font-semibold text-slate-900">
//               All Orders ({pagination.total.toLocaleString()})
//             </h2>
//             <p className="text-sm text-slate-500 mt-1">
//               Showing {orders.length} of {pagination.total.toLocaleString()} orders
//             </p>
//           </div>
//           <div className="flex gap-4">
//             <select
//               value={statusFilter}
//               onChange={(e) => {
//                 setStatusFilter(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
//             >
//               <option value="">All Status</option>
//               <option value="pending">Pending</option>
//               <option value="processing">Processing</option>
//               <option value="completed">Completed</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//             <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
//               <Plus className="h-4 w-4 mr-2" />
//               New Order
//             </Button>
//           </div>
//         </div>

//         {/* Orders Table */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-50 border-b border-slate-200">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Doctor Name
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Contact
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Doctor ID
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Email
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Drugs
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Quantity
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Total
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-200">
//                 {orders.length === 0 ? (
//                   <tr>
//                     <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
//                       No orders found. {statusFilter && "Try selecting a different status."}
//                     </td>
//                   </tr>
//                 ) : (
//                   orders.map((order) => (
//                     <tr key={order.id} className="hover:bg-slate-50 transition">
//                       <td className="px-6 py-4 text-sm font-medium text-slate-900">
//                         {order.doctor_name}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600">
//                         {order.contact || "N/A"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600">
//                         {order.doctor_id || "N/A"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600">
//                         {order.email || "N/A"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
//                         {order.drugs || "N/A"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600">
//                         {order.quantity || 0}
//                       </td>
//                       <td className="px-6 py-4 text-sm font-semibold text-slate-900">
//                         ₹{Number(order.total || 0).toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-600">
//                         {order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}
//                       </td>
//                       <td className="px-6 py-4 text-sm">
//                         <select
//                           value={order.status}
//                           onChange={(e) => handleStatusChange(order.id, e.target.value)}
//                           className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${
//                             order.status === "completed"
//                               ? "bg-emerald-100 text-emerald-700"
//                               : order.status === "processing"
//                                 ? "bg-blue-100 text-blue-700"
//                                 : order.status === "cancelled"
//                                   ? "bg-red-100 text-red-700"
//                                   : "bg-yellow-100 text-yellow-700"
//                           }`}
//                         >
//                           <option value="pending">Pending</option>
//                           <option value="processing">Processing</option>
//                           <option value="completed">Completed</option>
//                           <option value="cancelled">Cancelled</option>
//                         </select>
//                       </td>
//                       <td className="px-6 py-4 text-sm">
//                         <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1">
//                           View
//                         </Button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }
