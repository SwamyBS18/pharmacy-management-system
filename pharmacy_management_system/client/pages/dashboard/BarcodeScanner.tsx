import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Search, Camera, X, Video, Keyboard, AlertCircle, Plus, Trash2, ShoppingCart, Receipt } from "lucide-react";
import JsBarcode from "jsbarcode";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  batch_id?: string;
  expiry_date?: string;
  is_expired?: boolean;
}

interface CartItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  price: number;
  quantity: number;
  unit_price: number;
  stock: number; // For validation
}

// Barcode Image Component
function BarcodeImage({ barcode }: { barcode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && barcode) {
      try {
        JsBarcode(canvasRef.current, barcode, {
          format: "CODE128",
          width: 2.5,
          height: 80,
          displayValue: true,
          margin: 10,
          fontSize: 16,
          background: "#ffffff",
          lineColor: "#000000",
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
  const [scanMode, setScanMode] = useState<"usb" | "webcam">("usb");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Cart State
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (medicine: Medicine) => {
    if (medicine.stock <= 0) {
      alert("This medicine is out of stock!");
      return;
    }
    if (medicine.is_expired) {
      if (!confirm("This batch is EXPIRED. Are you sure you want to add it?")) return;
    }

    const existingItem = cart.find((item) => item.medicine_id === medicine.id);
    if (existingItem) {
      if (existingItem.quantity >= medicine.stock) {
        alert("Not enough stock available!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.medicine_id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: Date.now(),
          medicine_id: medicine.id,
          medicine_name: medicine.medicine_name,
          price: Number(medicine.price || 0),
          quantity: 1,
          unit_price: Number(medicine.price || 0),
          stock: medicine.stock
        },
      ]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const item = cart.find(i => i.id === id);
    if (item && quantity > item.stock) {
      alert("Not enough stock available!");
      return;
    }
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleCheckout = () => {
    navigate("/dashboard/pos", { state: { cart } });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
          setSelectedCamera(devices[0].id);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras:", err);
      });
  }, []);

  // Focus input on mount for USB scanning
  useEffect(() => {
    if (scanMode === "usb") {
      inputRef.current?.focus();
    }
  }, [scanMode]);

  const { data: medicine, isLoading, error } = useQuery<Medicine>({
    queryKey: ["barcode-lookup", scannedBarcode],
    queryFn: async () => {
      if (!scannedBarcode) return null;

      // Try inventory barcode lookup first (for batch barcodes)
      try {
        const invResponse = await fetch(`/api/inventory/barcode/${scannedBarcode}`);
        if (invResponse.ok) {
          const invData = await invResponse.json();
          // Convert inventory data to medicine format
          return {
            id: invData.medicine_id,
            medicine_name: invData.medicine_name,
            manufacturer: invData.manufacturer,
            price: invData.price || invData.medicine_price,
            stock: invData.quantity,
            category: invData.category,
            barcode: invData.batch_barcode || scannedBarcode,
            composition: "",
            uses: "",
            batch_id: invData.batch_id,
            expiry_date: invData.expiry_date,
            is_expired: invData.is_expired,
          };
        }
      } catch (err) {
        console.log("Not a batch barcode, trying medicine barcode...");
      }

      // Try medicine barcode lookup
      const response = await fetch(`/api/medicines/barcode/${scannedBarcode}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Medicine or batch not found");
        }
        throw new Error("Failed to fetch medicine");
      }
      return response.json();
    },
    enabled: !!scannedBarcode,
  });

  const startWebcamScanning = async () => {
    if (!selectedCamera) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader", {
        verbose: false,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ]
      });
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 2.0,
        },
        (decodedText) => {
          console.log("Scanned:", decodedText);
          setScannedBarcode(decodedText);
          stopWebcamScanning();
        },
        (errorMessage) => {
          // Silently ignore scanning errors
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error("Error starting camera:", err);
      alert("Failed to start camera. Please check permissions.");
    }
  };

  const stopWebcamScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
    }
  };

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
    if (scanMode === "usb") {
      inputRef.current?.focus();
    }
  };

  const handleModeChange = (mode: "usb" | "webcam") => {
    setScanMode(mode);
    if (mode === "usb") {
      stopWebcamScanning();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcamScanning();
    };
  }, []);

  return (
    <DashboardLayout title="Barcode Scanner" subtitle="Scan or enter barcode to find medicine">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scan Mode Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Select Scanning Method</h3>
            <div className="flex gap-4">
              <Button
                onClick={() => handleModeChange("usb")}
                variant={scanMode === "usb" ? "default" : "outline"}
                className={scanMode === "usb" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                <Keyboard className="h-5 w-5 mr-2" />
                USB Scanner / Manual Input
              </Button>
              <Button
                onClick={() => handleModeChange("webcam")}
                variant={scanMode === "webcam" ? "default" : "outline"}
                className={scanMode === "webcam" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                <Video className="h-5 w-5 mr-2" />
                Webcam Scanner
              </Button>
            </div>
          </div>

          {/* USB Scanner Input */}
          {scanMode === "usb" && (
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
                    Tip: Connect a USB barcode scanner and scan directly, or type the barcode and press Enter
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Webcam Scanner */}
          {scanMode === "webcam" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Select Camera
                  </label>
                  <div className="flex gap-2">
                    {!isCameraActive ? (
                      <Button
                        onClick={startWebcamScanning}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={!selectedCamera}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button
                        onClick={stopWebcamScanning}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Stop Camera
                      </Button>
                    )}
                  </div>
                </div>

                <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={isCameraActive}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((camera) => (
                      <SelectItem key={camera.id} value={camera.id}>
                        {camera.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div id="qr-reader" className="w-full max-w-md mx-auto"></div>

                {scannedBarcode && (
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Clear and Scan Again
                  </Button>
                )}
              </div>
            </div>
          )}

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

                    {/* Batch & Expiry Alert */}
                    {medicine.batch_id && (
                      <div className={`mb-4 p-3 rounded-lg border ${medicine.is_expired
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                        <div className="flex items-center gap-2 font-semibold">
                          {medicine.is_expired ? (
                            <>
                              <AlertCircle className="h-5 w-5" />
                              <span>EXPIRED BATCH DETECTED</span>
                            </>
                          ) : (
                            <span>Batch Found</span>
                          )}
                        </div>
                        <div className="mt-1 text-sm grid grid-cols-2 gap-4">
                          <div>Batch ID: <strong>{medicine.batch_id}</strong></div>
                          <div>Expiry: <strong>{medicine.expiry_date}</strong></div>
                        </div>
                      </div>
                    )}

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
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${medicine.stock > 100
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

                    <div className="mt-6 flex justify-end">
                      <Button
                        size="lg"
                        onClick={() => medicine && addToCart(medicine)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={medicine.stock <= 0}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add to Cart
                      </Button>
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
                <li><strong>USB Scanner:</strong> Connect a USB barcode scanner, click in the input field, and scan</li>
                <li><strong>Webcam:</strong> Select your camera from the dropdown and click "Start Camera"</li>
                <li><strong>Manual:</strong> Type the barcode number and press Enter</li>
                <li>Medicine details will appear automatically after scanning</li>
              </ul>
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </h3>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-red-600 h-8">
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-3 mb-6 max-h-[500px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No items scanned yet.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.medicine_name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center text-xs hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="text-xs text-slate-600 w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center text-xs hover:bg-slate-50"
                        >
                          +
                        </button>
                        <span className="text-xs font-semibold text-emerald-600 ml-auto">
                          ₹{(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1 ml-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Total Amount:</span>
                  <span className="text-lg font-bold text-emerald-600">₹{cartTotal.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-medium"
                  onClick={handleCheckout}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
