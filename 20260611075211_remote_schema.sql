


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "core";


ALTER SCHEMA "core" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "finance";


ALTER SCHEMA "finance" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "hr";


ALTER SCHEMA "hr" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "logistics";


ALTER SCHEMA "logistics" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "management";


ALTER SCHEMA "management" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "production";


ALTER SCHEMA "production" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "sales";


ALTER SCHEMA "sales" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "core"."user_role" AS ENUM (
    'Developer',
    'Management & Strategy',
    'Finance & Administration',
    'HR & Operation Manager',
    'Produksi & Quality Control',
    'Logistics & Packing',
    'Creative & Sales',
    'Office Support',
    'Super Admin',
    'Admin'
);


ALTER TYPE "core"."user_role" OWNER TO "postgres";


CREATE TYPE "finance"."cashflow_type" AS ENUM (
    'income',
    'expense'
);


ALTER TYPE "finance"."cashflow_type" OWNER TO "postgres";


CREATE TYPE "finance"."coa_category" AS ENUM (
    'Aset',
    'Liabilitas',
    'Ekuitas',
    'Pendapatan',
    'Beban',
    'Beban Lain-lain',
    'Pendapatan Lain-lain'
);


ALTER TYPE "finance"."coa_category" OWNER TO "postgres";


CREATE TYPE "finance"."depreciation_method" AS ENUM (
    'straight_line',
    'double_declining',
    'none'
);


ALTER TYPE "finance"."depreciation_method" OWNER TO "postgres";


CREATE TYPE "finance"."reimburse_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "finance"."reimburse_status" OWNER TO "postgres";


CREATE TYPE "finance"."tipe" AS ENUM (
    'utang',
    'piutang',
    'kasbon'
);


ALTER TYPE "finance"."tipe" OWNER TO "postgres";


CREATE TYPE "finance"."tipe_kas" AS ENUM (
    'tidak',
    'kas tunai'
);


ALTER TYPE "finance"."tipe_kas" OWNER TO "postgres";


CREATE TYPE "finance"."tipe_kas_enum" AS ENUM (
    'besar',
    'kecil'
);


ALTER TYPE "finance"."tipe_kas_enum" OWNER TO "postgres";


CREATE TYPE "hr"."attendance_status" AS ENUM (
    'hadir',
    'izin',
    'sakit',
    'alpha'
);


ALTER TYPE "hr"."attendance_status" OWNER TO "postgres";


CREATE TYPE "hr"."employee_status" AS ENUM (
    'aktif',
    'nonaktif'
);


ALTER TYPE "hr"."employee_status" OWNER TO "postgres";


CREATE TYPE "hr"."yes_no" AS ENUM (
    'Ya',
    'Tidak'
);


ALTER TYPE "hr"."yes_no" OWNER TO "postgres";


CREATE TYPE "logistics"."packing_status" AS ENUM (
    'pending',
    'packed',
    'shipped'
);


ALTER TYPE "logistics"."packing_status" OWNER TO "postgres";


CREATE TYPE "logistics"."return_status" AS ENUM (
    'pending',
    'inspected',
    'restocked',
    'rejected',
    'diproses',
    'selesai'
);


ALTER TYPE "logistics"."return_status" OWNER TO "postgres";


CREATE TYPE "management"."budget_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "management"."budget_status" OWNER TO "postgres";


CREATE TYPE "production"."production_status" AS ENUM (
    'draft',
    'ongoing',
    'done'
);


ALTER TYPE "production"."production_status" OWNER TO "postgres";


CREATE TYPE "production"."qc_result" AS ENUM (
    'pass',
    'reject'
);


ALTER TYPE "production"."qc_result" OWNER TO "postgres";


CREATE TYPE "public"."status_pengunjung" AS ENUM (
    'AS GUEST (TAMU)',
    'AS TEAM'
);


ALTER TYPE "public"."status_pengunjung" OWNER TO "postgres";


CREATE TYPE "public"."sumber_informasi" AS ENUM (
    'INSTAGRAM',
    'REKOMENDASI TEMAN',
    'WEBSITE',
    'GOOGLE MAPS',
    'MEDIA OFFLINE : BROSUR, STIKER, KORAN',
    'OTHER'
);


ALTER TYPE "public"."sumber_informasi" OWNER TO "postgres";


CREATE TYPE "public"."tipe_kas" AS ENUM (
    'tidak',
    'kas tunai'
);


ALTER TYPE "public"."tipe_kas" OWNER TO "postgres";


CREATE TYPE "sales"."content_status" AS ENUM (
    'terupload',
    'direncanakan',
    'dihapus'
);


ALTER TYPE "sales"."content_status" OWNER TO "postgres";


CREATE TYPE "sales"."content_type" AS ENUM (
    'story',
    'feed',
    'video',
    'live',
    'article',
    'other'
);


ALTER TYPE "sales"."content_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."get_user_role"() RETURNS "core"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$select role from core.profiles where id = auth.uid() limit 1;$$;


ALTER FUNCTION "core"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."get_user_role_safe"() RETURNS "core"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'core'
    AS $$
  SELECT role FROM core.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "core"."get_user_role_safe"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    -- Menambahkan 'Admin' ke dalam daftar validasi
    select core.get_user_role() in ('Developer', 'Management & Strategy', 'Admin');
$$;


ALTER FUNCTION "core"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."prevent_role_escalation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Selalu kembalikan role ke nilai lama (OLD.role) agar tidak bisa diubah sembarangan
  -- melalui operasi UPDATE dari client
  NEW.role = OLD.role;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "core"."prevent_role_escalation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "core"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "core"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."fn_auto_generate_asset_schedules"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_month INT := 0;
    v_depreciation_amount NUMERIC;
    v_schedule_date DATE;
BEGIN
    -- 1. Hitung nilai penyusutan bulanan (Garis Lurus)
    v_depreciation_amount := ROUND((NEW.nilai_perolehan - NEW.nilai_residu) / NEW.masa_manfaat_bulan, 2);

    -- Pastikan nilai penyusutan valid sebelum digenerate
    IF v_depreciation_amount > 0 AND NEW.status = 'active' AND NEW.metode_penyusutan = 'straight_line' THEN
        
        -- Loop sebanyak masa manfaat bulan (misal 4 kali)
        FOR v_current_month IN 0..(NEW.masa_manfaat_bulan - 1) LOOP
            
            -- Hitung tanggal periode penyusutan (Awal bulan perolehan + X bulan)
            v_schedule_date := (DATE_TRUNC('month', NEW.tanggal_perolehan)::DATE + (v_current_month || ' month')::INTERVAL)::DATE;
            
            -- Insert langsung ke tabel schedule
            INSERT INTO finance.t_asset_depreciation_schedule (
                asset_id,
                periode,
                jumlah_penyusutan,
                journal_id,    -- NULL karena belum di-posting ke jurnal akuntansi
                is_posted,     -- Default FALSE
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                v_schedule_date,
                v_depreciation_amount,
                NULL,
                FALSE,
                NOW(),
                NOW()
            );
            
        END LOOP;
        
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "finance"."fn_auto_generate_asset_schedules"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."fn_create_journal_entry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    v_journal_id uuid;
    v_coa_debit uuid;
    v_coa_kredit uuid;
    v_no_bukti varchar;
    v_amount numeric;
    v_ref_id uuid;
BEGIN
    
    IF (TG_TABLE_NAME = 't_payroll_history') THEN
        v_no_bukti := 'PAY-' || NEW.employee_id || '-' || TO_CHAR(NEW.bulan, 'YYYYMM');
        v_coa_debit := NEW.coa_id; 
        v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
        v_amount := NEW.total;
        v_ref_id := NEW.employee_id;
        
    ELSIF (TG_TABLE_NAME = 't_reimbursement') THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
           (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved') THEN
            v_no_bukti := 'REI-' || NEW.id;
            v_coa_debit := NEW.coa_id; 
            v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
            v_amount := NEW.amount;
            v_ref_id := NEW.id;
        ELSE 
            RETURN NEW; 
        END IF;

    ELSIF (TG_TABLE_NAME = 't_budget_request') THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
           (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved') THEN
            v_no_bukti := 'BGT-' || NEW.id;
            v_coa_debit := NEW.coa_id; 
            v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
            v_amount := NEW.amount;
            v_ref_id := NEW.id;
        ELSE 
            RETURN NEW; 
        END IF;
    END IF; -- Penutup blok IF utama

    -- 2. SAFETY CHECK: JANGAN LANJUT JIKA NO BUKTI KOSONG
    IF v_no_bukti IS NULL THEN
        RETURN NEW;
    END IF;

    -- 3. PROSES INSERT KE JURNAL
    INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id)
    VALUES (v_no_bukti, CURRENT_DATE, 'Auto-journal from ' || TG_TABLE_NAME, v_ref_id)
    RETURNING id INTO v_journal_id;

    -- 4. PROSES INSERT KE JURNAL ITEM
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES 
        (v_journal_id, v_coa_debit, v_amount, 0),
        (v_journal_id, v_coa_kredit, 0, v_amount);

    -- 5. PROSES INSERT KE CASHFLOW
    INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id)
    VALUES (
        CASE 
            WHEN TG_TABLE_NAME = 't_sales_order' THEN 'income'::finance.cashflow_type 
            ELSE 'expense'::finance.cashflow_type 
        END,
        v_amount, 
        'Otomatis: ' || v_no_bukti, 
        v_journal_id
    );

    RETURN NEW;
END;$$;


ALTER FUNCTION "finance"."fn_create_journal_entry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."fn_create_monetization_journal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_journal_id uuid;
    v_coa_kas_bank uuid;
    v_coa_pendapatan_monetasi uuid;
    v_no_bukti varchar;
