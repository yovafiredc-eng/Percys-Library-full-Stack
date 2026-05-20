import React, { ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Error boundary mejorado con retry logic.
 * Captura errores de React y muestra fallback UI.
 */
export class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-black text-red-400 mb-2">⚠️ Algo salió mal</h1>
              <p className="text-slate-400 mb-4">
                {this.state.error?.message || "Error desconocido"}
              </p>
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
