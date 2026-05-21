"use client";

import { useState, useEffect } from "react";

/* -----------------------------
Static reference data
------------------------------ */
const releaseTypes = [
{ id: "new-feature", name: "New Feature", color: "#2563EB" },
{ id: "enhancement", name: "Enhancement", color: "#7C3AED" },
{ id: "bug-fix", name: "Bug Fix", color: "#DC2626" },
{ id: "dap-migration", name: "DAP Migration", color: "#0D9488" },
{ id: "retirement", name: "Retirement", color: "#374151" },
{ id: "platform-req", name: "Platform Requirement", color: "#F59E0B" },
{ id: "technical-debt", name: "Technical Debt", color: "#1E3A8A" }
];

const releaseStatuses = [
{ id: "planned", name: "Planned", color: "#9CA3AF" },
{ id: "completed", name: "Completed", color: "#16A34A" }
];

const MONTHS = [
"January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"
];

interface ReleaseItem {
id: number;
name: string;
product: string;
plannedDate: string;
actualDate?: string;
type: string;
status: "planned" | "completed";
}

/* ======================
AUTO TEXT CONTRAST
====================== */
const getContrastingTextColor = (bgColor: string) => {
const hex = bgColor.replace("#", "");
const r = parseInt(hex.substring(0, 2), 16);
const g = parseInt(hex.substring(2, 4), 16);
const b = parseInt(hex.substring(4, 6), 16);
const brightness = (r * 299 + g * 587 + b * 114) / 1000;
return brightness > 160 ? "#000000" : "#FFFFFF";
};

