'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="glass-sm sticky top-0 z-40 flex items-center justify-between px-6 py-3"
      style={{ borderRadius: 0, borderBottom: '1px solid var(--glass-border)' }}>
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search anything..."
            className="input pl-10 py-2 text-sm"
            style={{ background: 'rgba(15, 23, 42, 0.3)' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-icon relative">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--accent-danger)' }} />
        </button>

        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--surface)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--gradient-primary)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
