import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function Users() {
  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Users" subtitle="Manage pharmacy staff">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading users...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Users" subtitle="Manage pharmacy staff">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading users. Please check your database connection.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Users" subtitle="Manage pharmacy staff">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              All Users ({(users || []).length})
            </h2>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!users || users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No users found. Add your first user to get started.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {user.role || "staff"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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
      </div>
    </DashboardLayout>
  );
}