BEGIN
    -- 1. VALIDASI: Hanya proses jika nilai monetasi > 0
    IF (NEW.monetasi IS NULL OR NEW.monetasi <= 0) THEN
        RETURN NEW;
    END IF;

    -- 2. Ambil ID COA dengan pengaman
    SELECT id INTO v_coa_kas_bank FROM finance.m_coa WHERE kode_akun = '1101';
    SELECT id INTO v_coa_pendapatan_monetasi FROM finance.m_coa WHERE kode_akun = '4002';

    -- 3. VALIDASI COA: Jika salah satu COA tidak ditemukan, batalkan proses agar tidak error 23502
    IF (v_coa_kas_bank IS NULL OR v_coa_pendapatan_monetasi IS NULL) THEN
        -- Anda bisa memilih raise notice atau biarkan saja agar data utama tetap tersimpan
        RAISE WARNING 'Jurnal tidak terbentuk karena Kode Akun 1101 atau 4002 tidak ditemukan di finance.m_coa';
        RETURN NEW;
    END IF;

    -- 4. Persiapan No Bukti
    v_no_bukti := 'MON-' || NEW.id || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- 5. Insert Header Jurnal
    INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id)
    VALUES (v_no_bukti, CURRENT_DATE, 'Auto-journal Monetasi Konten: ' || NEW.id, NEW.id)
    RETURNING id INTO v_journal_id;

    -- 6. Insert Detail Jurnal (Debit: Kas/Bank)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_coa_kas_bank, NEW.monetasi, 0);

    -- 7. Insert Detail Jurnal (Kredit: Pendapatan)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_coa_pendapatan_monetasi, 0, NEW.monetasi);

    -- 8. Insert ke Cashflow
    INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id)
    VALUES (
        'income'::finance.cashflow_type,
        NEW.monetasi,
        'Pendapatan Monetasi Konten ID: ' || NEW.id,
        v_journal_id
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "finance"."fn_create_monetization_journal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."fn_payroll_to_cashflow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'finance'
    AS $$
BEGIN
  INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
  VALUES (
    'expense', 
    NEW.total, 
    'Pengeluaran Payroll Bulan: ' || NEW.bulan || ' - Employee ID: ' || NEW.employee_id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "finance"."fn_payroll_to_cashflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."fn_reimburse_to_cashflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Lakukan Insert HANYA jika status reimbursement = 'approved'
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved') THEN
     
     INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
     VALUES (
       'expense', 
       NEW.amount, 
       'Pengeluaran Reimbursement ID: ' || NEW.id || ' - Employee ID: ' || NEW.employee_id,
       NOW(),
       NOW()
     );
     
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "finance"."fn_reimburse_to_cashflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."generate_depreciation_schedule"("p_periode" "date") RETURNS TABLE("asset_id" "uuid", "periode" "date", "jumlah_penyusutan" numeric)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    v_asset RECORD;
    v_depreciation_amount NUMERIC;
    v_target_month_start DATE := DATE_TRUNC('month', p_periode)::DATE;
BEGIN
    -- Loop semua aset yang berstatus 'active'
    FOR v_asset IN 
        SELECT a.* FROM finance.t_asset a
        WHERE a.status = 'active'
          AND a.metode_penyusutan = 'straight_line'
          -- 1. Memastikan bulan target (p_periode) tidak sebelum bulan perolehan aset
          AND v_target_month_start >= DATE_TRUNC('month', a.tanggal_perolehan)::DATE
          -- 2. Memastikan belum melewati batas masa manfaat (bulan perolehan + masa manfaat)
          AND v_target_month_start < (DATE_TRUNC('month', a.tanggal_perolehan)::DATE + (a.masa_manfaat_bulan || ' month')::INTERVAL)::DATE
          -- 3. Memastikan untuk bulan ini belum pernah dibuat schedule-nya (mencegah duplikasi)
          AND NOT EXISTS (
              SELECT 1 FROM finance.t_asset_depreciation_schedule ads 
              WHERE ads.asset_id = a.id 
                AND DATE_TRUNC('month', ads.periode)::DATE = v_target_month_start
          )
    LOOP
        -- Hitung nilai penyusutan bulanan ($8.000.000 / 4 = 2.000.000)
        v_depreciation_amount := ROUND((v_asset.nilai_perolehan - v_asset.nilai_residu) / v_asset.masa_manfaat_bulan, 2);
        
        IF v_depreciation_amount > 0 THEN
            
            INSERT INTO finance.t_asset_depreciation_schedule (
                asset_id,
                periode,
                jumlah_penyusutan,
                journal_id,    
                is_posted,     
                created_at,
                updated_at
            ) VALUES (
                v_asset.id,
                v_target_month_start, -- Set langsung ke tanggal 1 di bulan tersebut (e.g., 2026-05-01)
                v_depreciation_amount,
                NULL,
                FALSE,
                NOW(),
                NOW()
            );

            -- Return baris yang sukses diproses
            asset_id := v_asset.id;
            periode := v_target_month_start;
            jumlah_penyusutan := v_depreciation_amount;
            RETURN NEXT;
            
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "finance"."generate_depreciation_schedule"("p_periode" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."handle_pelunasan_piutang_to_journal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_journal_id UUID;
    v_journal_number TEXT;
    v_coa_kas_id UUID;
    v_keterangan_jurnal TEXT;
    v_is_exists BOOLEAN;
    v_no_bukti_clean TEXT;
BEGIN
    -- TRIGGER CONDITION: Hanya jalan jika kolom 'kas' berubah dari NULL menjadi ada isinya
    IF OLD.kas IS NULL AND NEW.kas IS NOT NULL THEN
        
        -- Anti-Duplikasi: Pastikan jurnal untuk pelunasan piutang ini belum pernah dibuat sebelumnya
        SELECT EXISTS(
            SELECT 1 FROM finance.t_journal WHERE referensi_id = NEW.id AND keterangan LIKE 'Pelunasan otomatis%'
        ) INTO v_is_exists;

        IF v_is_exists THEN
            RETURN NEW; 
        END IF;

        -- 1. Cari ID Akun Kas/Bank di m_coa berdasarkan nilai enum/teks pada NEW.kas
        SELECT id INTO v_coa_kas_id 
        FROM finance.m_coa 
        WHERE nama_akun ILIKE '%' || NEW.kas || '%' 
           OR kode_akun = '1101.01.01.01.01'
        LIMIT 1;

        -- Jika akun kas tidak ditemukan di master COA, batalkan agar tidak terjadi error balance
        IF v_coa_kas_id IS NULL THEN
            RAISE WARNING 'Jurnal pelunasan tidak dapat dibuat karena akun COA untuk kas % tidak ditemukan.', NEW.kas;
            RETURN NEW; 
        END IF;

        -- 2. Siapkan data header jurnal pelunasan
        v_journal_id := gen_random_uuid();
        
        -- Amankan journal_number (di-cut maksimal 30 karakter agar muat di VARCHAR terkecil)
        v_journal_number := LEFT('JRN-' || TO_CHAR(CURRENT_DATE, 'MMYY') || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 5), 30);
        
        v_keterangan_jurnal := 'Pelunasan otomatis atas piutang klien: ' || COALESCE(NEW.klien, 'Pelanggan Umum');

        -- Amankan no_bukti (Di-potong tegas menggunakan LEFT agar total string maks 50 karakter)
        v_no_bukti_clean := LEFT(COALESCE(NEW.deskripsi, 'Lunas'), 35) || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 4);

        -- 3. INSERT HEADER: finance.t_journal
        INSERT INTO finance.t_journal (
            id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at
        ) VALUES (
            v_journal_id,
            v_no_bukti_clean, -- Menggunakan teks yang sudah di-trim/dipotong aman
            CURRENT_DATE,
            v_keterangan_jurnal,
            NEW.id,
            v_journal_number,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING;

        -- Memastikan baris header berhasil masuk sebelum membuat itemnya
        IF FOUND THEN
            -- 4. INSERT LINE ITEM DEBIT: Kas Penjualan
            INSERT INTO finance.t_journal_item (
                id, journal_id, coa_id, debit, kredit, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                v_journal_id,
                v_coa_kas_id,
                NEW.nominal,
                0,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );

            -- 5. INSERT LINE ITEM KREDIT: Piutang Usaha
            INSERT INTO finance.t_journal_item (
                id, journal_id, coa_id, debit, kredit, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                v_journal_id,
                NEW.coa,
                0,
                NEW.nominal,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;

    END IF;

    RETURN NEW; 
END;
$$;


ALTER FUNCTION "finance"."handle_pelunasan_piutang_to_journal"() OWNER TO "postgres";


CREATE PROCEDURE "finance"."sp_generate_monthly_depreciation_journal"()
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_journal_id UUID;
    v_journal_no VARCHAR;
    v_periode_str VARCHAR;
    
    -- Ambil waktu hari ini berdasarkan timezone aplikasi Anda
    v_hari_ini DATE := (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;
    v_akhir_bulan DATE := (DATE_TRUNC('MONTH', v_hari_ini) + INTERVAL '1 MONTH - 1 DAY')::DATE;
    
    v_schedule RECORD;
BEGIN
    v_periode_str := TO_CHAR(v_hari_ini, 'MMYY');
    
    -- PENGAMAN: Prosedur ini hanya akan mengeksekusi postingan pada hari terakhir di bulan berjalan
    IF v_hari_ini != v_akhir_bulan THEN
        RAISE NOTICE 'Prosedur diabaikan. Posting jurnal depresiasi otomatis hanya diproses pada akhir bulan (%).', v_akhir_bulan;
        RETURN;
    END IF;

    -- Ambil seluruh jadwal bulan berjalan yang BERSTATUS AKTIF dan BELUM DIPOSTING
    FOR v_schedule IN 
        SELECT 
            sch.id AS schedule_id,
            sch.jumlah_penyusutan, -- Menggunakan nilai asli dari sistem Anda, tanpa modifikasi matematika
            sch.periode,
            a.nama_aset,
            a.coa_depr_expense_id,       
            a.coa_depr_accumulation_id   
        FROM finance.t_asset_depreciation_schedule sch
        JOIN finance.t_asset a ON sch.asset_id = a.id
        WHERE a.status = 'active'
          AND sch.journal_id IS NULL 
          AND EXTRACT(MONTH FROM sch.periode) = EXTRACT(MONTH FROM v_hari_ini)
          AND EXTRACT(YEAR FROM sch.periode) = EXTRACT(YEAR FROM v_hari_ini)
    LOOP
        
        -- Jalankan posting hanya jika nilai depresiasi dari sistem Anda di atas 0
        IF v_schedule.jumlah_penyusutan > 0 THEN
            
            -- Generate Nomor Jurnal Unik per aset
            v_journal_no := 'JRN-' || v_periode_str || '-' || LPAD(NEXTVAL('finance.seq_journal_no')::TEXT, 5, '0');

            -- 1. INSERT Header Jurnal (Tanggal dipatok di hari terakhir bulan berjalan)
            INSERT INTO finance.t_journal (id, journal_number, no_bukti, tanggal, keterangan, created_at, updated_at)
            VALUES (
                gen_random_uuid(), 
                v_journal_no, 
                LEFT('BKT-DEPR-' || v_journal_no, 50),
                v_akhir_bulan, -- Tanggal Jurnal (Akhir Bulan)
                LEFT('Penyusutan Aset - ' || v_schedule.nama_aset, 100),
                NOW(),
                NOW()
            )
            RETURNING id INTO v_journal_id;

            -- 2. INSERT Rincian Debit: Beban Penyusutan
            INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
            VALUES (
                gen_random_uuid(), 
                v_journal_id, 
                v_schedule.coa_depr_expense_id, 
                v_schedule.jumlah_penyusutan, -- Nilai flat murni dari tabel schedule
                0, 
                NOW(), 
                NOW()
            );

            -- 3. INSERT Rincian Kredit: Akumulasi Penyusutan
            INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
            VALUES (
                gen_random_uuid(), 
                v_journal_id, 
                v_schedule.coa_depr_accumulation_id, 
                0, 
                v_schedule.jumlah_penyusutan, -- Nilai flat murni dari tabel schedule
                NOW(), 
                NOW()
            );
            
            -- 4. UPDATE Hubungkan tabel Schedule dengan Jurnal ID yang baru terbentuk (Status berubah jadi Terposting)
            UPDATE finance.t_asset_depreciation_schedule
            SET journal_id = v_journal_id,
                is_posted = TRUE,
                updated_at = NOW()
            WHERE id = v_schedule.schedule_id;
            
        END IF;

    END LOOP;
END;
$$;


ALTER PROCEDURE "finance"."sp_generate_monthly_depreciation_journal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "finance"."update_overdue_daily"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE finance.t_utang_piutang
    SET overdue = overdue + 1
    WHERE status != 'lunas'; -- Ganti 'lunas' sesuai dengan string status yang Anda gunakan (case-sensitive)
END;
$$;


ALTER FUNCTION "finance"."update_overdue_daily"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "logistics"."fn_auto_insert_manifest"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Cek jika status berubah menjadi 'shipped' (atau insert baru dengan status 'shipped')
    IF (NEW.status = 'shipped') THEN
        -- Pastikan belum ada resi untuk order ini agar tidak duplikat
        IF NOT EXISTS (SELECT 1 FROM logistics.t_logistik_manifest WHERE order_id = NEW.order_id) THEN
            INSERT INTO logistics.t_logistik_manifest (order_id, resi)
            VALUES (NEW.order_id, 'WAITING-FOR-RESI-' || NEW.order_id); 
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "logistics"."fn_auto_insert_manifest"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "logistics"."fn_auto_insert_packing"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO logistics.t_packing (order_id, status)
    VALUES (NEW.id, 'pending');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "logistics"."fn_auto_insert_packing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_budget_requests_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM management.t_budget_request
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_budget_requests_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_cashflow_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM finance.t_cashflow
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_cashflow_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_content_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint FROM sales.t_content_planner WHERE created_at >= start_of_month AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_content_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_invoices_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM finance.t_invoice
  WHERE tanggal >= start_of_month
  AND tanggal < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_invoices_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_journals_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM finance.t_journal
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_journals_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_kpi_weekly_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM management.t_kpi_weekly
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_kpi_weekly_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_live_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint FROM sales.t_live_performance WHERE created_at >= start_of_month AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_live_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_manifest_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint FROM logistics.t_logistik_manifest WHERE created_at >= start_of_month AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_manifest_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint FROM sales.t_sales_order WHERE created_at >= start_of_month AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_packing_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint FROM logistics.t_packing WHERE created_at >= start_of_month AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_packing_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_produksi_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM production.t_produksi_order
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_produksi_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_qc_inbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM production.t_qc_inbound
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_qc_inbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_qc_outbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM production.t_qc_outbound
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_qc_outbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_reimbursements_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint
  FROM finance.t_reimbursement
  WHERE created_at >= start_of_month
  AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_reimbursements_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_returns_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::bigint FROM logistics.t_return_order WHERE created_at >= start_of_month AND created_at < start_of_next_month;
$$;


ALTER FUNCTION "public"."count_returns_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_budget_to_cashflow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'finance'
    AS $$
BEGIN
  -- Cek kondisi approved
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved') THEN
     
     -- Pastikan nama tabel menggunakan prefix skema jika perlu
     INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
     VALUES (
       'expense', 
       NEW.amount, 
       'Budget Approved - Divisi: ' || NEW.divisi || ' (Request ID: ' || NEW.id || ')',
       NOW(),
       NOW()
     );
     
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_budget_to_cashflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_return_status_enum_values"() RETURNS "text"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT ARRAY(
    SELECT enumlabel::TEXT
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'logistics'
      AND t.typname = 'return_status'
    ORDER BY e.enumsortorder
  );
$$;


ALTER FUNCTION "public"."get_return_status_enum_values"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_sales_order_to_cashflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_target_coa_id UUID;
    v_actual_amount NUMERIC;
BEGIN
    -- Logika pemilihan COA
    IF NEW.coa_cash_id IS NOT NULL THEN
        v_target_coa_id := NEW.coa_cash_id;
    ELSE
        v_target_coa_id := NEW.coa_credit_id;
    END IF;

    -- SOLUSI AMAN: Hitung cash riil atau paksa nilai positif menggunakan ABS()
    -- Di sini kita gunakan nilai total_bayar yang diabsolutkan agar tidak melanggar constraint check
    v_actual_amount := ABS(COALESCE(NEW.total_bayar, 0));

    -- Alternatif jika total_bayar Anda masih rusak akibat trigger lain:
    -- v_actual_amount := COALESCE(NEW.jumlah_cash, 0) + COALESCE(NEW.jumlah_piutang, 0);

    -- Insert data ke t_cashflow
    INSERT INTO public.t_cashflow (
        id,
        tipe,        
        amount,      -- Nilai dijamin >= 0
        keterangan,
        created_at,
        updated_at,
        journal_id,  
        coa_id,      
        tipe_kas     
    )
    VALUES (
        gen_random_uuid(),
        'income',     
        v_actual_amount, 
        'Penerimaan kas otomatis dari Order: ' || COALESCE(NEW.order_number, 'Tanpa Nomor'),
        NOW(),
        NOW(),
        NULL,
        v_target_coa_id,
        'besar'      
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_sales_order_to_cashflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "sales"."fill_item_price"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Mengambil harga dari tabel core.varian berdasarkan id_varian yang diinput
  SELECT harga INTO NEW.harga 
  FROM core.m_varian 
  WHERE id = NEW.id_varian;
  
  -- Jika harga tidak ditemukan/null di tabel varian, set ke 0
  IF NEW.harga IS NULL THEN
    NEW.harga := 0;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "sales"."fill_item_price"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "sales"."handle_item_to_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invoice_id_text TEXT;
    v_order_record RECORD;
    v_nama_pelanggan TEXT;
    v_nama_varian TEXT;
BEGIN
    -- 1. Ambil data header dari t_sales_order
    SELECT * INTO v_order_record FROM sales.t_sales_order WHERE id = NEW.id_order;
    
    -- 2. Ambil nama pelanggan dari t_membership
    SELECT nama INTO v_nama_pelanggan FROM sales.t_membership WHERE id = v_order_record.id_pelanggan;
    IF v_nama_pelanggan IS NULL THEN v_nama_pelanggan := 'Pelanggan Umum'; END IF;

    -- 3. Ambil nama/informasi varian dari master varian (core.m_varian)
    SELECT nama_varian INTO v_nama_varian FROM core.m_varian WHERE id = NEW.id_varian;
    IF v_nama_varian IS NULL THEN v_nama_varian := 'Varian ID: ' || NEW.id_varian; END IF;

    -- 4. Cek apakah header t_invoice untuk order ini sudah dibuat oleh item sebelumnya?
    SELECT id_invoice INTO v_invoice_id_text FROM finance.t_invoice WHERE id_invoice = v_order_record.order_number;

    -- 5. Jika belum ada, buat headernya dulu
    IF v_invoice_id_text IS NULL THEN
        INSERT INTO finance.t_invoice (
            id, tanggal, jatuh_tempo, pelanggan, catatan, total_amount, id_invoice, bayar_cash, bayar_piutang
        )
        VALUES (
            gen_random_uuid(),
            CURRENT_DATE,
            CURRENT_DATE + (COALESCE(v_order_record.terms_of_payment, 0) || ' days')::INTERVAL, 
            v_nama_pelanggan,
            'Dibuat otomatis dari Sales Order: ' || v_order_record.order_number,
            v_order_record.total_bayar, -- Nilai ini sekarang aman karena kalkulasi sistem sudah selesai saat COMMIT
            v_order_record.order_number,
            v_order_record.jumlah_cash,
            v_order_record.jumlah_piutang
        );
        
        v_invoice_id_text := v_order_record.order_number;
    END IF;

    -- 6. Masukkan data item ke t_invoice_item (Mengambil NEW.harga & NEW.harga_total yang sudah matang)
    INSERT INTO finance.t_invoice_item (id_sales_order, deskripsi, id_invoice)
    VALUES (
        NEW.id_order, 
        'Produk: ' || v_nama_varian || ' | Qty: ' || NEW.qty || ' | Harga Satuan: ' || COALESCE(NEW.harga, 0) || ' | Total: ' || COALESCE(NEW.harga_total, 0), 
        v_invoice_id_text
    );

    RETURN NULL; -- Menggunakan NULL untuk AFTER trigger agar aman dari konflik interupsi data
END;
$$;


ALTER FUNCTION "sales"."handle_item_to_invoice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "sales"."handle_sales_order_to_cashflow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_target_coa_id UUID;
    v_actual_amount NUMERIC;
BEGIN
    -- 1. Tentukan COA target (Prioritaskan Cash, jika kosong gunakan Credit sebagai fallback)
    IF NEW.coa_cash_id IS NOT NULL THEN
        v_target_coa_id := NEW.coa_cash_id;
    ELSE
        v_target_coa_id := NEW.coa_credit_id;
    END IF;

    -- 2. Ambil nilai total_bayar yang sudah matang setelah hitungan diskon/sistem selesai
    -- Gunakan ABS() sebagai pengaman ekstra agar tidak memicu error constraint t_cashflow_amount_check
    v_actual_amount := ABS(COALESCE((NEW.jumlah_cash + NEW.jumlah_piutang), 0));

    -- 3. Masukkan data ke finance.t_cashflow
    INSERT INTO finance.t_cashflow (
        id,
        tipe,        
        amount,      
        keterangan,
        created_at,
        updated_at,
        journal_id,  
        coa_id,      
        tipe_kas     
    )
    VALUES (
        gen_random_uuid(),
        'income',     -- Sesuai dengan tipe cashflow_type masuk Anda
        v_actual_amount, 
        'Penerimaan kas otomatis dari Order: ' || COALESCE(NEW.order_number, 'Tanpa Nomor'),
        NOW(),
        NOW(),
        NULL,
        v_target_coa_id,
        'besar'      -- Mengisi tipe_kas enum dengan 'besar'
    );

    RETURN NULL; -- Menggunakan NULL karena ini AFTER trigger
END;
$$;


ALTER FUNCTION "sales"."handle_sales_order_to_cashflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "sales"."handle_sales_order_to_journal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_journal_id UUID;
    v_journal_number TEXT;
    v_coa_pendapatan_id UUID;
    v_keterangan_jurnal TEXT;
    v_total_debit_tercatat NUMERIC := 0;
    v_nama_pelanggan TEXT;
BEGIN
    -- Hanya jalankan jika total_bayar lebih besar dari 0 untuk menghindari jurnal kosong
    IF COALESCE(NEW.total_bayar, 0) <= 0 THEN
        RETURN NULL;
    END IF;

    -- 1. Validasi awal: Cek apakah ada minimal satu COA Debit yang valid untuk dicatat
    IF (COALESCE(NEW.jumlah_cash, 0) > 0 AND NEW.coa_cash_id IS NOT NULL) THEN
        v_total_debit_tercatat := v_total_debit_tercatat + NEW.jumlah_cash;
    END IF;

    IF (COALESCE(NEW.jumlah_piutang, 0) > 0 AND NEW.coa_credit_id IS NOT NULL) THEN
        v_total_debit_tercatat := v_total_debit_tercatat + NEW.jumlah_piutang;
    END IF;

    -- Jika tidak ada akun debit yang bisa dicatat, lewati pembuatan jurnal sepenuhnya
    IF v_total_debit_tercatat <= 0 THEN
        RETURN NULL;
    END IF;

    -- 2. Siapkan data ID dan nomor jurnal
    v_journal_id := gen_random_uuid();
    v_journal_number := 'JRN-' || TO_CHAR(CURRENT_DATE, 'MMYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    v_keterangan_jurnal := 'Pencatatan otomatis atas Sales Order: ' || NEW.order_number;

    -- 3. UTAMA: Insert ke table Header (finance.t_journal) terlebih dahulu
    INSERT INTO finance.t_journal (
        id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at
    ) VALUES (
        v_journal_id,
        NEW.order_number,
        CURRENT_DATE,
        v_keterangan_jurnal,
        NEW.id,
        v_journal_number,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- 4. INSERT LINE ITEM DEBIT (1): Cash / Tunai
    IF COALESCE(NEW.jumlah_cash, 0) > 0 AND NEW.coa_cash_id IS NOT NULL THEN
        INSERT INTO finance.t_journal_item (
            id, journal_id, coa_id, debit, kredit, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_journal_id,
            NEW.coa_cash_id,
            NEW.jumlah_cash,
            0,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 5. INSERT LINE ITEM DEBIT (2): Piutang
    IF COALESCE(NEW.jumlah_piutang, 0) > 0 AND NEW.coa_credit_id IS NOT NULL THEN
        INSERT INTO finance.t_journal_item (
            id, journal_id, coa_id, debit, kredit, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_journal_id,
            NEW.coa_credit_id,
            NEW.jumlah_piutang,
            0,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        -- =========================================================================
        -- LOGIKA BARU: PENCATATAN KE TABEL UTANG PIUTANG
        -- =========================================================================
        
        -- Ambil nama pelanggan dari tabel membership
        SELECT nama INTO v_nama_pelanggan FROM sales.t_membership WHERE id = NEW.id_pelanggan;
        IF v_nama_pelanggan IS NULL THEN 
            v_nama_pelanggan := 'Pelanggan Umum'; 
        END IF;

        INSERT INTO finance.t_utang_piutang (
            id,
            tanggal_awal,
            jatuh_tempo,
            nominal,
            klien,
            deskripsi,
            kas,            -- Menggunakan tipe_kas dari enum/informasi kas jika ada
            coa,            -- FK ke m_coa.id (menggunakan coa_credit_id dari order)
            tipe,           -- Diisi 'piutang' sesuai kebutuhan bisnis
            overdue         -- Default jumlah hari overdue awal (0)
        ) VALUES (
            gen_random_uuid(),
            CURRENT_DATE,
            CURRENT_DATE + (COALESCE(NEW.terms_of_payment, 0) || ' days')::INTERVAL,
            NEW.jumlah_piutang,
            v_nama_pelanggan,
            'Piutang dari Sales Order: ' || NEW.order_number,
            NULL,           -- Kosong karena ini transaksi piutang non-tunai, bukan kas langsung
            NEW.coa_credit_id,
            'piutang',      -- Menandakan baris data ini adalah piutang (bukan utang)
            0
        );
        -- =========================================================================
    END IF;

    -- 6. INSERT LINE ITEM KREDIT: Pendapatan Penjualan
    SELECT id INTO v_coa_pendapatan_id 
    FROM finance.m_coa 
    WHERE kode_akun = '4001' OR nama_akun ILIKE '%Pendapatan Penjualan%'
    LIMIT 1;

    -- Fallback jika master COA pendapatan tidak ditemukan
    IF v_coa_pendapatan_id IS NULL THEN
        v_coa_pendapatan_id := COALESCE(NEW.coa_cash_id, NEW.coa_credit_id);
    END IF;

    INSERT INTO finance.t_journal_item (
        id, journal_id, coa_id, debit, kredit, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        v_journal_id,
        v_coa_pendapatan_id,
        0,
        v_total_debit_tercatat,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    RETURN NULL;
END;
$$;


ALTER FUNCTION "sales"."handle_sales_order_to_journal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "sales"."sync_order_total_item"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_id_order UUID;
  v_total_item NUMERIC;
BEGIN
  -- Menentukan ID Order yang sedang dimanipulasi (Insert/Update vs Delete)
  IF TG_OP = 'DELETE' THEN
    v_id_order := OLD.id_order;
  ELSE
    v_id_order := NEW.id_order;
  END IF;

  -- Menghitung total semua harga_total untuk id_order tersebut
  SELECT COALESCE(SUM(harga_total), 0) INTO v_total_item
  FROM sales.t_item
  WHERE id_order = v_id_order;

  -- Mengupdate kolom total_item di tabel sales.t_sales_order
  UPDATE sales.t_sales_order
  SET total_item = v_total_item
  WHERE id = v_id_order;

  RETURN NULL; -- Karena ini AFTER trigger, return value tidak mempengaruhi data
END;
$$;


ALTER FUNCTION "sales"."sync_order_total_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "sales"."trg_create_content_statistic"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Cek jika status berubah menjadi 'terupload'
    IF (NEW.status = 'terupload' AND (OLD.status IS NULL OR OLD.status <> 'terupload')) THEN
        INSERT INTO sales.t_content_statistic (content_planner_id)
        VALUES (NEW.id)
        ON CONFLICT (content_planner_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "sales"."trg_create_content_statistic"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "core"."m_produk" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nama_produk" "text" NOT NULL,
    "kategori" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "foto_produk" character varying,
    "foto_url" "text"
);


ALTER TABLE "core"."m_produk" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."m_varian" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "nama_varian" "text",
    "sku" "text",
    "harga" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "m_varian_harga_check" CHECK (("harga" >= (0)::numeric))
);


ALTER TABLE "core"."m_varian" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."m_vendor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nama_vendor" "text",
    "kontak" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "core"."m_vendor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "core"."profiles" (
    "id" "uuid" NOT NULL,
    "nama" "text" NOT NULL,
    "role" "core"."user_role" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "core"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."m_coa" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kode_akun" character varying(20) NOT NULL,
    "nama_akun" character varying(100) NOT NULL,
    "kategori" "finance"."coa_category" NOT NULL,
    "is_sub_account" boolean DEFAULT false,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "finance"."m_coa" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "finance"."seq_journal_no"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "finance"."seq_journal_no" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_asset" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kode_aset" character varying NOT NULL,
    "nama_aset" character varying NOT NULL,
    "tanggal_perolehan" "date" NOT NULL,
    "nilai_perolehan" numeric DEFAULT 0 NOT NULL,
    "nilai_residu" numeric DEFAULT 0 NOT NULL,
    "masa_manfaat_bulan" integer NOT NULL,
    "metode_penyusutan" "finance"."depreciation_method" DEFAULT 'straight_line'::"finance"."depreciation_method" NOT NULL,
    "coa_asset_id" "uuid" NOT NULL,
    "coa_depr_accumulation_id" "uuid",
    "coa_depr_expense_id" "uuid",
    "journal_id" "uuid",
    "status" character varying DEFAULT 'active'::character varying NOT NULL,
    "keterangan" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "finance"."t_asset" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_asset_depreciation_schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "periode" "date" NOT NULL,
    "jumlah_penyusutan" numeric DEFAULT 0 NOT NULL,
    "journal_id" "uuid",
    "is_posted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "finance"."t_asset_depreciation_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_cashflow" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipe" "finance"."cashflow_type",
    "amount" numeric,
    "keterangan" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "journal_id" "uuid",
    "coa_id" "uuid",
    "tipe_kas" "finance"."tipe_kas_enum",
    CONSTRAINT "t_cashflow_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "finance"."t_cashflow" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_invoice" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tanggal" "date" NOT NULL,
    "jatuh_tempo" "date" NOT NULL,
    "pelanggan" character varying(255) NOT NULL,
    "catatan" "text",
    "total_amount" numeric(15,2) DEFAULT 0,
    "id_invoice" "text" NOT NULL,
    "bayar_cash" numeric(15,2) DEFAULT 0,
    "bayar_piutang" numeric(15,2) DEFAULT 0,
    "nomor_faktur_pajak" character varying(20) DEFAULT NULL::character varying
);


ALTER TABLE "finance"."t_invoice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_invoice_item" (
    "id_sales_order" "uuid" NOT NULL,
    "deskripsi" "text",
    "id_invoice" "text" NOT NULL
);


ALTER TABLE "finance"."t_invoice_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_journal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "no_bukti" character varying(50) NOT NULL,
    "tanggal" "date" DEFAULT CURRENT_DATE NOT NULL,
    "keterangan" "text",
    "referensi_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "journal_number" "text"
);


ALTER TABLE "finance"."t_journal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_journal_item" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_id" "uuid",
    "coa_id" "uuid" NOT NULL,
    "debit" numeric DEFAULT 0,
    "kredit" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_balance" CHECK ((("debit" > (0)::numeric) OR ("kredit" > (0)::numeric))),
    CONSTRAINT "t_journal_item_debit_check" CHECK (("debit" >= (0)::numeric)),
    CONSTRAINT "t_journal_item_kredit_check" CHECK (("kredit" >= (0)::numeric))
);


ALTER TABLE "finance"."t_journal_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_payroll_history" (
    "employee_id" "uuid" NOT NULL,
    "bulan" "date" NOT NULL,
    "total" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "coa_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "t_payroll_history_total_check" CHECK (("total" >= (0)::numeric))
);


ALTER TABLE "finance"."t_payroll_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_reimbursement" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "amount" numeric,
    "status" "finance"."reimburse_status" DEFAULT 'pending'::"finance"."reimburse_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bukti" "text",
    "coa_id" "uuid",
    "reimbursement_number" "text",
    CONSTRAINT "t_reimbursement_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "finance"."t_reimbursement" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "finance"."t_utang_piutang" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tanggal_awal" "date" NOT NULL,
    "jatuh_tempo" "date" NOT NULL,
    "nominal" numeric(15,2) NOT NULL,
    "klien" character varying(255) NOT NULL,
    "deskripsi" "text",
    "kas" "finance"."tipe_kas" DEFAULT 'tidak'::"finance"."tipe_kas",
    "coa" "uuid",
    "tipe" "finance"."tipe" NOT NULL,
    "overdue" integer DEFAULT 0
);


ALTER TABLE "finance"."t_utang_piutang" OWNER TO "postgres";


CREATE OR REPLACE VIEW "finance"."v_laba_rugi" AS
 SELECT "c"."kode_akun",
    "c"."nama_akun",
    "c"."kategori",
    "sum"(("ji"."kredit" - "ji"."debit")) AS "saldo"
   FROM (("finance"."m_coa" "c"
     JOIN "finance"."t_journal_item" "ji" ON (("c"."id" = "ji"."coa_id")))
     JOIN "finance"."t_journal" "j" ON (("ji"."journal_id" = "j"."id")))
  WHERE ("c"."kategori" = ANY (ARRAY['Pendapatan'::"finance"."coa_category", 'Beban'::"finance"."coa_category", 'Beban Lain-lain'::"finance"."coa_category"]))
  GROUP BY "c"."id", "c"."kode_akun", "c"."nama_akun", "c"."kategori";


ALTER VIEW "finance"."v_laba_rugi" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "hr"."m_karyawan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "nama" "text" NOT NULL,
    "posisi" "text",
    "divisi" "core"."user_role",
    "status" "hr"."employee_status" DEFAULT 'aktif'::"hr"."employee_status",
    "gaji_pokok" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "nik" character varying(16),
    "foto_perorangan_url" "text",
    "foto_ktp_url" "text",
    "foto_kk_url" "text",
    "alamat_domisili" "text",
    "nomor_whatsapp" character varying(20),
    "email_pribadi" "text",
    "pendidikan_terakhir" "text",
    "jurusan" "text",
    "pengalaman_kerja_sebelumnya" "text",
    "keahlian_khusus" "text",
    "motivasi_kerja" "text",
    "nip" character varying(16),
    CONSTRAINT "m_karyawan_gaji_pokok_check" CHECK (("gaji_pokok" >= (0)::numeric))
);


ALTER TABLE "hr"."m_karyawan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "hr"."m_sop" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "judul" "text" NOT NULL,
    "divisi" "core"."user_role" NOT NULL,
    "konten" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "hr"."m_sop" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "hr"."t_attendance" (
    "employee_id" "uuid" NOT NULL,
    "tanggal" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "hr"."attendance_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "jam_masuk" time without time zone,
    "jam_keluar" time without time zone,
    "jarak_meter" numeric,
    "is_dinas" "hr"."yes_no" DEFAULT 'Tidak'::"hr"."yes_no",
    "laporan_harian" "text"
);


ALTER TABLE "hr"."t_attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "hr"."t_employee_warning" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "level" "text",
    "alasan" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "hr"."t_employee_warning" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "hr"."t_pkwt" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_type" "text" NOT NULL,
    "contract_number" "text" NOT NULL,
    "employee_name" "text" NOT NULL,
    "employee_nik" "text" NOT NULL,
    "employee_identity_number" "text" NOT NULL,
    "employee_address" "text" NOT NULL,
    "employee_position" "text" NOT NULL,
    "employee_department" "text" NOT NULL,
    "contract_start_date" "date" NOT NULL,
    "contract_end_date" "date",
    "probation_months" integer,
    "probation_end_date" "date",
    "generated_content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "t_pkwt_template_type_check" CHECK (("template_type" = ANY (ARRAY['pkwt'::"text", 'pkwtp'::"text"])))
);


ALTER TABLE "hr"."t_pkwt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "logistics"."t_logistik_manifest" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "resi" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "manifest_number" "text"
);


ALTER TABLE "logistics"."t_logistik_manifest" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "logistics"."t_packing" (
    "order_id" "uuid" NOT NULL,
    "status" "logistics"."packing_status" DEFAULT 'pending'::"logistics"."packing_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "packing_number" "text"
);


ALTER TABLE "logistics"."t_packing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "logistics"."t_return_order" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "alasan" "text" NOT NULL,
    "status" "logistics"."return_status" DEFAULT 'pending'::"logistics"."return_status",
    "foto_bukti_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "return_number" "text"
);


