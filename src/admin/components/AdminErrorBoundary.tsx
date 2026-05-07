import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';

type Props = { children: ReactNode };
type State = { error: Error | null; info: ErrorInfo | null };

export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    if (typeof console !== 'undefined') {
      console.error('Admin error boundary caught:', error, info);
    }
  }

  reset = () => {
    this.setState({ error: null, info: null });
  };

  reload = () => {
    window.location.reload();
  };

  goHome = () => {
    window.location.href = '/admin';
  };

  copy = async () => {
    const text = `${this.state.error?.name}: ${this.state.error?.message}\n\n${this.state.error?.stack || ''}\n\nComponent stack:${this.state.info?.componentStack || ''}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full card rounded-2xl p-6 sm:p-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-300" />
          </div>
          <h1 className="text-white font-semibold text-xl mb-2">Что-то пошло не так</h1>
          <p className="text-body text-sm mb-4 leading-relaxed">
            Произошла непредвиденная ошибка в админ-панели. Попробуйте обновить страницу или вернуться на дашборд.
          </p>
          <div className="rounded-xl bg-dark-900/60 border border-white/5 p-3 mb-5 text-xs font-mono text-faint overflow-x-auto max-h-48">
            <div className="text-red-300">{this.state.error.name}: {this.state.error.message}</div>
            {this.state.error.stack && (
              <pre className="mt-2 whitespace-pre-wrap break-all">{this.state.error.stack.split('\n').slice(0, 6).join('\n')}</pre>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={this.reload} className="btn-primary flex-1 justify-center text-sm py-2.5">
              <RefreshCw className="w-4 h-4" /> Перезагрузить
            </button>
            <button onClick={this.goHome} className="btn-secondary flex-1 justify-center text-sm py-2.5">
              <Home className="w-4 h-4" /> На дашборд
            </button>
            <button onClick={this.copy} className="btn-ghost text-sm" title="Скопировать ошибку">
              <Copy className="w-4 h-4" /> Скопировать
            </button>
          </div>
        </div>
      </div>
    );
  }
}
