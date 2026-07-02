-- ============================================================================
-- SQL Migration: Pencatatan, Pelacakan, dan Manajemen Alokasi Bahan Baku
-- Schema: production
-- ============================================================================

-- 1. Master Bahan Baku
CREATE TABLE IF NOT EXISTS "production"."m_bahan_baku" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kode_bahan" "text" NOT NULL,
    "nama_bahan" "text" NOT NULL,
    "kategori" "text",
    "satuan" "text" NOT NULL,
    "stok" numeric DEFAULT 0 NOT NULL,
    "minimum_stok" numeric DEFAULT 0 NOT NULL,
    "status_aktif" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "m_bahan_baku_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "m_bahan_baku_kode_bahan_key" UNIQUE ("kode_bahan"),
    CONSTRAINT "m_bahan_baku_stok_check" CHECK (("stok" >= 0)),
    CONSTRAINT "m_bahan_baku_minimum_stok_check" CHECK (("minimum_stok" >= 0))
);

-- 2. Mutasi Stok (Barang Masuk / Keluar / Alokasi Produksi)
CREATE TABLE IF NOT EXISTS "production"."t_stok_mutasi" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bahan_baku_id" "uuid" NOT NULL,
    "produksi_order_id" "uuid", -- Hubungan ke order produksi jika tipe = 'produksi'
    "tipe" "text" NOT NULL,
    "jumlah" numeric NOT NULL,
    "keterangan" "text",
    "operator" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "t_stok_mutasi_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "t_stok_mutasi_bahan_baku_id_fkey" FOREIGN KEY ("bahan_baku_id") REFERENCES "production"."m_bahan_baku"("id") ON DELETE RESTRICT,
    CONSTRAINT "t_stok_mutasi_produksi_order_id_fkey" FOREIGN KEY ("produksi_order_id") REFERENCES "production"."t_produksi_order"("id") ON DELETE SET NULL,
    CONSTRAINT "t_stok_mutasi_tipe_check" CHECK (("tipe" IN ('masuk', 'keluar', 'produksi'))),
    CONSTRAINT "t_stok_mutasi_jumlah_check" CHECK (("jumlah" > 0))
);

-- 3. Detail Alokasi Bahan Baku ke Produksi (Many to Many)
CREATE TABLE IF NOT EXISTS "production"."t_produksi_bahan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "produksi_order_id" "uuid" NOT NULL,
    "bahan_baku_id" "uuid" NOT NULL,
    "jumlah" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "t_produksi_bahan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "t_produksi_bahan_produksi_order_id_fkey" FOREIGN KEY ("produksi_order_id") REFERENCES "production"."t_produksi_order"("id") ON DELETE CASCADE,
    CONSTRAINT "t_produksi_bahan_bahan_baku_id_fkey" FOREIGN KEY ("bahan_baku_id") REFERENCES "production"."m_bahan_baku"("id") ON DELETE RESTRICT,
    CONSTRAINT "t_produksi_bahan_jumlah_check" CHECK (("jumlah" > 0))
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE "production"."m_bahan_baku" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "production"."t_stok_mutasi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "production"."t_produksi_bahan" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Allow all operations for authenticated users on m_bahan_baku" 
ON "production"."m_bahan_baku" 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on t_stok_mutasi" 
ON "production"."t_stok_mutasi" 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on t_produksi_bahan" 
ON "production"."t_produksi_bahan" 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 6. Trigger: Update stok otomatis di m_bahan_baku saat ada record baru di t_stok_mutasi
CREATE OR REPLACE FUNCTION production.tr_update_bahan_baku_stok()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipe = 'masuk' THEN
    UPDATE production.m_bahan_baku
    SET stok = stok + NEW.jumlah,
        updated_at = now()
    WHERE id = NEW.bahan_baku_id;
  ELSIF NEW.tipe IN ('keluar', 'produksi') THEN
    UPDATE production.m_bahan_baku
    SET stok = stok - NEW.jumlah,
        updated_at = now()
    WHERE id = NEW.bahan_baku_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_stok_mutasi_after_insert
