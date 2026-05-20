import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      return;
    }
    this.setState((prev) => ({ 
      hasError: false, 
      error: null, 
      retryCount: prev.retryCount + 1 
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isLazyError = this.state.error?.message?.includes("chunk") || 
                          this.state.error?.message?.includes("loading");

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400 animate-pulse">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {isLazyError ? "Cargando contenido..." : "Algo salió mal"}
            </h2>
            <p className="max-w-sm text-sm text-slate-400">
              {isLazyError 
                ? "Intentando cargar la página de nuevo" 
                : this.state.error?.message || "Ha ocurrido un error inesperado"}
            </p>
          </div>
          {this.state.retryCount < 3 && (
            <button
              onClick={this.handleRetry}
              className="pl-btn-primary text-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Reintentar ({3 - this.state.retryCount} restantes)
            </button>
          )}
          {this.state.retryCount >= 3 && (
            <p className="text-xs text-slate-500">Por favor recarga la página</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}