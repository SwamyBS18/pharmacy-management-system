import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PharmacySettings {
  pharmacy_name: string;
  address: string;
  phone: string;
  email: string;
  license_number: string;
  gst_number: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PharmacySettings>({
    pharmacy_name: "",
    address: "",
    phone: "",
    email: "",
    license_number: "",
    gst_number: "",
  });
  const [originalSettings, setOriginalSettings] = useState<PharmacySettings>({
    pharmacy_name: "",
    address: "",
    phone: "",
    email: "",
    license_number: "",
    gst_number: "",
  });

  useEffect(() => {
    fetchPharmacyProfile();
  }, []);

  const fetchPharmacyProfile = async () => {
    try {
      setLoading(true);
      const response = await api.pharmacy.getProfile();
      const data = response.data;

      const profileData: PharmacySettings = {
        pharmacy_name: data.pharmacy_name || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        license_number: data.license_number || "",
        gst_number: data.gst_number || "",
      };

      setSettings(profileData);
      setOriginalSettings(profileData);
    } catch (error: any) {
      console.error("Error fetching pharmacy profile:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load pharmacy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PharmacySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!settings.pharmacy_name.trim()) {
        toast({
          title: "Validation Error",
          description: "Pharmacy name is required",
          variant: "destructive",
        });
        return;
      }

      if (!settings.phone.trim()) {
        toast({
          title: "Validation Error",
          description: "Phone number is required",
          variant: "destructive",
        });
        return;
      }

      await api.pharmacy.updateProfile(settings);

      setOriginalSettings(settings);

      toast({
        title: "Success",
        description: "Pharmacy settings updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving pharmacy settings:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save pharmacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    toast({
      title: "Cancelled",
      description: "Changes have been discarded",
    });
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <DashboardLayout title="Settings" subtitle="Manage pharmacy settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

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
                  Pharmacy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.pharmacy_name}
                  onChange={(e) => handleChange("pharmacy_name", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
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
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
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
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50"
                    disabled
                    title="Email cannot be changed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={settings.license_number}
                    onChange={(e) => handleChange("license_number", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={settings.gst_number}
                    onChange={(e) => handleChange("gst_number", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-slate-200 pt-6 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={saving || !hasChanges}
              variant="outline"
              className="border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