ALTER TABLE "logistics"."t_return_order" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "management"."penilaian_kerja" (
    "id" integer NOT NULL,
    "penilai" "uuid" NOT NULL,
    "dinilai" "uuid" NOT NULL,
    "kepribadian_sikap" integer,
    "teamwork" integer,
    "pengetahuan_wawasan" integer,
    "komunikasi_pemasaran" integer,
    "networking_data" integer,
    "produktivitas" integer,
    "problem_solving" integer,
    "leadership" integer,
    "tanggal_penilaian" "date" DEFAULT CURRENT_DATE,
    CONSTRAINT "penilaian_kerja_kepribadian_sikap_check" CHECK ((("kepribadian_sikap" >= 1) AND ("kepribadian_sikap" <= 4))),
    CONSTRAINT "penilaian_kerja_komunikasi_pemasaran_check" CHECK ((("komunikasi_pemasaran" >= 1) AND ("komunikasi_pemasaran" <= 4))),
    CONSTRAINT "penilaian_kerja_leadership_check" CHECK ((("leadership" >= 1) AND ("leadership" <= 4))),
    CONSTRAINT "penilaian_kerja_networking_data_check" CHECK ((("networking_data" >= 1) AND ("networking_data" <= 4))),
    CONSTRAINT "penilaian_kerja_pengetahuan_wawasan_check" CHECK ((("pengetahuan_wawasan" >= 1) AND ("pengetahuan_wawasan" <= 4))),
    CONSTRAINT "penilaian_kerja_problem_solving_check" CHECK ((("problem_solving" >= 1) AND ("problem_solving" <= 4))),
    CONSTRAINT "penilaian_kerja_produktivitas_check" CHECK ((("produktivitas" >= 1) AND ("produktivitas" <= 4))),
    CONSTRAINT "penilaian_kerja_teamwork_check" CHECK ((("teamwork" >= 1) AND ("teamwork" <= 4)))
);


