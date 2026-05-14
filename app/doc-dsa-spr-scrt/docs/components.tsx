"use client";

import { useState } from "react";

export function CodeBlock({ title, children }: { title: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="docs-code-wrap">
      <div className="docs-code-header">
        <span>{title}</span>
        <button className={`docs-code-copy${copied ? " copied" : ""}`} onClick={copy}>
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      </div>
      <pre className="docs-code">{children}</pre>
    </div>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MethodBadge({ method }: { method: string }) {
  const cls = `docs-method docs-method-${method.toLowerCase()}`;
  return <span className={cls}>{method}</span>;
}
