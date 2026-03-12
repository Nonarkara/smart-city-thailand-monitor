import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Dashboard crash captured by error boundary.", error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="app-error-shell">
        <section className="app-error-card">
          <span className="eyebrow">Recovery Mode</span>
          <h1>Dashboard recovered from an unexpected error.</h1>
          <p>
            We caught the crash before it blanked the page. Reload to retry the current view or reset back to the base
            dashboard.
          </p>
          <div className="app-error-actions">
            <button type="button" className="share-button" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button type="button" className="chip" onClick={() => window.location.assign("/")}>
              Reset view
            </button>
          </div>
          <pre className="app-error-detail">{this.state.error.message}</pre>
        </section>
      </div>
    );
  }
}
