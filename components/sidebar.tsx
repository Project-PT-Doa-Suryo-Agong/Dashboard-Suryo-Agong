import Link from 'next/link';
import Image from 'next/image';

// Kita definisikan tipe data untuk Menu
export type MenuItem = {
  title: string;
  href: string;
  icon?: React.ReactNode; // Opsional jika nanti mau tambah icon SVG
};

// Kita definisikan "pesanan" (props) apa saja yang diterima Sidebar ini
interface SidebarProps {
  divisiName: string;      // Contoh: "Finance", "PROD-Q", dll.
  menuItems: MenuItem[];   // Array berisi daftar menu
}

export default function Sidebar({ divisiName, menuItems }: SidebarProps) {
  return (
    <aside className="w-64 bg-brand-dark text-white flex flex-col shrink-0 h-screen">
      {/* Header / Logo */}
      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <Image src="/logo.png" alt="NexusCore Logo" width={120} height={36} className="h-9 w-auto" />
      </div>

      {/* Menu Navigasi Dinamis */}
      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((menu, index) => (
          <Link 
            key={index} 
            href={menu.href} 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 hover:border-l-4 hover:border-brand-gold transition-all"
          >
            {menu.icon && <span className="w-5 h-5">{menu.icon}</span>}
            {menu.title}
          </Link>
        ))}
      </nav>

      {/* Footer Sidebar */}
      <div className="p-4 bg-gray-900 text-xs text-gray-500 text-center">
        Sistem Manajemen {divisiName}
      </div>
    </aside>
  );
}