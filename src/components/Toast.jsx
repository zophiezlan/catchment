import {
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const toast = useCallback(
    (message, { type = "success", duration = 2500 } = {}) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
      }, duration);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => dismiss(t.id)}
              style={{
                pointerEvents: "auto",
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                background:
                  t.type === "error"
                    ? "#fef2f2"
                    : t.type === "warning"
                      ? "#fef3c7"
                      : "var(--c-accent-light)",
                border: `1px solid ${
                  t.type === "error"
                    ? "#fecaca"
                    : t.type === "warning"
                      ? "#fde68a"
                      : "rgba(5, 150, 105, 0.2)"
                }`,
                color:
                  t.type === "error"
                    ? "#991b1b"
                    : t.type === "warning"
                      ? "#92400e"
                      : "var(--c-accent)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                boxShadow: "var(--shadow-md)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                maxWidth: 320,
              }}
            >
              {t.type === "success" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <polyline points="3.5 8 6.5 11 12.5 5" />
                </svg>
              )}
              {t.type === "error" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
                </svg>
              )}
              {t.type === "warning" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M8 2L14 13H2L8 2Z" />
                </svg>
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
