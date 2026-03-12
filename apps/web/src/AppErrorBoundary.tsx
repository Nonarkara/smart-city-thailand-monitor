import React from "react";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

const showDetails = import.meta.env.DEV;

export default class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error) {
    console.error("Dashboard boot failed", error);
  }

  override render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f7f6f2"
        }}
      >
        <div
          className="card"
          style={{
            width: "min(640px, 100%)",
            padding: "24px",
            display: "grid",
            gap: "12px"
          }}
        >
          <span className="eyebrow">Dashboard Boot Error</span>
          <strong>The dashboard could not finish loading.</strong>
          <p>Refresh the page or check the API connection before the demo.</p>
          {showDetails ? <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{this.state.error.message}</pre> : null}
        </div>
      </div>
    );
  }
}
