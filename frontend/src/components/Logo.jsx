export default function Logo({ size = 36, variant = 'full', textColor = 'dark' }) {
    const isDark = textColor === 'dark';

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', userSelect: 'none' }}>
            {/* Ribbon Arrow 'e' Icon */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 200 200"
                fill="none"
                style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(255, 126, 95, 0.25))' }}
            >
                <defs>
                    <linearGradient id="logoRibbonGrad" x1="20" y1="180" x2="180" y2="20" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#461756" />
                        <stop offset="35%" stopColor="#6C1E7A" />
                        <stop offset="70%" stopColor="#D94E6B" />
                        <stop offset="100%" stopColor="#FF7E5F" />
                    </linearGradient>
                    <linearGradient id="logoArrowGrad" x1="120" y1="80" x2="185" y2="15" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FF6B4A" />
                        <stop offset="100%" stopColor="#FFA088" />
                    </linearGradient>
                </defs>

                {/* Ribbon Swirl Body */}
                <path
                    d="M 42 124 
                       C 26 104, 46 42, 94 36 
                       C 134 32, 138 74, 110 114 
                       C 82 152, 44 144, 56 116 
                       C 70 88, 108 96, 156 44"
                    stroke="url(#logoRibbonGrad)"
                    strokeWidth="22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Upward Arrow */}
                <path
                    d="M 138 28 L 180 22 L 174 64 Z"
                    fill="url(#logoArrowGrad)"
                />
            </svg>

            {/* Typography */}
            {variant === 'full' && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                    <div style={{
                        fontSize: size > 32 ? '1.25rem' : '1.1rem',
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                        color: isDark ? '#2C0E36' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'baseline'
                    }}>
                        <span style={{ color: '#FF7E5F', fontStyle: 'italic', marginRight: '1px' }}>e-</span>
                        <span>Procurement</span>
                    </div>
                    <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: isDark ? 'var(--text-muted)' : 'rgba(255, 239, 234, 0.75)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                    }}>
                        Vendor Management Suite
                    </span>
                </div>
            )}
        </div>
    );
}
