"use client";

import { useState, useEffect } from "react";

/* -----------------------------
   Static reference data
------------------------------ */
const releaseTypes = [
  { id: "new-feature", name: "New Feature", color: "#DBEAFE" },
  { id: "enhancement", name: "Enhancement", color: "#E0E7FF" },
  { id: "bug-fix", name: "Bug Fix", color: "#FEE2E2" },
  { id: "dap-migration", name: "DAP Migration", color: "#F3E8FF" },
  { id: "retirement", name: "Retirement", color: "#E5E7EB" },
  { id: "platform-req", name: "Platform Requirement", color: "#CCFBF1" },
  { id: "technical-debt", name: "Technical Debt", color: "#FEF9C3" },
  { id: "planned", name: "Planned", color: "#DCFCE7" }
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface ReleaseItem {
  id: number;
  name: string;
  product: string;
  date: string;
  type: string;
}

export default function ReleaseTrackerApp() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [editingRelease, setEditingRelease] = useState<ReleaseItem | null>(null);

  const [form, setForm] = useState({ name: "", product: "", date: "", type: "" });
  const [productFilter, setProductFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  const storageKey = `releaseTracker:${selectedYear}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setReleases(stored ? JSON.parse(stored) : []);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(releases));
  }, [releases, storageKey]);

  const saveRelease = () => {
    if (!form.name || !form.date || !form.type) return;
    if (editingRelease) {
      setReleases(prev =>
        prev.map(r => (r.id === editingRelease.id ? { ...editingRelease, ...form } : r))
      );
      setEditingRelease(null);
    } else {
      setReleases(prev => [...prev, { ...form, id: Date.now() }]);
    }
    setForm({ name: "", product: "", date: "", type: "" });
  };

  const deleteRelease = (id: number) => {
    if (confirm("Are you sure you want to delete this release?")) {
      setReleases(prev => prev.filter(r => r.id !== id));
    }
  };

  const baseFiltered = releases.filter(r => {
    if (new Date(r.date).getFullYear() !== selectedYear) return false;
    if (productFilter && !r.product.toLowerCase().includes(productFilter.toLowerCase())) return false;
    return true;
  });

  const filteredReleases = baseFiltered.filter(r => {
    if (typeFilter.length && !typeFilter.includes(r.type)) return false;
    if (monthFilter !== null && new Date(r.date).getMonth() !== monthFilter) return false;
    return true;
  });

  const releaseTypeCounts = baseFiltered.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const totalYearCount = baseFiltered.length;

  /* ================================
     NEW Monthly Executive Summary
  ================================ */
  const summaryMonthIndex = monthFilter ?? new Date().getMonth();
  const monthReleases = baseFiltered.filter(
    r => new Date(r.date).getMonth() === summaryMonthIndex
  );

  const totalMonth = monthReleases.length;
  const productsImpacted = new Set(monthReleases.map(r => r.product)).size;

  const typeDistribution = releaseTypes.map(rt => {
    const count = monthReleases.filter(r => r.type === rt.id).length;
    const percent = totalMonth ? Math.round((count / totalMonth) * 100) : 0;
    return { ...rt, count, percent };
  }).filter(t => t.count > 0);

  const runChangeMap = {
    Run: ["bug-fix", "platform-req"],
    Change: ["new-feature", "enhancement"],
    Improve: ["technical-debt", "dap-migration"],
    Exit: ["retirement"]
  };

  const runChange = Object.entries(runChangeMap).map(([label, types]) => {
    const count = monthReleases.filter(r => types.includes(r.type)).length;
    const percent = totalMonth ? Math.round((count / totalMonth) * 100) : 0;
    return { label, count, percent };
  }).filter(x => x.count > 0);

  const topProducts = Object.entries(
    monthReleases.reduce<Record<string, number>>((acc, r) => {
      acc[r.product] = (acc[r.product] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>IBP Release Tracker</h1>

      {/* Toggle */}
      <button style={{ marginBottom: 16 }} onClick={() => setShowMonthlySummary(p => !p)}>
        {showMonthlySummary ? "Hide Monthly Executive Summary" : "Show Monthly Executive Summary"}
      </button>

      {showMonthlySummary && (
        <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 24 }}>
          <h2>
            Monthly Executive Summary — {MONTHS[summaryMonthIndex]} {selectedYear}
          </h2>

          {/* KPI Strip */}
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <div><strong>Total Releases</strong><br />{totalMonth}</div>
            <div><strong>Products Impacted</strong><br />{productsImpacted}</div>
            <div><strong>Release Types</strong><br />{typeDistribution.length}</div>
          </div>

          {/* Release Type Distribution */}
          <h4>Release Type Distribution</h4>
          {typeDistribution.map(t => (
            <div key={t.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12 }}>{t.name} — {t.percent}%</div>
              <div style={{ background: "#eee", height: 8 }}>
                <div style={{ width: `${t.percent}%`, height: 8, background: t.color }} />
              </div>
            </div>
          ))}

          {/* Run vs Change */}
          <h4 style={{ marginTop: 16 }}>Run vs Change</h4>
          {runChange.map(r => (
            <div key={r.label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12 }}>{r.label} — {r.percent}%</div>
              <div style={{ background: "#eee", height: 8 }}>
                <div style={{ width: `${r.percent}%`, height: 8, background: "#999" }} />
              </div>
            </div>
          ))}

          {/* Top Products */}
          <h4 style={{ marginTop: 16 }}>Top Products Impacted</h4>
          {topProducts.map(([p, c]) => (
            <div key={p}>{p}: {c}</div>
          ))}
        </div>
      )}

      {/* Everything else below remains unchanged */}
    </div>
  );
}
