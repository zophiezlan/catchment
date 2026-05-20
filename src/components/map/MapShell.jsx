import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GROUP_ORDER = ["Services", "Boundaries", "Demographics"];

function LayerInstance({ map, layer, active, options }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    const detach = () => {
      if (ref.current) {
        try { ref.current.remove(); } catch {}
        ref.current = null;
      }
    };

    if (active) {
      Promise.resolve(layer.load()).then((data) => {
        if (cancelled || !map) return;
        detach();
        const obj = layer.render(map, data, options);
        if (obj) {
          obj.addTo(map);
          ref.current = obj;
        }
      });
    } else {
      detach();
    }

    return () => {
      cancelled = true;
      detach();
    };
  }, [map, layer, active, options]);

  return null;
}

function LayerPanel({ layers, activeIds, onToggle, layerOptions, onOptionsChange }) {
  const groups = useMemo(() => {
    const out = {};
    for (const l of layers) {
      const g = l.group || "Other";
      (out[g] ||= []).push(l);
    }
    return out;
  }, [layers]);

  const orderedGroups = useMemo(() => {
    const known = GROUP_ORDER.filter((g) => groups[g]);
    const extra = Object.keys(groups).filter((g) => !GROUP_ORDER.includes(g));
    return [...known, ...extra];
  }, [groups]);

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-sm)",
        padding: "10px 12px",
        minWidth: 180,
        fontFamily: "var(--font-body)",
        fontSize: 12,
        maxHeight: "calc(100% - 24px)",
        overflowY: "auto",
      }}
    >
      {orderedGroups.map((g, gi) => (
        <div key={g} style={{ marginTop: gi === 0 ? 0 : 10 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--c-text3)",
              marginBottom: 6,
            }}
          >
            {g}
          </div>
          {groups[g].map((l) => {
            const on = activeIds.has(l.id);
            const Controls = l.Controls;
            return (
              <div key={l.id} style={{ marginBottom: 4 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    cursor: "pointer",
                    padding: "3px 0",
                    color: on ? "var(--c-text)" : "var(--c-text2)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggle(l.id)}
                    style={{
                      accentColor: l.swatch || "var(--c-accent)",
                      width: 13,
                      height: 13,
                      margin: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: l.swatchShape === "square" ? 2 : "50%",
                      background: l.swatch || "var(--c-text3)",
                      opacity: on ? 1 : 0.45,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: on ? 600 : 500 }}>{l.label}</span>
                </label>
                {on && Controls && (
                  <div style={{ marginLeft: 22, marginTop: 2, marginBottom: 4 }}>
                    <Controls
                      options={layerOptions[l.id]}
                      setOptions={(next) => onOptionsChange(l.id, next)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Legend({ entries }) {
  if (!entries.length) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 1000,
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-sm)",
        padding: "7px 12px",
        display: "flex",
        gap: 14,
        flexWrap: "wrap",
        maxWidth: "calc(100% - 32px)",
        fontSize: 11,
        fontWeight: 500,
        boxShadow: "var(--shadow-sm)",
        color: "var(--c-text2)",
        fontFamily: "var(--font-body)",
      }}
    >
      {entries.map((e, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {e.shape === "line" ? (
            <svg width="14" height="10" viewBox="0 0 14 10">
              <line
                x1="1"
                y1="5"
                x2="13"
                y2="5"
                stroke={e.color}
                strokeWidth="2"
                strokeOpacity={e.opacity ?? 1}
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill={e.color} />
            </svg>
          )}
          {e.label}
        </span>
      ))}
    </div>
  );
}

export default function MapShell({ layers, defaultActive = [], height = 480 }) {
  const elRef = useRef(null);
  const [map, setMap] = useState(null);

  const [activeIds, setActiveIds] = useState(
    () => new Set(defaultActive.length ? defaultActive : layers.filter((l) => l.defaultOn).map((l) => l.id)),
  );

  const [layerOptions, setLayerOptions] = useState(() => {
    const out = {};
    for (const l of layers) {
      if (l.defaultOptions) out[l.id] = l.defaultOptions;
    }
    return out;
  });

  useEffect(() => {
    if (map || !elRef.current) return;
    const m = L.map(elRef.current, { center: [-32.5, 147], zoom: 6 });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(m);
    setMap(m);
    return () => {
      m.remove();
      setMap(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onToggle = useCallback((id) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onOptionsChange = useCallback((id, next) => {
    setLayerOptions((prev) => ({ ...prev, [id]: next }));
  }, []);

  const legendEntries = useMemo(() => {
    const out = [];
    for (const l of layers) {
      if (!activeIds.has(l.id) || !l.getLegend) continue;
      const opts = layerOptions[l.id];
      out.push(...(l.getLegend(opts) || []));
    }
    return out;
  }, [layers, activeIds, layerOptions]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={elRef}
        style={{
          height,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--c-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      />
      {map &&
        layers.map((l) => (
          <LayerInstance
            key={l.id}
            map={map}
            layer={l}
            active={activeIds.has(l.id)}
            options={layerOptions[l.id]}
          />
        ))}
      <LayerPanel
        layers={layers}
        activeIds={activeIds}
        onToggle={onToggle}
        layerOptions={layerOptions}
        onOptionsChange={onOptionsChange}
      />
      <Legend entries={legendEntries} />
    </div>
  );
}
