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
  | "Developer"
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

export type ProductionStatus = "draft" | "ongoing" | "done";
export type ProductionQcResult = "pass" | "reject";

export type LogisticsPackingStatus = "pending" | "packed" | "shipped";

export type ManagementBudgetStatus = "pending" | "approved" | "rejected";

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
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nama_produk: string;
          kategori?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nama_produk?: string;
          kategori?: string | null;
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
          divisi?: string | null;
          status?: HrEmployeeStatus | null;
          gaji_pokok?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      t_attendance: {
        Row: {
          id: string;
          employee_id: string | null;
          tanggal: string | null;
          status: HrAttendanceStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          tanggal?: string | null;
          status?: HrAttendanceStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          tanggal?: string | null;
          status?: HrAttendanceStatus | null;
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
      t_cashflow: {
        Row: {
          id: string;
          tipe: FinanceCashflowType | null;
          amount: number | null;
          keterangan: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tipe?: FinanceCashflowType | null;
          amount?: number | null;
          keterangan?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
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
          bulan: string | null;
          total: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          bulan?: string | null;
          total?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          bulan?: string | null;
          total?: number | null;
        };
        Relationships: [];
      };
      t_reimbursement: {
        Row: {
          id: string;
          employee_id: string | null;
          amount: number | null;
          status: FinanceReimburseStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          amount?: number | null;
          status?: FinanceReimburseStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          amount?: number | null;
          status?: FinanceReimburseStatus | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      cashflow_type: FinanceCashflowType;
      reimburse_status: FinanceReimburseStatus;
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
          id: string;
          order_id: string | null;
          status: LogisticsPackingStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          status?: LogisticsPackingStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          status?: LogisticsPackingStatus | null;
        };
        Relationships: [];
      };
      t_logistik_manifest: {
        Row: {
          id: string;
          order_id: string | null;
          resi: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          resi?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          resi?: string | null;
        };
        Relationships: [];
      };
      t_return_order: {
        Row: {
          id: string;
          order_id: string | null;
          alasan: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          alasan?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          alasan?: string | null;
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
          judul: string;
          platform: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          judul: string;
          platform?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          judul?: string;
          platform?: string | null;
        };
        Relationships: [];
      };
      t_live_performance: {
        Row: {
          id: string;
          platform: string;
          revenue: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          platform: string;
          revenue?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          platform?: string;
          revenue?: number | null;
        };
        Relationships: [];
      };
      t_sales_order: {
        Row: {
          id: string;
          varian_id: string | null;
          affiliator_id: string | null;
          quantity: number;
          total_price: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          varian_id?: string | null;
          affiliator_id?: string | null;
          quantity: number;
          total_price: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
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
          amount: number;
          status: ManagementBudgetStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          divisi: string;
          amount: number;
          status?: ManagementBudgetStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          divisi?: string;
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

// finance
export type TCashflow       = Tables<"finance", "t_cashflow">["Row"];
export type TPayrollHistory = Tables<"finance", "t_payroll_history">["Row"];
export type TReimbursement  = Tables<"finance", "t_reimbursement">["Row"];
export type TCashflowInsert = Tables<"finance", "t_cashflow">["Insert"];
export type TPayrollHistoryInsert = Tables<"finance", "t_payroll_history">["Insert"];
export type TReimbursementInsert = Tables<"finance", "t_reimbursement">["Insert"];

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
export type TSalesOrder      = Tables<"sales", "t_sales_order">["Row"];
export type MAfiliatorInsert = Tables<"sales", "m_affiliator">["Insert"];
export type TContentPlannerInsert = Tables<"sales", "t_content_planner">["Insert"];
export type TLivePerformanceInsert = Tables<"sales", "t_live_performance">["Insert"];
export type TSalesOrderInsert = Tables<"sales", "t_sales_order">["Insert"];

// management
export type TBudgetRequest = Tables<"management", "t_budget_request">["Row"];
export type TKPIWeekly     = Tables<"management", "t_kpi_weekly">["Row"];
export type TBudgetRequestInsert = Tables<"management", "t_budget_request">["Insert"];
export type TKPIWeeklyInsert = Tables<"management", "t_kpi_weekly">["Insert"];
