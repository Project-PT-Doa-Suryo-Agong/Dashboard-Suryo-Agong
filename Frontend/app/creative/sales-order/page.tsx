"use client";

import React, { useState } from 'react';
import { ShoppingBag, Handshake, Plus, Search, UserPlus } from 'lucide-react';

export default function SalesOrderPage() {
  // State untuk form input (Sesuai dengan kolom di sales.t_sales_order)
  const [varianId, setVarianId] = useState('');
  const [affiliatorId, setAffiliatorId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalPrice, setTotalPrice] = useState('');

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Menyimpan Transaksi Baru:", { varianId, affiliatorId, quantity, totalPrice });
    // Logika INSERT ke sales.t_sales_order via Supabase akan di sini
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Header Halaman */}
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Affiliate Sales Management</h2>
      </div>

      {/* TOP SECTION: Form Record New Sale */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-slate-500 w-6 h-6" />
            <h3 className="text-slate-800 font-bold">Record New Sale</h3>
          </div>
        </div>
        
        <form onSubmit={handleRecordSale} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          
          {/* Dropdown Varian Produk (Foreign Key ke core.m_varian) */}
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Product Variant</label>
            <select 
              required
              value={varianId}
              onChange={(e) => setVarianId(e.target.value)}
              className="w-full bg-slate-200 border text-slate-500  border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            >
              <option value="" disabled>-- Choose a Product --</option>
              {/* Ini nanti datanya di-fetch dari core.m_varian */}
              <option value="uuid-1">Wireless Mouse - Onyx (SKU: M-01) - Rp 150.000</option>
              <option value="uuid-2">Mechanical Keyboard - RGB (SKU: K-02) - Rp 850.000</option>
              <option value="uuid-3">Desk Mat - Leather (SKU: D-03) - Rp 250.000</option>
            </select>
          </div>
          
          {/* Dropdown Affiliator (Foreign Key ke sales.m_affiliator) */}
          <div className="space-y-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Affiliator</label>
              <button type="button" className="text-primary text-[10px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> New Affiliator
              </button>
            </div>
            <select 
              required
              value={affiliatorId}
              onChange={(e) => setAffiliatorId(e.target.value)}
              className="w-full bg-slate-200 border text-slate-500  border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            >
              <option value="" disabled>-- Choose an Affiliator --</option>
              {/* Ini nanti datanya di-fetch dari sales.m_affiliator */}
              <option value="aff-1">Sarah Jenkins (TikTok)</option>
              <option value="aff-2">Budi Santoso (Shopee Video)</option>
              <option value="aff-3">TechReview Indo (YouTube)</option>
            </select>
          </div>

          {/* Input Quantity */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</label>
            <input 
              required
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-200 border text-slate-500 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
              placeholder="Qty" 
            />
          </div>

          {/* Input Total Price */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
              <input 
                required
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                className="w-full bg-slate-200 border text-slate-500 border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                placeholder="0"
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="lg:col-span-2">
            <button 
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              Submit Order
            </button>
          </div>
        </form>
      </section>

      {/* BOTTOM SECTION: Sales Order History Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Handshake className="text-slate-500 w-6 h-6" />
            <h3 className="text-slate-800 font-bold">Sales Order History</h3>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              className="w-full text-slate-700  bg-slate-200 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-primary" 
              placeholder="Search order ID..." 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Product Variant</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Affiliator</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Total Price</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Order Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* Dummy Data Row 1 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700  font-mono">#SO-9921</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">Wireless Mouse - Onyx</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Sarah Jenkins</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">TikTok</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 text-center font-bold">2</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rp 300.000</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-right">Oct 24, 2026</td>
              </tr>
              
              {/* Dummy Data Row 2 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">#SO-9922</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">Mechanical Keyboard - RGB</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">TechReview Indo</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">YouTube</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 text-center font-bold">1</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rp 850.000</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-right">Oct 24, 2026</td>
              </tr>

              {/* Dummy Data Row 3 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">#SO-9923</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">Desk Mat - Leather</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Budi Santoso</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Shopee Video</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700 text-center font-bold">5</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rp 1.250.000</td>
                <td className="px-6 py-4 text-sm text-slate-500 text-right">Oct 23, 2026</td>
              </tr>

            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}