AFTER INSERT ON production.t_stok_mutasi
FOR EACH ROW
EXECUTE FUNCTION production.tr_update_bahan_baku_stok();

-- 7. Trigger: Pengembalian stok otomatis ketika t_produksi_bahan dihapus
CREATE OR REPLACE FUNCTION production.tr_restore_bahan_baku_stok()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO production.t_stok_mutasi (bahan_baku_id, tipe, jumlah, keterangan, operator)
  VALUES (OLD.bahan_baku_id, 'masuk', OLD.jumlah, 'Pengembalian Stok (Alokasi Produksi Batal/Dihapus)', 'System');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_produksi_bahan_after_delete
AFTER DELETE ON production.t_produksi_bahan
FOR EACH ROW
EXECUTE FUNCTION production.tr_restore_bahan_baku_stok();

-- 8. RPC: Transaksi Pembuatan Produksi Baru dengan Bahan Baku
CREATE OR REPLACE FUNCTION production.create_production_order_with_materials(
  p_vendor_id UUID,
  p_product_id UUID,
  p_quantity INT,
  p_status production.production_status,
  p_produksi_number TEXT,
  p_materials JSONB, -- [{"bahan_baku_id": "...", "jumlah": 10}]
  p_operator TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_produksi_order_id UUID;
  v_item JSONB;
  v_bahan_id UUID;
  v_jumlah numeric;
  v_res JSONB;
BEGIN
  -- A. Insert order produksi
  INSERT INTO production.t_produksi_order (
    vendor_id, product_id, quantity, status, produksi_number
  ) VALUES (
    p_vendor_id, p_product_id, p_quantity, p_status, p_produksi_number
  ) RETURNING id INTO v_produksi_order_id;

  -- B. Loop untuk menyimpan alokasi bahan baku dan mengurangi stok
  IF p_materials IS NOT NULL AND jsonb_array_length(p_materials) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_materials) LOOP
      v_bahan_id := (v_item->>'bahan_baku_id')::UUID;
      v_jumlah := (v_item->>'jumlah')::numeric;

      -- Validasi kecukupan stok
      IF (SELECT stok FROM production.m_bahan_baku WHERE id = v_bahan_id) < v_jumlah THEN
        RAISE EXCEPTION 'Stok bahan baku % tidak mencukupi.', (SELECT nama_bahan FROM production.m_bahan_baku WHERE id = v_bahan_id);
      END IF;

      -- Simpan ke tabel detail alokasi
      INSERT INTO production.t_produksi_bahan (
        produksi_order_id, bahan_baku_id, jumlah
      ) VALUES (
        v_produksi_order_id, v_bahan_id, v_jumlah
      );

      -- Log mutasi (tr_update_bahan_baku_stok akan otomatis mengurangi stok di m_bahan_baku)
      INSERT INTO production.t_stok_mutasi (
        bahan_baku_id, produksi_order_id, tipe, jumlah, keterangan, operator
      ) VALUES (
        v_bahan_id, v_produksi_order_id, 'produksi', v_jumlah, 'Alokasi Produksi ' || p_produksi_number, p_operator
      );
    END LOOP;
  END IF;

  SELECT json_build_object(
    'success', true,
    'id', v_produksi_order_id,
    'produksi_number', p_produksi_number
  ) INTO v_res;

  RETURN v_res;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant Permissions to authenticated and anon role just to be safe
GRANT ALL PRIVILEGES ON "production"."m_bahan_baku" TO authenticated, service_role;
GRANT ALL PRIVILEGES ON "production"."t_stok_mutasi" TO authenticated, service_role;
GRANT ALL PRIVILEGES ON "production"."t_produksi_bahan" TO authenticated, service_role;
