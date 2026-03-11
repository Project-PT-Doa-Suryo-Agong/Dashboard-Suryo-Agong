import Link from "next/link";
import Image from "next/image";
import { CreditCard, Users, Factory, Truck, BarChart2, Palette, ArrowRight } from "lucide-react";

// Data untuk Grid Cards Divisi
const departments = [
  {
    title: "Finance",
    icon: CreditCard,
    description: "Centralized accounting, real-time auditing, and comprehensive fiscal reporting modules.",
  },
  {
    title: "Human Resources",
    icon: Users,
    description: "Talent acquisition, payroll integration, and employee lifecycle management tools.",
  },
  {
    title: "Production & QC",
    icon: Factory,
    description: "Monitor manufacturing lines and quality assurance benchmarks in real-time.",
  },
  {
    title: "Logistics",
    icon: Truck,
    description: "Supply chain optimization, fleet tracking, and global distribution logistics.",
  },
  {
    title: "Management",
    icon: BarChart2,
    description: "Strategic oversight, KPI dashboards, and executive decision-making support.",
  },
  {
    title: "Creative",
    icon: Palette,
    description: "Digital asset management, brand guidelines, and creative campaign collaboration.",
  },
];

export default function LandingPage() {
  return (
    // Background utama #999999 diterapkan di sini
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#999999] font-display antialiased">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full px-6 py-4 bg-[#333333]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Image src="/logo.png" alt="NexusCore Logo" width={120} height={36} className="h-9 w-auto" />
          </div>
          <Link 
            href="/auth" 
            className="flex min-w-[100px] items-center justify-center rounded-lg h-10 px-6 bg-[#BC934B] text-white text-sm font-bold transition-all hover:bg-opacity-90 shadow-md"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center max-w-4xl mx-auto">
          <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6 drop-shadow-sm">
            Unified Enterprise <span className="text-primary drop-shadow-none">Dashboard</span>
          </h1>
          <p className="text-white text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-10 opacity-90">
            Seamlessly manage Finance, HR, Production, and more from one intelligent ecosystem. Designed for modern scale.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/auth" 
              className="flex min-w-[160px] items-center justify-center rounded-xl h-14 px-8 bg-[#BC934B] text-white text-base font-bold shadow-lg hover:translate-y-[-2px] transition-transform"
            >
              Access System
            </Link>
          </div>
        </section>

        {/* Roles/Clusters Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Mapping Array data ke dalam UI Cards */}
            {departments.map((dept, index) => (
              <div 
                key={index} 
                className="relative flex flex-col p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <dept.icon className="w-10 h-10 text-[#BC934B]" />
                </div>
                
                <h3 className="text-slate-900 text-xl font-bold mb-2">{dept.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-grow">
                  {dept.description}
                </p>
              </div>
            ))}

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#1F2937] text-slate-300 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="NexusCore Logo" width={100} height={30} className="h-8 w-auto brightness-150" />
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Documentation</a>
            <a className="hover:text-primary transition-colors" href="#">Contact Support</a>
          </div>
          <p className="text-sm opacity-60">© 2026 NexusCore Enterprise. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}