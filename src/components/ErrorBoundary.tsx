import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    try {
      // Clear potentially corrupted auth/cache state
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") || k.startsWith("supabase"))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error("[ErrorBoundary] cleanup failed", e);
    }
    window.location.replace("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-foreground">Yon erè rive</h1>
            <p className="text-sm text-muted-foreground break-words">
              {this.state.error?.message || "Erè enkoni. Tanpri eseye ankò."}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full rounded-xl gradient-brand text-primary-foreground py-3 font-bold shadow-lg"
            >
              Rechaje paj la
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
