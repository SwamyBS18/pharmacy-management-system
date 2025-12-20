import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600">
              <svg
                className="h-6 w-6 text-white"
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
            <span className="text-xl text-slate-900">PharmaCare</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Home
            </Link>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Benefits
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              About
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-emerald-600 font-medium hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-slate-900" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t border-slate-200 pb-4 md:hidden">
            <nav className="flex flex-col gap-3 pt-4">
              <Link
                to="/"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <a
                href="#features"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                Benefits
              </a>
              <a
                href="#about"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                About
              </a>
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" className="flex-1">
                  <Button className="w-full bg-emerald-600 font-medium hover:bg-emerald-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
