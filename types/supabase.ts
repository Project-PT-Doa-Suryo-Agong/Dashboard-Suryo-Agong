export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Utility ──────────────────────────────────────────────────────────────────

type Tables<S extends keyof Database, T extends keyof Database[S]["Tables"]> =
  Database[S]["Tables"][T];

export type CoreUserRole =
  | "Super Admin"
  | "Management & Strategy"
  | "Finance & Administration"
  | "HR & Operation Manager"
  | "Produksi & Quality Control"
  | "Logistics & Packing"
  | "Creative & Sales"
  | "Office Support"
  | "CEO"
  | "Finance"
  | "HR"
  | "Produksi"
  | "Logistik"
  | "Creative"
  | "Office";

export type HrEmployeeStatus = "aktif" | "nonaktif";
export type HrAttendanceStatus = "hadir" | "izin" | "sakit" | "alpha";

export type FinanceCashflowType = "income" | "expense";
export type FinanceReimburseStatus = "pending" | "approved" | "rejected";
export type FinanceCoaCategory = "Aset" | "Liabilitas" | "Ekuitas" | "Pendapatan" | "Beban" | "Beban Lain-lain";
export type FinanceInvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type FinanceTipeKas = "ya" | "tidak";
export type FinanceUtangPiutangTipe = "utang" | "piutang";

export type ProductionStatus = "draft" | "ongoing" | "done";
export type ProductionQcResult = "pass" | "reject";

export type LogisticsPackingStatus = "pending" | "packed" | "shipped";

export type ManagementBudgetStatus = "pending" | "approved" | "rejected";

export type SalesContentType = "story" | "feed" | "video" | "live" | "article" | "other";
export type SalesContentStatus = "terupload" | "direncanakan" | "dihapus";

// ─── Database ─────────────────────────────────────────────────────────────────

