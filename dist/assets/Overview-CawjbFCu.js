import { r as W, j as e } from "./motion-CvEhWXXX.js";
import {
  D as r,
  Z as R,
  S as D,
  P as F,
  a as L,
  b as M,
  i as b,
  C as p,
  M as f,
  c as v,
  H as N,
  d as P,
} from "./index-BjdOoHGe.js";
import { R as A, P as E, b as O, C as B, T as z } from "./recharts-D2k_uu8S.js";
function H({ active: n, payload: o }) {
  if (!n || !(o != null && o.length)) return null;
  const a = o[0];
  return e.jsxs("div", {
    style: {
      background: "var(--tooltip-bg)",
      color: "var(--tooltip-text)",
      padding: "8px 14px",
      borderRadius: "var(--radius-sm)",
      fontSize: 12,
      boxShadow: "var(--shadow-md)",
      border: "none",
    },
    children: [
      e.jsx("div", { style: { fontWeight: 600 }, children: a.name }),
      e.jsxs("div", {
        style: { fontFamily: "var(--font-mono)", marginTop: 2 },
        children: [a.value.toLocaleString(), " postcodes"],
      }),
    ],
  });
}
function K({
  cx: n,
  cy: o,
  midAngle: a,
  innerRadius: d,
  outerRadius: t,
  percent: s,
  name: c,
}) {
  if (s < 0.06) return null;
  const l = Math.PI / 180,
    x = d + (t - d) * 0.5,
    g = n + x * Math.cos(-a * l),
    h = o + x * Math.sin(-a * l);
  return e.jsxs("text", {
    x: g,
    y: h,
    fill: "white",
    textAnchor: "middle",
    dominantBaseline: "central",
    style: {
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "var(--font-body)",
      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    },
    children: [(s * 100).toFixed(0), "%"],
  });
}
function q() {
  const n = W.useMemo(() => {
      const t = { 1: 0, 2: 0, 3: 0, 4: 0 },
        s = {},
        c = {},
        l = Array(11).fill(0);
      let x = 0,
        g = 0,
        h = 0,
        u = 0;
      r.forEach((i) => {
        const m = R[i[3]] || 0;
        m && t[m]++;
        const w = D[i[1]];
        s[w] = (s[w] || 0) + 1;
        const j = i[5] >= 0 ? F[i[5]] : "";
        (j && (c[j] = (c[j] || 0) + 1),
          i[9] > 0 && l[i[9]]++,
          i[7] > 0 && ((x += i[7]), g++),
          i[8] > 0 && ((h += i[8]), u++));
      });
      const S = (t[3] || 0) + (t[4] || 0),
        k = ((S / r.length) * 100).toFixed(0),
        C = l[1] + l[2],
        y = l.slice(1).reduce((i, m) => i + m, 0),
        T = y > 0 ? ((C / y) * 100).toFixed(0) : "0",
        I = s.NSW || 0;
      return {
        zones: t,
        states: s,
        phns: c,
        irsd: l,
        totalPop: x,
        popCount: g,
        avgInd: u > 0 ? (h / u).toFixed(1) : "0",
        indCount: u,
        outerPct: k,
        outerRegionalPlus: S,
        bot20pct: T,
        bot20: C,
        withIrsd: y,
        nswCount: I,
        phnCount: Object.keys(c).length,
        stateCount: Object.keys(s).length,
      };
    }, []),
    o = [1, 2, 3, 4].map((t) => ({
      name: M[t],
      value: n.zones[t],
      color: L[t],
    })),
    a = Object.entries(n.states)
      .sort((t, s) => s[1] - t[1])
      .map(([t, s]) => ({ name: t, value: s, color: "#059669" })),
    d = n.irsd
      .slice(1)
      .map((t, s) => ({ name: String(s + 1), value: t, color: b(s + 1) }));
  return e.jsxs("div", {
    children: [
      e.jsxs(p, {
        style: {
          marginBottom: 20,
          padding: "20px 24px",
          background: "var(--c-accent-light)",
          borderColor: "rgba(5, 150, 105, 0.15)",
        },
        children: [
          e.jsxs("div", {
            style: {
              fontFamily: "var(--font-display)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--c-accent)",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            },
            children: [
              e.jsxs("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 16 16",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                children: [
                  e.jsx("circle", { cx: "8", cy: "8", r: "6" }),
                  e.jsx("line", { x1: "8", y1: "5", x2: "8", y2: "8.5" }),
                  e.jsx("circle", {
                    cx: "8",
                    cy: "11",
                    r: "0.5",
                    fill: "currentColor",
                  }),
                ],
              }),
              "At a glance",
            ],
          }),
          e.jsxs("p", {
            style: {
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--c-text2)",
              margin: 0,
            },
            children: [
              "This dataset covers",
              " ",
              e.jsx("strong", {
                style: { color: "var(--c-text)", fontWeight: 600 },
                children: r.length.toLocaleString(),
              }),
              " ",
              "postcode records across ",
              n.stateCount,
              " states and territories, representing",
              " ",
              e.jsxs("strong", {
                style: { color: "var(--c-text)", fontWeight: 600 },
                children: [(n.totalPop / 1e6).toFixed(1), "M"],
              }),
              " ",
              "people.",
              " ",
              e.jsxs("strong", {
                style: { color: "var(--c-text)", fontWeight: 600 },
                children: [n.outerPct, "%"],
              }),
              " ",
              "of postcodes are in rural or remote areas.",
              " ",
              e.jsxs("strong", {
                style: { color: "var(--c-equity-flag)", fontWeight: 600 },
                children: [n.bot20pct, "%"],
              }),
              " ",
              "fall in the most disadvantaged IRSD quintile (decile 1–2), and the average Indigenous population across postcodes with data is",
              " ",
              e.jsxs("strong", {
                style: { color: "var(--c-text)", fontWeight: 600 },
                children: [n.avgInd, "%"],
              }),
              ".",
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
          marginBottom: 24,
        },
        children: [
          e.jsx(f, {
            label: "Postcodes",
            value: r.length.toLocaleString(),
            sub: "unique postcode records",
          }),
          e.jsx(f, {
            label: "PHN regions",
            value: n.phnCount,
            sub: `across ${n.stateCount} states`,
          }),
          e.jsx(f, {
            label: "Coverage population",
            value: `${(n.totalPop / 1e6).toFixed(1)}M`,
            sub: `${n.popCount.toLocaleString()} postcodes with ERP`,
          }),
          e.jsx(f, {
            label: "Avg Indigenous %",
            value: `${n.avgInd}%`,
            sub: `${n.indCount.toLocaleString()} postcodes with data`,
          }),
        ],
      }),
      e.jsxs("div", {
        className: "grid-2",
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 8,
        },
        children: [
          e.jsxs(p, {
            padding: !1,
            children: [
              e.jsx("div", {
                style: { padding: "20px 20px 0" },
                children: e.jsx(v, {
                  style: { marginTop: 0 },
                  children: "Shipping zone distribution",
                }),
              }),
              e.jsxs("div", {
                style: {
                  display: "flex",
                  alignItems: "center",
                  padding: "0 20px 20px",
                  gap: 16,
                },
                children: [
                  e.jsx("div", {
                    style: { width: 160, height: 160, flexShrink: 0 },
                    children: e.jsx(A, {
                      width: "100%",
                      height: "100%",
                      children: e.jsxs(E, {
                        children: [
                          e.jsx(O, {
                            data: o,
                            cx: "50%",
                            cy: "50%",
                            innerRadius: 40,
                            outerRadius: 72,
                            dataKey: "value",
                            strokeWidth: 2,
                            stroke: "var(--c-surface)",
                            labelLine: !1,
                            label: K,
                            animationDuration: 700,
                            animationEasing: "ease-out",
                            children: o.map((t, s) =>
                              e.jsx(B, { fill: t.color }, s),
                            ),
                          }),
                          e.jsx(z, { content: e.jsx(H, {}) }),
                        ],
                      }),
                    }),
                  }),
                  e.jsx("div", {
                    style: { flex: 1 },
                    children: o.map((t) =>
                      e.jsxs(
                        "div",
                        {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                            fontSize: 13,
                          },
                          children: [
                            e.jsx("div", {
                              style: {
                                width: 10,
                                height: 10,
                                borderRadius: 3,
                                background: t.color,
                                flexShrink: 0,
                              },
                            }),
                            e.jsx("span", {
                              style: {
                                flex: 1,
                                color: "var(--c-text2)",
                                fontWeight: 500,
                              },
                              children: t.name,
                            }),
                            e.jsx("span", {
                              style: {
                                fontFamily: "var(--font-mono)",
                                fontWeight: 600,
                                fontSize: 12,
                              },
                              children: t.value.toLocaleString(),
                            }),
                            e.jsxs("span", {
                              style: {
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--c-text3)",
                                minWidth: 36,
                                textAlign: "right",
                              },
                              children: [
                                ((t.value / r.length) * 100).toFixed(0),
                                "%",
                              ],
                            }),
                          ],
                        },
                        t.name,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
          e.jsx(p, {
            padding: !1,
            children: e.jsxs("div", {
              style: { padding: "20px 20px 16px" },
              children: [
                e.jsx(v, {
                  style: { marginTop: 0 },
                  children: "Top PHN regions by postcode count",
                }),
                e.jsx(N, {
                  items: Object.entries(n.phns)
                    .sort((t, s) => s[1] - t[1])
                    .slice(0, 8)
                    .map(([t, s]) => ({
                      name: t,
                      value: s,
                      color: "var(--c-accent)",
                    })),
                  total: r.length,
                  compact: !0,
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsxs("div", {
        className: "grid-2",
        style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
        children: [
          e.jsxs(p, {
            padding: !1,
            children: [
              e.jsx("div", {
                style: { padding: "20px 20px 4px" },
                children: e.jsx(v, {
                  style: { marginTop: 0 },
                  children: "Postcodes by state",
                }),
              }),
              e.jsx("div", {
                style: { padding: "0 12px 16px" },
                children: e.jsx(P, {
                  data: a,
                  dataKey: "value",
                  nameKey: "name",
                  colors: a.map(() => "#059669"),
                }),
              }),
            ],
          }),
          e.jsxs(p, {
            padding: !1,
            children: [
              e.jsx("div", {
                style: { padding: "20px 20px 4px" },
                children: e.jsx(v, {
                  style: { marginTop: 0 },
                  children: "IRSD decile distribution",
                }),
              }),
              e.jsx("div", {
                style: { padding: "0 12px 8px" },
                children: e.jsx(P, {
                  data: d,
                  dataKey: "value",
                  nameKey: "name",
                  colors: d.map((t) => t.color),
                  height: 180,
                }),
              }),
              e.jsxs("div", {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "var(--c-text3)",
                  padding: "0 20px 16px",
                  fontWeight: 500,
                },
                children: [
                  e.jsxs("span", {
                    style: { display: "flex", alignItems: "center", gap: 4 },
                    children: [
                      e.jsx("span", {
                        style: {
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: b(1),
                        },
                      }),
                      "Most disadvantaged",
                    ],
                  }),
                  e.jsxs("span", {
                    style: { display: "flex", alignItems: "center", gap: 4 },
                    children: [
                      "Least disadvantaged",
                      e.jsx("span", {
                        style: {
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: b(10),
                        },
                      }),
                    ],
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
export { q as default };
