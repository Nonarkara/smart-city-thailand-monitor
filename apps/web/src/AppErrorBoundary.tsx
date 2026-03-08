import React from "react";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

const showErrorDetails =
  import.meta.env.DEV ||
  (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname));

export default class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard render failed", error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background: "#f5f2ea",
          color: "#1f2937",
          fontFamily: "\"IBM Plex Sans\", sans-serif"
        }}
      >
        <div
          style={{
            width: "min(560px, 100%)",
            display: "grid",
            gap: "12px",
            padding: "24px",
            border: "1px solid rgba(31, 41, 55, 0.14)",
            background: "rgba(255, 255, 255, 0.92)",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)"
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Dashboard Error
          </span>
          <h1 style={{ margin: 0, fontSize: "28px", lineHeight: 1.1 }}>
            The dashboard failed to load.
          </h1>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.5 }}>
            A runtime error interrupted rendering. Reload after fixing the data or API configuration.
          </p>
          {showErrorDetails ? (
            <pre
              style={{
                margin: 0,
                padding: "12px",
                overflowX: "auto",
                background: "#111827",
                color: "#f9fafb",
                fontSize: "12px",
                lineHeight: 1.5
              }}
            >
              {this.state.error.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              width: "fit-content",
              padding: "10px 14px",
              border: 0,
              background: "#0f766e",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Reload dashboard
          </button>
        </div>
      </div>
    );
  }
}
