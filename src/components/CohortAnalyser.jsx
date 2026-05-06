import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  analyseCohort,
  generateSummary,
  loadSavedCohorts,
  persistCohorts,
  extractPostcodes,
} from "../utils/cohort";
import { EmptyState } from "./Shared";
import CohortCompare from "./CohortCompare";
import CohortInput from "./CohortInput";
import CohortResults from "./CohortResults";
import CohortExport from "./CohortExport";
import CohortSaved from "./CohortSaved";
import { useToast } from "./Toast";
import { isCohortHash, decodeCohort, buildShareUrl } from "../utils/cohortUrl";

export default function CohortAnalyser() {
  const toast = useToast();
  const [raw, setRaw] = useState("");
  const [results, setResults] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [savedCohorts, setSavedCohorts] = useState(loadSavedCohorts);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const resultsRef = useRef(null);
  const saveInputRef = useRef(null);

  useEffect(() => {
    if (showSaveDialog && saveInputRef.current) saveInputRef.current.focus();
  }, [showSaveDialog]);

  // Auto-load cohort from share URL on mount
  const urlLoadRef = useRef(false);
  useEffect(() => {
    const hash = window.location.hash;
    if (isCohortHash(hash)) {
      const postcodes = decodeCohort(hash);
      if (postcodes.length > 0) {
        const text = postcodes.join("\n");
        setRaw(text);
        urlLoadRef.current = true;
        // Clear the cohort-specific hash, keep on cohort tab
        window.history.replaceState(null, "", "#cohort");
      }
    }
  }, []);

  const [storageWarning, setStorageWarning] = useState("");

  const analyse = useCallback(() => {
    setResults(analyseCohort(raw));
  }, [raw]);

  // Auto-analyse when loaded from URL
  useEffect(() => {
    if (urlLoadRef.current && raw) {
      urlLoadRef.current = false;
      // Trigger analysis in next tick after raw state is set
      const timer = setTimeout(() => analyse(), 0);
      return () => clearTimeout(timer);
    }
  }, [raw, analyse]);

  const saveCohort = useCallback(
    (name) => {
      if (!results || results.empty || !name.trim()) return;
      const cohort = {
        id: Date.now(),
        name: name.trim(),
        savedAt: new Date().toISOString(),
        raw,
        results,
      };
      const updated = [cohort, ...savedCohorts];
      const ok = persistCohorts(updated);
      if (!ok) {
        setStorageWarning(
          "Browser storage is nearly full. Delete old cohorts to free space.",
        );
        toast("Storage full — cohort not saved", { type: "warning" });
        return;
      }
      setSavedCohorts(updated);
      setShowSaveDialog(false);
      setSaveName("");
      setStorageWarning("");
      toast(`Cohort "${name.trim()}" saved`);
    },
    [results, raw, savedCohorts],
  );

  const deleteCohort = useCallback(
    (id) => {
      const updated = savedCohorts.filter((c) => c.id !== id);
      setSavedCohorts(updated);
      persistCohorts(updated);
      setConfirmDelete(null);
      toast("Cohort deleted");
    },
    [savedCohorts, toast],
  );

  const loadCohort = useCallback((cohort) => {
    setRaw(cohort.raw);
    setResults(cohort.results);
    setShowSaved(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!results || results.empty) return;
    const text = generateSummary(results);
    try {
      await navigator.clipboard.writeText(text);
      toast("Summary copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("Summary copied to clipboard");
    }
  }, [results, toast]);

  const handleShare = useCallback(async () => {
    if (!results || results.empty) return;
    const unique = extractPostcodes(raw);
    const url = buildShareUrl(unique);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast("Share link copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("Share link copied to clipboard");
    }
  }, [results, raw, toast]);

  const handleExportPNG = useCallback(async () => {
    if (!resultsRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(resultsRef.current, {
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue("--c-bg")
          .trim(),
        pixelRatio: 2,
        style: { padding: "24px" },
      });
      const link = document.createElement("a");
      link.download = `cohort-analysis-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      toast("PNG exported");
    } catch (err) {
      console.error("Export failed:", err);
      toast("Export failed — try again", { type: "error" });
    }
    setExporting(false);
  }, [exporting]);

  // Drag and drop CSV handling
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === "string") {
        setRaw(text);
      }
    };
    reader.readAsText(file);
  }

  function handleClear() {
    setRaw("");
    setResults(null);
  }

  const r = results;

  return (
    <div>
      {/* Intro */}
      <div
        style={{
          fontSize: 14,
          color: "var(--c-text2)",
          marginBottom: 14,
          lineHeight: 1.6,
        }}
      >
        Paste postcodes from an event list, service contacts, or distribution
        data. One per line, comma-separated, or space-separated — the tool will
        extract them automatically.
      </div>

      {/* Saved cohorts toggle + panel */}
      <CohortSaved
        savedCohorts={savedCohorts}
        showSaved={showSaved}
        onToggleSaved={() => {
          setShowSaved(!showSaved);
          setCompareMode(false);
          setCompareA(null);
          setCompareB(null);
        }}
        compareMode={compareMode}
        onToggleCompare={() => {
          const entering = !compareMode;
          setCompareMode(entering);
          setCompareA(null);
          setCompareB(null);
          if (entering) setShowSaved(true);
        }}
        compareA={compareA}
        compareB={compareB}
        onSelectCompare={(c) => {
          if (!compareA) setCompareA(c);
          else if (!compareB) setCompareB(c);
        }}
        onDeselectCompare={(slot) => {
          if (slot === "A") setCompareA(null);
          else setCompareB(null);
        }}
        onLoadCohort={loadCohort}
        confirmDelete={confirmDelete}
        onConfirmDelete={setConfirmDelete}
        onDeleteCohort={deleteCohort}
        onCancelDelete={() => setConfirmDelete(null)}
        onCompareNow={() => setShowSaved(false)}
      />

      {/* Input area */}
      <CohortInput
        raw={raw}
        onRawChange={setRaw}
        onAnalyse={analyse}
        onClear={handleClear}
        dragOver={dragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        results={r}
      />

      {/* Empty result */}
      <AnimatePresence mode="wait">
        {r && r.empty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
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
                  <path d="M9 9l6 6M15 9l-6 6" />
                </svg>
              }
              title="No valid postcodes found"
              description="Check your input — postcodes should be 3 or 4 digit numbers. Try pasting a list or entering them separated by commas, spaces, or newlines."
            />
          </motion.div>
        )}

        {/* Results */}
        {r && !r.empty && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CohortResults
              results={r}
              resultsRef={resultsRef}
              onCopy={handleCopy}
            />

            <CohortExport
              showSaveDialog={showSaveDialog}
              onShowSaveDialog={() => setShowSaveDialog(true)}
              storageWarning={storageWarning}
              saveName={saveName}
              onSaveNameChange={setSaveName}
              onSaveCohort={saveCohort}
              onCancelSave={() => {
                setShowSaveDialog(false);
                setSaveName("");
              }}
              saveInputRef={saveInputRef}
              exporting={exporting}
              onExportPNG={handleExportPNG}
              onPrint={() => window.print()}
              onShare={handleShare}
            />
          </motion.div>
        )}

        {/* Default empty state */}
        {!r && (
          <motion.div
            key="default-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
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
                  strokeLinejoin="round"
                >
                  <path d="M5 8.5C5 7 6 6 8 6s3 1 3 2.5" />
                  <circle cx="8" cy="3.5" r="2" />
                  <path d="M14 11.5C14 10 15 9 17 9s3 1 3 2.5" />
                  <circle cx="17" cy="6.5" r="2" />
                  <rect x="1" y="16" width="22" height="5" rx="2" />
                </svg>
              }
              title="Paste postcodes to get started"
              description="Drop in a list from a festival event, service contacts, or program data. You'll get a full cohort profile ready for reports."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison view */}
      {compareMode && compareA && compareB && !showSaved && (
        <CohortCompare
          cohortA={compareA}
          cohortB={compareB}
          onClose={() => {
            setCompareMode(false);
            setCompareA(null);
            setCompareB(null);
          }}
        />
      )}
    </div>
  );
}