ALTER TABLE "management"."penilaian_kerja" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "management"."penilaian_kerja_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "management"."penilaian_kerja_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "management"."penilaian_kerja_id_seq" OWNED BY "management"."penilaian_kerja"."id";



CREATE TABLE IF NOT EXISTS "management"."t_budget_request" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "divisi" "core"."user_role",
    "amount" numeric,
    "status" "management"."budget_status" DEFAULT 'pending'::"management"."budget_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "coa_id" "uuid",
    "budget_number" "text",
    CONSTRAINT "t_budget_request_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "management"."t_budget_request" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "management"."t_kpi_weekly" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "minggu" "date",
    "divisi" "core"."user_role",
    "target" numeric,
    "realisasi" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "kpi_number" "text"
);


ALTER TABLE "management"."t_kpi_weekly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "management"."view_rekap_penilaian" AS
 SELECT "k"."nama" AS "nama_karyawan",
    "count"("p"."penilai") AS "jumlah_penilai",
    EXTRACT(month FROM "p"."tanggal_penilaian") AS "bulan",
    EXTRACT(year FROM "p"."tanggal_penilaian") AS "tahun",
    "round"("avg"(((("p"."kepribadian_sikap")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_kepribadian_persen",
    "round"("avg"(((("p"."teamwork")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_teamwork_persen",
    "round"("avg"(((("p"."pengetahuan_wawasan")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_wawasan_persen",
    "round"("avg"(((("p"."komunikasi_pemasaran")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_komunikasi_persen",
    "round"("avg"(((("p"."networking_data")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_networking_persen",
    "round"("avg"(((("p"."produktivitas")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_produktivitas_persen",
    "round"("avg"(((("p"."problem_solving")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_problem_solving_persen",
    "round"("avg"(((("p"."leadership")::numeric / 4.0) * (100)::numeric)), 2) AS "avg_leadership_persen",
    "round"("avg"((((((((((("p"."kepribadian_sikap" + "p"."teamwork") + "p"."pengetahuan_wawasan") + "p"."komunikasi_pemasaran") + "p"."networking_data") + "p"."produktivitas") + "p"."problem_solving") + "p"."leadership"))::numeric / 32.0) * (100)::numeric)), 2) AS "skor_akhir_total"
   FROM ("management"."penilaian_kerja" "p"
     JOIN "hr"."m_karyawan" "k" ON (("p"."dinilai" = "k"."id")))
  GROUP BY "k"."nama", "p"."dinilai", (EXTRACT(month FROM "p"."tanggal_penilaian")), (EXTRACT(year FROM "p"."tanggal_penilaian"))
  ORDER BY (EXTRACT(year FROM "p"."tanggal_penilaian")) DESC, (EXTRACT(month FROM "p"."tanggal_penilaian")) DESC, ("round"("avg"((((((((((("p"."kepribadian_sikap" + "p"."teamwork") + "p"."pengetahuan_wawasan") + "p"."komunikasi_pemasaran") + "p"."networking_data") + "p"."produktivitas") + "p"."problem_solving") + "p"."leadership"))::numeric / 32.0) * (100)::numeric)), 2)) DESC;


ALTER VIEW "management"."view_rekap_penilaian" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "production"."t_produksi_order" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "product_id" "uuid",
    "quantity" integer,
    "status" "production"."production_status" DEFAULT 'draft'::"production"."production_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "produksi_number" "text",
    CONSTRAINT "t_produksi_order_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "production"."t_produksi_order" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "production"."t_qc_inbound" (
    "produksi_order_id" "uuid" NOT NULL,
    "hasil" "production"."qc_result",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "qc_in_number" "text"
);


ALTER TABLE "production"."t_qc_inbound" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "production"."t_qc_outbound" (
    "produksi_order_id" "uuid" NOT NULL,
    "hasil" "production"."qc_result",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "qc_out_number" "text"
);


ALTER TABLE "production"."t_qc_outbound" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."buku_tamu" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "nama_kamu" character varying(255) NOT NULL,
    "nomor_telepon" character varying(50) NOT NULL,
    "alamat" "text",
    "keperluan" "text" NOT NULL,
    "asal_instansi" character varying(255),
    "tau_utero_darimana" character varying(100),
    "kritik_saran" "text",
    "status_hello" character varying(50) NOT NULL
);


ALTER TABLE "public"."buku_tamu" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "sales"."m_affiliator" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nama" "text",
    "platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "affiliator_number" "text"
);


ALTER TABLE "sales"."m_affiliator" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "sales"."t_content_planner" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "judul" "text",
    "platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "affiliator_id" "uuid",
    "jadwal" "date",
    "tipe" "sales"."content_type",
    "status" "sales"."content_status" DEFAULT 'direncanakan'::"sales"."content_status",
    "content_number" "text"
);


ALTER TABLE "sales"."t_content_planner" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "sales"."t_content_statistic" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_planner_id" "uuid",
    "link" "text",
    "jumlah_view" integer DEFAULT 0,
    "monetasi" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "sales"."t_content_statistic" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "sales"."t_item" (
    "id_order" "uuid" NOT NULL,
    "id_varian" "uuid" NOT NULL,
    "harga" numeric DEFAULT 0 NOT NULL,
    "qty" integer DEFAULT 1 NOT NULL,
    "harga_total" numeric GENERATED ALWAYS AS (("harga" * ("qty")::numeric)) STORED
);


ALTER TABLE "sales"."t_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "sales"."t_live_performance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "text",
    "revenue" numeric DEFAULT 0,
    "live_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "sales"."t_live_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "sales"."t_membership" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nama" "text" NOT NULL,
    "telepon" character varying(20),
    "lokasi" "text"
);


ALTER TABLE "sales"."t_membership" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "sales"."t_sales_order" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_number" "text",
    "terms_of_payment" numeric DEFAULT 0,
    "jumlah_piutang" numeric DEFAULT 0,
    "jumlah_cash" numeric DEFAULT 0,
    "diskon" numeric DEFAULT 0,
    "id_pelanggan" "uuid",
    "total_item" numeric DEFAULT 0,
    "total_bayar" numeric GENERATED ALWAYS AS (("total_item" - "diskon")) STORED,
    "coa_cash_id" "uuid",
    "coa_credit_id" "uuid"
);


ALTER TABLE "sales"."t_sales_order" OWNER TO "postgres";


ALTER TABLE ONLY "management"."penilaian_kerja" ALTER COLUMN "id" SET DEFAULT "nextval"('"management"."penilaian_kerja_id_seq"'::"regclass");



ALTER TABLE ONLY "core"."m_produk"
    ADD CONSTRAINT "m_produk_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."m_varian"
    ADD CONSTRAINT "m_varian_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."m_varian"
    ADD CONSTRAINT "m_varian_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "core"."m_vendor"
    ADD CONSTRAINT "m_vendor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "core"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."m_coa"
    ADD CONSTRAINT "m_coa_kode_akun_key" UNIQUE ("kode_akun");



ALTER TABLE ONLY "finance"."m_coa"
    ADD CONSTRAINT "m_coa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_asset_depreciation_schedule"
    ADD CONSTRAINT "t_asset_depreciation_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_asset"
    ADD CONSTRAINT "t_asset_kode_aset_key" UNIQUE ("kode_aset");



ALTER TABLE ONLY "finance"."t_asset"
    ADD CONSTRAINT "t_asset_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_cashflow"
    ADD CONSTRAINT "t_cashflow_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_invoice"
    ADD CONSTRAINT "t_invoice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_journal_item"
    ADD CONSTRAINT "t_journal_item_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_journal"
    ADD CONSTRAINT "t_journal_no_bukti_key" UNIQUE ("no_bukti");



ALTER TABLE ONLY "finance"."t_journal"
    ADD CONSTRAINT "t_journal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_payroll_history"
    ADD CONSTRAINT "t_payroll_history_pkey" PRIMARY KEY ("employee_id", "bulan");



ALTER TABLE ONLY "finance"."t_reimbursement"
    ADD CONSTRAINT "t_reimbursement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_utang_piutang"
    ADD CONSTRAINT "t_utang_piutang_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "finance"."t_asset_depreciation_schedule"
    ADD CONSTRAINT "unique_asset_period" UNIQUE ("asset_id", "periode");



ALTER TABLE ONLY "hr"."m_karyawan"
    ADD CONSTRAINT "m_karyawan_nik_key" UNIQUE ("nik");



ALTER TABLE ONLY "hr"."m_karyawan"
    ADD CONSTRAINT "m_karyawan_nip_key" UNIQUE ("nip");



ALTER TABLE ONLY "hr"."m_karyawan"
    ADD CONSTRAINT "m_karyawan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "hr"."m_sop"
    ADD CONSTRAINT "m_sop_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "hr"."t_attendance"
    ADD CONSTRAINT "t_attendance_pkey" PRIMARY KEY ("employee_id", "tanggal");



ALTER TABLE ONLY "hr"."t_employee_warning"
    ADD CONSTRAINT "t_employee_warning_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "hr"."t_pkwt"
    ADD CONSTRAINT "t_pkwt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "logistics"."t_logistik_manifest"
    ADD CONSTRAINT "t_logistik_manifest_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "logistics"."t_logistik_manifest"
    ADD CONSTRAINT "t_logistik_manifest_resi_key" UNIQUE ("resi");



ALTER TABLE ONLY "logistics"."t_packing"
    ADD CONSTRAINT "t_packing_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "logistics"."t_return_order"
    ADD CONSTRAINT "t_return_order_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "management"."penilaian_kerja"
    ADD CONSTRAINT "penilaian_kerja_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "management"."t_budget_request"
    ADD CONSTRAINT "t_budget_request_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "management"."t_kpi_weekly"
    ADD CONSTRAINT "t_kpi_weekly_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "production"."t_produksi_order"
    ADD CONSTRAINT "t_produksi_order_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "production"."t_qc_inbound"
    ADD CONSTRAINT "t_qc_inbound_pkey" PRIMARY KEY ("produksi_order_id");



ALTER TABLE ONLY "production"."t_qc_outbound"
    ADD CONSTRAINT "t_qc_outbound_pkey" PRIMARY KEY ("produksi_order_id");



ALTER TABLE ONLY "public"."buku_tamu"
    ADD CONSTRAINT "buku_tamu_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "sales"."m_affiliator"
    ADD CONSTRAINT "m_affiliator_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "sales"."t_content_planner"
    ADD CONSTRAINT "t_content_planner_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "sales"."t_content_statistic"
    ADD CONSTRAINT "t_content_statistic_content_planner_id_key" UNIQUE ("content_planner_id");



ALTER TABLE ONLY "sales"."t_content_statistic"
    ADD CONSTRAINT "t_content_statistic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "sales"."t_item"
    ADD CONSTRAINT "t_item_pkey" PRIMARY KEY ("id_order", "id_varian");



ALTER TABLE ONLY "sales"."t_live_performance"
    ADD CONSTRAINT "t_live_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "sales"."t_membership"
    ADD CONSTRAINT "t_membership_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "sales"."t_sales_order"
    ADD CONSTRAINT "t_sales_order_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "idx_id_invoice" ON "finance"."t_invoice" USING "btree" ("id_invoice");



CREATE UNIQUE INDEX "idx_journal_number" ON "finance"."t_journal" USING "btree" ("journal_number");



CREATE UNIQUE INDEX "idx_reimbursement_number" ON "finance"."t_reimbursement" USING "btree" ("reimbursement_number");



CREATE UNIQUE INDEX "idx_manifest_number" ON "logistics"."t_logistik_manifest" USING "btree" ("manifest_number");



CREATE UNIQUE INDEX "idx_packing_number" ON "logistics"."t_packing" USING "btree" ("packing_number");



CREATE UNIQUE INDEX "idx_return_number" ON "logistics"."t_return_order" USING "btree" ("return_number");



CREATE UNIQUE INDEX "idx_budget_number" ON "management"."t_budget_request" USING "btree" ("budget_number");



CREATE UNIQUE INDEX "idx_kpi_number" ON "management"."t_kpi_weekly" USING "btree" ("kpi_number");



CREATE UNIQUE INDEX "idx_penilaian_bulanan" ON "management"."penilaian_kerja" USING "btree" ("penilai", "dinilai", EXTRACT(month FROM "tanggal_penilaian"), EXTRACT(year FROM "tanggal_penilaian"));



CREATE UNIQUE INDEX "idx_produksi_number" ON "production"."t_produksi_order" USING "btree" ("produksi_number");



CREATE UNIQUE INDEX "idx_qc_in_number" ON "production"."t_qc_inbound" USING "btree" ("qc_in_number");



CREATE UNIQUE INDEX "idx_qc_out_number" ON "production"."t_qc_outbound" USING "btree" ("qc_out_number");



CREATE UNIQUE INDEX "idx_affiliator_number" ON "sales"."m_affiliator" USING "btree" ("affiliator_number");



CREATE UNIQUE INDEX "idx_content_planner_number" ON "sales"."t_content_planner" USING "btree" ("content_number");



CREATE UNIQUE INDEX "idx_live_performance_number" ON "sales"."t_live_performance" USING "btree" ("live_number");



CREATE UNIQUE INDEX "idx_sales_order_number" ON "sales"."t_sales_order" USING "btree" ("order_number");



CREATE OR REPLACE TRIGGER "tr_upd_core_m_produk" BEFORE UPDATE ON "core"."m_produk" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_core_m_varian" BEFORE UPDATE ON "core"."m_varian" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_core_m_vendor" BEFORE UPDATE ON "core"."m_vendor" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_core_profiles" BEFORE UPDATE ON "core"."profiles" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_finance_m_coa" BEFORE UPDATE ON "finance"."m_coa" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_finance_t_cashflow" BEFORE UPDATE ON "finance"."t_cashflow" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_finance_t_journal" BEFORE UPDATE ON "finance"."t_journal" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_finance_t_journal_item" BEFORE UPDATE ON "finance"."t_journal_item" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_finance_t_payroll_history" BEFORE UPDATE ON "finance"."t_payroll_history" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_finance_t_reimbursement" BEFORE UPDATE ON "finance"."t_reimbursement" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_after_asset_insert" AFTER INSERT ON "finance"."t_asset" FOR EACH ROW EXECUTE FUNCTION "finance"."fn_auto_generate_asset_schedules"();



CREATE OR REPLACE TRIGGER "trg_auto_journal_payroll" AFTER INSERT ON "finance"."t_payroll_history" FOR EACH ROW EXECUTE FUNCTION "finance"."fn_create_journal_entry"();



CREATE OR REPLACE TRIGGER "trg_auto_journal_reimburse" AFTER INSERT OR UPDATE ON "finance"."t_reimbursement" FOR EACH ROW EXECUTE FUNCTION "finance"."fn_create_journal_entry"();



CREATE OR REPLACE TRIGGER "trigger_pelunasan_piutang_to_journal" AFTER UPDATE ON "finance"."t_utang_piutang" FOR EACH ROW EXECUTE FUNCTION "finance"."handle_pelunasan_piutang_to_journal"();



CREATE OR REPLACE TRIGGER "tr_upd_hr_m_karyawan" BEFORE UPDATE ON "hr"."m_karyawan" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_logistics_t_packing" BEFORE UPDATE ON "logistics"."t_packing" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_logistics_t_return_order" BEFORE UPDATE ON "logistics"."t_return_order" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_after_packing_update_shipped" AFTER INSERT OR UPDATE OF "status" ON "logistics"."t_packing" FOR EACH ROW EXECUTE FUNCTION "logistics"."fn_auto_insert_manifest"();



CREATE OR REPLACE TRIGGER "tr_upd_management_t_budget_request" BEFORE UPDATE ON "management"."t_budget_request" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_auto_journal_budget" AFTER INSERT OR UPDATE ON "management"."t_budget_request" FOR EACH ROW EXECUTE FUNCTION "finance"."fn_create_journal_entry"();



CREATE OR REPLACE TRIGGER "tr_upd_production_t_produksi_order" BEFORE UPDATE ON "production"."t_produksi_order" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_sales_t_content_statistic" BEFORE UPDATE ON "sales"."t_content_statistic" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_upd_sales_t_sales_order" BEFORE UPDATE ON "sales"."t_sales_order" FOR EACH ROW EXECUTE FUNCTION "core"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_after_sales_order_insert" AFTER INSERT ON "sales"."t_sales_order" FOR EACH ROW EXECUTE FUNCTION "logistics"."fn_auto_insert_packing"();



CREATE OR REPLACE TRIGGER "trg_monetisasi_journal" AFTER INSERT OR UPDATE OF "monetasi" ON "sales"."t_content_statistic" FOR EACH ROW WHEN (("new"."monetasi" > (0)::numeric)) EXECUTE FUNCTION "finance"."fn_create_monetization_journal"();



CREATE OR REPLACE TRIGGER "trigger_after_upload" AFTER UPDATE ON "sales"."t_content_planner" FOR EACH ROW EXECUTE FUNCTION "sales"."trg_create_content_statistic"();



CREATE OR REPLACE TRIGGER "trigger_fill_item_price" BEFORE INSERT ON "sales"."t_item" FOR EACH ROW EXECUTE FUNCTION "sales"."fill_item_price"();



CREATE CONSTRAINT TRIGGER "trigger_item_to_invoice" AFTER INSERT ON "sales"."t_item" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "sales"."handle_item_to_invoice"();



CREATE CONSTRAINT TRIGGER "trigger_sales_order_to_cashflow" AFTER INSERT ON "sales"."t_sales_order" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "sales"."handle_sales_order_to_cashflow"();



CREATE CONSTRAINT TRIGGER "trigger_sales_order_to_journal" AFTER INSERT ON "sales"."t_sales_order" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "sales"."handle_sales_order_to_journal"();



CREATE OR REPLACE TRIGGER "trigger_sync_total_item" AFTER INSERT OR DELETE OR UPDATE ON "sales"."t_item" FOR EACH ROW EXECUTE FUNCTION "sales"."sync_order_total_item"();



ALTER TABLE ONLY "core"."m_varian"
    ADD CONSTRAINT "m_varian_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "core"."m_produk"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "core"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."m_coa"
    ADD CONSTRAINT "m_coa_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_asset"
    ADD CONSTRAINT "t_asset_coa_asset_id_fkey" FOREIGN KEY ("coa_asset_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_asset"
    ADD CONSTRAINT "t_asset_coa_depr_accumulation_id_fkey" FOREIGN KEY ("coa_depr_accumulation_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_asset"
    ADD CONSTRAINT "t_asset_coa_depr_expense_id_fkey" FOREIGN KEY ("coa_depr_expense_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_asset_depreciation_schedule"
    ADD CONSTRAINT "t_asset_depreciation_schedule_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "finance"."t_asset"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."t_asset_depreciation_schedule"
    ADD CONSTRAINT "t_asset_depreciation_schedule_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "finance"."t_journal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "finance"."t_asset"
    ADD CONSTRAINT "t_asset_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "finance"."t_journal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "finance"."t_cashflow"
    ADD CONSTRAINT "t_cashflow_coa_id_fkey" FOREIGN KEY ("coa_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_cashflow"
    ADD CONSTRAINT "t_cashflow_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "finance"."t_journal"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."t_invoice_item"
    ADD CONSTRAINT "t_invoice_item_id_invoice_fkey" FOREIGN KEY ("id_invoice") REFERENCES "finance"."t_invoice"("id_invoice") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."t_invoice_item"
    ADD CONSTRAINT "t_invoice_item_id_sales_order_fkey" FOREIGN KEY ("id_sales_order") REFERENCES "sales"."t_sales_order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."t_journal_item"
    ADD CONSTRAINT "t_journal_item_coa_id_fkey" FOREIGN KEY ("coa_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_journal_item"
    ADD CONSTRAINT "t_journal_item_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "finance"."t_journal"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."t_payroll_history"
    ADD CONSTRAINT "t_payroll_history_coa_id_fkey" FOREIGN KEY ("coa_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_payroll_history"
    ADD CONSTRAINT "t_payroll_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr"."m_karyawan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."t_reimbursement"
    ADD CONSTRAINT "t_reimbursement_coa_id_fkey" FOREIGN KEY ("coa_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "finance"."t_reimbursement"
    ADD CONSTRAINT "t_reimbursement_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr"."m_karyawan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "finance"."t_utang_piutang"
    ADD CONSTRAINT "t_utang_piutang_coa_fkey" FOREIGN KEY ("coa") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "hr"."m_karyawan"
    ADD CONSTRAINT "m_karyawan_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "hr"."t_attendance"
    ADD CONSTRAINT "t_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr"."m_karyawan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "hr"."t_employee_warning"
    ADD CONSTRAINT "t_employee_warning_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr"."m_karyawan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "logistics"."t_logistik_manifest"
    ADD CONSTRAINT "t_logistik_manifest_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales"."t_sales_order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "logistics"."t_packing"
    ADD CONSTRAINT "t_packing_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales"."t_sales_order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "logistics"."t_return_order"
    ADD CONSTRAINT "t_return_order_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales"."t_sales_order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "management"."penilaian_kerja"
    ADD CONSTRAINT "fk_dinilai" FOREIGN KEY ("dinilai") REFERENCES "hr"."m_karyawan"("id");



ALTER TABLE ONLY "management"."penilaian_kerja"
    ADD CONSTRAINT "fk_penilai" FOREIGN KEY ("penilai") REFERENCES "hr"."m_karyawan"("id");



ALTER TABLE ONLY "management"."t_budget_request"
    ADD CONSTRAINT "t_budget_request_coa_id_fkey" FOREIGN KEY ("coa_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "production"."t_produksi_order"
    ADD CONSTRAINT "t_produksi_order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "core"."m_produk"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "production"."t_produksi_order"
    ADD CONSTRAINT "t_produksi_order_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "core"."m_vendor"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "production"."t_qc_inbound"
    ADD CONSTRAINT "t_qc_inbound_produksi_order_id_fkey" FOREIGN KEY ("produksi_order_id") REFERENCES "production"."t_produksi_order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "production"."t_qc_outbound"
    ADD CONSTRAINT "t_qc_outbound_produksi_order_id_fkey" FOREIGN KEY ("produksi_order_id") REFERENCES "production"."t_produksi_order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "sales"."t_content_planner"
    ADD CONSTRAINT "t_content_planner_affiliator_id_fkey" FOREIGN KEY ("affiliator_id") REFERENCES "sales"."m_affiliator"("id");



ALTER TABLE ONLY "sales"."t_content_statistic"
    ADD CONSTRAINT "t_content_statistic_content_planner_id_fkey" FOREIGN KEY ("content_planner_id") REFERENCES "sales"."t_content_planner"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "sales"."t_item"
    ADD CONSTRAINT "t_item_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "sales"."t_sales_order"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "sales"."t_item"
    ADD CONSTRAINT "t_item_id_varian_fkey" FOREIGN KEY ("id_varian") REFERENCES "core"."m_varian"("id");



ALTER TABLE ONLY "sales"."t_sales_order"
    ADD CONSTRAINT "t_sales_order_coa_cash_fkey" FOREIGN KEY ("coa_cash_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "sales"."t_sales_order"
    ADD CONSTRAINT "t_sales_order_coa_credit_fkey" FOREIGN KEY ("coa_credit_id") REFERENCES "finance"."m_coa"("id");



ALTER TABLE ONLY "sales"."t_sales_order"
    ADD CONSTRAINT "t_sales_order_id_pelanggan_fkey" FOREIGN KEY ("id_pelanggan") REFERENCES "sales"."t_membership"("id") ON DELETE SET NULL;



CREATE POLICY "Allow Public Read Access" ON "core"."m_produk" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "core"."m_varian" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "core"."m_vendor" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "core"."profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Master: Manage" ON "core"."m_produk" USING (("core"."is_admin"() OR ("core"."get_user_role"() = 'Produksi & Quality Control'::"core"."user_role") OR ("core"."get_user_role"() = 'Logistics & Packing'::"core"."user_role") OR ("core"."get_user_role"() = 'Super Admin'::"core"."user_role")));



CREATE POLICY "Master: Manage" ON "core"."m_varian" USING (("core"."is_admin"() OR ("core"."get_user_role"() = 'Produksi & Quality Control'::"core"."user_role") OR ("core"."get_user_role"() = 'Super Admin'::"core"."user_role")));



CREATE POLICY "Master: Read all" ON "core"."m_produk" FOR SELECT USING (true);



CREATE POLICY "Master: Read all" ON "core"."m_varian" FOR SELECT USING (true);



CREATE POLICY "Profiles: HR and Admin insert" ON "core"."profiles" FOR INSERT WITH CHECK (("core"."get_user_role_safe"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Profiles: HR and Admin update" ON "core"."profiles" FOR UPDATE USING (("core"."get_user_role_safe"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Profiles: Read all for admins" ON "core"."profiles" FOR SELECT USING ((("core"."get_user_role_safe"() = 'Super Admin'::"core"."user_role") OR ("core"."get_user_role_safe"() = 'HR & Operation Manager'::"core"."user_role")));



CREATE POLICY "Profiles: Read own" ON "core"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Vendor: Manage" ON "core"."m_vendor" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Produksi & Quality Control'::"core"."user_role", 'Super Admin'::"core"."user_role"]))));



CREATE POLICY "Vendor: Read all" ON "core"."m_vendor" FOR SELECT USING (true);



ALTER TABLE "core"."m_produk" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."m_varian" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."m_vendor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "core"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow Public Read Access" ON "finance"."m_coa" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "finance"."t_cashflow" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "finance"."t_journal" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "finance"."t_journal_item" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "finance"."t_payroll_history" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "finance"."t_reimbursement" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "COA: All roles can read" ON "finance"."m_coa" FOR SELECT USING (true);



CREATE POLICY "COA: Finance and Admin access" ON "finance"."m_coa" USING (("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "COA: Full access for Finance and Dev" ON "finance"."m_coa" TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Developer'::"core"."user_role", 'Super Admin'::"core"."user_role"]))) WITH CHECK (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Developer'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "COA: Read access for all users" ON "finance"."m_coa" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Finance: Asset all" ON "finance"."t_asset" USING (("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Finance: Asset depreciation schedule all" ON "finance"."t_asset_depreciation_schedule" USING (("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Finance: Cashflow all" ON "finance"."t_cashflow" USING (("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Finance: Reimburse own/admin" ON "finance"."t_reimbursement" USING ((("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role"])) OR ("employee_id" IN ( SELECT "m_karyawan"."id"
   FROM "hr"."m_karyawan"
  WHERE ("m_karyawan"."profile_id" = "auth"."uid"()))))) WITH CHECK ((("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role"])) OR ("employee_id" IN ( SELECT "m_karyawan"."id"
   FROM "hr"."m_karyawan"
  WHERE ("m_karyawan"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Internal All" ON "finance"."t_invoice" USING (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Internal All" ON "finance"."t_invoice_item" USING (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Internal All" ON "finance"."t_utang_piutang" USING (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Journal Item: Finance and Admin access" ON "finance"."t_journal_item" USING (("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Journal Item: Full access for Finance and Dev" ON "finance"."t_journal_item" TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"]))) WITH CHECK (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Journal: Finance and Admin access" ON "finance"."t_journal" USING (("core"."get_user_role_safe"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Journal: Full access for Finance and Dev" ON "finance"."t_journal" TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"]))) WITH CHECK (("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Public Read" ON "finance"."t_invoice" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public Read" ON "finance"."t_invoice_item" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public Read" ON "finance"."t_utang_piutang" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "finance.t_payroll_history: Manage" ON "finance"."t_payroll_history" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role"]))));



CREATE POLICY "finance.t_payroll_history: Read all" ON "finance"."t_payroll_history" FOR SELECT USING (true);



ALTER TABLE "finance"."m_coa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_asset" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_asset_depreciation_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_cashflow" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_invoice" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_invoice_item" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_journal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_journal_item" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_payroll_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_reimbursement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "finance"."t_utang_piutang" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow Public Read Access" ON "hr"."m_karyawan" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "hr"."m_sop" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "hr"."t_attendance" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "hr"."t_employee_warning" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Attendance: Manager all" ON "hr"."t_attendance" USING (("core"."get_user_role"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Attendance: View self" ON "hr"."t_attendance" FOR SELECT USING ((("employee_id" IN ( SELECT "m_karyawan"."id"
   FROM "hr"."m_karyawan"
  WHERE ("m_karyawan"."profile_id" = "auth"."uid"()))) OR ("core"."get_user_role"() = 'Super Admin'::"core"."user_role")));



CREATE POLICY "HR and strategic can read all employees" ON "hr"."m_karyawan" FOR SELECT TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Super Admin'::"core"."user_role", 'Management & Strategy'::"core"."user_role", 'HR & Operation Manager'::"core"."user_role", 'Finance & Administration'::"core"."user_role"])));



CREATE POLICY "HR: Manager all" ON "hr"."m_karyawan" USING (("core"."is_admin"() OR ("core"."get_user_role"() = 'HR & Operation Manager'::"core"."user_role") OR ("core"."get_user_role"() = 'Super Admin'::"core"."user_role")));



CREATE POLICY "HR: View self" ON "hr"."m_karyawan" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "PKWT: HR and Admin access" ON "hr"."t_pkwt" USING (("core"."get_user_role_safe"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "SOP: All roles can read" ON "hr"."m_sop" FOR SELECT USING (true);



CREATE POLICY "SOP: HR and Admin access" ON "hr"."m_sop" USING (("core"."get_user_role_safe"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "SOP: Manager all" ON "hr"."m_sop" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Developer'::"core"."user_role"]))));



CREATE POLICY "SOP: View all authenticated" ON "hr"."m_sop" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Warning: Manage" ON "hr"."t_employee_warning" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['HR & Operation Manager'::"core"."user_role", 'Super Admin'::"core"."user_role"]))));



CREATE POLICY "Warning: Read all" ON "hr"."t_employee_warning" FOR SELECT USING (true);



ALTER TABLE "hr"."m_karyawan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "hr"."m_sop" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "hr"."t_attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "hr"."t_employee_warning" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "hr"."t_pkwt" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow Public Read Access" ON "logistics"."t_logistik_manifest" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "logistics"."t_packing" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "logistics"."t_return_order" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Logistics: Manage returns" ON "logistics"."t_return_order" USING (("core"."get_user_role"() = ANY (ARRAY['Logistics & Packing'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Finance & Administration'::"core"."user_role"])));



CREATE POLICY "Logistics: Staff access" ON "logistics"."t_packing" USING (("core"."get_user_role"() = ANY (ARRAY['Logistics & Packing'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Logistics: View returns" ON "logistics"."t_return_order" FOR SELECT USING (true);



CREATE POLICY "Manifest: Manage" ON "logistics"."t_logistik_manifest" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['Logistics & Packing'::"core"."user_role", 'Super Admin'::"core"."user_role"]))));



CREATE POLICY "Manifest: Read all" ON "logistics"."t_logistik_manifest" FOR SELECT USING (true);



CREATE POLICY "Packing: Manage" ON "logistics"."t_packing" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['Logistics & Packing'::"core"."user_role", 'Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role"]))));



CREATE POLICY "Packing: Read all" ON "logistics"."t_packing" FOR SELECT USING (true);



ALTER TABLE "logistics"."t_logistik_manifest" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "logistics"."t_packing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "logistics"."t_return_order" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow Public Read Access" ON "management"."t_budget_request" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "management"."t_kpi_weekly" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Mgmt: Budget admin/finance" ON "management"."t_budget_request" USING (("core"."is_admin"() OR ("core"."get_user_role"() = 'Finance & Administration'::"core"."user_role") OR ("core"."get_user_role"() = 'Super Admin'::"core"."user_role")));



CREATE POLICY "Mgmt: KPI admin" ON "management"."t_kpi_weekly" USING (("core"."is_admin"() OR ("core"."get_user_role"() = 'Super Admin'::"core"."user_role")));



ALTER TABLE "management"."penilaian_kerja" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "management"."t_budget_request" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "management"."t_kpi_weekly" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow Public Read Access" ON "production"."t_produksi_order" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "production"."t_qc_inbound" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "production"."t_qc_outbound" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Inbound: Read all" ON "production"."t_qc_inbound" FOR SELECT USING (true);



CREATE POLICY "Inbpund: Manage" ON "production"."t_qc_inbound" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Produksi & Quality Control'::"core"."user_role"]))));



CREATE POLICY "Outbound: Manage" ON "production"."t_qc_outbound" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Produksi & Quality Control'::"core"."user_role"]))));



CREATE POLICY "Outbound: Read all" ON "production"."t_qc_outbound" FOR SELECT USING (true);



CREATE POLICY "Prod: Staff access" ON "production"."t_produksi_order" USING (("core"."get_user_role"() = ANY (ARRAY['Produksi & Quality Control'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



ALTER TABLE "production"."t_produksi_order" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "production"."t_qc_inbound" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "production"."t_qc_outbound" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated read access" ON "public"."buku_tamu" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete buku_tamu" ON "public"."buku_tamu" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to select buku_tamu" ON "public"."buku_tamu" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update buku_tamu" ON "public"."buku_tamu" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow public anonymous insert to buku_tamu" ON "public"."buku_tamu" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access" ON "public"."buku_tamu" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."buku_tamu" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Affiliator: Manage" ON "sales"."m_affiliator" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role"]))));



CREATE POLICY "Affiliator: Manage" ON "sales"."t_content_planner" USING (("core"."is_admin"() OR ("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role"]))));



CREATE POLICY "Affiliator: Read all" ON "sales"."m_affiliator" FOR SELECT USING (true);



CREATE POLICY "Affiliator: Read all" ON "sales"."t_content_planner" FOR SELECT USING (true);



CREATE POLICY "Allow Public Read Access" ON "sales"."m_affiliator" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "sales"."t_content_planner" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "sales"."t_content_statistic" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "sales"."t_item" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "sales"."t_membership" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow Public Read Access" ON "sales"."t_sales_order" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Live: Staff access" ON "sales"."t_live_performance" USING (("core"."get_user_role_safe"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Finance & Administration'::"core"."user_role"])));



CREATE POLICY "Live: Staff delete" ON "sales"."t_live_performance" FOR DELETE USING (("core"."get_user_role_safe"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Live: Staff insert" ON "sales"."t_live_performance" FOR INSERT WITH CHECK (("core"."get_user_role_safe"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Live: Staff update" ON "sales"."t_live_performance" FOR UPDATE USING (("core"."get_user_role_safe"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Sales: Staff access" ON "sales"."t_item" TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Finance & Administration'::"core"."user_role", 'Logistics & Packing'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Sales: Staff access" ON "sales"."t_membership" TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Finance & Administration'::"core"."user_role", 'Logistics & Packing'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Sales: Staff access" ON "sales"."t_sales_order" FOR SELECT TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Finance & Administration'::"core"."user_role", 'Logistics & Packing'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Sales: Staff access content statistic" ON "sales"."t_content_statistic" USING (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role"]))) WITH CHECK (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Finance & Administration'::"core"."user_role", 'Super Admin'::"core"."user_role"])));



CREATE POLICY "Sales: Staff delete" ON "sales"."t_sales_order" FOR DELETE TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Sales: Staff insert" ON "sales"."t_sales_order" FOR INSERT TO "authenticated" WITH CHECK (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



CREATE POLICY "Sales: Staff update" ON "sales"."t_sales_order" FOR UPDATE TO "authenticated" USING (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"]))) WITH CHECK (("core"."get_user_role"() = ANY (ARRAY['Creative & Sales'::"core"."user_role", 'Super Admin'::"core"."user_role", 'Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role"])));



ALTER TABLE "sales"."m_affiliator" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "sales"."t_content_planner" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "sales"."t_content_statistic" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "sales"."t_item" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "sales"."t_live_performance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "sales"."t_membership" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "sales"."t_sales_order" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "finance"."t_reimbursement";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "logistics"."t_packing";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "production"."t_produksi_order";



GRANT USAGE ON SCHEMA "core" TO "authenticated";
GRANT USAGE ON SCHEMA "core" TO "anon";
GRANT USAGE ON SCHEMA "core" TO "service_role";






GRANT USAGE ON SCHEMA "finance" TO "authenticated";
GRANT USAGE ON SCHEMA "finance" TO "service_role";
GRANT USAGE ON SCHEMA "finance" TO "anon";



GRANT USAGE ON SCHEMA "hr" TO "authenticated";
GRANT USAGE ON SCHEMA "hr" TO "service_role";



GRANT USAGE ON SCHEMA "logistics" TO "authenticated";
GRANT USAGE ON SCHEMA "logistics" TO "anon";
GRANT USAGE ON SCHEMA "logistics" TO "service_role";



GRANT USAGE ON SCHEMA "management" TO "authenticated";



GRANT USAGE ON SCHEMA "production" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "sales" TO "authenticated";
GRANT USAGE ON SCHEMA "sales" TO "anon";
GRANT USAGE ON SCHEMA "sales" TO "service_role";



GRANT ALL ON FUNCTION "core"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "core"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "core"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "core"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "core"."prevent_role_escalation"() TO "authenticated";
GRANT ALL ON FUNCTION "core"."prevent_role_escalation"() TO "service_role";



GRANT ALL ON FUNCTION "core"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "core"."update_timestamp"() TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."count_budget_requests_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_budget_requests_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_budget_requests_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_cashflow_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_cashflow_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_cashflow_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_content_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_content_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_content_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_invoices_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_invoices_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_invoices_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_journals_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_journals_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_journals_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_kpi_weekly_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_kpi_weekly_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_kpi_weekly_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_live_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_live_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_live_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_manifest_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_manifest_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_manifest_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_packing_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_packing_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_packing_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_produksi_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_produksi_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_produksi_orders_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_qc_inbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_qc_inbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_qc_inbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_qc_outbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_qc_outbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_qc_outbound_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_reimbursements_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_reimbursements_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_reimbursements_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_returns_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."count_returns_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_returns_this_month"("start_of_month" timestamp with time zone, "start_of_next_month" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_budget_to_cashflow"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_budget_to_cashflow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_budget_to_cashflow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_return_status_enum_values"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_return_status_enum_values"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_return_status_enum_values"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_sales_order_to_cashflow"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_sales_order_to_cashflow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_sales_order_to_cashflow"() TO "service_role";












GRANT ALL ON TABLE "core"."m_produk" TO "authenticated";
GRANT SELECT ON TABLE "core"."m_produk" TO "service_role";
GRANT SELECT ON TABLE "core"."m_produk" TO "anon";



GRANT ALL ON TABLE "core"."m_varian" TO "authenticated";
GRANT SELECT ON TABLE "core"."m_varian" TO "service_role";
GRANT SELECT ON TABLE "core"."m_varian" TO "anon";



GRANT ALL ON TABLE "core"."m_vendor" TO "authenticated";
GRANT SELECT ON TABLE "core"."m_vendor" TO "anon";
GRANT SELECT ON TABLE "core"."m_vendor" TO "service_role";



GRANT ALL ON TABLE "core"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "core"."profiles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "core"."profiles" TO "service_role";















GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."m_coa" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."m_coa" TO "service_role";



GRANT ALL ON TABLE "finance"."t_asset" TO "service_role";
GRANT ALL ON TABLE "finance"."t_asset" TO "authenticated";



GRANT ALL ON TABLE "finance"."t_asset_depreciation_schedule" TO "service_role";
GRANT ALL ON TABLE "finance"."t_asset_depreciation_schedule" TO "authenticated";



GRANT ALL ON TABLE "finance"."t_cashflow" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."t_cashflow" TO "service_role";



GRANT ALL ON TABLE "finance"."t_invoice" TO "authenticated";
GRANT ALL ON TABLE "finance"."t_invoice" TO "anon";
GRANT ALL ON TABLE "finance"."t_invoice" TO "service_role";



GRANT ALL ON TABLE "finance"."t_invoice_item" TO "authenticated";
GRANT ALL ON TABLE "finance"."t_invoice_item" TO "anon";
GRANT ALL ON TABLE "finance"."t_invoice_item" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."t_journal" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."t_journal" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."t_journal_item" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."t_journal_item" TO "service_role";



GRANT ALL ON TABLE "finance"."t_payroll_history" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."t_payroll_history" TO "service_role";



GRANT ALL ON TABLE "finance"."t_reimbursement" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."t_reimbursement" TO "service_role";



GRANT ALL ON TABLE "finance"."t_utang_piutang" TO "authenticated";
GRANT ALL ON TABLE "finance"."t_utang_piutang" TO "anon";
GRANT ALL ON TABLE "finance"."t_utang_piutang" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "finance"."v_laba_rugi" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "finance"."v_laba_rugi" TO "service_role";



GRANT ALL ON TABLE "hr"."m_karyawan" TO "authenticated";



GRANT ALL ON TABLE "hr"."m_sop" TO "authenticated";
GRANT ALL ON TABLE "hr"."m_sop" TO "service_role";



GRANT ALL ON TABLE "hr"."t_attendance" TO "authenticated";



GRANT ALL ON TABLE "hr"."t_employee_warning" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "hr"."t_pkwt" TO "authenticated";



GRANT ALL ON TABLE "logistics"."t_logistik_manifest" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "logistics"."t_logistik_manifest" TO "service_role";



GRANT ALL ON TABLE "logistics"."t_packing" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "logistics"."t_packing" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "logistics"."t_return_order" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "logistics"."t_return_order" TO "service_role";



GRANT ALL ON TABLE "management"."penilaian_kerja" TO "authenticated";



GRANT ALL ON TABLE "management"."t_budget_request" TO "authenticated";



GRANT ALL ON TABLE "management"."t_kpi_weekly" TO "authenticated";



GRANT SELECT ON TABLE "management"."view_rekap_penilaian" TO "authenticated";



GRANT ALL ON TABLE "production"."t_produksi_order" TO "authenticated";



GRANT ALL ON TABLE "production"."t_qc_inbound" TO "authenticated";



GRANT ALL ON TABLE "production"."t_qc_outbound" TO "authenticated";



GRANT ALL ON TABLE "public"."buku_tamu" TO "anon";
GRANT ALL ON TABLE "public"."buku_tamu" TO "authenticated";
GRANT ALL ON TABLE "public"."buku_tamu" TO "service_role";



GRANT ALL ON TABLE "sales"."m_affiliator" TO "authenticated";
GRANT SELECT ON TABLE "sales"."m_affiliator" TO "anon";
GRANT SELECT ON TABLE "sales"."m_affiliator" TO "service_role";



GRANT ALL ON TABLE "sales"."t_content_planner" TO "authenticated";
GRANT SELECT ON TABLE "sales"."t_content_planner" TO "anon";
GRANT SELECT ON TABLE "sales"."t_content_planner" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "sales"."t_content_statistic" TO "authenticated";
GRANT SELECT ON TABLE "sales"."t_content_statistic" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "sales"."t_item" TO "authenticated";
GRANT SELECT ON TABLE "sales"."t_item" TO "service_role";
GRANT SELECT ON TABLE "sales"."t_item" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "sales"."t_live_performance" TO "authenticated";
GRANT SELECT ON TABLE "sales"."t_live_performance" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "sales"."t_membership" TO "authenticated";
GRANT SELECT ON TABLE "sales"."t_membership" TO "service_role";
GRANT SELECT ON TABLE "sales"."t_membership" TO "anon";



GRANT ALL ON TABLE "sales"."t_sales_order" TO "authenticated";
GRANT SELECT ON TABLE "sales"."t_sales_order" TO "anon";
GRANT SELECT,INSERT ON TABLE "sales"."t_sales_order" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "core" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "core" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "finance" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "logistics" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "logistics" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "sales" GRANT SELECT ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "sales" GRANT SELECT ON TABLES TO "service_role";


--
-- Trigger to clean up t_journal when a payroll record is deleted (cascades to t_journal_item and t_cashflow)
--
CREATE OR REPLACE FUNCTION "finance"."fn_delete_journal_entry_on_payroll_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_no_bukti varchar;
BEGIN
    v_no_bukti := 'PAY-' || OLD.employee_id || '-' || TO_CHAR(OLD.bulan, 'YYYYMM');
    DELETE FROM "finance"."t_journal" WHERE "no_bukti" = v_no_bukti;
    RETURN OLD;
END;
$$;

ALTER FUNCTION "finance"."fn_delete_journal_entry_on_payroll_delete"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trg_delete_journal_payroll" BEFORE DELETE ON "finance"."t_payroll_history" FOR EACH ROW EXECUTE FUNCTION "finance"."fn_delete_journal_entry_on_payroll_delete"();





























