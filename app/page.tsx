"use client";

import { useEffect, useMemo, useState } from "react";

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
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
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

  const [form, setForm] = useState({
    name: "",
    product: "",
    date: "",
    type: ""
  });

  const [productFilter, setProductFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);

  const storageKey = `releaseTracker:${selectedYear}`;

  /* Load */
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    setReleases(raw ? JSON.parse(raw) : []);
  }, [storageKey]);

  /* Persist */
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(releases));
  }, [releases, storageKey]);

  /* Save */
  const saveRelease = () => {
    if (!form.name || !form.date || !form.type) return;

    if (editingRelease) {
      setReleases(prev =>
        prev.map(r => r.id === editingRelease.id ? { ...editingRelease, ...form } : r)
      );
      setEditingRelease(null);
    } else {
      setReleases(prev => [...prev, { ...form, id: Date.now() }]);
    }

    setForm({ name: "", product: "", date: "", type: "" });
  };

  /* Delete */
  const deleteRelease = (id: number) => {
    if (confirm("Delete this release?")) {
      setReleases(prev => prev.filter(r => r.id !== id));
    }
  };

  /* Base filtered */
  const baseFiltered = useMemo(() => {
    return releases.filter(r => {
      if (new Date(r.date).getFullYear() !== selectedYear) return false;
      if (productFilter && !r.product.toLowerCase().includes(productFilter.toLowerCase())) return false;
      return true;
    });
  }, [releases, selectedYear, productFilter]);

  /* Final filtered */
  const filteredReleases = useMemo(() => {
    return baseFiltered.filter(r => {
      if (typeFilter.length && !typeFilter.includes(r.type)) return false;
      if (monthFilter !== null && new Date(r.date).getMonth() !== monthFilter) return false;
      return true;
    });
  }, [baseFiltered, typeFilter, monthFilter]);

  /* Counts */
  const totalYearCount = baseFiltered.length;

  const releaseTypeCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    baseFiltered.forEach(r => {
      acc[r.type] = (acc[r.type] || 0) + 1;
    });
    return acc;
  }, [baseFiltered]);

  /* Monthly Executive Summary */
  const monthlySummary = useMemo(() => {
    if (monthFilter === null) return null;
    const byType: Record<string, number> = {};
    filteredReleases.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });
    return { total: filteredReleases.length, byType };
  }, [filteredReleases, monthFilter]);

  /* Product-wise Monthly */
  const productMonthly = useMemo(() => {
    if (monthFilter === null) return [];
    const map: Record<string, number> = {};
    filteredReleases.forEach(r => {
      map[r.product] = (map[r.product] || 0) + 1;
    });
    return Object.entries(map).map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReleases, monthFilter]);

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>IBP Release Tracker</h1>

      {/* Year */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <strong>Year:</strong>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Add / Edit */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 24 }}>
        <input placeholder="Release Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Product / App" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="">Release Type</option>
          {releaseTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
        </select>
        <button onClick={saveRelease}>{editingRelease ? "Update" : "Add"}</button>
      </div>

      {/* Legend */}
      <div style={{ marginBottom: 16 }}>
        <strong>Release Type Legend — Total: {totalYearCount}</strong>
        <button
          onClick={() => setTypeFilter([])}
          style={{ marginLeft: 12 }}
        >
          Clear Release Type Filter
        </button>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {releaseTypes.map(rt => (
            <button
              key={rt.id}
              onClick={() =>
                setTypeFilter(prev =>
                  prev.includes(rt.id) ? prev.filter(t => t !== rt.id) : [...prev, rt.id]
                )
              }
              style={{
                background: rt.color,
                border: typeFilter.includes(rt.id) ? "2px solid #333" : "1px solid #ccc",
                padding: "4px 8px",
                cursor: "pointer"
              }}
            >
              {rt.name} ({releaseTypeCounts[rt.id] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <input
            placeholder="Filter by product"
            value={productFilter}
            onChange={e => setProductFilter(e.target.value)}
          />
          {productFilter && (
            <button
              onClick={() => setProductFilter("")}
              style={{
                position: "absolute",
                right: 4,
                top: 2,
                border: "none",
                background: "transparent",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          )}
        </div>

        <select value={monthFilter ?? ""} onChange={e => setMonthFilter(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Filter by month</option>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>

        {monthFilter !== null && (
          <button onClick={() => setMonthFilter(null)}>
            Clear Month Filter
          </button>
        )}
      </div>

      {/* Monthly Views */}
      {monthFilter !== null && monthlySummary && (
        <>
          <h3>Executive Summary — {MONTHS[monthFilter]} {selectedYear}</h3>
          <div>
            <strong>Total Releases:</strong> {monthlySummary.total}
            <ul>
              {Object.entries(monthlySummary.byType).map(([type, count]) => {
                const rt = releaseTypes.find(t => t.id === type);
                return <li key={type}>{rt?.name}: {count}</li>;
              })}
            </ul>
          </div>

          <h4>Product-wise Breakdown</h4>
          <table style={{ borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: 6 }}>Product</th>
                <th style={{ border: "1px solid #ccc", padding: 6 }}>Releases</th>
              </tr>
            </thead>
            <tbody>
              {productMonthly.map(p => (
                <tr key={p.product}>
                  <td style={{ border: "1px solid #ccc", padding: 6 }}>{p.product}</td>
                  <td style={{ border: "1px solid #ccc", padding: 6, textAlign: "center" }}>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReleases.map(r => {
            const rt = releaseTypes.find(t => t.id === r.type);
            return (
              <div
                key={r.id}
                style={{ background: rt?.color, padding: 8, border: "1px solid #ccc", marginBottom: 6 }}
              >
                <strong>{r.name}</strong> — {r.product} — {r.date}
                <button style={{ marginLeft: 8 }} onClick={() => deleteRelease(r.id)}>Delete</button>
              </div>
            );
          })}
        </>
      )}

      {/* Calendar */}
      {monthFilter === null && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {MONTHS.map((month, index) => (
            <div key={month} style={{ border: "1px solid #ccc", padding: 12 }}>
              <strong>{month}</strong>
              {filteredReleases.filter(r => new Date(r.date).getMonth() === index).map(r => {
                const rt = releaseTypes.find(t => t.id === r.type);
                return (
                  <div
                    key={r.id}
                    style={{ background: rt?.color, marginTop: 6, padding: 6 }}
                  >
                    {r.name}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
