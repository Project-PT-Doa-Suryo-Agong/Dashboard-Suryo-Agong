import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

type EnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    NEXT_PUBLIC_SITE_URL: string;
};

export type SeedUser = {
    email: string;
    password: string;
    displayName: string;
    role: "Management & Strategy" | "Developer";
    hostSegment: "management" | "developer";
};

const DEFAULT_SITE_URL = "http://lvh.me:3000";

function parseEnvFile(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) return {};

    const content = fs.readFileSync(filePath, "utf8");
    const variables: Record<string, string> = {};

    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex < 0) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        variables[key] = value;
    }

    return variables;
}

export function getEnv(): EnvVars {
    const repoRoot = process.cwd();
    const fileEnv = parseEnvFile(path.join(repoRoot, ".env.local"));

    return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY ?? "",
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? fileEnv.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
    };
}

export function getBaseUrl() {
    return getEnv().NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
}

export function getAdminClient() {
    const env = getEnv();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Missing Supabase environment variables for test setup.");
    }

    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export function uniqueTag(prefix: string) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureSeedUser(user: SeedUser) {
    const supabase = getAdminClient();
    const { data: usersResult, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (listError) {
        throw listError;
    }

    const existingUser = usersResult.users.find((item) => item.email === user.email);
    let userId = existingUser?.id;

    if (!userId) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: { role: user.role },
        });

        if (error || !data.user) {
            throw error ?? new Error(`Unable to create test user ${user.email}.`);
        }

        userId = data.user.id;
    } else {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            email_confirm: true,
            user_metadata: { role: user.role },
        });

        if (error) {
            throw error;
        }
    }

    return userId;
}

export async function apiJson<T>(
    page: Page,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    pathName: string,
    body?: unknown,
): Promise<T> {
    const response = await page.request.fetch(pathName, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        data: body,
    });

    const text = await response.text();
    let payload: { success?: boolean; data?: T; error?: { message?: string; details?: unknown } };

    try {
        payload = JSON.parse(text) as { success?: boolean; data?: T; error?: { message?: string; details?: unknown } };
    } catch {
        throw new Error(text || `Request failed: ${method} ${pathName}`);
    }

    if (!response.ok || payload.success === false) {
        const detailText = payload.error?.details ? ` | details: ${JSON.stringify(payload.error.details)}` : "";
        throw new Error(`${(payload.error?.message ?? text) || `Request failed: ${method} ${pathName}`}${detailText}`);
    }

    return payload.data as T;
}

export async function loginWithUi(page: Page, user: SeedUser) {
    const env = getEnv();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase environment variables for browser auth seeding.");
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
    });

    if (error || !data.session) {
        throw error ?? new Error(`Unable to authenticate test user ${user.email}.`);
    }

    const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
    const cookieName = `sb-${projectRef}-auth-token`;
    const cookieValue = `base64-${Buffer.from(JSON.stringify(data.session), "utf8").toString("base64url")}`;

    await page.context().addCookies([
        {
            name: cookieName,
            value: cookieValue,
            domain: ".lvh.me",
            path: "/",
            sameSite: "Lax",
            secure: false,
            httpOnly: false,
        },
    ]);
}

export async function openRoute(page: Page, routePath: string) {
    const baseUrl = getBaseUrl().replace(/\/$/, "");
    await page.goto(`${baseUrl}${routePath}`, { waitUntil: "domcontentloaded" });
}
