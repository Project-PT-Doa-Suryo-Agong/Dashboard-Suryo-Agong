-- 1. Master BOM (header) — 1 BOM untuk 1 Produk
CREATE TABLE IF NOT EXISTS "production"."m_bom" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "nama_resep" "text",
    "status_aktif" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "m_bom_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "m_bom_product_id_key" UNIQUE ("product_id"),
    CONSTRAINT "m_bom_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "core"."m_produk"("id") ON DELETE CASCADE
);

-- 2. Detail BOM (bahan baku + kuantitas per unit produk)
CREATE TABLE IF NOT EXISTS "production"."t_bom_item" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bom_id" "uuid" NOT NULL,
    "bahan_baku_id" "uuid" NOT NULL,
    "qty_per_unit" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "t_bom_item_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "t_bom_item_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "production"."m_bom"("id") ON DELETE CASCADE,
    CONSTRAINT "t_bom_item_bahan_baku_id_fkey" FOREIGN KEY ("bahan_baku_id") REFERENCES "production"."m_bahan_baku"("id") ON DELETE RESTRICT,
    CONSTRAINT "t_bom_item_qty_per_unit_check" CHECK (("qty_per_unit" > 0))
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE "production"."m_bom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "production"."t_bom_item" ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (mengikuti pola tabel production existing)
CREATE POLICY "Allow all operations for authenticated users on m_bom"
ON "production"."m_bom"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on t_bom_item"
ON "production"."t_bom_item"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Grant Permissions
GRANT ALL PRIVILEGES ON "production"."m_bom" TO authenticated, service_role;
GRANT ALL PRIVILEGES ON "production"."t_bom_item" TO authenticated, service_role;
