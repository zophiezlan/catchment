import { motion } from "framer-motion";
import { Card } from "./Shared";

const SECTIONS = [
  {
    title: "Lookup",
    text: "Search by postcode number or suburb name. You'll see the shipping zone, Modified Monash classification, remoteness area, Primary Health Network, and equity indicators (IRSD disadvantage decile, Indigenous population %).",
  },
  {
    title: "Cohort Analyser",
    text: "Paste a list of postcodes from an event, service contacts, or distribution data. The tool extracts postcodes automatically and produces a full cohort profile — zone breakdown, PHN spread, IRSD distribution, and a copyable summary for reports. Save cohorts to compare them over time.",
  },
  {
    title: "Explorer",
    text: "Browse and filter all 2,957 postcodes by state, zone, remoteness area, PHN, and IRSD range. Click column headers to sort. Export filtered results as CSV.",
  },
  {
    title: "NSW LHDs",
    text: "View Local Health District profiles for NSW, including postcode count, population, Indigenous population, and IRSD disadvantage breakdown per district.",
  },
  {
    title: "Key terms",
    items: [
      ["MMM", "Modified Monash Model (1=Metro to 7=Very remote)"],
      ["RA", "Remoteness Area (ABS classification, 1–5)"],
      ["PHN", "Primary Health Network — regional health planning body"],
      ["IRSD", "Index of Relative Socio-economic Disadvantage (decile 1=most, 10=least)"],
      ["ERP", "Estimated Resident Population (ABS Census 2021)"],
    ],
  },
  {
    title: "Tips",
    text: "Use the URL hash (e.g. #lookup, #cohort) to link directly to a tab. Cohorts are saved in your browser — they won't sync between devices. Export as PNG or print to share analysis.",
  },
];

export default function HelpPanel({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--c-text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="var(--c-accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="9" cy="9" r="7" />
              <path d="M7 7a2 2 0 113 1.7c-.5.4-1 .8-1 1.8" />
              <circle cx="9" cy="13.5" r="0.5" fill="var(--c-accent)" />
            </svg>
            Quick guide
          </div>
          <button
            onClick={onClose}
            aria-label="Close help"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-xs)",
              border: "1px solid var(--c-border)",
              background: "var(--c-surface)",
              color: "var(--c-text3)",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
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
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
            Close
          </button>
        </div>

        {SECTIONS.map((s, i) => (
          <div
            key={i}
            style={{
              marginBottom: i < SECTIONS.length - 1 ? 16 : 0,
              paddingBottom: i < SECTIONS.length - 1 ? 16 : 0,
              borderBottom:
                i < SECTIONS.length - 1
                  ? "1px solid var(--c-border)"
                  : "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--c-accent)",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {s.title}
            </div>
            {s.text && (
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--c-text2)",
                  margin: 0,
                }}
              >
                {s.text}
              </p>
            )}
            {s.items && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {s.items.map(([term, def]) => (
                  <div
                    key={term}
                    style={{ fontSize: 13, lineHeight: 1.5 }}
                  >
                    <strong
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--c-text)",
                        fontWeight: 700,
                      }}
                    >
                      {term}
                    </strong>{" "}
                    <span style={{ color: "var(--c-text3)" }}>—</span>{" "}
                    <span style={{ color: "var(--c-text2)" }}>{def}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    </motion.div>
  );
}