export default function ReleaseTrackerApp() {
const currentYear = new Date().getFullYear();
const [selectedYear, setSelectedYear] = useState<number>(currentYear);

const [releases, setReleases] = useState<ReleaseItem[]>([]);
const [editingRelease, setEditingRelease] = useState<ReleaseItem | null>(null);

const [form, setForm] = useState({
name: "",
product: "",
plannedDate: "",
actualDate: "",
type: "",
status: "planned" as "planned" | "completed"
});

const [productFilter, setProductFilter] = useState("");
const [typeFilter, setTypeFilter] = useState<string[]>([]);
const [statusFilter, setStatusFilter] = useState<"planned" | "completed" | null>(null);
const [monthFilter, setMonthFilter] = useState<number | null>(null);

const [viewMode, setViewMode] = useState<"tracker" | "executive">("tracker");

const storageKey = `releaseTracker:${selectedYear}`;

useEffect(() => {
const stored = localStorage.getItem(storageKey);

```
if (stored) {
  try {
    const parsed = JSON.parse(stored) as any[];

    const normalized: ReleaseItem[] = parsed.map(r => ({
      ...r,
      plannedDate: r.plannedDate ?? r.date ?? "",
      actualDate:
        r.actualDate ??
        (r.status === "completed" ? r.date ?? "" : ""),
      status: r.status ?? "planned"
    }));

    setReleases(normalized);
  } catch {
    setReleases([]);
  }
} else {
  setReleases([]);
}
```

}, [storageKey]);

useEffect(() => {
localStorage.setItem(storageKey, JSON.stringify(releases));
}, [releases, storageKey]);

const getReleaseDisplayDate = (release: ReleaseItem) => {
return release.status === "completed"
? release.actualDate || release.plannedDate
: release.plannedDate;
};

const saveRelease = () => {
if (!form.name.trim()) {
alert("Release Name is required.");
return;
}

```
if (!form.product.trim()) {
  alert("Product / App is required.");
  return;
}

if (!form.plannedDate) {
  alert("Planned Release Date is required.");
  return;
}

if (form.status === "completed" && !form.actualDate) {
  alert("Actual Release Date is required for completed releases.");
  return;
}

if (!form.type) {
  alert("Release Type is required.");
  return;
}

const validationDate =
  form.status === "completed"
    ? form.actualDate
    : form.plannedDate;

const releaseYear = new Date(validationDate).getFullYear();

if (releaseYear !== selectedYear) {
  alert(`Release Date must be within the selected year (${selectedYear}).`);
  return;
}

const normalizedName = form.name.trim().toLowerCase();

const duplicate = releases.some(
  r =>
    r.name.trim().toLowerCase() === normalizedName &&
    r.id !== editingRelease?.id
);

if (duplicate) {
  alert("A release with this name already exists for this year.");
  return;
}

if (editingRelease) {
  setReleases(prev =>
    prev.map(r =>
      r.id === editingRelease.id
        ? {
            ...editingRelease,
            ...form
          }
        : r
    )
  );

  setEditingRelease(null);
} else {
  setReleases(prev => [...prev, { ...form, id: Date.now() }]);
}

setForm({
  name: "",
  product: "",
  plannedDate: "",
  actualDate: "",
  type: "",
  status: "planned"
});
```

};

const deleteRelease = (id: number) => {
if (!window.confirm("Are you sure you want to delete this release?")) return;
setReleases(prev => prev.filter(r => r.id !== id));
};

const baseFiltered = releases.filter(r => {
const releaseDate = getReleaseDisplayDate(r);

```
if (new Date(releaseDate).getFullYear() !== selectedYear) return false;

if (
  productFilter &&
  !r.product.toLowerCase().includes(productFilter.toLowerCase())
)
  return false;

return true;
```

});

const filteredReleases = baseFiltered.filter(r => {
const releaseDate = getReleaseDisplayDate(r);

```
if (typeFilter.length && !typeFilter.includes(r.type)) return false;

if (
  monthFilter !== null &&
  new Date(releaseDate).getMonth() !== monthFilter
)
  return false;

if (statusFilter && (r.status ?? "planned") !== statusFilter)
  return false;

return true;
```

});

const releaseTypeCounts = baseFiltered.reduce<Record<string, number>>(
(acc, r) => {
acc[r.type] = (acc[r.type] || 0) + 1;
return acc;
},
{}
);

const totalYearCount = baseFiltered.length;

const exportYearToExcel = () => {
const header =
"Release Name,Product,Planned Release Date,Actual Release Date,Year,Month,Release Type,Release Status\n";

```
const rows = baseFiltered
  .map(r => {
    const releaseDate = getReleaseDisplayDate(r);
    const d = new Date(releaseDate);
    const month = MONTHS[d.getMonth()];

    const typeName =
      releaseTypes.find(t => t.id === r.type)?.name || r.type;

    const statusName =
      r.status === "completed" ? "Completed" : "Planned";

    return `"${r.name}","${r.product}","${r.plannedDate}","${r.actualDate || ""}","${selectedYear}","${month}","${typeName}","${statusName}"`;
  })
  .join("\n");

const blob = new Blob([header + rows], {
  type: "text/csv;charset=utf-8;"
});

const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = `IBP_Release_Tracker_${selectedYear}.csv`;
link.click();
```

};

const clearForm = () => {
setForm({
name: "",
product: "",
plannedDate: "",
actualDate: "",
type: "",
status: "planned"
});
};

const discardEdit = () => {
setEditingRelease(null);

```
setForm({
  name: "",
  product: "",
  plannedDate: "",
  actualDate: "",
  type: "",
  status: "planned"
});
```

};

const executiveSummary = MONTHS.map((month, idx) => {
const items = baseFiltered.filter(r => {
const releaseDate = getReleaseDisplayDate(r);
return new Date(releaseDate).getMonth() === idx;
});

```
const total = items.length;

const byType = releaseTypes
  .map(rt => {
    const count = items.filter(r => r.type === rt.id).length;

    return {
      ...rt,
      count,
      percent: total ? Math.round((count / total) * 100) : 0
    };
  })
  .filter(t => t.count > 0);

return { month, total, byType };
```

});

return (
<div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}> <h1>IBP Release Tracker</h1>

```
  <div style={{ marginBottom: 16 }}>
    <button
      disabled={viewMode === "tracker"}
      onClick={() => setViewMode("tracker")}
    >
      Tracker View
    </button>

    <button
      disabled={viewMode === "executive"}
      onClick={() => setViewMode("executive")}
      style={{ marginLeft: 8 }}
    >
      Executive View
    </button>
  </div>

  {viewMode === "tracker" && (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16
        }}
      >
        <strong>Year:</strong>

        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
        >
          {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button onClick={exportYearToExcel}>
          Export Year to Excel
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1.3fr 1.3fr 1.5fr 1.2fr 1fr 1fr",
          gap: 8,
          marginBottom: 24,
          alignItems: "center"
        }}
      >
        <input
          placeholder="Release Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Product / App"
          value={form.product}
          onChange={e => setForm({ ...form, product: e.target.value })}
        />

        <input
          type="date"
          value={form.plannedDate}
          onChange={e =>
            setForm({ ...form, plannedDate: e.target.value })
          }
        />

        <input
          type="date"
          value={form.actualDate}
          disabled={form.status !== "completed"}
          onChange={e =>
            setForm({ ...form, actualDate: e.target.value })
          }
        />

        <select
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
        >
          <option value="">Release Type</option>

          {releaseTypes.map(rt => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>

        <select
          value={form.status}
          onChange={e =>
            setForm({
              ...form,
              status: e.target.value as "planned" | "completed",
              actualDate:
                e.target.value === "planned" ? "" : form.actualDate
            })
          }
        >
          {releaseStatuses.map(rs => (
            <option key={rs.id} value={rs.id}>
              {rs.name}
            </option>
          ))}
        </select>

        <button onClick={saveRelease}>
          {editingRelease ? "Update" : "Add"}
        </button>

        {editingRelease ? (
          <button
            onClick={discardEdit}
            style={{ background: "#f3f4f6" }}
          >
            Discard
          </button>
        ) : (
          <button
            onClick={clearForm}
            style={{ background: "#f3f4f6" }}
          >
            Clear
          </button>
        )}
      </div>
    </>
  )}
</div>
);
}
