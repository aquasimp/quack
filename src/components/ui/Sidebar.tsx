'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home, MessageSquare, User, Brain, Search,
  BarChart3, LogOut, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['student', 'faculty', 'tpo', 'recruiter'] },
  { href: '/dashboard/communicate', icon: MessageSquare, label: 'Communication', roles: ['student', 'faculty', 'tpo'] },
  { href: '/dashboard/profile', icon: User, label: 'My Profile', roles: ['student'] },
  { href: '/dashboard/career-ai', icon: Brain, label: 'Career AI', roles: ['student'] },
  { href: '/dashboard/recruiter', icon: Search, label: 'Search Talent', roles: ['recruiter', 'tpo'] },
  { href: '/dashboard/tpo', icon: BarChart3, label: 'TPO Analytics', roles: ['tpo', 'faculty'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(item =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-full glass flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{ borderRadius: 0, borderRight: '1px solid var(--glass-border)' }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{ background: 'var(--gradient-primary)' }}>
          Q
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-gradient">Qwack</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {filteredItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              style={isActive ? { boxShadow: 'var(--glow-primary)' } : {}}
            >
              <item.icon size={20} className={isActive ? 'text-sky-400' : 'group-hover:text-sky-400'} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* E2E Badge */}
      {!collapsed && (
        <div className="px-4 py-2">
          <div className="e2e-badge justify-center w-full">
            <Shield size={12} />
            E2E Encrypted
          </div>
        </div>
      )}

      {/* User & Actions */}
      <div className="p-3 border-t border-white/5">
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--gradient-secondary)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-icon flex-1"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button onClick={logout} className="btn-icon flex-1" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
