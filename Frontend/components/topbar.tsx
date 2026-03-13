import React from 'react';
import { Menu } from 'lucide-react';

interface TopbarUser {
  name: string;
  role: string;
  avatar?: string;
}

interface TopbarProps {
  title?: string;
  user?: TopbarUser;
  onMenuClick?: () => void;
}

const DEFAULT_USER: TopbarUser = {
  name: 'Alex Rivera',
  role: 'Admin Account',
};

export default function Topbar({ title = 'Dashboard Overview', user, onMenuClick }: TopbarProps) {
  const { name, role, avatar } = { ...DEFAULT_USER, ...user };
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-3 md:px-6 lg:px-8 p-10 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden inline-flex items-center justify-center h-9 md:h-10 w-9 md:w-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Open sidebar menu"
        >
          <Menu size={16} />
        </button>
        <h2 className="text-sm md:text-lg lg:text-xl font-bold text-slate-800 truncate">{title}</h2>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 lg:gap-6 flex-shrink-0">
        
        {/* User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs md:text-sm font-bold text-slate-900 leading-none">{name}</p>
            <p className="text-[10px] md:text-xs text-slate-500">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}