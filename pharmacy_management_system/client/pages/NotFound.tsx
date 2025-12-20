import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-lg">
          <div className="mb-8">
            <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-4">
              404
            </div>
            <svg
              className="mx-auto h-32 w-32 text-slate-300 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Oops! Page Not Found
          </h1>

          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            The page you're looking for doesn't exist. It might have been moved
            or deleted. Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="h-11 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all">
                Return to Home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="outline"
                className="h-11 px-8 border-slate-300 hover:bg-slate-100 font-semibold rounded-lg"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Error code: <span className="font-mono">404</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
