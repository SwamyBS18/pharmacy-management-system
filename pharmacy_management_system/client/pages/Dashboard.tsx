import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Dashboard Coming Soon
            </h1>

            <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
              The comprehensive pharmacy management dashboard with analytics,
              inventory tracking, and sales reports is being prepared. Continue
              customizing to add more pages and features.
            </p>

            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">
                🎯 This is a placeholder page. Keep building out:
              </p>
              <ul className="text-sm text-slate-600 space-y-2 inline-block text-left">
                <li>✓ Dashboard with key metrics</li>
                <li>✓ Medicines management</li>
                <li>✓ Inventory tracking</li>
                <li>✓ Customer management</li>
                <li>✓ Sales & invoicing</li>
                <li>✓ Supplier management</li>
              </ul>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg">
                  Back to Home
                </Button>
              </Link>
              <a href="#" className="inline-block">
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 font-semibold px-8 py-3 rounded-lg hover:bg-slate-100"
                >
                  View Docs
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