export interface Database {
  // ── Schema: core ────────────────────────────────────────────────────────────
  core: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nama: string;
          role: CoreUserRole;
          phone: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nama: string;
          role: CoreUserRole;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nama?: string;
          role?: CoreUserRole;
          phone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      m_produk: {
        Row: {
          id: string;
          nama_produk: string;
          kategori: string | null;
          foto_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nama_produk: string;
          kategori?: string | null;
          foto_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nama_produk?: string;
          kategori?: string | null;
          foto_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      m_varian: {
        Row: {
          id: string;
          product_id: string | null;
          nama_varian: string | null;
          sku: string | null;
          harga: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          nama_varian?: string | null;
          sku?: string | null;
          harga?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          nama_varian?: string | null;
          sku?: string | null;
          harga?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      m_vendor: {
        Row: {
          id: string;
          nama_vendor: string | null;
          kontak: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nama_vendor?: string | null;
          kontak?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nama_vendor?: string | null;
          kontak?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: CoreUserRole;
    };
    CompositeTypes: { [_ in never]: never };
  };

  // ── Schema: hr ──────────────────────────────────────────────────────────────
  hr: {
    Tables: {
      m_karyawan: {
        Row: {
          id: string;
          profile_id: string | null;
          nama: string;
          posisi: string | null;
          nik: string | null;
          nip: string | null;
          foto_perorangan_url: string | null;
          foto_ktp_url: string | null;
          foto_kk_url: string | null;
          alamat_domisili: string | null;
          nomor_whatsapp: string | null;
          email_pribadi: string | null;
          pendidikan_terakhir: string | null;
          jurusan: string | null;
          pengalaman_kerja_sebelumnya: string | null;
          keahlian_khusus: string | null;
          motivasi_kerja: string | null;
          divisi: string | null;
          status: HrEmployeeStatus | null;
          gaji_pokok: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          nama: string;
          posisi?: string | null;
          nik?: string | null;
          nip?: string | null;
          foto_perorangan_url?: string | null;
          foto_ktp_url?: string | null;
          foto_kk_url?: string | null;
          alamat_domisili?: string | null;
          nomor_whatsapp?: string | null;
          email_pribadi?: string | null;
          pendidikan_terakhir?: string | null;
          jurusan?: string | null;
          pengalaman_kerja_sebelumnya?: string | null;
          keahlian_khusus?: string | null;
          motivasi_kerja?: string | null;
          divisi?: string | null;
          status?: HrEmployeeStatus | null;
          gaji_pokok?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          nama?: string;
          posisi?: string | null;
          nik?: string | null;
          nip?: string | null;
          foto_perorangan_url?: string | null;
          foto_ktp_url?: string | null;
          foto_kk_url?: string | null;
          alamat_domisili?: string | null;
          nomor_whatsapp?: string | null;
          email_pribadi?: string | null;
          pendidikan_terakhir?: string | null;
          jurusan?: string | null;
          pengalaman_kerja_sebelumnya?: string | null;
          keahlian_khusus?: string | null;
          motivasi_kerja?: string | null;
          divisi?: string | null;
          status?: HrEmployeeStatus | null;
          gaji_pokok?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      t_attendance: {
        Row: {
          employee_id: string;
          tanggal: string;
          status: HrAttendanceStatus | null;
          jam_masuk: string | null;
          jam_keluar: string | null;
          jarak_meter: number | null;
          is_dinas: "Ya" | "Tidak" | null;
          laporan_harian: string | null;
          created_at: string | null;
          m_karyawan?: { nama: string | null } | null;
        };
        Insert: {
          employee_id: string;
          tanggal?: string;
          status?: HrAttendanceStatus | null;
          jam_masuk?: string | null;
          jam_keluar?: string | null;
          jarak_meter?: number | null;
          is_dinas?: "Ya" | "Tidak" | null;
          laporan_harian?: string | null;
          created_at?: string | null;
        };
        Update: {
          employee_id?: string;
          tanggal?: string;
          status?: HrAttendanceStatus | null;
          jam_masuk?: string | null;
          jam_keluar?: string | null;
          jarak_meter?: number | null;
          is_dinas?: "Ya" | "Tidak" | null;
          laporan_harian?: string | null;
        };
        Relationships: [];
      };
      t_employee_warning: {
        Row: {
          id: string;
          employee_id: string | null;
          level: string | null;
          alasan: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          level?: string | null;
          alasan?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          level?: string | null;
          alasan?: string | null;
        };
        Relationships: [];
      };
      m_sop: {
        Row: {
          id: string;
          judul: string;
          divisi: CoreUserRole | string | null;
          konten: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          judul: string;
          divisi?: CoreUserRole | string | null;
          konten?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          judul?: string;
          divisi?: CoreUserRole | string | null;
          konten?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      attendance_status: HrAttendanceStatus;
      employee_status: HrEmployeeStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };

  // ── Schema: finance ─────────────────────────────────────────────────────────
  finance: {
    Tables: {
      m_coa: {
        Row: {
          id: string;
          kode_akun: string;
          nama_akun: string;
          kategori: FinanceCoaCategory;
          is_sub_account: boolean | null;
          parent_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          kode_akun: string;
          nama_akun: string;
          kategori: FinanceCoaCategory;
          is_sub_account?: boolean | null;
          parent_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          kode_akun?: string;
          nama_akun?: string;
          kategori?: FinanceCoaCategory;
          is_sub_account?: boolean | null;
          parent_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      t_journal: {
        Row: {
          id: string;
          journal_number: string | null;
          no_bukti: string;
          tanggal: string;
          keterangan: string | null;
          referensi_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          journal_number?: string | null;
          no_bukti: string;
          tanggal?: string;
          keterangan?: string | null;
          referensi_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          journal_number?: string | null;
          no_bukti?: string;
          tanggal?: string;
          keterangan?: string | null;
          referensi_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      t_journal_item: {
        Row: {
          id: string;
          journal_id: string | null;
          coa_id: string;
          debit: number | null;
          kredit: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          journal_id?: string | null;
          coa_id: string;
          debit?: number | null;
          kredit?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          journal_id?: string | null;
          coa_id?: string;
          debit?: number | null;
          kredit?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      t_cashflow: {
        Row: {
          id: string;
          cashflow_number: string | null;
          tipe: FinanceCashflowType | null;
          amount: number | null;
          keterangan: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          cashflow_number?: string | null;
          tipe?: FinanceCashflowType | null;
          amount?: number | null;
          keterangan?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          cashflow_number?: string | null;
          tipe?: FinanceCashflowType | null;
          amount?: number | null;
          keterangan?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      t_payroll_history: {
        Row: {
          id: string;
          employee_id: string | null;
          coa_id: string | null;
          bulan: string | null;
          total: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          coa_id?: string | null;
          bulan?: string | null;
          total?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          coa_id?: string | null;
          bulan?: string | null;
          total?: number | null;
        };
        Relationships: [];
      };
      t_reimbursement: {
        Row: {
          id: string;
          reimbursement_number: string | null;
          employee_id: string | null;
          coa_id: string | null;
          amount: number | null;
          bukti: string | null;
          status: FinanceReimburseStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          reimbursement_number?: string | null;
          employee_id?: string | null;
          coa_id?: string | null;
          amount?: number | null;
          bukti?: string | null;
          status?: FinanceReimburseStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          reimbursement_number?: string | null;
          employee_id?: string | null;
          coa_id?: string | null;
          amount?: number | null;
          bukti?: string | null;
          status?: FinanceReimburseStatus | null;
        };
        Relationships: [];
      };
      t_invoice: {
        Row: {
          id: string;
          tanggal: string;
          jatuh_tempo: string;
          pelanggan: string;
          catatan: string | null;
          total_amount: number;
        };
        Insert: {
          id?: string;
          tanggal: string;
          jatuh_tempo: string;
          pelanggan: string;
          catatan?: string | null;
          total_amount?: number;
        };
        Update: {
          id?: string;
          tanggal?: string;
          jatuh_tempo?: string;
          pelanggan?: string;
          catatan?: string | null;
          total_amount?: number;
        };
        Relationships: [];
      };
      t_invoice_item: {
        Row: {
          id_invoice: string;
          id_sales_order: string;
          deskripsi: string | null;
        };
        Insert: {
          id_invoice: string;
          id_sales_order: string;
          deskripsi?: string | null;
        };
        Update: {
          id_invoice?: string;
          id_sales_order?: string;
          deskripsi?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "t_invoice_item_id_invoice_fkey";
            columns: ["id_invoice"];
            isOneToOne: false;
            referencedRelation: "t_invoice";
            referencedColumns: ["id"];
          }
        ];
      };
      t_utang_piutang: {
        Row: {
          id: string;
          tanggal_awal: string;
          jatuh_tempo: string;
          nominal: number;
          klien: string;
          deskripsi: string | null;
          kas: FinanceTipeKas;
          tipe: FinanceUtangPiutangTipe;
          coa: string | null;
        };
        Insert: {
          id?: string;
          tanggal_awal?: string;
          jatuh_tempo: string;
          nominal: number;
          klien: string;
          deskripsi?: string | null;
          kas?: FinanceTipeKas;
          tipe?: FinanceUtangPiutangTipe;
          coa?: string | null;
        };
        Update: {
          id?: string;
          tanggal_awal?: string;
          jatuh_tempo?: string;
          nominal?: number;
          klien?: string;
          deskripsi?: string | null;
          kas?: FinanceTipeKas;
          tipe?: FinanceUtangPiutangTipe;
          coa?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "t_utang_piutang_coa_fkey";
            columns: ["coa"];
            isOneToOne: false;
            referencedRelation: "m_coa";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      cashflow_type: FinanceCashflowType;
      reimburse_status: FinanceReimburseStatus;
      coa_category: FinanceCoaCategory;
      invoice_status: FinanceInvoiceStatus;
      tipe_kas: FinanceTipeKas;
    };
    CompositeTypes: { [_ in never]: never };
  };

  // ── Schema: production ──────────────────────────────────────────────────────
  production: {
    Tables: {
      t_produksi_order: {
        Row: {
          id: string;
          vendor_id: string | null;
          product_id: string | null;
          quantity: number | null;
          status: ProductionStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          vendor_id?: string | null;
          product_id?: string | null;
          quantity?: number | null;
          status?: ProductionStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          vendor_id?: string | null;
          product_id?: string | null;
          quantity?: number | null;
          status?: ProductionStatus | null;
        };
        Relationships: [];
      };
      t_qc_inbound: {
        Row: {
          id: string;
          produksi_order_id: string | null;
          hasil: ProductionQcResult | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          produksi_order_id?: string | null;
          hasil?: ProductionQcResult | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          produksi_order_id?: string | null;
          hasil?: ProductionQcResult | null;
        };
        Relationships: [];
      };
      t_qc_outbound: {
        Row: {
          id: string;
          produksi_order_id: string | null;
          hasil: ProductionQcResult | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          produksi_order_id?: string | null;
          hasil?: ProductionQcResult | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          produksi_order_id?: string | null;
          hasil?: ProductionQcResult | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      production_status: ProductionStatus;
      qc_result: ProductionQcResult;
    };
    CompositeTypes: { [_ in never]: never };
  };

  // ── Schema: logistics ───────────────────────────────────────────────────────
  logistics: {
    Tables: {
      t_packing: {
        Row: {
          order_id: string;
          packing_number: string | null;
          status: LogisticsPackingStatus | null;
          created_at: string | null;
        };
        Insert: {
          order_id: string;
          packing_number?: string | null;
          status?: LogisticsPackingStatus | null;
          created_at?: string | null;
        };
        Update: {
          order_id?: string;
          packing_number?: string | null;
          status?: LogisticsPackingStatus | null;
        };
        Relationships: [];
      };
      t_logistik_manifest: {
        Row: {
          order_id: string;
          manifest_number: string | null;
          resi: string | null;
          created_at: string | null;
        };
        Insert: {
          order_id: string;
          manifest_number?: string | null;
          resi?: string | null;
          created_at?: string | null;
        };
        Update: {
          order_id?: string;
          manifest_number?: string | null;
          resi?: string | null;
        };
        Relationships: [];
      };
      t_return_order: {
        Row: {
          id: string;
          return_number: string | null;
          order_id: string | null;
          alasan: string;
          status: string | null;
          foto_bukti_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          return_number?: string | null;
          order_id?: string | null;
          alasan: string;
          status?: string | null;
          foto_bukti_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          return_number?: string | null;
          order_id?: string | null;
          alasan?: string;
          status?: string | null;
          foto_bukti_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      packing_status: LogisticsPackingStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };

  // ── Schema: sales ───────────────────────────────────────────────────────────
  sales: {
    Tables: {
      m_affiliator: {
        Row: {
          id: string;
          nama: string;
          platform: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nama: string;
          platform?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nama?: string;
          platform?: string | null;
        };
        Relationships: [];
      };
      t_content_planner: {
        Row: {
          id: string;
          content_number: string | null;
          judul: string;
          platform: string | null;
          affiliator_id: string | null;
          jadwal: string | null;
          tipe: SalesContentType | null;
          status: SalesContentStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          content_number?: string | null;
          judul: string;
          platform?: string | null;
          affiliator_id?: string | null;
          jadwal?: string | null;
          tipe?: SalesContentType | null;
          status?: SalesContentStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          content_number?: string | null;
          judul?: string;
          platform?: string | null;
          affiliator_id?: string | null;
          jadwal?: string | null;
          tipe?: SalesContentType | null;
          status?: SalesContentStatus | null;
        };
        Relationships: [];
      };
      t_live_performance: {
        Row: {
          id: string;
          live_number: string | null;
          platform: string;
          revenue: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          live_number?: string | null;
          platform: string;
          revenue?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          live_number?: string | null;
          platform?: string;
          revenue?: number | null;
        };
        Relationships: [];
      };
      t_content_statistic: {
        Row: {
          id: string;
          content_planner_id: string | null;
          link: string | null;
          jumlah_view: number | null;
          monetasi: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          content_planner_id?: string | null;
          link?: string | null;
          jumlah_view?: number | null;
          monetasi?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          content_planner_id?: string | null;
          link?: string | null;
          jumlah_view?: number | null;
          monetasi?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      t_sales_order: {
        Row: {
          id: string;
          order_code: string | null;
          order_number: string | null;
          coa_id: string | null;
          varian_id: string | null;
          affiliator_id: string | null;
          quantity: number;
          total_price: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_code?: string | null;
          order_number?: string | null;
          coa_id?: string | null;
          varian_id?: string | null;
          affiliator_id?: string | null;
          quantity: number;
          total_price: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_code?: string | null;
          order_number?: string | null;
          coa_id?: string | null;
          varian_id?: string | null;
          affiliator_id?: string | null;
          quantity?: number;
          total_price?: number;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };

  // ── Schema: management ──────────────────────────────────────────────────────
  management: {
    Tables: {
      t_budget_request: {
        Row: {
          id: string;
          divisi: string;
          coa_id: string | null;
          amount: number;
          status: ManagementBudgetStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          divisi: string;
          coa_id?: string | null;
          amount: number;
          status?: ManagementBudgetStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          divisi?: string;
          coa_id?: string | null;
          amount?: number;
          status?: ManagementBudgetStatus | null;
        };
        Relationships: [];
      };
      t_kpi_weekly: {
        Row: {
          id: string;
          minggu: string;
          divisi: string | null;
          target: number;
          realisasi: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          minggu: string;
          divisi?: string | null;
          target: number;
          realisasi: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          minggu?: string;
          divisi?: string | null;
          target?: number;
          realisasi?: number;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      budget_status: ManagementBudgetStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

// ─── Convenience Row Types ────────────────────────────────────────────────────

// core
export type Profile   = Tables<"core", "profiles">["Row"];
export type MProduk   = Tables<"core", "m_produk">["Row"];
export type MVarian   = Tables<"core", "m_varian">["Row"];
export type MVendor   = Tables<"core", "m_vendor">["Row"];
export type MProdukInsert = Tables<"core", "m_produk">["Insert"];
export type MVarianInsert = Tables<"core", "m_varian">["Insert"];
export type MVendorInsert = Tables<"core", "m_vendor">["Insert"];

// hr
export type MKaryawan        = Tables<"hr", "m_karyawan">["Row"];
export type TAttendance      = Tables<"hr", "t_attendance">["Row"];
export type TEmployeeWarning = Tables<"hr", "t_employee_warning">["Row"];
export type MSop             = Tables<"hr", "m_sop">["Row"];
export type MSopInsert       = Tables<"hr", "m_sop">["Insert"];

// finance
export type TCashflow       = Tables<"finance", "t_cashflow">["Row"];
export type TPayrollHistory = Tables<"finance", "t_payroll_history">["Row"];
export type TReimbursement  = Tables<"finance", "t_reimbursement">["Row"];
export type MCoa             = Tables<"finance", "m_coa">["Row"];
export type MCOA = {
  id: string;
  kode_akun: string;
  nama_akun: string;
  kategori: 'Aset' | 'Liabilitas' | 'Ekuitas' | 'Pendapatan' | 'Beban' | 'Beban Lain-lain' | 'Pendapatan Lain-lain';
  is_sub_account: boolean | null;
  parent_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  parent?: { kode_akun: string; nama_akun: string } | null;
};
export type TJournal         = Tables<"finance", "t_journal">["Row"];
export type TJournalItem     = Tables<"finance", "t_journal_item">["Row"];
export type TCashflowInsert  = Tables<"finance", "t_cashflow">["Insert"];
export type TPayrollHistoryInsert = Tables<"finance", "t_payroll_history">["Insert"];
export type TReimbursementInsert = Tables<"finance", "t_reimbursement">["Insert"];
export type MCoaInsert            = Tables<"finance", "m_coa">["Insert"];
export type TJournalInsert        = Tables<"finance", "t_journal">["Insert"];
export type TJournalItemInsert    = Tables<"finance", "t_journal_item">["Insert"];
export type TInvoice              = Tables<"finance", "t_invoice">["Row"];
export type TInvoiceInsert        = Tables<"finance", "t_invoice">["Insert"];
export type TInvoiceItem          = Tables<"finance", "t_invoice_item">["Row"];
export type TInvoiceItemInsert    = Tables<"finance", "t_invoice_item">["Insert"];
export type TUtangPiutang         = Tables<"finance", "t_utang_piutang">["Row"];
export type TUtangPiutangInsert   = Tables<"finance", "t_utang_piutang">["Insert"];

// production
export type TProduksiOrder = Tables<"production", "t_produksi_order">["Row"];
export type TQCInbound     = Tables<"production", "t_qc_inbound">["Row"];
export type TQCOutbound    = Tables<"production", "t_qc_outbound">["Row"];
export type TProduksiOrderInsert = Tables<"production", "t_produksi_order">["Insert"];
export type TQCInboundInsert = Tables<"production", "t_qc_inbound">["Insert"];
export type TQCOutboundInsert = Tables<"production", "t_qc_outbound">["Insert"];

// logistics
export type TLogistikManifest = Tables<"logistics", "t_logistik_manifest">["Row"];
export type TPacking          = Tables<"logistics", "t_packing">["Row"];
export type TReturnOrder      = Tables<"logistics", "t_return_order">["Row"];
export type TLogistikManifestInsert = Tables<"logistics", "t_logistik_manifest">["Insert"];
export type TPackingInsert = Tables<"logistics", "t_packing">["Insert"];
export type TReturnOrderInsert = Tables<"logistics", "t_return_order">["Insert"];

// sales
export type MAfiliator      = Tables<"sales", "m_affiliator">["Row"];
export type TContentPlanner = Tables<"sales", "t_content_planner">["Row"];
export type TLivePerformance = Tables<"sales", "t_live_performance">["Row"];
export type TContentStatistic = Tables<"sales", "t_content_statistic">["Row"] & {
  t_content_planner?: { judul: string | null } | null;
};
export type TSalesOrder      = Tables<"sales", "t_sales_order">["Row"];
export type MAfiliatorInsert = Tables<"sales", "m_affiliator">["Insert"];
export type TContentPlannerInsert = Tables<"sales", "t_content_planner">["Insert"];
export type TLivePerformanceInsert = Tables<"sales", "t_live_performance">["Insert"];
export type TContentStatisticInsert = Tables<"sales", "t_content_statistic">["Insert"];
export type TSalesOrderInsert = Tables<"sales", "t_sales_order">["Insert"];

// management
export type TBudgetRequest = Tables<"management", "t_budget_request">["Row"];
export type TKPIWeekly     = Tables<"management", "t_kpi_weekly">["Row"];
export type TBudgetRequestInsert = Tables<"management", "t_budget_request">["Insert"];
export type TKPIWeeklyInsert = Tables<"management", "t_kpi_weekly">["Insert"];
export type TPKWT = {
  id: string;
  template_type: "pkwt" | "pkwtp";
  contract_number: string;
  employee_name: string;
  employee_nik: string;
  employee_identity_number: string;
  employee_address: string;
  employee_position: string;
  employee_department: string;
  contract_start_date: string;
  contract_end_date: string | null;
  probation_months: number | null;
  probation_end_date: string | null;
  generated_content: string;
  created_at: string | null;
  updated_at: string | null;
};
