import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

interface Props {
  children: ReactNode;
  label: string;
}

interface State {
  error: Error | null;
}

/**
 * One error boundary per feature route, per the brief. Logs only the error
 * object and component stack — never route params or component props,
 * which is where patient data would end up if a future feature interpolated
 * it into a thrown error message.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.label}] render error`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-start gap-3 p-6">
          <div className="flex items-center gap-2 text-status-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <p className="font-medium">{this.props.label} hit a problem and couldn't load.</p>
          </div>
          <p className="max-w-prose text-sm text-ink-secondary">{this.state.error.message}</p>
          <Button variant="secondary" size="sm" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
