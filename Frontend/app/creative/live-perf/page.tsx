"use client";

import React, { useState } from 'react';
import { PlusCircle, Save, BarChart3, History } from 'lucide-react';

export default function LivePerformancePage() {
  // State untuk form (Sesuai dengan kolom di sales.t_live_performance)
  const [platform, setPlatform] = useState('');
  const [revenue, setRevenue] = useState('');

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Menyimpan data Live:", { platform, revenue });
    // Logika INSERT ke tabel sales.t_live_performance via Supabase akan di sini
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Header Halaman (Opsional, penegas judul) */}
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Live Performance Analytics</h2>
      </div>

      {/* TOP: Log Live Session Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle className="text-slate-500 w-6 h-6" />
          <h3 className="text-slate-800 font-bold">Log Live Session</h3>
        </div>
        
        <form onSubmit={handleSaveRecord} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Streaming Platform</label>
            <select 
              required
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-slate-200 text-slate-500  border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            >
              <option value="" disabled>Select Platform</option>
              <option value="Twitch">Twitch</option>
              <option value="YouTube Live">YouTube Live</option>
              <option value="TikTok Live">TikTok Live</option>
              <option value="Instagram Live">Instagram Live</option>
              <option value="Shopee Live">Shopee Live</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue Generated</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
              <input 
                required
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full bg-slate-200 text-slate-500 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                placeholder="0" 
              />
            </div>
          </div>
          
          <div>
            <button 
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 border border-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2 justify-center"
            >
              <Save className="w-5 h-5" />
              Save Record
            </button>
          </div>
        </form>
      </section>

      {/* MIDDLE: Revenue by Platform Chart */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-slate-500 w-6 h-6" />
            <h3 className="text-slate-800 font-bold">Revenue by Platform (Last 7 Days)</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span className="text-xs text-slate-500 font-medium">TikTok Live</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F0AD4E]"></span>
              <span className="text-xs text-slate-500 font-medium">Shopee Live</span>
            </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full flex items-end justify-between gap-4 px-4">
          {/* Placeholder Bar Chart using Tailwind (Diubah inline stylenya ke format React) */}
          {[
            { day: 'Mon', h1: '40%', h2: '65%' },
            { day: 'Tue', h1: '55%', h2: '45%' },
            { day: 'Wed', h1: '85%', h2: '70%' },
            { day: 'Thu', h1: '45%', h2: '90%' },
            { day: 'Fri', h1: '75%', h2: '60%' },
            { day: 'Sat', h1: '95%', h2: '80%' },
            { day: 'Sun', h1: '60%', h2: '35%' },
          ].map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex justify-center gap-1 items-end h-full">
                <div className="w-4 bg-primary rounded-t-sm transition-all hover:opacity-80 cursor-pointer" style={{ height: item.h1 }}></div>
                <div className="w-4 bg-[#F0AD4E] rounded-t-sm transition-all hover:opacity-80 cursor-pointer" style={{ height: item.h2 }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM: Recent Live Sessions Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-slate-500 w-6 h-6" />
            <h3 className="text-slate-800 font-bold">Recent Live Sessions</h3>
          </div>
          <button className="text-slate-400 text-xs font-bold uppercase tracking-wider hover:underline">
            View All Sessions
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Session ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Platform</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Revenue</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">#LS-92834</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Twitch
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rp 1.240.500</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-right">Oct 24, 2026</td>
              </tr>
              
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">#LS-92835</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> YouTube Live
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rp 890.000</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-right">Oct 23, 2026</td>
              </tr>
              
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">#LS-92836</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> TikTok Live
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rp 2.105.200</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-right">Oct 22, 2026</td>
              </tr>

            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}