import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PersistenceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Persistence system error (continuing without persistence):', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render children without persistence provider if there's an error
      console.warn('Persistence disabled due to error, app continuing without data persistence');
      return this.props.children;
    }

    return this.props.children;
  }
}