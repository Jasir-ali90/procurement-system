import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Unhandled Application Error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="card" style={{
                        maxWidth: '560px',
                        width: '100%',
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px solid var(--plum-300)',
                        boxShadow: 'var(--shadow-xl)',
                        background: '#FFFFFF'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: '#FFF1EB',
                            border: '1px solid #FFD6C9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FF7E5F',
                            margin: '0 auto 1.25rem'
                        }}>
                            <AlertTriangle size={28} />
                        </div>

                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--plum-950)', marginBottom: '0.5rem' }}>
                            Component Render Safeguard
                        </h2>

                        <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', marginBottom: '1.25rem' }}>
                            An unexpected interface exception occurred in this module. The application safeguarded the workspace to prevent data loss.
                        </p>

                        {this.state.error && (
                            <div style={{
                                padding: '0.85rem',
                                background: 'var(--plum-50)',
                                border: '1px solid var(--plum-200)',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                color: 'var(--plum-950)',
                                textAlign: 'left',
                                fontFamily: 'monospace',
                                marginBottom: '1.5rem',
                                wordBreak: 'break-word',
                                maxHeight: '120px',
                                overflowY: 'auto'
                            }}>
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                            <button
                                onClick={this.handleReload}
                                className="btn btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                            >
                                <RefreshCw size={15} />
                                Refresh Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    background: 'linear-gradient(135deg, var(--plum-800), var(--peach-600))'
                                }}
                            >
                                <Home size={15} />
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
