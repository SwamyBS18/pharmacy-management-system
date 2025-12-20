import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const [settings, setSettings] = useState({
    pharmacyName: "PharmaCare",
    address: "123 Medical Street",
    phone: "+1-800-555-0123",
    email: "admin@pharmacy.com",
    taxId: "TAX123456",
    currency: "USD",
    language: "English",
  });

  const handleChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage pharmacy settings">
      <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="space-y-6">
          {/* Pharmacy Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Pharmacy Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Pharmacy Name
                </label>
                <input
                  type="text"
                  value={settings.pharmacyName}
                  onChange={(e) => handleChange("pharmacyName", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Tax ID
                </label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={(e) => handleChange("taxId", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              System Settings
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>INR</option>
                    <option>GBP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-slate-200 pt-6 flex gap-3">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
