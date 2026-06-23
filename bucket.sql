INSERT INTO "storage"."buckets" (id, name, public)
VALUES
  ('employee_documents', 'employee_documents', false),
  ('reimbursements', 'reimbursements', false),
  ('products', 'products', true),
  ('returns', 'returns', false)
ON CONFLICT (id) DO NOTHING;

-- Insert Policies
CREATE POLICY "Authenticated users can upload employee documents" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'employee_documents'::"text"));
CREATE POLICY "Authenticated users can upload reimbursement proofs" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'reimbursements'::"text"));
CREATE POLICY "Authenticated users can view employee documents" ON "storage"."objects" FOR SELECT TO "authenticated" USING (("bucket_id" = 'employee_documents'::"text"));
CREATE POLICY "Izinkan delete ke products" ON "storage"."objects" FOR DELETE TO "authenticated" USING (("bucket_id" = 'products'::"text"));
CREATE POLICY "Izinkan insert ke products" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'products'::"text"));
CREATE POLICY "Izinkan update ke products" ON "storage"."objects" FOR UPDATE TO "authenticated" USING (("bucket_id" = 'products'::"text"));
CREATE POLICY "Logistik and Produksi can read return proofs" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'returns'::"text") AND (( SELECT "core"."get_user_role"() AS "get_user_role") = ANY (ARRAY['Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role", 'Logistics & Packing'::"core"."user_role", 'Produksi & Quality Control'::"core"."user_role"]))));
CREATE POLICY "Logistik can update return proofs" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'returns'::"text") AND (( SELECT "core"."get_user_role"() AS "get_user_role") = ANY (ARRAY['Developer'::"core"."user_role", 'Logistics & Packing'::"core"."user_role"]))));
CREATE POLICY "Logistik can upload return proofs" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'returns'::"text") AND (( SELECT "core"."get_user_role"() AS "get_user_role") = ANY (ARRAY['Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role", 'Logistics & Packing'::"core"."user_role"]))));
CREATE POLICY "Logistik, Produksi, Strategic can update product images" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'products'::"text") AND (( SELECT "core"."get_user_role"() AS "get_user_role") = ANY (ARRAY['Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role", 'Logistics & Packing'::"core"."user_role", 'Produksi & Quality Control'::"core"."user_role"]))));
CREATE POLICY "Logistik, Produksi, Strategic can upload product images" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'products'::"text") AND (( SELECT "core"."get_user_role"() AS "get_user_role") = ANY (ARRAY['Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role", 'Logistics & Packing'::"core"."user_role", 'Produksi & Quality Control'::"core"."user_role"]))));
CREATE POLICY "Public can view product images" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'products'::"text"));
CREATE POLICY "Strategic can delete product images" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'products'::"text") AND ( SELECT "core"."is_admin"() AS "is_admin")));
CREATE POLICY "Strategic can delete return proofs" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'returns'::"text") AND ( SELECT "core"."is_admin"() AS "is_admin")));
CREATE POLICY "Users can delete own reimbursement proofs" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'reimbursements'::"text") AND ("auth"."uid"() = "owner")));
CREATE POLICY "Users can read own reimbursement proofs or Finance/Strategic ca" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'reimbursements'::"text") AND (("auth"."uid"() = "owner") OR (( SELECT "core"."get_user_role"() AS "get_user_role") = ANY (ARRAY['Developer'::"core"."user_role", 'Management & Strategy'::"core"."user_role", 'Finance & Administration'::"core"."user_role"])))));
CREATE POLICY "Users can update their own uploads" ON "storage"."objects" FOR UPDATE TO "authenticated" USING (("bucket_id" = 'employee_documents'::"text"));
CREATE POLICY "Users can upload reimbursements" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'reimbursements'::"text") AND (( SELECT "core"."get_user_role"() AS "get_user_role") IS NOT NULL)));