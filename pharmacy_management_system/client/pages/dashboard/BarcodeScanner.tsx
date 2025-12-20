import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Search, Camera, X } from "lucide-react";
import JsBarcode from "jsbarcode";

interface Medicine {
  id: number;
  medicine_name: string;
  manufacturer: string;
  price: number;
  stock: number;
  category: string;
  barcode: string;
  composition?: string;
  uses?: string;
  image_url?: string;
}

// Barcode Image Component
function BarcodeImage({ barcode }: { barcode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && barcode) {
      try {
        // Use CODE128 format - universal compatibility with all scanners
        // Better for mobile phone cameras and barcode scanners
        JsBarcode(canvasRef.current, barcode, {
          format: "CODE128",
          width: 2.5,
          height: 80,
          displayValue: true,
          margin: 10,
          fontSize: 16,
          background: "#ffffff",
          lineColor: "#000000",
          // High quality settings for better scanning
          valid: function(valid) {
            if (!valid) {
              console.warn("Invalid barcode:", barcode);
            }
          }
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [barcode]);

  return (
    <div className="inline-block bg-white p-3 rounded-lg border-2 border-slate-300 shadow-sm">
      <canvas
        ref={canvasRef}
        style={{ 
          imageRendering: "crisp-edges",
          maxWidth: "100%",
          height: "auto",
          minWidth: "200px"
        }}
      />
    </div>
  );
}

export default function BarcodeScanner() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount for keyboard scanning
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: medicine, isLoading, error, refetch } = useQuery<Medicine>({
    queryKey: ["medicine", scannedBarcode],
    queryFn: async () => {
      if (!scannedBarcode) return null;
      const response = await fetch(`/api/medicines/barcode/${scannedBarcode}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Medicine not found");
        }
        throw new Error("Failed to fetch medicine");
      }
      return response.json();
    },
    enabled: !!scannedBarcode,
  });

  const handleScan = () => {
    if (barcodeInput.trim()) {
      setScannedBarcode(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const handleClear = () => {
    setBarcodeInput("");
    setScannedBarcode(null);
    inputRef.current?.focus();
  };

  return (
    <DashboardLayout title="Barcode Scanner" subtitle="Scan or enter barcode to find medicine">
      <div className="space-y-6">
        {/* Scanner Input */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter or Scan Barcode
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scan barcode or type barcode number..."
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                  autoFocus
                />
                <Button
                  onClick={handleScan}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
                {scannedBarcode && (
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="px-6"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tip: Connect a barcode scanner and scan directly, or type the barcode and press Enter
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && scannedBarcode && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-center">
              <div className="text-slate-600">Searching for medicine...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && scannedBarcode && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="text-red-600 font-medium">
                {(error as Error).message || "Medicine not found"}
              </div>
            </div>
            <p className="text-sm text-red-600 mt-2">
              No medicine found with barcode: <strong>{scannedBarcode}</strong>
            </p>
          </div>
        )}

        {/* Medicine Details */}
        {medicine && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="flex gap-6">
                {/* Medicine Image */}
                <div className="flex-shrink-0">
                  {medicine.image_url ? (
                    <img
                      src={medicine.image_url}
                      alt={medicine.medicine_name}
                      className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                      <span className="text-sm text-slate-400">No Image</span>
                    </div>
                  )}
                </div>

                {/* Medicine Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {medicine.medicine_name}
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500">Barcode</label>
                      <div className="mt-2">
                        <BarcodeImage barcode={medicine.barcode} />
                        <p className="text-sm font-mono text-slate-600 mt-2">
                          {medicine.barcode}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Manufacturer</label>
                      <p className="text-lg text-slate-900">
                        {medicine.manufacturer || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Price</label>
                      <p className="text-lg font-semibold text-emerald-600">
                        ₹{Number(medicine.price || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Stock</label>
                      <p className="text-lg">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            medicine.stock > 100
                              ? "bg-emerald-100 text-emerald-700"
                              : medicine.stock > 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {medicine.stock || 0} units
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Category</label>
                      <p className="text-lg text-slate-900">
                        {medicine.category || "N/A"}
                      </p>
                    </div>
                  </div>

                  {medicine.composition && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-500">Composition</label>
                      <p className="text-sm text-slate-700 mt-1">{medicine.composition}</p>
                    </div>
                  )}

                  {medicine.uses && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-500">Uses</label>
                      <p className="text-sm text-slate-700 mt-1">{medicine.uses}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!scannedBarcode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">How to use the barcode scanner:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li>Connect a USB barcode scanner to your computer</li>
              <li>Click in the input field and scan the barcode</li>
              <li>Or manually type the barcode number and press Enter</li>
              <li>The medicine details will appear automatically after scanning</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

