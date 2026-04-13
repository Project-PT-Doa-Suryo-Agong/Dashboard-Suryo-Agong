-- 1. Table logistik manifest
ALTER TABLE logistics.t_logistik_manifest DROP COLUMN IF EXISTS id;
-- IF order_id was nullable, we need to make it NOT NULL
ALTER TABLE logistics.t_logistik_manifest ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE logistics.t_logistik_manifest ADD PRIMARY KEY (order_id);

-- 2. Table packing
ALTER TABLE logistics.t_packing DROP COLUMN IF EXISTS id;
ALTER TABLE logistics.t_packing ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE logistics.t_packing ADD PRIMARY KEY (order_id);

-- 3. Table return_order
ALTER TABLE logistics.t_return_order DROP COLUMN IF EXISTS id;
ALTER TABLE logistics.t_return_order ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE logistics.t_return_order ADD PRIMARY KEY (order_id);
