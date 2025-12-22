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

  const [form, setForm] = useState({
    name: "",
    product: "",
    date: "",
    type: ""
  });

  const [productFilter, setProductFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);

  const [showMonthlySummary, setShowMonthlySummary] = useState<boolean>(false);

  const storageKey = `releaseTracker:${selectedYear}`;

  /* Load data */
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setReleases(JSON.parse(stored));
      } catch {
        setReleases([]);
      }
    } else {
      setReleases([]);
    }
  }, [storageKey]);

  /* Persist data */
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(releases));
  }, [releases, storageKey]);

  /* Add / Update */
  const saveRelease = () => {
    if (!form.name || !form.date || !form.type) return;

    if (editingRelease) {
      setReleases(prev =>
        prev.map(r => (r.id === editingRelease.id ? { ...editingRelease, ...form } : r))
      );
      setEditingRelease(null);
    } else {
      setReleases(prev => [...prev, { ...form, id: Date.now() } as ReleaseItem]);
    }

    setForm({ name: "", product: "", date: "", type: "" });
  };

  /* Delete */
  const deleteRelease = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this release?")) return;
    setReleases(prev => prev.filter(r => r.id !== id));
  };

  /* Base filtered set */
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

  /* ============================
     ENHANCED MONTHLY EXEC SUMMARY
  ============================ */
  const monthlyExecData = MONTHS.map((month, idx) => {
    const items = baseFiltered.filter(r => new Date(r.date).getMonth() === idx);
    const total = items.length;

    const byType = releaseTypes
      .map(rt => {
        const count = items.filter(r => r.type === rt.id).length;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return { ...rt, count, pct };
      })
      .filter(t => t.count > 0);

    return { month, total, byType };
  });

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>IBP Release Tracker</h1>

      {/* Toggle */}
      <button
        style={{ marginBottom: 16 }}
        onClick={() => setShowMonthlySummary(p => !p)}
      >
        {showMonthlySummary ? "Hide Monthly Executive Summary" : "Show Monthly Executive Summary"}
      </button>

      {/* NEW Monthly Executive Summary UI */}
      {showMonthlySummary && (
        <>
          <h2>Monthly Executive Summary</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {monthlyExecData.map(m => (
              <div key={m.month} style={{ border: "1px solid #ccc", padding: 12 }}>
                <strong>{m.month}</strong>
                <div style={{ fontSize: 24, margin: "8px 0" }}>
                  {m.total}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>Total Releases</div>

                {m.byType.map(t => (
                  <div key={t.id} style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11 }}>
                      {t.name} — {t.pct}%
                    </div>
                    <div style={{ background: "#eee", height: 6 }}>
                      <div
                        style={{
                          width: `${t.pct}%`,
                          height: 6,
                          background: t.color
                        }}
                      />
                    </div>
                  </div>
                ))}

                {m.total === 0 && (
                  <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                    No releases
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* EVERYTHING BELOW IS UNCHANGED */}
      {/* Legend, Filters, Product Table, Calendar/List View */}
      {/* (left exactly as in your base code) */}
    </div>
  );
}
