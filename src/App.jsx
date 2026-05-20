import {
  useState,
  useCallback,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import HelpPanel from "./components/HelpPanel";

// Lazy-load tab components for code splitting
const Overview = lazy(() => import("./components/Overview"));
const Lookup = lazy(() => import("./components/Lookup"));
const CohortAnalyser = lazy(() => import("./components/CohortAnalyser"));
const Explorer = lazy(() => import("./components/Explorer"));
const LHDView = lazy(() => import("./components/LHDView"));
const NSPView = lazy(() => import("./components/NSPView"));

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: "lookup",
    label: "Lookup",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="7" cy="7" r="4.5" />
        <line x1="10.2" y1="10.2" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    id: "cohort",
    label: "Cohort Analyser",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 8.5C5 7 6 6 8 6s3 1 3 2.5" />
        <circle cx="8" cy="3.5" r="2" />
        <path d="M1.5 12C1.5 10.5 2.5 9.5 4 9.5" />
        <circle cx="4" cy="7" r="1.5" />
        <path d="M14.5 12C14.5 10.5 13.5 9.5 12 9.5" />
        <circle cx="12" cy="7" r="1.5" />
      </svg>
    ),
  },
  {
    id: "explorer",
    label: "Explorer",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <line x1="2" y1="4" x2="14" y2="4" />
        <line x1="2" y1="8" x2="14" y2="8" />
        <line x1="2" y1="12" x2="10" y2="12" />
      </svg>
    ),
  },
  {
    id: "lhd",
    label: "NSW LHDs",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <line x1="2" y1="6" x2="14" y2="6" />
        <line x1="6" y1="6" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "nsp",
    label: "NSP Outlets",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="6" r="2.5" />
        <path d="M8 8.5v5.5" />
        <path d="M3 6a5 5 0 0 1 10 0c0 3.5-5 7.5-5 7.5S3 9.5 3 6z" />
      </svg>
    ),
  },
];

const TAB_IDS = new Set(TABS.map((t) => t.id));

const TAB_COMPONENTS = {
  overview: Overview,
  lookup: Lookup,
  cohort: CohortAnalyser,
  explorer: Explorer,
  lhd: LHDView,
  nsp: NSPView,
};

const tabVariants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

function TabFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        color: "var(--c-text3)",
        fontSize: 13,
        gap: 8,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid var(--c-border2)",
          borderTopColor: "var(--c-accent)",
          animation: "spin 0.6s linear infinite",
        }}
      />
      Loading...
    </div>
  );
}

function getInitialTab() {
  const hash = window.location.hash.slice(1);
  // Support cohort share links: #cohort/2000,2010,...
  if (hash.startsWith("cohort/")) return "cohort";
  return TAB_IDS.has(hash) ? hash : "overview";
}

export default function App() {
  const [tab, setTab] = useState(getInitialTab);
  const [showHelp, setShowHelp] = useState(false);

  // Sync tab ↔ URL hash
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (TAB_IDS.has(hash)) setTab(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleTabChange = useCallback(
    (id) => {
      if (id !== tab) {
        setTab(id);
        window.history.replaceState(null, "", `#${id}`);
      }
    },
    [tab],
  );

  const tabRefs = useRef({});

  const handleTabKeyDown = useCallback(
    (e) => {
      const ids = TABS.map((t) => t.id);
      const idx = ids.indexOf(tab);
      let next = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (idx + 1) % ids.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (idx - 1 + ids.length) % ids.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        next = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        next = ids.length - 1;
      }
      if (next >= 0) {
        handleTabChange(ids[next]);
        tabRefs.current[ids[next]]?.focus();
      }
    },
    [tab, handleTabChange],
  );

  const TabContent = TAB_COMPONENTS[tab];

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "0 20px 80px",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "24px 0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo mark */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L2 6.5V11.5L9 16L16 11.5V6.5L9 2Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="9" cy="9" r="2" fill="white" />
            </svg>
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--c-text)",
                lineHeight: 1.2,
              }}
            >
              Catchment
            </h1>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--c-text3)",
                letterSpacing: "0.01em",
                lineHeight: 1.3,
              }}
            >
              Harm Reduction Service Planning
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setShowHelp((h) => !h)}
            aria-label="Help"
            title="Quick guide"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--c-border)",
              background: showHelp
                ? "var(--c-accent-light)"
                : "var(--c-surface)",
              color: showHelp ? "var(--c-accent)" : "var(--c-text3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M6.5 6.2a1.6 1.6 0 113 1.3c-.5.3-.9.7-.9 1.5" />
              <circle cx="8" cy="12" r="0.5" fill="currentColor" />
            </svg>
          </button>
          <div
            style={{
              fontSize: 11,
              color: "var(--c-text3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--c-accent)",
                boxShadow: "0 0 0 2px var(--c-accent-muted)",
                flexShrink: 0,
              }}
            />
            <span className="hide-mobile">2,957 postcodes loaded</span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav
        role="tablist"
        aria-label="Main sections"
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 28,
          borderBottom: "1px solid var(--c-border)",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => (tabRefs.current[t.id] = el)}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => handleTabChange(t.id)}
              onKeyDown={handleTabKeyDown}
              style={{
                padding: "10px 16px 12px",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                fontFamily: "var(--font-body)",
                color: active ? "var(--c-accent)" : "var(--c-text3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: `2px solid ${active ? "var(--c-accent)" : "transparent"}`,
                marginBottom: -1,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 7,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "var(--c-text2)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "var(--c-text3)";
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6, display: "flex" }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Help panel */}
      <AnimatePresence>
        {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      {/* Tab content with animation */}
      <main>
        <ErrorBoundary key={tab}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              id={`panel-${tab}`}
              role="tabpanel"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Suspense fallback={<TabFallback />}>
                <TabContent />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 48,
          paddingTop: 20,
          borderTop: "1px solid var(--c-border)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--c-text3)",
            lineHeight: 1.7,
          }}
        >
          AusPost PC001 (Feb 2026) · MMM 2023 · PHN 2017/POA 2021 · Census/SEIFA
          2021 · NSW LHD v2.3
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--c-text3)",
          }}
        >
          Built for Harm Reduction
        </div>
      </footer>
    </div>
  );
}
