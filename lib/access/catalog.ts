import type { MenuCluster } from "@/types/access";

export const MENU_CATALOG: MenuCluster[] = [
  {
    key: "cluster_1",
    title: "Management & Strategy",
    menus: [
      { key: "strategic_weekly_meeting", title: "Rapat Strategis Mingguan" },
      { key: "strategic_budget_approval", title: "Approval Budget & Investasi" },
      { key: "strategic_project_monitoring", title: "Monitoring Key Project" },
      { key: "strategic_external_communication", title: "Komunikasi Eksternal" },
    ],
  },
  {
    key: "cluster_2",
    title: "Finance & Administration",
    menus: [
      { key: "finance_cashflow_reimbursement", title: "Cashflow & Reimbursement" },
      { key: "finance_payroll", title: "Penggajian (Payroll)" },
      { key: "finance_document_filing", title: "Administrasi Dokumen & Filing" },
      { key: "finance_print_awb_validate_order", title: "Cetak Resi & Validasi Order" },
    ],
  },
  {
    key: "cluster_3",
    title: "HR & Operation Manager",
    menus: [
      { key: "hr_recruitment_onboarding", title: "Rekrutmen & Onboarding" },
      { key: "hr_contract_template_editor", title: "Editor Surat PKWT/PKWTP" },
      { key: "hr_performance_appraisal", title: "Penilaian Kinerja (Appraisal)" },
      { key: "hr_conflict_discipline", title: "Penanganan Konflik & Disiplin" },
      { key: "hr_operational_audit", title: "Audit Operasional" },
    ],
  },
  {
    key: "cluster_4",
    title: "Produksi & Quality Control",
    menus: [
      { key: "production_planning", title: "Perencanaan Produksi" },
      { key: "production_qc_inbound_outbound", title: "Quality Control Inbound/Outbound" },
      { key: "production_machine_maintenance", title: "Maintenance Mesin" },
      { key: "production_stock_opname", title: "Stock Opname" },
    ],
  },
  {
    key: "cluster_5",
    title: "Logistics & Packing",
    menus: [
      { key: "logistics_packing_standard", title: "Standar Packing" },
      { key: "logistics_handover", title: "Serah Terima Logistik" },
      { key: "logistics_reject_return", title: "Penanganan Barang Reject/Retur" },
    ],
  },
  {
    key: "cluster_6",
    title: "Creative & Sales",
    menus: [
      { key: "creative_content_production", title: "Content Production" },
      { key: "creative_live_streaming", title: "Live Streaming" },
      { key: "creative_affiliator_management", title: "Manajemen Afiliator" },
      { key: "creative_client_handling", title: "Handling Client (Account Management)" },
      { key: "creative_social_moderation", title: "Moderasi Sosmed" },
    ],
  },
  {
    key: "cluster_7",
    title: "Office Support",
    menus: [
      { key: "office_security", title: "Keamanan Lingkungan" },
      { key: "office_cleanliness", title: "Kebersihan Fasilitas" },
      { key: "office_facility_damage", title: "Penanganan Kerusakan Fasilitas" },
    ],
  },
];
