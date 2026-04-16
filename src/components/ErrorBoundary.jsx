import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--c-border2)",
            background: "var(--c-bg2)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--c-equity-flag-bg)",
              border: "1px solid var(--c-equity-flag-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "var(--c-equity-flag)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="9" />
              <path d="M11 7v5" />
              <circle cx="11" cy="15" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--c-text2)",
              marginBottom: 6,
            }}
          >
            Something went wrong
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--c-text3)",
              maxWidth: 360,
              margin: "0 auto 16px",
              lineHeight: 1.5,
            }}
          >
            This section encountered an error. Your data is safe — try
            refreshing or switching tabs.
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "9px 20px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--c-border)",
              background: "var(--c-surface)",
              color: "var(--c-accent)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
