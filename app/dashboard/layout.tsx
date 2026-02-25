"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  PlusCircle,
  Radio,
  CalendarDays,
  Users,
  LogOut,
  Music,
  Settings,
  Disc,
  Home,
  ExternalLink
} from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/"; // Redirect to homepage instead of login
  };

  const displayName = user?.user_metadata?.dj_name || user?.user_metadata?.full_name || profile?.dj_name || user?.email?.split("@")[0] || "DJ";
  const displayEmail = user?.email || "";
  const profileImage = user?.user_metadata?.profile_image_url || profile?.profile_image_url || null;

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/new", icon: PlusCircle, label: "Create Event" },
    { href: "/dashboard/live", icon: Radio, label: "Live Requests" },
    { href: "/dashboard/events", icon: CalendarDays, label: "My Events" },
    { href: "/dashboard/leads", icon: Users, label: "Leads" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F0F10] border-r border-[#2D2D2D] hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2D2D2D]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg shadow-purple-500/20">
              <Image src="/logo.png" alt="Nostalgic Requests" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Nostalgic
              </h1>
              <p className="text-gray-500 text-xs">DJ Requests</p>
            </div>
          </Link>
        </div>

        {/* DJ Profile Card */}
        <div className="p-4 border-b border-[#2D2D2D]">
          <Link href="/dashboard/settings" className="block bg-[#1A1A1B] hover:bg-[#252526] rounded-xl p-3 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{displayName}</p>
                <p className="text-gray-500 text-xs truncate">{displayEmail}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-[#1A1A1B]"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to Website Link */}
        <div className="p-4 border-t border-[#2D2D2D]">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">Back to Website</span>
          </Link>
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t border-[#2D2D2D]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#0F0F10] border-b border-[#2D2D2D] p-4 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-white/10">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-white truncate max-w-[120px]">{displayName}</span>
          </div>
          <div className="flex gap-1">
            {/* Home button to main website */}
            <Link
              href="/"
              className="p-2 rounded-lg text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 transition-all"
              title="Back to Website"
            >
              <Home className="w-5 h-5" />
            </Link>
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-lg transition-all ${isActive ? "bg-purple-600/20 text-purple-400" : "text-gray-400 hover:bg-[#1A1A1B]"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
            <Link
              href="/dashboard/settings"
              className={`p-2 rounded-lg transition-all ${pathname === "/dashboard/settings" ? "bg-purple-600/20 text-purple-400" : "text-gray-400 hover:bg-[#1A1A1B]"
                }`}
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 mt-16 md:mt-0 overflow-auto">
        <ErrorBoundary><ConnectionStatus />{children}</ErrorBoundary>
      </main>
    </div>
  );
}
