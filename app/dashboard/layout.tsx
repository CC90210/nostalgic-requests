import Link from 'next/link';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F0F10] border-r border-[#2D2D2D] hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2D2D2D]">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Nostalgic
            </h1>
            <p className="text-gray-500 text-xs mt-1">DJ Request System</p>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem href="/dashboard" icon="??" label="Dashboard" />
          <NavItem href="/dashboard/new" icon="?" label="Create Event" />
          <NavItem href="/dashboard/live" icon="??" label="Live Dashboard" />
          <NavItem href="/dashboard/events" icon="??" label="Events" />
          <NavItem href="/dashboard/leads" icon="??" label="Leads" />
        </nav>

        {/* Tip */}
        <div className="p-4 border-t border-[#2D2D2D]">
          <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4">
            <p className="text-xs text-gray-400">
              ?? Share your QR code to start receiving song requests!
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#0F0F10] border-b border-[#2D2D2D] p-4 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Nostalgic
          </h1>
          <div className="flex gap-2">
            <Link href="/dashboard" className="p-2 hover:bg-[#1A1A1B] rounded-lg">??</Link>
            <Link href="/dashboard/new" className="p-2 hover:bg-[#1A1A1B] rounded-lg">?</Link>
            <Link href="/dashboard/live" className="p-2 hover:bg-[#1A1A1B] rounded-lg">??</Link>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-0 mt-16 md:mt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-[#1A1A1B] transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
