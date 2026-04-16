import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DATA,
  STATES,
  PHN_CODES,
  PHN_NAMES,
  ZONE_MAP,
  ZONE_NAMES,
  ZONE_COLORS,
  RA_LABELS,
  decode,
  irsdColor,
  toCSV,
} from "../utils/data";
import { MetricCard, EquityBar, Card, EmptyState } from "./Shared";

const SEL_STYLE = {
  padding: "9px 32px 9px 12px",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "var(--font-body)",
  border: "1.5px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface)",
  color: "var(--c-text)",
  minWidth: 0,
  transition: "all 0.15s ease",
};

const SORT_FIELDS = {
  pc: { label: "Postcode", fn: (a, b) => a.pc - b.pc },
  st: { label: "State", fn: (a, b) => a.st.localeCompare(b.st) },
  zn: { label: "Zone", fn: (a, b) => a.z - b.z },
  ra: { label: "RA", fn: (a, b) => a.ra - b.ra },
  id: { label: "IRSD", fn: (a, b) => (a.id || 99) - (b.id || 99) },
  ip: { label: "Indig%", fn: (a, b) => (b.ip || 0) - (a.ip || 0) },
  erp: { label: "Pop", fn: (a, b) => (b.erp || 0) - (a.erp || 0) },
};

export default function Explorer() {
  const [fState, setFS] = useState("");
  const [fZone, setFZ] = useState("");
  const [fRA, setFRA] = useState("");
  const [fPHN, setFP] = useState("");
  const [fIRSD, setFI] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState("pc");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let results = DATA.filter((rec) => {
      if (fState && STATES[rec[1]] !== fState) return false;
      const z = ZONE_MAP[rec[3]] || 0;
      if (fZone && z !== Number(fZone)) return false;
      if (fRA && rec[4] !== Number(fRA)) return false;
      if (fPHN && (rec[5] < 0 || PHN_CODES[rec[5]] !== fPHN)) return false;
      if (fIRSD) {
        const [lo, hi] = fIRSD.split("-").map(Number);
        if (!rec[9] || rec[9] < lo || rec[9] > hi) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const pc = String(rec[0]);
        const pl = (rec[2] || "").toLowerCase();
        if (!pc.includes(s) && !pl.includes(s)) return false;
      }
      return true;
    }).map(decode);

    // Sort
    const sortFn = SORT_FIELDS[sortKey]?.fn;
    if (sortFn) {
      results.sort((a, b) => (sortAsc ? sortFn(a, b) : sortFn(b, a)));
    }

    return results;
  }, [fState, fZone, fRA, fPHN, fIRSD, search, sortKey, sortAsc]);

  useEffect(
    () => setPage(0),
    [fState, fZone, fRA, fPHN, fIRSD, search, sortKey, sortAsc],
  );

  const pageSize = 25;
  const pages = Math.ceil(filtered.length / pageSize);
  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const fStats = useMemo(() => {
    let pop = 0,
      ind = 0,
      ic = 0,
      bot = 0,
      irc = 0;
    filtered.forEach((d) => {
      if (d.erp > 0) pop += d.erp;
      if (d.ip > 0) {
        ind += d.ip;
        ic++;
      }
      if (d.id > 0) {
        irc++;
        if (d.id <= 2) bot++;
      }
    });
    return {
      pop,
      avgInd: ic > 0 ? (ind / ic).toFixed(1) : "0",
      bot20: irc > 0 ? ((bot / irc) * 100).toFixed(0) : "0",
    };
  }, [filtered]);

  const hasFilters = fState || fZone || fRA || fPHN || fIRSD || search;

  const clearAll = useCallback(() => {
    setFS("");
    setFZ("");
    setFRA("");
    setFP("");
    setFI("");
    setSearch("");
  }, []);

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function SortIcon({ field }) {
    const active = sortKey === field;
    return (
      <span
        style={{
          display: "inline-flex",
          marginLeft: 3,
          opacity: active ? 1 : 0,
          transition: "opacity 0.15s",
          fontSize: 10,
        }}
      >
        {sortAsc ? "▲" : "▼"}
      </span>
    );
  }

  const thStyle = (field) => ({
    padding: "11px 10px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "var(--font-body)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: sortKey === field ? "var(--c-accent)" : "var(--c-text3)",
    borderBottom: "2px solid var(--c-border)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    background: "var(--c-bg2)",
    zIndex: 2,
    transition: "color 0.15s ease",
  });

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        {/* Search within table */}
        <div style={{ position: "relative", flex: "1 1 160px", maxWidth: 220 }}>
          <svg
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--c-text3)"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="7" />
            <line x1="15.5" y1="15.5" x2="21" y2="21" />
          </svg>
          <input
            type="text"
            placeholder="Filter postcodes..."
            aria-label="Filter table by postcode or place name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...SEL_STYLE,
              width: "100%",
              paddingLeft: 32,
              paddingRight: 12,
            }}
          />
        </div>

        <select
          value={fState}
          onChange={(e) => setFS(e.target.value)}
          style={SEL_STYLE}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={fZone}
          onChange={(e) => setFZ(e.target.value)}
          style={SEL_STYLE}
          aria-label="Filter by zone"
        >
          <option value="">All zones</option>
          {[1, 2, 3, 4].map((z) => (
            <option key={z} value={z}>
              {ZONE_NAMES[z]}
            </option>
          ))}
        </select>
        <select
          value={fRA}
          onChange={(e) => setFRA(e.target.value)}
          style={SEL_STYLE}
          aria-label="Filter by remoteness area"
        >
          <option value="">All RA</option>
          {[1, 2, 3, 4, 5].map((v) => (
            <option key={v} value={v}>
              RA{v} — {RA_LABELS[v]}
            </option>
          ))}
        </select>
        <select
          value={fPHN}
          onChange={(e) => setFP(e.target.value)}
          style={SEL_STYLE}
          aria-label="Filter by Primary Health Network"
          className="hide-mobile"
        >
          <option value="">All PHNs</option>
          {PHN_CODES.map((c, i) => (
            <option key={c} value={c}>
              {c} — {PHN_NAMES[i]}
            </option>
          ))}
        </select>
        <select
          value={fIRSD}
          onChange={(e) => setFI(e.target.value)}
          style={SEL_STYLE}
          aria-label="Filter by IRSD decile"
        >
          <option value="">All IRSD</option>
          <option value="1-2">Decile 1–2 (most disadvantaged)</option>
          <option value="3-4">Decile 3–4</option>
          <option value="5-6">Decile 5–6</option>
          <option value="7-8">Decile 7–8</option>
          <option value="9-10">Decile 9–10 (least disadvantaged)</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearAll}
            aria-label="Clear all filters"
            style={{
              padding: "9px 14px",
              fontSize: 12,
              border: "1px solid var(--c-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--c-surface)",
              color: "var(--c-text2)",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
            Clear
          </button>
        )}
        {/* CSV export — pushed to right */}
        <button
          onClick={() => {
            const csv = toCSV(filtered);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `postcodes-export-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          aria-label="Export filtered postcodes as CSV"
          style={{
            padding: "9px 14px",
            fontSize: 12,
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--c-surface)",
            color: "var(--c-text2)",
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 1v8M4 6l3 3 3-3" />
            <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Summary metrics */}
      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <MetricCard
          label="Matching"
          value={filtered.length.toLocaleString()}
          sub="postcodes"
        />
        <MetricCard
          label="Population"
          value={fStats.pop > 0 ? `${(fStats.pop / 1e6).toFixed(2)}M` : "—"}
        />
        <MetricCard label="Avg Indigenous %" value={`${fStats.avgInd}%`} />
        <MetricCard
          label="Bottom 20% IRSD"
          value={`${fStats.bot20}%`}
          accent={
            Number(fStats.bot20) > 30 ? "var(--c-equity-flag)" : undefined
          }
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12h8" />
              </svg>
            }
            title="No postcodes match your filters"
            description="Try broadening your search or clearing some filters."
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div style={{ overflowX: "auto", maxHeight: 620, overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                fontFamily: "var(--font-body)",
              }}
            >
              <thead>
                <tr>
                  <th onClick={() => handleSort("pc")} style={thStyle("pc")}>
                    Postcode
                    <SortIcon field="pc" />
                  </th>
                  <th onClick={() => handleSort("st")} style={thStyle("st")}>
                    State
                    <SortIcon field="st" />
                  </th>
                  <th
                    style={{
                      ...thStyle(""),
                      cursor: "default",
                    }}
                  >
                    Place
                  </th>
                  <th onClick={() => handleSort("zn")} style={thStyle("zn")}>
                    Zone
                    <SortIcon field="zn" />
                  </th>
                  <th onClick={() => handleSort("ra")} style={thStyle("ra")}>
                    RA
                    <SortIcon field="ra" />
                  </th>
                  <th
                    style={{
                      ...thStyle(""),
                      cursor: "default",
                    }}
                    className="hide-mobile"
                  >
                    PHN
                  </th>
                  <th onClick={() => handleSort("id")} style={thStyle("id")}>
                    IRSD
                    <SortIcon field="id" />
                  </th>
                  <th onClick={() => handleSort("ip")} style={thStyle("ip")}>
                    Indig%
                    <SortIcon field="ip" />
                  </th>
                  <th onClick={() => handleSort("erp")} style={thStyle("erp")}>
                    Pop
                    <SortIcon field="erp" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {slice.map((d, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <tr
                      key={`${d.pc}_${d.st}_${i}`}
                      style={{
                        borderBottom: "1px solid var(--c-border)",
                        background: isEven ? "transparent" : "var(--c-bg2)",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--c-accent-muted)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isEven
                          ? "transparent"
                          : "var(--c-bg2)")
                      }
                    >
                      <td
                        style={{
                          padding: "9px 10px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--c-text)",
                        }}
                      >
                        {d.pc}
                      </td>
                      <td style={{ padding: "9px 10px", fontWeight: 500 }}>
                        {d.st}
                      </td>
                      <td
                        style={{
                          padding: "9px 10px",
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--c-text2)",
                        }}
                      >
                        {d.pl}
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 8,
                              height: 8,
                              borderRadius: 3,
                              background: ZONE_COLORS[d.z],
                              flexShrink: 0,
                            }}
                          />
                          {d.zn}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "9px 10px",
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 500,
                        }}
                      >
                        RA{d.ra}
                      </td>
                      <td
                        style={{
                          padding: "9px 10px",
                          fontSize: 12,
                          color: "var(--c-text2)",
                        }}
                        className="hide-mobile"
                      >
                        {d.hc}
                      </td>
                      <td style={{ padding: "9px 10px", minWidth: 110 }}>
                        <EquityBar decile={d.id} compact />
                      </td>
                      <td
                        style={{
                          padding: "9px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: d.ip > 10 ? 600 : 400,
                          color:
                            d.ip > 10 ? "var(--c-accent)" : "var(--c-text2)",
                        }}
                      >
                        {d.ip > 0 ? `${d.ip}%` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "9px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--c-text2)",
                        }}
                      >
                        {d.erp > 0 ? d.erp.toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderTop: "1px solid var(--c-border)",
                background: "var(--c-bg2)",
              }}
            >
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--c-border)",
                  background: "var(--c-surface)",
                  color: "var(--c-text2)",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "var(--font-body)",
                  cursor: page === 0 ? "default" : "pointer",
                  opacity: page === 0 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="8 2 4 6 8 10" />
                </svg>
                Previous
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--c-text3)",
                  fontWeight: 500,
                }}
              >
                {page + 1} / {pages}
                <span
                  style={{
                    color: "var(--c-text3)",
                    fontFamily: "var(--font-body)",
                    marginLeft: 8,
                  }}
                >
                  ({filtered.length.toLocaleString()} total)
                </span>
              </span>
              <button
                disabled={page >= pages - 1}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--c-border)",
                  background: "var(--c-surface)",
                  color: "var(--c-text2)",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "var(--font-body)",
                  cursor: page >= pages - 1 ? "default" : "pointer",
                  opacity: page >= pages - 1 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Next
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 2 8 6 4 10" />
                </svg>
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
