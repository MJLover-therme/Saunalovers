import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render/effect errors anywhere below it and shows a recoverable
 * fallback instead of a blank white page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('App error boundary caught:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-base-900 p-6 text-center">
          <div className="text-4xl">🧖</div>
          <div>
            <p className="text-lg font-semibold text-white">Etwas ist schiefgelaufen</p>
            <p className="mt-1 max-w-md text-sm text-slate-400">
              Ein unerwarteter Fehler ist aufgetreten. Lade die Seite neu, um
              fortzufahren.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-base-900"
          >
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
