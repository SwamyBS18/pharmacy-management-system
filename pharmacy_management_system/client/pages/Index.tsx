import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import {
  Pill,
  BarChart3,
  Users,
  Package,
  FileText,
  ShoppingCart,
  ArrowRight,
  Check,
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Package,
      title: "Inventory Management",
      description:
        "Track stock levels in real-time, get alerts for low stock and expiring medicines",
    },
    {
      icon: Pill,
      title: "Medicine Management",
      description:
        "Manage medicines with details like manufacturer, expiry date, pricing and categories",
    },
    {
      icon: Users,
      title: "Customer Profiles",
      description:
        "Maintain customer records, track purchase history and manage prescriptions",
    },
    {
      icon: FileText,
      title: "Prescription Handling",
      description:
        "Upload and associate prescriptions with customers, validate for sales",
    },
    {
      icon: ShoppingCart,
      title: "Sales Management",
      description:
        "Process sales efficiently, generate invoices and track daily/weekly/monthly reports",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "View comprehensive reports and sales trends with interactive charts",
    },
  ];

  const benefits = [
    "Secure JWT authentication with role-based access control",
    "Manage multiple pharmacy branches from one platform",
    "Supplier management and purchase tracking",
    "Real-time inventory alerts and expiry notifications",
    "Generate professional invoices and receipts",
    "Mobile-responsive design for on-the-go management",
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 sm:pt-32 sm:pb-40 lg:pt-40 lg:pb-48">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50" />
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-gradient-to-tr from-teal-200 to-blue-200 blur-3xl opacity-20" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Hero Content */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Modern Pharmacy Management
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
                Manage Your Pharmacy with Ease
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                PharmaCare is a comprehensive, full-stack Pharmacy Management
                System built for modern pharmacies. Manage medicines, inventory,
                customers, prescriptions, and sales all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/signup">
                  <Button className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="h-12 px-8 border-slate-300 hover:bg-slate-50 font-semibold rounded-lg"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                ✓ 7-day free trial • No credit card required • Full feature
                access
              </p>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 blur-2xl opacity-20"></div>
                <div className="relative rounded-2xl bg-white p-8 shadow-2xl border border-slate-100">
                  <div className="space-y-4">
                    <div className="h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      PharmaCare Dashboard
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-50 p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          1,234
                        </div>
                        <div className="text-xs text-slate-600">Medicines</div>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          856
                        </div>
                        <div className="text-xs text-slate-600">Customers</div>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          $45.2K
                        </div>
                        <div className="text-xs text-slate-600">
                          Monthly Sales
                        </div>
                      </div>
                      <div className="rounded-lg bg-orange-50 p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          12
                        </div>
                        <div className="text-xs text-slate-600">Suppliers</div>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-slate-200 pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600">
                          Stock alert: 5 medicines
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <span className="text-slate-600">
                          Expiring soon: 2 medicines
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 lg:py-36 bg-slate-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Powerful Features for Modern Pharmacies
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage your pharmacy efficiently in one
              comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-2xl bg-white p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-emerald-200"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 mb-4 group-hover:from-emerald-200 group-hover:to-teal-200 transition-colors">
                      <Icon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 sm:py-28 lg:py-36 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left Side */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Why Choose PharmaCare?
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Built with modern pharmacy operations in mind. PharmaCare
                provides everything you need to run your pharmacy efficiently,
                securely, and profitably.
              </p>

              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link to="/signup">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 border border-blue-200">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  500+
                </div>
                <p className="text-blue-900 font-medium">Active Pharmacies</p>
                <p className="text-blue-700 text-sm mt-2">
                  Trusted by pharmacies nationwide
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 border border-emerald-200">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  99.9%
                </div>
                <p className="text-emerald-900 font-medium">Uptime Guarantee</p>
                <p className="text-emerald-700 text-sm mt-2">
                  Reliable service you can depend on
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-8 border border-purple-200">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  10M+
                </div>
                <p className="text-purple-900 font-medium">
                  Transactions/Month
                </p>
                <p className="text-purple-700 text-sm mt-2">
                  Secure, scalable infrastructure
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 p-8 border border-orange-200">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  24/7
                </div>
                <p className="text-orange-900 font-medium">Support</p>
                <p className="text-orange-700 text-sm mt-2">
                  Expert team always ready to help
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600" />
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-white blur-3xl opacity-10" />
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-white blur-3xl opacity-10" />

        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Transform Your Pharmacy?
            </h2>
            <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
              Join hundreds of pharmacies using PharmaCare to streamline
              operations and improve customer service
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button className="h-12 px-8 bg-white text-emerald-600 hover:bg-emerald-50 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="h-12 px-8 border-white text-white hover:bg-white/10 font-semibold rounded-lg"
                >
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="hover:text-white transition">
                    Benefits
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#about" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Email us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m0 0h6m0-6a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="font-bold text-white">PharmaCare</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2024 PharmaCare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
