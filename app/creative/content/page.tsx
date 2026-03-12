"use client";

import React, { useState } from 'react';
import { PlusCircle, ChevronDown, Save, List, Trash2 } from 'lucide-react';

export default function ContentPlannerPage() {
  // State untuk form input (Persiapan untuk Insert ke Database nanti)
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Menyimpan data:", { title, platform });
    // Logika Supabase INSERT akan masuk ke sini
  };

  return (
    <div className="p-8 space-y-6">
      
      {/* Header Halaman (Opsional jika ingin menegaskan judul halaman di bawah Topbar) */}
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Content Planner</h2>
      </div>

      {/* Top Card: Quick Add Form */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={18} className="text-slate-800" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Quick Add Content</h3>
        </div>
        
        <form onSubmit={handleSaveContent} className="flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-75">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Content Title
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-200 border text-slate-600 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all" 
              placeholder="e.g., Summer Promo Video" 
              required
            />
          </div>
          
          <div className="w-64">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Platform
            </label>
            <div className="relative">
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full appearance-none px-4 py-3 bg-slate-200 border text-slate-500 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Select Platform</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter / X">Twitter / X</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>
          
          <button 
            type="submit"
            className="bg-green-500 hover:bg-green-600 border border-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
          >
            <Save size={18} />
            Save Content
          </button>
        </form>
      </section>

      {/* Bottom Card: Content Log Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Content Log</h3>
          </div>
          <button className="text-xs font-semibold text-primary hover:underline">
            View All Schedule
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Content ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Added</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* Dummy Data Row 1 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">#CT-8892</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">Summer Beach Collection Reel</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span> Instagram
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">Oct 24, 2026</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete Content">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>

              {/* Dummy Data Row 2 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">#CT-8893</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">Product Launch BTS</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span> TikTok
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">Oct 25, 2026</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete Content">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-500">Showing 2 of 48 entries</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">Previous</button>
            <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </section>

    </div>
  );
}