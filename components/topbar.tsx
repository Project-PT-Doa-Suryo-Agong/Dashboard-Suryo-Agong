import React from 'react';
import { Menu } from 'lucide-react';

interface TopbarUser {
  name?: string | null;
  role?: string | null;
  avatar?: string;
}

interface TopbarProps {
  title?: string;
  user?: TopbarUser;
  onMenuClick?: () => void;
}

export default function Topbar({ title = 'Dashboard Overview', user, onMenuClick }: TopbarProps) {
  const name = user?.name?.trim() ?? '';
  const role = user?.role?.trim() ?? '';
  const displayName = name || 'Pengguna';
  const ROLE_LABELS: Record<string, string> = {
    "super-admin": "Super Admin",
    "Super Admin": "Super Admin",
    "developer": "Super Admin",
    "Developer": "Super Admin",
    "management": "Management & Strategy",
    "finance": "Finance & Administration",
    "hr": "HR & Operation",
    "produksi": "Produksi & QA",
    "logistik": "Logistics",
    "creative": "Creative",
    "office": "Office Support"
  };

  let displayRole = role || 'Tanpa role';
  if (ROLE_LABELS[displayRole]) {
    displayRole = ROLE_LABELS[displayRole];
  } else if (ROLE_LABELS[displayRole.toLowerCase()]) {
    displayRole = ROLE_LABELS[displayRole.toLowerCase()];
  }
  
  const avatar = user?.avatar;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-3 md:px-6 lg:px-8 p-10 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden inline-flex items-center justify-center h-9 md:h-10 w-9 md:w-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open sidebar menu"
        >
          <Menu size={16} />
        </button>
        <h2 className="text-sm md:text-lg lg:text-xl font-bold text-slate-800 truncate">{title}</h2>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 lg:gap-6 shrink-0">
        
        {/* User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right block">
            <p className="text-xs md:text-sm font-bold text-slate-900 leading-none">{displayName}</p>
            <p className="text-[10px] md:text-xs text-slate-500">{displayRole}</p>
          </div>
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-slate-200 text-slate-700 overflow-hidden flex items-center justify-center text-xs font-semibold">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name || 'User avatar'} className="h-full w-full object-cover" />
            ) : (
              <span>{initials || 'NA'}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
