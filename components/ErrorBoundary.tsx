'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 text-white">
          <div className="text-center space-y-6 max-w-md">
            <h2 className="text-3x font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Something went wrong
            </h2>
            <p className="text-gray-400">
              The dashboard encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <Button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8"
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;