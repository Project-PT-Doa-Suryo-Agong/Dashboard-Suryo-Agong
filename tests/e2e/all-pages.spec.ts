import { expect, test } from "@playwright/test";
import { publicRoutes } from "./routes";

for (const route of publicRoutes) {
    test(`renders ${route.path}`, async ({ page }) => {
        await page.goto(route.path, { waitUntil: "domcontentloaded" });

        expect(new URL(page.url()).pathname).toBe(route.path);
        await expect(page.locator("body")).toContainText(route.expectedText);
    });
}
