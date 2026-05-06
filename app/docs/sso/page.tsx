"use client";

import { useState } from "react";
import "../docs.css";
import TabDokumentasi from "./tab-dokumentasi";
import TabKontrakApi from "./tab-kontrak-api";

const TABS = [
  { key: "dokumentasi", label: "Dokumentasi SSO" },
  { key: "kontrak-api", label: "Kontrak API Auth" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SsoDocsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dokumentasi");

  return (
    <div className="docs-page">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <nav className="docs-topbar">
        <div className="docs-topbar-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`docs-topbar-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className="docs-print-btn" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </nav>

      {/* ── Content ────────────────────────────────────────────── */}
      <main className="docs-content">
        {activeTab === "dokumentasi" && <TabDokumentasi />}
        {activeTab === "kontrak-api" && <TabKontrakApi />}
      </main>
    </div>
  );
}
