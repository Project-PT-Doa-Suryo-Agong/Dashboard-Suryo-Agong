"use client";

import Link from "next/link";

/* ──────────────────────────────────────────────────────
   Shared types for user manual detail pages
   ────────────────────────────────────────────────────── */

export interface ManualFeature {
  title: string;
  description: string;
}

export interface ManualStep {
  title: string;
  description: string;
}

export interface ManualSection {
  title: string;
  type: "features" | "steps" | "text";
  items?: ManualFeature[];
  steps?: ManualStep[];
  text?: string;
}

export interface ManualPageData {
  icon: string;
  title: string;
  subtitle: string;
  accent: string;
  accessLevel: string;
  accessDescription: string;
  sections: ManualSection[];
  tips?: string[];
}

/* ──────────────────────────────────────────────────────
   Reusable detail page component
   ────────────────────────────────────────────────────── */

export function UserManualDetail({ data }: { data: ManualPageData }) {
  return (
    <div className="um-page">
      {/* Topbar */}
      <nav className="um-topbar">
        <div>
          <div className="um-topbar-title">User Manual — {data.title}</div>
          <div className="um-topbar-subtitle">Dashboard PT. Doa Suryo Agong</div>
        </div>
        <div className="um-topbar-actions">
          <Link href="/doc-dsa-spr-scrt/docs/user-manual" className="um-btn um-btn-ghost">
            ← Semua Role
          </Link>
          <button className="um-btn um-btn-primary" onClick={() => window.print()}>
            🖨️ Print
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="um-content">
        <div className="um-detail">
          {/* Breadcrumb */}
          <div className="um-breadcrumb">
            <Link href="/doc-dsa-spr-scrt/docs/user-manual">User Manual</Link>
            <span>/</span>
            <span style={{ color: "#cbd5e1" }}>{data.title}</span>
          </div>

          {/* Header */}
          <div className="um-detail-header">
            <div
              className="um-detail-icon"
              style={{ background: data.accent }}
            >
              {data.icon}
            </div>
            <div>
              <h1>{data.title}</h1>
              <p>{data.subtitle}</p>
            </div>
          </div>

          {/* Access Level Info */}
          <div className="um-info-box" style={{ marginBottom: "2rem" }}>
            <div className="um-info-box-title">
              🔑 Level Akses: {data.accessLevel}
            </div>
            <p>{data.accessDescription}</p>
          </div>

          {/* Sections */}
          {data.sections.map((section, sIdx) => (
            <div key={sIdx} className="um-section">
              <div className="um-section-title">
                <span className="um-section-num">{sIdx + 1}</span>
                {section.title}
              </div>

              {section.type === "features" && section.items && (
                <div className="um-feature-list">
                  {section.items.map((item, fIdx) => (
                    <div key={fIdx} className="um-feature-item">
                      <span className="um-feature-bullet">
                        {String.fromCharCode(65 + fIdx)}
                      </span>
                      <div className="um-feature-content">
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.type === "steps" && section.steps && (
                <div className="um-steps">
                  {section.steps.map((step, stIdx) => (
                    <div key={stIdx} className="um-step">
                      <span className="um-step-num">{stIdx + 1}</span>
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.type === "text" && section.text && (
                <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  {section.text}
                </p>
              )}
            </div>
          ))}

          {/* Tips */}
          {data.tips && data.tips.length > 0 && (
            <div className="um-info-box tip">
              <div className="um-info-box-title">💡 Tips & Best Practices</div>
              {data.tips.map((tip, tIdx) => (
                <p key={tIdx} style={{ marginTop: tIdx > 0 ? "0.5rem" : 0 }}>
                  • {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
