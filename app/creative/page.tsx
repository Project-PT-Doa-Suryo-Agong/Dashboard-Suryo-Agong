import React from 'react';
import { TrendingUp, TrendingDown, Banknote, Users, FileText, Tv2, Clapperboard, Camera, Play } from 'lucide-react';

export default function CreativeDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Sales Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">$128,430</h3>
            <div className="flex items-center text-green-500  gap-1 mt-2 text-success">
              <TrendingUp size={16} />
              <span className="text-xs font-bold">+12.5%</span>
            </div>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-slate-600">
            <Banknote size={24} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Affiliators</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">1,240</h3>
            <div className="flex items-center text-green-500 gap-1 mt-2 text-success">
              <TrendingUp size={16} />
              <span className="text-xs font-bold">+5.2%</span>
            </div>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-slate-600">
            <Users size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Content Planned</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">84</h3>
            <div className="flex items-center gap-1 mt-2 text-[#F0AD4E]">
              <TrendingDown size={16} />
              <span className="text-xs font-bold">-2.1%</span>
            </div>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-slate-600">
            <FileText size={24} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Live Stream Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">$42,150</h3>
            <div className="flex items-center text-green-500  gap-1 mt-2 text-success">
              <TrendingUp size={16} />
              <span className="text-xs font-bold">+8.4%</span>
            </div>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-slate-600">
            <Tv2 size={24} />
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Live Performance Revenue</h3>
              <p className="text-sm text-slate-500">Revenue growth tracked over the last 30 days</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">$42,150</span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold">LIVE</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <svg className="w-full h-full" viewBox="0 0 500 200">
              <defs>
                <linearGradient id="chart-poly" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#BC934B" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#BC934B" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path fill="url(#chart-poly)" d="M0,150 Q50,130 100,140 T200,80 T300,100 T400,40 T500,60 L500,200 L0,200 Z"></path>
              <path d="M0,150 Q50,130 100,140 T200,80 T300,100 T400,40 T500,60" fill="none" stroke="#BC934B" strokeLinecap="round" strokeWidth="3"></path>
              <g className="text-[10px] fill-slate-500 font-medium">
                <text x="0" y="195">Week 1</text>
                <text x="125" y="195">Week 2</text>
                <text x="250" y="195">Week 3</text>
                <text x="375" y="195">Week 4</text>
                <text x="470" y="195">Now</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Content Planner List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Content Planner</h3>
            <button className="text-slate-500 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {/* List Items */}
            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">TikTok Promo - Fall Gear</p>
                <p className="text-xs text-slate-500">Added Oct 12, 2026</p>
              </div>
              <div className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">TikTok</div>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">IG Reels - Workflow</p>
                <p className="text-xs text-slate-500">Added Oct 12, 2026</p>
              </div>
              <div className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">IG</div>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">YouTube Shorts Review</p>
                <p className="text-xs text-slate-500">Added Oct 11, 2026</p>
              </div>
              <div className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">YT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Affiliate Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Recent Affiliate Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Product Variant</th>
                <th className="px-6 py-4">Affiliator Name</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-700">#ORD-9021</td>
                <td className="px-6 py-4 text-sm text-slate-700">Wireless Headphones (Onyx)</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUmYFCQnZT7QcaqOs7wdMR5ZQhH_igdQSvwR_-uvUBI0MxM6rJexGzclVxc23dLQSvjHNfWNQlgrlk6r9IaXPvyNG4y_BJSiFnv8cMt4eAqc7wJniy_fopvm9loXesh8Nv1Ab99wpMXLu5fjncQ675MviXyDCUNWTyGzKDBha1unpsa6J1fmcfenayXFmUyEnDV6UAlxcVIk4lKJfgSa4i_EzqXmNCj8rem4Gox0dpoEvM3cqjD53C1Xon5Ydk0g_X_JuTRMSfdQI')" }}></div>
                    <span className="text-sm text-slate-700">Sarah Jenkins</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">TikTok Shop</td>
                <td className="px-6 py-4 text-sm text-slate-600">2</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">$259.98</td>
              </tr>
              {/* Tambahkan baris tabel lainnya sesuai kebutuhan */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}   