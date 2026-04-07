import { TrendingUp, TrendingDown, Banknote, Users, FileText, Tv2 } from 'lucide-react';

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CreativeDashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-3 md:space-y-4 md:p-4 lg:space-y-8 lg:p-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {/* Card 1 */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">Total Sales Revenue</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">{formatRupiah(128430)}</h3>
            <div className="mt-2 flex items-center gap-1 text-green-500 text-success">
              <TrendingUp className="h-4 w-4 flex-shrink-0 md:h-5 md:w-5" />
              <span className="text-xs font-bold md:text-sm lg:text-base">+12.5%</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <Banknote className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">Active Affiliators</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">1,240</h3>
            <div className="mt-2 flex items-center gap-1 text-green-500 text-success">
              <TrendingUp className="h-4 w-4 flex-shrink-0 md:h-5 md:w-5" />
              <span className="text-xs font-bold md:text-sm lg:text-base">+5.2%</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <Users className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">Total Content Planned</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">84</h3>
            <div className="mt-2 flex items-center gap-1 text-[#F0AD4E]">
              <TrendingDown className="h-4 w-4 flex-shrink-0 md:h-5 md:w-5" />
              <span className="text-xs font-bold md:text-sm lg:text-base">-2.1%</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <FileText className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">Live Stream Revenue</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">{formatRupiah(42150)}</h3>
            <div className="mt-2 flex items-center gap-1 text-green-500 text-success">
              <TrendingUp className="h-4 w-4 flex-shrink-0 md:h-5 md:w-5" />
              <span className="text-xs font-bold md:text-sm lg:text-base">+8.4%</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <Tv2 className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 gap-2 md:gap-3 lg:grid-cols-3 lg:gap-4">
        
        {/* Area Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-2 md:p-4 lg:p-6">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center md:mb-6 md:gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">Live Performance Revenue</h3>
              <p className="text-xs text-slate-500 md:text-sm lg:text-base">Revenue growth tracked over the last 30 days</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">{formatRupiah(42150)}</span>
              <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600 md:text-xs">LIVE</span>
            </div>
          </div>
          <div className="h-48 w-full md:h-56 lg:h-64">
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
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center md:mb-6">
            <h3 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">Content Planner</h3>
            <button className="text-xs font-bold text-slate-500 hover:underline md:text-sm lg:text-base">View All</button>
          </div>
          <div className="space-y-3 md:space-y-4 lg:space-y-6">
            {/* List Items */}
            <div className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50 md:gap-4 md:p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate whitespace-nowrap text-sm font-bold text-slate-900 md:text-base lg:text-lg">TikTok Promo - Fall Gear</p>
                <p className="truncate whitespace-nowrap text-xs text-slate-500 md:text-sm lg:text-base">Added Oct 12, 2026</p>
              </div>
              <div className="whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 md:text-xs">TikTok</div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50 md:gap-4 md:p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate whitespace-nowrap text-sm font-bold text-slate-900 md:text-base lg:text-lg">IG Reels - Workflow</p>
                <p className="truncate whitespace-nowrap text-xs text-slate-500 md:text-sm lg:text-base">Added Oct 12, 2026</p>
              </div>
              <div className="whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 md:text-xs">IG</div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50 md:gap-4 md:p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate whitespace-nowrap text-sm font-bold text-slate-900 md:text-base lg:text-lg">YouTube Shorts Review</p>
                <p className="truncate whitespace-nowrap text-xs text-slate-500 md:text-sm lg:text-base">Added Oct 11, 2026</p>
              </div>
              <div className="whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 md:text-xs">YT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Affiliate Sales Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-3 md:p-4 lg:p-6">
          <h3 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">Recent Affiliate Sales</h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:text-xs">
                <th className="whitespace-nowrap px-3 py-3 md:px-4 md:py-4 lg:px-6">Order ID</th>
                <th className="whitespace-nowrap px-3 py-3 md:px-4 md:py-4 lg:px-6">Product Variant</th>
                <th className="whitespace-nowrap px-3 py-3 md:px-4 md:py-4 lg:px-6">Affiliator Name</th>
                <th className="whitespace-nowrap px-3 py-3 md:px-4 md:py-4 lg:px-6">Platform</th>
                <th className="whitespace-nowrap px-3 py-3 md:px-4 md:py-4 lg:px-6">Quantity</th>
                <th className="whitespace-nowrap px-3 py-3 md:px-4 md:py-4 lg:px-6">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-700 md:px-4 md:py-4 md:text-sm lg:px-6 lg:text-base">#ORD-9021</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 md:px-4 md:py-4 md:text-sm lg:px-6 lg:text-base">Wireless Headphones (Onyx)</td>
                <td className="px-3 py-3 md:px-4 md:py-4 lg:px-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-slate-200 bg-cover bg-center md:h-8 md:w-8" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUmYFCQnZT7QcaqOs7wdMR5ZQhH_igdQSvwR_-uvUBI0MxM6rJexGzclVxc23dLQSvjHNfWNQlgrlk6r9IaXPvyNG4y_BJSiFnv8cMt4eAqc7wJniy_fopvm9loXesh8Nv1Ab99wpMXLu5fjncQ675MviXyDCUNWTyGzKDBha1unpsa6J1fmcfenayXFmUyEnDV6UAlxcVIk4lKJfgSa4i_EzqXmNCj8rem4Gox0dpoEvM3cqjD53C1Xon5Ydk0g_X_JuTRMSfdQI')" }}></div>
                    <span className="whitespace-nowrap text-xs text-slate-700 md:text-sm lg:text-base">Sarah Jenkins</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600 md:px-4 md:py-4 md:text-sm lg:px-6 lg:text-base">TikTok Shop</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600 md:px-4 md:py-4 md:text-sm lg:px-6 lg:text-base">2</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs font-bold text-slate-900 md:px-4 md:py-4 md:text-sm lg:px-6 lg:text-base">{formatRupiah(259980)}</td>
              </tr>
              {/* Tambahkan baris tabel lainnya sesuai kebutuhan */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}   
