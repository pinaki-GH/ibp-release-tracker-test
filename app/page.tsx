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
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [editingRelease, setEditingRelease] = useState<ReleaseItem | null>(null);

  const [form, setForm] = useState({ name: "", product: "", date: "", type: "" });
  const [productFilter, setProductFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);

  const storageKey = `releaseTracker:${selectedYear}`;

  /* Load */
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setReleases(stored ? JSON.parse(stored) : []);
  }, [storageKey]);

  /* Persist */
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(releases));
  }, [releases, storageKey]);

  /* Save */
  const saveRelease = () => {
    if (!form.name || !form.date || !form.type) return;

    if (editingRelease) {
      setReleases(r =>
        r.map(x => (x.id === editingRelease.id ? { ...editingRelease, ...form } : x))
      );
      setEditingRelease(null);
    } else {
      setReleases(r => [...r, { ...form, id: Date.now() }]);
    }

    setForm({ name: "", product: "", date: "", type: "" });
  };

  const deleteRelease = (id: number) => {
    if (window.confirm("Delete this release?")) {
      setReleases(r => r.filter(x => x.id !== id));
    }
  };

  /* Base filtered (year + product) */
  const baseFiltered = releases.filter(r => {
    if (new Date(r.date).getFullYear() !== selectedYear) return false;
    if (productFilter && !r.product.toLowerCase().includes(productFilter.toLowerCase())) return false;
    return true;
  });

  /* Final filtered */
  const filtered = baseFiltered.filter(r => {
    if (typeFilter.length && !typeFilter.includes(r.type)) return false;
    if (monthFilter !== null && new Date(r.date).getMonth() !== monthFilter) return false;
    return true;
  });

  /* Counts */
  const totalYearCount = baseFiltered.length;

  const releaseTypeCounts = baseFiltered.reduce<Record<string, number>>((a, r) => {
    a[r.type] = (a[r.type] || 0) + 1;
    return a;
  }, {});

  /* -----------------------------
     Monthly Executive Summary
  ------------------------------ */
  const monthlySummary = MONTHS.map((m, idx) => {
    const monthItems = baseFiltered.filter(r => new Date(r.date).getMonth() === idx);
    const byType = releaseTypes.map(rt => ({
      ...rt,
      count: monthItems.filter(r => r.type === rt.id).length
    }));
    return { month: m, total: monthItems.length, byType };
  });

  /* -----------------------------
     Product-wise Monthly Table
  ------------------------------ */
  const products = Array.from(new Set(baseFiltered.map(r => r.product)));

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>IBP Release Tracker</h1>

      {/* Year */}
      <div style={{ marginBottom: 12 }}>
        <strong>Year:</strong>{" "}
        <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
          {[currentYear - 1, currentYear, currentYear + 1].map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Add */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        <input placeholder="Release Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Product / App" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="">Release Type</option>
          {releaseTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
        </select>
        <button onClick={saveRelease}>{editingRelease ? "Update" : "Add"}</button>
      </div>

      {/* Filters */}
      <div style={{ margin: "16px 0", display: "flex", gap: 8 }}>
        <input placeholder="Filter by product" value={productFilter} onChange={e => setProductFilter(e.target.value)} />
        <select value={monthFilter ?? ""} onChange={e => setMonthFilter(e.target.value ? +e.target.value : null)}>
          <option value="">Filter by month</option>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div style={{ marginBottom: 16 }}>
        <strong>Total Releases: {totalYearCount}</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {releaseTypes.map(rt => (
            <button
              key={rt.id}
              onClick={() =>
                setTypeFilter(p => p.includes(rt.id) ? p.filter(x => x !== rt.id) : [...p, rt.id])
              }
              style={{ background: rt.color, padding: "4px 8px", border: "1px solid #ccc" }}
            >
              {rt.name} ({releaseTypeCounts[rt.id] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* ===========================
          Monthly Executive Summary
      ============================ */}
      <h2>Monthly Executive Summary</h2>
      {monthlySummary.map(m => (
        <div key={m.month} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
          <strong>{m.month} — Total: {m.total}</strong>
          <div style={{ fontSize: 12 }}>
            {m.byType.map(t => `${t.name}: ${t.count}`).join(" | ")}
          </div>
        </div>
      ))}

      {/* ===========================
          Product-wise Monthly Table
      ============================ */}
      <h2>Product-wise Monthly View</h2>
      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Product</th>
            {MONTHS.map(m => <th key={m}>{m}</th>)}
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p}>
              <td><strong>{p}</strong></td>
              {MONTHS.map((_, idx) => (
                <td key={idx} style={{ textAlign: "center" }}>
                  {baseFiltered.filter(r => r.product === p && new Date(r.date).getMonth() === idx).length}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
