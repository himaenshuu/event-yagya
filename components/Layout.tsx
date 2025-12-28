import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Megaphone,
  Heart,
  Settings,
  LogOut,
  Info,
} from "lucide-react";
import { NotificationToggle } from "./NotificationToggle";

export const Layout: React.FC<{
  children: React.ReactNode;
  isAdmin: boolean;
  logout: () => void;
}> = ({ children, isAdmin, logout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Schedule", icon: Calendar, path: "/schedule" },
    { label: "Updates", icon: Megaphone, path: "/updates" },
    { label: "Donate", icon: Heart, path: "/donate" },
  ];

  if (isAdmin) {
    navItems.push({ label: "Admin", icon: Settings, path: "/admin/dashboard" });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:pl-64">
      {/* Mobile Header - Glassmorphism */}
      <header className="md:hidden sticky top-0 z-50 glass text-red-900 p-4 shadow-sm border-b border-white flex justify-between items-center animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
          <h1 className="text-xl font-bold tracking-tight">Community</h1>
        </div>
        <div className="flex items-center gap-1">
          <NotificationToggle />
          {isAdmin && (
            <button
              onClick={logout}
              className="p-2 hover:bg-red-50 rounded-full transition-colors active-pop"
              aria-label="Logout"
            >
              <LogOut size={20} className="text-red-700" />
            </button>
          )}
        </div>
      </header>

      {/* Desktop Sidebar - Premium Dark Red */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-red-950 text-white z-50 animate-slide-right shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8 hover:scale-105 transition-transform cursor-default origin-left">
            <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center shadow-lg font-bold text-lg">
              CF
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">
                Community Festival
              </h1>
              <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">
                Springfield Center
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl nav-item-transition active-pop group ${
                  isActive(item.path)
                    ? "bg-red-800 text-yellow-400 shadow-xl translate-x-1"
                    : "text-red-200 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon
                  size={20}
                  className={`${
                    isActive(item.path) ? "scale-110" : "group-hover:rotate-12"
                  } transition-transform`}
                />
                <span className="font-bold tracking-wide">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          {isAdmin ? (
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl bg-white/5 hover:bg-red-600 text-red-200 hover:text-white transition-all active-pop border border-white/5"
            >
              <LogOut size={20} />
              <span className="font-bold">Sign Out</span>
            </button>
          ) : (
            <div className="p-4 bg-red-900/40 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-2">
                Platform Support
              </p>
              <Link
                to="/admin/login"
                className="text-xs font-bold text-white hover:text-yellow-400 transition-colors"
                title="Admin Dashboard"
              >
                Admin Dashboard
              </Link>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-12 animate-fade-in overflow-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="hidden md:block mt-auto py-8 px-12 text-center border-t border-red-100/50">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-2xl p-6 border border-white/20 shadow-sm">
            <p className="text-sm text-red-900/70 font-medium">
              © {new Date().getFullYear()} Community Festival Organizing Team
            </p>
            <p className="text-xs text-red-800/50 mt-2">
              All rights reserved. May divine blessings be upon all.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation - Floating look */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 glass border border-white rounded-[2rem] shadow-2xl flex justify-around items-center h-16 px-4 z-50 animate-slide-up">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-75 ${
              isActive(item.path) ? "text-red-700 scale-110" : "text-gray-400"
            }`}
          >
            <item.icon
              size={22}
              className={isActive(item.path) ? "animate-bounce-short" : ""}
            />
          </Link>
        ))}
        {isAdmin && (
          <button
            onClick={logout}
            className="text-gray-400 p-2"
            aria-label="Logout"
          >
            <LogOut size={22} />
          </button>
        )}
      </nav>
    </div>
  );
};
