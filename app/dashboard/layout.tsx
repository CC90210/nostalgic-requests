import Link from 'next/link';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F0F10] border-r border-[#2D2D2D] flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="p-6 border-b border-[#2D2D2D]">
          <Link href="/dashboard" className="block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Nostalgic
            </h1>
            <p className="text-gray-500 text-xs mt-1">DJ Request System</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink href="/dashboard" icon="??">
            Dashboard
          </NavLink>
          <NavLink href="/dashboard/new" icon="?">
            Create Event
          </NavLink>
          <NavLink href="/dashboard/live" icon="??">
            Live Dashboard
          </NavLink>
          <NavLink href="/dashboard/events" icon="??">
            Events
          </NavLink>
          <NavLink href="/dashboard/leads" icon="??">
            Leads
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D2D2D]">
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-3 border border-purple-500/20">
            <p className="text-xs text-gray-400">
              ?? Tip: Share your QR code to start receiving requests!
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0A0A0B]">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-[#1A1A1B] transition group"
    >
      <span className="text-lg group-hover:scale-110 transition">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
