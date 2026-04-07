import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { apiJson, ensureSeedUser, loginWithUi, openRoute, uniqueTag, type SeedUser } from "./support";

const managementUser: SeedUser = {
    email: "user4@gmail.com",
    password: "12345",
    displayName: "Budi Dermawan",
    role: "Management & Strategy",
    hostSegment: "management",
};

const developerUser: SeedUser = {
    email: "dev@gmail.com",
    password: "12345",
    displayName: "Ms. Inum",
    role: "Developer",
    hostSegment: "developer",
};

let managementContext: BrowserContext;
let managementPage: Page;
let developerContext: BrowserContext;
let developerPage: Page;

test.describe.configure({ timeout: 60_000 });

async function waitForPageText(page: Page, routePath: string, expectedText: string) {
    await openRoute(page, routePath);
    await expect(page.locator("body")).toContainText(expectedText, { timeout: 15_000 });
}

async function expectPageMissingText(page: Page, routePath: string, missingText: string) {
    await openRoute(page, routePath);
    await expect(page.locator("body")).not.toContainText(missingText, { timeout: 15_000 });
}

async function createRecord<T>(page: Page, pathName: string, body: Record<string, unknown>, responseKey: string): Promise<T> {
    const activePage = developerPage ?? page;
    const payload = await apiJson<Record<string, T>>(activePage, "POST", pathName, body);
    const record = payload[responseKey];

    if (!record) {
        throw new Error(`Missing ${responseKey} in response from ${pathName}`);
    }

    return record;
}

async function updateRecord<T>(page: Page, pathName: string, id: string, body: Record<string, unknown>, responseKey: string): Promise<T> {
    const activePage = developerPage ?? page;
    const payload = await apiJson<Record<string, T>>(activePage, "PATCH", `${pathName}/${id}`, body);
    const record = payload[responseKey];

    if (!record) {
        throw new Error(`Missing ${responseKey} in response from ${pathName}/${id}`);
    }

    return record;
}

async function deleteRecord(page: Page, pathName: string, id: string) {
    const activePage = developerPage ?? page;
    await apiJson<null>(activePage, "DELETE", `${pathName}/${id}`);
}

