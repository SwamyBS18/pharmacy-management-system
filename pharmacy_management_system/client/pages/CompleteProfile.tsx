import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Phone, FileText, CreditCard } from "lucide-react";

export default function CompleteProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        address: "",
        phone: "",
        license_number: "",
        gst_number: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Validate required fields
            if (!formData.address || !formData.phone) {
                setError("Address and phone number are required");
                setLoading(false);
                return;
            }

            // Complete profile via API
            const { api } = await import("@/lib/api");
            await api.auth.completeProfile(formData);

            // Force redirect using window.location for reliability
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to complete profile. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Header />

            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-2xl">
                    {/* Card */}
                    <div className="rounded-2xl bg-white shadow-xl border border-slate-200 p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 mx-auto mb-4">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                                Complete Pharmacy Profile
                            </h1>
                            <p className="text-slate-600">
                                Add your pharmacy details to get started
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error Message */}
                            {error && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Address */}
                            <div>
                                <label
                                    htmlFor="address"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    <MapPin className="inline h-4 w-4 mr-1" />
                                    Pharmacy Address *
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter complete address"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    <Phone className="inline h-4 w-4 mr-1" />
                                    Phone Number *
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 1234567890"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    required
                                />
                            </div>

                            {/* License Number */}
                            <div>
                                <label
                                    htmlFor="license_number"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    <FileText className="inline h-4 w-4 mr-1" />
                                    License Number (Optional)
                                </label>
                                <input
                                    id="license_number"
                                    type="text"
                                    name="license_number"
                                    value={formData.license_number}
                                    onChange={handleChange}
                                    placeholder="Enter pharmacy license number"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* GST Number */}
                            <div>
                                <label
                                    htmlFor="gst_number"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    <CreditCard className="inline h-4 w-4 mr-1" />
                                    GST Number (Optional)
                                </label>
                                <input
                                    id="gst_number"
                                    type="text"
                                    name="gst_number"
                                    value={formData.gst_number}
                                    onChange={handleChange}
                                    placeholder="Enter GST number"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Completing Profile..." : "Complete Profile & Continue"}
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="mt-6 text-center text-sm text-slate-600">
                            * Required fields
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
