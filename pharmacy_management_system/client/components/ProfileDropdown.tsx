/**
 * Profile Dropdown Component
 * Displays user info and provides profile actions
 */
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, LogOut, Key, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600">
                    <User className="h-5 w-5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role}</p>
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-600 mt-1">{user.email}</p>
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            {user.role === "ADMIN" ? "Administrator" : "Employee"}
                        </div>
                    </div>

                    {/* Pharmacy Info */}
                    {user.pharmacy_name && (
                        <div className="px-4 py-2 border-b border-slate-200">
                            <p className="text-xs text-slate-500">Pharmacy</p>
                            <p className="text-sm font-medium text-slate-900">{user.pharmacy_name}</p>
                        </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-1">
                        <Link
                            to="/dashboard/settings"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                            onClick={() => setIsOpen(false)}
                        >
                            <User className="h-4 w-4" />
                            View Profile
                        </Link>

                        <Link
                            to="/dashboard/change-password"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                            onClick={() => setIsOpen(false)}
                        >
                            <Key className="h-4 w-4" />
                            Change Password
                        </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-200 pt-1">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
