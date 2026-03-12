import React from 'react';
import { Search } from 'lucide-react';

interface TopbarUser {
  name: string;
  role: string;
  avatar?: string;
}

interface TopbarProps {
  title?: string;
  user?: TopbarUser;
}

const DEFAULT_USER: TopbarUser = {
  name: 'Alex Rivera',
  role: 'Admin Account',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM9wJkevBBls1AOi6ZGO65_NQYgES4z8HRq9bZCxtXmJjxOoumVDrLz9JyIHxXeo-_mYfw3H4JD7BSnNcBJLE7mop6UxYgeBkNvR6fc6nIs-dDLBxa2kx-BkD7yvDtmAhbC4pora9wBLzaxOnnN44Zy5IoNk_u_mi_CrK_KQgn_yGLJxRu9fBtqYyRuBzzzbioX6F0e8nEQ3HuBz9hmmFClAYMHpfOVKblBTmDs7_2AXiJZTVZwlF_7Xx58Ctlh3cNJTBs4cFC1r0',
};

export default function Topbar({ title = 'Dashboard Overview', user }: TopbarProps) {
  const { name, role, avatar } = { ...DEFAULT_USER, ...user };
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      
      <div className="flex items-center gap-6">
        
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900 leading-none">{name}</p>
            <p className="text-[10px] text-slate-500">{role}</p>
          </div>
          <div 
            className="w-10 h-10 rounded-full bg-slate-200 bg-cover bg-center ring-2 ring-white" 
            style={{ backgroundImage: avatar ? `url('${avatar}')` : undefined }}
          ></div>
        </div>
      </div>
    </header>
  );
}