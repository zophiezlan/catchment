import { r as a, j as e } from "./motion-CvEhWXXX.js";
import {
  u as Z,
  D as U,
  S as D,
  Z as V,
  P as M,
  e as Y,
  b as q,
  R as K,
  l as X,
  t as G,
  M as w,
  C as B,
  j as J,
  a as Q,
  E as ee,
} from "./index-BjdOoHGe.js";
import "./recharts-D2k_uu8S.js";
const S = {
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
  },
  te = {
    pc: { label: "Postcode", fn: (i, o) => i.pc - o.pc },
    st: { label: "State", fn: (i, o) => i.st.localeCompare(o.st) },
    zn: { label: "Zone", fn: (i, o) => i.z - o.z },
    ra: { label: "RA", fn: (i, o) => i.ra - o.ra },
    id: { label: "IRSD", fn: (i, o) => (i.id || 99) - (o.id || 99) },
    ip: { label: "Indig%", fn: (i, o) => (o.ip || 0) - (i.ip || 0) },
    erp: { label: "Pop", fn: (i, o) => (o.erp || 0) - (i.erp || 0) },
  };
function ie() {
  const i = Z(),
    [o, z] = a.useState(""),
    [g, A] = a.useState(""),
    [v, E] = a.useState(""),
    [y, I] = a.useState(""),
    [b, W] = a.useState(""),
    [j, N] = a.useState(""),
    [c, F] = a.useState(0),
    [m, T] = a.useState("pc"),
    [h, P] = a.useState(!0),
    d = a.useMemo(() => {
      var l;
      let t = U.filter((s) => {
        if (o && D[s[1]] !== o) return !1;
        const x = V[s[3]] || 0;
        if (
          (g && x !== Number(g)) ||
          (v && s[4] !== Number(v)) ||
          (y && (s[5] < 0 || M[s[5]] !== y))
        )
          return !1;
        if (b) {
          const [n, R] = b.split("-").map(Number);
          if (!s[9] || s[9] < n || s[9] > R) return !1;
        }
        if (j) {
          const n = j.toLowerCase(),
            R = String(s[0]),
            H = (s[2] || "").toLowerCase();
          if (!R.includes(n) && !H.includes(n)) return !1;
        }
        return !0;
      }).map(Y);
      const r = (l = te[m]) == null ? void 0 : l.fn;
      return (r && t.sort((s, x) => (h ? r(s, x) : r(x, s))), t);
    }, [o, g, v, y, b, j, m, h]);
  a.useEffect(() => F(0), [o, g, v, y, b, j, m, h]);
  const L = 25,
    k = Math.ceil(d.length / L),
    O = d.slice(c * L, (c + 1) * L),
    C = a.useMemo(() => {
      let t = 0,
        r = 0,
        l = 0,
        s = 0,
        x = 0;
      return (
        d.forEach((n) => {
          (n.erp > 0 && (t += n.erp),
            n.ip > 0 && ((r += n.ip), l++),
            n.id > 0 && (x++, n.id <= 2 && s++));
        }),
        {
          pop: t,
          avgInd: l > 0 ? (r / l).toFixed(1) : "0",
          bot20: x > 0 ? ((s / x) * 100).toFixed(0) : "0",
        }
      );
    }, [d]),
    _ = o || g || v || y || b || j,
    $ = a.useCallback(() => {
      (z(""), A(""), E(""), I(""), W(""), N(""));
    }, []);
  function u(t) {
    m === t ? P((r) => !r) : (T(t), P(!0));
  }
  function f({ field: t }) {
    const r = m === t;
    return e.jsxs("span", {
      style: {
        display: "inline-flex",
        flexDirection: "column",
        marginLeft: 3,
        lineHeight: 0,
        gap: 1,
        verticalAlign: "middle",
      },
      children: [
        e.jsx("span", {
          style: {
            fontSize: 8,
            opacity: r && h ? 1 : 0.25,
            color: r && h ? "var(--c-accent)" : "var(--c-text3)",
            transition: "all 0.15s",
          },
          children: "▲",
        }),
        e.jsx("span", {
          style: {
            fontSize: 8,
            opacity: r && !h ? 1 : 0.25,
            color: r && !h ? "var(--c-accent)" : "var(--c-text3)",
            transition: "all 0.15s",
          },
          children: "▼",
        }),
      ],
    });
  }
  const p = (t) => ({
    padding: "11px 10px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "var(--font-body)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: m === t ? "var(--c-accent)" : "var(--c-text3)",
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
  return e.jsxs("div", {
    children: [
      e.jsxs("div", {
        style: {
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 14,
          alignItems: "center",
        },
        children: [
          e.jsxs("div", {
            style: { position: "relative", flex: "1 1 160px", maxWidth: 220 },
            children: [
              e.jsxs("svg", {
                style: {
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                },
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "var(--c-text3)",
                strokeWidth: "2.5",
                strokeLinecap: "round",
                "aria-hidden": "true",
                children: [
                  e.jsx("circle", { cx: "10.5", cy: "10.5", r: "7" }),
                  e.jsx("line", { x1: "15.5", y1: "15.5", x2: "21", y2: "21" }),
                ],
              }),
              e.jsx("input", {
                type: "text",
                placeholder: "Filter postcodes...",
                "aria-label": "Filter table by postcode or place name",
                value: j,
                onChange: (t) => N(t.target.value),
                style: {
                  ...S,
                  width: "100%",
                  paddingLeft: 32,
                  paddingRight: 12,
                },
              }),
            ],
          }),
          e.jsxs("select", {
            value: o,
            onChange: (t) => z(t.target.value),
            style: S,
            "aria-label": "Filter by state",
            children: [
              e.jsx("option", { value: "", children: "All states" }),
              D.map((t) => e.jsx("option", { value: t, children: t }, t)),
            ],
          }),
          e.jsxs("select", {
            value: g,
            onChange: (t) => A(t.target.value),
            style: S,
            "aria-label": "Filter by zone",
            children: [
              e.jsx("option", { value: "", children: "All zones" }),
              [1, 2, 3, 4].map((t) =>
                e.jsx("option", { value: t, children: q[t] }, t),
              ),
            ],
          }),
          e.jsxs("select", {
            value: v,
            onChange: (t) => E(t.target.value),
            style: S,
            "aria-label": "Filter by remoteness area",
            children: [
              e.jsx("option", { value: "", children: "All RA" }),
              [1, 2, 3, 4, 5].map((t) =>
                e.jsxs(
                  "option",
                  { value: t, children: ["RA", t, " — ", K[t]] },
                  t,
                ),
              ),
            ],
          }),
          e.jsxs("select", {
            value: y,
            onChange: (t) => I(t.target.value),
            style: S,
            "aria-label": "Filter by Primary Health Network",
            className: "hide-mobile",
            children: [
              e.jsx("option", { value: "", children: "All PHNs" }),
              M.map((t, r) =>
                e.jsxs("option", { value: t, children: [t, " — ", X[r]] }, t),
              ),
            ],
          }),
          e.jsxs("select", {
            value: b,
            onChange: (t) => W(t.target.value),
            style: S,
            "aria-label": "Filter by IRSD decile",
            children: [
              e.jsx("option", { value: "", children: "All IRSD" }),
              e.jsx("option", {
                value: "1-2",
                children: "Decile 1–2 (most disadvantaged)",
              }),
              e.jsx("option", { value: "3-4", children: "Decile 3–4" }),
              e.jsx("option", { value: "5-6", children: "Decile 5–6" }),
              e.jsx("option", { value: "7-8", children: "Decile 7–8" }),
              e.jsx("option", {
                value: "9-10",
                children: "Decile 9–10 (least disadvantaged)",
              }),
            ],
          }),
          _ &&
            e.jsxs("button", {
              onClick: $,
              "aria-label": "Clear all filters",
              style: {
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
              },
              children: [
                e.jsxs("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 12 12",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  children: [
                    e.jsx("line", { x1: "2", y1: "2", x2: "10", y2: "10" }),
                    e.jsx("line", { x1: "10", y1: "2", x2: "2", y2: "10" }),
                  ],
                }),
                "Clear",
              ],
            }),
          e.jsxs("button", {
            onClick: () => {
              const t = G(d),
                r = new Blob([t], { type: "text/csv;charset=utf-8;" }),
                l = URL.createObjectURL(r),
                s = document.createElement("a");
              ((s.href = l),
                (s.download = `postcodes-export-${new Date().toISOString().slice(0, 10)}.csv`),
                s.click(),
                URL.revokeObjectURL(l),
                i(`Exported ${d.length} postcodes as CSV`));
            },
            "aria-label": "Export filtered postcodes as CSV",
            style: {
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
            },
            children: [
              e.jsxs("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 14 14",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                children: [
                  e.jsx("path", { d: "M7 1v8M4 6l3 3 3-3" }),
                  e.jsx("path", { d: "M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" }),
                ],
              }),
              "Export CSV",
            ],
          }),
        ],
      }),
      e.jsxs("div", {
        className: "grid-4",
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        },
        children: [
          e.jsx(w, {
            label: "Matching",
            value: d.length.toLocaleString(),
            sub: "postcodes",
          }),
          e.jsx(w, {
            label: "Population",
            value: C.pop > 0 ? `${(C.pop / 1e6).toFixed(2)}M` : "—",
          }),
          e.jsx(w, { label: "Avg Indigenous %", value: `${C.avgInd}%` }),
          e.jsx(w, {
            label: "Bottom 20% IRSD",
            value: `${C.bot20}%`,
            accent: Number(C.bot20) > 30 ? "var(--c-equity-flag)" : void 0,
          }),
        ],
      }),
      d.length === 0
        ? e.jsx(B, {
            children: e.jsx(J, {
              icon: e.jsxs("svg", {
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.5",
                strokeLinecap: "round",
                children: [
                  e.jsx("circle", { cx: "12", cy: "12", r: "9" }),
                  e.jsx("path", { d: "M8 12h8" }),
                ],
              }),
              title: "No postcodes match your filters",
              description:
                "Try broadening your search or clearing some filters.",
            }),
          })
        : e.jsxs(B, {
            padding: !1,
            children: [
              e.jsx("div", {
                style: { overflowX: "auto", maxHeight: 620, overflowY: "auto" },
                children: e.jsxs("table", {
                  style: {
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                    fontFamily: "var(--font-body)",
                  },
                  children: [
                    e.jsx("thead", {
                      children: e.jsxs("tr", {
                        children: [
                          e.jsxs("th", {
                            onClick: () => u("pc"),
                            style: p("pc"),
                            children: ["Postcode", e.jsx(f, { field: "pc" })],
                          }),
                          e.jsxs("th", {
                            onClick: () => u("st"),
                            style: p("st"),
                            children: ["State", e.jsx(f, { field: "st" })],
                          }),
                          e.jsx("th", {
                            style: { ...p(""), cursor: "default" },
                            children: "Place",
                          }),
                          e.jsxs("th", {
                            onClick: () => u("zn"),
                            style: p("zn"),
                            children: ["Zone", e.jsx(f, { field: "zn" })],
                          }),
                          e.jsxs("th", {
                            onClick: () => u("ra"),
                            style: p("ra"),
                            children: ["RA", e.jsx(f, { field: "ra" })],
                          }),
                          e.jsx("th", {
                            style: { ...p(""), cursor: "default" },
                            className: "hide-mobile",
                            children: "PHN",
                          }),
                          e.jsxs("th", {
                            onClick: () => u("id"),
                            style: p("id"),
                            children: ["IRSD", e.jsx(f, { field: "id" })],
                          }),
                          e.jsxs("th", {
                            onClick: () => u("ip"),
                            style: p("ip"),
                            children: ["Indig%", e.jsx(f, { field: "ip" })],
                          }),
                          e.jsxs("th", {
                            onClick: () => u("erp"),
                            style: p("erp"),
                            children: ["Pop", e.jsx(f, { field: "erp" })],
                          }),
                        ],
                      }),
                    }),
                    e.jsx("tbody", {
                      children: O.map((t, r) => {
                        const l = r % 2 === 0;
                        return e.jsxs(
                          "tr",
                          {
                            style: {
                              borderBottom: "1px solid var(--c-border)",
                              background: l ? "transparent" : "var(--c-bg2)",
                              transition: "background 0.1s ease",
                            },
                            onMouseEnter: (s) =>
                              (s.currentTarget.style.background =
                                "var(--c-accent-muted)"),
                            onMouseLeave: (s) =>
                              (s.currentTarget.style.background = l
                                ? "transparent"
                                : "var(--c-bg2)"),
                            children: [
                              e.jsx("td", {
                                style: {
                                  padding: "9px 10px",
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: "var(--c-text)",
                                },
                                children: t.pc,
                              }),
                              e.jsx("td", {
                                style: { padding: "9px 10px", fontWeight: 500 },
                                children: t.st,
                              }),
                              e.jsx("td", {
                                style: {
                                  padding: "9px 10px",
                                  maxWidth: 160,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  color: "var(--c-text2)",
                                },
                                children: t.pl,
                              }),
                              e.jsx("td", {
                                style: { padding: "9px 10px" },
                                children: e.jsxs("span", {
                                  style: {
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 12,
                                    fontWeight: 500,
                                  },
                                  children: [
                                    e.jsx("span", {
                                      style: {
                                        display: "inline-block",
                                        width: 8,
                                        height: 8,
                                        borderRadius: 3,
                                        background: Q[t.z],
                                        flexShrink: 0,
                                      },
                                    }),
                                    t.zn,
                                  ],
                                }),
                              }),
                              e.jsxs("td", {
                                style: {
                                  padding: "9px 10px",
                                  fontSize: 12,
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 500,
                                },
                                children: ["RA", t.ra],
                              }),
                              e.jsx("td", {
                                style: {
                                  padding: "9px 10px",
                                  fontSize: 12,
                                  color: "var(--c-text2)",
                                },
                                className: "hide-mobile",
                                children: t.hc,
                              }),
                              e.jsx("td", {
                                style: { padding: "9px 10px", minWidth: 110 },
                                children: e.jsx(ee, {
                                  decile: t.id,
                                  compact: !0,
                                }),
                              }),
                              e.jsx("td", {
                                style: {
                                  padding: "9px 10px",
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 12,
                                  fontWeight: t.ip > 10 ? 600 : 400,
                                  color:
                                    t.ip > 10
                                      ? "var(--c-accent)"
                                      : "var(--c-text2)",
                                },
                                children: t.ip > 0 ? `${t.ip}%` : "—",
                              }),
                              e.jsx("td", {
                                style: {
                                  padding: "9px 10px",
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 12,
                                  color: "var(--c-text2)",
                                },
                                children:
                                  t.erp > 0 ? t.erp.toLocaleString() : "—",
                              }),
                            ],
                          },
                          `${t.pc}_${t.st}_${r}`,
                        );
                      }),
                    }),
                  ],
                }),
              }),
              k > 1 &&
                e.jsxs("div", {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderTop: "1px solid var(--c-border)",
                    background: "var(--c-bg2)",
                  },
                  children: [
                    e.jsxs("button", {
                      disabled: c === 0,
                      onClick: () => F((t) => t - 1),
                      "aria-label": "Previous page",
                      style: {
                        padding: "7px 16px",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--c-border)",
                        background: "var(--c-surface)",
                        color: "var(--c-text2)",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "var(--font-body)",
                        cursor: c === 0 ? "default" : "pointer",
                        opacity: c === 0 ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      },
                      children: [
                        e.jsx("svg", {
                          width: "12",
                          height: "12",
                          viewBox: "0 0 12 12",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: "2",
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          children: e.jsx("polyline", {
                            points: "8 2 4 6 8 10",
                          }),
                        }),
                        "Previous",
                      ],
                    }),
                    e.jsxs("span", {
                      style: {
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        color: "var(--c-text3)",
                        fontWeight: 500,
                      },
                      children: [
                        c + 1,
                        " / ",
                        k,
                        e.jsxs("span", {
                          style: {
                            color: "var(--c-text3)",
                            fontFamily: "var(--font-body)",
                            marginLeft: 8,
                          },
                          children: ["(", d.length.toLocaleString(), " total)"],
                        }),
                      ],
                    }),
                    e.jsxs("button", {
                      disabled: c >= k - 1,
                      onClick: () => F((t) => t + 1),
                      "aria-label": "Next page",
                      style: {
                        padding: "7px 16px",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--c-border)",
                        background: "var(--c-surface)",
                        color: "var(--c-text2)",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "var(--font-body)",
                        cursor: c >= k - 1 ? "default" : "pointer",
                        opacity: c >= k - 1 ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      },
                      children: [
                        "Next",
                        e.jsx("svg", {
                          width: "12",
                          height: "12",
                          viewBox: "0 0 12 12",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: "2",
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          children: e.jsx("polyline", {
                            points: "4 2 8 6 4 10",
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
            ],
          }),
    ],
  });
}
export { ie as default };
