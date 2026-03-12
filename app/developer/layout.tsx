import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

const navItems = [
  { label: 'Master Data', href: '/', icon: 'LayoutDashboard' },
  { label: 'Content Planner', href: '/content', icon: 'CalendarDays' }, 
];

export default function CreativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display">
      {/* Kiri: Sidebar */}
      <Sidebar
        title="Creative & Sales"
        subtitle="Management Portal"
        logoIcon="Palette"
        navItems={navItems}
        footerAction={{ label: 'New Campaign', icon: 'Plus' }}
      />

      {/* Kanan: Area Utama */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100/50">
        <Topbar
          title="Creative & Sales Dashboard"
          user={{ name: 'Soebardjo Djojokoesoemo', role: 'Developer' }}
        />

        {/* Area Konten Dinamis yang bisa di-scroll */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}