test.describe.serial("Authenticated CRUD routes", () => {
    test.beforeAll(async ({ browser }) => {
        await ensureSeedUser(managementUser);
        await ensureSeedUser(developerUser);

        managementContext = await browser.newContext();
        managementPage = await managementContext.newPage();
        await loginWithUi(managementPage, managementUser);

        developerContext = await browser.newContext();
        developerPage = await developerContext.newPage();
        await loginWithUi(developerPage, developerUser);
    });

    test.afterAll(async () => {
        await managementContext?.close();
        await developerContext?.close();
    });

    test("core vendor data is visible on both vendor routes", async () => {
        const suffix = uniqueTag("vendor");
        const createdName = `Vendor ${suffix}`;
        const updatedName = `Vendor Updated ${suffix}`;

        const vendor = await createRecord<{ id: string; nama_vendor: string; kontak: string | null }>(managementPage, "/api/core/vendors", {
            nama_vendor: createdName,
            kontak: `${suffix}@vendor.test`,
        }, "vendor");

        try {
            await waitForPageText(managementPage, "/office/vendors", createdName);
            await waitForPageText(developerPage, "/developer/master-data/vendor", createdName);

            await updateRecord(managementPage, "/api/core/vendors", vendor.id, {
                nama_vendor: updatedName,
                kontak: `${suffix}-updated@vendor.test`,
            }, "vendor");

            await waitForPageText(managementPage, "/office/vendors", updatedName);
            await waitForPageText(developerPage, "/developer/master-data/vendor", updatedName);

            await deleteRecord(managementPage, "/api/core/vendors", vendor.id);

            await expectPageMissingText(managementPage, "/office/vendors", updatedName);
            await expectPageMissingText(developerPage, "/developer/master-data/vendor", updatedName);
        } finally {
            await deleteRecord(managementPage, "/api/core/vendors", vendor.id).catch(() => undefined);
        }
    });

    test("products and variants are visible on product routes", async () => {
        const suffix = uniqueTag("product");
        const createdProduct = `Product ${suffix}`;
        const updatedProduct = `Product Updated ${suffix}`;
        const createdVariant = `Variant ${suffix}`;
        const updatedVariant = `Variant Updated ${suffix}`;
        const sku = `SKU-${suffix}`.toUpperCase();

        const product = await createRecord<{ id: string; nama_produk: string; kategori: string | null }>(managementPage, "/api/core/products", {
            nama_produk: createdProduct,
            kategori: "Unit Test",
        }, "produk");

        const variant = await createRecord<{ id: string; product_id: string | null; nama_varian: string | null; sku: string | null; harga: number | null }>(managementPage, "/api/core/variants", {
            product_id: product.id,
            nama_varian: createdVariant,
            sku,
            harga: 125000,
        }, "varian");

        try {
            await waitForPageText(managementPage, "/office/products", createdProduct);
            await waitForPageText(developerPage, "/developer/master-data/produk", createdProduct);
            await waitForPageText(developerPage, "/developer/master-data/varian", sku);

            await updateRecord(managementPage, "/api/core/products", product.id, {
                nama_produk: updatedProduct,
                kategori: "Updated Category",
            }, "produk");

            await updateRecord(managementPage, "/api/core/variants", variant.id, {
                product_id: product.id,
                nama_varian: updatedVariant,
                sku: `${sku}-UPD`,
                harga: 155000,
            }, "varian");

            await waitForPageText(managementPage, "/office/products", updatedProduct);
            await waitForPageText(developerPage, "/developer/master-data/produk", updatedProduct);
            await waitForPageText(developerPage, "/developer/master-data/varian", `${sku}-UPD`);

            await deleteRecord(managementPage, "/api/core/variants", variant.id);
            await deleteRecord(managementPage, "/api/core/products", product.id);

            await expectPageMissingText(managementPage, "/office/products", updatedProduct);
            await expectPageMissingText(developerPage, "/developer/master-data/produk", updatedProduct);
        } finally {
            await deleteRecord(managementPage, "/api/core/variants", variant.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/core/products", product.id).catch(() => undefined);
        }
    });

    test("sales routes can render affiliates, live sessions, and orders", async () => {
        const suffix = uniqueTag("sales");
        const createdAffiliate = `Affiliator ${suffix}`;
        const updatedAffiliate = `Affiliator Updated ${suffix}`;
        const createdLivePlatform = `Platform ${suffix}`;
        const updatedLivePlatform = `Platform Updated ${suffix}`;

        const product = await createRecord<{ id: string; nama_produk: string; kategori: string | null }>(managementPage, "/api/core/products", {
            nama_produk: `Sales Product ${suffix}`,
            kategori: "Sales",
        }, "produk");

        const variant = await createRecord<{ id: string; product_id: string | null; nama_varian: string | null; sku: string | null; harga: number | null }>(managementPage, "/api/core/variants", {
            product_id: product.id,
            nama_varian: `Sales Variant ${suffix}`,
            sku: `SLS-${suffix}`.toUpperCase(),
            harga: 99000,
        }, "varian");

        const affiliate = await createRecord<{ id: string; nama: string; platform: string | null }>(managementPage, "/api/sales/affiliates", {
            nama: createdAffiliate,
            platform: "TikTok",
        }, "afiliator");

        const live = await createRecord<{ id: string; platform: string; revenue: number | null }>(managementPage, "/api/sales/live", {
            platform: createdLivePlatform,
            revenue: 2500000,
        }, "live");

        const order = await createRecord<{ id: string; varian_id: string | null; affiliator_id: string | null; quantity: number; total_price: number }>(managementPage, "/api/sales/orders", {
            varian_id: variant.id,
            affiliator_id: affiliate.id,
            quantity: 3,
            total_price: 297000,
        }, "order");

        try {
            await waitForPageText(managementPage, "/creative/affiliates", createdAffiliate);
            await waitForPageText(managementPage, "/creative/live-perf", createdLivePlatform);
            await waitForPageText(managementPage, "/creative/sales-order", `SLS-${suffix}`.toUpperCase());

            await updateRecord(managementPage, "/api/sales/affiliates", affiliate.id, {
                nama: updatedAffiliate,
                platform: "Instagram",
            }, "afiliator");

            await updateRecord(managementPage, "/api/sales/live", live.id, {
                platform: updatedLivePlatform,
                revenue: 3500000,
            }, "live");

            await updateRecord(managementPage, "/api/sales/orders", order.id, {
                varian_id: variant.id,
                affiliator_id: affiliate.id,
                quantity: 4,
                total_price: 396000,
            }, "order");

            await waitForPageText(managementPage, "/creative/affiliates", updatedAffiliate);
            await waitForPageText(managementPage, "/creative/live-perf", updatedLivePlatform);
            await waitForPageText(managementPage, "/creative/sales-order", "Sales Order History");

            const salesOrders = await apiJson<{ orders: Array<{ id: string; quantity: number; total_price: number }> }>(
                developerPage,
                "GET",
                "/api/sales/orders?page=1&limit=200",
            );
            const refreshedOrder = salesOrders.orders.find((item) => item.id === order.id);

            expect(refreshedOrder).toMatchObject({
                quantity: 4,
                total_price: 396000,
            });

            await deleteRecord(managementPage, "/api/sales/orders", order.id);
            await deleteRecord(managementPage, "/api/sales/live", live.id);
            await deleteRecord(managementPage, "/api/sales/affiliates", affiliate.id);
            await deleteRecord(managementPage, "/api/core/variants", variant.id);
            await deleteRecord(managementPage, "/api/core/products", product.id);

            await expectPageMissingText(managementPage, "/creative/affiliates", updatedAffiliate);
            await expectPageMissingText(managementPage, "/creative/live-perf", updatedLivePlatform);
        } finally {
            await deleteRecord(managementPage, "/api/sales/orders", order.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/sales/live", live.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/sales/affiliates", affiliate.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/core/variants", variant.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/core/products", product.id).catch(() => undefined);
        }
    });

    test("production and logistics routes reflect seeded workflow data", async () => {
        const suffix = uniqueTag("ops");
        const createdVendor = `Ops Vendor ${suffix}`;
        const updatedVendor = `Ops Vendor Updated ${suffix}`;
        const createdResi = `RESI-${suffix}`.toUpperCase();
        const updatedResi = `${createdResi}-UPD`;
        const createdReason = `Return reason ${suffix}`;
        const updatedReason = `Return reason updated ${suffix}`;

        const vendor = await createRecord<{ id: string; nama_vendor: string | null; kontak: string | null }>(managementPage, "/api/core/vendors", {
            nama_vendor: createdVendor,
            kontak: `${suffix}@ops.test`,
        }, "vendor");

        const product = await createRecord<{ id: string; nama_produk: string; kategori: string | null }>(managementPage, "/api/core/products", {
            nama_produk: `Ops Product ${suffix}`,
            kategori: "Operations",
        }, "produk");

        const logisticsVariant = await createRecord<{ id: string; product_id: string | null; nama_varian: string | null; sku: string | null; harga: number | null }>(managementPage, "/api/core/variants", {
            product_id: product.id,
            nama_varian: `Ops Variant ${suffix}`,
            sku: `OPS-${suffix}`.toUpperCase(),
            harga: 99000,
        }, "varian");

        const productionOrder = await createRecord<{ id: string; vendor_id: string | null; product_id: string | null; quantity: number | null; status: string | null }>(managementPage, "/api/production/orders", {
            vendor_id: vendor.id,
            product_id: product.id,
            quantity: 24,
            status: "ongoing",
        }, "order");

        const logisticsOrder = await createRecord<{ id: string; varian_id: string | null; affiliator_id: string | null; quantity: number; total_price: number }>(managementPage, "/api/sales/orders", {
            varian_id: logisticsVariant.id,
            affiliator_id: null,
            quantity: 1,
            total_price: 99000,
        }, "order");

        const packing = await createRecord<{ id: string; order_id: string | null; status: string | null }>(managementPage, "/api/logistics/packing", {
            order_id: logisticsOrder.id,
            status: "pending",
        }, "packing");

        const manifest = await createRecord<{ id: string; order_id: string | null; resi: string | null }>(managementPage, "/api/logistics/manifest", {
            order_id: logisticsOrder.id,
            resi: createdResi,
        }, "manifest");

        const returnOrder = await createRecord<{ id: string; order_id: string | null; alasan: string | null }>(managementPage, "/api/logistics/returns", {
            order_id: logisticsOrder.id,
            alasan: createdReason,
        }, "return");

        try {
            await waitForPageText(managementPage, "/produksi/orders", "Daftar Pesanan Produksi");
            await waitForPageText(managementPage, "/produksi/qc/inbound", "QC Inbound");
            await waitForPageText(managementPage, "/produksi/qc/outbound", "QC Outbound");
            await waitForPageText(managementPage, "/logistik/manifest", createdResi);
            await waitForPageText(managementPage, "/logistik/returns", createdReason);

            await updateRecord(managementPage, "/api/core/vendors", vendor.id, {
                nama_vendor: updatedVendor,
                kontak: `${suffix}-updated@ops.test`,
            }, "vendor");

            await updateRecord(managementPage, "/api/production/orders", productionOrder.id, {
                vendor_id: vendor.id,
                product_id: product.id,
                quantity: 30,
                status: "done",
            }, "order");

            const productionOrders = await apiJson<{ orders: Array<{ id: string; quantity: number | null; status: string | null }> }>(
                developerPage,
                "GET",
                "/api/production/orders?page=1&limit=200",
            );
            const refreshedProductionOrder = productionOrders.orders.find((item) => item.id === productionOrder.id);

            expect(refreshedProductionOrder).toMatchObject({
                quantity: 30,
                status: "done",
            });

            await updateRecord(managementPage, "/api/logistics/manifest", manifest.id, {
                order_id: logisticsOrder.id,
                resi: updatedResi,
            }, "manifest");

            await updateRecord(managementPage, "/api/logistics/returns", returnOrder.id, {
                order_id: logisticsOrder.id,
                alasan: updatedReason,
            }, "return");

            await waitForPageText(managementPage, "/produksi/orders", "Daftar Pesanan Produksi");
            await waitForPageText(managementPage, "/produksi/qc/inbound", "QC Inbound");
            await waitForPageText(managementPage, "/produksi/qc/outbound", "QC Outbound");
            await waitForPageText(managementPage, "/logistik/manifest", updatedResi);
            await waitForPageText(managementPage, "/logistik/returns", updatedReason);

            await deleteRecord(managementPage, "/api/logistics/returns", returnOrder.id);
            await deleteRecord(managementPage, "/api/logistics/manifest", manifest.id);
            await deleteRecord(managementPage, "/api/sales/orders", logisticsOrder.id);
            await deleteRecord(managementPage, "/api/core/variants", logisticsVariant.id);
            await deleteRecord(managementPage, "/api/production/orders", productionOrder.id);
            await deleteRecord(managementPage, "/api/core/vendors", vendor.id);
            await deleteRecord(managementPage, "/api/core/products", product.id);

            await expectPageMissingText(managementPage, "/produksi/orders", updatedVendor);
            await expectPageMissingText(managementPage, "/logistik/manifest", updatedResi);
        } finally {
            await deleteRecord(managementPage, "/api/logistics/returns", returnOrder.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/logistics/manifest", manifest.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/sales/orders", logisticsOrder.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/core/variants", logisticsVariant.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/production/orders", productionOrder.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/core/vendors", vendor.id).catch(() => undefined);
            await deleteRecord(managementPage, "/api/core/products", product.id).catch(() => undefined);
        }
    });

    test("hr and finance routes reflect employee-centered data", async () => {
        const suffix = uniqueTag("hr");
        const createdEmployee = `Employee ${suffix}`;
        const employee = await createRecord<{ id: string; profile_id: string | null; nama: string; posisi: string | null; divisi: string | null; status: string | null; gaji_pokok: number | null }>(managementPage, "/api/hr/employees", {
            email: `${suffix}@hr.test`,
            password: "HrPass123!",
            profile_id: null,
            nama: createdEmployee,
            posisi: "QA Analyst",
            divisi: "Developer",
            role: "developer",
            status: "aktif",
            gaji_pokok: 7500000,
        }, "karyawan");

        const reimburse = await createRecord<{ id: string; employee_id: string | null; amount: number | null; status: string | null }>(managementPage, "/api/finance/reimburse", {
            employee_id: employee.id,
            amount: 150000,
            status: "pending",
        }, "reimburse");

        const payroll = await createRecord<{ id: string; employee_id: string | null; bulan: string | null; total: number | null }>(managementPage, "/api/finance/payroll", {
            employee_id: employee.id,
            bulan: new Date().toISOString().slice(0, 7) + "-01",
            total: 7500000,
        }, "payroll");

        try {
            await waitForPageText(managementPage, "/hr/karyawan", createdEmployee);
            await waitForPageText(managementPage, "/hr/attendance", "Presensi Karyawan");
            await waitForPageText(managementPage, "/hr/warnings", "Manajemen Surat Peringatan (SP)");
            await waitForPageText(managementPage, "/finance/reimburse", "Rp");
            await waitForPageText(managementPage, "/finance/payroll", "Rp");
        } finally {
            await deleteRecord(managementPage, "/api/profiles", employee.profile_id ?? "").catch(() => undefined);
        }
    });

    test("management KPI route reflects seeded performance rows", async () => {
        const createdDivision = "Developer";
        const updatedDivision = "Management & Strategy";

        const kpi = await createRecord<{ id: string; minggu: string; divisi: string | null; target: number; realisasi: number }>(managementPage, "/api/management/kpi", {
            minggu: new Date().toISOString().slice(0, 10),
            divisi: createdDivision,
            target: 100,
            realisasi: 88,
        }, "kpi");

        try {
            await waitForPageText(managementPage, "/management/kpi", createdDivision);

            await updateRecord(managementPage, "/api/management/kpi", kpi.id, {
                minggu: new Date().toISOString().slice(0, 10),
                divisi: updatedDivision,
                target: 120,
                realisasi: 100,
            }, "kpi");

            await waitForPageText(managementPage, "/management/kpi", updatedDivision);

            await deleteRecord(managementPage, "/api/management/kpi", kpi.id);

            await expectPageMissingText(managementPage, "/management/kpi", updatedDivision);
        } finally {
            await deleteRecord(managementPage, "/api/management/kpi", kpi.id).catch(() => undefined);
        }
    });
});
